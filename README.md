# Multi-Agent AI System (Python + LangChain + RAG)

A production-style multi-agent AI system built using Python, LangChain, LangGraph, and PostgreSQL (pgvector).

This project demonstrates how to design a scalable Agentic AI architecture combining:
- Retrieval-Augmented Generation (RAG)
- Tool-based execution (structured queries)
- Intelligent routing (decision making)

---

## Architecture Overview

```
User Query
   ↓
Query Agent (intent detection)
   ↓
Decision Agent (routing)
   ↓
 ├── Tool Agent (structured DB queries)
 └── RAG Agent (semantic search via pgvector)
   ↓
Response Agent (LLM output generation)
```

---

## Agents

### Query Agent
- Detects user intent (order_status, payment_status, etc.)
- Classifies query type (structured / rag)

### Decision Agent
- Routes query to the correct agent
- Ensures efficient execution

### RAG Agent
- Performs semantic search using embeddings
- Retrieves relevant context from pgvector

### Tool Agent
- Executes structured queries on database
- Returns exact results (no hallucination)

### Response Agent
- Generates final user-friendly response
- Handles ambiguity and clarification

---

## Tech Stack

- Python 3.11  
- LangChain  
- LangGraph  
- OpenAI API (LLM + Embeddings)  
- PostgreSQL + pgvector  
- FastAPI  
- Uvicorn  

---

## Project Structure

```
app/
│
├── agents/          # Query, Decision, RAG, Tool, Response agents
├── core/            # Embeddings & LLM config
├── services/        # Vector DB & utilities
├── api/             # FastAPI app
│
scripts/             # Dev/testing scripts (optional)
data/                # CSV datasets
```

---

## Setup Instructions

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate
```

---

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 3. Setup Environment Variables

Create a `.env` file:

```
OPENAI_API_KEY=your_api_key

DB_NAME=your_db
USER_NAME=your_user
PASSWORD=your_password
HOST_NAME=localhost
PORT=5432
```

---

### 4. Run Data Ingestion

```bash
python -m scripts.ingest_data
```

---

### 5. Start API Server

```bash
uvicorn app.api.main:app --reload
```

---

## API Usage

### Endpoint

```
POST /query
```

---

### Example Request

```json
{
  "query": "Order 101 ka status kya hai?"
}
```

---

### Example Response

```json
{
  "response": "Order 101 ka status delivered hai.",
  "route": "tool"
}
```

---

### Follow-up Query (Memory Example)

```json
{
  "query": "102",
  "last_query": "macbook ka price kya hai?"
}
```

---

## API Testing

- Swagger UI → http://127.0.0.1:8000/docs  
- Postman  
- Curl  

---

## Features

- Multi-agent architecture  
- RAG + Tool hybrid system  
- Intelligent routing  
- Ambiguity handling (clarification questions)  
- Follow-up query support (basic memory)  
- FastAPI backend  

---

## Limitations

- Basic memory (no persistent session)
- Rule-based intent detection
- Text-based DB queries (not fully structured)

---

## Future Improvements

- LangGraph persistent memory (state management)  
- Structured SQL queries (normalized schema)  
- Advanced intent detection (LLM-based)  
- User session handling  
- Frontend UI (chat interface)  
- Deployment (Docker / AWS / Render)  

---

## Summary

This project demonstrates how to build a real-world AI backend system using:
- Multi-agent design  
- Hybrid retrieval strategies (RAG + Tool)  
- API-first architecture  

---

## run app

---
- uvicorn app.api.main:app --reload
---

## Author

Amir Rahi