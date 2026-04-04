Here's the complete `plan.md` with all 32 points, fully covering everything from your proposal PDF:

---

# Online Auction Platform — Full Plan

**Course:** CSE 300 — Project & Web Programming Lab
**Team:** Ishrakul Islam Efaz (232-112-017) · Muhaiminul Islam Himel (232-112-018)
**Supervisor:** Abu Jafar Md. Jakaria, Senior Lecturer, Department of CSE — Metropolitan University
**Submission Date:** 16/03/2026

---

## 1. Project Overview

**Project Name:** Online Auction Platform
**Goal:** Build a modern web-based auction system where sellers can list both new and pre-owned products for competitive bidding, and registered buyers can place incremental bids within a defined time window. The platform automatically manages the full auction lifecycle, determines winners, validates pricing fairness, and collects post-auction feedback from both parties.

Each auction will:
- Appear as a listing with title, description, starting price, and auction time window
- Accept bids only from registered buyers during the active window
- Track the current highest bid in real time with race condition protection
- Automatically close at the end time and record the highest bidder as the winner
- Flag auctions where the winning bid falls below 50% of the starting price for admin review
- Allow the winning buyer and the listing seller to rate and review each other after completion

This project addresses a real-world need for a trustworthy and scalable auction solution that can be adopted by individuals, small businesses, and resellers. The system is especially relevant in markets where dynamic pricing through competitive bidding can unlock fair value for both buyers and sellers.

This project will be submitted as a graded deliverable for CSE 300, so the implementation must be:
- Clean, well-structured, and layered
- Fully documented with Postman and Swagger/OpenAPI
- Deployable on Vercel (frontend) and Render (backend)
- Demonstrating real-world backend engineering: authentication, role-based access, atomic operations, scheduled jobs, and input validation

---

## 2. Core Product Vision

The Online Auction Platform is not just a bidding form. It should become:
- A real-world demonstration of RESTful API design with proper HTTP semantics
- A secure, role-enforced system where buyers and sellers operate in strictly separated access lanes
- A platform that handles concurrent real-world scenarios through atomic database operations
- An automated system where auction state transitions happen server-side without manual intervention
- A complete transaction lifecycle from listing creation through bidding to post-auction feedback
- A strong foundation for professional full-stack MERN development skills

The entire bidding lifecycle — from listing creation to winner announcement and feedback collection — is handled digitally within the platform. Two distinct user-facing portals exist: one for Sellers and one for Buyers, alongside an administrative backend for system oversight.

---

## 3. Technology Stack

We will use the **MERN stack** with a traditional persistent client-server architecture.

**Frontend:**
- React.js
- Tailwind CSS
- Axios or Fetch API

**Backend:**
- Node.js
- Express.js
- node-cron (for automatic auction state management)

**Database:**
- MongoDB Atlas
- Mongoose (ODM)

**Authentication:**
- JWT (JSON Web Tokens) — stateless session management
- bcryptjs — secure password hashing

**API Documentation:**
- Postman collection with sample requests and responses
- Swagger / OpenAPI interactive spec

**Deployment:**
- Vercel — frontend hosting
- Render — backend hosting (persistent Express server)

**Dev Tools:**
- ESLint + Prettier — code quality and formatting
- Nodemon — hot reload during development
- Git + GitHub — version control and collaboration

**Optional:**
- Docker — containerization for consistent dev/prod environments

**Why MERN:**
The MERN stack provides a unified JavaScript ecosystem across all layers, reducing context switching and accelerating development. MongoDB's schema flexibility accommodates the varied data structures of auction listings, bids, and reviews without requiring costly schema migrations. React's component model enables reusable UI elements such as bid cards, countdown timers, and listing forms. The combination of Express middleware and JWT ensures role enforcement and security concerns are handled cleanly and uniformly across all routes.

---

## 4. Important Architecture Decision

Because the backend requires a **persistent, always-running process** for the auction cron job that transitions auction states automatically, we cannot use Vercel serverless functions for the backend.

**Chosen approach:**
- React SPA on Vercel for the frontend
- Express.js server on Render for the backend
- MongoDB Atlas as the shared database

**Three-tier system architecture:**

```
Presentation Layer  →  React.js SPA
                        Renders UI for buyer portal, seller portal,
                        and admin dashboard. Communicates via REST API calls.

Application Layer   →  Node.js / Express.js API Server
                        Handles routing, business logic, JWT middleware,
                        role enforcement, and auction state transitions.

Data Layer          →  MongoDB Database
                        Persists users, auction listings, bids,
                        winners, feedback, and audit records.
```

