# BidZen API Testing Guidelines

This document provides comprehensive testing guidelines for all API endpoints with dummy data examples.

## 📋 **Testing Setup**

### **Base URL**
```
http://localhost:3000/api
```

### **Common Headers**
```json
{
  "Content-Type": "application/json"
}
```

### **Authentication Headers (for protected routes)**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

---

## 🔐 **Authentication Endpoints**

### **POST /auth/register**
**Purpose**: Create new user account

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "buyer"
}
```

**Test Cases**:
1. ✅ Valid registration (buyer)
2. ✅ Valid registration (seller)
3. ❌ Invalid email format
4. ❌ Password too short (<6 chars)
5. ❌ Missing required fields
6. ❌ Invalid role (not buyer/seller)

**Expected Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "buyer",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

### **POST /auth/login**
**Purpose**: Authenticate user and get JWT token

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Test Cases**:
1. ✅ Valid credentials
2. ❌ Invalid email
3. ❌ Invalid password
4. ❌ Non-existent user

**Expected Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "buyer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

---

## 🏪 **Auction Endpoints**

### **GET /auctions**
**Purpose**: List all active auctions

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Test Cases**:
1. ✅ Get first page
2. ✅ Get second page
3. ✅ Custom limit
4. ✅ Empty database

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "auctions": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "title": "Vintage Laptop",
        "description": "Classic laptop in excellent condition",
        "startingPrice": 15000,
        "currentHighestBid": 18000,
        "status": "active",
        "startTime": "2024-01-01T10:00:00.000Z",
        "endTime": "2024-01-01T22:00:00.000Z",
        "seller": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "name": "Jane Smith",
          "email": "jane@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### **GET /auctions/:id**
**Purpose**: Get single auction details

**Test Cases**:
1. ✅ Valid auction ID
2. ❌ Invalid auction ID
3. ❌ Non-existent auction

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "title": "Vintage Laptop",
    "description": "Classic laptop in excellent condition with original box",
    "startingPrice": 15000,
    "currentHighestBid": 18000,
    "status": "active",
    "startTime": "2024-01-01T10:00:00.000Z",
    "endTime": "2024-01-01T22:00:00.000Z",
    "seller": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  }
}
```

### **POST /auctions** (Seller Only)
**Purpose**: Create new auction listing

**Request Body**:
```json
{
  "title": "Smartphone Pro Max",
  "description": "Latest smartphone with excellent condition, includes charger and case",
  "startingPrice": 25000,
  "startTime": "2024-01-02T10:00:00.000Z",
  "endTime": "2024-01-02T22:00:00.000Z"
}
```

**Test Cases**:
1. ✅ Valid auction creation (seller)
2. ❌ Unauthorized (buyer)
3. ❌ Missing required fields
4. ❌ Invalid time range (endTime before startTime)
5. ❌ Past start time
6. ❌ Title too short (<3 chars)
7. ❌ Description too short (<10 chars)

**Expected Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "auction": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "title": "Smartphone Pro Max",
      "description": "Latest smartphone with excellent condition, includes charger and case",
      "startingPrice": 25000,
      "currentHighestBid": 0,
      "status": "scheduled",
      "startTime": "2024-01-02T10:00:00.000Z",
      "endTime": "2024-01-02T22:00:00.000Z",
      "seller": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    }
  }
}
```

### **PATCH /auctions/:id** (Seller Only)
**Purpose**: Update own auction (scheduled only)

**Request Body**:
```json
{
  "title": "Updated Smartphone Title",
  "description": "Updated description with more details"
}
```

**Test Cases**:
1. ✅ Valid update (seller, scheduled auction)
2. ❌ Unauthorized (wrong seller)
3. ❌ Unauthorized (buyer)
4. ❌ Auction not scheduled (active/closed)
5. ❌ No fields provided

### **DELETE /auctions/:id** (Seller Only)
**Purpose**: Delete own auction (scheduled only)

**Test Cases**:
1. ✅ Valid deletion (seller, scheduled auction)
2. ❌ Unauthorized (wrong seller)
3. ❌ Unauthorized (buyer)
4. ❌ Auction not scheduled (active/closed)

---

## 💰 **Bidding Endpoints**

### **POST /auctions/:id/bids** (Buyer Only)
**Purpose**: Place bid on active auction

**Request Body**:
```json
{
  "amount": 20000
}
```

**Test Cases**:
1. ✅ Valid bid (buyer, active auction)
2. ✅ Higher bid than current
3. ❌ Unauthorized (seller)
4. ❌ Auction not active (scheduled/closed)
5. ❌ Bid too low (≤ currentHighestBid)
6. ❌ Bid amount negative
7. ❌ Seller bidding on own auction
8. ❌ Auction not found
9. ❌ Auction ended (past endTime)
10. ❌ Auction not started (before startTime)

**Expected Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "bid": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
      "auction": "64f8a1b2c3d4e5f6a7b8c9d0",
      "bidder": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "amount": 20000,
      "createdAt": "2024-01-01T15:30:00.000Z"
    },
    "currentHighestBid": 20000,
    "message": "Bid placed successfully"
  }
}
```

