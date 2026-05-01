import re

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.agents.query_agent import query_agent
from app.agents.decision_agent import decision_agent
from app.agents.rag_agent import rag_agent
from app.agents.tool_agent import tool_agent
from app.agents.response_agent import response_agent

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
# Helper: follow-up resolve
# -----------------------------
def resolve_followup(state):
    query = state.get("query")

    if query.isdigit() and state.get("last_query"):
        return f"{state['last_query']} for order {query}"

    return query


_ORDER_ANAPHORA = re.compile(
    r"(किस\s*यूजर\s*का|किसका|whose\s+order|which\s+user).{0,120}(ऑर्डर|order)|"
    r"(ऑर्डर|order).{0,80}(किस\s*यूजर|whose|which\s+user)|"
    r"(यह|वह|this|that).{0,100}(ऑर्डर|order).{0,50}(था|थी|था\?|थी\?|है|was|is)",
    re.I | re.DOTALL,
)


def _first_numeric_id_in_query(query: str) -> str | None:
    nums = re.findall(r"\d+", query or "")
    return nums[0] if nums else None


def _last_order_id_from_history(history: list[dict], max_msgs: int = 14) -> str | None:
    if not history:
        return None
    blob = "\n".join((m.get("content") or "") for m in history[-max_msgs:])
    tagged: list[str] = []
    for m in re.finditer(
        r"(?:order|ऑर्डर|#)\s*[^\d\n]{0,10}(\d{2,6})\b|(?:नंबर|number)\s*[^\d\n]{0,6}(\d{2,6})\b",
        blob,
        re.I,
    ):
        tagged.append((m.group(1) or m.group(2)).strip())
    if tagged:
        return tagged[-1]
    fallback = re.findall(r"\b(10[1-9]|10[0-9]{2})\b", blob)
    return fallback[-1] if fallback else None


def enrich_order_context_from_history(state: dict) -> None:
    """
    Attach a recently mentioned order id when the user uses anaphora (this/that/यह)
    but omits the number — enables tool/RAG to resolve correctly.
    """
    query = (state.get("query") or "").strip()
    if not query or _first_numeric_id_in_query(query):
        return
    if not _ORDER_ANAPHORA.search(query):
        return
    hist = state.get("history") or []
    oid = _last_order_id_from_history(hist)
    if not oid:
        return
    state["query"] = f"{query} (order {oid})"


# -----------------------------
# MAIN API
# -----------------------------
@app.post("/query")
def handle_query(req: QueryRequest):

    session_id = (req.session_id or "default").strip() or "default"
    prior = [dict(m) for m in SESSION_HISTORY.get(session_id, [])]

    # initial state
    state = {
        "query": req.query,
        "last_query": req.last_query,
        "history": prior,
    }

    # -----------------------------
    # Step 0: resolve follow-up
    # -----------------------------
    state["query"] = resolve_followup(state)
    enrich_order_context_from_history(state)

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

    assistant_text = response["response"]

    turns = list(SESSION_HISTORY.get(session_id, []))
    turns.append({"role": "user", "content": req.query.strip()})
    turns.append({"role": "assistant", "content": assistant_text})
    SESSION_HISTORY[session_id] = _trim_history(turns)

    return {
        "response": assistant_text,
        "route": route,
        "session_id": session_id,
    }
