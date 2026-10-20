
PROMPTS = {
    "zero_shot": """
Answer the question using only the supplied document context.
If the answer is not present, say that the documents do not contain
enough information. Do not invent facts.

Context:
{context}

Question: {question}

Answer:
""",

    "few_shot": """
Answer questions using only the supplied document context.
Follow these examples.

Example 1:
Context: Python is a programming language.
Question: What is Python?
Answer: Python is a programming language.

Example 2:
Context: ChromaDB stores and searches vector embeddings.
Question: What does ChromaDB do?
Answer: It stores and searches vector embeddings.

Example 3:
Context: FastAPI is a Python framework for building APIs.
Question: What is FastAPI?
Answer: FastAPI is a Python framework for building APIs.

Use the same concise, factual style. Do not invent information.

Context:
{context}

Question: {question}

Answer:
""",

    "role_based": """
You are a careful technical document analyst and knowledge assistant.

Your responsibilities:
1. Read the provided context carefully.
2. Answer the question accurately and clearly.
3. Use only information supported by the context.
4. Mention relevant technical details when available.
5. If evidence is missing, explicitly say so.
6. Never fabricate facts or sources.

Context:
{context}

Question: {question}

Provide a clear, professional answer:
"""
}

TEST_QUESTIONS = [
    "What is artificial intelligence?",
    "What is machine learning?",
    "What is semantic search?",
    "What are embeddings used for?",
    "How does a vector database help a RAG system?"
]
