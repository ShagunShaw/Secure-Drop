# SecureDrop

A secure, temporary file-sharing app with a NestJS backend API and a static frontend UI. Upload one or more files, receive a short access code, and share it — the recipient uses the code to download the files as a ZIP bundle. Bundles expire automatically and are cleaned up daily.

---

## Features

- **Multi-file upload** — upload one or multiple files in a single request; they are zipped into a bundle automatically.
- **Access codes** — each bundle gets a short, unique access code used to download it later.
- **Automatic expiry** — bundles expire after a configurable time window (default: 6 hours).
- **Daily cleanup** — a scheduled cron job runs every midnight to delete expired bundles from both Cloudinary and MongoDB.
- **File validation** — blocks dangerous file types (`.exe`, `.bat`, `.sh`) and enforces a 50 MB total upload limit.
- **Rate limiting** — upload route is capped at **3 requests / 60 s** and download route at **20 requests / 60 s** per client to prevent abuse.
- **Cloud storage** — files are stored on Cloudinary; metadata is persisted in MongoDB.
- **Frontend UI** — includes upload + download pages with drag-and-drop upload, expiry slider, code copy, and error handling.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [NestJS](https://nestjs.com/) (Node.js + TypeScript) |
| Database | [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) |
| File Storage | [Cloudinary](https://cloudinary.com/) |
| File Uploads | [Multer](https://github.com/expressjs/multer) (memory storage) |
| Compression | [Archiver](https://www.archiverjs.com/) |
| Scheduling | [@nestjs/schedule](https://docs.nestjs.com/techniques/task-scheduling) |
| Rate Limiting | [@nestjs/throttler](https://docs.nestjs.com/security/rate-limiting) |
| Frontend | HTML, CSS, Vanilla JavaScript |

---

## Prerequisites

- Node.js v18+
- A MongoDB connection string (local or Atlas)
- A Cloudinary account (free tier works)
- Python 3 (optional, only if using `python -m http.server` to serve frontend)

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd secure-drop
```

### 2. Backend setup

Install backend dependencies:

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
PORT=3000
MONGODB_URL=your_mongodb_connection_string
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Run the backend:

```bash
# Development (watch mode)
npm run start:dev

# Standard start
npm run start

# Production
npm run start:prod
```

Backend API base URL: `http://localhost:3000/api/v1`

### 3. Frontend setup

In a new terminal, from the project root:

```bash
cd frontend
```

Set the backend URL in `frontend/config.js`:

```javascript
const CONFIG = {
  BASE_URL: 'http://localhost:3000/api/v1'
};
```

Open **index.html** file and serve the frontend using **Live Server**.

Then open: `http://localhost:5500`

---

## API Reference

### Upload Files

**`POST /api/v1/file/upload`**

Uploads one or more files. They are bundled into a ZIP, stored on Cloudinary, and an access code is returned.

**Request** — `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `files` | `File[]` | One or more files to upload |

**Constraints**
- Total upload size must not exceed **50 MB**
- `.exe`, `.bat`, and `.sh` files are blocked
- Rate limited to **3 requests per 60 seconds** per client

**Response `200 OK`**

```json
{
  "message": "File(s) uploaded successfully",
  "accessCode": "abc-123",
  "url": "https://res.cloudinary.com/...",
  "expiresAt": "2026-02-21T12:00:00.000Z"
}
```

---

### Download Files

**`GET /api/v1/file/download/:filecode`**

Downloads the ZIP bundle associated with the given access code.

**Path Parameter**

| Parameter | Type | Description |
|---|---|---|
| `filecode` | `string` | The access code returned on upload |

**Responses**

| Status | Meaning |
|---|---|
| `200 OK` | Returns the ZIP file as a binary download stream |
| `404 Not Found` | No bundle exists for the given code |
| `410 Gone` | The bundle link has expired |
| `429 Too Many Requests` | Rate limit exceeded (20 requests / 60 s) |
| `500 Internal Server Error` | Could not reach Cloudinary file storage |

---

## Project Structure

```
backend/
└── src/
    ├── app.module.ts                   # Root module
    ├── main.ts                         # Entry point (port, global prefix)
    ├── configurations/
    │   ├── cloudinary.module.ts        # Cloudinary feature module
    │   └── cloudinary.provider.ts      # Cloudinary SDK configuration
    ├── file/
    │   ├── file.controller.ts          # Upload & download route handlers
    │   ├── file.service.ts             # Core business logic
    │   ├── file.module.ts              # File feature module
    │   ├── task.service.ts             # Cron job — midnight expired bundle cleanup
    │   ├── schema/
    │   │   └── bundle.schema.ts        # Mongoose schema for Bundle documents
    │   ├── utilities/
    │   │   ├── generateCode.utility.ts # Unique access code generator
    │   │   ├── upload.utility.ts       # Cloudinary upload helper
    │   │   └── zip.utility.ts          # File zipping helper (archiver)
    │   └── validation/
    │       └── file.validation_pipe.ts # Multer file validation pipe
    └── rate_limiters/
        └── throttler.decorator.ts      # Custom @UploadLimit & @DownloadLimit decorators

frontend/
├── index.html                          # Main UI (upload/download pages)
├── style.css                           # UI styles
├── script.js                           # Frontend app logic
├── config.example.js                   # Config template
└── config.js                           # Active API base URL config
```

---

## Bundle Schema (MongoDB)

| Field | Type | Description |
|---|---|---|
| `accessCode` | `string` | Short unique identifier used in the download URL |
| `cloudinaryUrl` | `string` | Public download URL on Cloudinary |
| `cloudinaryPublicId` | `string` | Cloudinary asset ID, used for deletion |
| `expiresAt` | `Date` | Expiry timestamp (default: 6 hours from upload time) |

---

## Scripts

Backend scripts (run inside `backend/`):

```bash
npm run start:dev     # Start in watch mode (development)
npm run build         # Compile TypeScript to JavaScript
npm run start:prod    # Run the compiled production build
npm run lint          # Lint and auto-fix source files
npm run format        # Format source files with Prettier
npm run test          # Run unit tests
npm run test:e2e      # Run end-to-end tests
npm run test:cov      # Generate test coverage report
```

---

## License

UNLICENSED — private project.
