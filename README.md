# bim360appstore-data.management-nodejs-transfer.storage

This sample application demonstrate how to transfer files from BIM 360 Docs, BIM 360 Team (formely A360) and Fusion 360 to a series of storages: Box, Egnyte, Google Drive, Onedrive and Dropbox. It uses Forge [Data Management API](https://developer.autodesk.com/en/docs/data/v2/overview/).

## Atention

Work in progress, not ready. Use carefully.

## Demonstration

Live (ToDo)

Video (ToDo)

## Setup

This samples requires Forge and respective storage credentials.

### Forge

For using this sample, you need an Autodesk developer credentials. Visit the [Forge Developer Portal](https://developer.autodesk.com), sign up for an account, then [create an app](https://developer.autodesk.com/myapps/create). For this new app, use http://localhost:3000/api/forge/callback/oauth as Callback URL. Finally take note of the **Client ID** and **Client Secret**. For localhost testing:

- FORGE\_CLIENT\_ID
- FORGE\_CLIENT\_SECRET
- FORGE\_CALLBACK\_URL (optional on localhost)

### Storage

Define the storage that this sample will run:

- STORAGE\_NAME (can be: box, egnyte, google, onedrive, dropbox). This variable defines from which folder to load the server-side files: oauth, tree and integreation (see **/server/storage/** folder). 

For each storage, define the following variables:

- STORAGE\_CLIENT\_ID
- STORAGE\_CLIENT\_SECRET
- STORAGE\_CALLBACK\_URL (optional on localhost, on the respective dev portal should be **http://localhost:3000/api/[STORAGE_NAME]/callback/oauth**)

The following topics describe the steps to generate the respective client ID and client secret for each storage provider:

#### Box

- STORAGE\_NAME: **box**

Visit the [Box Developer](https://developer.box.com), Log in or Sign up, follow the steps to [Create a Box Application](https://app.box.com/developers/services/edit/). For this new app, use **http://localhost:3000/api/box/callback/oauth** as redirect\_uri. Finally, take note of the **client_id** and **client_secret**.


#### Egnyte

- STORAGE\_NAME: **egnyte**

Visit the [Egnyte Developer](https://developers.egnyte.com), Log in or Sign up, follow the steps to an Egnyte application. For this new app, use **https://localhost:3000/api/egnyte/callback/oauth** as redirect\_uri. Finally, take note of the **client_id** and **client_secret**.

Additionally, Egnyte needs a **account name**:

- STORAGE\_NEEDS\_ACCOUNT\_NAME: some storage services like Egnyte require an account name which will be part of the URL of the API endpoints. If the storage service you are working with does not require it then you can either omit this parameter or set its value to false


#### Google Drive

- STORAGE\_NAME: **google**

Visit the [Google APIs Console](https://console.developers.google.com), Log in or Sign up, follow the steps to Create a Credential. For this new app, use **http://localhost:3000/api/google/callback/oauth** as redirect\_uri. Make sure you activate **Google Drive** & **Google People** APIs, this sample uses both scopes. Finally, take note of the **client_id** and **client_secret**.

Additionaly, Google drive require the scope for the APIs activated. Define the following environment variable:

- STORAGE_SCOPE: **https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/userinfo.profile**

#### Onedrive

- STORAGE\_NAME: **onedrive**

#### Dropbox

- STORAGE\_NAME: **dropbox**

### Running locally

After setting up the environment variables, run the sample with:

```
npm install
npm run dev
```

Open the browser with SSL on [https://localhost:3000](https://localhost:3000)

## Deployment

### OAuth Redirect URLs

### AWS Lambda

This sample delegates the heavy work of transfering files to a AWS Lambda. To deploy it, ZIP the contents of **/server/lambda/** and upload to a Lambda function. Then create an API Gateway. The following environment variables should be adjusted:

- TRANSFER\_ENDPOINT: the AWS API Gateway address
- TRANSFER\_ENDPOINT\_AUTHORIZATION: the **x-api-key** for the API Gateway

When the job is complete, the lambda function need to notify the application. This will not work on localhost (as AWS cannot call localhost, except with a proxy app). Inside AWS Lambda settings, specify the following environment variable:

- STATUS\_CALLBACK: e.g.: https://serveradress.com/api/app/callback/transferStatus

## Authors

Forge Partner Development Team

- Adam Nagy [@AdamTheNagy](https://twitter.com/AdamTheNagy)
- Augusto Goncalves [@augustomaia](https://twitter.com/augustomaia)

See more at [our blog](https://forge.autodesk.com/blog).

