# Test Script for Flintstones Seed Data

# Run this script to test the seeding functionality
# Make sure your Supabase environment variables are set

echo "🦕 Testing Flintstones Seed Data System..."
echo "================================================"

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing Supabase environment variables"
    echo "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "✅ Environment variables found"

# Start the development server in the background if not running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "🚀 Starting development server..."
    npm run dev &
    SERVER_PID=$!
    
    # Wait for server to start
    echo "⏳ Waiting for server to start..."
    sleep 10
    
    # Check if server is running
    if ! curl -s http://localhost:3000 > /dev/null; then
        echo "❌ Failed to start development server"
        exit 1
    fi
    
    echo "✅ Development server started"
else
    echo "✅ Development server already running"
fi

echo ""
echo "🎯 To test the seed data system:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Sign up with a new account"
echo "3. Access the dashboard - you should see the setup form"
echo "4. Fill out the form and click 'Yabba-Dabba-Doo! Start Building'"
echo "5. Verify that Flintstones data appears in your dashboard"
echo ""
echo "📊 Expected seed data:"
echo "   • 5 crew members (Fred, Barney, Wilma, Betty, Bamm-Bamm)"
echo "   • 2 crews (Construction & Safety)"
echo "   • 2 clients (Slate Rock & Gravel, Bedrock City Planning)"
echo "   • 3 pieces of equipment (Bronto-Crane, Stone Roller, Pterodactyl)"
echo "   • 3 projects (Quarry Expansion, Street Reconstruction, Bridge)"
echo "   • 4 milestones and 4 tasks"
echo "   • 1 daily log and 1 invoice"
echo ""
echo "🛠️  Manual testing in browser console:"
echo "   • window.testFlintstonesSeeding() - Run full test"
echo "   • window.cleanupTestData(businessId) - Clean up test data"
echo ""
echo "Yabba-Dabba-Doo! Ready to test! 🏗️"
