from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.graph.pipeline import run_multi_agent_graph

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# In-memory conversation store (per process)
# -----------------------------
MAX_HISTORY_MESSAGES = 40

SESSION_HISTORY: dict[str, list[dict]] = {}


def _trim_history(messages: list[dict]) -> list[dict]:
    if len(messages) <= MAX_HISTORY_MESSAGES:
        return messages
    return messages[-MAX_HISTORY_MESSAGES:]


# -----------------------------
# Request Schema
# -----------------------------
class QueryRequest(BaseModel):
    query: str
    last_query: str | None = None
    session_id: str | None = None


# -----------------------------
# MAIN API
# -----------------------------
@app.post("/query")
def handle_query(req: QueryRequest):

    session_id = (req.session_id or "default").strip() or "default"
    prior = [dict(m) for m in SESSION_HISTORY.get(session_id, [])]

    final_state = run_multi_agent_graph(
        {
            "query": req.query,
            "last_query": req.last_query,
            "history": prior,
        }
    )

    assistant_text = final_state.get("response", "")
    route = final_state.get("route", "rag")

    turns = list(SESSION_HISTORY.get(session_id, []))
    turns.append({"role": "user", "content": req.query.strip()})
    turns.append({"role": "assistant", "content": assistant_text})
    SESSION_HISTORY[session_id] = _trim_history(turns)

    return {
        "response": assistant_text,
        "route": route,
        "session_id": session_id,
    }
