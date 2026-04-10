# Multi-Phase Testing Steps for BidZen API

This document provides structured testing phases to systematically test all endpoints with dummy data.

## 🎯 **Testing Overview**

### **Prerequisites**
- Server running on `http://localhost:3000`
- MongoDB connected and accessible
- Postman installed with environment variables set
- `TESTING_GUIDELINES.md` reviewed for endpoint details

### **Test Data Setup**
Create the following test accounts and data before starting:

**Test Users**:
```json
// Buyer Account
{
  "name": "John Buyer",
  "email": "john@test.com",
  "password": "testpass123",
  "role": "buyer"
}

// Seller Account
{
  "name": "Jane Seller",
  "email": "jane@test.com", 
  "password": "testpass123",
  "role": "seller"
}

// Admin Account
{
  "name": "Admin User",
  "email": "admin@test.com",
  "password": "adminpass123",
  "role": "admin"
}
```

---

## 📋 **Phase 1: Authentication Testing**

### **Objective**: Test user registration and login functionality

#### **Step 1.1: Register Test Users**
**Actions**:
1. Register buyer account
2. Register seller account  
3. Register admin account
4. Test validation errors (invalid email, short password, wrong role)

**Expected Results**:
- ✅ All users registered successfully (201)
- ✅ JWT tokens returned in response
- ✅ Proper error messages for invalid data
- ✅ Users stored in database with correct roles

#### **Step 1.2: Test Login**
**Actions**:
1. Login as buyer (save token)
2. Login as seller (save token)
3. Login as admin (save token)
4. Test invalid credentials
5. Test non-existent user login

**Expected Results**:
- ✅ All users login successfully (200)
- ✅ JWT tokens received and valid
- ✅ Invalid login attempts rejected (401)
- ✅ Proper error messages for failed attempts

---

## 📋 **Phase 2: Auction CRUD Testing**

### **Objective**: Test auction creation, retrieval, update, and deletion

#### **Step 2.1: Create Test Auctions**
**Actions**:
1. Login as seller
2. Create auction with future start time
3. Create auction with immediate start time
4. Test validation errors (missing fields, invalid times)

**Test Auction Data**:
```json
{
  "title": "MacBook Pro 2020",
  "description": "Excellent condition MacBook Pro with 16GB RAM and 512GB SSD. Includes original charger and box.",
  "startingPrice": 85000,
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T22:00:00.000Z"
}
```

**Expected Results**:
- ✅ Auctions created successfully (201)
- ✅ Status set to 'scheduled'
- ✅ Seller populated correctly
- ✅ Validation errors for invalid data

#### **Step 2.2: Test Auction Retrieval**
**Actions**:
1. Get all active auctions (public)
2. Get specific auction by ID
3. Test pagination
4. Test non-existent auction

**Expected Results**:
- ✅ Auctions list returned (200)
- ✅ Single auction details returned (200)
- ✅ Pagination works correctly
- ✅ Seller information populated

#### **Step 2.3: Test Auction Updates**
**Actions**:
1. Update scheduled auction (seller)
2. Try to update active auction (should fail)
3. Try to update other seller's auction (should fail)
4. Test partial updates

**Expected Results**:
- ✅ Scheduled auction updated successfully (200)
- ✅ Active auction update rejected (400)
- ✅ Unauthorized update rejected (403)

#### **Step 2.4: Test Auction Deletion**
**Actions**:
1. Delete scheduled auction (seller)
2. Try to delete active auction (should fail)
3. Try to delete other seller's auction (should fail)

**Expected Results**:
- ✅ Scheduled auction deleted successfully (200)
- ✅ Active auction deletion rejected (400)
- ✅ Unauthorized deletion rejected (403)

---

## 📋 **Phase 3: Bidding System Testing**

### **Objective**: Test bid placement and race condition protection

#### **Step 3.1: Basic Bidding**
**Actions**:
1. Login as buyer
2. Place first bid on active auction
3. Place higher bid on same auction
4. Test bid validation (too low, negative amount)

