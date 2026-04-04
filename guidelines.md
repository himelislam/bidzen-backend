# Backend Agent Guide — Online Auction Platform
**Stack:** Node.js · Express.js · MongoDB Atlas · Mongoose · JWT · bcryptjs · node-cron · Joi**
**Architecture:** REST API · Layered MVC · Persistent Server on Render**

> This file is the single source of truth for all backend decisions. Every rule here is non-negotiable unless explicitly reconsidered and documented.

---

## 1. Absolute Architecture Rules

```
Request → Route → Validator (Joi) → Middleware (protect / restrictTo) → Controller → Service → Model → DB
```

- **Routes** — wire URL + HTTP method to middleware chain only. Zero logic.
- **Controllers** — handle `req`/`res`, call services, call `next(error)` on failure. No raw DB queries.
- **Services** — all business logic lives here. Reusable, testable, framework-agnostic.
- **Models** — Mongoose schemas, indexes, pre-save hooks. No logic beyond schema-level concerns.
- **Validators** — Joi schemas applied as middleware before the controller is reached.
- **Middleware** — JWT verification, role enforcement, global error handling only.

**Violations that must never happen:**
- Business logic inside a route file
- Raw `Model.find()` inside a controller (delegate to service)
- `res.json()` inside a catch block (always call `next(error)`)
- Trust of any client-sent `role`, `userId`, or `status` field

---

## 2. Folder Structure — Follow Exactly

```
bidzen-backend/
├── src/
│   ├── config/
│   │   └── db.js                    # MongoDB connection, error handling, logging
│   ├── models/
│   │   ├── User.js
│   │   ├── Auction.js
│   │   ├── Bid.js
│   │   └── Feedback.js
│   ├── middleware/
│   │   └── auth.js                  # protect + restrictTo only
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── auction.controller.js
│   │   ├── bid.controller.js
│   │   ├── feedback.controller.js
│   │   └── admin.controller.js
│   ├── services/
│   │   └── auctionService.js        # winner logic, flag logic, state transitions
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── auction.routes.js
│   │   ├── bid.routes.js
│   │   ├── feedback.routes.js
│   │   └── admin.routes.js
│   ├── validators/
│   │   ├── auction.validator.js
│   │   ├── bid.validator.js
│   │   └── feedback.validator.js
│   ├── jobs/
│   │   └── auctionTimer.js          # node-cron job, calls auctionService only
│   └── utils/
│       ├── errorHandler.js          # global Express error middleware
│       └── ApiError.js              # custom error class
├── .env                             # NEVER commit
├── .env.example                     # ALWAYS commit with empty values
├── .gitignore
├── server.js                        # entry point
└── package.json
```

Do not create files outside this structure without a documented reason.

---

## 3. Environment Variables

**Backend `.env` (Render):**
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/auction-db
JWT_SECRET=your_strong_random_secret_here
NODE_ENV=production
```

**Rules:**
- `.env` is in `.gitignore` from commit #1 — never relax this
- `.env.example` is committed with identical keys and empty values
- `JWT_SECRET` must be a long random string — never a dictionary word
- All config is read from `process.env` — never hardcoded in source

---

## 4. Mongoose Models — Complete Specifications

### User
```js
{
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, minlength: 6 },  // bcrypt hashed
  role:      { type: String, enum: ['buyer', 'seller', 'admin'], required: true },
  isActive:  { type: Boolean, default: true },
},
{ timestamps: true }

indexes: { email: 1 }
```

**Pre-save hook — mandatory:**
```js
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
```

Never hash password anywhere other than this hook.

---

### Auction
```js
{
  seller:            { type: ObjectId, ref: 'User', required: true },
  title:             { type: String, required: true, trim: true },
  description:       { type: String, required: true },
  startingPrice:     { type: Number, required: true, min: 0 },
  currentHighestBid: { type: Number, default: 0 },
  winner:            { type: ObjectId, ref: 'User', default: null },
  status:            { type: String, enum: ['scheduled', 'active', 'closed'], default: 'scheduled' },
  startTime:         { type: Date, required: true },   // always UTC
  endTime:           { type: Date, required: true },   // always UTC
  flaggedForReview:  { type: Boolean, default: false },
},
{ timestamps: true }

