def decision_agent(state: dict) -> dict:
    """
    Maps classifier `type` → `route` (`tool` | `rag`).
    Consumed by LangGraph: the graph's conditional edge reads `route` to choose the next node.
    """
    query_type = state.get("type")

    if query_type == "structured":
        route = "tool"

    elif query_type == "rag":
        route = "rag"

    else:
        # fallback
        route = "rag"

    return {
        "route": route
    }