from flask import Flask, request, jsonify, send_from_directory, url_for
from flask_cors import CORS
import hashlib
import json
import os
import time
from urllib.parse import urlparse
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge

from langchain_utils import extract_text_from_pdf, extract_page_vision, mcq_quiz_generator, chat_with_document, summarize_page
from logger import get_logger
from dotenv import load_dotenv

SAMPLE_PYTHON_PAGES = [
    """Introduction to Python

Python is a high-level, interpreted, and dynamically-typed programming language created by Guido van Rossum and first released in 1991. Named after the British comedy group Monty Python, the language was designed with an emphasis on code readability and simplicity.

Key Features of Python:
- Interpreted: Python code is executed line-by-line by the Python interpreter, making debugging easier.
- Dynamically Typed: You do not need to declare variable types; Python determines the type at runtime.
- Object-Oriented: Python supports classes, objects, inheritance, and polymorphism.
- High-Level: Python abstracts many low-level details, allowing developers to focus on problem-solving.
- Extensive Standard Library: Python comes with a rich set of built-in modules for various tasks.

Why Learn Python?
Python is one of the most popular programming languages in the world. It is widely used in:
- Web Development (Django, Flask)
- Data Science and Machine Learning (NumPy, Pandas, TensorFlow)
- Automation and Scripting
- Scientific Computing
- Artificial Intelligence

Your First Python Program:
The traditional first program in any language prints "Hello, World!" to the screen.

  print("Hello, World!")
  Output: Hello, World!

The print() function outputs text to the console. In Python, strings are enclosed in either single (') or double (") quotation marks.

Python uses indentation (whitespace) to define code blocks, unlike other languages that use braces {}. This makes Python code visually clean and consistent. Python code files use the .py extension and can be run with the command: python filename.py""",

    """Variables and Data Types in Python

A variable is a named location in memory used to store data. In Python, you create a variable simply by assigning a value to it using the assignment operator (=).

Variable Naming Rules:
- Must start with a letter or underscore (_)
- Can contain letters, numbers, and underscores
- Are case-sensitive (name and Name are different variables)
- Cannot use Python keywords (like if, for, while, class)

Examples:
  name = "Alice"
  age = 25
  height = 5.7
  is_student = True

Python's Built-in Data Types:
1. Integer (int): Whole numbers without decimals.
   count = 10
   negative = -5

2. Float (float): Numbers with decimal points.
   pi = 3.14159
   temperature = -2.5

3. String (str): Sequences of characters enclosed in quotes.
   greeting = "Hello, Python!"

4. Boolean (bool): Represents True or False values.
   is_active = True
   has_finished = False

5. NoneType (None): Represents the absence of a value.
   result = None

Type Conversion:
You can convert between types using built-in functions:
- int("42") converts the string "42" to integer 42
- float(10) converts integer 10 to float 10.0
- str(3.14) converts float 3.14 to string "3.14"
- bool(0) evaluates to False; bool(1) evaluates to True

The type() function returns the data type of any variable:
  x = 42
  print(type(x))  # Output: <class 'int'>

String Operations:
- len("Hello") returns 5 (the length)
- "hello".upper() returns "HELLO"
- "WORLD".lower() returns "world"
- "Hello, World!"[0:5] returns "Hello" (slicing)
- "Python" + " is great" returns "Python is great" (concatenation)
- "ha" * 3 returns "hahaha" (repetition)""",

    """Control Flow in Python

Control flow determines the order in which statements are executed. Python provides several control flow tools.

Conditional Statements (if/elif/else):
The if statement executes a block of code only when a condition is True.

  age = 18
  if age >= 18:
      print("Adult")
  elif age >= 13:
      print("Teenager")
  else:
      print("Child")

Comparison Operators:
- == (equal to)
- != (not equal to)
- > (greater than)
- < (less than)
- >= (greater than or equal to)
- <= (less than or equal to)

Logical Operators:
- and: True if both conditions are True
- or: True if at least one condition is True
- not: Reverses the boolean value

  x = 15
  if x > 10 and x < 20:
      print("x is between 10 and 20")

For Loops:
A for loop iterates over a sequence (list, string, range, etc.).

  for i in range(5):
      print(i)  # Prints 0, 1, 2, 3, 4

  fruits = ["apple", "banana", "cherry"]
  for fruit in fruits:
      print(fruit)

The range() function generates a sequence of numbers:
- range(5) produces 0, 1, 2, 3, 4
- range(1, 6) produces 1, 2, 3, 4, 5
- range(0, 10, 2) produces 0, 2, 4, 6, 8

While Loops:
A while loop executes as long as the condition remains True.

  count = 0
  while count < 5:
      print(count)
      count += 1

Loop Control Statements:
- break: Immediately exits the loop
- continue: Skips the rest of the current iteration and continues to the next
- pass: Does nothing; used as a placeholder

  for i in range(10):
      if i == 5:
          break       # Stops the loop at 5
      if i % 2 == 0:
          continue    # Skips even numbers
      print(i)        # Prints only odd numbers less than 5""",

    """Functions in Python

A function is a reusable block of code that performs a specific task. Functions help organize code, avoid repetition, and improve readability.

Defining a Function:
Use the def keyword followed by the function name and parentheses.

  def greet(name):
      print("Hello, " + name + "!")

  greet("Alice")  # Output: Hello, Alice!

Parameters and Arguments:
- Parameters are variables listed in the function definition.
- Arguments are the actual values passed when calling the function.

Return Statements:
Functions can return a value using the return keyword.

  def add(a, b):
      return a + b

  result = add(3, 5)  # result is 8

Default Parameter Values:
You can provide default values for parameters.

  def greet(name, greeting="Hello"):
      print(greeting + ", " + name + "!")

  greet("Bob")           # Output: Hello, Bob!
  greet("Bob", "Hi")     # Output: Hi, Bob!

*args and **kwargs:
- *args allows a function to accept any number of positional arguments as a tuple.
- **kwargs allows a function to accept any number of keyword arguments as a dictionary.

  def sum_all(*args):
      return sum(args)

  print(sum_all(1, 2, 3, 4))  # Output: 10

  def display_info(**kwargs):
      for key, value in kwargs.items():
          print(f"{key}: {value}")

  display_info(name="Alice", age=25)

Scope - Local vs Global Variables:
- Local variables are defined inside a function and only accessible within it.
- Global variables are defined outside functions and accessible everywhere.

  x = 10  # Global variable

  def my_func():
      y = 20  # Local variable
      print(x + y)  # Can access global x

Lambda Functions:
Lambda functions are small anonymous functions defined with the lambda keyword.
They can have any number of arguments but only one expression.

  square = lambda x: x ** 2
  print(square(5))  # Output: 25

  numbers = [3, 1, 4, 1, 5, 9]
  numbers.sort(key=lambda x: -x)  # Sort in descending order""",

    """Data Structures in Python

Python provides several built-in data structures to store and organize data efficiently.

Lists:
A list is an ordered, mutable (changeable) collection of items enclosed in square brackets [].

  fruits = ["apple", "banana", "cherry"]
  fruits.append("date")         # Add item to end
  fruits.remove("banana")       # Remove specific item
  fruits.sort()                 # Sort alphabetically
  print(fruits[0])              # Access by index: first item
  print(fruits[-1])             # Last item via negative indexing
  print(fruits[1:3])            # Slicing: items at index 1 and 2

Key List Methods:
- append(item): Adds item to end
- insert(index, item): Inserts at specific position
- remove(item): Removes first occurrence of item
- pop(index): Removes and returns item at index
- sort(): Sorts list in place
- len(list): Returns the number of items

Tuples:
A tuple is an ordered, immutable (unchangeable) collection enclosed in parentheses ().
Once created, it cannot be modified, which makes it faster than lists.

  coordinates = (10, 20)
  point = (3, 4, 5)
  x, y, z = point  # Tuple unpacking

Dictionaries:
A dictionary stores key-value pairs enclosed in curly braces {}. Keys must be unique and immutable.

  student = {"name": "Alice", "age": 20, "grade": "A"}
  print(student["name"])          # Access value: Alice
  student["age"] = 21             # Update value
  student["school"] = "MIT"       # Add new key-value pair
  del student["grade"]            # Delete a key

  for key, value in student.items():
      print(key, ":", value)

Sets:
A set is an unordered collection of unique elements. Duplicates are automatically removed.

  numbers = {1, 2, 3, 3, 4, 4}
  print(numbers)  # Output: {1, 2, 3, 4}

  set_a = {1, 2, 3, 4}
  set_b = {3, 4, 5, 6}
  print(set_a & set_b)  # Intersection: {3, 4}
  print(set_a | set_b)  # Union: {1, 2, 3, 4, 5, 6}
  print(set_a - set_b)  # Difference: {1, 2}

List Comprehension:
A concise way to create lists based on existing sequences.

  squares = [x**2 for x in range(10)]
  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

  even_numbers = [x for x in range(20) if x % 2 == 0]
  # [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]""",

    """Modules and the Python Ecosystem

A module is a file containing Python code (functions, classes, variables) that can be imported and reused in other programs. Modules promote code reuse and organization.

Importing Modules:
  import math                          # Import entire module
  print(math.pi)                       # Access member: 3.14159...
  print(math.sqrt(16))                 # Use function: 4.0

  from math import pi, sqrt            # Import specific items
  print(pi)                            # 3.14159...

  import datetime as dt                 # Import with alias
  today = dt.date.today()

Python Standard Library Modules:
Python ships with a rich standard library. Key modules include:
- math: Mathematical functions (sqrt, floor, ceil, sin, cos, log)
- os: Operating system interface (file paths, directories, environment variables)
- sys: System-specific parameters (command-line arguments, Python version)
- datetime: Dates, times, and time arithmetic
- random: Random number generation (random(), choice(), shuffle(), randint())
- json: Parse and create JSON data for data exchange
- re: Regular expressions for advanced pattern matching
- collections: Advanced data types (Counter, defaultdict, deque, OrderedDict)

  import random
  print(random.randint(1, 100))        # Random integer between 1 and 100

  import os
  print(os.getcwd())                   # Print current working directory

pip - The Package Manager:
pip is Python's standard package installer. It downloads libraries from PyPI (Python Package Index).

  pip install requests     # Install the requests library
  pip install numpy        # Install NumPy for numerical computing
  pip install pandas       # Install Pandas for data analysis

Popular Third-Party Libraries:
- NumPy: Fast numerical computing with N-dimensional arrays and matrices
- Pandas: Data analysis and manipulation with powerful DataFrames
- Matplotlib / Seaborn: Data visualization and statistical plotting
- Requests: Simple and elegant HTTP requests for web APIs
- Flask / Django: Web application development frameworks
- TensorFlow / PyTorch: Machine learning and deep learning
- SQLAlchemy: Database toolkit and Object Relational Mapper (ORM)

Creating Your Own Module:
Save functions in a file (e.g., mymodule.py) and import it in another file.

  # mymodule.py
  def say_hello(name):
      return "Hello, " + name

  # main.py
  import mymodule
  print(mymodule.say_hello("Python"))  # Output: Hello, Python

Virtual Environments:
Use venv to create isolated Python environments per project, preventing dependency conflicts.
  python -m venv myenv       # Create virtual environment
  source myenv/bin/activate  # Activate (macOS/Linux)""",
]