indexes:
  { seller: 1 }
  { status: 1, endTime: 1 }     // cron job uses this — must exist
```

---

### Bid
```js
{
  auction:  { type: ObjectId, ref: 'Auction', required: true },
  bidder:   { type: ObjectId, ref: 'User', required: true },
  amount:   { type: Number, required: true, min: 0 },
},
{ timestamps: true }

indexes:
  { auction: 1, amount: -1 }        // bid history sorted by amount
  { auction: 1, createdAt: -1 }     // bid history sorted by time
```

---

### Feedback
```js
{
  auction:    { type: ObjectId, ref: 'Auction', required: true },
  author:     { type: ObjectId, ref: 'User', required: true },
  recipient:  { type: ObjectId, ref: 'User', required: true },
  rating:     { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String, required: true, minlength: 10, maxlength: 500 },
},
{ timestamps: true }

indexes:
  { auction: 1, author: 1 }   UNIQUE    // enforces one review per user per auction at DB level
```

The compound unique index on Feedback is the single most important data-integrity constraint in the system. Never remove it.

---

## 5. Authentication — Rules and Implementation

### Registration — `POST /api/auth/register`
1. Validate all input with Joi before touching the DB
2. Check for duplicate email — return `409 Conflict` if found
3. Create User document — password hashed by pre-save hook automatically
4. Sign and return JWT immediately after registration
5. Never return `password` field in any response — use `.select('-password')` on all User queries

### Login — `POST /api/auth/login`
1. Find user by email — `.select('+password')` to include hashed password
2. Use `bcrypt.compare(inputPassword, user.password)` — never compare plain text
3. Check `user.isActive === true` — return `403` if deactivated
4. Sign and return JWT

### JWT Signing
```js
jwt.sign(
  { id: user._id, role: user.role },   // payload — nothing else
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
)
```

Payload contains only `id` and `role`. No name, email, or sensitive data in the token.

---

## 6. Middleware — Exact Implementation Rules

### `protect` middleware
```
1. Extract token from Authorization header: Bearer <token>
2. If no token → 401 Unauthorized
3. jwt.verify(token, JWT_SECRET) → decode payload
4. Find user by decoded.id — confirm they still exist and isActive === true
5. Attach full user object to req.user
6. Call next()
```

Never trust `req.body.userId` or `req.body.role` — always use `req.user` set by this middleware.

### `restrictTo(...roles)` middleware
```js
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError('You do not have permission to perform this action', 403));
  }
  next();
};
```

Apply `protect` first, then `restrictTo`. Never apply `restrictTo` without `protect` preceding it.

---

## 7. Validation — Joi Rules

- Every `POST` and `PATCH` route has a Joi validator applied as middleware before the controller
- Validators live in `src/validators/` — never inline in routes or controllers
- On validation failure → return `400 Bad Request` with the Joi error message

**Auction listing validator (required fields):**
```
title       → string, required, min 3 chars
description → string, required, min 10 chars
startingPrice → number, required, positive
startTime   → date, required, must be in the future (compared server-side, not client-side)
endTime     → date, required, must be strictly after startTime
```

**Bid validator:**
```
amount → number, required, positive
```
(Additional business validation — auction status, time window, bid amount exceeding current highest — happens in the controller/service, not just in Joi)

**Feedback validator:**
```
rating     → number, required, integer, min 1, max 5
reviewText → string, required, min 10 chars, max 500 chars
```

---

## 8. Bidding Engine — Atomic Operations (Non-Negotiable)

This is the most critical section of the backend. Concurrent bid placement must be handled atomically.

**The atomic update pattern — use this exactly:**
```js
const updatedAuction = await Auction.findOneAndUpdate(
  {
    _id: auctionId,
    status: 'active',
    startTime: { $lte: now },
    endTime:   { $gte: now },
    currentHighestBid: { $lt: bidAmount },   // ← conditional filter is the race guard
  },
  { $set: { currentHighestBid: bidAmount } },
  { new: true }
);

