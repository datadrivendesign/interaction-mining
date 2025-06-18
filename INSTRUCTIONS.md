# ODIM Install Script Explanation Guide

<!-- This guide walks you through setting up your own instance of the ODIM system, including external services and required tools. -->

This guide is made to explain what our ODIM (On-Device Interaction Mining) installation script does when it is run. Some set up instruactions are included as well.

### Running the Setup Script

Run the following command to download and run our script:

```bash
bash install-2.sh
```
<!-- ```bash
curl -o- https://dribosc0et3qr.cloudfront.net/install-2.sh | bash;
``` -->

The script will step you through the setup and build for both the web and mobile apps. We will explain below the different steps the script takes to set up all dependencies.

:heavy_exclamation_mark: **Important Note**: Our script uses `homebrew` to install needed dependencies. Please make sure you have it installed first before running our script. The script is currently targeted for OSX devices, but it may work on Linux with `homebrew` installed.

### ⚙️ Check Dependencies to Run ODIM Web

The script first checks if ODIM web dependencies are installed. If not, then it will install them on the machine for you.

#### Node.js (Web App)

Our web interface uses **Next.js**, which requires Node.js (v16 or v18). The script first checks if you have `node` and `npm` installed. If these programs are not detected, it will install these packages for you through `homebrew`.

### Run Script Options