All client requests pass through Express middleware for JWT verification and role validation before reaching the relevant controller. The auction state manager runs as a scheduled job using node-cron that periodically checks auction end times and transitions states accordingly.

**Why Render for the backend:**
Render's free tier supports persistent Node.js/Express servers, which are required for:
- Running node-cron jobs that automatically open and close auctions
- Maintaining consistent server-side time validation on every bid request
- Reliable connection pooling to MongoDB Atlas

**Why not serverless for the backend:**
Serverless functions are stateless and spin up per request. A cron job cannot run reliably inside a serverless function. The auction timer is a core feature and is non-negotiable.

---

## 5. Development Philosophy

This project demonstrates real-world engineering practices. Follow these rules throughout:

1. Build phase by phase — complete and test one phase fully before starting the next
2. Keep each phase focused on one clear backend concern with a visible, testable outcome
3. Do not over-engineer early — no WebSockets until the REST layer is solid
4. Ship a working, tested API before building the frontend
5. Use the layered folder structure from day one: routes → controllers → services → models
6. Add features only after the base flow works end-to-end
7. Prefer clear, readable code over clever one-liners — this is also a learning project
8. Keep backend and frontend responsibilities clearly separated
9. Validate all inputs server-side — never trust the client alone
10. Test every endpoint in Postman before moving to the next phase
11. Agree on API contracts (Swagger spec) before parallel development begins
12. Use GitHub pull requests with peer review for all merges

---

## 6. Primary User Roles

**1) Visitor (unauthenticated)**
Can:
- Browse active auction listings
- View auction details and current highest bid
- View bid history on a listing
- View seller profile information

Cannot:
- Place bids
- Create listings
- Access any protected routes

**2) Buyer**
Can:
- Register with a unique email address and select the Buyer role
- Log in and receive a signed JWT
- Browse all active auctions
- Place bids on active auctions (each bid must exceed the current highest bid and fall within the active time window)
- View their own bid history
- Leave one rating and one text review for the seller after winning a completed auction

**3) Seller**
Can:
- Register with a unique email address and select the Seller role
- Log in and receive a signed JWT
- Create auction listings with title, description, starting price, start time, and end time
- Edit or delete own listings (only while status is `scheduled`)
- View all bids placed on their own listings
- Leave one rating and one text review for the winning buyer after auction closes

**4) Admin**
Can:
- Log in with admin credentials
- View all flagged auctions (where winning bid fell below 50% of starting price)
- Resolve or dismiss flags after review
- Manage user accounts — view all users, deactivate accounts
- Oversee platform health and audit listings

**Optional — System Supervisor:**
Higher-level stakeholders who access an analytics dashboard to view platform performance metrics such as total auctions, average bid counts, and flagged listing statistics. This role is out of scope for MVP.

---

## 7. MVP Scope (Must Build First)

The first release must include only what is required for the graded submission.

**Public features:**
- Browse all active auction listings
- View single auction details with current highest bid and countdown
- View bid history on any listing
- View seller profile

**Buyer features:**
- Register and login
- Place a bid on an active auction
- Receive rejection with descriptive error when bid is invalid or auction is closed
- Leave feedback after winning

**Seller features:**
- Register and login
- Create auction listing with full input validation
- Edit and delete own listings before they go active
- Leave feedback for winning buyer

**Admin features:**
- Login as admin
- View flagged auctions queue
- Resolve or dismiss flags
- Deactivate user accounts

**Non-negotiable MVP data per auction:**
- Title
- Description
- Starting price
- Current highest bid
- Status — scheduled / active / closed
- Start time and end time (stored in UTC)
- Winner (recorded at close)
- Flagged for review (set when winning bid < 50% of starting price)

**Explicitly out of scope for MVP:**
- Real-world payment gateway or escrow integration
- Live shipping or logistics partner integration
- Mobile native applications (iOS / Android)
- Real-time WebSocket push notifications (basic polling used instead)
- Multi-currency or international tax calculation

---

## 8. Phase-wise Delivery Plan

**Phase 1 — Project Setup & Database (Weeks 1–2)**
Goal: working server, DB connection, all models defined.

Tasks:
- Initialize Node.js project and install all dependencies
- Configure `.env`, `.env.example`, and `.gitignore`
- Build `server.js` and `src/config/db.js` with error handling
- Define all 4 Mongoose models with correct fields, types, and indexes
- Create global error handler stub in `src/utils/errorHandler.js`
- Create all empty placeholder folders for future phases
- First Git commit pushed to GitHub

Deliverable: server starts, MongoDB connects, health route returns 200, all models load cleanly

---

**Phase 2 — Authentication & Role System (Weeks 3–4)**
Goal: secure register, login, and middleware that protects all future routes.

