#!/bin/bash
# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color

# Print a section header
print_section() {
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
}

# Print a numbered step
STEP=1
step() {
  echo -e "${YELLOW}[Step $STEP]${NC} $1"
  STEP=$((STEP+1))
}

set -e

SCRIPT_ROOT=$(pwd)
SCRIPT_ROOT=$(pwd)
CLEANUP_DIRS=()

cleanup_on_exit() {
  cd "$SCRIPT_ROOT"
  if [[ $EXIT_CODE ]]; then
    echo "An error occurred. Cleaning up..."
    for DIR in "${CLEANUP_DIRS[@]}"; do
      if [ -d "$DIR" ]; then
        echo "Removing $DIR"
        rm -rf "$DIR"
      fi
    done
  else
    echo "Script completed successfully."
  fi
}

trap 'EXIT_CODE=$?; cleanup_on_exit' EXIT

print_section "Check Prerequisites"
echo -e "${BLUE}Please ensure the following dependencies are installed on your system:${NC}"
echo ""
echo "Web Requirements:"
echo "  - Node.js (v16 or v18 recommended)"
echo "  - npm"
echo ""
echo "Mobile (Android) Requirements:"
echo "  Android Studio and ensure you install:"
echo "     - Android SDK Platform 34"
echo "     - Android SDK Build-Tools 30.0.3 or higher"
echo "     - Kotlin Plugin v1.7.20"

# Verify Node.js version (>=16.0.0)
if ! command -v node &> /dev/null; then
  echo -e "${RED}Node.js is not installed. Please install Node.js (v16 or higher).${NC}"
  exit 1
fi
NODE_VERSION=$(node -v | sed 's/v//')
IFS='.' read -r NODE_MAJOR NODE_MINOR NODE_PATCH <<< "$NODE_VERSION"
if (( NODE_MAJOR < 16 )); then
  echo -e "${RED}Node.js version 16.x or higher is required. Found $NODE_VERSION.${NC}"
  exit 1
fi
echo -e "${GREEN}✔ Node.js version $NODE_VERSION detected.${NC}"

# Verify npm
if ! command -v npm &> /dev/null; then
  echo -e "${RED}npm is not installed. Please install npm.${NC}"
  exit 1
fi
echo -e "${GREEN}✔ npm detected.${NC}"

# Verify Java
if ! command -v java &> /dev/null; then
  echo -e "${RED}Java JDK is not installed. Please install Java JDK.${NC}"
  exit 1
fi
JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}')
echo -e "${GREEN}✔ Java version $JAVA_VERSION detected.${NC}"

# Enforce minimum Java version (>=17)
JAVA_MAJOR=$(echo "$JAVA_VERSION" | cut -d. -f1)
if (( JAVA_MAJOR < 17 )); then
  echo -e "${RED}Java JDK 17 or later is required. Found $JAVA_VERSION.${NC}"
  exit 1
fi
echo -e "${GREEN}✔ Java JDK meets minimum version requirement.${NC}"


echo -e "${BLUE}👉 Do you want to continue with setup? (y/n):${NC} \c"
read CONTINUE < /dev/tty
if [[ "$CONTINUE" != "y" ]]; then
  echo "Exiting setup. Please install required dependencies first."
  exit 1
fi

print_section "Starting ODIM Setup"
# --- Frontend Setup ---

step "Cloning web app repository"
echo -e "${BLUE}👉 Use HTTP for cloning? (Y/n):${NC} \c"
read USE_HTTP < /dev/tty
if [[ -z "$USE_HTTP" ]]; then
  USE_HTTP="y"
fi
if [[ "$USE_HTTP" == "y" ]]; then
  REPO_URL="https://github.com/datadrivendesign/odim-frontend-next.git"
else
  REPO_URL="git@github.com:datadrivendesign/odim-frontend-next.git"
fi

# Clone the repo

echo "Cloning repository $REPO_URL..."
git clone "$REPO_URL" 

REPO_NAME=$(basename "${REPO_URL%.git}")
CLEANUP_DIRS+=("$REPO_NAME")
echo "Repository cloned to $REPO_NAME"


# Move into the repo directory
cd "$REPO_NAME" || { echo "Failed to enter directory $REPO_NAME"; exit 1; }

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo "npm is not installed. Please install Node.js and npm first."
  exit 1
fi
echo "Let's set up environment variables (or press enter to skip for now):"
echo -e "${BLUE}👉 MongoDB database name (DATABASE_NAME):${NC} \c"
read DATABASE_NAME < /dev/tty
echo -e "${BLUE}👉 MongoDB connection URI (DATABASE_URL):${NC} \c"
read DATABASE_URL < /dev/tty

