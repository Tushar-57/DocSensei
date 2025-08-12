
from flask import Flask, request, jsonify, send_from_directory, url_for
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from langchain_utils import extract_text_from_pdf
from logger import get_logger

system_logger = get_logger('SYSTEM')
ai_logger = get_logger('AI')

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}

app = Flask(__name__)
CORS(app)
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
    return jsonify({'content': content})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
