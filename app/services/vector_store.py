import psycopg2
import os
from dotenv import load_dotenv
from app.core.embeddings import get_embeddings

load_dotenv()

DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("USER_NAME"),
    "password": os.getenv("PASSWORD"),
    "host": os.getenv("HOST_NAME"),
    "port": os.getenv("PORT", "5432")
}

emb = get_embeddings()


def get_similar_documents(query: str, k: int = 3):
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # 🔹 Query → embedding
    query_vector = emb.embed_query(query)

    # 🔹 Convert Python list → pgvector string
    vector_str = "[" + ",".join(map(str, query_vector)) + "]"

    # 🔹 Similarity search
    cur.execute(
        """
        SELECT content
        FROM documents
        ORDER BY embedding <-> %s::vector
        LIMIT %s;
        """,
        (vector_str, k)
    )

    results = cur.fetchall()

    cur.close()
    conn.close()

    return [r[0] for r in results]