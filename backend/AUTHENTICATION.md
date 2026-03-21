# CatalogIt Authentication System

*Unchanged March 20, 2026 — JWT/MFA behavior stable.*

## Overview

CatalogIt uses **JWT (JSON Web Token)** authentication for securing API endpoints. This document explains how to use the authentication system.

---

## Authentication Endpoints

### 1. User Signup

**Endpoint:** `POST /api/v1/auth/signup`

**Description:** Create a new user account

**Request Body:**
```json
{
  "user": {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePassword123!",
    "password_confirmation": "SecurePassword123!"
  }
}
```

**Success Response (201 Created):**
```json
{
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "errors": [
    "Email has already been taken",
    "Password is too short (minimum is 6 characters)"
  ]
}
```

---

### 2. User Login

**Endpoint:** `POST /api/v1/auth/login`

**Description:** Authenticate existing user and get token

**Request Body:**
```json
{
  "user": {
    "email": "john@example.com",
    "password": "SecurePassword123!"
  }
}
```

**Success Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Invalid email or password"
}
```

---

### 3. Get Current User

**Endpoint:** `GET /api/v1/auth/me`

**Description:** Get current authenticated user's information

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Success Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

---

## Using Authentication Tokens

### 1. Store the Token

After successful signup or login, store the JWT token securely:
- **Frontend (React):** Store in memory or secure storage (not localStorage for XSS protection)
- **Mobile App:** Use secure storage (Keychain on iOS, KeyStore on Android)
- **Testing:** Can use a variable or environment variable

### 2. Include Token in Requests

For all protected endpoints, include the token in the `Authorization` header:

```bash
curl -X GET http://localhost:3000/api/v1/lists \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Token Expiration

- Tokens expire after **24 hours** by default
- When a token expires, you'll receive a `401 Unauthorized` response
- User must login again to get a new token

---

## Protected vs. Public Endpoints

### 🔓 Public Endpoints (No Authentication Required)

#### Lists
- `GET /api/v1/lists` - View all public lists
- `GET /api/v1/lists/:id` - View a specific public list

#### Items
- `GET /api/v1/lists/:list_id/items` - View items in a public list
- `GET /api/v1/items/:id` - View a specific item (if parent list is public)

### 🔒 Protected Endpoints (Authentication Required)

#### Lists
- `POST /api/v1/lists` - Create a new list (user must be authenticated)
- `PATCH /api/v1/lists/:id` - Update a list (user must own the list)
- `DELETE /api/v1/lists/:id` - Delete a list (user must own the list)

#### Items
- `POST /api/v1/lists/:list_id/items` - Create item (user must own parent list)
- `PATCH /api/v1/items/:id` - Update item (user must own parent list)
- `DELETE /api/v1/items/:id` - Delete item (user must own parent list)

### 🔐 Authorization Rules

1. **Viewing Lists:**
   - Public lists: Anyone can view
   - Private lists: Only the owner can view

2. **Viewing Items:**
   - Items in public lists: Anyone can view
   - Items in private lists: Only the list owner can view

3. **Creating/Updating/Deleting:**
   - User must be authenticated
   - User must own the parent list

---

## Testing Authentication

### Using cURL

#### 1. Signup
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "username": "testuser",
      "email": "test@example.com",
      "password": "password123",
      "password_confirmation": "password123"
    }
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "test@example.com",
      "password": "password123"
    }
  }'
```

#### 3. Create a List (with token)
```bash
TOKEN="YOUR_TOKEN_HERE"

curl -X POST http://localhost:3000/api/v1/lists \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "list": {
      "title": "My Private List",
      "description": "This is my personal catalog",
      "visibility": "private"
    }
  }'
```

### Using Postman

1. **Create a New Request**
2. **Set Authorization:**
   - Type: Bearer Token
   - Token: Paste your JWT token
3. **Make Request** to any protected endpoint

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Cause:** Missing or invalid token  
**Solution:** Login again to get a new token

### 403 Forbidden
```json
{
  "error": "Not authorized to modify this list"
}
```
**Cause:** User doesn't own the resource  
**Solution:** Only access your own resources

### 422 Unprocessable Entity
```json
{
  "errors": ["Email has already been taken"]
}
```
**Cause:** Validation failed  
**Solution:** Fix the request data according to error messages

---

## Security Best Practices

### For Development
1. Use HTTPS in production
2. Never commit tokens to version control
3. Use environment variables for secrets
4. Rotate tokens regularly

### For Frontend Integration
1. Store tokens securely (not in localStorage)
2. Clear tokens on logout
3. Handle token expiration gracefully
4. Use HTTPS for all API calls

### Password Requirements
- Minimum 6 characters (enforced by bcrypt)
- Should include uppercase, lowercase, numbers, and symbols (recommended)

---

## Implementation Details

### JWT Structure
```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3MDk4NTcyMDB9.signature
|        Header       |          Payload           |  Signature  |
```

### Token Payload
```json
{
  "user_id": 1,
  "exp": 1709857200
}
```

### Password Storage
- Passwords are hashed using **bcrypt**
- Never stored in plain text
- One-way encryption (cannot be reversed)

---

## Troubleshooting

### Problem: "Unauthorized" error even with valid token
**Solutions:**
1. Check token format: Must be `Bearer YOUR_TOKEN`
2. Verify token hasn't expired (24 hours)
3. Ensure token is from the same server

### Problem: Cannot create lists or items
**Solutions:**
1. Ensure you're authenticated
2. Check Authorization header is included
3. Verify token is valid

### Problem: Cannot view private lists
**Solutions:**
1. Private lists can only be viewed by their owner
2. Ensure you're logged in as the correct user
3. Check the list's visibility setting

---

---

### 4. Forgot Password

**Endpoint:** `POST /api/v1/auth/forgot_password`

**Description:** Request a password reset token. Returns a generic success message to prevent email enumeration. In development, the token is included in the response for demo convenience.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "message": "If an account exists with that email, a reset link has been sent.",
  "reset_token": "abc123..."
}
```

> Note: `reset_token` is only included in non-production environments.

---

### 5. Reset Password

**Endpoint:** `POST /api/v1/auth/reset_password`

**Description:** Reset a user's password using the token from the forgot password endpoint. Tokens expire after 1 hour.

**Request Body:**
```json
{
  "token": "abc123...",
  "password": "NewPassword123!",
  "password_confirmation": "NewPassword123!"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Password has been reset successfully. You can now log in."
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "error": "Reset token has expired. Please request a new one."
}
```

---

## Password Reset Flow

1. User clicks "Forgot Password" on the login page
2. User enters their email address
3. Backend generates a secure reset token (valid for 1 hour)
4. In production: email is sent with reset link
5. In development: token is returned in the API response
6. User clicks the reset link (`/reset-password?token=...`)
7. User enters and confirms new password
8. Backend validates token, updates password, clears token
9. User is redirected to login

---

## Next Steps

- [x] Authentication system implemented
- [x] Frontend integration complete
- [x] Password reset functionality added
- [ ] Implement refresh tokens (future)
- [ ] Add role-based admin permissions (future)

---

## Need Help?

- Review API documentation at: http://localhost:3000/api-docs
- Check logs in `backend/log/development.log`
- See [TESTING.md](TESTING.md) for test guide