Tasks:
- Install bcryptjs and jsonwebtoken
- Add pre-save password hashing hook to User model
- Build `POST /api/auth/register` — validate input, hash password, sign JWT
- Build `POST /api/auth/login` — verify credentials, return signed JWT
- Write `protect` middleware — verifies JWT, attaches `req.user`
- Write `restrictTo(role)` middleware — checks role, returns 403 if mismatched
- Test all auth flows and role enforcement in Postman

Deliverable: register, login, and role-protected routes all working correctly

---

**Phase 3 — Auction Listing CRUD (Weeks 5–6)**
Goal: sellers can fully create and manage their auction listings.

Tasks:
- Build all auction routes, controllers, and Joi validators
- `POST /api/auctions` — seller only, creates listing with status `scheduled`
- `GET /api/auctions` — public, returns all active auctions
- `GET /api/auctions/:id` — public, single auction with seller info populated
- `PATCH /api/auctions/:id` — seller only, own listing only, only while `scheduled`
- `DELETE /api/auctions/:id` — seller only, own listing only
- Document all endpoints in Postman

Deliverable: sellers can create and manage listings, public can browse them

---

**Phase 4 — Bidding Engine (Weeks 7–8)**
Goal: buyers can place bids safely with race condition protection.

Tasks:
- Build `POST /api/auctions/:id/bids` — buyer only
- Validate: auction exists, status is `active`, bid amount strictly greater than `currentHighestBid`, request is within time window
- Reject bids submitted before `startTime` or after `endTime` with descriptive error
- Use atomic `findOneAndUpdate` with conditional filter to prevent race conditions
- Create Bid document after successful atomic update
- Build `GET /api/auctions/:id/bids` — public, bid history sorted by amount descending
- Test concurrent bid scenario in Postman

Deliverable: bidding works correctly, invalid bids are rejected, race conditions are handled

---

**Phase 5 — Timer, Winner & Price Validation (Weeks 9–10)**
Goal: auctions open and close automatically, winners are determined, low bids are flagged.

Tasks:
- Install node-cron
- Build `src/jobs/auctionTimer.js`:
  - Every minute: find `scheduled` auctions past `startTime` → transition to `active`
  - Every minute: find `active` auctions past `endTime` → transition to `closed` → trigger winner logic
- Build winner logic in `src/services/auctionService.js`:
  - Find Bid document with highest amount for the auction
  - Write winner's ID to `Auction.winner`
  - If `winningBid < startingPrice * 0.5` → set `Auction.flaggedForReview = true`
- Also validate auction time window on every individual bid request — do not rely solely on cron
- Register cron job in `server.js`

Deliverable: auctions automatically open and close, winner is correctly recorded, low bids are flagged

---

**Phase 6 — Feedback System (Weeks 11–12)**
Goal: buyers and sellers can each leave one review after the auction closes.

Tasks:
- Build `POST /api/auctions/:id/feedback` — buyer or seller only
- Validate: auction status is `closed`, requester is the winning buyer or listing seller
- Validate: rating is integer 1–5, review text is 10–500 characters
- Compound unique index on `{ auction, author }` enforces one-review-per-user-per-auction at DB level
- Build `GET /api/auctions/:id/feedback` — public, returns all feedback for a completed auction
- Test abuse scenario: second submission from same user receives duplicate key error

Deliverable: post-auction feedback works correctly with all abuse prevention in place

---

**Phase 7 — Admin Routes, Error Handling & API Docs (Weeks 13–14)**
Goal: admin moderation, clean error responses for all cases, and full API documentation.

Tasks:
- Build admin routes behind `restrictTo('admin')` middleware
- `GET /api/admin/auctions?flagged=true` — view all flagged auctions
- `PATCH /api/admin/auctions/:id/resolve` — clear a flag after admin review
- `GET /api/admin/users` — list all users
- `PATCH /api/admin/users/:id/deactivate` — set `isActive: false`
- Wire global `errorHandler.js` as the last middleware in `server.js`
- Wrap all controller logic in try/catch calling `next(error)`
- Create custom `ApiError` class with `statusCode` and `message`
- Write full Swagger/OpenAPI spec or complete Postman collection for every endpoint with sample request and response bodies
- Deploy backend to Render and confirm all routes work on the live URL
- Write README with setup instructions, environment variable reference, and API overview

Deliverable: admin dashboard works, all errors return clean JSON, full API documented, backend deployed

---

## 9. Optional / Advanced Features

These should only be added after the full MVP is working, tested, and submitted.

