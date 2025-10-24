#!/bin/bash

echo "🚀 Starting NotebookLM Clone Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Pre-flight Checklist:${NC}"

# Check if MongoDB Atlas Vector Index is set up
echo -e "${YELLOW}⚠️  Make sure you've created the MongoDB Atlas Vector Search Index${NC}"
echo -e "   Index name: vector_index"
echo -e "   Collection: documents"
echo -e "   Dimensions: 384"
echo ""

# Check environment variables
echo -e "${BLUE}🔧 Checking environment variables...${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file found${NC}"
else
    echo -e "${RED}❌ .env file missing${NC}"
    exit 1
fi

# Check for required API keys
if grep -q "HF_API_KEY=" .env && grep -q "GROQ_API_KEY=" .env; then
    echo -e "${GREEN}✅ API keys configured${NC}"
else
    echo -e "${RED}❌ Missing API keys in .env${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔥 Starting Backend Server...${NC}"
echo -e "   Backend will run on: http://localhost:4000"
echo -e "   API Documentation: http://localhost:4000/health"
echo ""
echo -e "${YELLOW}📝 Next: Open a new terminal and run 'npm run start:frontend'${NC}"
echo ""

# Start the backend server
npm run dev