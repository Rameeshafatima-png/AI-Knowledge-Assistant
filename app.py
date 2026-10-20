
from contextlib import asynccontextmanager
from pathlib import Path
import json

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
from pydantic import BaseModel

from prompts import TEST_QUESTIONS
from rag_engine import (
    UPLOAD_DIR,
    get_collection,
    index_document,
    retrieve,
    generate_answer,
    list_documents,
    delete_document,
)

BASE_DIR = Path(__file__).resolve().parent
SAMPLE_DIR = BASE_DIR / "data" / "sample_documents"
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

SAMPLES = {
    "01_artificial_intelligence.md": """
# Artificial Intelligence
Artificial intelligence (AI) is a field of computing focused on systems
that perform tasks associated with human intelligence. Examples include
reasoning, language understanding, planning and pattern recognition.
AI applications include virtual assistants, recommendation systems
and document analysis tools.
""",
    "02_machine_learning.md": """
# Machine Learning
Machine learning (ML) is a branch of AI that learns patterns from data.
Supervised learning uses labeled examples. Unsupervised learning discovers
structure in unlabeled data. Model evaluation measures performance on
data not used for training.
""",
    "03_semantic_search.md": """
# Semantic Search
Semantic search retrieves information based on meaning and context.
It represents text as numerical vectors called embeddings. A question
is embedded and compared with document vectors to find relevant passages,
even when the exact keywords are different.
""",
    "04_embeddings.md": """
# Text Embeddings
Text embeddings are numerical representations of text. Similar meanings
can be represented by nearby vectors in an embedding space. Sentence
Transformers generate embeddings for sentences and passages. Embeddings
support semantic retrieval, clustering and similarity comparison.
""",
    "05_rag_vector_databases.md": """
# RAG and Vector Databases
Retrieval-Augmented Generation (RAG) retrieves relevant document passages
before an LLM generates an answer. A vector database stores embeddings
and associated text or metadata. ChromaDB supports similarity search.
Retrieved context can improve grounding, but does not guarantee correctness.
"""
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    for filename, content in SAMPLES.items():
        path = SAMPLE_DIR / filename
        if not path.exists():
            path.write_text(content.strip(), encoding="utf-8")

    collection = get_collection()

    # Seed the five sample documents only for a new/empty database.
    if collection.count() == 0:
        for filename in SAMPLES:
            index_document(SAMPLE_DIR / filename)

    yield


app = FastAPI(
    title="AI Knowledge Assistant",
    description="Document-grounded question answering with semantic search.",
    lifespan=lifespan
)

app.mount(
    "/static",
    StaticFiles(directory=str(BASE_DIR / "static")),
    name="static"
)
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


class QuestionRequest(BaseModel):
    question: str
    technique: str = "role_based"


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={}
    )


@app.get("/api/documents")
def documents():
    return {"documents": list_documents()}


@app.get("/api/stats")
def stats():
    return {
        "documents": len(list_documents()),
        "chunks": get_collection().count()
    }


@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...)):
    filename = Path(file.filename or "").name
    suffix = Path(filename).suffix.lower()

    if suffix not in {".pdf", ".txt", ".md", ".markdown"}:
        raise HTTPException(
            status_code=400,
            detail="Upload a PDF, TXT, or Markdown document."
        )

    if not filename:
        raise HTTPException(status_code=400, detail="Filename is missing.")

    content = await file.read()

    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Maximum upload size is 15 MB.")

    path = UPLOAD_DIR / filename
    path.write_bytes(content)

    try:
        result = index_document(path)
        return {"message": "Document indexed successfully.", **result}
    except Exception as exc:
        path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/ask")
def ask(payload: QuestionRequest):
    question = payload.question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Enter a question.")

    if len(question) > 4000:
        raise HTTPException(status_code=400, detail="Question is too long.")

    try:
        result = generate_answer(question, payload.technique)
        return {
            "question": question,
            "technique": payload.technique,
            **result
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        # Keep API keys and internal tracebacks out of public responses.
        raise HTTPException(
            status_code=502,
            detail=f"Answer generation failed. Check your Groq model/API settings. {str(exc)[:300]}"
        ) from exc


@app.post("/api/search")
def search(payload: QuestionRequest):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Enter a search query.")

    return {"results": retrieve(payload.question.strip(), top_k=3)}


@app.get("/api/evaluate")
def evaluate():
    from evaluation import run_evaluation
    try:
        return {"results": run_evaluation()}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)[:300]) from exc


@app.delete("/api/documents/{filename}")
def remove_document(filename: str):
    safe_name = Path(filename).name

    if safe_name != filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    return delete_document(safe_name)
