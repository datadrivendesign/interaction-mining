#!/bin/bash

read -p "Use SSH for cloning? (y/n): " USE_SSH
if [[ "$USE_SSH" == "y" ]]; then
  REPO_URL="git@github.com:datadrivendesign/odim-frontend-next.git"
else
  REPO_URL="https://github.com/datadrivendesign/odim-frontend-next"
fi

# Clone the repo
echo "Cloning repository $REPO_URL..."
git clone "$REPO_URL"

REPO_NAME=$(basename "${REPO_URL%.git}")
echo "Repository cloned to $REPO_NAME"

# Move into the repo directory
cd "$REPO_NAME" || { echo "Failed to enter directory $REPO_NAME"; exit 1; }
echo $REPO_NAME

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo "npm is not installed. Please install Node.js and npm first."
  exit 1
fi

echo "Let's set up environment variables:"
read -p "MongoDB connection URI (DATABASE_URL): " DATABASE_URL
read -p "MongoDB database name (DATABASE_NAME): " DATABASE_NAME
read -p "AWS region: " AWS_REGION
read -p "AWS access key ID: " AWS_ACCESS_KEY_ID
read -p "AWS secret access key: " AWS_SECRET_ACCESS_KEY
read -p "AWS bucket prefix: " AWS_BUCKET_PREFIX
read -p "AWS bucket name: " AWS_BUCKET_NAME
read -p "AWS upload bucket: " AWS_UPLOAD_BUCKET
ENV_FILE=".env.local"

cat <<EOF > .env.local
DATABASE_NAME=$DATABASE_NAME
DATABASE_URL=$DATABASE_URL
AWS_REGION=$AWS_REGION
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
AWS_BUCKET_PREFIX=$AWS_BUCKET_PREFIX
AWS_BUCKET_NAME=$AWS_BUCKET_NAME
AWS_UPLOAD_BUCKET=$AWS_UPLOAD_BUCKET
DB_NAME=$DB_NAME
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
EOF

echo "Environment variables have been set in $ENV_FILE"

# Install dependencies
echo "Installing dependencies..."
npm install


# --- Mobile App Setup ---

cd ..

read -p "Use SSH for cloning? (y/n): " USE_SSH
if [[ "$USE_SSH" == "y" ]]; then
  Mobile_REPO_URL="git@github.com:datadrivendesign/mobile-odim.git"
else
  Mobile_REPO_URL="https://github.com/datadrivendesign/mobile-odim.git"
fi

Mobile_REPO_NAME=$(basename "$Mobile_REPO_URL" .git)


# Clone the mobile app repo
echo "Cloning mobile app repository $Mobile_REPO_URL..."
git clone "$Mobile_REPO_URL"

cd "$Mobile_REPO_NAME" || { echo "Failed to enter directory $Mobile_REPO_NAME"; exit 1; }

API_FILE="app/src/main/java/edu/illinois/odim/utils/LocalStorageOps.kt"

if [ -f "$API_FILE" ]; then
  echo "Updating BASE_URL in $API_FILE"
  sed -i.bak "s|val BASE_URL = \".*\"|val BASE_URL = \"$API_BASE_URL\"|" "$API_FILE"
else
  echo "ERROR: Could not find $API_FILE"
  exit 1
fi

echo "Building APK..."
chmod +x ./gradlew
./gradlew assembleDebug

cd ..

echo ""
echo "ODIM Setup Complete!"
echo "Frontend: cd odim-frontend-next && npm run dev"
echo "Mobile APK: odim-mobile/app/build/outputs/apk/debug/app-debug.apk"


# Start the development server
echo "Starting development server..."
cd $REPO_NAME
npm run dev