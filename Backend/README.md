# DocSensei Backend

This is a Flask backend for DocSensei. It exposes endpoints for document upload and content extraction, and is ready for further integration with LangChain for advanced document processing.

## Endpoints

- `POST /upload` — Upload a PDF or Word document. Returns a file URL.
- `POST /extract` — (Stub) Extract content from an uploaded file. To be implemented with LangChain.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the server:
   ```bash
   python app.py
   ```

## Notes
- Uploaded files are saved in the `uploads/` directory.
- CORS is enabled for local development.
- Extend `/extract` with LangChain logic as needed.
