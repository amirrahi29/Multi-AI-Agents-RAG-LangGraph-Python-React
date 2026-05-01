from langchain_openai import ChatOpenAI
from dotenv import load_dotenv
import json
import re

# Load env
load_dotenv()

# LLM init
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0
)

_CONFIRM_RE = re.compile(
    r"^(yes|yeah|yep|yup|ok(ay)?|sure|haa?n?|theek|thik|go ahead|continue|proceed)\s*[\.\!\?]*$",
    re.I,
)


# -----------------------------
# Helper: Extract JSON safely
# -----------------------------
def extract_json(text: str) -> str:
    """
    Extract JSON object from LLM response safely
    """
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group(0)
    return "{}"


def _format_history_tail(history: list | None, max_messages: int = 8) -> str:
    if not history:
        return "(no prior messages)"
    tail = history[-max_messages:]
    lines = []
    for m in tail:
        role = (m.get("role") or "").strip()
        content = (m.get("content") or "").strip()
        if content:
            lines.append(f"{role}: {content}")
    return "\n".join(lines) if lines else "(no prior messages)"


# -----------------------------
# Query Agent
# -----------------------------
def query_agent(state: dict) -> dict:
    query = (state.get("query") or "").strip()
    history = state.get("history") or []

    if not query:
        return {
            "intent": "unknown",
            "type": "rag"
        }

    if _CONFIRM_RE.match(query.strip()):
        return {
            "intent": "confirmation",
            "type": "rag"
        }

    if re.search(r"\(order\s+\d+\)", query, re.I) and re.search(
        r"किस\s*यूजर|whose\s*(order|user)?|which\s*user|यह\s+किस|किसका",
        query,
        re.I,
    ):
        return {
            "intent": "order_owner",
            "type": "structured"
        }

    transcript = _format_history_tail(history)

    prompt = f"""
You are an intent classifier.

Use the recent conversation for context when the latest message is short, ambiguous, or a follow-up.

Return ONLY valid JSON. No explanation. No markdown.

Schema:
{{
  "intent": "...",
  "type": "structured" or "rag"
}}

Rules (keep existing intents exactly as below where applicable):
- Order status → intent: order_status, type: structured
- Who placed / owns order X, which user this order belongs to (order id present) → intent: order_owner, type: structured
- Payment status → intent: payment_status, type: structured
- User info (location, profile, one user) → intent: user_info, type: rag
- How many users / user count / total users → intent: count_users, type: structured
- List users / all users / user names → intent: list_users, type: structured
- Short affirmation continuing the previous topic (yes, ok, haan, theek, proceed) → intent: confirmation, type: rag
- Product/general knowledge questions → type: rag (pick the closest intent or unknown)
- If unsure → type: rag

Examples:
Query: Order 101 ka status kya hai?
Output: {{"intent": "order_status", "type": "structured"}}

Query: Order 101 kis user ka hai?
Output: {{"intent": "order_owner", "type": "structured"}}

Query: यह किस यूजर का ऑर्डर था (order 101)
Output: {{"intent": "order_owner", "type": "structured"}}

Query: Payment 5001 ka status kya hai?
Output: {{"intent": "payment_status", "type": "structured"}}

Query: Amit kaha rehta hai?
Output: {{"intent": "user_info", "type": "rag"}}

Query: Kitne users hain?
Output: {{"intent": "count_users", "type": "structured"}}

Query: List all users
Output: {{"intent": "list_users", "type": "structured"}}

Query: Haan theek hai
Output: {{"intent": "confirmation", "type": "rag"}}

Recent conversation:
{transcript}

Latest user message:
{query}
"""

    result = llm.invoke(prompt)

    try:
        json_str = extract_json(result.content)
        parsed = json.loads(json_str)
    except Exception:
        parsed = {
            "intent": "unknown",
            "type": "rag"
        }

    return {
        "intent": parsed.get("intent", "unknown"),
        "type": parsed.get("type", "rag")
    }
