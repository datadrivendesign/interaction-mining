#!/bin/bash

# Hardcoded repo URL
REPO_URL="https://github.com/data-driven-design/odim-frontend-next"
REPO_NAME=$(basename "$REPO_URL" .git)

# Clone the repo
echo "Cloning repository $REPO_URL..."
git clone "$REPO_URL"

# Move into the repo directory
cd "$REPO_NAME" || { echo "Failed to enter directory $REPO_NAME"; exit 1; }

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo "npm is not installed. Please install Node.js and npm first."
  exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Start the development server
echo "Starting development server..."
npm run dev