if (!updatedAuction) {
  // Either auction not found, not active, time expired, or bid not high enough
  // Return 400 with descriptive message
}

// Only create Bid document after successful atomic update
await Bid.create({ auction: auctionId, bidder: req.user._id, amount: bidAmount });
```

**Why this works:** MongoDB's document-level locking means only one `findOneAndUpdate` with the conditional filter can succeed when two identical bids arrive simultaneously. The second one finds no matching document (because `currentHighestBid` was already updated) and returns null.

**Also validate at the controller level before the atomic call:**
1. Auction exists
2. `status === 'active'`
3. Current server time is within `startTime` and `endTime`
4. `bidAmount > auction.currentHighestBid` (pre-check, atomic update is the real guard)
5. `req.user.role === 'buyer'`
6. `req.user._id !== auction.seller` (buyers cannot be sellers on the same listing — check if needed)

---

## 9. Auction State Machine

Auctions move through exactly three states:

```
scheduled  →  active  →  closed
```

No state can be skipped. No state can go backwards.

**State transition rules:**
- `scheduled → active`: when `now >= auction.startTime` (triggered by cron)
- `active → closed`: when `now >= auction.endTime` (triggered by cron)
- Sellers can only edit/delete listings while `status === 'scheduled'`

**Protect state transitions in all controller logic:**
```js
// Before allowing edit or delete:
if (auction.status !== 'scheduled') {
  throw new ApiError('Cannot modify an auction that has already started or closed', 400);
}
```

---

## 10. Cron Job — `src/jobs/auctionTimer.js`

**Runs every minute. Two tasks only:**

```js
// Task 1: scheduled → active
await Auction.updateMany(
  { status: 'scheduled', startTime: { $lte: now } },
  { $set: { status: 'active' } }
);

// Task 2: active → closed + winner determination
const expiredAuctions = await Auction.find(
  { status: 'active', endTime: { $lte: now } },
  '_id startingPrice'    // .lean() — fetch minimum fields
).lean();

for (const auction of expiredAuctions) {
  await auctionService.closeAuction(auction._id, auction.startingPrice);
}
```

**Rules:**
- Cron job only transitions states and calls `auctionService.closeAuction()`
- No complex logic inside the cron job itself
- Register cron job in `server.js` after DB connects — not before
- Schedule: `'* * * * *'` (every minute)

---

## 11. Winner Determination — `src/services/auctionService.js`

```js
async function closeAuction(auctionId, startingPrice) {
  // Find the highest bid for this auction
  const winningBid = await Bid.findOne({ auction: auctionId })
    .sort({ amount: -1 })
    .lean();

  const updateData = { status: 'closed' };

  if (winningBid) {
    updateData.winner = winningBid.bidder;
    // Flag if winning bid is below 50% of starting price
    if (winningBid.amount < startingPrice * 0.5) {
      updateData.flaggedForReview = true;
    }
  }

  await Auction.findByIdAndUpdate(auctionId, updateData);
}
```

**Flagging rule:**
`winningBid.amount < startingPrice * 0.5` → set `flaggedForReview: true`

This check happens only in `auctionService.closeAuction()`. Do not duplicate it elsewhere.

---

## 12. Feedback System Rules

**Who can submit feedback:**
- The **winning buyer** (`auction.winner.toString() === req.user._id.toString()`)
- The **listing seller** (`auction.seller.toString() === req.user._id.toString()`)

**Pre-conditions (all must pass):**
1. Auction `status === 'closed'`
2. Requester is winner or seller of that specific auction
3. Rating is integer 1–5
4. Review text is 10–500 characters
5. No prior feedback from this author on this auction (enforced by DB unique index)

**Duplicate feedback handling:**
- The compound unique index `{ auction: 1, author: 1 }` will throw a MongoDB duplicate key error (`code 11000`)
- Catch this in the global error handler and return `409 Conflict` with a clear message
- Do not rely on an application-level check alone — the index is the real guard

---

## 13. Admin Routes

All admin routes are protected with `protect` + `restrictTo('admin')`.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/auctions?flagged=true` | List all flagged auctions |
| PATCH | `/api/admin/auctions/:id/resolve` | Clear flag (`flaggedForReview: false`) |
| GET | `/api/admin/users` | List all users |
| PATCH | `/api/admin/users/:id/deactivate` | Set `isActive: false` |

