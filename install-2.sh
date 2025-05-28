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
echo -e "${BLUE}Checking if the following dependencies are installed on your system:${NC}"
echo ""
echo "Web Requirements:"
echo "  - Node.js (v16 or v18 recommended)"
echo "  - npm"
echo ""

# Ensure Node.js version (>=16.0.0) is installed using nvm or brew
MIN_NODE_MAJOR=16
INSTALL_NODE_VERSION="lts/*"

if command -v node &>/dev/null; then
  NODE_VERSION=$(node -v | sed 's/v//')
  IFS='.' read -r NODE_MAJOR NODE_MINOR NODE_PATCH <<< "$NODE_VERSION"
  if (( NODE_MAJOR < MIN_NODE_MAJOR )); then
    echo -e "${YELLOW}Node.js version $NODE_VERSION is too low. Installing a newer version...${NC}"
    INSTALL_NODE=true
  else
    echo -e "${GREEN}✔ Node.js version $NODE_VERSION detected.${NC}"
    INSTALL_NODE=false
  fi
else
  echo -e "${YELLOW}Node.js is not installed. Installing...${NC}"
  INSTALL_NODE=true
fi


if [[ "$INSTALL_NODE" = true ]]; then
  if command -v brew &>/dev/null; then
    echo "Installing Node.js using brew..."
    brew install node
  else
    echo -e "${RED}brew is not installed. Please install brew to proceed.${NC}"
    exit 1
  fi
fi

# Ensure npm is available
if ! command -v npm &>/dev/null; then
  echo -e "${RED}npm is not available after installing Node.js. Please check your installation.${NC}"
  exit 1
fi
echo -e "${GREEN}✔ npm detected.${NC}"

echo -e "${BLUE}👉 Do you want to continue with setup? (y/n):${NC} \c"
read CONTINUE < /dev/tty
if [[ "$CONTINUE" != "y" ]]; then
  echo "Exiting setup. Please install required dependencies first."
  exit 1
fi

print_section "Starting ODIM Setup"
# --- Frontend Setup ---

# grep the IP address of the computer
IP_ADDRESS=ifconfig | grep -Eo 'inet (192\.168\.[0-9]+\.[0-9]+|10\.[0-9]+\.[0-9]+\.[0-9]+)' | awk '{ print $2 }'

if [[ -z $IP_ADDRESS ]]; then
  echo -e "${YELLOW}Local IP Address not found. Please enter it manually.${NC}"
  echo -e "${BLUE}👉 IP address (IP_ADDRESS):${NC} \c"
  read IP_ADDRESS < /dev/tty
fi

# try to install MinIO via Docker
step "Set Up Docker and MinIO"
# Check if Docker is installed
if ! command -v docker &>/dev/null; then
  echo -e "${YELLOW}Docker is not installed. Attempting to install Docker...${NC}"
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS: install Docker via Homebrew
    if ! command -v brew &>/dev/null; then
      echo -e "${RED}Homebrew is not installed. Please install Homebrew first: https://brew.sh${NC}"
      exit 1
    fi

    brew install --cask docker
    echo -e "${YELLOW}Docker installed. Opening Docker...${NC}"
    open -a Docker
  else
    echo -e "${RED}Please install Docker manually for your platform: https://docs.docker.com/get-docker/${NC}"
    exit 1
  fi
fi

# Wait for Docker daemon to start
echo -e "${BLUE}Waiting for Docker to start...${NC}"
SPINNER='|/-\'
i=0
MAX_WAIT=60
SECONDS_WAITED=0

while ! docker info &>/dev/null; do
  i=$(( (i+1) % 4 ))
  printf "\b${SPINNER:$i:1}"
  sleep 1
  SECONDS_WAITED=$((SECONDS_WAITED+1))
  if (( SECONDS_WAITED >= MAX_WAIT )); then
    echo -e "\n${RED}Docker did not start within $MAX_WAIT seconds. Please make sure Docker is running.${NC}"
    exit 1
  fi
done
echo -e "${GREEN}✔ Docker is running.${NC}"

# set up MinIO username and password
echo "Let's set up your minio username and password (or press enter to set user and pwd as default \'admin\' and \'password\'):"
echo -e "${BLUE}👉 MinIO root username (USERNAME):${NC} \c"
read USERNAME < /dev/tty
if [[ -z $USERNAME ]]; then
  USERNAME="admin"
fi

echo -e "${BLUE}👉 MongoDB root password (PASSWORD):${NC} \c"
read PASSWORD < /dev/tty
if [[ -z $PASSWORD ]]; then
  PASSWORD="password"
fi

# Generate docker-compose.yml for MinIO
cat <<EOF > docker-compose.yml
version: '3.7'

