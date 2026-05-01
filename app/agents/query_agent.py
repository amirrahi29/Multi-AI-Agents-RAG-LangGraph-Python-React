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


# -----------------------------
# Query Agent
# -----------------------------
def query_agent(state: dict) -> dict:
    query = state.get("query")

    prompt = f"""
You are an intent classifier.

Classify the user query into intent and type.

Return ONLY valid JSON. No explanation. No markdown.

Schema:
{{
  "intent": "...",
  "type": "structured" or "rag"
}}

Rules:
- Order status → intent: order_status, type: structured
- Payment status → intent: payment_status, type: structured
- User info → intent: user_info, type: rag
- Product/general questions → type: rag
- If unsure → type: rag

Examples:
Query: Order 101 ka status kya hai?
Output: {{"intent": "order_status", "type": "structured"}}

Query: Payment 5001 ka status kya hai?
Output: {{"intent": "payment_status", "type": "structured"}}

Query: Amit kaha rehta hai?
Output: {{"intent": "user_info", "type": "rag"}}

Now classify:

Query: {query}
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