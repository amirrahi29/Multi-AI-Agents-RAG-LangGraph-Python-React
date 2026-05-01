from app.services.vector_store import get_similar_documents


def rag_agent(state: dict) -> dict:
    query = state.get("query")

    if not query:
        return {"context": []}

    docs = get_similar_documents(query)

    return {
        "context": docs
    }