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

- STORAGE_NAME (can be: box, egnyte, gdrive, onedrive, dropbox). This variable defines from which folder to load the server-side files, see **/server/storage/** folder

And the respective client ID & secret

- STORAGE\_CLIENT\_ID
- STORAGE\_CLIENT\_SECRET
- STORAGE\_CALLBACK\_URL (optional on localhost, on the respective dev portal should be **http://localhost:3000/api/[STORAGE_NAME]/callback/oaut**

To run the sample:

```
npm install
npm run dev
```

## Authors

Forge Partner Development Team

- Adam Nagy
- Augusto Goncalves

