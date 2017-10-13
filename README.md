# bim360appstore-data.management-nodejs-transfer.storage

This sample application demonstrate how to transfer files from **BIM 360 Docs**, **BIM 360 Team** (formerly A360) and **Fusion 360** to a series of storages: Box, Egnyte, Google Drive, OneDrive and Dropbox. It uses Forge [Data Management API](https://developer.autodesk.com/en/docs/data/v2/overview/). As of now, BIM 360 Field and Glue **are NOT supported**. The front-end will look like (e.g. Google Drive):

### Thumbnail
![thumbnail](www/img/readme/indexpage.png)

## Demonstration

- Box: [STG](https://bim360box.herokuapp.com) | [PROD](https://bim360box.autodesk.io/)
- Dropbox: [STG](https://bim360dropbox.herokuapp.com) | [PROD](https://bim360dropbox.autodesk.io/)
- Egnyte: [STG](https://bim360egnyte.herokuapp.com) | [PROD](https://bim360egnyte.autodesk.io/)
- Google: [STG](https://bim360google.herokuapp.com) | [PROD](https://bim360google.autodesk.io/)
- OneDrive: [STG](https://bim360onedrive.herokuapp.com) | [PROD](https://bim360onedrive.autodesk.io/)

See [video demonstration](https://www.youtube.com/watch?v=zD1gFELz-2E)

**Usage**: select **folders** or **files** (or specific version) on Autodesk side (left), select one **folder** on storage side (right). Click on the right-pointing-arrow (at the center) to start transferring. The opposite is also supported, use the left-pointing-arrow. When transferring **from** storage **to** Autodesk, a new version is created if file name already exists. 

## Architecture

The app was designed to communicate with Autodesk and respective storage to prepare the transfer. Once the `source` and `destination` requests are ready, it delegates to AWS Lambda. The following image describes the steps to transfer from Autodesk to storage. 

![](www/img/readme/adsk_storage.png)

The next image describes the inverse flow, from storage to Autodesk. See **Setup** and **AWS Gateway & AWS Lambda** sections for deployment details. This [blog post](https://forge.autodesk.com/blog/transfer-storages-sample) include more details.

![](www/img/readme/storage_adsk.png)

## Setup

This samples requires Forge and respective storage credentials.

### Forge

For using this sample, you need an Autodesk developer credentials. Visit the [Forge Developer Portal](https://developer.autodesk.com), sign up for an account, then [create an app](https://developer.autodesk.com/myapps/create). For this new app, use `https://localhost:3000/api/forge/callback/oauth` as Callback URL. Finally take note of the **Client ID** and **Client Secret**. For localhost testing:

- FORGE\_CLIENT\_ID
- FORGE\_CLIENT\_SECRET
- FORGE\_CALLBACK\_URL (optional on localhost)

### Storage

Define the storage that this sample will run:

- STORAGE\_NAME (can be: Box, Egnyte, Google, OneDrive, Dropbox). This variable defines from which folder to load the server-side files: oauth, tree and integration (see **/server/storage/** folder). 

For each storage, define the following variables:

- STORAGE\_CLIENT\_ID
- STORAGE\_CLIENT\_SECRET
- STORAGE\_CALLBACK\_URL: optional on localhost, on the respective dev portal should be `https://localhost:3000/api/[STORAGE_NAME]/callback/oauth`

The following topics describe the steps to generate the respective client ID and client secret for each storage provider:

#### Box

- STORAGE\_NAME: **box**

Visit the [Box Developer](https://developer.box.com), Log in or Sign up, follow the steps to [Create a Box Application](https://app.box.com/developers/services/edit/). For this new app, use `https://localhost:3000/api/box/callback/oauth` as **redirect\_uri**. Finally, take note of the **client_id** and **client_secret**, which you'll need to use as **STORAGE\_CLIENT\_ID** and **STORAGE\_CLIENT\_SECRET** respectively.

#### Dropbox

- STORAGE\_NAME: **dropbox**

Visit the [Dropbox Developer](https://www.dropbox.com/developers) site, Log in or Sign up, follow the steps to **Create your app**. For this new app, use `https://localhost:3000/api/dropbox/callback/oauth` as one of the **Redirect URIs**. Take note of the **App key** and **App secret**, which you'll need to use as **STORAGE\_CLIENT\_ID** and **STORAGE\_CLIENT\_SECRET** respectively.


#### Egnyte

- STORAGE\_NAME: **egnyte**

Visit the [Egnyte Developer](https://developers.egnyte.com) site, Log in or Sign up, follow the steps to **Create a New Application**. For this new app, use `https://localhost:3000/api/egnyte/callback/oauth` as **Registered OAuth Redirect URI**. Finally, take note of the Application's **Key** and **Shared Secret**, which you'll need to use as **STORAGE\_CLIENT\_ID** and **STORAGE\_CLIENT\_SECRET** respectively.

Additionally, Egnyte needs an **account name**:

- STORAGE\_NEEDS\_ACCOUNT\_NAME: some storage services like Egnyte require an account name which will be part of the URL of the API endpoints. If the storage service you are working with does not require it then you can either omit this parameter or set its value to false


#### Google Drive

- STORAGE\_NAME: **google**

Visit the [Google APIs Console](https://console.developers.google.com), Log in or Sign up, follow the steps to Create a Credential. For this new app, use `https://localhost:3000/api/google/callback/oauth` as **redirect\_uri**. Make sure you activate **Google Drive** & **Google People** APIs, this sample uses both scopes. Finally, take note of the **client_id** and **client_secret**, which you'll need to use as **STORAGE\_CLIENT\_ID** and **STORAGE\_CLIENT\_SECRET** respectively.

#### OneDrive

- STORAGE\_NAME: **onedrive**

Visit the [OneDrive Dev Center](https://dev.onedrive.com/app-registration.htm), Log in or Sign up, follow the steps to **Add an app**. For this new app, add a **Web** platform and use `https://localhost:3000/api/onedrive/callback/oauth` as one of the **Redirect URLs**. Take note of the **Application Id** and **Application Secrets >> Password**, which you'll need to use as **STORAGE\_CLIENT\_ID** and **STORAGE\_CLIENT\_SECRET** respectively.


## Running locally

Make sure to have [NodeJS](https://nodejs.org) installed. Clone this project or download it. It's recommended to install [GitHub desktop](https://desktop.github.com). To clone it via command line, use the following (Terminal on MacOSX/Linux, Git Shell on Windows):

```
git clone https://github.com/autodesk-forge/bim360appstore-data.management-nodejs-transfer.storage
```

Set all FORGE_ and STORAGE_ environment variables described on the **Setup** section using the following:

- Mac OSX/Linux (Terminal)

```
export VARIABLE_NAME=value
```

- Windows (use <b>Node.js command line</b> from Start menu)

```
set VARIABLE_NAME=value
```

Install the required packaged and run the application:

```
npm install
npm run dev
```

Open the browser with SSL on [https://localhost:3000](https://localhost:3000)

**Important:** do not use **npm start** locally, this is intended for PRODUCTION only with HTTPS (SSL) secure cookies.

## Deployment

A deployment should have the following environment variables defined (e.g. Heroku app settings):

![](www/img/readme/envvars.png)

### Deploy on Heroku

To deploy this application to Heroku, the **Callback URL** for Forge and Storage must use your `.herokuapp.com` address. After clicking on the button below, at the Heroku Create New App page, set your Client ID, Secret and Callback URL for Forge and respective storage.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Watch [this video](https://www.youtube.com/watch?v=Oqa9O20Gj0c) on how deploy samples to Heroku.

### OAuth Redirect URLs

On live applications, the Forge and respective storage callback URLs should use your application address instead of **localhost:3000**, something like `https://serveraddress.com/api/[FORGE or STORAGE_NAME]/callback/oauth`

### AWS Gateway & AWS Lambda

This sample delegates the heavy work of transferring files to a **AWS Lambda**. See this [blog post](https://forge.autodesk.com/blog/transferring-files-aws-lambda) for more information. To deploy it, ZIP the contents of **/server/lambda/** and upload to a Lambda function. See this [step-by-step setup](https://forge.autodesk.com/blog/running-forge-viewer-aws-lambda-server-and-api-gateway). Then create an **API Gateway**. The following environment variables should be adjusted:

- TRANSFER\_ENDPOINT: the AWS API Gateway address
- TRANSFER\_ENDPOINT\_AUTHORIZATION: the **x-api-key** for the API Gateway

When the job is complete, the lambda function need to notify the application. This will not work on localhost (as AWS cannot call localhost, except with a proxy app). Define the following environment variable:

- TRANSFER\_CALLBACK\_URL: e.g.: `https://serveradress/api/app/callback/transferStatus`

No need to define any environment variable on AWS Lambda. A single API Gateway can be shared for multiple instances of this app.

## Usage statistics

This sample can keep records all users (Name, email, first usage date) and which storages used. To setup, create a MongoDB instance (e.g. on [mLab](https://mlab.com)) with a **users** collection. Define the following environment variables:

- MONGO_STATS: connection string and store as enviroment variable. For mLab, it should look like: `mongodb://username:password@ds1234.mlab.com:5678/databaseName`

Usage report (ToDo)

## Known issues

The AWS Lambda function have an exception for [Box Upload](https://developer.box.com/v2.0/reference#upload-a-file), which requires multipart post. This require a future improvement. 

## Tips & tricks

For local development/testing, consider use [nodemon](https://www.npmjs.com/package/nodemon) package, which auto restart your node application after any modification on your code. To install it, use:

    sudo npm install -g nodemon

Then, instead of <b>npm run dev</b>, use the following:

    npm run nodemon

Which executes <b>nodemon server.js --ignore www/</b>, where the <b>--ignore</b> parameter indicates that the app should not restart if files under <b>www</b> folder are modified.

## Troubleshooting

After installing Github desktop for Windows, on the Git Shell, if you see a ***error setting certificate verify locations*** error, use the following:

    git config --global http.sslverify "false"

## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT). Please see the [LICENSE](LICENSE) file for full details.


## Authors

Forge Partner Development Team

- Adam Nagy [@AdamTheNagy](https://twitter.com/AdamTheNagy)
- Augusto Goncalves [@augustomaia](https://twitter.com/augustomaia)

See more at [Forge blog](https://forge.autodesk.com/blog).

