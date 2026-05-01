from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0
)


def response_agent(state: dict) -> dict:
    query = state.get("query")
    context = state.get("context", [])

    if not context:
        return {"response": "No relevant data found."}

    prompt = f"""
You are a strict and intelligent assistant.

Context:
{context}

Question:
{query}

Rules:

1. If the question is ambiguous:
   - ONLY ask a clarification question
   - DO NOT mention any specific details from context
   - DO NOT give hints or guesses

2. If the question is clear:
   - Answer concisely using context
   - Include necessary details like order ID or status
   - Do NOT add unnecessary info (like product or amount unless asked)

3. Always keep response short and natural

Answer:
"""

    result = llm.invoke(prompt)

    return {
        "response": result.content.strip()
    }