echo -e "${BLUE}👉 AWS region:${NC} \c"
read AWS_REGION < /dev/tty
echo -e "${BLUE}👉 AWS access key ID:${NC} \c"
read AWS_ACCESS_KEY_ID < /dev/tty
echo -e "${BLUE}👉 AWS secret access key:${NC} \c"
read AWS_SECRET_ACCESS_KEY < /dev/tty
echo -e "${BLUE}👉 AWS upload bucket:${NC} \c"
read AWS_UPLOAD_BUCKET < /dev/tty

echo -e "${BLUE}👉 Enter the Web Deployment URL (e.g., http://192.168.x.x:3000 for local dev or https://your-domain.com):${NC} \c"
read NEXT_PUBLIC_DEPLOYMENT_URL < /dev/tty
echo -e "${BLUE}👉 NextAuth secret:${NC} \c"
read NEXTAUTH_SECRET < /dev/tty
echo -e "${BLUE}👉 Google client ID:${NC} \c"
read GOOGLE_CLIENT_ID < /dev/tty
echo -e "${BLUE}👉 Google client secret:${NC} \c"
read GOOGLE_CLIENT_SECRET < /dev/tty

ENV_FILE=".env.local"

cat <<EOF > .env.local
# >>>>> Localhost configuration
NEXT_PUBLIC_DEPLOYMENT_URL=$NEXT_PUBLIC_DEPLOYMENT_URL

# >>>>> Database configuration
DATABASE_NAME=$DATABASE_NAME
DATABASE_URL=$DATABASE_URL

# >>>>> AWS configuration
AWS_REGION=$AWS_REGION
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
AWS_UPLOAD_BUCKET=$AWS_UPLOAD_BUCKET

# >>>>> NextAuth configuration
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
EOF

echo "Environment variables have been set in $ENV_FILE"

step "Installing frontend dependencies"
# Install dependencies
echo "Installing dependencies..."
npm install


# --- Mobile App Setup ---

cd ..

step "Cloning mobile app repository"
echo -e "${BLUE}👉 Use HTTP for cloning? (Y/n):${NC} \c"
read USE_HTTP < /dev/tty
if [[ -z "$USE_HTTP" ]]; then
  USE_HTTP="y"
fi
if [[ "$USE_HTTP" == "y" ]]; then
  Mobile_REPO_URL="https://github.com/datadrivendesign/mobile-odim.git"
else
  Mobile_REPO_URL="git@github.com:datadrivendesign/mobile-odim.git"
fi

Mobile_REPO_NAME=$(basename "$Mobile_REPO_URL" .git)


# Clone the mobile app repo
CLEANUP_DIRS+=("$Mobile_REPO_NAME")
echo "Cloning mobile app repository $Mobile_REPO_URL..."
git clone "$Mobile_REPO_URL"
echo "Repository cloned to $Mobile_REPO_NAME"

cd "$Mobile_REPO_NAME" || { echo "Failed to enter directory $Mobile_REPO_NAME"; exit 1; }

# Ask user for SDK path if ANDROID_HOME is not already set
if [ -z "$ANDROID_HOME" ]; then
  echo -e "${BLUE}👉 Enter your Android SDK path (e.g., /home/yourname/Android/Sdk):${NC} \c"
  read SDK_PATH < /dev/tty

  # Fallback to default if empty
  if [ -z "$SDK_PATH" ]; then
    SDK_PATH="$HOME/Android/Sdk"
  fi

  export ANDROID_HOME="$SDK_PATH"
else
  SDK_PATH="$ANDROID_HOME"
fi

# Optional: add Android SDK tools to PATH
export PATH="$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools:$PATH"

# Generate local.properties
echo "sdk.dir=$SDK_PATH" > local.properties

echo "Let's set up the URL domain where the Android app will upload to (or press Enter to use the default ODIM URL):"
echo -e "${BLUE}👉 API URL Prefix:${NC} \c"
read API_URL_PREFIX < /dev/tty
# If user presses Enter, fall back to default
if [ -z "$API_URL_PREFIX" ]; then
  API_URL_PREFIX="https://pre-alpha.odim.app"
fi

step "Building mobile APK"
set +e
echo "Building APK..."
chmod +x ./gradlew
# Quote the variable to handle special characters or spaces
./gradlew assembleDebug -PAPI_URL_PREFIX="$API_URL_PREFIX"

set -e

cd ..

print_section "Setup Complete"
echo -e "${GREEN}✅ Frontend:${NC} cd odim-frontend-next && npm run dev"
echo -e "${GREEN}✅ Mobile APK:${NC} odim-mobile/app/build/outputs/apk/debug/app-debug.apk"

trap - EXIT

# Start the development server
echo "Starting development server..."
cd $REPO_NAME
npm run dev -- -H 0.0.0.0