**Resolve flag logic:**
```js
await Auction.findByIdAndUpdate(id, { flaggedForReview: false });
```

**Deactivate user logic:**
```js
await User.findByIdAndUpdate(id, { isActive: false });
```

Deactivated users who try to log in must receive `403 Forbidden`. The `protect` middleware must check `isActive` on every authenticated request, not only at login.

---

## 14. Complete API Route Reference

### Public (no auth)
```
GET  /api/auctions                  List all active auctions
GET  /api/auctions/:id              Single auction details (populate seller)
GET  /api/auctions/:id/bids         Bid history (sorted by amount desc)
GET  /api/auctions/:id/feedback     Feedback for a closed auction
POST /api/auth/register             Register as buyer or seller
POST /api/auth/login                Login, receive JWT
```

### Buyer (protect + restrictTo('buyer'))
```
POST /api/auctions/:id/bids         Place a bid
POST /api/auctions/:id/feedback     Submit feedback after winning
```

### Seller (protect + restrictTo('seller'))
```
POST   /api/auctions                Create new listing
PATCH  /api/auctions/:id            Edit own listing (scheduled only)
DELETE /api/auctions/:id            Delete own listing (scheduled only)
POST   /api/auctions/:id/feedback   Submit feedback for winning buyer
```

### Admin (protect + restrictTo('admin'))
```
GET   /api/admin/auctions?flagged=true   View flagged auctions
PATCH /api/admin/auctions/:id/resolve    Resolve flag
GET   /api/admin/users                   List all users
PATCH /api/admin/users/:id/deactivate    Deactivate account
```

---

## 15. Error Handling — Global Pattern

### `ApiError` class — `src/utils/ApiError.js`
```js
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
```

### Global error handler — `src/utils/errorHandler.js`
```js
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // MongoDB duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    message = `Duplicate value for: ${Object.keys(err.keyValue).join(', ')}`;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid token'; }
  if (err.name === 'TokenExpiredError') { statusCode = 401; message = 'Token expired'; }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
```

Register as the **last** middleware in `server.js`.

### Controller pattern — always follow this:
```js
export const someController = async (req, res, next) => {
  try {
    const result = await someService.doSomething(req.params.id, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);   // always — never res.json() in catch
  }
};
```

---

## 16. Consistent API Response Shape

Every response must follow this structure:

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error (handled by errorHandler):**
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

**HTTP status codes:**
| Situation | Code |
|-----------|------|
| Success (read) | 200 |
| Success (created) | 201 |
| Bad input / business rule violation | 400 |
| No or invalid JWT | 401 |
| Valid JWT but wrong role | 403 |
| Resource not found | 404 |
| Duplicate unique field | 409 |
| Server error | 500 |

---

## 17. Ownership Checks (Critical)

Sellers must only be able to modify their own listings. Perform this check in the controller, not just in middleware:

```js
const auction = await Auction.findById(req.params.id);
if (!auction) throw new ApiError('Auction not found', 404);
if (auction.seller.toString() !== req.user._id.toString()) {
  throw new ApiError('You do not own this listing', 403);
}
```

Never skip this check. The `restrictTo('seller')` middleware only verifies the role — it does not verify ownership.

---

## 18. Time Handling Rules

- All times stored in MongoDB are UTC — Mongoose/MongoDB handles this automatically when you pass JS `Date` objects
- All server-side time comparisons use `new Date()` (UTC)
- Never use `Date.toLocaleDateString()` or any timezone-adjusted value in business logic
- When validating `startTime` in the auction creation validator, compare against `Date.now()` server-side — never trust a client timestamp
- The cron job uses `new Date()` for all comparisons — no timezone configuration needed

---

## 19. Query Performance Rules