**Test Bid Data**:
```json
{
  "amount": 90000
}
```

**Expected Results**:
- ✅ First bid placed successfully (201)
- ✅ Higher bid placed successfully (201)
- ✅ Current highest bid updated
- ✅ Validation errors for invalid bids

#### **Step 3.2: Race Condition Testing**
**Actions**:
1. Use Postman Runner or parallel requests
2. Send multiple bids simultaneously
3. Verify only one bid wins

**Test Setup**:
```javascript
// Use Postman Runner or curl with &
// Send 3-5 identical bid requests simultaneously
```

**Expected Results**:
- ✅ Only one bid succeeds
- ✅ Others rejected with proper error message
- ✅ No data corruption
- ✅ Atomic operation confirmed

#### **Step 3.3: Bid History Testing**
**Actions**:
1. Get bid history for auction
2. Get user's bid history
3. Test pagination
4. Verify sorting (highest first)

**Expected Results**:
- ✅ Bid history returned (200)
- ✅ Bids sorted by amount descending
- ✅ Bidder information populated
- ✅ Pagination works correctly

---

## 📋 **Phase 4: Feedback System Testing**

### **Objective**: Test feedback submission and retrieval after auction closure

#### **Step 4.1: Create Closed Auction Scenario**
**Actions**:
1. Create auction with past end time
2. Wait for cron job or manually close
3. Verify winner determination
4. Verify auction status is 'closed'

**Expected Results**:
- ✅ Auction automatically closed
- ✅ Winner determined correctly
- ✅ Status updated to 'closed'

#### **Step 4.2: Test Feedback Submission**
**Actions**:
1. Submit feedback as winner (buyer)
2. Submit feedback as seller
3. Test unauthorized feedback attempts
4. Test duplicate feedback submission

**Test Feedback Data**:
```json
{
  "rating": 5,
  "reviewText": "Great seller! Item exactly as described and fast shipping."
}
```

**Expected Results**:
- ✅ Feedback submitted successfully (201)
- ✅ Recipient determined correctly
- ✅ Unauthorized attempts rejected (403)
- ✅ Duplicate submission prevented (400)

#### **Step 4.3: Test Feedback Retrieval**
**Actions**:
1. Get feedback for specific auction
2. Get feedback received by user
3. Get feedback given by user
4. Verify average rating calculation

**Expected Results**:
- ✅ Feedback list returned (200)
- ✅ Average rating calculated correctly
- ✅ Author/recipient information populated
- ✅ Pagination works correctly

---

## 📋 **Phase 5: Admin Panel Testing**

### **Objective**: Test admin functionality for flagged auctions and user management

#### **Step 5.1: Test Flagged Auction Management**
**Actions**:
1. Create auction with low winning bid (< 50% of starting price)
2. Verify auction is flagged automatically
3. Login as admin
4. View flagged auctions list
5. Resolve flagged auction

**Test Flag Resolution Data**:
```json
{
  "action": "approve",
  "notes": "Reviewed and approved. Low bid was legitimate due to item condition."
}
```

**Expected Results**:
- ✅ Auction automatically flagged
- ✅ Admin can view flagged auctions (200)
- ✅ Admin can resolve flags (200)
- ✅ Flag cleared after resolution

#### **Step 5.2: Test User Management**
**Actions**:
1. View all users as admin
2. Filter users by role
3. Filter users by status
4. Deactivate user account
5. Reactivate user account
6. Test deactivation restrictions

**Expected Results**:
- ✅ User list returned with statistics (200)
- ✅ Role and status filtering work
- ✅ User deactivated successfully (200)
- ✅ User reactivated successfully (200)
- ✅ Self-deactivation prevented (400)

#### **Step 5.3: Test Admin Dashboard**
**Actions**:
1. Get dashboard statistics
2. Verify all counts are correct
3. Check recent flagged auctions
4. Verify user and auction breakdowns

**Expected Results**:
- ✅ Dashboard stats returned (200)
- ✅ All counts accurate
- ✅ Breakdowns by role and status correct
- ✅ Recent flagged items listed

