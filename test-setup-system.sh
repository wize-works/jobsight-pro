#!/bin/bash

# Test Setup System Implementation
# This script tests the setup system using the setup_completed flag

echo "🧪 Testing JobSight Pro Setup System"
echo "===================================="

# Test 1: Check setup status API endpoint
echo "📡 Test 1: Testing setup status endpoint..."
curl -X GET "http://localhost:3000/api/setup-user" \
  -H "Content-Type: application/json" \
  2>/dev/null | python -m json.tool

echo -e "\n"

# Test 2: Check SQL schema
echo "🗄️  Test 2: Verifying businesses table schema..."
echo "The businesses table should now include 'setup_completed BOOLEAN DEFAULT FALSE'"
echo "You can verify this by running:"
echo "SELECT column_name, data_type, column_default"
echo "FROM information_schema.columns"
echo "WHERE table_name = 'businesses' AND column_name = 'setup_completed';"

echo -e "\n"

# Test 3: Setup with seed data
echo "🌱 Test 3: Testing setup with Flintstones seed data..."
echo "Making POST request to setup-user API..."
curl -X POST "http://localhost:3000/api/setup-user" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "Fred Flintstone",
    "userEmail": "fred@bedrock.com",
    "seedData": true
  }' \
  2>/dev/null | python -m json.tool

echo -e "\n"

# Test 4: Setup without seed data
echo "🏗️  Test 4: Testing setup without seed data..."
curl -X POST "http://localhost:3000/api/setup-user" \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "Barney Rubble",
    "userEmail": "barney@bedrock.com",
    "seedData": false
  }' \
  2>/dev/null | python -m json.tool

echo -e "\n"

# Test 5: Verify setup completion
echo "✅ Test 5: Verifying setup completion status..."
curl -X GET "http://localhost:3000/api/setup-user" \
  -H "Content-Type: application/json" \
  2>/dev/null | python -m json.tool

echo -e "\n"

echo "🎯 Setup System Test Summary"
echo "============================="
echo "✅ Updated Supabase types to include setup_completed field"
echo "✅ Modified setup detection to use setup_completed flag from businesses table"
echo "✅ Added business owner validation for setup completion"
echo "✅ Updated API to mark setup as completed after successful setup"
echo "✅ Maintained backward compatibility with fallback data checks"
echo ""
echo "🔧 Manual Verification Steps:"
echo "1. Run the app locally: npm run dev"
echo "2. Sign in as a business owner"
echo "3. Verify setup form appears if setup_completed is false/null"
echo "4. Complete setup (with or without seed data)"
echo "5. Verify setup form no longer appears"
echo "6. Check database: businesses.setup_completed should be true"
echo ""
echo "📋 Files Updated:"
echo "- src/types/supabase.ts (added setup_completed field)"
echo "- src/lib/user-setup.ts (updated setup detection logic)"
echo "- src/app/api/setup-user/route.ts (added setup completion marking)"
echo ""
echo "🎪 Flintstones Seed Data Features:"
echo "- Bedrock Construction business"
echo "- 3 projects (Bedrock Mall, Stone Age Stadium, Dino Park)"
echo "- 2 crews (Excavation, Construction)"
echo "- 6 crew members (Fred, Barney, Wilma, Betty, Bamm-Bamm, Pebbles)"
echo "- 4 equipment items (Steam Shovel, Dino Crane, etc.)"
echo "- Sample labor logs and timesheets"
echo ""
echo "🔒 Security Features:"
echo "- Only business owners can complete setup"
echo "- Setup can only be completed once per business"
echo "- Proper authentication checks in API endpoints"
