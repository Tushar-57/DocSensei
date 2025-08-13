#lanchain_utils.py
from logger import get_logger
import json
from langchain_core.output_parsers import JsonOutputParser
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import prompt_library



load_dotenv()
ai_logger = get_logger('AI')
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.2)


# LangSmith tracing test (run once at import if tracing is enabled)
if os.environ.get("LANGSMITH_TRACING", "false").lower() == "true":
    try:
        ai_logger.info("LangSmith tracing enabled. Sending test trace to project: %s", os.environ.get("LANGSMITH_PROJECT"))
        test_llm = ChatOpenAI()
        test_llm.invoke("Hello, world!")
        ai_logger.info("LangSmith test trace sent successfully.")
    except Exception as e:
        ai_logger.error("LangSmith test trace failed: %s", e)

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from a PDF or text file. For PDFs, returns a list of page texts. For text files, returns a single string in a list.
    """
    ai_logger.info(f'Starting extraction for {file_path}')
    if file_path.lower().endswith('.pdf'):
        try:
            import PyPDF2
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                pages = [page.extract_text() or '' for page in reader.pages]
            ai_logger.info('Extracted %d pages from PDF: %s', len(pages), file_path)
            return pages
        except (ImportError, OSError, PyPDF2.errors.PdfReadError) as e:
            ai_logger.error('Error extracting PDF: %s', e)
            return [f"[Error extracting PDF: {e}]"]
    else:
        # Fallback for text files
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
            ai_logger.info('Text file read successfully: %s', file_path)
            return [text]
        except (OSError, UnicodeDecodeError) as e:
            ai_logger.error('Error reading file: %s', e)
            return [f"[Error reading file: {e}]"]

# Add more LangChain-powered functions as needed.

def mcq_quiz_generator(page_content: str):
    """
    Use LLM to generate 3 MCQs with explanations for the given page content. Returns a list of question dicts.
    """
    ai_logger.info('mcq_quiz_generator received content: %s', page_content[:300])

    try:
        system_message = prompt_library.prompt_generate_quiz_v1
        user_message = "Generate MCQs for the provided content."
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_message),
            ("user", user_message)
        ])
        chain = prompt | llm | JsonOutputParser()
        response = chain.invoke({
            "page_content": page_content,
            "file_name": "Unknown.pdf",
            "additional context": "None Provided"
        })
        ai_logger.info('Raw LLM chain response: %s', response)
        # Transform 'answer' (A/B/C/D) to 'correctAnswer' (0/1/2/3) for frontend compatibility
        letter_to_index = {"A": 0, "B": 1, "C": 2, "D": 3}
        if response.get("questions") and isinstance(response["questions"], list):
            for q in response["questions"]:
                # Convert 'answer' to 'correctAnswer'
                ans = q.get("answer")
                if ans in letter_to_index:
                    q["correctAnswer"] = letter_to_index[ans]
                else:
                    q["correctAnswer"] = None
                if "answer" in q:
                    del q["answer"]
                # Convert 'choices' object to 'options' array in A,B,C,D order
                if "choices" in q and isinstance(q["choices"], dict):
                    q["options"] = [q["choices"].get(l) for l in ["A", "B", "C", "D"]]
                    del q["choices"]
        valid = response.get("valid", False)
        explanation = response.get(
            "validation_explanation", "No Response from LLM about explanation of validity."
        )
        # Ensure the response is JSON serializable (plain dict, no custom objects)
        try:
            serializable = json.loads(json.dumps(response))
            return serializable
        except Exception as e:
            ai_logger.error('Failed to serialize LLM quiz response: %s', e)
            return {"error": f"Failed to serialize LLM quiz response: {e}"}
    except Exception as e:
        ai_logger.error('Failed to run LLM chain for quiz: %s', e)
        return {"error": f"Failed to run LLM chain for quiz: {e}"}
