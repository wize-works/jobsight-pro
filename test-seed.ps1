# Test Script for Flintstones Seed Data (PowerShell version)

Write-Host "🦕 Testing Flintstones Seed Data System..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Check if required environment variables are set
if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ Missing Supabase environment variables" -ForegroundColor Red
    Write-Host "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Environment variables found" -ForegroundColor Green

# Check if development server is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Development server already running" -ForegroundColor Green
} catch {
    Write-Host "🚀 Starting development server..." -ForegroundColor Blue
    
    # Start the development server in the background
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
    
    # Wait for server to start
    Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Check if server is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ Development server started" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to start development server" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎯 To test the seed data system:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "2. Sign up with a new account" -ForegroundColor White
Write-Host "3. Access the dashboard - you should see the setup form" -ForegroundColor White
Write-Host "4. Fill out the form and click 'Yabba-Dabba-Doo! Start Building'" -ForegroundColor White
Write-Host "5. Verify that Flintstones data appears in your dashboard" -ForegroundColor White
Write-Host ""
Write-Host "📊 Expected seed data:" -ForegroundColor Cyan
Write-Host "   • 5 crew members (Fred, Barney, Wilma, Betty, Bamm-Bamm)" -ForegroundColor White
Write-Host "   • 2 crews (Construction & Safety)" -ForegroundColor White
Write-Host "   • 2 clients (Slate Rock & Gravel, Bedrock City Planning)" -ForegroundColor White
Write-Host "   • 3 pieces of equipment (Bronto-Crane, Stone Roller, Pterodactyl)" -ForegroundColor White
Write-Host "   • 3 projects (Quarry Expansion, Street Reconstruction, Bridge)" -ForegroundColor White
Write-Host "   • 4 milestones and 4 tasks" -ForegroundColor White
Write-Host "   • 1 daily log and 1 invoice" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  Manual testing in browser console:" -ForegroundColor Cyan
Write-Host "   • window.testFlintstonesSeeding() - Run full test" -ForegroundColor White
Write-Host "   • window.cleanupTestData(businessId) - Clean up test data" -ForegroundColor White
Write-Host ""
Write-Host "Yabba-Dabba-Doo! Ready to test! 🏗️" -ForegroundColor Green

# Optionally open browser
$openBrowser = Read-Host "Open browser to http://localhost:3000? (y/n)"
if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
    Start-Process "http://localhost:3000"
}