- Real-time bid updates via WebSocket (Socket.io) — push live bid updates to watching buyers without page refresh
- Email / SMS notifications — notify bidders when outbid and winner when auction closes
- Full bid history and audit trail — complete timestamped log of all bids on a listing
- Watchlist — buyers save listings and receive alerts when bidding starts
- Seller analytics dashboard — views, bid counts, and final sale performance per listing
- Image upload for auction listings via Cloudinary cloud storage
- Proxy bidding / auto-increment — buyer sets a maximum and system bids incrementally on their behalf
- Auction categories and tag-based filtering

---

## 10. Recommended Folder Structure

```
bidzen-backend/
├── src/
│   ├── config/
│   │   └── db.js                    # MongoDB connection with error handling
│   ├── models/
│   │   ├── User.js
│   │   ├── Auction.js
│   │   ├── Bid.js
│   │   └── Feedback.js
│   ├── middleware/
│   │   └── auth.js                  # protect + restrictTo middleware
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── auction.controller.js
│   │   ├── bid.controller.js
│   │   ├── feedback.controller.js
│   │   └── admin.controller.js
│   ├── services/
│   │   └── auctionService.js        # winner logic, price flag check
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
│   │   └── auctionTimer.js          # node-cron scheduled job
│   └── utils/
│       ├── errorHandler.js          # global error middleware
│       └── ApiError.js              # custom error class
├── .env                             # never commit
├── .env.example                     # commit this with empty values
├── .gitignore
├── server.js                        # app entry point
└── package.json
```

---

## 11. Core Data Models

**User**
```js
{
  name:      String, required, trim
  email:     String, required, unique, lowercase    // indexed
  password:  String, required, minlength 6          // bcrypt hashed via pre-save hook
  role:      enum ['buyer', 'seller', 'admin'], required
  isActive:  Boolean, default true
  timestamps: true

  indexes: { email: 1 }
}
```

**Auction**
```js
{
  seller:             ObjectId → User, required
  title:              String, required, trim
  description:        String, required
  startingPrice:      Number, required, min 0
  currentHighestBid:  Number, default 0
  winner:             ObjectId → User, default null
  status:             enum ['scheduled', 'active', 'closed'], default 'scheduled'
  startTime:          Date, required                 // stored in UTC
  endTime:            Date, required                 // stored in UTC
  flaggedForReview:   Boolean, default false
  timestamps: true

  indexes: { seller: 1 }, { status: 1, endTime: 1 }
}
```

**Bid**
```js
{
  auction:  ObjectId → Auction, required
  bidder:   ObjectId → User, required
  amount:   Number, required, min 0
  timestamps: true

  indexes: { auction: 1, amount: -1 }, { auction: 1, createdAt: -1 }
}
```

**Feedback**
```js
{
  auction:    ObjectId → Auction, required
  author:     ObjectId → User, required
  recipient:  ObjectId → User, required
  rating:     Number, required, min 1, max 5
  reviewText: String, required, minlength 10, maxlength 500
  timestamps: true

  indexes: { auction: 1, author: 1 } unique   // one review per user per auction
}
```

---

## 12. Minimum API Plan

**Public APIs**
```
GET  /api/auctions                    list all active auctions
GET  /api/auctions/:id                single auction details with seller populated
GET  /api/auctions/:id/bids           bid history for an auction
GET  /api/auctions/:id/feedback       feedback for a completed auction
```

**Auth APIs (public)**
```
POST /api/auth/register               create account as buyer or seller
POST /api/auth/login                  login, returns signed JWT
```

**Buyer APIs (protected — buyer role)**
```
POST /api/auctions/:id/bids           place a bid on an active auction
POST /api/auctions/:id/feedback       submit feedback after auction closes
```

**Seller APIs (protected — seller role)**
```
POST   /api/auctions                  create a new listing
PATCH  /api/auctions/:id              edit own listing
DELETE /api/auctions/:id              delete own listing
POST   /api/auctions/:id/feedback     submit feedback after auction closes
```

**Admin APIs (protected — admin role)**
```
GET   /api/admin/auctions?flagged=true      view all flagged auctions
PATCH /api/admin/auctions/:id/resolve       clear a flag after review
GET   /api/admin/users                      list all users
PATCH /api/admin/users/:id/deactivate       deactivate a user account
```

---

## 13. Key Pages to Build (Frontend)

**Public:**
1. Home — hero, active auctions, closing soon section, how-it-works explainer
2. Explore Auctions — grid of active listings with search and filter
3. Auction Details — full info, current highest bid, countdown timer, bid form, bid history
4. Seller Profile — seller info, their active and past listings

**Buyer:**
5. Register / Login
6. My Bids — history of own bids across all auctions
7. Feedback Form — post-auction review submission after winning

