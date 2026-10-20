# AI Knowledge Assistant

An intelligent document question-answering application that enables users to upload PDF, TXT, and Markdown files and ask questions about their contents. The system combines semantic search, sentence embeddings, ChromaDB, and the Groq API to generate context-aware answers grounded in retrieved document passages.

## Overview

The AI Knowledge Assistant uses Retrieval-Augmented Generation (RAG) to retrieve relevant information from uploaded documents before generating an answer. It also implements three prompt engineering techniques to compare how different prompting strategies affect answer accuracy, clarity, and relevance.

## Features

- Upload and process PDF, TXT, and Markdown documents.
- Extract text and split it into smaller chunks.
- Generate embeddings using Sentence Transformers.
- Store and retrieve embeddings using ChromaDB.
- Convert user questions into embeddings for semantic retrieval.
- Retrieve the top three most relevant document chunks.
- Display retrieved passages, similarity scores, and distances.
- Generate context-aware answers through the Groq API.
- Compare zero-shot, few-shot, and role-based prompting.
- Evaluate five questions across three prompting techniques.
- Manage indexed documents through an interactive dashboard.
- View document statistics and retrieval evidence.

## Technology Stack

| Technology | Purpose |
|---|---|
| Python | Core application logic |
| FastAPI | Backend and API endpoints |
| Groq API | Language model inference |
| Sentence Transformers | Text embedding generation |
| ChromaDB | Vector storage and retrieval |
| PyMuPDF | PDF text extraction |
| Jinja2 | HTML template rendering |
| HTML, CSS, JavaScript | Interactive frontend |

## How It Works

1. **Document upload:** The user uploads a PDF, TXT, or Markdown file.
2. **Text extraction:** The application extracts readable text.
3. **Chunking:** The text is divided into smaller passages.
4. **Embedding generation:** Sentence Transformers converts each passage into a vector.
5. **Vector storage:** ChromaDB stores the vectors and associated metadata.
6. **Question processing:** The user's question is converted into an embedding.
7. **Semantic retrieval:** The system retrieves the three most relevant chunks.
8. **Prompt construction:** The selected prompting technique combines the question with retrieved context.
9. **Answer generation:** The Groq API generates a response based on the supplied evidence.
10. **Evidence display:** The interface presents the answer and retrieved passages.

## Prompt Engineering

The project compares three prompting techniques using the same five questions.

### Zero-Shot Prompting

The model receives instructions, document context, and a question without examples.

**Purpose:** Establish a baseline for direct instruction-based answering.

### Few-Shot Prompting

The prompt contains two or three examples demonstrating the desired answer format.

**Purpose:** Encourage consistent and relevant responses through examples.

### Role-Based Prompting

The model receives a role such as a technical document analyst.

**Purpose:** Encourage structured explanations, evidence-based reasoning, and clear acknowledgment of missing information.

### Evaluation Questions

1. What is artificial intelligence?
2. What is machine learning?
3. What is semantic search?
4. What are embeddings used for?
5. How does a vector database support a RAG system?

These questions are evaluated using all three prompting techniques, producing 15 responses.

### Evaluation Criteria

| Criterion | Description |
|---|---|
| Accuracy | Whether the answer agrees with the source documents |
| Clarity | Whether the answer is understandable and well organized |
| Relevance | Whether the answer addresses the question directly |

The results should be reviewed and scored after running the evaluation. The best technique should be selected based on observed performance rather than assumed results.

## Semantic Search vs. Keyword Search

| Keyword Search | Semantic Search |
|---|---|
| Matches specific words and terms | Compares the meaning represented by embeddings |
| Can miss synonyms and paraphrases | Can retrieve passages with related meanings |
| Relies on text-matching rules | Uses vector similarity |
| Works well for exact terms | Works well for meaning-oriented questions |

For example, a question about text embeddings may retrieve a passage discussing numerical representations of language even when the wording is different.

Semantic search is not guaranteed to understand every question correctly. Retrieval quality depends on the embedding model, document chunks, and query.

## Project Structure

```text
AI_Knowledge_Assistant/
├── app.py
├── prompts.py
├── rag_engine.py
├── evaluation.py
├── requirements.txt
├── .env
├── .gitignore
├── data/
│   ├── uploads/
│   └── sample_documents/
├── chroma_db/
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

This is a suggested structure. Keep only the files and folders that actually exist in your project.

## Installation

### Prerequisites

- Python 3.11 or 3.12 recommended
- pip
- A Groq API key
- An internet connection for dependency installation and the initial embedding model download

### 1. Clone the Repository

```bash
git clone https://github.com/Rameeshafatima-png/AI_Knowledge_Assistant.git
cd AI_Knowledge_Assistant
```

Replace the repository URL if your GitHub repository uses a different name.

### 2. Create a Virtual Environment

Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```dotenv
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=your_supported_groq_model_id
```

Get an API key from the [Groq Console](https://console.groq.com/keys).

Use a model ID currently available to your Groq account. Do not commit your API key to GitHub.

### 5. Start the Application

If your FastAPI instance is named `app` in `app.py`, run:

```bash
uvicorn app:app --reload
```

Open the application:

- Dashboard: http://127.0.0.1:8000
- API documentation: http://127.0.0.1:8000/docs

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Open the dashboard |
| GET | `/api/stats` | Retrieve document and chunk statistics |
| GET | `/api/documents` | List indexed documents |
| POST | `/api/upload` | Upload and index a document |
| POST | `/api/ask` | Ask a question using retrieved context |
| POST | `/api/search` | Retrieve relevant document chunks |
| GET | `/api/evaluate` | Compare prompting techniques |
| DELETE | `/api/documents/{filename}` | Remove an indexed document |

Endpoint availability depends on the routes implemented in the application.

## Testing

1. Start the FastAPI server.
2. Verify that the dashboard loads correctly.
3. Index at least five documents.
4. Upload a PDF, TXT, and Markdown document.
5. Ask questions that can be answered using the indexed content.
6. Verify that the top three retrieved chunks are displayed.
7. Test all three prompting techniques using the same five questions.
8. Review the answers for accuracy, clarity, and relevance.
9. Test invalid file types and missing API configuration.

## Limitations

- Answer quality depends on document quality and retrieved context.
- Language models may produce incorrect or unsupported answers.
- Scanned PDFs may require OCR.
- Embedding similarity scores are not measures of factual accuracy.
- Local ChromaDB storage requires a persistent disk when deployed.
- Production use requires authentication, access controls, and secure file handling.

## Future Enhancements

- Add document citations with page numbers.
- Export evaluation results to CSV.
- Add OCR for scanned documents.
- Implement authentication and per-user document collections.
- Add automated evaluation reports and scoring.
- Improve deployment with persistent vector storage.
- Add support for additional document formats.

## Learning Outcomes

This project demonstrates practical experience with Retrieval-Augmented Generation, prompt engineering, semantic search, text embeddings, vector databases, document processing, API integration, and full-stack application development.

## Author

**Rameesha Fatma**

AI and Data Science Learner | Python Developer

GitHub: [Rameeshafatima-png](https://github.com/Rameeshafatima-png)
