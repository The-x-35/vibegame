# VibeGame API Documentation

## Upload API

### POST `/api/upload/get-s3-link`

Generates a pre-signed URL for uploading game files (.sb3) to AWS S3.

#### Authentication

-   Required: JWT token with wallet address in the Authorization header
-   Format: `Authorization: Bearer <token>`

#### Request Body

```json
{
    "filename": "mygame.sb3", // Must end with .sb3
    "userId": "user-wallet-address",
    "fileId": "existing-file-id" // Optional, only when updating existing files
}
```

#### Response (200 OK)

```json
{
    "url": "https://s3-presigned-url...", // Pre-signed S3 URL for upload
    "key": "userId/filename-timestamp.sb3" // S3 object key for the file
}
```

#### Error Responses

-   401 Unauthorized: Missing/invalid token or unauthorized user
-   400 Bad Request: Invalid/missing filename or userId
-   500 Internal Server Error: Failed to generate pre-signed URL

#### Usage Examples

**Creating a new file:**

```javascript
const response = await fetch("/api/upload/get-s3-link", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({
        filename: "mygame.sb3",
        userId: "user-wallet-address",
    }),
});

const { url, key } = await response.json();

// Upload the file directly to S3
await fetch(url, {
    method: "PUT",
    body: fileBlob,
    headers: {
        "Content-Type": "binary/octet-stream",
    },
});
```

**Updating an existing file:**

```javascript
const response = await fetch("/api/upload/get-s3-link", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({
        filename: "mygame.sb3",
        userId: "user-wallet-address",
        fileId: "userId/existing-file-id", // The full path/key of the existing file
    }),
});

const { url, key } = await response.json();

// Upload the updated file to S3
await fetch(url, {
    method: "PUT",
    body: updatedFileBlob,
    headers: {
        "Content-Type": "binary/octet-stream",
    },
});
```

## Game Files API

### GET `/api/game-files`

Lists all game files in the S3 bucket.

#### Authentication

-   Currently not implemented (marked as TODO in code)

#### Response (200 OK)

```json
[
    {
        "Key": "userId/filename.sb3",
        "LastModified": "2023-09-15T12:34:56.000Z",
        "Size": 12345,
        "ETag": "\"etag\"",
        "StorageClass": "STANDARD"
    }
    // More file objects...
]
```

#### Usage Example

```javascript
const response = await fetch("/api/game-files");
const files = await response.json();
```

### GET `/api/game-files/user`

Lists all game files owned by a specific user.

#### Query Parameters

-   `userId`: The wallet address or ID of the user

#### Authentication

-   Currently not implemented (marked as TODO in code)

#### Response (200 OK)

```json
[
    {
        "Key": "userId/filename1.sb3",
        "LastModified": "2023-09-15T12:34:56.000Z",
        "Size": 12345,
        "ETag": "\"etag\"",
        "StorageClass": "STANDARD"
    }
    // More file objects...
]
```

#### Error Responses

-   400 Bad Request: Missing userId parameter

#### Usage Example

```javascript
const response = await fetch(`/api/game-files/user?userId=${userWalletAddress}`);
const userFiles = await response.json();
```

### GET `/api/game-files/[fileId]`

Generates a pre-signed URL to access a specific game file.

#### Path Parameters

-   `fileId`: The S3 key/path of the file to retrieve

#### Authentication

-   Currently not implemented (marked as TODO in code)

#### Response (200 OK)

```json
{
    "url": "https://s3-presigned-url...", // Pre-signed URL to access the file
    "fileId": "userId/filename.sb3"
}
```

#### Error Responses

-   400 Bad Request: Missing fileId parameter
-   500 Internal Server Error: Failed to fetch file

#### Usage Example

```javascript
const response = await fetch(`/api/game-files/${fileId}`);
const { url } = await response.json();

// Use the URL to download or display the file
const fileData = await fetch(url);
```

## Required Environment Variables

To use these APIs, ensure the following environment variables are set in your `.env` file:

```
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name
JWT_SECRET=your-jwt-secret
```
