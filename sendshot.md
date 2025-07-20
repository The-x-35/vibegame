# Sendshot Minter API

This repository contains the backend API for the Sendshot Minter, allowing users to launch new Solana tokens on Pump.fun and claim their mint keypairs.

## Prerequisites

*   Node.js (version X.X.X or higher - please specify)
*   pnpm (or npm/yarn)

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd sendshot-minter
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```

## Running the Server

To start the development server:

```bash
pnpm dev
```

The API will typically be available at `http://localhost:PORT` (please specify the port, e.g., 3000).

## Production URL

The production API is available at: `https://sendhsot-minter-peand.ondigitalocean.app`

## API Endpoints

### Table of Contents

#### Mint Endpoints
- [Launch a New Token](#1-launch-a-new-token) - `POST /mint/launch`
- [Claim Mint Keypair](#2-claim-mint-keypair) - `POST /mint/claim`
- [Launch a New Token (Frontend Signed)](#3-launch-a-new-token-frontend-signed) - `POST /mint/post-signed-tx`
- [Sign Transaction](#4-sign-transaction) - `POST /mint/sign-tx`

#### Fee Endpoints
- [Claim Creator Fee](#1-claim-creator-fee) - `POST /fee/claim-creator-fee`
- [Get Pending Fee](#2-get-pending-fee) - `POST /fee/pending-fee`

#### Partner Endpoints
- [Block Token](#1-block-token) - `POST /partner/block`

---

The API provides the following endpoints under the `/mint` base path (assuming the router is mounted under `/mint` in your main application file, e.g., `app.use('/mint', mintRoutes);`). If the router is mounted at the root, the paths will be `/` directly.

### 1. Launch a New Token

*   **HTTP Method:** `POST` 
*   **Path:** `/launch`
*   **Description:** Launches a new token on Pump.fun.
*   **Group:** Mint - Operations related to minting tokens

**Request Body Parameters:**

| Parameter     | Type   | Required | Description                                            |
|---------------|--------|----------|--------------------------------------------------------|
| `user`        | string | Yes      | The public key of the user initiating the mint.        |
| `name`        | string | Yes      | The name of the token.                                 |
| `symbol`      | string | Yes      | The symbol of the token (max 10 characters).          |
| `description` | string | Yes      | A description of the token.                            |
| `imageUrl`    | string | Yes      | The URL of the image for the token.                    |
| `amount`      | number | No       | The amount of tokens to mint (optional).               |
| `twitter`     | string | No       | The Twitter URL for the token (optional).              |
| `telegram`    | string | No       | The Telegram URL for the token (optional).             |
| `website`     | string | No       | The website URL for the token (optional).              |

**Responses:**

*   `200 OK`: An object containing the result of the token launch.
    ```json
    {
      // Example success response structure
      "mintAddress": "...",
      "transactionId": "..."
    }
    ```
*   `400 Bad Request`: Missing required parameters or invalid input (e.g., invalid user public key, symbol too long).
    ```json
    {
      "error": "Missing required parameters: user, name, symbol, description, imageUrl"
    }
    ```
    ```json
    {
      "error": "Invalid user public key format"
    }
    ```
    ```json
    {
      "error": "Symbol must be less than 10 characters"
    }
    ```
*   `500 Internal Server Error`: An error occurred on the server.
    ```json
    {
      "error": "Internal server error"
    }
    ```

**Example Usage (using curl, assuming body params are sent in query for GET):**

```bash
curl "http://localhost:PORT/?user=<USER_PUBLIC_KEY>&name=MyToken&symbol=MTK&description=This%20is%20my%20token&imageUrl=http%3A%2F%2Fexample.com%2Fimage.png"
```
(Note: Sending a request body with GET is unconventional. If this is intended to be a POST, the JSDoc should be updated, or the route changed to `router.post`. If it's a GET, parameters are usually sent as query parameters.)

### 2. Claim Mint Keypair

*   **HTTP Method:** `POST`
*   **Path:** `/claim`
*   **Description:** Claims the keypair for a previously minted token.
*   **Group:** Mint - Operations related to minting tokens

**Request Body Parameters:**

| Parameter     | Type   | Required | Description                   |
|---------------|--------|----------|-------------------------------|
| `mintAddress` | string | Yes      | The mint address to claim.    |

**Responses:**

*   `200 OK`: Successfully claimed. (Empty response body)
*   `400 Bad Request`: Missing required `mintAddress`.
    ```json
    {
      "error": "Missing required parameters: mintAddress"
    }
    ```
*   `500 Internal Server Error`: An error occurred on the server.
    ```json
    {
      "error": "Internal server error"
    }
    ```

**Example Usage (using curl):**

```bash
cURL -X POST http://localhost:PORT/ \
     -H "Content-Type: application/json" \
     -d '{"mintAddress": "YOUR_MINT_ADDRESS"}'
```

### 3. Launch a New Token (Frontend Signed)

*   **HTTP Method:** `POST`
*   **Path:** `/post-signed-tx`
*   **Description:** Launches a new token on Pump.fun or Meteora, where the transaction is signed by the frontend. The `platform` parameter determines which platform to use.
*   **Group:** Mint - Operations related to minting tokens

**Request Body Parameters:**

| Parameter     | Type   | Required | Description                                            |
|---------------|--------|----------|--------------------------------------------------------|
| `user`        | string | Yes      | The public key of the user initiating the mint.        |
| `name`        | string | Yes      | The name of the token.                                 |
| `symbol`      | string | Yes      | The symbol of the token (max 10 characters).           |
| `description` | string | Yes      | A description of the token.                            |
| `imageUrl`    | string | Yes      | The URL of the image for the token.                    |
| `amount`      | number | No       | The amount of tokens to mint (optional).               |
| `twitter`     | string | No       | The Twitter URL for the token (optional).              |
| `telegram`    | string | No       | The Telegram URL for the token (optional).             |
| `website`     | string | No       | The website URL for the token (optional).              |
| `platform`    | string | No       | The platform to use for minting the token. Supported values: `pumpfun`, `meteora`. |

**Responses:**

*   `200 OK`: An object containing the result of the token launch.
    ```json
    {
      // Example success response structure
      "mintAddress": "...",
      "transactionId": "..."
    }
    ```
*   `400 Bad Request`: Missing required parameters or invalid input.
    ```json
    {
      "error": "Missing required parameters: user, name, symbol, description, imageUrl"
    }
    ```
    ```json
    {
      "error": "Invalid user public key format"
    }
    ```
    ```json
    {
      "error": "Symbol must be less than 10 characters"
    }
    ```
*   `500 Internal Server Error`: An error occurred on the server.
    ```json
    {
      "error": "Internal server error"
    }
    ```

**Example Usage (using curl):**

```bash
curl -X POST http://localhost:PORT/mint/post-signed-tx \
     -H "Content-Type: application/json" \
     -d '{
       "user": "<USER_PUBLIC_KEY>",
       "name": "MyToken",
       "symbol": "MTK",
       "description": "This is my token",
       "imageUrl": "http://example.com/image.png",
       "platform": "meteora"
     }'
```

### 4. Sign Transaction

*   **HTTP Method:** `POST`
*   **Path:** `/sign-tx`
*   **Description:** Signs a transaction for a given mint address.
*   **Group:** Mint - Operations related to minting tokens

**Request Body Parameters:**

| Parameter     | Type   | Required | Description                                            |
|---------------|--------|----------|--------------------------------------------------------|
| `mintAddress` | string | Yes      | The mint address for which the transaction is being signed. |
| `tx`          | string | Yes      | The transaction to be signed (presumably base64 encoded string or similar). |


**Responses:**

*   `200 OK`: An object containing the transaction hash.
    ```json
    {
      "hash": "..."
    }
    ```
*   `400 Bad Request`: Missing required `mintAddress`.
    ```json
    {
      "error": "Missing required parameters: mintAddress"
    }
    ```
*   `500 Internal Server Error`: An error occurred on the server.
    ```json
    {
      "error": "Internal server error"
    }
    ```

**Example Usage (using curl):**

```bash
curl -X POST http://localhost:PORT/ \
     -H "Content-Type: application/json" \
     -d '{"mintAddress": "YOUR_MINT_ADDRESS"}'
```

---

## Fee Endpoints

The following endpoints are available under the `/fee` base path (assuming the router is mounted under `/fee` in your main application file, e.g., `app.use('/fee', feeRoutes);`).

### 1. Claim Creator Fee

*   **HTTP Method:** `POST`
*   **Path:** `/claim-creator-fee`
*   **Description:** Returns a base64-encoded transaction to claim all available creator fees for a given token mint address and claimer.
*   **Group:** Fee - Operations related to claiming creator fees

**Request Body Parameters:**

| Parameter     | Type   | Required | Description                                            |
|---------------|--------|----------|--------------------------------------------------------|
| `tokenMint`   | string | Yes      | The token mint address for which to claim fees.        |
| `claimer`     | string | Yes      | The public key of the claimer.                        |

**Responses:**

*   `200 OK`: An object containing the base64 transaction.
    ```json
    {
      "tx": "..." // base64-encoded transaction
    }
    ```
*   `400 Bad Request`: Missing or invalid required parameters.
    ```json
    {
      "error": "Missing required parameters: tokenMint, claimer"
    }
    ```
    ```json
    {
      "error": "Invalid public key format for tokenMint or claimer"
    }
    ```
*   `500 Internal Server Error`: An error occurred on the server.
    ```json
    {
      "error": "Internal server error"
    }
    ```

**Example Usage (using curl):**

```bash
curl -X POST http://localhost:PORT/fee/claim-creator-fee \
     -H "Content-Type: application/json" \
     -d '{"tokenMint": "TOKEN_MINT_ADDRESS", "claimer": "CLAIMER_PUBLIC_KEY"}'
```

### 2. Get Pending Fee

*   **HTTP Method:** `POSR`
*   **Path:** `/pending-fee`
*   **Description:** Returns the pending creator and LP fees for a given token mint address and claimer.
*   **Group:** Fee - Operations related to claiming creator fees

**Request Body Parameters:**

| Parameter     | Type   | Required | Description                                            |
|---------------|--------|----------|--------------------------------------------------------|
| `tokenMint`   | string | Yes      | The token mint address for which to check fees.        |
| `claimer`     | string | Yes      | The public key of the claimer.                        |

**Responses:**

*   `200 OK`: An object containing the pending fee information.
    ```json
    {
        "isMigrated": true,
        "curve": {
            "baseToken": 0,
            "quoteToken": 0
        },
        "lp": {
            "claimedFee": {
                "baseToken": 0,
                "quoteToken": 0
            },
            "unclaimedFee": {
                "baseToken": 0,
                "quoteToken": 40480696
            }
        }
    }
    ```
*   `400 Bad Request`: Invalid public key format for tokenMint or claimer.
    ```json
    {
      "error": "Invalid public key format for tokenMint or claimer"
    }
    ```
*   `500 Internal Server Error`: An error occurred on the server.
    ```json
    {
      "error": "Internal server error"
    }
    ```

**Example Usage (using curl):**

```bash
curl -X GET http://localhost:PORT/fee/pending-fee \
     -H "Content-Type: application/json" \
     -d '{"tokenMint": "TOKEN_MINT_ADDRESS", "claimer": "CLAIMER_PUBLIC_KEY"}'
```

---

## Partner Endpoints

The following endpoints are available under the `/partner` base path (assuming the router is mounted under `/partner` in your main application file, e.g., `app.use('/partner', partnerRoutes);`).

### 1. Block Token

*   **HTTP Method:** `POST`
*   **Path:** `/block`
*   **Description:** Blocks a token by its mint address, preventing further operations on it.
*   **Group:** Partner - Operations related to blocking tokens

**Request Body Parameters:**

| Parameter     | Type   | Required | Description                                            |
|---------------|--------|----------|--------------------------------------------------------|
| `tokenMint`   | string | Yes      | The token mint address to be blocked.                  |

**Responses:**

*   `200 OK`: An object containing the blocked status.
    ```json
    {
      "blocked": true
    }
    ```
*   `400 Bad Request`: Missing or invalid required parameters.
    ```json
    {
      "error": "Missing required parameters: tokenMint"
    }
    ```
    ```json
    {
      "error": "Invalid public key format for tokenMint"
    }
    ```
*   `500 Internal Server Error`: An error occurred on the server.
    ```json
    {
      "error": "Internal server error"
    }
    ```

**Example Usage (using curl):**

```bash
curl -X POST http://localhost:PORT/partner/block \
     -H "Content-Type: application/json" \
     -d '{"tokenMint": "TOKEN_MINT_ADDRESS"}'
```

## Notes

*   Ensure your environment variables (e.g., for Solana connection, Pump.fun API keys if any) are set up correctly. Create a `.env` file if needed, based on a `.env.example` (if provided).