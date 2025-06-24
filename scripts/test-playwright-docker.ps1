# Playwright Docker Test Script (PowerShell)
# This script tests the Playwright setup following official Docker documentation

Write-Host "🧪 Testing Playwright Docker Setup..." -ForegroundColor Yellow
Write-Host "======================================"

# Function to print status
function Print-Status {
    param(
        [bool]$Success,
        [string]$Message
    )
    if ($Success) {
        Write-Host "✅ $Message" -ForegroundColor Green
    } else {
        Write-Host "❌ $Message" -ForegroundColor Red
    }
}

# Test 1: Check if Docker image exists
Write-Host "📦 Checking Docker image..." -ForegroundColor Yellow
$imageExists = docker image inspect jobsight-pro:latest 2>$null
Print-Status ($LASTEXITCODE -eq 0) "Docker image exists"

# Test 2: Check if container can start
Write-Host "🚀 Testing container startup..." -ForegroundColor Yellow
$containerId = docker run -d --init --ipc=host -p 3001:3000 jobsight-pro:latest 2>$null
Start-Sleep 10

if ($containerId) {
    # Test 3: Check health endpoint
    Write-Host "🏥 Testing health endpoint..." -ForegroundColor Yellow
    try {
        $healthResponse = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 10 -ErrorAction Stop
        Print-Status ($healthResponse.StatusCode -eq 200) "Health endpoint responding"
    } catch {
        Print-Status $false "Health endpoint responding"
    }
    
    # Test 4: Check PDF health endpoint
    Write-Host "📄 Testing PDF health endpoint..." -ForegroundColor Yellow
    try {
        $pdfHealthResponse = Invoke-WebRequest -Uri "http://localhost:3001/health/pdf" -TimeoutSec 10 -ErrorAction Stop
        Print-Status ($pdfHealthResponse.StatusCode -eq 200) "PDF health endpoint responding"
    } catch {
        Print-Status $false "PDF health endpoint responding"
    }
    
    # Test 5: Test actual PDF generation
    Write-Host "🎯 Testing PDF generation..." -ForegroundColor Yellow
    try {
        $testData = @{
            html = "<html><body><h1>Test PDF from Docker</h1><p>Generated on: $(Get-Date)</p></body></html>"
            filename = "docker-test.pdf"
            returnAsAttachment = $false
        } | ConvertTo-Json
        
        $pdfResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/generate-pdf" `
            -Method POST `
            -ContentType "application/json" `
            -Body $testData `
            -TimeoutSec 30 `
            -ErrorAction Stop
        
        $responseContent = $pdfResponse.Content | ConvertFrom-Json
        Print-Status ($responseContent.success -eq $true) "PDF generation working"
    } catch {
        Print-Status $false "PDF generation failed"
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Test 6: Check container logs for errors
    Write-Host "📋 Checking container logs..." -ForegroundColor Yellow
    $logs = docker logs $containerId 2>&1
    $errorLines = $logs | Where-Object { $_ -match "error|failed|crash" }
    if ($errorLines.Count -eq 0) {
        Print-Status $true "No errors in container logs"
    } else {
        Print-Status $false "Found $($errorLines.Count) errors in logs"
        Write-Host "Recent errors:" -ForegroundColor Yellow
        $errorLines | Select-Object -Last 5 | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    }
    
    # Cleanup
    Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
    docker stop $containerId | Out-Null
    docker rm $containerId | Out-Null
    Print-Status $true "Container cleaned up"
    
} else {
    Print-Status $false "Container failed to start"
}

Write-Host ""
Write-Host "======================================"
Write-Host "📊 Test Summary" -ForegroundColor Yellow
Write-Host "======================================"
Write-Host "If all tests passed, your Playwright Docker setup is working correctly!"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Deploy to your Kubernetes cluster"
Write-Host "2. Test PDF generation in production"
Write-Host "3. Monitor shared memory usage"
Write-Host "4. Set up alerts for PDF generation failures"
Write-Host ""
Write-Host "For debugging, check:"
Write-Host "- Docker logs: docker logs <container-id>"
Write-Host "- Health endpoints: /health and /health/pdf"
Write-Host "- Browser launch: Check PLAYWRIGHT_BROWSERS_PATH env var"
Write-Host ""
Write-Host "🎉 Playwright Docker testing complete!" -ForegroundColor Green
