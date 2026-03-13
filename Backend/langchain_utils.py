#lanchain_utils.py
from logger import get_logger
import json
from functools import lru_cache
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.messages import SystemMessage, HumanMessage
import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import prompt_library

import base64
import fitz  # PyMuPDF
from openai import OpenAI
from pypdf import PdfReader


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


_openai_client = OpenAI()


def _ocr_page_vision(page: fitz.Page) -> str:
    """Render a PDF page to PNG and extract text via GPT-4o-mini Vision."""
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    b64 = base64.b64encode(pix.tobytes("png")).decode()
    response = _openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": "Extract all text from this image exactly as it appears. Return only the extracted text, no commentary."},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}", "detail": "high"}}
            ]
        }],
        max_tokens=2000
    )
    return response.choices[0].message.content


@lru_cache(maxsize=512)
def extract_page_vision(file_path: str, page_number: int) -> str:
    """
    Extract text from a single image-only page via GPT-4o-mini Vision.
    Cached so each page is only ever Vision-processed once per server lifetime.
    """
    ai_logger.info('Vision OCR for %s page %d', file_path, page_number)
    doc = fitz.open(file_path)
    page = doc[page_number - 1]
    text = _ocr_page_vision(page)
    doc.close()
    return text


def extract_text_from_pdf(file_path: str) -> list:
    """
    Extract text from a PDF using pypdf (text layer only, no Vision).
    Image-only pages return empty string — call extract_page_vision() lazily for those.
    Returns a list of page texts.
    """
    ai_logger.info('Starting extraction for %s', file_path)
    if file_path.lower().endswith('.pdf'):
        try:
            reader = PdfReader(file_path)
            if reader.is_encrypted:
                reader.decrypt("")
            pages = [(page.extract_text() or '').strip() for page in reader.pages]
            ai_logger.info('Extracted %d pages from PDF: %s', len(pages), file_path)
            return pages
        except Exception as e:
            ai_logger.error('Error extracting PDF: %s', e)
            return [f"[Error extracting PDF: {e}]"]
    else:
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


def chat_with_document(message: str, context: str, document_name: str, history: list) -> str:
    """
    Chat with the AI about the current page of a document.
    Uses conversation history for context continuity.
    """
    ai_logger.info('chat_with_document called with message: %s', message[:100])

    # Build conversation history string (last 6 messages to stay within token limits)
    history_str = ""
    for msg in history[-6:]:
        role = "User" if msg.get("sender") == "user" else "Assistant"
        text = msg.get("text", "").strip()
        if text:
            history_str += f"{role}: {text}\n"

    system_content = (
        "You are an intelligent AI learning assistant helping a user understand a document. "
        "Answer questions based on the document page content provided below. "
        "Be concise, educational, and encouraging. "
        "If the user asks about something not present in the page content, acknowledge that and "
        "answer from your general knowledge while noting the distinction. "
        "Keep responses to 2-4 sentences unless a detailed explanation is genuinely needed.\n\n"
        f"Document name: {document_name}\n\n"
        f"Current page content:\n{context[:3000]}"
    )

    user_content = (
        f"Previous conversation:\n{history_str}\nCurrent question: {message}"
        if history_str
        else message
    )

    try:
        messages_list = [SystemMessage(content=system_content), HumanMessage(content=user_content)]
        response = llm.invoke(messages_list)
        ai_logger.info('Chat response generated successfully')
        return response.content
    except Exception as e:
        ai_logger.error('chat_with_document failed: %s', e)
        return "I'm sorry, I encountered an error generating a response. Please try again."


@lru_cache(maxsize=256)
def summarize_page(page_content: str) -> dict:
    """
    Generate a structured summary for a single page of content.
    Results are cached (LRU, 256 entries) to save on repeated LLM calls.
    """
    ai_logger.info('summarize_page called (content length: %d)', len(page_content))

    word_count = len(page_content.split()) if page_content else 0
    if word_count < 15:
        return {
            "title": "Minimal Content",
            "bullets": ["This page has very little text content."],
            "is_content_page": False,
            "one_liner": "This page contains minimal or no readable content.",
        }

    try:
        system_message = prompt_library.prompt_summarize_page
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_message),
            ("user", "Summarise the page content provided above."),
        ])
        chain = prompt | llm | JsonOutputParser()
        response = chain.invoke({"page_content": page_content[:4000]})
        ai_logger.info('Page summary generated successfully')

        # Ensure serialisable
        return json.loads(json.dumps(response))
    except Exception as e:
        ai_logger.error('summarize_page failed: %s', e)
        return {"error": f"Failed to generate summary: {e}"}