volumes:
  minio_data:

services:
  minio:
    image: quay.io/minio/minio:latest
    container_name: minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: $USERNAME
      MINIO_ROOT_PASSWORD: $PASSWORD
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
EOF
echo -e "${GREEN}✔ docker-compose.yml for MinIO created.${NC}"

echo -e "${BLUE}Starting Docker container with MinIO${NC}"
docker compose up -d
docker compose logs minio
echo -e "${GREEN}MinIO is now running. You can access the console at: http://$IP_ADDRESS:9001${NC}"

# Check if mc (MinIO Client) is installed
if ! command -v mc &>/dev/null; then
  echo -e "${YELLOW}MinIO Client (mc) is not installed. Attempting to install...${NC}"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v brew &>/dev/null; then
      echo -e "${RED}Homebrew is not installed. Please install Homebrew to continue.${NC}"
      exit 1
    fi
    brew install minio/stable/mc
  else
    echo -e "${RED}Please install MinIO Client (mc) manually: https://min.io/docs/minio/linux/reference/minio-mc.html${NC}"
    exit 1
  fi
fi
echo -e "${GREEN}✔ MinIO Client (mc) detected.${NC}"
# Configure mc alias for local MinIO
mc alias set localminio "http://localhost:9000" "$USERNAME" "$PASSWORD"

# Prompt user for bucket name
echo -e "${BLUE}👉 Enter bucket name to create in MinIO:${NC} \c"
read BUCKET < /dev/tty
if [[ -z "$BUCKET" ]]; then
  BUCKET="odim-bucket"
fi

# Create bucket and set anonymous read+write policy
mc mb localminio/"$BUCKET"
mc anonymous set download localminio/"$BUCKET"
mc anonymous set upload localminio/"$BUCKET"
echo -e "${GREEN}✔ Bucket '$BUCKET' created with anonymous read/write access.${NC}"



# Check if mongo is installed locally
step "MongoDB Setup"
if ! command -v mongsh &>/dev/null; then
  echo -e "${YELLOW}Mongo Community Edition is not installed. Attempting to install...${NC}"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v brew &>/dev/null; then
      echo -e "${RED}Homebrew is not installed. Please install Homebrew to continue.${NC}"
      exit 1
    fi
    brew tap mongodb/brew
    brew install mongodb-community@8.0
  else
    echo -e "${RED}Please install MongoDB Client manually: https://www.mongodb.com/docs/manual/administration/install-on-linux/${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}✔ MongoDB is already installed.${NC}"
fi

# create a mongo.conf file
DIR=$(pwd)
cat <<EOF > mongo.conf
storage:
  dbPath: "$DIR"/db
net:
  bindIp: 127.0.0.1
  port: 27017
EOF

# Start mongod in the background with replica set
mongod --config mongo.conf --replSet rs0 --fork --logpath "mongo.log"
# Wait for MongoDB to be ready
until mongosh --eval "db.adminCommand('ping')" &>/dev/null; do
  echo -n "."
  sleep 1
done
echo -e "\n${GREEN}✔ MongoDB is up.${NC}"
# Check if replica set is already initiated
IS_INITIATED=$(mongosh --quiet --eval "try { rs.status().ok } catch (e) { 0 }")

if [[ "$IS_INITIATED" != "1" ]]; then
  echo -e "${BLUE}Replica set not initialized. Initiating...${NC}"
  mongosh --eval "rs.initiate()"
  echo -e "${GREEN}✔ Replica set initialized.${NC}"
else
  echo -e "${GREEN}✔ Replica set already initialized.${NC}"
fi
# Prompt for database name and create db
echo -e "${BLUE}👉 Create a MongoDB database name (DATABASE_NAME):${NC} \c"
read DATABASE_NAME < /dev/tty
mongosh --eval "use $DATABASE_NAME"
CLEANUP_DIRS+=("db")

# Clone web app repository
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

step "Installing frontend dependencies"
# Install dependencies
echo "Installing dependencies..."
npm install

step "Let\'s set up environment variables:"
DATABASE_URL="mongodb://$IP_ADDRESS:27017/$DATABASE_NAME"
echo -e "${GREEN}👉 MongoDB connection URI set:${NC} $DATABASE_URL \c"
AWS_REGION="us-east-1"
echo -e "${GREEN}👉 AWS region set:${NC} $AWS_REGION \c"
AWS_ACCESS_KEY_ID="$USERNAME"
echo -e "${GREEN}👉 AWS Access Key set:${NC} $AWS_ACCESS_KEY_ID \c"
AWS_SECRET_ACCESS_KEY="$PASSWORD"
echo -e "${GREEN}👉 AWS Access Key set:${NC} $AWS_ACCESS_KEY_ID \c"
AWS_UPLOAD_BUCKET="$BUCKET"
echo -e "${GREEN}👉 AWS Upload Bucket set:${NC} $AWS_UPLOAD_BUCKET \c"