The script will give you a choice on how to set up the ODIM system:
- If you want a [locally hosted version](#computer-locally-hosted-odim) of ODIM to develop, test, or use.
- If you are a collaborator and have access to our [remote dev environment](#remove-dev-environment-set-up).

### :computer: Locally Hosted ODIM

This is a walkthrough guide on how the script sets up a locally hosted ODIM instance of ODIM. There will be some manual set up required later in the script, so please pay attention.

#### MinIO Set Up

[MinIO](https://github.com/minio/) is an open-source, S3-compatible object store that can be run locally using Docker. We use it as a replacement for AWS S3 in the local environment.

The script installs MinIO through Docker. It will first check if you have Docker installed on your machine. If you do not have Docker installed, the script will install Docker for you through `homebrew`. If you have Docker installed, it will use your Docker installation.

:warning: **If Docker was downloaded for the first time, you need to manually start Docker to complete set up first. The script will prompt you to do that.**

The script will prompt you for **username** and **password** credentials to set up the MinIO object store. These credentials will be needed to access the object store bucket. The script then creates a Docker compose file to set up MinIO with these credentials. Docker will create a container with MinIO installed using the settings in the `docker-compose.yml` file.

The script then asks you to provide a **bucket name** and creates the bucket to store your trace data. The script will use [MinIO Client CLI](https://min.io/docs/minio/linux/reference/minio-mc.html) to create the bucket. If you do not have the CLI installed, the script will install it for you. The script will use this CLI to automate bucket creation and set permissions to make bucket objects publicly available.

#### MongoDB Community Edition Set Up

MongoDB Community Edition is a version of MongoDB that allows users to locally set up a Mongo server on their own machines. The script uses this to set up a Mongo server for the local ODIM instance.

The script will first check if MongoDB Community Edition is installed on your device. Specifically it checks if you have Mongo Shell (`mongosh`) installed. If you do not have MongoDB installed on your device, it will use install it for you.

The script will proceed to create a Mongo database to store ODIM trace metadata. You will be prompted to give a directory **name** for where database data will be stored. Next the script will create a configuration file (`mongo.conf`). 

The script then starts up the MongoDB process and sets up the database with the config file. The database is initialized with a replication set (required for our web app). Finally, the script will prompt you for a Mongo database **name** and create the database for you.

#### Auth.js with Google OAuth

:heavy_exclamation_mark: If you are setting up a local ODIM instance, **you will need to manually set up Google Authentication**.

We use [Auth.js](https://authjs.dev/) with Google OAuth to handle authentication. To enable Google Authentication:

1. Set up a Google OAuth app:
    - Go to [Google Cloud Console](https://console.cloud.google.com/).
    - Create a new project.
    - Go to `APIs & Services` → `OAuth consent screen`:
        - Set user type to **External**
        - Add scopes: `email`, `profile`, `openid`
    - Go to `Credentials` → `Create Credentials` → `OAuth client ID`
        - Application type: **Web Application**
        - Redirect URI: `http://localhost:3000/api/auth/callback/google` (or your deployed domain)
2. Save your **Client ID** and **Client Secret**.

The script will ask you for your **Client ID** and **Client Secret** for the ODIM web set up later.

📖 [Detailed setup guide](https://developers.google.com/identity/protocols/oauth2)

### Remote Dev Environment Set Up

The script will also give you the option to run ODIM on a remote development environment. This remote dev environment uses a deployed AWS S3 bucket, Mongo Atlas cluster, and Google OAuth service. If you are a collaborator, we will give you AWS IAM user credentials (access key and secret). 

The script will ask you to input these AWS credentials and use them to grab env variables from our AWS SecretsManager. These env variables are automatically parsed in the script and added to both the web and mobile app.

### Cloning The ODIM Web Repository

You will be prompted to choose cloning by HTTP or SSH. The script will then clone the ODIM Web repository: [https://github.com/datadrivendesign/odim-frontend-next.git]()

Once the repo is cloned, the script will install the package dependencies of the repo using
```bash
npm install
```

### ODIM Web Env Variables

The script will set most of the environment variables for you based on previous inputs you made. For a local instance of ODIM, the URLs will be the device's IP address and the AWS settings will for MinIO. 

These environment variables will be saved to `.env.local`, you can always manually modify them later on. The script will also automatically generate and add the `AUTH_SECRET` env variable to `.env.local`. This variable is required by the Auth.js library.

**The script will prompt you to manually enter Auth Google variables:** `AUTH_GOOGLE_CLIENT_ID` and `AUTH_GOOGLE_CLIENT_SECRET`. These should have been set up in [NextAuth with Google OAuth](#nextauth-with-google-oauth).

```env
DATABASE_URL=
_AWS_REGION=
_AWS_ACCESS_KEY_ID=
_AWS_SECRET_ACCESS_KEY=
_AWS_UPLOAD_BUCKET=
USE_MINIO_STORE=
MINIO_ENDPOINT=
AUTH_GOOGLE_CLIENT_ID=
AUTH_GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_DEPLOYMENT_URL=
```

### ⚙️ ODIM Mobile Set Up

Next, the script will ask whether you want to set up the ODIM Android mobile app. If not, the script will [skip the set up in this section](#running-odim-on-localhost). 

#### Java Set Up

Our Android app requires **Java JDK 17 or higher** to build. The script will check if Java is installed and if you have the correct version. If not, it will install `OpenJDK v17` and add it to your `$PATH` variable. 

#### Android Studio SDK Set Up

The script will next set up the Android SDK, which is necessary to build the Android app. The script first checks if your device has an Android SDK installed or not. **The minimum required SDK version is v34**. 

If the SDK is not installed, the script uses `homebrew` to install `android-commandlinetools`. The script uses this command line tool to install the proper Android build tools and Android SDK. 

The script will attempt to install the SDK through the command line. You will need to agree to license agreements and wait for the install to finish.

:warning: **To make sure your system can find Java and Android SDK outside the script**, make sure to run `source` on your terminal profile after the script is finished.

```bash
# After script finishes, run:
source ~/.zprofile  # if using zsh
source ~/.bash_profile  # if using bash
```

#### Cloning the ODIM Mobile Repository

You will again choose to clone by HTTP or SSH. The script will then clone from:
[https://github.com/datadrivendesign/mobile-odim.git](). After the repo is cloned, the script will write your installed SDK path to `local.properties` so your project knows where the SDK is located.

#### Build the Mobile ODIM APK

Once Mobile ODIM repository is cloned, the script will try to bundle an APK (app package). The APK build script takes one command line parameter, `API_URL_PREFIX`, which is the root url domain of where the ODIM web app is hosted. This is where the app will upload trace data to. **This parameter is automatically set by the script** as the local IP address of the web server (or where the dev environment is deployed). 

The APK is built using a Gradle script in the mobile repo: 
```bash
./gradlew assembleDebug -PAPI_URL_PREFIX="$API_URL_PREFIX"
```

Once the build is done, the script will print the path to where the APK was built. You can install this file on an Android phone or add it to an emulator to run the app.

:warning: **Security Note**: Use `./gradlew assembleDebug` only for local development. Debug builds allow cleartext (HTTP) traffic, which poses a security risk in production. Using `./gradlew assembleRelease` for production APKs, will block insecure HTTP calls by default.

### Running ODIM on Localhost

Finally, the script starts the web development server: 
```bash
npm run dev -- -H 0.0.0.0
```
The parameters `-- -H 0.0.0.0` makes the site accessible from external devices on your network. Specifically, it binds the development server to all IPs, allowing other devices on your network to access your local server.

----

### Related Topics 

These sections are not part of the script but serve as FAQs for users who want to use the system or deploy their own version.

#### Creating a New Capture

Now that you have ODIM set up, here are the steps to create a new capture:

1. Log in to ODIM through your Google account.
2. Click on your profile and go to "Dashboard".
3. Click the "Create New Capture" button.
4. Fill out the New Capture form.
    - You can add a new app by providing the Android app package name on Google Play Store or iOS app bundle ID on the App Store.
    - You can find the package name of an app from its [Google Play Store URL](https://support.google.com/admob/answer/9972781)
    - You can find the iOS bundle ID of an app from the [App Store URL](https://www.nutrient.io/guides/ios/faq/finding-the-app-bundle-id/)
5. The web app will redirect you to a page with a QR code.
    - **If iOS**: scan the QR code with your phone to reach a new page with a file upload option. Screen record your task and upload the mp4 file.      
        - (:warning: Warning: Firefox does not support HEVC video files, which are used by iOS devices to screen record.)
    - If Android: Open the ODIM app and scan the QR code. Follow the instructions in the Contribute page (navigation bar right side) on how to record and upload traces.

#### Cleaning Up Local Dependencies

These are instructions on how to remove local dependencies.
- To shut down local Docker containers:
    ```bash
    docker compose down
    ```
- To remove storage bucket, delete the `minio_data` specified in the docker compose file.
- To remove mongo data, delete the mongo directory specified in `mongo.conf`.


#### Deploying an AWS S3 Bucket 

ODIM uses AWS S3 to store trace data. To deploy your own version you will need to do some setup:

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
Once set up is done you will need to set up these env variables with the credentials you saved:

| Script Env Var          |  MinIO Setting        |
|-------------------------|-----------------------|
| `_AWS_ACCESS_KEY_ID`    | AWS Access Key ID     |
| `_AWS_SECRET_ACCESS_KEY`| AWS Secret Access Key |
| `_AWS_UPLOAD_BUCKET`    | Name of AWS S3 Bucket |

#### MongoDB Atlas Set Up

Trace metadata is stored in a MongoDB database. To deploy a MongoDB cloud instance:

1. Create a [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) account.
2. Create a database cluster.
3. Set up a **database user** under `Database Access` → "Add New Database User".
4. Get your **connection string**:
    - Go to your cluster → `Connect` → choose **Drivers**.
    - Copy the connection string and replace `<username>` and `<password>`.
    - Come up with a name for your database and append to your connection string (i.e. `mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>`)
    - Save the full string securely.
    - Follow the [connection string guide](https://www.mongodb.com/resources/products/fundamentals/mongodb-connection-string) for more details

Once you have set up your database instance, **save your connection string as env variable** `DATABASE_URL`

#### Deploying the Web App

After setup and development, you can deploy the web interface. Our current implementation uses **AWS Amplify**. See these deploy guides:
- [Next.js Deployment Guide](https://nextjs.org/docs/app/getting-started/deploying)
- [AWS Amplify Guide for Next.js](https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components)

The deployed url should be saved as env variable `NEXT_PUBLIC_DEPLOYMENT_URL`.


### ✅ Final Notes

- Double-check credentials and (if applicable) CORS configurations
- Reach out via Issues or Discussions if you encounter any problems
