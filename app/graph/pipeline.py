"""
LangGraph workflow: preprocess → classify (+ route) → **conditional** tool | RAG → respond.
Branching is native LangGraph routing; `decision_agent` only computes `route` from `type`.
"""
from __future__ import annotations

import re
from operator import add
from typing import Annotated, Any, Literal, TypedDict

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
    pipeline_trace: Annotated[list[dict[str, Any]], add]


# --- Trace helpers (API + UI visualization) ---


def _truncate_text(text: str, max_len: int = 360) -> str:
    t = (text or "").strip().replace("\r\n", "\n")
    if len(t) <= max_len:
        return t
    return t[: max_len - 1] + "…"


def _trace_step(
    agent_id: str,
    label: str,
    summary: str,
    detail: str | None = None,
) -> dict[str, Any]:
    step: dict[str, Any] = {
        "id": agent_id,
        "label": label,
        "summary": summary,
    }
    if detail:
        step["detail"] = detail
    return step


def _summarize_tool_output(data: Any) -> tuple[str, str]:
    if isinstance(data, list):
        n = len(data)
        if n == 0:
            return "Structured lookup returned an empty list", "(no rows)"
        preview = ", ".join(str(x) for x in data[:16])
        if n > 16:
            preview += f", … (+{n - 16} more)"
        return f"Structured lookup returned {n} item(s)", preview
    if isinstance(data, int | float) and not isinstance(data, bool):
        s = str(int(data) if isinstance(data, float) and data.is_integer() else data)
        return f"Numeric result: {s}", s
    s = str(data)
    return _truncate_text(s, 160), _truncate_text(s, 900)


def _summarize_rag_context(ctx: list[Any]) -> str:
    if not ctx:
        return "(no document chunks)"
    parts: list[str] = []
    for i, chunk in enumerate(ctx[:4], 1):
        parts.append(f"[{i}] {_truncate_text(str(chunk), 280)}")
    if len(ctx) > 4:
        parts.append(f"(+{len(ctx) - 4} more chunks)")
    return "\n\n".join(parts)


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
    original = (state.get("query") or "").strip()
    s: AgentState = dict(state)
    s["query"] = resolve_followup(s)
    enrich_order_context_from_history(s)
    new_q = (s.get("query") or "").strip()
    if new_q != original:
        detail = f"Earlier text: {original or '(empty)'}\nResolved: {new_q or '(empty)'}"
        summary = "Follow-up / order context merged into the working query"
    else:
        detail = new_q or "(empty)"
        summary = "Query ready for classification (no rewrite this turn)"
    trace = [_trace_step("prepare", "Prepare input", summary, detail)]
    return {"query": s["query"], "pipeline_trace": trace}


def _node_query_classify(state: AgentState) -> dict[str, Any]:
    """Intent + type from LLM, then decision_agent sets route for LangGraph branching."""
    out = query_agent(state)
    merged: AgentState = {**state, **out}
    out.update(decision_agent(merged))
    intent = out.get("intent", "unknown")
    qtype = out.get("type", "rag")
    route = out.get("route", "rag")
    traces = [
        _trace_step(
            "query_agent",
            "Query agent",
            f'Classified intent “{intent}”, type “{qtype}”',
        ),
        _trace_step(
            "decision_agent",
            "Decision agent",
            f'Branch selected: {route} (tool = structured DB / SQL paths, rag = vector document search)',
        ),
    ]
    return {**out, "pipeline_trace": traces}


def _node_tool(state: AgentState) -> dict[str, Any]:
    tool_result = tool_agent(state)
    data = tool_result["tool_data"]
    summary, detail = _summarize_tool_output(data)
    trace = [_trace_step("tool_agent", "Tool agent", summary, detail)]
    return {"context": [data], "pipeline_trace": trace}


def _node_rag(state: AgentState) -> dict[str, Any]:
    rag_result = rag_agent(state)
    ctx = rag_result["context"]
    n = len(ctx)
    detail = _summarize_rag_context(ctx)
    summary = f"Vector search returned {n} chunk(s) for the prompt"
    trace = [_trace_step("rag_agent", "RAG agent", summary, detail)]
    return {"context": ctx, "pipeline_trace": trace}


def _node_respond(state: AgentState) -> dict[str, Any]:
    out = response_agent(state)
    text = (out.get("response") or "").strip()
    trace = [
        _trace_step(
            "response_agent",
            "Response agent",
            "Drafted the final reply from context + history",
            text or "(empty)",
        ),
    ]
    return {**out, "pipeline_trace": trace}


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