**Seller:**
8. Seller Dashboard — own listings with status badges
9. Create Listing form — full validation feedback
10. Edit Listing form

**Admin:**
11. Admin Dashboard — flagged auctions queue with resolve/dismiss actions
12. User Management — list all users, deactivate accounts

---

## 14. Home Page Section Plan

Recommended sections for the first version:
- Hero with platform tagline and call to action for buyers and sellers
- Search bar — search by title or keyword
- Featured / active auctions grid — latest active listings
- Closing soon — auctions within 1 hour of end time, sorted by urgency
- How it works — simple 3-step explainer: List → Bid → Win
- Call to action for sellers to list a product

Keep the home page simple in the first version. The priority is surfacing active auctions clearly and guiding new users to understand the bidding process.

---

## 15. Auction Card Content

Each auction card in the listing grid should show:
- Product title
- Short description (truncated to 2 lines)
- Starting price
- Current highest bid (prominently displayed)
- Auction status badge — Active / Closing Soon / Closed
- Time remaining countdown
- Seller name
- "View Auction" button
- "Place Bid" button — visible only to logged-in buyers on active auctions

Optional later:
- Number of bids placed
- Featured badge
- Winner badge after close
- Flagged badge visible in admin view only

---

## 16. Auction Details Page Content

The auction details page should include:
- Product title and full description
- Starting price and current highest bid — highest bid is the most prominent number on the page
- Countdown timer to end time (live updating)
- Bid placement form — buyer only, active auctions only, with real-time validation feedback
- Full bid history — bidder name, amount, and timestamp, sorted by amount descending
- Seller information and profile link
- Auction status — Scheduled / Active / Closed with clear visual indicator
- Winner announcement section — shown after auction closes with winner name
- Feedback section — shown after close, allows buyer and seller to submit and view reviews

**Preview note:**
Do not attempt to embed the auctioned product page via iframe. Browser security headers (X-Frame-Options, CSP) on third-party sites will block embedding in most cases. Always keep "Place Bid" as the primary action. Treat any inline preview as an optional enhancement only, not a core feature.

---

## 17. Submission and Bid Workflow

**Seller flow:**
1. Seller registers with a unique email, selects Seller role, and logs in
2. Seller creates an auction listing — title, description, starting price, start time, end time
3. Listing status is set to `scheduled`
4. At `startTime`, cron job transitions listing to `active`
5. Registered buyers begin placing competing bids — each must exceed the previous highest
6. A buyer attempts to bid after `endTime` — system rejects with descriptive error
7. At `endTime`, cron job transitions listing to `closed` and runs winner determination
8. Winner is recorded, flag is set if winning bid is below 50% of starting price
9. Winning buyer and seller can now each leave one rating and review

**Real use case from proposal:**
- Seller lists a used laptop at starting price ৳15,000, auction runs 9:00 AM to 9:00 PM
- Buyers compete — winning bid is ৳13,000 (87% of starting price, no flag raised)
- Had winning bid been ৳7,000 (47% of starting price), auction would be flagged for admin review
- Admin logs in, reviews flagged auctions, and decides to allow or take corrective action

**Admin review checks:**
- Is the winning bid below 50% of the starting price?
- Is the listing description appropriate and not offensive?
- Is the seller account in good standing?
- Are all links safe and working?
- Is there any sign of bid manipulation?

---

## 18. Validation Rules

**Auction listing (FR-4):**
- Title required, non-empty
- Description required
- Starting price required, must be a positive number
- Start time required, must be in the future
- End time required, must be strictly after start time

**Bid placement (FR-5, FR-6, FR-7):**
- Auction must exist
- Auction status must be `active`
- Current server time must be within `startTime` and `endTime`
- Bid amount must be strictly greater than `currentHighestBid`
- User role must be `buyer` — sellers cannot bid on their own or others' auctions
- Concurrent bids handled atomically — only one can claim highest bid position

**Feedback (FR-11, FR-12):**
- Auction status must be `closed`
- Author must be the winning buyer or the listing seller of that specific auction
- Rating must be an integer between 1 and 5
- Review text must be minimum 10 characters and maximum 500 characters
- Maximum one review per user per auction — enforced by compound unique index at DB level

---

## 19. Security Rules

Must implement (from Non-Functional Requirements):

