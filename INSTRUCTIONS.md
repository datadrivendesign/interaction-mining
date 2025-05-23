# Setup Instructions

This guide walks you through setting up your own instance of the ODIM system, including external services and required tools.

## External Dependencies

### AWS S3

ODIM uses AWS S3 to store trace data.

1. Create an [AWS account](https://aws.amazon.com/free).
2. Generate an **Access Key ID** and **Secret Access Key** — save these securely.
3. Create a new **S3 bucket** and **note the bucket name**.
4. To make your traces public:
    - Go to your bucket → `Permissions` → turn **off** "Block all public access".
    - Configure **CORS** under `Permissions` with:

    ```json
    [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        // local testing requires local ip addresses, if deployed
        "AllowedOrigins": [
            "http://localhost:3000", 
            "http://192.168.x.x:3000", 
            "https://your-deployed-app.amplifyapp.com",
            "..."
        ],
        "ExposeHeaders": []
      }
    ]
    ```

📌 _Alternative_: You may use [MinIO](https://github.com/minio/minio) or [LocalStack](https://github.com/localstack/localstack) for local S3 emulation.

### MongoDB

Trace metadata is stored in a MongoDB database.

1. Create a [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) account.
2. Create a database cluster.
3. Set up a **database user** under `Database Access` → "Add New Database User".
4. Get your **connection string**:
    - Go to your cluster → `Connect` → choose **Drivers**.
    - Copy the connection string and replace `<username>` and `<password>`.
    - Save the full string securely.
    - Follow the [connection string guide](https://www.mongodb.com/resources/products/fundamentals/mongodb-connection-string)

📈 _Local alternative_: Install [MongoDB Community Edition](https://www.mongodb.com/try/download/community) and follow the [local connection string guide](https://www.mongodb.com/resources/products/fundamentals/mongodb-connection-string).

### NextAuth with Google OAuth

We use [Auth.js](https://authjs.dev/) with Google OAuth to handle authentication.

1. Generate a `NEXTAUTH_SECRET` by running:

    ```bash
    npx next-auth secret
    ```

    Save the generated secret.
2. Set up a Google OAuth app:
    - Go to [Google Cloud Console](https://console.cloud.google.com/).
    - Create a new project.
    - Go to `APIs & Services` → `OAuth consent screen`:
        - Set user type to **External**
        - Add scopes: `email`, `profile`, `openid`
    - Go to `Credentials` → `Create Credentials` → `OAuth client ID`
        - Application type: **Web Application**
        - Redirect URI: `http://localhost:3000/api/auth/callback/google` (or your deployed domain)
3. Save your **Client ID** and **Client Secret**.

📖 [Detailed setup guide](https://developers.google.com/identity/protocols/oauth2)

### ⚙️ Local Dependencies to Run the Script

#### Node.js (Web App)

Our web interface uses **Next.js**, which requires Node.js (v16 or v18).

- Check if node exists and what version: `node -v`
- [Download Node.js](https://nodejs.org/en/download)

#### Android Studio + Java (Mobile App)

To build the Android app:

1. Install [Android Studio](https://developer.android.com/studio)
2. Install **SDK 34** via `Tools > SDK Manager`
   - *Take note of the **Android SDK path** shown in the SDK Manager — you'll need to provide this when running the build script.*
3. Install **Java JDK 18**:
    - Go to `Settings > Build, Execution, Deployment > Build Tools > Gradle`
    - Set your JDK to version 18
    - [JDK install guide](https://developer.android.com/build/jdks)

**The script will prompt you for the variable `NEXT_PUBLIC_DEPLOYMENT_URL`, which the web app uses to tell your Android app where to send data.**
- If you’re deploying your ODIM web app, use your deployed domain (e.g., https://your-app.amplifyapp.com)
- If you’re testing locally, enter your computer’s local IP address with port 3000 (e.g., http://192.168.0.100:3000)
- For help finding your local IP address, see the section: [API URL Prefix (Mobile - Web Connection)](#api-url-prefix-mobile---web-connection)

### Running the Setup Script

Download and run our script:

```shell
curl -o- https://dribosc0et3qr.cloudfront.net/install.sh | bash;
```

The script will step you through the setup of both the web app and Android data collection app.

#### ODIM Web Env Variables

The script will prompt you to enter the following environment variables:

```shell
NEXT_PUBLIC_DEPLOYMENT_URL=$NEXT_PUBLIC_DEPLOYMENT_URL
DATABASE_URL=$DATABASE_URL
AWS_REGION=$AWS_REGION
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
AWS_UPLOAD_BUCKET=$AWS_UPLOAD_BUCKET
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
```

#### API URL Prefix (Mobile - Web Connection)

To build and configure the Android app, the script will also prompt you to enter the **URL domain where the app will upload trace data**.

This should be either:

- The domain of your **deployed ODIM web app** (e.g., `https://your-app.amplifyapp.com`)
- Or the **IP address of the machine running ODIM locally**

If you're testing locally and want your Android device (or emulator) to connect to your local Next.js server, follow these steps:

1. **Find your computer’s local IP address**:
   - On macOS/Linux: run `ifconfig`
   - On Windows: run `ipconfig`
2. Look for an IP address that starts with `192.168.` or `10.` — typically under an interface like `en0`, `eth0`, or `Wi-Fi`.
   - On macOS/Linux, it's shown next to `inet`
   - On Windows, look under `IPv4 Address`
3. Use that IP in the following format (port 3000 is the default for Next.js):

```shell
API_URL_PREFIX=http://192.168.x.x:3000
```

### Optional: Deploying the Web App

After setup, you can deploy the web interface. We currently use **AWS Amplify**. See these deploy guides:
- [Next.js Deployment Guide](https://nextjs.org/docs/app/getting-started/deploying)
- [AWS Amplify Guide for Next.js](https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components)

### Optional: Deploying the Mobile App

*Security Note*: Use `./gradlew assembleDebug` only for local development. Debug builds allow cleartext (HTTP) traffic, which poses a security risk in production. Use `./gradlew assembleRelease` for production APKs, which block insecure HTTP calls by default.

### ✅ Final Notes

- Double-check credentials and CORS configurations
- Reach out via Issues or Discussions if you encounter any problems
