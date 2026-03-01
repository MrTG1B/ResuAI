# PDF Generator Service

A standalone Node.js microservice that generates professional single-page PDFs from resume data using **LaTeX** compilation, with an HTML-to-PDF fallback via Playwright.

---

## Overview

This service is part of the ResuAI backend. It runs as a separate process and exposes an HTTP API that the main Next.js application calls when a user requests a PDF download of their resume.

**Two generation modes:**
1. **LaTeX mode** (default) – Receives structured resume JSON, generates a `.tex` file, compiles with `pdflatex`, and returns a PDF. Produces professional, typeset output.
2. **HTML fallback** – Receives raw HTML, renders it in a Playwright headless browser, and exports as PDF.

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **LaTeX** (`pdflatex`) – Install [TeX Live](https://tug.org/texlive/) or [MiKTeX](https://miktex.org/) for LaTeX mode
- Or use Docker (see below) to avoid installing LaTeX locally

### Install & Run

```bash
cd pdf-generator-service
npm install
node server.js
# Service starts on http://localhost:3001
```

### Run with Docker

```bash
cd pdf-generator-service
docker build -t resuai-pdf-service .
docker run -p 3001:3001 resuai-pdf-service
```

---

## API Reference

### `POST /generate-pdf`

Generates a PDF from resume data or raw HTML.

**Rate limit:** 10 requests per minute per IP.

#### Option 1 – LaTeX (structured resume data)

```bash
curl -X POST http://localhost:3001/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "resumeData": {
      "name": "Jane Doe",
      "title": "Software Engineer",
      "email": "jane@example.com",
      "phone": "+1 555-0100",
      "location": "San Francisco, CA",
      "summary": "Experienced software engineer...",
      "experience": [...],
      "education": [...],
      "skills": [...]
    }
  }'
```

#### Option 2 – HTML fallback

```bash
curl -X POST http://localhost:3001/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{ "html": "<html><body>...</body></html>" }'
```

**Response:** `application/pdf` binary stream (or `application/octet-stream`).

---

## Environment

No environment variables are required for basic operation. The service uses system-installed `pdflatex` and Playwright's bundled Chromium.

---

## Development Notes

- `server.js` – Express HTTP server, route handler, LaTeX compilation logic
- `latex-generator.js` – Generates `.tex` source from resume JSON
- `Dockerfile` – Production-ready container with LaTeX pre-installed

For backend-wide documentation see [docs/backend/README.md](../docs/backend/README.md).