NEXT_PUBLIC_DEPLOYMENT_URL="http://$IP_ADDRESS:3000"
echo -e "${GREEN}👉 Web Deployment URL set:${NC} \c"
if ! NEXTAUTH_SECRET=$(npx auth secret 2>/dev/null); then
  echo -e "${RED}Failed to generate NextAuth secret. Please check if next-auth is installed.${NC}"
  exit 1
else 
  echo -e "${GREEN}👉 NextAuth secret set:${NC} $NEXTAUTH_SECRET \c"
fi

echo -e "${YELLOW}⚠️  Google OAuth setup must be completed manually.${NC}"
echo "See further details in INSTRUCTIONS.md"
echo "Visit https://console.cloud.google.com/apis/credentials"
echo "1. Create an OAuth Client ID"
echo "2. Add your redirect URI: $NEXT_PUBLIC_DEPLOYMENT_URL/api/auth/callback/google"
echo "3. Add the credentials to your .env or Amplify environment settings"
echo -e "${BLUE}👉 Google client ID:${NC} \c"
read GOOGLE_CLIENT_ID < /dev/tty
echo -e "${BLUE}👉 Google client secret:${NC} \c"
read GOOGLE_CLIENT_SECRET < /dev/tty

ENV_FILE=".env.local"

cat <<EOF > .env.local
# >>>>> Localhost configuration
NEXT_PUBLIC_DEPLOYMENT_URL=$NEXT_PUBLIC_DEPLOYMENT_URL

# >>>>> Database configuration
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

cd ..
# Ask if user wants to install Android app
echo -e "${BLUE}Next step is building and setting up Android app. Do you want to continue this step? (Y/n):${NC} \c"
read USE_ANDROID < /dev/tty
if [[ -z "$USE_ANDROID" ]]; then
  USE_ANDROID="y"