- Password hashing with bcrypt — pre-save hook on User model, never stored in plain text
- JWT signed with `JWT_SECRET` from environment variables — payload contains only `{ id, role }`, no sensitive data
- `protect` middleware — verifies and decodes JWT on every protected route, attaches `req.user`
- `restrictTo(role)` middleware — checks role server-side on every protected endpoint, never trusted from client
- Role checks enforced server-side at both middleware and controller level
- Input validation with Joi — centralized in the validators folder, applied on all POST and PATCH requests
- Inputs sanitized to prevent NoSQL injection attacks
- Compound unique index on Feedback collection enforces one-review-per-transaction at database level, more reliable than application-level checks alone
- Atomic `findOneAndUpdate` with conditional filter on bid placement — prevents race condition exploits where two buyers simultaneously claim the highest bid
- All auction times stored and compared in UTC to prevent timezone-related drift

Do not trust client-side validation alone. Every validation must be enforced server-side.

---

## 20. Database and Hosting Notes

**MongoDB Atlas:**
Use Atlas because it connects reliably from Render-hosted Express servers and from local development machines. Use the free M0 shared cluster for the project. All times stored in UTC.

**Render notes (backend):**
- Render runs a persistent Node.js process — node-cron runs reliably here
- Use a reusable Mongoose connection helper in `src/config/db.js`
- Render free tier spins down after inactivity — use UptimeRobot or similar to keep the backend alive during demo and testing periods
- Avoid heavy processing inside individual API route handlers — keep them lightweight and delegate logic to service functions

**Vercel notes (frontend only):**
- React SPA deployed to Vercel
- All API calls point to the Render backend URL via `REACT_APP_API_URL` environment variable
- No backend logic runs on Vercel
- Use `next/image` or Vite-friendly image optimization if applicable

**File uploads:**
Image upload is an optional advanced feature. If implemented, do not store uploaded files inside Vercel or Render filesystem. Use Cloudinary — either the upload widget or a client-to-Cloudinary direct upload flow.

---

## 21. Environment Variables

**Backend (.env on Render):**
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/auction-db
JWT_SECRET=your_strong_random_secret_here
NODE_ENV=production
```

**Frontend (.env on Vercel):**
```
REACT_APP_API_URL=https://your-render-backend.onrender.com
```

**Optional (if image upload is added):**
```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Never commit `.env`. Commit `.env.example` with the same keys and empty values. Add `.env` to `.gitignore` on the very first commit before any other files are pushed.

---

## 22. Teaching-Friendly Build Order

Because this project demonstrates real engineering to students, follow this order so every session ends with a working, testable outcome:

**Session 1:**
- Explain the auction lifecycle concept — list, bid, close, winner, feedback
- Initialize Node.js project, install dependencies, configure ESLint and Prettier
- Build `server.js`, `db.js`, and health route — run and show MongoDB connection in terminal

**Session 2:**
- Define all 4 Mongoose models — explain fields, types, enums, and why each index exists
- Show how compound indexes work and why they matter for performance and data integrity

**Session 3:**
- Build register and login routes — explain bcrypt hashing and JWT signing
- Demonstrate in Postman — show the token returned on login

**Session 4:**
- Write `protect` and `restrictTo` middleware
- Test role enforcement in Postman — show 401 without token, 403 for wrong role

**Session 5:**
- Build full auction listing CRUD with Joi validation
- Show seller-only access in Postman — demonstrate validation error responses

**Session 6:**
- Build bidding engine — explain the atomic `findOneAndUpdate` pattern
- Demonstrate race condition prevention by sending two rapid concurrent bids

**Session 7:**
- Build node-cron job — show auction transitioning from scheduled to active to closed in real time
- Run winner determination logic and show winner recorded on auction document

**Session 8:**
- Build feedback system — show compound unique index rejecting a second review
- Build admin routes — show flagged auction appearing in admin queue

**Session 9:**
- Wire global error handler — show clean JSON error responses for all failure cases
- Deploy backend to Render, deploy frontend to Vercel
- Write and walk through the Postman collection

This sequence ensures students see a working API endpoint at the end of every single session.

---

## 23. UI/UX Guidance

The visual style should feel clean and functional, not decorative.

Recommended direction:
- Clean card layout for auction listings — thumbnail or placeholder, title, price, countdown
- Clear bid status indicators with color — green for Active, yellow for Closing Soon, gray for Closed
- Countdown timer prominent on both auction cards and the details page
- Strong typography hierarchy — current highest bid should be the largest, most visible number on the details page
- Consistent button styles — primary blue for "Place Bid", secondary for "View Details", red outline for destructive admin actions
- Minimal color palette — avoid too many accent colors in the first version
- Mobile-responsive layout from the start — both buyer and seller portals must work on mobile viewports
- Forms must provide real-time validation feedback — show inline error messages as users type, not only on submit

Do not try to make it fancy in the first version. Focus on:
- Making the bid action obvious and immediately accessible
- Showing auction status and time remaining clearly at all times
- Keeping forms simple with unambiguous validation messages
- Clear empty states — "No active auctions yet", "No bids placed yet"

