from flask import Flask, request, jsonify, send_from_directory, url_for
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename

from langchain_utils import extract_text_from_pdf, mcq_quiz_generator
from logger import get_logger
from dotenv import load_dotenv

load_dotenv()

system_logger = get_logger('SYSTEM')
ai_logger = get_logger('AI')

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
 
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Serve uploaded files
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        system_logger.error('No file part in upload request')
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        system_logger.error('No selected file in upload request')
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        system_logger.info(f'File uploaded: {filename}')
        # Return the full URL to the uploaded file
        file_url = url_for('uploaded_file', filename=filename, _external=True)
        return jsonify({'fileUrl': file_url})
    system_logger.error('Invalid file type uploaded')
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/extract', methods=['POST'])
def extract_content():
    data = request.json
    file_url = data.get('fileUrl')
    # Convert file_url to local file path
    if not file_url or not file_url.startswith('http'):
        system_logger.error('Invalid fileUrl received for extraction')
        return jsonify({'error': 'Invalid fileUrl'}), 400
    filename = file_url.split('/')[-1]
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(file_path):
        system_logger.error(f'File not found for extraction: {file_path}')
        return jsonify({'error': 'File not found'}), 404
    ai_logger.info(f'Extracting content from {file_path}')
    content = extract_text_from_pdf(file_path)
    ai_logger.info(f'Extraction complete for {file_path}')
    # If PDF, content is a list of page texts; if text file, it's a list with one item
    return jsonify({'pages': content})

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    data = request.json
    ai_logger.info(f"[generate-quiz] Received request body: {data}")
    pages = data.get('pages')
    page_number = data.get('pageNumber')
    document_id = data.get('documentId')
    if not pages or not isinstance(pages, list):
        ai_logger.error(f'No pages provided for quiz generation. Got: {pages}')
        return jsonify({'error': 'No pages provided'}), 400
    try:
        idx = int(page_number) - 1 if page_number else 0
        if idx < 0 or idx >= len(pages):
            page_content = pages[0]
        else:
            page_content = pages[idx]
        ai_logger.info('Generating quiz for document %s, page %s', document_id, page_number)
        print("\n--- Document Page Content for Quiz Generation ---\n", page_content, "\n--- END ---\n")
        quiz = mcq_quiz_generator(page_content)
        ai_logger.info('Quiz generation complete')
        return jsonify(quiz)
    except Exception as e:
        ai_logger.error('Quiz generation failed: %s', e)
        return jsonify({'error': str(e)}), 500


# if __name__ == '__main__':
#     app.run(debug=True, port=5000)
if __name__ == '__main__':
    from os import environ
    port = int(environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