load_dotenv()

system_logger = get_logger('SYSTEM')
ai_logger = get_logger('AI')

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}
EXTRACTION_CACHE_SUFFIX = '.pages.json'

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100 MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.before_request
def log_request_start():
    system_logger.info(
        'Incoming request: method=%s path=%s content_type=%s content_length=%s',
        request.method,
        request.path,
        request.content_type,
        request.content_length,
    )


@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(_error):
    max_size_mb = app.config['MAX_CONTENT_LENGTH'] // (1024 * 1024)
    system_logger.error('Upload rejected: payload too large (limit=%dMB)', max_size_mb)
    return jsonify({'error': f'File is too large. Maximum allowed size is {max_size_mb}MB.'}), 413
 
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def hash_uploaded_file(file_storage):
    digest = hashlib.sha256()
    file_storage.stream.seek(0)
    while True:
        chunk = file_storage.stream.read(1024 * 1024)
        if not chunk:
            break
        digest.update(chunk)
    file_storage.stream.seek(0)
    return digest.hexdigest()


def resolve_uploaded_file_path(file_url):
    if not file_url:
        return None
    parsed_url = urlparse(file_url)
    filename = secure_filename(os.path.basename(parsed_url.path))
    if not filename:
        return None
    return os.path.join(app.config['UPLOAD_FOLDER'], filename)


