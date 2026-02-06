#!/bin/bash

# CatalogIt Authentication Test Script
# This script tests the authentication endpoints

echo "🚀 CatalogIt Authentication Test Script"
echo "========================================"
echo ""

BASE_URL="http://localhost:3000/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Signup
echo -e "${BLUE}Test 1: User Signup${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "username": "testuser'$RANDOM'",
      "email": "test'$RANDOM'@example.com",
      "password": "password123",
      "password_confirmation": "password123"
    }
  }')

echo "$SIGNUP_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SIGNUP_RESPONSE"

# Extract token
TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Signup failed - no token received${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Signup successful! Token received.${NC}"
fi

echo ""
echo "---"
echo ""

# Test 2: Get Current User
echo -e "${BLUE}Test 2: Get Current User (with token)${NC}"
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "$ME_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ME_RESPONSE"

if echo "$ME_RESPONSE" | grep -q '"user"'; then
  echo -e "${GREEN}✅ Authentication working!${NC}"
else
  echo -e "${RED}❌ Authentication failed${NC}"
fi

echo ""
echo "---"
echo ""

# Test 3: Create a Private List (requires authentication)
echo -e "${BLUE}Test 3: Create Private List (authenticated)${NC}"
LIST_RESPONSE=$(curl -s -X POST "$BASE_URL/lists" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "list": {
      "title": "My Test List",
      "description": "Testing authentication",
      "visibility": "private"
    }
  }')

echo "$LIST_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LIST_RESPONSE"

if echo "$LIST_RESPONSE" | grep -q '"id"'; then
  echo -e "${GREEN}✅ List created successfully!${NC}"
  LIST_ID=$(echo "$LIST_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
else
  echo -e "${RED}❌ List creation failed${NC}"
  exit 1
fi

echo ""
echo "---"
echo ""

# Test 4: Try to create list without authentication (should fail)
echo -e "${BLUE}Test 4: Create List Without Auth (should fail)${NC}"
UNAUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/lists" \
  -H "Content-Type: application/json" \
  -d '{
    "list": {
      "title": "Unauthorized List",
      "description": "This should fail",
      "visibility": "public"
    }
  }')

echo "$UNAUTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$UNAUTH_RESPONSE"

if echo "$UNAUTH_RESPONSE" | grep -q "Unauthorized"; then
  echo -e "${GREEN}✅ Authorization working! Unauthenticated request blocked.${NC}"
else
  echo -e "${RED}❌ Authorization not working - unauthenticated request succeeded${NC}"
fi

echo ""
echo "---"
echo ""

# Test 5: View public lists (no auth required)
echo -e "${BLUE}Test 5: View Public Lists (no auth required)${NC}"
PUBLIC_RESPONSE=$(curl -s -X GET "$BASE_URL/lists")

echo "$PUBLIC_RESPONSE" | python3 -m json.tool 2>/dev/null | head -20 || echo "$PUBLIC_RESPONSE" | head -20

if [ -n "$PUBLIC_RESPONSE" ]; then
  echo -e "${GREEN}✅ Public lists accessible without auth${NC}"
else
  echo -e "${RED}❌ Failed to fetch public lists${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}🎉 Authentication tests complete!${NC}"
echo ""
echo "Your JWT Token (save for manual testing):"
echo "$TOKEN"
echo ""
echo "To use this token in curl:"
echo "curl -H \"Authorization: Bearer $TOKEN\" $BASE_URL/lists"
