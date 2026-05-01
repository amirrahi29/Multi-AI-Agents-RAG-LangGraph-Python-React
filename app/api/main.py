from fastapi import FastAPI
from pydantic import BaseModel

from app.agents.query_agent import query_agent
from app.agents.decision_agent import decision_agent
from app.agents.rag_agent import rag_agent
from app.agents.tool_agent import tool_agent
from app.agents.response_agent import response_agent

app = FastAPI()


# -----------------------------
# Request Schema
# -----------------------------
class QueryRequest(BaseModel):
    query: str
    last_query: str | None = None


# -----------------------------
# Helper: follow-up resolve
# -----------------------------
def resolve_followup(state):
    query = state.get("query")

    if query.isdigit() and state.get("last_query"):
        return f"{state['last_query']} for order {query}"

    return query


# -----------------------------
# MAIN API
# -----------------------------
@app.post("/query")
def handle_query(req: QueryRequest):

    # initial state
    state = {
        "query": req.query,
        "last_query": req.last_query
    }

    # -----------------------------
    # Step 0: resolve follow-up
    # -----------------------------
    state["query"] = resolve_followup(state)

    # -----------------------------
    # Step 1: Query Agent
    # -----------------------------
    query_result = query_agent(state)
    state.update(query_result)

    # -----------------------------
    # Step 2: Decision Agent
    # -----------------------------
    decision = decision_agent(state)
    route = decision["route"]

    # -----------------------------
    # Step 3: Route
    # -----------------------------
    if route == "tool":
        tool_result = tool_agent(state)
        state["context"] = [tool_result["tool_data"]]
    else:
        rag_result = rag_agent(state)
        state["context"] = rag_result["context"]

    # -----------------------------
    # Step 4: Response
    # -----------------------------
    response = response_agent(state)

    return {
        "response": response["response"],
        "route": route
    }