---

## 📋 **Phase 6: Integration Testing**

### **Objective**: Test complete auction flow from start to finish

#### **Step 6.1: Complete Auction Lifecycle**
**Actions**:
1. Register seller and create auction
2. Register buyer and place bids
3. Wait for auction to end
4. Verify winner determination
5. Exchange feedback between winner and seller
6. View final auction state

**Expected Results**:
- ✅ Complete workflow successful
- ✅ All state transitions correct
- ✅ Feedback system functional
- ✅ Data integrity maintained

#### **Step 6.2: Cross-Role Testing**
**Actions**:
1. Test buyer accessing seller endpoints
2. Test seller accessing buyer endpoints
3. Test regular user accessing admin endpoints
4. Test admin accessing all endpoints

**Expected Results**:
- ✅ All unauthorized access properly rejected (403)
- ✅ Role-based access control working
- ✅ Admin has access to all endpoints

---

## 📋 **Phase 7: Error Handling Testing**

### **Objective**: Test all failure scenarios and edge cases

#### **Step 7.1: Validation Error Testing**
**Actions**:
1. Test all endpoints with invalid JSON
2. Test missing required fields
3. Test invalid data types
4. Test out-of-range values

**Expected Results**:
- ✅ Proper 400 status codes
- ✅ Clear error messages
- ✅ No server crashes
- ✅ Consistent error format

#### **Step 7.2: Authentication Error Testing**
**Actions**:
1. Test protected endpoints without token
2. Test with invalid token
3. Test with expired token
4. Test with malformed token

**Expected Results**:
- ✅ Unauthorized access rejected (401)
- ✅ Clear authentication error messages
- ✅ No data leakage in errors

#### **Step 7.3: Edge Case Testing**
**Actions**:
1. Test with extremely large data
2. Test with special characters
3. Test concurrent operations
4. Test database connection failures

**Expected Results**:
- ✅ System handles edge cases gracefully
- ✅ Performance remains acceptable
- ✅ No data corruption
- ✅ Proper error logging

---

## ✅ **Success Criteria**

### **Phase Completion Checklist**
- [ ] Phase 1: All authentication tests pass
- [ ] Phase 2: All auction CRUD tests pass
- [ ] Phase 3: All bidding tests pass including race conditions
- [ ] Phase 4: All feedback tests pass
- [ ] Phase 5: All admin tests pass
- [ ] Phase 6: Complete integration flow works
- [ ] Phase 7: All error cases handled properly

### **Overall System Health**
- [ ] All 16 API endpoints functional
- [ ] All security rules enforced
- [ ] All business logic working
- [ ] All error scenarios handled
- [ ] Performance acceptable under load
- [ ] Data integrity maintained

### **Test Documentation**
- [ ] All test results documented
- [ ] Screenshots of key test results
- [ ] Performance metrics recorded
- [ ] Bug reports created for any failures
- [ ] Test environment setup documented

---

## 🛠 **Testing Tools & Commands**

### **Postman Setup**
```bash
# Import collection
# Set environment variables:
# base_url: http://localhost:3000/api
# buyer_token: <from login response>
# seller_token: <from login response>
# admin_token: <from login response>
```

### **Useful curl Commands**
```bash
# Test server health
curl http://localhost:3000/api/health

# Test concurrent bids (race condition)
curl -X POST http://localhost:3000/api/auctions/{id}/bids \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000}' &

# Test multiple simultaneous requests
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/auctions/{id}/bids \
    -H "Authorization: Bearer {token}" \
    -H "Content-Type: application/json" \
    -d '{"amount": 10000}' &
done
```

### **Database Verification**
```javascript
// Connect to MongoDB and verify
mongo mongodb://localhost:27017/bidzen

// Check collections
db.users.find().pretty()
db.auctions.find().pretty()
db.bids.find().pretty()
db.feedbacks.find().pretty()
```

This comprehensive testing plan ensures thorough validation of all BidZen API functionality with systematic coverage of all endpoints, business rules, and edge cases.
