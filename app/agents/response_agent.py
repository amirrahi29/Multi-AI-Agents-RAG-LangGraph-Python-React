from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0
)


def _format_history(history: list | None, max_messages: int = 12) -> str:
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


def response_agent(state: dict) -> dict:
    query = state.get("query")
    context = state.get("context", [])
    history = state.get("history") or []
    intent = state.get("intent") or "unknown"
    transcript = _format_history(history)

    if not context and not history:
        return {"response": "No relevant data found."}

    context_block = context if context else "(none for this turn — rely on the conversation if needed)"

    prompt = f"""
You are a strict and intelligent assistant.

Conversation so far:
{transcript}

Retrieved / tool context:
{context_block}

Current user message:
{query}

Classifier intent (hint only): {intent}

Rules:

1. If the question is ambiguous:
   - ONLY ask a clarification question
   - DO NOT mention any specific details from context unless they are clearly in context AND needed
   - DO NOT give hints or guesses
   - Exception: pronouns like "this/that/यह" about an order when the conversation already states an order id — treat it as that order and answer; do not ask which user unless no order id ever appeared

2. If the question is clear:
   - Answer concisely using context and, when needed, the prior conversation
   - Include necessary details like order ID or status
   - Do NOT add unnecessary info (like product or amount unless asked)

3. For follow-ups (short replies, pronouns, "same for…", order numbers only earlier in chat):
   - Tie the answer to the recent conversation
   - Do not repeat long explanations; add only the new fact

4. For affirmations (yes, ok, haan, theek) or when intent is confirmation:
   - Respond briefly: confirm, give the next concrete step, or complete what the last assistant message implied
   - Do NOT ask the same clarification again unless still strictly necessary

5. If context is empty but the conversation already stated facts, you may restate those facts briefly; do not invent new data

6. Keep every answer short and natural (prefer 1–3 sentences)

Answer:
"""

    result = llm.invoke(prompt)

    return {
        "response": result.content.strip()
    }
