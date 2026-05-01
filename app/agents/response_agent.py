from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

# LLM
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
You are a helpful assistant.

Answer the user's question ONLY using the provided context.

Context:
{context}

Question:
{query}

Give a clean and concise answer.
"""

    result = llm.invoke(prompt)

    return {
        "response": result.content
    }