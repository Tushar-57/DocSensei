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
import time


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
INITIAL_EXTRACTION_TIME_BUDGET_SEC = max(
    5.0,
    float(os.environ.get("INITIAL_EXTRACTION_TIME_BUDGET_SEC", "20")),
)
INITIAL_EXTRACTION_MAX_PAGES = max(
    0,
    int(os.environ.get("INITIAL_EXTRACTION_MAX_PAGES", "0")),
)

import tiktoken
import pytesseract
from PIL import Image
import io

def _is_text_gibberish(text: str) -> bool:
    if not text or len(text) < 20:
        return False
        
    if text.count('\ufffd') > len(text) * 0.05:
        return True
        
    try:
        enc = tiktoken.get_encoding("cl100k_base")
        tokens = enc.encode(text)
        if len(tokens) == 0:
            return True
        density = len(text) / len(tokens)
        
        if density < 1.5:
            return True
            
        alpha_chars = [c for c in text if c.isalpha()]
        if not alpha_chars:
            return False
            
        upper_ratio = sum(1 for c in alpha_chars if c.isupper()) / len(alpha_chars)
        space_ratio = text.count(' ') / len(text)
        
        # Random all-caps tends to have density < 3.0, while real headers > 3.5
        if upper_ratio > 0.8 and density < 3.0:
            return True
            
        # Large blocks of unspaced garbage letters
        if space_ratio < 0.05 and density < 2.5:
            return True
            
        # Miscellaneous highly suspicious density
        if density < 2.0:
            return True
            
        return False
    except Exception:
        return False

def _ocr_page_local(page: fitz.Page) -> str:
    try:
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_data = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_data))
        text = pytesseract.image_to_string(img)
        return text.strip()
    except Exception as e:
        ai_logger.warning('Local OCR failed: %s', e)
        return ''


def extract_text_from_pdf(file_path: str) -> list:
    """
    Extract text from a PDF using PyMuPDF (fitz) first, fallback to pypdf.
    Returns a list of page texts.
    """
    start_time = time.monotonic()
    ai_logger.info('Starting extraction for %s', file_path)
    if file_path.lower().endswith('.pdf'):
        try:
            pages = []
            non_empty_pages = 0
            fallback_pages = 0
            deferred_pages = 0

            # Try PyMuPDF First
            try:
                fitz_doc = fitz.open(file_path)
                total_pages = len(fitz_doc)
                ai_logger.info('PDF opened successfully with PyMuPDF: %s (pages=%d)', file_path, total_pages)
                
                for idx in range(total_pages):
                    if idx > 0:
                        elapsed = time.monotonic() - start_time
                        hit_time_budget = elapsed >= INITIAL_EXTRACTION_TIME_BUDGET_SEC
                        hit_page_budget = (INITIAL_EXTRACTION_MAX_PAGES > 0 and idx >= INITIAL_EXTRACTION_MAX_PAGES)
                        
                        if hit_time_budget or hit_page_budget:
                            deferred_pages = total_pages - idx
                            ai_logger.info('Initial extraction budget reached; deferring %d pages', deferred_pages)
                            break
                    
                    page_text = fitz_doc[idx].get_text().strip()
                    
                    if page_text and _is_text_gibberish(page_text):
                        ai_logger.warning('Page %d/%d PyMuPDF extraction flagged as gibberish. Ignoring text.', idx + 1, total_pages)
                        page_text = ""

                    if page_text:
                        ai_logger.info('Page %d/%d extracted via PyMuPDF. Length: %d chars. Snippet: %s', 
                                       idx + 1, total_pages, len(page_text), repr(page_text[:100]))
                    if not page_text:
                        # Fallback to pypdf on empty page
                        try:
                            reader = PdfReader(file_path)
                            if reader.is_encrypted:
                                reader.decrypt("")
                            pypdf_text = (reader.pages[idx].extract_text() or '').strip()
                            
                            if pypdf_text and _is_text_gibberish(pypdf_text):
                                ai_logger.warning('Page %d/%d pypdf fallback flagged as gibberish too. Ignoring.', idx + 1, total_pages)
                                pypdf_text = ""
                                
                            if pypdf_text:
                                page_text = pypdf_text
                                ai_logger.info('Page %d/%d extracted via pypdf FALLBACK. Length: %d chars. Snippet: %s', 
                                               idx + 1, total_pages, len(page_text), repr(page_text[:100]))
                                fallback_pages += 1
                            else:
                                ocr_text = _ocr_page_local(fitz_doc[idx])
                                if ocr_text:
                                    page_text = ocr_text
                                    ai_logger.info('Page %d/%d extracted via TESSERACT OCR. Length: %d chars.', idx + 1, total_pages, len(page_text))
                                    fallback_pages += 1
                                else:
                                    ai_logger.warning('Page %d/%d is EMPTY after all fallbacks.', idx + 1, total_pages)
                        except Exception as e:
                            ai_logger.warning('Fallback chain failed for page %d: %s', idx + 1, e)
                    
                    if page_text:
                        non_empty_pages += 1
                    pages.append(page_text)
                
                fitz_doc.close()
                if deferred_pages > 0:
                    pages.extend([''] * deferred_pages)
                    
            except Exception as e:
                ai_logger.error('PyMuPDF failed on %s, falling back to pypdf completely: %s', file_path, e)
                # Fallback to pypdf entirely
                reader = PdfReader(file_path)
                if reader.is_encrypted:
                    reader.decrypt("")
                total_pages = len(reader.pages)
                for idx, page in enumerate(reader.pages):
                    if idx > 0:
                        elapsed = time.monotonic() - start_time
                        hit_time_budget = elapsed >= INITIAL_EXTRACTION_TIME_BUDGET_SEC
                        hit_page_budget = (INITIAL_EXTRACTION_MAX_PAGES > 0 and idx >= INITIAL_EXTRACTION_MAX_PAGES)
                        
                        if hit_time_budget or hit_page_budget:
                            deferred_pages = total_pages - idx
                            break
                            
                    page_text = (page.extract_text() or '').strip()
                    if page_text and _is_text_gibberish(page_text):
                        ai_logger.warning('Page %d/%d pypdf absolute fallback flagged as gibberish.', idx + 1, total_pages)
                        page_text = ""

                    if page_text:
                        ai_logger.info('Page %d/%d extracted entirely via pypdf fallback. Length: %d chars. Snippet: %s', 
                                       idx + 1, total_pages, len(page_text), repr(page_text[:100]))
                        non_empty_pages += 1
                        fallback_pages += 1
                    else:
                        ai_logger.warning('Page %d/%d is EMPTY using absolute pypdf fallback.', idx + 1, total_pages)
                        
                    pages.append(page_text)
                    
                if deferred_pages > 0:
                    pages.extend([''] * deferred_pages)

            elapsed = time.monotonic() - start_time
            ai_logger.info('Extracted %d pages from PDF: %s (non_empty=%d, fallback=%d, elapsed=%.2fs)',
                           len(pages), file_path, non_empty_pages, fallback_pages, elapsed)
            return pages
            
        except Exception as e:
            ai_logger.exception('Error extracting PDF %s: %s', file_path, e)
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


