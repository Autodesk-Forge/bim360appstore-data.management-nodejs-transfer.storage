# bim360appstore-data.management-nodejs-transfer.storage


## Atention

Work in progress, not ready.

## Setup

Setup up environment variables, see **/server/config.js** file

For localhost testing:

- FORGE\_CLIENT\_ID
- FORGE\_CLIENT\_SECRET
- FORGE\_CALLBACK\_URL (optional on localhost, on Forge Dev Portal should be **http://localhost:3000/api/forge/callback/oauth**)

Next define the storage that this sample will run:

- STORAGE\_NAME (can be: box, egnyte, gdrive, onedrive, dropbox). This variable defines from which folder to load the server-side files, see **/server/storage/** folder
- STORAGE\_NEEDS\_ACCOUNT\_NAME (some storage services like Egnyte require an account name which will be part of the URL of the API endpoints. If the storage service you are working with does not require it then you can either omit this parameter or set its value to false)

And the respective client ID & secret

- STORAGE\_CLIENT\_ID
- STORAGE\_CLIENT\_SECRET
- STORAGE\_CALLBACK\_URL (optional on localhost, on the respective dev portal should be **http://localhost:3000/api/[STORAGE_NAME]/callback/oauth**)

To run the sample:

```
npm install
npm run dev
```

## AWS Lambda

This sample delegates the heavy work of transfering files to a AWS Lambda. To deploy it, ZIP the contents of **/server/lambda/** and upload to a Lambda function. Then create an API Gateway. The following environment variables should be adjusted:

- TRANSFER_ENDPOINT: the AWS API Gateway address
- TRANSFER\_ENDPOINT\_AUTHORIZATION: the **x-api-key** for the API Gateway

When the job is complete, the lambda function need to notify the application. This will not work on localhost (as AWS cannot call localhost, except with a proxy app). Inside AWS Lambda settings, specify the following environment variable:

- STATUS_CALLBACK: e.g.: https://serveradress.com/api/app/callback/transferStatus

## Authors

Forge Partner Development Team

- Adam Nagy
- Augusto Goncalves

