# 📚 DocSensei

**DocSensei** is a modern, AI-powered interactive document reader that transforms how users read and learn from PDF and Word documents.  
Whether you want to **study page-by-page** with quizzes or just enjoy **freeform reading** with chatbot assistance, DocSensei adapts to your needs.

## Deployment Status:
[![Netlify Status](https://api.netlify.com/api/v1/badges/6b5be19f-6d9e-43e9-99d2-cb43ba936a88/deploy-status)](https://app.netlify.com/projects/docsensei/deploys)

Try it out here [v:1.0.1]: [https://docsensei.netlify.app](https://docsensei.netlify.app) 
---

## 🚀 Features / Steps

### 1. **Document Upload**
- Supports **PDF** and **Word** formats.
- Upload **one document at a time** (e.g., a textbook chapter or study material).
- Simple and intuitive upload interface.

---

### 2. **Modes of Interaction**

#### **Learning Mode**
- **Navigation**: Move page-by-page.
- **Quizzes**:  
  - LLM generates quiz questions from the current page's content, grounded with provided content using RAG, resulting in minimum hallucination and a more focused study experience.
  - Must answer **3 questions correctly** before advancing to the next page which are generated contextually from the current page via an RAG graph.
  - This strategy ensures students go through all the content and pass the quiz, having a more in-depth knowledge and a better study experience, and most importantly a system to adapt to the reader's/ students knowledge gap and even cheating.

- **Ideal For**: Students, self-learners, and anyone preparing for exams, and want to study their document with focus.

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
- Backend development - Setting Up RAG Workflow.
- UI enhancements for addressing the corresponding Backend updates.
- Highlighting & annotations, in Reader mode for better user experience.
- get a basic MVP with all core functionalities out there in world.

---
