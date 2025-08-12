# 📚 DocSensei

**DocSensei** is a modern, AI-powered interactive document reader that transforms how users read and learn from PDF and Word documents.  
Whether you want to **study page-by-page** with quizzes or just enjoy **freeform reading** with chatbot assistance, DocSensei adapts to your needs.

## Deployment Status:
[![Netlify Status](https://api.netlify.com/api/v1/badges/6b5be19f-6d9e-43e9-99d2-cb43ba936a88/deploy-status)](https://docsensei.netlify.app)

Try it out here [v:1.0.1]: [https://docsensei.netlify.app](https://docsensei.netlify.app) 
---

## 🚀 Features / Steps


### 1. **Document Upload & Extraction**
- Supports **PDF** and **Word** formats.
- Upload **one document at a time** (e.g., a textbook chapter or study material).
- Simple and intuitive upload interface.
- **Real content extraction**: Uploaded PDFs are parsed on the backend (using PyPDF2), and the actual text is used for all downstream features.

---

### 2. **Modes of Interaction**


#### **Learning Mode**
- **Navigation**: Move page-by-page.
- **Quizzes**:
  - LLM generates quiz questions **directly from the real extracted content** of the current page (no mock content).
  - System prompt is used for the LLM, improving quiz quality and focus.
  - Quizzes are grounded in the actual document text, minimizing hallucination and ensuring relevance.
  - Must answer **3 questions correctly** before advancing to the next page; questions are generated contextually from the current page.
  - This strategy ensures students go through all the content and pass the quiz, having a more in-depth knowledge and a better study experience, and most importantly a system to adapt to the reader's/students' knowledge gap and even cheating.

- **Ideal For**: Students, self-learners, and anyone preparing for exams who want to study their document with focus.

#### **Free Reading Mode**
- **No restrictions** – read at your own pace.
- **Always-on Chatbot**:   
  - Available at the bottom of the screen.
  - Chat-like interface for asking questions, summarizing content, or clarifying doubts, or even try asking it mayrid questions.

---

### 3. **User Experience**
- No login required – start reading instantly.
---


### 4. **Planned Enhancements**
- Backend: Setting up advanced RAG workflow for even deeper grounding. - Done ✅
- UI enhancements to match backend improvements. - Done ✅
- Highlighting & annotations in Reader mode for better user experience.
- Continue to improve extraction quality and LLM prompt engineering.
- Get a basic MVP with all core functionalities out there in the world.

---
### 🛠️ Technical Notes (v1.0.2+)
- **Backend**: Uses PyPDF2 for PDF extraction; Word support planned.
- **Quiz Generation**: LLM prompt is now a system message for better results.
- **No more mock data**: All quizzes and learning flows use real document content.
---
