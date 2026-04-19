# BidZen API Documentation

**Base URL**: `http://localhost:4000/api`
**Authentication**: JWT Bearer Token required for protected routes
**Content-Type**: `application/json`

---

## Table of Contents

1. [Authentication Routes](#authentication-routes)
2. [Auction Routes](#auction-routes)
3. [Bidding Routes](#bidding-routes)
4. [Feedback Routes](#feedback-routes)
5. [Admin Routes](#admin-routes)
6. [Error Responses](#error-responses)
7. [Pagination](#pagination)

---

## Authentication Routes

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Buyer",
  "email": "john@test.com",
  "password": "testpass123",
  "role": "buyer"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "69d9500b6381692aa9bd73cf",
      "name": "John Buyer",
      "email": "john@test.com",
      "role": "buyer",
      "isActive": true,
      "createdAt": "2026-04-10T19:31:23.212Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Role must be either buyer, seller, or admin"
}
```

---

### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@test.com",
  "password": "testpass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "69d9500b6381692aa9bd73cf",
      "name": "John Buyer",
      "email": "john@test.com",
      "role": "buyer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

## Auction Routes

### GET /auctions
Get list of active auctions with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "auctions": [
      {
        "_id": "69e0967f2fcea13a1a4efaa9",
        "seller": {
          "_id": "69d950106381692aa9bd73d2",
          "name": "Jane Seller",
          "email": "jane@test.com"
        },
        "title": "Apple MacBook Air M2 2023",
        "description": "13-inch MacBook Air with M2 chip, 8GB RAM, 256GB SSD. Midnight color, excellent condition with box and accessories. Barely used, like new.",
        "startingPrice": 95000,
        "currentHighestBid": 108000,
        "winner": null,
        "status": "active",
        "startTime": "2026-04-16T08:00:00.000Z",
        "endTime": "2026-04-16T20:00:00.000Z",
        "flaggedForReview": false,
        "createdAt": "2026-04-16T07:57:51.389Z",
        "updatedAt": "2026-04-16T07:57:51.389Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 11,
      "pages": 1
    }
  }
}
```

---

### GET /auctions/:id
Get single auction details by ID.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "69e0967f2fcea13a1a4efaa9",
    "seller": {
      "_id": "69d950106381692aa9bd73d2",
      "name": "Jane Seller",
      "email": "jane@test.com"
    },
    "title": "Apple MacBook Air M2 2023",
    "description": "13-inch MacBook Air with M2 chip, 8GB RAM, 256GB SSD. Midnight color, excellent condition with box and accessories. Barely used, like new.",
    "startingPrice": 95000,
    "currentHighestBid": 108000,
    "winner": null,
    "status": "active",
    "startTime": "2026-04-16T08:00:00.000Z",
    "endTime": "2026-04-16T20:00:00.000Z",
    "flaggedForReview": false,
    "createdAt": "2026-04-16T07:57:51.389Z",
    "updatedAt": "2026-04-16T07:57:51.389Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Auction not found"
}
```

---

### POST /auctions
Create new auction (Seller only).

**Headers:**
```
Authorization: Bearer <seller_token>
```

**Request Body:**
```json
{
  "title": "Test Auction",
  "description": "Test description",
  "startingPrice": 50000,
  "startTime": "2026-04-16T18:00:00.000Z",
  "endTime": "2026-04-17T06:00:00.000Z"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "auction": {
      "seller": {
        "_id": "69d950106381692aa9bd73d2",
        "name": "Jane Seller",
        "email": "jane@test.com"
      },
      "title": "Test Auction",
      "description": "Test description",
      "startingPrice": 50000,
      "currentHighestBid": 0,
      "status": "scheduled",
      "startTime": "2026-04-16T18:00:00.000Z",
      "endTime": "2026-04-17T06:00:00.000Z",
      "flaggedForReview": false,
      "_id": "69e0967f2fcea13a1a4efaa9",
      "createdAt": "2026-04-16T07:57:51.389Z",
      "updatedAt": "2026-04-16T07:57:51.389Z"
    }
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

---

### PATCH /auctions/:id
Update auction details (Seller only, scheduled auctions only).

**Headers:**
```
Authorization: Bearer <seller_token>
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "auction": {
      "_id": "69e0967f2fcea13a1a4efaa9",
      "title": "Updated Title",
      "description": "Updated description",
      "startingPrice": 95000,
      "currentHighestBid": 108000,
      "status": "scheduled",
      "startTime": "2026-04-16T18:00:00.000Z",
      "endTime": "2026-04-17T06:00:00.000Z",
      "seller": {
        "_id": "69d950106381692aa9bd73d2",
        "name": "Jane Seller",
        "email": "jane@test.com"
      }
    }
  }
}
```

---

### DELETE /auctions/:id
Delete auction (Seller only, scheduled auctions only).

**Headers:**
```
Authorization: Bearer <seller_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Auction deleted successfully"
}
```

---

## Bidding Routes

### POST /auctions/:id/bids
Place bid on active auction (Buyer only).

**Headers:**
```
Authorization: Bearer <buyer_token>
```

**Request Body:**
```json
{
  "amount": 110000
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "bid": {
      "_id": "69e0967f2fcea13a1a4efaa9",
      "auction": "69e0967f2fcea13a1a4efaa9",
      "bidder": {
        "_id": "69d9500b6381692aa9bd73cf",
        "name": "John Buyer",
        "email": "john@test.com"
      },
      "amount": 110000,
      "createdAt": "2026-04-16T08:30:00.000Z"
    },
    "currentHighestBid": 110000,
    "message": "Bid placed successfully"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Bid must be higher than current highest bid"
}
```

---

### GET /auctions/:id/bids
Get bid history for specific auction (Public).

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "bids": [
      {
        "_id": "69e0967f2fcea13a1a4efaa9",
        "auction": "69e0967f2fcea13a1a4efaa9",
        "bidder": {
          "_id": "69d9500b6381692aa9bd73cf",
          "name": "John Buyer",
          "email": "john@test.com"
        },
        "amount": 108000,
        "createdAt": "2026-04-16T08:30:00.000Z"
      }
    ],
    "auction": {
      "id": "69e0967f2fcea13a1a4efaa9",
      "title": "Apple MacBook Air M2 2023",
      "currentHighestBid": 108000,
      "status": "active",
      "endTime": "2026-04-16T20:00:00.000Z"
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

---

### GET /auctions/my-bids
Get current user's bid history (Buyer only).

**Headers:**
```
Authorization: Bearer <buyer_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "bids": [
      {
        "_id": "69e0967f2fcea13a1a4efaa9",
        "auction": {
          "_id": "69e0967f2fcea13a1a4efaa9",
          "title": "Apple MacBook Air M2 2023",
          "endTime": "2026-04-16T20:00:00.000Z",
          "status": "active",
          "currentHighestBid": 108000,
          "seller": {
            "_id": "69d950106381692aa9bd73d2",
            "name": "Jane Seller",
            "email": "jane@test.com"
          }
        },
        "amount": 108000,
        "createdAt": "2026-04-16T08:30:00.000Z"
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

## Feedback Routes

### POST /auctions/:id/feedback
Submit feedback for completed auction (Winner or Seller only).

**Headers:**
```
Authorization: Bearer <user_token>
```

**Request Body:**
```json
{
  "rating": 5,
  "reviewText": "Excellent seller! Item exactly as described and shipping was fast."
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "feedback": {
      "_id": "69e0967f2fcea13a1a4efaa9",
      "auction": "69e0967f2fcea13a1a4efaa9",
      "author": {
        "_id": "69d9500b6381692aa9bd73cf",
        "name": "John Buyer",
        "email": "john@test.com",
        "role": "buyer"
      },
      "recipient": {
        "_id": "69d950106381692aa9bd73d2",
        "name": "Jane Seller",
        "email": "jane@test.com",
        "role": "seller"
      },
      "rating": 5,
      "reviewText": "Excellent seller! Item exactly as described and shipping was fast.",
      "createdAt": "2026-04-16T10:00:00.000Z"
    }
  },
  "message": "Feedback submitted successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Feedback can only be submitted for completed auctions"
}
```

---

### GET /auctions/:id/feedback
Get feedback for specific auction (Public).

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "feedbacks": [
      {
        "_id": "69e0967f2fcea13a1a4efaa9",
        "author": {
          "_id": "69d9500b6381692aa9bd73cf",
          "name": "John Buyer",
          "email": "john@test.com",
          "role": "buyer"
        },
        "recipient": {
          "_id": "69d950106381692aa9bd73d2",
          "name": "Jane Seller",
          "email": "jane@test.com",
          "role": "seller"
        },
        "rating": 5,
        "reviewText": "Excellent seller! Item exactly as described and shipping was fast.",
        "createdAt": "2026-04-16T10:00:00.000Z"
      }
    ],
    "auction": {
      "id": "69e0967f2fcea13a1a4efaa9",
      "title": "Apple MacBook Air M2 2023",
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

---

### GET /auctions/my/received
Get feedback received by current user (Protected).

**Headers:**
```
Authorization: Bearer <user_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "feedbacks": [
      {
        "_id": "69e0967f2fcea13a1a4efaa9",
        "author": {
          "_id": "69d9500b6381692aa9bd73cf",
          "name": "John Buyer",
          "email": "john@test.com",
          "role": "buyer"
        },
        "auction": {
          "_id": "69e0967f2fcea13a1a4efaa9",
          "title": "Apple MacBook Air M2 2023",
          "endTime": "2026-04-16T20:00:00.000Z",
          "startingPrice": 95000
        },
        "rating": 5,
        "reviewText": "Excellent seller! Item exactly as described and shipping was fast.",
        "createdAt": "2026-04-16T10:00:00.000Z"
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

---

### GET /auctions/my/given
Get feedback given by current user (Protected).

**Headers:**
```
Authorization: Bearer <user_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "feedbacks": [
      {
        "_id": "69e0967f2fcea13a1a4efaa9",
        "recipient": {
          "_id": "69d950106381692aa9bd73d2",
          "name": "Jane Seller",
          "email": "jane@test.com",
          "role": "seller"
        },
        "auction": {
          "_id": "69e0967f2fcea13a1a4efaa9",
          "title": "Apple MacBook Air M2 2023",
          "endTime": "2026-04-16T20:00:00.000Z",
          "startingPrice": 95000
        },
        "rating": 5,
        "reviewText": "Excellent seller! Item exactly as described and shipping was fast.",
        "createdAt": "2026-04-16T10:00:00.000Z"
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

## Admin Routes

### GET /admin/dashboard/stats
Get admin dashboard statistics (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 6,
      "totalAuctions": 27,
      "activeAuctions": 11,
      "flaggedAuctions": 2,
      "totalBids": 57,
      "completedAuctions": 13
    },
    "userStats": {
      "seller": 1,
      "admin": 1,
      "buyer": 4
    },
    "auctionStats": {
      "active": 11,
      "scheduled": 3,
      "closed": 13
    },
    "recentFlagged": [
      {
        "_id": "69e096802fcea13a1a4efaca",
        "seller": {
          "_id": "69d950106381692aa9bd73d2",
          "name": "Jane Seller",
          "email": "jane@test.com"
        },
        "title": "Vintage Rolex Daytona 116520",
        "description": "Vintage Rolex Daytona 116520 from 1990s, automatic chronograph, stainless steel. Recently serviced, excellent working condition, collector's item.",
        "startingPrice": 800000,
        "currentHighestBid": 380000,
        "winner": "69de997f7176c8d32560328b",
        "status": "closed",
        "startTime": "2026-04-14T08:00:00.000Z",
        "endTime": "2026-04-15T08:00:00.000Z",
        "flaggedForReview": true,
        "createdAt": "2026-04-16T07:57:52.773Z",
        "updatedAt": "2026-04-16T07:57:56.674Z"
      }
    ]
  }
}
```

---

### GET /admin/auctions
Get flagged auctions for admin review (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `flagged` (optional): Filter flagged auctions (default: true)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "auctions": [
      {
        "_id": "69e096802fcea13a1a4efaca",
        "title": "Vintage Rolex Daytona 116520",
        "startingPrice": 800000,
        "currentHighestBid": 380000,
        "status": "closed",
        "flaggedForReview": true,
        "winner": {
          "_id": "69de997f7176c8d32560328b",
          "name": "John Buyer",
          "email": "john@test.com"
        },
        "seller": {
          "_id": "69d950106381692aa9bd73d2",
          "name": "Jane Seller",
          "email": "jane@test.com"
        },
        "bidStats": {
          "totalBids": 1,
          "highestBid": 380000,
          "lowestBid": 380000,
          "avgBid": 380000
        },
        "priceRatio": 0.475
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 2,
      "pages": 1
    }
  }
}
```

---

### PATCH /admin/auctions/:id/resolve
Resolve flagged auction after review (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "action": "approve",
  "notes": "Reviewed and approved. Low bid was legitimate due to item condition."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "auction": {
      "_id": "69e096802fcea13a1a4efaca",
      "title": "Vintage Rolex Daytona 116520",
      "startingPrice": 800000,
      "currentHighestBid": 380000,
      "status": "closed",
      "flaggedForReview": false,
      "adminAction": {
        "action": "approve",
        "adminId": "69d951001c27f0c2114102f6",
        "timestamp": "2026-04-16T08:00:00.000Z",
        "notes": "Reviewed and approved. Low bid was legitimate due to item condition."
      },
      "seller": {
        "_id": "69d950106381692aa9bd73d2",
        "name": "Jane Seller",
        "email": "jane@test.com"
      }
    }
  },
  "message": "Auction flag resolved with action: approve"
}
```

---

### GET /admin/users
Get all users with statistics (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `role` (optional): Filter by role (buyer/seller/admin)
- `status` (optional): Filter by status (active/inactive)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "69d9500b6381692aa9bd73cf",
        "name": "John Buyer",
        "email": "john@test.com",
        "role": "buyer",
        "isActive": true,
        "createdAt": "2026-04-10T19:31:23.212Z",
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
      "total": 6,
      "pages": 1
    }
  }
}
```

---

### PATCH /admin/users/:id/deactivate
Deactivate user account (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "reason": "Suspicious activity detected"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "69d9500b6381692aa9bd73cf",
      "name": "John Buyer",
      "email": "john@test.com",
      "role": "buyer",
      "isActive": false,
      "deactivatedBy": "69d951001c27f0c2114102f6",
      "deactivatedAt": "2026-04-16T08:00:00.000Z",
      "deactivationReason": "Suspicious activity detected"
    }
  },
  "message": "User account deactivated successfully"
}
```

---

### PATCH /admin/users/:id/activate
Reactivate user account (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "69d9500b6381692aa9bd73cf",
      "name": "John Buyer",
      "email": "john@test.com",
      "role": "buyer",
      "isActive": true,
      "activatedBy": "69d951001c27f0c2114102f6",
      "activatedAt": "2026-04-16T08:00:00.000Z"
    }
  },
  "message": "User account activated successfully"
}
```

---

## Error Responses

All endpoints return consistent error response format:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (permission denied)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## Pagination

All list endpoints support pagination with the following response structure:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

---

## CORS Headers

The API supports CORS with the following headers:

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Health Check

### GET /health
Check API health status.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Server is running"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented, but it's recommended for production use.

---

## Data Types

**Common Fields:**
- `_id`: MongoDB ObjectId (string)
- `createdAt`: ISO 8601 timestamp
- `updatedAt`: ISO 8601 timestamp
- `price`: Integer (in local currency)
- `rating`: Integer (1-5)
- `status`: String (scheduled/active/closed)

**User Object:**
```json
{
  "_id": "string",
  "name": "string",
  "email": "string",
  "role": "buyer|seller|admin",
  "isActive": "boolean"
}
```

**Auction Object:**
```json
{
  "_id": "string",
  "title": "string",
  "description": "string",
  "startingPrice": "number",
  "currentHighestBid": "number",
  "status": "scheduled|active|closed",
  "startTime": "ISO8601",
  "endTime": "ISO8601",
  "seller": "UserObject",
  "winner": "UserObject|null",
  "flaggedForReview": "boolean"
}
```

---

## Testing

Use the provided dummy data in the database for testing. The database contains:
- 27 auctions across different categories
- 57 bids with realistic amounts
- 2 flagged auctions for admin testing
- Multiple users with different roles

For detailed testing scenarios, refer to `TESTING_GUIDELINES.md` and `TESTING_PHASES.md`.