def extract_page_text(file_path: str, page_number: int, allow_vision: bool = True) -> str:
    """
    Extract a single page with layered fallbacks:
    1) PyMuPDF text layer, 2) pypdf text layer. No AI OCR.
    """
    ai_logger.info('Single-page extraction requested: %s page=%d', file_path, page_number)

    if page_number < 1:
        raise ValueError('page_number must be >= 1')
        
    text = ''
    try:
        doc = fitz.open(file_path)
        total_pages = len(doc)
        if page_number > total_pages:
            doc.close()
            raise ValueError(f'page_number {page_number} out of range (1-{total_pages})')
            
        text = (doc[page_number - 1].get_text() or '').strip()
        
        if text and _is_text_gibberish(text):
            ai_logger.warning('Single-page PyMuPDF extraction flagged as gibberish.')
            text = ""

        if text:
            ai_logger.info('Single-page extraction succeeded via PyMuPDF: %s page=%d. Extracted %d chars. Snippet: %s', 
                           file_path, page_number, len(text), repr(text[:100]))
            doc.close()
            return text
            
        fallback_page = doc[page_number - 1]
    except Exception as exc:
        ai_logger.warning('Single-page PyMuPDF extraction failed: %s page=%d error=%s', file_path, page_number, exc)

    try:
        reader = PdfReader(file_path)
        if reader.is_encrypted:
            reader.decrypt("")
        total_pages = len(reader.pages)
        if page_number > total_pages:
            raise ValueError(f'page_number {page_number} out of range (1-{total_pages})')
            
        text = (reader.pages[page_number - 1].extract_text() or '').strip()
        
        if text and _is_text_gibberish(text):
            ai_logger.warning('pypdf extracted gibberish for single page %d in %s, discarding.', page_number, file_path)
            text = ""

        if text:
            ai_logger.info('Single-page extraction succeeded via pypdf FALLBACK: %s page=%d. Extracted %d chars. Snippet: %s',
                           file_path, page_number, len(text), repr(text[:100]))
            return text
    except Exception as exc:
        ai_logger.warning('Single-page pypdf extraction failed: %s page=%d error=%s', file_path, page_number, exc)

    if not text and fallback_page:
        ai_logger.info('Single-page text layer empty or gibberish, performing OCR: %s page=%d', file_path, page_number)
        text = _ocr_page_local(fallback_page)
        
        if text:
            return text

    ai_logger.info('Single-page text layer empty and no OCR: %s page=%d', file_path, page_number)

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