fi
# --- Mobile App Setup ---
if [[ "$USE_ANDROID" == "y" ]]; then
  echo "Mobile (Android) Requirements:"
  echo "  Android Studio and ensure you install:"
  echo "     - Android SDK Platform 34"
  echo "     - Android SDK Build-Tools 30.0.3 or higher"
  echo "     - Kotlin Plugin v1.7.20"
  print_section "Check Prerequisites"
  echo -e "${BLUE}Checking if the following dependencies are installed on your system:${NC}"

  SHELL_NAME=$(basename "$SHELL") 
  if [[ "$SHELL_NAME" == "zsh" ]]; then
    PROFILE_FILE="$HOME/.zprofile"
  else
    PROFILE_FILE="$HOME/.bash_profile"
  fi
  # Verify Java
  if ! command -v java &> /dev/null; then
    echo -e "${YELLOW}Java JDK is not installed. Attempting to install Java...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
      if ! command -v brew &> /dev/null; then
        echo -e "${RED}Homebrew is not installed. Please install Homebrew first: https://brew.sh${NC}"
        exit 1
      fi
      brew install openjdk@17
      if ! grep -q 'JAVA_HOME.*openjdk@17' "$PROFILE_FILE"; then
        echo 'export JAVA_HOME="/opt/homebrew/opt/openjdk@17"' >> "$PROFILE_FILE"
        echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> "$PROFILE_FILE"
      fi
      source "$PROFILE_FILE"
    else
      echo -e "${RED}Please install Java JDK 17 manually for your platform.${NC}"
      exit 1
    fi
  fi

  JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}')
  echo -e "${GREEN}✔ Java version $JAVA_VERSION detected.${NC}"

  JAVA_MAJOR=$(echo "$JAVA_VERSION" | cut -d. -f1)
  if (( JAVA_MAJOR < 17 )); then
    echo -e "${RED}Java JDK 17 or later is required. Found $JAVA_VERSION.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✔ Java JDK meets minimum version requirement.${NC}"

  # set up Android SDK
  if [ -z "$ANDROID_HOME" ]; then
    DEFAULT_SDK_PATH="$HOME/Library/Android/sdk"
    if [ -d "$DEFAULT_SDK_PATH" ]; then
      ANDROID_HOME="$DEFAULT_SDK_PATH"
    else
      echo -e "${YELLOW}Android SDK not found. Attempting to install via sdkmanager...${NC}"
      INSTALL_SDK=true
    fi
  else
    echo -e "${GREEN}✔ ANDROID_HOME is set: $ANDROID_HOME${NC}"
  fi
  if [[ "$INSTALL_SDK" = true ]]; then
    if ! command -v sdkmanager &>/dev/null; then
      echo -e "${YELLOW}sdkmanager not found. Attempting to install cmdline-tools...${NC}"
      brew install --cask android-commandlinetools
      
      # Set up expected directory structure for sdkmanager
      mkdir -p "$DEFAULT_SDK_PATH/cmdline-tools/latest"

      # Move the downloaded tools into 'latest' (may vary based on brew version)
      # Attempt to find the installed folder automatically
      CMDLINE_TOOLS_SRC=$(find "$DEFAULT_SDK_PATH/cmdline-tools" -maxdepth 1 -type d ! -name "latest" ! -name "." | head -n 1)
      if [ -d "$CMDLINE_TOOLS_SRC" ] && [ ! -d "$DEFAULT_SDK_PATH/cmdline-tools/latest" ]; then
        mv "$CMDLINE_TOOLS_SRC"/* "$DEFAULT_SDK_PATH/cmdline-tools/latest/"
        rm -rf "$CMDLINE_TOOLS_SRC"
      fi

      echo -e "${BLUE}👉 Do you accept all Android SDK licenses required for setup? (y/n):${NC} \c"
      read ACCEPT_LICENSES < /dev/tty
      if [[ "$ACCEPT_LICENSES" =~ ^[Yy]$ ]]; then
        sdkmanager --licenses
      else
        echo -e "${RED}You must accept the licenses to continue.${NC}"
        exit 1
      fi
      echo -e "${BLUE}👉 Do you want to install required Android SDK packages now? (y/n):${NC} \c"
      read INSTALL_SDK_COMPONENTS < /dev/tty
      if [[ "$INSTALL_SDK_COMPONENTS" == "y" ]]; then
        # Install necessary SDK components
        sdkmanager --sdk_root="$DEFAULT_SDK_PATH" "platform-tools" "platforms;android-34" "build-tools;34.0.0"
      else
        echo -e "${RED}Required SDK components not installed. Exiting.${NC}"
        exit 1
      fi
      if ! grep -q 'ANDROID_HOME' "$PROFILE_FILE"; then
        echo 'export ANDROID_HOME="'"$DEFAULT_SDK_PATH"'"' >> "$PROFILE_FILE"
      fi
      if ! grep -q 'cmdline-tools/latest/bin' "$PROFILE_FILE"; then
        echo 'export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"' >> "$PROFILE_FILE"
      fi
      source "$PROFILE_FILE"
    else
      mkdir -p "$DEFAULT_SDK_PATH/cmdline-tools/latest"
      yes | sdkmanager --sdk_root="$DEFAULT_SDK_PATH" "platform-tools" "platforms;android-34" "build-tools;34.0.0"
      if ! grep -q 'ANDROID_HOME' "$PROFILE_FILE"; then
        echo 'export ANDROID_HOME="'"$DEFAULT_SDK_PATH"'"' >> "$PROFILE_FILE"
      fi
      if ! grep -q 'cmdline-tools/latest/bin' "$PROFILE_FILE"; then
        echo 'export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"' >> "$PROFILE_FILE"
      fi
      source "$PROFILE_FILE"
    fi
  fi

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

  # Generate local.properties
  echo -e "${BLUE}👉 Android SDK directory detected at $DEFAULT_SDK_PATH. Use this path? (Y/n):${NC} \c"
  read CONFIRM_SDK_PATH < /dev/tty
  if [[ "$CONFIRM_SDK_PATH" =~ ^[Nn]$ ]]; then
    echo -e "${BLUE}👉 Please enter your Android SDK path:${NC} \c"
    read DEFAULT_SDK_PATH < /dev/tty
  fi
  echo "sdk.dir=$DEFAULT_SDK_PATH" > local.properties

  echo "Let's set up the URL domain where the Android app will upload to:"
  API_URL_PREFIX="http://$IP_ADDRESS:3000"
  echo -e "${Green}👉 API URL Prefix:${NC} $API_URL_PREFIX  \c"


  step "Building mobile APK"
  set +e
  echo "Building APK..."
  chmod +x ./gradlew
  # Quote the variable to handle special characters or spaces
  ./gradlew assembleDebug -PAPI_URL_PREFIX="$API_URL_PREFIX"

  set -e

  cd ..

  print_section "Setup Complete"
  echo -e "${GREEN}✅ Mobile APK:${NC} odim-mobile/app/build/outputs/apk/debug/app-debug.apk"
else
  echo -e "${BLUE}Skipping Android mobile app set up."
fi

trap - EXIT

# Start the development server
echo -e "${GREEN}✅ Frontend:${NC} cd odim-frontend-next && npm run dev"
echo "Starting development server..."
cd $REPO_NAME
npm run dev -- -H 0.0.0.0