---

## 24. Performance Guidance

Since the backend runs on Render free tier and the frontend on Vercel Hobby, optimize from the start:

- Index all fields used in frequent queries — `auctionId`, `sellerId`, `status + endTime`, `auction + amount`
- Keep the cron job lightweight — query only the minimum fields needed for state transitions
- Use `.lean()` on Mongoose read queries where you do not need Mongoose document methods — returns plain JS objects and is significantly faster
- Paginate auction listings — never return all documents in one response once data grows
- Avoid deep nested population chains — keep `.populate()` to one level deep
- Keep bid placement logic fast and atomic — target under 300ms response time per the non-functional requirements
- On the frontend, avoid unnecessary client-side re-fetches — use short polling intervals (10–30 seconds) for live bid updates rather than fetching on every keypress
- Keep the React bundle lean — avoid heavy libraries that are not needed for MVP

---

## 25. SEO and Discoverability

Basic SEO should be included in the React frontend even in MVP:

- Proper, descriptive page titles per route — e.g., "Auction: Used Laptop | Online Auction Platform"
- Meta descriptions on the home page, explore page, and auction details pages
- Open Graph tags on auction details pages so shared links render a preview
- Consistent, readable URL patterns — `/auctions/:id`, `/sellers/:id`
- Public auction pages and seller profiles should be server-renderable if SSR is added in future
- Search-engine-friendly public pages — no JavaScript-only content rendering on critical public views

---

## 26. Things to Avoid Early

Do not build any of the following before the core MVP is working and submitted:

- Real-time WebSocket bid updates — use polling first, WebSockets later if time permits
- Email or SMS notifications
- Image upload for auction listings
- Proxy bidding or auto-increment logic
- Full bid audit trail UI with filtering
- Payment, escrow, or checkout of any kind
- Mobile native app (iOS or Android)
- Multi-currency or tax calculation
- Complex analytics or reporting dashboard
- Microservices or any distributed architecture
- Advanced state management libraries unless strictly necessary

The first goal is a working, tested, documented auction API that covers all 7 coding tasks from the project brief. Everything else is optional.

---

## 27. Suggested Git Workflow

Use clean, focused commits so the project history is readable and reviewable.

**Branches:**
```
main                        # production-ready code only
dev                         # integration branch
feature/phase1-setup
feature/phase2-auth
feature/phase3-auction-crud
feature/phase4-bidding
feature/phase5-timer-winner
feature/phase6-feedback
feature/phase7-admin
feature/deployment
feature/frontend-home
feature/frontend-auction-details
feature/frontend-dashboard
```

**Commit style:**
```
feat: initialize project structure and MongoDB connection
feat: define User, Auction, Bid, Feedback Mongoose models with indexes
feat: add bcrypt pre-save hook to User model
feat: build register and login routes with JWT
feat: add protect and restrictTo middleware
feat: build auction listing CRUD with Joi validation
feat: build bid placement with atomic findOneAndUpdate
feat: add bid history route
feat: implement node-cron auction state transition job
feat: build winner determination and price flag logic in auctionService
feat: build feedback routes with compound unique index enforcement
feat: build admin flagged auctions and user management routes
feat: wire global error handler with ApiError class
docs: add full Postman collection for all endpoints
chore: deploy backend to Render and update environment variables
fix: handle expired auction bid rejection with correct status code
fix: resolve race condition in concurrent bid test scenario
```

---

## 28. Launch / Submission Checklist

Before demo and final submission:

- [ ] Backend deployed on Render, live URL confirmed and stable
- [ ] Frontend deployed on Vercel, connected to Render backend via environment variable
- [ ] MongoDB Atlas connection stable in production environment
- [ ] Register and login work end-to-end for buyer, seller, and admin roles
- [ ] Role middleware correctly blocks wrong roles on every protected route
- [ ] Sellers can create, edit, and delete their own listings
- [ ] Listings only editable while status is `scheduled`
- [ ] Buyers can place bids — invalid bids rejected with descriptive error messages
- [ ] Bids after auction end time rejected correctly
- [ ] Atomic bid update confirmed to prevent race conditions
- [ ] node-cron job transitions auction states automatically — confirmed with test auctions
- [ ] Winner correctly recorded on auction document at close time
- [ ] Winning bids below 50% of starting price are flagged automatically
- [ ] Feedback can only be submitted on closed auctions
- [ ] One review per user per auction enforced — second attempt returns duplicate key error
- [ ] Admin can view flagged auctions and resolve flags
- [ ] Admin can deactivate user accounts
- [ ] All API errors return clean JSON with correct HTTP status codes
- [ ] Full Postman collection or Swagger spec completed with sample requests and responses
- [ ] `.env` is gitignored and never committed
- [ ] `.env.example` is committed with empty values
- [ ] README written with setup instructions, environment variable reference, and how to run locally
- [ ] Code follows consistent naming conventions with inline comments on complex logic