def get_extraction_cache_path(file_path):
    return f'{file_path}{EXTRACTION_CACHE_SUFFIX}'


def load_extraction_cache(file_path):
    cache_path = get_extraction_cache_path(file_path)
    if not os.path.exists(cache_path):
        return None
    try:
        with open(cache_path, 'r', encoding='utf-8') as cache_file:
            cached_payload = json.load(cache_file)
        pages = cached_payload.get('pages')
        if isinstance(pages, list) and all(isinstance(page, str) for page in pages):
            return pages
    except (OSError, json.JSONDecodeError) as exc:
        system_logger.warning('Failed to read extraction cache for %s: %s', file_path, exc)
    return None


def save_extraction_cache(file_path, pages):
    cache_path = get_extraction_cache_path(file_path)
    try:
        with open(cache_path, 'w', encoding='utf-8') as cache_file:
            json.dump({'pages': pages}, cache_file, ensure_ascii=False)
    except OSError as exc:
        system_logger.warning('Failed to write extraction cache for %s: %s', file_path, exc)


def is_successful_extraction(pages):
    return (
        isinstance(pages, list)
        and all(isinstance(page, str) for page in pages)
        and not any(page.startswith('[Error ') for page in pages)
    )

# Serve uploaded files
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/upload', methods=['POST'])
def upload_file():
    endpoint_start = time.monotonic()
    system_logger.info('Upload handler started')

    if request.content_length:
        system_logger.info(
            'Upload request size: %.2f MB',
            request.content_length / (1024 * 1024),
        )

    if 'file' not in request.files:
        system_logger.error('No file part in upload request')
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        system_logger.error('No selected file in upload request')
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        original_name = secure_filename(file.filename)
        _, extension = os.path.splitext(original_name)
        system_logger.info('Upload validated: original_name=%s extension=%s', original_name, extension.lower())

        hash_start = time.monotonic()
        file_hash = hash_uploaded_file(file)
        system_logger.info('Computed upload hash in %.2fs', time.monotonic() - hash_start)

        stored_filename = f'{file_hash}{extension.lower()}'
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], stored_filename)
        file_already_exists = os.path.exists(file_path)

        if not file_already_exists:
            save_start = time.monotonic()
            file.save(file_path)
            saved_size_bytes = os.path.getsize(file_path)
            system_logger.info(
                'File uploaded: %s -> %s (size=%.2f MB, save_elapsed=%.2fs)',
                original_name,
                stored_filename,
                saved_size_bytes / (1024 * 1024),
                time.monotonic() - save_start,
            )
        else:
            system_logger.info('Duplicate upload reused existing file: %s -> %s', original_name, stored_filename)

        file_url = url_for('uploaded_file', filename=stored_filename, _external=True)
        system_logger.info('Upload handler completed in %.2fs', time.monotonic() - endpoint_start)
        return jsonify({'fileUrl': file_url, 'cached': file_already_exists})

    system_logger.error('Invalid file type uploaded')
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/extract', methods=['POST'])
def extract_content():
    endpoint_start = time.monotonic()
    data = request.json or {}
    file_url = data.get('fileUrl')
    if not file_url:
        system_logger.error('Invalid fileUrl received for extraction')
        return jsonify({'error': 'Invalid fileUrl'}), 400

    file_path = resolve_uploaded_file_path(file_url)
    if not file_path:
        system_logger.error('Could not resolve file path from fileUrl: %s', file_url)
        return jsonify({'error': 'Invalid fileUrl'}), 400

    if not os.path.exists(file_path):
        system_logger.error('File not found for extraction: %s', file_path)
        return jsonify({'error': 'File not found'}), 404

    try:
        file_size_bytes = os.path.getsize(file_path)
    except OSError:
        file_size_bytes = 0

    ai_logger.info(
        'Extraction request resolved: path=%s size=%.2f MB',
        file_path,
        file_size_bytes / (1024 * 1024) if file_size_bytes else 0,
    )

    cached_pages = load_extraction_cache(file_path)
    if cached_pages is not None:
        ai_logger.info(
            'Using cached extraction for %s (pages=%d, elapsed=%.2fs)',
            file_path,
            len(cached_pages),
            time.monotonic() - endpoint_start,
        )
        return jsonify({'pages': cached_pages, 'cached': True})

    ai_logger.info('Extracting content from %s', file_path)
    content = extract_text_from_pdf(file_path)

    if is_successful_extraction(content):
        save_extraction_cache(file_path, content)
        ai_logger.info('Extraction cache saved for %s (pages=%d)', file_path, len(content))
    else:
        ai_logger.warning('Extraction returned errors for %s; skipping cache write', file_path)

    ai_logger.info(
        'Extraction complete for %s (pages=%d, elapsed=%.2fs)',
        file_path,
        len(content),
        time.monotonic() - endpoint_start,
    )
    return jsonify({'pages': content, 'cached': False})

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    data = request.json
    ai_logger.info('[generate-quiz] Received request body: %s', data)
    pages = data.get('pages')
    page_number = data.get('pageNumber')
    document_id = data.get('documentId')
    if not pages or not isinstance(pages, list):
        ai_logger.error('No pages provided for quiz generation. Got: %s', pages)
        return jsonify({'error': 'No pages provided'}), 400
    try:
        idx = int(page_number) - 1 if page_number else 0
        if idx < 0 or idx >= len(pages):
            page_content = pages[0]
        else:
            page_content = pages[idx]

        # Auto-skip pages that are too short to quiz (< 50 words)
        # Saves an LLM call and avoids forcing quizzes on section breaks / cover pages
        word_count = len(page_content.split()) if page_content else 0
        if word_count < 50:
            ai_logger.info(
                'Page %s has only %d words — auto-skipping quiz (thin page)',
                page_number, word_count
            )
            return jsonify({
                'valid': False,
                'result': 'Not a quizable page',
                'validation_explanation':
                    f'This page contains only {word_count} word(s). '
                    'It is likely a section break, cover, or short intro and does not '
                    'need a quiz.'
            })

        ai_logger.info('Generating quiz for document %s, page %s', document_id, page_number)
        quiz = mcq_quiz_generator(page_content)
        ai_logger.info('Quiz generation complete')
        return jsonify(quiz)
    except Exception as e:
        ai_logger.error('Quiz generation failed: %s', e)
        return jsonify({'error': str(e)}), 500


