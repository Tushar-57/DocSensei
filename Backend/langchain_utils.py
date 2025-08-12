# langchain_utils.py
"""
This module contains utility functions for LangChain-based document processing.
Add your LangChain imports and logic here.
"""
from logger import get_logger
import json

import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import prompt_library



load_dotenv()
ai_logger = get_logger('AI')

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
    Extract text from a PDF or text file. Uses PyPDF2 for PDFs.
    """
    ai_logger.info(f'Starting extraction for {file_path}')
    if file_path.lower().endswith('.pdf'):
        try:
            import PyPDF2
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                text = "\n".join(page.extract_text() or '' for page in reader.pages)
            ai_logger.info('Extracted text from PDF: %s', file_path)
            return text
        except (ImportError, OSError, PyPDF2.errors.PdfReadError) as e:
            ai_logger.error('Error extracting PDF: %s', e)
            return f"[Error extracting PDF: {e}]"
    else:
        # Fallback for text files
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
            ai_logger.info('Text file read successfully: %s', file_path)
            return text
        except (OSError, UnicodeDecodeError) as e:
            ai_logger.error('Error reading file: %s', e)
            return f"[Error reading file: {e}]"

# Add more LangChain-powered functions as needed.

def mcq_quiz_generator(page_content: str):
    """
    Use LLM to generate 3 MCQs with explanations for the given page content. Returns a list of question dicts.
    """
    ai_logger.info('mcq_quiz_generator received content: %s', page_content[:300])

    # Create the prompt template
    
    # prompt_template = ChatPromptTemplate.from_messages([("system", prompt_library.system_message_generate_quiz)])
    prompt_template = ChatPromptTemplate.from_messages([("system", prompt_library.prompt_generate_quiz_v1)])
    prompt = prompt_template.format(page_content=page_content)
    ai_logger.info('Prompt sent to LLM:\n%s', prompt)
    print("\n--- LLM Prompt ---\n", prompt, "\n--- END PROMPT ---\n")
    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.2)
    response = llm.invoke(prompt)
    ai_logger.info('Raw LLM response: %s', response.content)
    # Parse the JSON from the LLM response
    try:
        result = json.loads(response.content)
        if "questions" in result:
            questions = result["questions"]
            # Convert to frontend format: options as array, correctAnswer as index
            formatted = []
            for idx, q in enumerate(questions):
                options = [q["choices"][k] for k in ["A", "B", "C", "D"]]
                answer_idx = ["A", "B", "C", "D"].index(q["answer"].strip())
                formatted.append({
                    "id": f"q{idx+1}",
                    "question": q["question"],
                    "options": options,
                    "correctAnswer": answer_idx,
                    "explanation": q["explanation"]
                })
            return {"questions": formatted}
        elif "result" in result:
            return {"result": result["result"]}
        elif "error" in result:
            return {"error": result["error"]}
        else:
            return {"error": "Unknown LLM response format."}
    except Exception as e:
        ai_logger.error('Failed to parse LLM quiz JSON: %s', e)
        return {"error": f"Failed to parse LLM quiz JSON: {e}"}
