from flask import Flask, request, jsonify, send_from_directory, url_for
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename

from langchain_utils import extract_text_from_pdf, mcq_quiz_generator, chat_with_document
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


# if __name__ == '__main__':
#     app.run(debug=True, port=5000)
if __name__ == '__main__':
    from os import environ
    port = int(environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
