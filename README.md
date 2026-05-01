# Multi-Agent AI System (Python + LangChain + RAG)

A production-style multi-agent AI system built using Python, LangChain, LangGraph, and PostgreSQL (pgvector).

This project demonstrates how to design a scalable **Agentic AI architecture** with RAG (Retrieval-Augmented Generation) and tool-based execution.

---

## Architecture Overview

This system follows a **multi-agent architecture**:

User Query → Query Agent → Decision Agent → (RAG / Tool) → Response Agent

### Agents:

- **Query Agent** → Detects user intent  
- **Decision Agent** → Routes workflow  
- **RAG Agent** → Retrieves data from pgvector  
- **Tool Agent** → Handles structured/business logic  
- **Response Agent** → Generates final response  

---

## Tech Stack

- Python 3.11
- LangChain
- LangGraph
- OpenAI API (Embeddings + LLM)
- PostgreSQL + pgvector
- FastAPI (for API layer)

---

## Project Structure

## packages install

source venv/bin/activate
pip install -r requirements.txt