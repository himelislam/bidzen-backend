# BidZen Backend API

A comprehensive RESTful API for the BidZen online auction platform, built with Node.js, Express, and MongoDB.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Models](#models)
- [Background Jobs](#background-jobs)
- [Error Handling](#error-handling)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Features

- **User Management**: Multi-role authentication (buyer, seller, admin)
- **Auction Management**: Complete auction lifecycle with automated timing
- **Real-Time Bidding**: Secure bid placement with validation
- **Image Management**: Cloudinary integration for image storage
- **Feedback System**: User ratings and reviews
- **Admin Dashboard**: Content moderation and user management
- **Background Jobs**: Automated auction status transitions
- **Comprehensive Error Handling**: Structured error responses

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Image Storage**: Cloudinary
- **Validation**: Joi
- **File Upload**: Multer
- **Background Jobs**: node-cron
- **Security**: bcryptjs, helmet, cors

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (for image storage)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bidzen-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables (see below)

5. Start the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/bidzen

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

## Database Setup

### Local MongoDB
1. Install MongoDB on your system
2. Start MongoDB service
3. The application will automatically create the `bidzen` database

### MongoDB Atlas
1. Create a free MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in your `.env` file

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Routes

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "buyer" // or "seller"
}
```

#### Login User
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "buyer"
    },
    "token": "jwt_token_here"
  }
}
```

### Auction Routes

#### Get All Auctions
```http
GET /api/auctions
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `category`: Filter by category
- `status`: Filter by status (scheduled, active, closed)
- `search`: Search in title and description

#### Get Auction by ID
```http
GET /api/auctions/:id
```

#### Create Auction (Seller Only)
```http
POST /api/auctions
```

**Request Body:**
```json
{
  "title": "Vintage Watch",
  "description": "A beautiful vintage watch from the 1960s",
  "startingPrice": 100,
  "startTime": "2024-01-01T10:00:00Z",
  "endTime": "2024-01-07T10:00:00Z",
  "category": "collectibles"
}
```

#### Update Auction (Seller Only)
```http
PUT /api/auctions/:id
```

#### Delete Auction (Seller Only)
```http
DELETE /api/auctions/:id
```

### Bid Routes

#### Place Bid (Buyer Only)
```http
POST /api/auctions/:id/bids
```

**Request Body:**
```json
{
  "amount": 150
}
```

#### Get Bids for Auction
```http
GET /api/auctions/:id/bids
```

#### Get User's Bids (Buyer Only)
```http
GET /api/users/me/bids
```

### User Routes

#### Get Current User Profile
```http
GET /api/users/me
```

#### Update User Profile
```http
PUT /api/users/me
```

#### Get User by ID
```http
GET /api/users/:id
```

### Feedback Routes

#### Create Feedback
```http
POST /api/feedback
```

**Request Body:**
```json
{
  "auctionId": "auction_id",
  "recipientId": "user_id",
  "rating": 5,
  "reviewText": "Great seller! Fast shipping and item as described."
}
```

#### Get Feedback for User
```http
GET /api/feedback/user/:userId
```

#### Get Feedback for Auction
```http
GET /api/feedback/auction/:auctionId
```

### Admin Routes

#### Get All Users
```http
GET /api/admin/users
```

#### Deactivate User
```http
PUT /api/admin/users/:id/deactivate
```

#### Get Flagged Auctions
```http
GET /api/admin/auctions/flagged
```

#### Resolve Flagged Auction
```http
PUT /api/admin/auctions/:id/resolve
```

## Authentication

### JWT Token Structure
```json
{
  "id": "user_id",
  "role": "buyer|seller|admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Protected Routes
All routes except authentication endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Role-Based Access
- **Buyer**: Can place bids, view auctions, leave feedback
- **Seller**: Can create/manage auctions, view their bids
- **Admin**: Can manage users, review flagged content

## Models

### User Model
```javascript
{
  name: String (required, 2-50 chars),
  email: String (required, unique, valid email),
  password: String (required, 6-128 chars, hashed),
  role: String (required, enum: ['buyer', 'seller', 'admin']),
  isActive: Boolean (default: true),
  profile: {
    phone: String,
    address: String,
    avatar: String
  }
}
```

### Auction Model
```javascript
{
  seller: ObjectId (ref: 'User', required),
  title: String (required, 3-100 chars),
  description: String (required, 10-1000 chars),
  startingPrice: Number (required, min: 1),
  currentHighestBid: Number (default: 0),
  category: String (enum: predefined categories),
  winner: ObjectId (ref: 'User'),
  status: String (enum: ['scheduled', 'active', 'closed']),
  startTime: Date (required, future),
  endTime: Date (required, after startTime),
  flaggedForReview: Boolean (default: false),
  bidCount: Number (default: 0),
  images: [ImageSchema],
  primaryImageIndex: Number (default: -1)
}
```

### Bid Model
```javascript
{
  auction: ObjectId (ref: 'Auction', required),
  bidder: ObjectId (ref: 'User', required),
  amount: Number (required, min: 1)
}
```

### Feedback Model
```javascript
{
  auction: ObjectId (ref: 'Auction', required),
  author: ObjectId (ref: 'User', required),
  recipient: ObjectId (ref: 'User', required),
  rating: Number (required, min: 1, max: 5),
  reviewText: String (required, 10-500 chars)
}
```

## Background Jobs

### Auction Timer Job
Runs every minute to handle auction lifecycle:

1. **Scheduled to Active**: Activates auctions when start time is reached
2. **Active to Closed**: Closes expired auctions and determines winners
3. **Winner Selection**: Automatically assigns winner based on highest bid

### Starting the Timer
```javascript
const { startAuctionTimer } = require('./jobs/auctionTimer');
startAuctionTimer();
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "stack": "Error stack trace (development only)"
  }
}
```

### Common Error Codes
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource not found)
- `409`: Conflict (duplicate resource)
- `500`: Internal Server Error

### Validation Errors
Input validation is performed using Joi schemas with detailed error messages.

## Deployment

### Environment Setup
1. Set `NODE_ENV=production` in production
2. Use MongoDB Atlas for production database
3. Configure Cloudinary for production image storage
4. Set strong JWT secret

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### PM2 Process Manager
```bash
npm install -g pm2
pm2 start server.js --name "bidzen-api"
pm2 startup
pm2 save
```

## Scripts

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

## API Rate Limiting

Configure rate limiting for production:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Joi validation schemas
- **CORS Protection**: Configured CORS policies
- **Helmet.js**: Security headers
- **File Upload Security**: Multer with file type validation

## Monitoring and Logging

### Winston Logging (Recommended)
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
