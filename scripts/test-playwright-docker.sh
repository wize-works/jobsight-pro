#!/bin/bash

# Playwright Docker Test Script
# This script tests the Playwright setup following official Docker documentation

echo "🧪 Testing Playwright Docker Setup..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Test 1: Check if Docker image exists
echo -e "${YELLOW}📦 Checking Docker image...${NC}"
docker image inspect jobsight-pro:latest > /dev/null 2>&1
print_status $? "Docker image exists"

# Test 2: Check if container can start
echo -e "${YELLOW}🚀 Testing container startup...${NC}"
CONTAINER_ID=$(docker run -d --init --ipc=host -p 3001:3000 jobsight-pro:latest)
sleep 10

if [ ! -z "$CONTAINER_ID" ]; then
    # Test 3: Check health endpoint
    echo -e "${YELLOW}🏥 Testing health endpoint...${NC}"
    curl -f http://localhost:3001/health > /dev/null 2>&1
    print_status $? "Health endpoint responding"
    
    # Test 4: Check PDF health endpoint
    echo -e "${YELLOW}📄 Testing PDF health endpoint...${NC}"
    curl -f http://localhost:3001/health/pdf > /dev/null 2>&1
    print_status $? "PDF health endpoint responding"
    
    # Test 5: Test actual PDF generation
    echo -e "${YELLOW}🎯 Testing PDF generation...${NC}"
    PDF_RESPONSE=$(curl -s -X POST http://localhost:3001/api/generate-pdf \
        -H "Content-Type: application/json" \
        -d '{
            "html": "<html><body><h1>Test PDF from Docker</h1><p>Generated on: '"$(date)"'</p></body></html>",
            "filename": "docker-test.pdf",
            "returnAsAttachment": false
        }')
    
    if echo "$PDF_RESPONSE" | grep -q "success.*true"; then
        print_status 0 "PDF generation working"
    else
        print_status 1 "PDF generation failed"
        echo "Response: $PDF_RESPONSE"
    fi
    
    # Test 6: Check container logs for errors
    echo -e "${YELLOW}📋 Checking container logs...${NC}"
    ERROR_COUNT=$(docker logs "$CONTAINER_ID" 2>&1 | grep -i "error\|failed\|crash" | wc -l)
    if [ "$ERROR_COUNT" -eq 0 ]; then
        print_status 0 "No errors in container logs"
    else
        print_status 1 "Found $ERROR_COUNT errors in logs"
        echo "Recent errors:"
        docker logs "$CONTAINER_ID" 2>&1 | grep -i "error\|failed\|crash" | tail -5
    fi
    
    # Cleanup
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    docker stop "$CONTAINER_ID" > /dev/null 2>&1
    docker rm "$CONTAINER_ID" > /dev/null 2>&1
    print_status 0 "Container cleaned up"
    
else
    print_status 1 "Container failed to start"
fi

echo ""
echo "======================================"
echo -e "${YELLOW}📊 Test Summary${NC}"
echo "======================================"
echo "If all tests passed, your Playwright Docker setup is working correctly!"
echo ""
echo "Next steps:"
echo "1. Deploy to your Kubernetes cluster"
echo "2. Test PDF generation in production"
echo "3. Monitor shared memory usage"
echo "4. Set up alerts for PDF generation failures"
echo ""
echo "For debugging, check:"
echo "- Docker logs: docker logs <container-id>"
echo "- Health endpoints: /health and /health/pdf"
echo "- Browser launch: Check PLAYWRIGHT_BROWSERS_PATH env var"
echo ""
echo -e "${GREEN}🎉 Playwright Docker testing complete!${NC}"
