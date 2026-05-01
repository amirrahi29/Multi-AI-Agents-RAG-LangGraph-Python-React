"""
LangGraph workflow: preprocess → classify (+ route) → **conditional** tool | RAG → respond.
Branching is native LangGraph routing; `decision_agent` only computes `route` from `type`.
"""
from __future__ import annotations

import re
from typing import Any, Literal, TypedDict

from langgraph.graph import END, START, StateGraph

from app.agents.decision_agent import decision_agent
from app.agents.query_agent import query_agent
from app.agents.rag_agent import rag_agent
from app.agents.response_agent import response_agent
from app.agents.tool_agent import tool_agent


class AgentState(TypedDict, total=False):
    """Shared pipeline state (merged across nodes)."""

    query: str
    last_query: str | None
    history: list[dict[str, Any]]
    intent: str
    type: str  # noqa: A003 — persisted key from query_agent
    route: str
    context: list[Any]
    response: str


# --- Preprocess (same behaviour as previous main.py) ---


def resolve_followup(state: AgentState) -> str:
    query = state.get("query") or ""
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


def enrich_order_context_from_history(state: AgentState) -> None:
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


def _node_prepare(state: AgentState) -> dict[str, Any]:
    s: AgentState = dict(state)
    s["query"] = resolve_followup(s)
    enrich_order_context_from_history(s)
    return {"query": s["query"]}


def _node_query_classify(state: AgentState) -> dict[str, Any]:
    """Intent + type from LLM, then decision_agent sets route for LangGraph branching."""
    out = query_agent(state)
    merged: AgentState = {**state, **out}
    out.update(decision_agent(merged))
    return out


def _node_tool(state: AgentState) -> dict[str, Any]:
    tool_result = tool_agent(state)
    return {"context": [tool_result["tool_data"]]}


def _node_rag(state: AgentState) -> dict[str, Any]:
    rag_result = rag_agent(state)
    return {"context": rag_result["context"]}


def _node_respond(state: AgentState) -> dict[str, Any]:
    return response_agent(state)


def _route_to_execution_agent(state: AgentState) -> Literal["tool", "rag"]:
    """LangGraph router: picks the next node from decision_agent's route (tool vs RAG)."""
    r = state.get("route")
    return "tool" if r == "tool" else "rag"


def build_pipeline_graph():
    g = StateGraph(AgentState)
    g.add_node("prepare", _node_prepare)
    # Classify intent/type, then decision_agent sets route; LangGraph branches next (no extra "decide" node).
    g.add_node("query_classify", _node_query_classify)
    g.add_node("tool", _node_tool)
    g.add_node("rag", _node_rag)
    g.add_node("respond", _node_respond)

    g.add_edge(START, "prepare")
    g.add_edge("prepare", "query_classify")
    g.add_conditional_edges(
        "query_classify",
        _route_to_execution_agent,
        {"tool": "tool", "rag": "rag"},
    )
    g.add_edge("tool", "respond")
    g.add_edge("rag", "respond")
    g.add_edge("respond", END)
    return g.compile()


_compiled_graph = None


def run_multi_agent_graph(initial: AgentState) -> AgentState:
    """Run the compiled graph once; mutates no global state."""
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_pipeline_graph()
    return _compiled_graph.invoke(initial)
