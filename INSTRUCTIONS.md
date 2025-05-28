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

📌 _Alternative_: You may use [MinIO](https://github.com/minio/minio) (tested) or [LocalStack](https://github.com/localstack/localstack) (not tested) for local S3 emulation.

#### Local Alternative: MinIO Set Up

MinIO is an open-source, s3-compatible object store that can be run locally using Docker. It can serve as a replacement for AWS S3 in development environments.

*If you don't plan to use a local alternative to S3, you may [skip this section](#mongodb).*

**Install and Run MinIO**
We recommend using Docker. Create a `docker-compose.yml`, a template is included below:

```yaml
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
      MINIO_ROOT_USER: [USERNAME]
      MINIO_ROOT_PASSWORD: [PASSWORD]
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
```

Next, to start the docker container with MinIO with command: `docker compose up`

Once running, the GUI console will be available at `http://localhost:9001`. Log in using your `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` credentials defined in your Docker Compose file. 

You can confirm MinIO is running in docker with `docker compose logs minio`

**Map Environment Variables**:

| Script Env Var          |  MinIO Setting        |
|-------------------------|-----------------------|
| `_AWS_ACCESS_KEY_ID`    | `MINIO_ROOT_USER`     |
| `_AWS_SECRET_ACCESS_KEY`| `MINIO_ROOT_PASSWORD` |
| `_AWS_UPLOAD_BUCKET`    | Custom bucket name    |

**Set Up Your Bucket**

1. Open the MinIO GUI console and navigate to **Buckets**.
2. Click **Create Bucket** and enter a name. This will be the value of `_AWS_UPLOAD_BUCKET` prompted by the script. 
3. Set bucket read and write permission so the objects are viewable publicly: 
    a. On the left side tab click on `Buckets` and click bucket name.
    c. Click on the **Anonymous** tab. 
    d. Click on **Add Access Rule** button.
    e. Set rule to have prefix `/` (or specific prefix) and grant **Read** and **Write** permissions.

*You can also go directly to `.env.local` in the `odim-frontend-next` repository and change the environment variables from there.*

**Change Code After Running Script**

The ODIM web repository `odim-frontend-next` should be cloned once the script has finished running. You will need to change some AWS SDK settings in four files to correctly connect to MinIO object store.
    
1. `src/lib/aws/index.ts` : `s3Client`
    - S3 uses virtual hosted style urls (`https://[bucket-name].s3.[region].amazonaws.com`), while MinIO only supports path style hosting (`http://192.168.X.X:9000/[bucket-name]`). Enforce the client to use path style with `forcePathStyle: true`.
    - Add a root endpoint for the client to upload an object. This comprises your IP address, MinIO port, and bucket name
    - You can find your local machine's IP address by following the instructions in section [API URL Prefix (Mobile - Web Connection)](#api-url-prefix-mobile---web-connection)

    ```javascript
    export const s3 = new S3Client({
        region: process.env._AWS_REGION!,
        endpoint: "http://192.168.X.X:9000",
        forcePathStyle: true,
        credentials: {
            accessKeyId: process.env._AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env._AWS_SECRET_ACCESS_KEY!,
        },
    });
    ```

2. `src/lib/aws/s3/server.ts` : `generatePresignedUrl()`
    - This function generates a url from MinIO to upload the object to the bucket.
    - Update the returned `fileUrl` field to follow MinIO path style.
    ```javascript
        fileUrl: `http://192.168.X.X:9000/${process.env._AWS_UPLOAD_BUCKET}/${prefix}/${fileName}`
    ```
3. `src/lib/actions/screens.ts` : `s3Client`, `generatePresignedVHUpload()`
    - Make the same adjustments to `s3Client` as in (1)
    - Adjust `fileUrl` to follow path style url in `generatePresignedVHUpload()`
    ```javascript
        fileUrl: `http://192.168.X.X:9000/${process.env._AWS_UPLOAD_BUCKET}/${fileKey}
    ```
4. `src/lib/actions/capture.ts` : `getCaptureFiles()`
    - Again, update `fileUrl` to follow path style url:
    ```javascript
        fileUrl: `http://192.168.X.X:9000/${process.env._AWS_UPLOAD_BUCKET}/${file.Key}`
    ```


**Allow Images served from MinIO to render in NextJS**

Add the MinIO hostname url pattern in `next.config.ts`
```javascript
const nextConfig: NextConfig = {
    ...,
    images: {
        remotePatterns: [
            ...,
            {
                protocol: "http",
                hostname: "192.168.X.X"
            }
        ]
    }
    ...
}

```

### MongoDB

Trace metadata is stored in a MongoDB database.

1. Create a [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) account.
2. Create a database cluster.
3. Set up a **database user** under `Database Access` → "Add New Database User".
4. Get your **connection string**:
    - Go to your cluster → `Connect` → choose **Drivers**.
    - Copy the connection string and replace `<username>` and `<password>`.
    - Come up with a name for your database and append to your connection string (i.e. `mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>`)
    - Save the full string securely.
    - Follow the [connection string guide](https://www.mongodb.com/resources/products/fundamentals/mongodb-connection-string)

📈 _Local alternative_: Install [MongoDB Community Edition](https://www.mongodb.com/try/download/community) and follow the [local connection string guide](https://www.mongodb.com/resources/products/fundamentals/mongodb-connection-string).

#### Local MongoDB Community Edition Set Up

*If you don't plan to use a local alternative to MongoDB Cloud, you may [skip this section](#nextauth-with-google-oauth).*

To set up locally hosted MongoDB solution instead, you will make a few adjustments.

1. **Install MongoDB Community Edition and MongoDB Shell**.
Download and install [MongoDB Community Edition](https://www.mongodb.com/try/download/community).
You should also install [MongoDB Shell](https://www.mongodb.com/try/download/shell) to connect and debug the database in command line.
2. **(Optional) Create a mongo configuration file (`mongo.conf`).** 
Example template:
    ```yaml
    storage: 
    dbPath: /home/user/absolute-path-to-dir/dbnet:
    net:
    bindIp: 127.0.0.1
    port: 27017
    ```
3. **Determine your MongoDB connection string**
Based on the config above, your local mongodb connection string should be: 
    ```shell
    mongodb://127.0.0.1:27017/<dbname>
    ```
4. **Start MongoDB with replica set mode**
You will need to run the MongoDB instance in replica set mode. Use the following command: 
    `mongod [--config mongo.conf] --replSet rs0`.
5. **Initiate the replica set** 
    Use the mongo shell to connect your mongo instance with connection string: 
    `mongosh mongodb://127.0.0.1:27017/`
    In the shell run: 
    `rs.intiate()`

### NextAuth with Google OAuth

We use [Auth.js](https://authjs.dev/) with Google OAuth to handle authentication.

1. Generate a `AUTH_SECRET` directly and save to `.env.local` by running:
    ```bash
    npx next-auth secret
    ```
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
- If you’re testing locally, enter your computer’s local IP address with port 3000 (e.g., http://192.168.X.X:3000)
- For help finding your local IP address, see the section: [API URL Prefix (Mobile - Web Connection)](#api-url-prefix-mobile---web-connection)

### Running the Setup Script

Run the following command to download and run our script:

```bash
curl -o- https://dribosc0et3qr.cloudfront.net/install.sh | bash;
```

The script will step you through the setup and build for both the Web and Android apps.

#### Cloning The ODIM Web Repository

You will be prompted to choose cloning by HTTP or SSH. The script will then clone the ODIM Web repository:
[https://github.com/datadrivendesign/odim-frontend-next.git]()

#### ODIM Web Env Variables

The script will prompt you to enter the following env variables:

```env
NEXT_PUBLIC_DEPLOYMENT_URL=
DATABASE_URL=
_AWS_REGION=
_AWS_ACCESS_KEY_ID=
_AWS_SECRET_ACCESS_KEY=
_AWS_UPLOAD_BUCKET=
AUTH_SECRET=
AUTH_GOOGLE_CLIENT_ID=
AUTH_GOOGLE_CLIENT_SECRET=
```

These environment variables will be saved to `.env.local`, you can always manually modify them later on.

#### Cloning the ODIM Mobile App Repository

You will again choose to clone by HTTP or SSH. The script will then clone from:
[https://github.com/datadrivendesign/mobile-odim.git]() 

#### Build the Mobile ODIM APK

Once ODIM Mobile repository is cloned, the script will try to bundle an APK (app package). 
- You will be prompted to add the Android SDK path to successfully build to APK.
- Follow the steps in [Android Studio + Java (Mobile App)](#android-studio--java-mobile-app) to find the Android SDK path.
- The script writes this path to `local.properties` in the mobile repo.

```shell
SDK_PATH="/home/user/Android/Sdk"
```


#### API URL Prefix (Mobile - Web Connection)

**Diagram:**
```
[ Android App ] <---> [ ODIM Web App (192.168.X.X:3000) ]
     |
     |-- APK built w/ IP + port
```

To build and configure the Android app, the script will also prompt you to enter the **URL domain where the app will upload trace data**.

This should be either:

- The domain of your **deployed ODIM web app** (e.g., `https://your-app.amplifyapp.com`)
- The **IP address of the machine running ODIM locally** (e.g. `http://198.168.X.X:3000`)

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

The APK is built using a Gradle script in the mobile repo and injects `API_URL_PREFIX` as env variable before build: 
```bash
./gradlew assembleDebug -PAPI_URL_PREFIX="$API_URL_PREFIX"
```


#### Running ODIM on Localhost

Finally, the script starts the web development server: 
```bash
npm run dev -- -H 0.0.0.0
```
The parameters `-- -H 0.0.0.0` makes the site accessible from external devices on your network.

### Optional: Deploying the Web App

After setup and development, you can deploy the web interface. Our current implementation uses **AWS Amplify**. See these deploy guides:
- [Next.js Deployment Guide](https://nextjs.org/docs/app/getting-started/deploying)
- [AWS Amplify Guide for Next.js](https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components)

### Optional: Deploying the Mobile App

⚠️ **Security Note**: Use `./gradlew assembleDebug` only for local development. Debug builds allow cleartext (HTTP) traffic, which poses a security risk in production. Use `./gradlew assembleRelease` for production APKs, which block insecure HTTP calls by default.

### ✅ Final Notes

- Double-check credentials and CORS configurations
- Reach out via Issues or Discussions if you encounter any problems
