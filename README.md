# bim360appstore-data.management-nodejs-transfer.storage

This sample application demonstrate how to transfer files from BIM 360 Docs, BIM 360 Team (formerly A360) and Fusion 360 to a series of storages: Box, Egnyte, Google Drive, Onedrive and Dropbox. It uses Forge [Data Management API](https://developer.autodesk.com/en/docs/data/v2/overview/).

## Attention

Work in progress, not ready. Use carefully.

## Demonstration

Live (ToDo)

Short [video demonstration](https://twitter.com/augustomaia/status/882671822394753025)

## Setup

This samples requires Forge and respective storage credentials.

### Forge

For using this sample, you need an Autodesk developer credentials. Visit the [Forge Developer Portal](https://developer.autodesk.com), sign up for an account, then [create an app](https://developer.autodesk.com/myapps/create). For this new app, use https://<span></span>localhost:3000/api/forge/callback/oauth as Callback URL. Finally take note of the **Client ID** and **Client Secret**. For localhost testing:

- FORGE\_CLIENT\_ID
- FORGE\_CLIENT\_SECRET
- FORGE\_CALLBACK\_URL (optional on localhost)

### Storage

Define the storage that this sample will run:

- STORAGE\_NAME (can be: box, egnyte, google, onedrive, dropbox). This variable defines from which folder to load the server-side files: oauth, tree and integration (see **/server/storage/** folder). 

For each storage, define the following variables:

- STORAGE\_CLIENT\_ID
- STORAGE\_CLIENT\_SECRET
- STORAGE\_CALLBACK\_URL: optional on localhost, on the respective dev portal should be **https://<span></span>localhost:3000/api/[STORAGE_NAME]/callback/oauth**

The following topics describe the steps to generate the respective client ID and client secret for each storage provider:

#### Box

- STORAGE\_NAME: **box**

Visit the [Box Developer](https://developer.box.com), Log in or Sign up, follow the steps to [Create a Box Application](https://app.box.com/developers/services/edit/). For this new app, use **https://<span></span>localhost:3000/api/box/callback/oauth** as **redirect\_uri**. Finally, take note of the **client_id** and **client_secret**, which you'll need to use as **STORAGE\_CLIENT\_ID** and **STORAGE\_CLIENT\_SECRET** respectively.


#### Egnyte

- STORAGE\_NAME: **egnyte**

Visit the [Egnyte Developer](https://developers.egnyte.com) site, Log in or Sign up, follow the steps to **Create a New Application**. For this new app, use **https://<span></span>localhost:3000/api/egnyte/callback/oauth** as **Registered OAuth Redirect URI**. Finally, take note of the Application's **Key** and **Shared Secret**, which you'll need to use as **STORAGE\_CLIENT\_ID** and **STORAGE\_CLIENT\_SECRET** respectively.

Additionally, Egnyte needs an **account name**:

- STORAGE\_NEEDS\_ACCOUNT\_NAME: some storage services like Egnyte require an account name which will be part of the URL of the API endpoints. If the storage service you are working with does not require it then you can either omit this parameter or set its value to false


#### Google Drive

- STORAGE\_NAME: **google**

Visit the [Google APIs Console](https://console.developers.google.com), Log in or Sign up, follow the steps to Create a Credential. For this new app, use **https://<span></span>localhost:3000/api/google/callback/oauth** as **redirect\_uri**. Make sure you activate **Google Drive** & **Google People** APIs, this sample uses both scopes. Finally, take note of the **client_id** and **client_secret**, which you'll need to use as **STORAGE\_CLIENT\_ID** and **STORAGE\_CLIENT\_SECRET** respectively.

Additionally, Google drive require the scope for the APIs activated. Define the following environment variable:

- STORAGE_SCOPE: https://www.googleapis.com/auth/drive, https://www.googleapis.com/auth/userinfo.profile

#### OneDrive

- STORAGE\_NAME: **onedrive**

Visit the [OneDrive Dev Center](https://dev.onedrive.com/app-registration.htm), Log in or Sign up, follow the steps to **Add an app**. For this new app, add a **Web** platform and use **https://<span></span>localhost:3000/api/onedrive/callback/oauth** as one of the **Redirect URLs**. Take note of the **Application Id** and **Application Secrets >> Password**, which you'll need to use as **STORAGE\_CLIENT\_ID** and **STORAGE\_CLIENT\_SECRET** respectively.

#### Dropbox

- STORAGE\_NAME: **dropbox**

Visit the [Dropbox Developer](https://www.dropbox.com/developers) site, Log in or Sign up, follow the steps to **Create your app**. For this new app, use **https://<span></span>localhost:3000/api/dropbox/callback/oauth** as one of the **Redirect URIs**. Take note of the **App key** and **App secret**, which you'll need to use as **STORAGE\_CLIENT\_ID** and **STORAGE\_CLIENT\_SECRET** respectively.

### Running locally

After setting up the environment variables, run the sample with:

```
npm install
npm run dev
```

Open the browser with SSL on [https://localhost:3000](https://localhost:3000)

## Deployment

Video explanation (ToDo)

### OAuth Redirect URLs

On production, the Forge and respective storage callback URLs should use your application address instead **localhost:3000**, something like https://<span></span>serveraddress.com/api/[FORGE or STORAGE_NAME]/callback/oauth

### AWS Lambda

This sample delegates the heavy work of transferring files to a AWS Lambda. To deploy it, ZIP the contents of **/server/lambda/** and upload to a Lambda function. Then create an API Gateway. The following environment variables should be adjusted:

- TRANSFER\_ENDPOINT: the AWS API Gateway address
- TRANSFER\_ENDPOINT\_AUTHORIZATION: the **x-api-key** for the API Gateway

When the job is complete, the lambda function need to notify the application. This will not work on localhost (as AWS cannot call localhost, except with a proxy app). Inside AWS Lambda settings, specify the following environment variable:

- STATUS\_CALLBACK: e.g.: https://<span></span>serveradress/api/app/callback/transferStatus

## Usage statistics

This sample can keep records all users (Name, email, first usage date) and which storages used. To setup, create a MongoDB instance (e.g. on [mLab](https://mlab.com)) with a **users** collection. Create the connection string and store as **MONGO_STATS** enviroment variable. For mLab, it should look like: **mongodb://usename:password@ds1234.mlab.com:5678/databaseName**

Usage report (ToDo)

## Authors

Forge Partner Development Team

- Adam Nagy [@AdamTheNagy](https://twitter.com/AdamTheNagy)
- Augusto Goncalves [@augustomaia](https://twitter.com/augustomaia)

See more at [Forge blog](https://forge.autodesk.com/blog).

