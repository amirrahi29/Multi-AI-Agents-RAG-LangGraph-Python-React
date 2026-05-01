def decision_agent(state: dict) -> dict:
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