---

## 29. Immediate Execution Plan

Start with the following exact order and do not skip steps:

1. Initialize Node.js project — `npm init -y`, install all dependencies
2. Set up folder structure, `.env`, `.env.example`, `.gitignore`, `server.js`
3. Connect MongoDB Atlas in `src/config/db.js` with error handling and logging
4. Define all 4 Mongoose models with correct fields, types, validation, and indexes
5. Create `errorHandler.js` stub and `ApiError.js` class
6. Build register, login routes and JWT middleware — test in Postman
7. Write `protect` and `restrictTo(role)` middleware — test role enforcement
8. Build auction listing CRUD with Joi validation — test all 5 routes in Postman
9. Build bidding engine with atomic `findOneAndUpdate` — test valid and invalid scenarios
10. Build node-cron job for automatic state transitions — test with short-window auctions
11. Build winner determination and price flag logic in `auctionService.js`
12. Build feedback routes with unique index enforcement — test abuse scenario
13. Build all admin routes
14. Wire global error handler as last middleware in `server.js`
15. Write full Postman collection or Swagger spec
16. Deploy backend to Render — confirm all routes on live URL
17. Build React frontend — home, explore, auction details, dashboard, auth pages
18. Deploy frontend to Vercel — connect to Render backend URL
19. End-to-end test the full lifecycle: register → list → bid → close → winner → feedback
20. Write README and finalize submission

---

## 30. Final Direction for Claude / Cursor

When implementing this project, follow these rules without exception:

1. Use the `routes → controllers → services → models` layered architecture strictly — no business logic in route files
2. Never trust client-sent role, user ID, or validation data — always re-validate server-side
3. Always use atomic `findOneAndUpdate` with a conditional filter for bid placement — this is non-negotiable
4. Use Joi for all input validation, centralized in the validators folder, applied before the controller is reached
5. All async controller functions must be wrapped in try/catch and call `next(error)` — never `res.json` inside a catch block
6. Keep the node-cron job simple and fast — it only transitions states and calls `auctionService.closeAuction()`
7. Store and compare all times in UTC — never rely on local timezone
8. Index every field used in a query — check every `find()`, `findOne()`, and `findOneAndUpdate()` call
9. Implement features strictly in the planned phase order — do not jump ahead
10. Prefer small, safe, focused commits — do not batch multiple features into one commit
11. Do not add WebSockets, image upload, notifications, or payments before the core API is complete and tested
12. Keep the backend stateless — the only stateful component is MongoDB

---

## 31. Recommended Next Step

After this plan, the next document to create should be `agent.md` or `cursor-rules.md`.

That file should define:
- Coding style rules — naming conventions for files, functions, variables, and routes
- Folder discipline — what belongs in controllers vs services vs utils
- API design conventions — HTTP methods per action, status codes per scenario, consistent response shape `{ success, data, message }`
- Mongoose conventions — always use timestamps, always define indexes, always use lean() on reads
- Validation conventions — always Joi, always server-side, always before controller logic
- Error handling conventions — always use ApiError class, always call next(error), never swallow errors silently
- Deployment constraints — keep handlers fast, no blocking operations, no large in-memory state
- "Do not over-engineer" rules — no abstraction layers that are not immediately needed, no clever patterns that obscure intent

---

## 32. Summary

The Online Auction Platform should be built as a **graded-quality, portfolio-ready, production-aware MERN full-stack auction system**.

The correct strategy is:
- Keep architecture strictly layered — routes → controllers → services → models — with no exceptions
- Build and fully test the backend API before writing a single line of frontend code
- Use atomic MongoDB operations for all concurrent-sensitive logic — especially bid placement
- Automate auction state management with a reliable node-cron job running on a persistent Render server
- Add role enforcement at both the middleware level and the database query level
- Use Joi validation on every input, compound unique indexes for data integrity, and a global error handler for clean responses
- Document every endpoint in Postman before considering any phase complete
- Deploy early and keep the live link working throughout development

This will make the project:
- Strong enough to serve as a real portfolio piece demonstrating senior-quality backend engineering
- Complete enough to fulfill all 7 coding tasks from the CSE 300 project brief
- Correctly scoped for a 14-week semester lab submission
- A solid foundation for professional full-stack MERN development careers
- Clean and explainable in a demo or code review setting