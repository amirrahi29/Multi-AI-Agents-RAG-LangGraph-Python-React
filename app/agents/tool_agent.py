import psycopg2
import os
from dotenv import load_dotenv
import re

load_dotenv()

DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("USER_NAME"),
    "password": os.getenv("PASSWORD"),
    "host": os.getenv("HOST_NAME"),
    "port": os.getenv("PORT", "5432")
}


# -----------------------------
# Helper: extract number (order_id / payment_id)
# -----------------------------
def extract_id(query: str):
    numbers = re.findall(r"\d+", query)
    return numbers[0] if numbers else None


# -----------------------------
# Tool Agent
# -----------------------------
def tool_agent(state: dict) -> dict:
    query = state.get("query")
    intent = state.get("intent")

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    result = None

    try:
        if intent == "order_status":
            order_id = extract_id(query)

            cur.execute(
                "SELECT content FROM documents WHERE content ILIKE %s LIMIT 1",
                (f"%Order {order_id}%",)
            )

            row = cur.fetchone()
            result = row[0] if row else "Order not found"

        elif intent == "payment_status":
            payment_id = extract_id(query)

            cur.execute(
                "SELECT content FROM documents WHERE content ILIKE %s LIMIT 1",
                (f"%Payment {payment_id}%",)
            )

            row = cur.fetchone()
            result = row[0] if row else "Payment not found"

        else:
            result = "Unsupported structured query"

    except Exception as e:
        result = f"Error: {str(e)}"

    finally:
        cur.close()
        conn.close()

    return {
        "tool_data": result
    }