@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '').strip()
    context = data.get('context', '')
    document_name = data.get('documentName', 'document')
    history = data.get('history', [])
    if not message:
        return jsonify({'error': 'No message provided'}), 400
    try:
        response = chat_with_document(message, context, document_name, history)
        ai_logger.info('Chat response generated successfully')
        return jsonify({'response': response})
    except Exception as e:
        ai_logger.error('Chat failed: %s', e)
        return jsonify({'error': str(e)}), 500


@app.route('/sample', methods=['GET'])
def get_sample_document():
    return jsonify({
        'pages': SAMPLE_PYTHON_PAGES,
        'name': 'Python Basics Tutorial',
        'type': 'PDF',
    })


@app.route('/extract-page', methods=['POST'])
def extract_page():
    """Vision-OCR a single image page on demand. Response is cached server-side."""
    endpoint_start = time.monotonic()
    data = request.json
    file_url = data.get('fileUrl')
    page_number = data.get('pageNumber')
    if not file_url or not page_number:
        return jsonify({'error': 'fileUrl and pageNumber required'}), 400

    filename = file_url.split('/')[-1]
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404

    ai_logger.info('Vision extraction requested: file=%s page=%s', file_path, page_number)
    try:
        text = extract_page_vision(file_path, int(page_number))
        ai_logger.info(
            'Vision extraction complete: file=%s page=%s chars=%d elapsed=%.2fs',
            file_path,
            page_number,
            len(text or ''),
            time.monotonic() - endpoint_start,
        )
        return jsonify({'text': text, 'pageNumber': page_number})
    except Exception as e:
        ai_logger.error('Vision extraction failed for page %s: %s', page_number, e)
        return jsonify({'error': str(e)}), 500


@app.route('/summarize', methods=['POST'])
def summarize():
    data = request.json
    pages = data.get('pages')
    page_number = data.get('pageNumber')
    if not pages or not isinstance(pages, list):
        return jsonify({'error': 'No pages provided'}), 400
    try:
        idx = int(page_number) - 1 if page_number else 0
        if idx < 0 or idx >= len(pages):
            idx = 0
        page_content = pages[idx]
        ai_logger.info('Generating summary for page %s', page_number)
        summary = summarize_page(page_content)
        return jsonify(summary)
    except Exception as e:
        ai_logger.error('Summary generation failed: %s', e)
        return jsonify({'error': str(e)}), 500


# if __name__ == '__main__':
#     app.run(debug=True, port=5000)
if __name__ == '__main__':
    from os import environ
    port = int(environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