### **GET /auctions/:id/bids** (Public)
**Purpose**: Get bid history for auction

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "bids": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
        "auction": "64f8a1b2c3d4e5f6a7b8c9d0",
        "bidder": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "amount": 20000,
        "createdAt": "2024-01-01T15:30:00.000Z"
      }
    ],
    "auction": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "title": "Vintage Laptop",
      "currentHighestBid": 20000,
      "status": "active",
      "endTime": "2024-01-01T22:00:00.000Z"
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### **GET /auctions/my-bids** (Buyer Only)
**Purpose**: Get user's bid history

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "bids": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d3",
        "auction": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "title": "Vintage Laptop",
          "endTime": "2024-01-01T22:00:00.000Z",
          "status": "active",
          "currentHighestBid": 20000,
          "seller": {
            "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
            "name": "Jane Smith",
            "email": "jane@example.com"
          }
        },
        "amount": 20000,
        "createdAt": "2024-01-01T15:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

---

## ⭐ **Feedback Endpoints**

### **POST /auctions/:id/feedback** (Winner/Seller Only)
**Purpose**: Submit feedback for completed auction

**Request Body**:
```json
{
  "rating": 5,
  "reviewText": "Excellent seller! Item was exactly as described and shipping was fast."
}
```

**Test Cases**:
1. ✅ Valid feedback (winner)
2. ✅ Valid feedback (seller)
3. ❌ Unauthorized (other buyer)
4. ❌ Auction not closed
5. ❌ No winner (auction with no bids)
6. ❌ Rating out of range (<1 or >5)
7. ❌ Review text too short (<10 chars)
8. ❌ Review text too long (>500 chars)
9. ❌ Duplicate feedback submission