- Use `.lean()` on all read queries where you do not need Mongoose document methods
- Use `.select('field1 field2')` to fetch only the fields you need
- Never return the full user document where only name and email are needed
- Paginate all list endpoints — never return all documents without a limit
- Default pagination: `page=1`, `limit=20`
- Check that every `find()`, `findOne()`, and `findOneAndUpdate()` call uses an indexed field

---

## 20. Mongoose `.populate()` Rules

- Populate only one level deep — never chain `.populate()` inside a `.populate()`
- On auction details (`GET /api/auctions/:id`): populate `seller` with `name email` only
- On bid history (`GET /api/auctions/:id/bids`): populate `bidder` with `name` only
- On feedback (`GET /api/auctions/:id/feedback`): populate `author` and `recipient` with `name` only
- Never populate passwords — always select only safe public fields

---

## 21. Build Order — Follow Phase by Phase

Do not start a phase until the previous one is fully working and tested in Postman.

| Phase | Goal | Weeks |
|-------|------|-------|
| 1 | Project setup, DB connection, all 4 models defined | 1–2 |
| 2 | Register, login, JWT, protect + restrictTo middleware | 3–4 |
| 3 | Auction listing CRUD with Joi validation | 5–6 |
| 4 | Bidding engine with atomic update | 7–8 |
| 5 | node-cron timer, winner determination, price flag | 9–10 |
| 6 | Feedback system with unique index enforcement | 11–12 |
| 7 | Admin routes, global error handler, API docs, deployment | 13–14 |

---

## 22. What the Agent Must Never Do

- Add WebSockets before Phase 7 is complete
- Put any business logic in a route file
- Use `res.json()` inside a `catch` block — always use `next(err)`
- Trust `req.body.role` or `req.body.userId` for authorization decisions
- Skip the atomic `findOneAndUpdate` pattern for bid placement
- Use local timezone in any date comparison
- Commit `.env`
- Call `Model.find()` directly inside a controller — delegate to a service
- Use `populate()` to return the password field
- Create a Bid document before the atomic auction update succeeds
- Apply `restrictTo` without `protect` preceding it on the same route
- Modify auction status directly from any route other than the cron job's service call
- Return all DB documents without pagination on list endpoints
- Store any file uploads in the Render or Vercel filesystem — use Cloudinary if images are added

---

## 23. Deployment Checklist (Render + Vercel)

**Before deploying:**
- All environment variables set on Render dashboard (not hardcoded)
- `NODE_ENV=production` set on Render
- MongoDB Atlas network access allows Render's IP (or `0.0.0.0/0` for simplicity)
- `.env` is not in the repository

**Render backend:**
- Start command: `node server.js`
- Render free tier spins down after inactivity — use UptimeRobot to ping the health route every 5 minutes during demo period
- Health route must exist: `GET /api/health` returns `200 { success: true, message: 'Server is running' }`
- Cron job starts only after successful MongoDB connection

**Vercel frontend:**
- `REACT_APP_API_URL` set to the live Render URL
- No backend code on Vercel — only static React SPA

---

## 24. Git Commit Conventions

```
feat: initialize project structure and MongoDB connection
feat: define all 4 Mongoose models with indexes
feat: add bcrypt pre-save hook to User model
feat: build register and login routes with JWT signing
feat: add protect and restrictTo middleware
feat: build auction listing CRUD with Joi validation
feat: build bid placement with atomic findOneAndUpdate
feat: add bid history route with sorting
feat: implement node-cron auction state transition job
feat: build winner determination and price flag logic
feat: build feedback routes with compound unique index
feat: build admin flagged auctions and user management routes
feat: wire global error handler with ApiError class
docs: add full Postman collection for all endpoints
chore: deploy backend to Render
fix: handle expired auction bid rejection with correct status code
```

One feature per commit. Do not batch phases together.

---

## 25. Phase 1 First Commands (Exact)

```bash
mkdir bidzen-backend && cd bidzen-backend
npm init -y
npm install express mongoose dotenv bcryptjs jsonwebtoken joi node-cron
npm install --save-dev nodemon eslint prettier
```

**`package.json` scripts:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

**`.gitignore` (create before first commit):**
```
node_modules/
.env
*.log
```

Commit `.env.example` and `.gitignore` as the very first commit before any other files.