**Expected Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "feedback": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
      "auction": "64f8a1b2c3d4e5f6a7b8c9d0",
      "author": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "buyer"
      },
      "recipient": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "seller"
      },
      "rating": 5,
      "reviewText": "Excellent seller! Item was exactly as described and shipping was fast.",
      "createdAt": "2024-01-02T10:00:00.000Z"
    }
  },
  "message": "Feedback submitted successfully"
}
```

### **GET /auctions/:id/feedback** (Public)
**Purpose**: Get feedback for specific auction

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "feedbacks": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
        "author": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "name": "John Doe",
          "email": "john@example.com",
          "role": "buyer"
        },
        "recipient": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "name": "Jane Smith",
          "email": "jane@example.com",
          "role": "seller"
        },
        "rating": 5,
        "reviewText": "Excellent seller! Item was exactly as described and shipping was fast.",
        "createdAt": "2024-01-02T10:00:00.000Z"
      }
    ],
    "auction": {
      "id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "title": "Vintage Laptop",
      "status": "closed"
    },
    "stats": {
      "averageRating": 5.0,
      "totalFeedbacks": 1
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### **GET /auctions/my/received** (Protected)
**Purpose**: Get feedback received by current user

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "feedbacks": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d4",
        "author": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "name": "John Doe",
          "email": "john@example.com",
          "role": "buyer"
        },
        "auction": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "title": "Vintage Laptop",
          "endTime": "2024-01-01T22:00:00.000Z",
          "startingPrice": 15000
        },
        "rating": 5,
        "reviewText": "Excellent seller! Item was exactly as described and shipping was fast.",
        "createdAt": "2024-01-02T10:00:00.000Z"
      }
    ],
    "stats": {
      "averageRating": 5.0,
      "totalFeedbacks": 1
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### **GET /auctions/my/given** (Protected)
**Purpose**: Get feedback given by current user

---

## 👑 **Admin Endpoints**

### **GET /admin/auctions?flagged=true** (Admin Only)
**Purpose**: View all flagged auctions

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "auctions": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "title": "Vintage Laptop",
        "startingPrice": 15000,
        "currentHighestBid": 7000,
        "status": "closed",
        "flaggedForReview": true,
        "winner": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "seller": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
          "name": "Jane Smith",
          "email": "jane@example.com"
        },
        "bidStats": {
          "totalBids": 1,
          "highestBid": 7000,
          "lowestBid": 7000,
          "avgBid": 7000
        },
        "priceRatio": 0.47
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### **PATCH /admin/auctions/:id/resolve** (Admin Only)
**Purpose**: Clear flag after review

**Request Body**:
```json
{
  "action": "approve",
  "notes": "Auction reviewed and approved. Low bid was legitimate due to item condition."
}
```

**Test Cases**:
1. ✅ Valid resolution (approve)
2. ✅ Valid resolution (reject)
3. ✅ Valid resolution (investigate)
4. ❌ Auction not flagged
5. ❌ Auction not found

### **GET /admin/users** (Admin Only)
**Purpose**: List all users with statistics

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `role`: Filter by role (buyer/seller/admin)
- `status`: Filter by status (active/inactive)

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "buyer",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "stats": {
          "buyerStats": {
            "totalBids": 5,
            "wonAuctions": 2
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### **PATCH /admin/users/:id/deactivate** (Admin Only)
**Purpose**: Deactivate user account

**Request Body**:
```json
{
  "reason": "Suspicious activity detected"
}
```

**Test Cases**:
1. ✅ Valid deactivation
2. ❌ User not found
3. ❌ Deactivating self
4. ❌ Deactivating another admin

### **GET /admin/dashboard/stats** (Admin Only)
**Purpose**: Get admin dashboard statistics

**Expected Response (200)**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 10,
      "totalAuctions": 25,
      "activeAuctions": 5,
      "flaggedAuctions": 2,
      "totalBids": 100,
      "completedAuctions": 18
    },
    "userStats": {
      "buyer": 7,
      "seller": 2,
      "admin": 1
    },
    "auctionStats": {
      "scheduled": 2,
      "active": 5,
      "closed": 18
    },
    "recentFlagged": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "title": "Vintage Laptop",
        "flaggedForReview": true,
        "seller": {
          "name": "Jane Smith",
          "email": "jane@example.com"
        }
      }
    ]
  }
}
```

---

## 🧪 **Testing Scenarios**

### **Complete Auction Flow Test**
1. Register as seller
2. Login as seller
3. Create auction (scheduled)
4. Register as buyer
5. Login as buyer
6. Wait for auction to become active (or test with past start time)
7. Place bid
8. Place higher bid (concurrent test)
9. Wait for auction to end (or test with past end time)
10. Check winner determination
11. Submit feedback (buyer)
12. Submit feedback (seller)
13. View feedback

### **Admin Flow Test**
1. Register as admin
2. Login as admin
3. View dashboard statistics
4. View flagged auctions
5. Resolve flagged auction
6. View user list
7. Deactivate user
8. Reactivate user

### **Error Handling Test**
Test all error scenarios for each endpoint to ensure proper HTTP status codes and error messages.

---

## 📝 **Testing Tools**

### **Postman Collection**
Import the following collection structure:
- Folder: Authentication
- Folder: Auctions (Public)
- Folder: Auctions (Protected)
- Folder: Bidding
- Folder: Feedback
- Folder: Admin

### **Test Data**
Use the dummy data provided in examples above for consistent testing across all endpoints.

### **Environment Variables**
Set up Postman environment with:
```
base_url = http://localhost:3000/api
buyer_token = <BUYER_JWT_TOKEN>
seller_token = <SELLER_JWT_TOKEN>
admin_token = <ADMIN_JWT_TOKEN>
```

---

## ✅ **Success Criteria**

Each endpoint should pass all test cases:
- ✅ Correct HTTP status codes
- ✅ Proper response format
- ✅ Data validation
- ✅ Authentication/authorization
- ✅ Error handling
- ✅ Pagination where applicable
- ✅ Population of related data
- ✅ Business rule enforcement
