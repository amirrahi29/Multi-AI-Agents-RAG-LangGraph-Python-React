import pandas as pd
import psycopg2
import os
import json
from dotenv import load_dotenv
from app.core.embeddings import get_embeddings

# -----------------------------
# LOAD ENV
# -----------------------------
load_dotenv()

# -----------------------------
# CONFIG
# -----------------------------
DB_CONFIG = {
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("USER_NAME"),
    "password": os.getenv("PASSWORD"),
    "host": os.getenv("HOST_NAME"),
    "port": os.getenv("PORT", "5432")
}

BATCH_SIZE = 50

emb = get_embeddings()

# -----------------------------
# DB CONNECTION
# -----------------------------
conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor()

# -----------------------------
# DB SETUP
# -----------------------------
def setup_database():
    print("🔧 Setting up database...")

    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    cur.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        content TEXT,
        embedding VECTOR(1536),
        metadata JSONB
    );
    """)

    conn.commit()
    print("✅ Database ready")

# -----------------------------
# INDEX (after insert)
# -----------------------------
def create_index():
    print("⚡ Creating index...")

    cur.execute("""
    CREATE INDEX IF NOT EXISTS idx_documents_embedding
    ON documents
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
    """)

    conn.commit()
    print("✅ Index created")

# -----------------------------
# TRANSFORM FUNCTIONS
# -----------------------------
def user_to_text(row):
    return f"User {row['name']} with email {row['email']} lives in {row['city']}."

def order_to_text(row):
    return f"Order {row['order_id']} for user {row['user_id']} includes {row['product']} and is {row['status']} with amount {row['amount']}."

def payment_to_text(row):
    return f"Payment {row['payment_id']} for order {row['order_id']} was done via {row['payment_method']} and status is {row['payment_status']}."

# -----------------------------
# INSERT BATCH
# -----------------------------
def insert_batch(texts, vectors):
    for text, vector in zip(texts, vectors):
        cur.execute(
            "INSERT INTO documents (content, embedding, metadata) VALUES (%s, %s, %s)",
            (text, vector, json.dumps({}))
        )
    conn.commit()

# -----------------------------
# LOAD DATA
# -----------------------------
def load_all_data():
    users_df = pd.read_csv("data/users.csv")
    orders_df = pd.read_csv("data/orders.csv")
    payments_df = pd.read_csv("data/payments.csv")

    texts = []

    for _, row in users_df.iterrows():
        texts.append(user_to_text(row))

    for _, row in orders_df.iterrows():
        texts.append(order_to_text(row))

    for _, row in payments_df.iterrows():
        texts.append(payment_to_text(row))

    return texts

# -----------------------------
# MAIN INGESTION
# -----------------------------
def run_ingestion():
    setup_database()

    all_texts = load_all_data()
    print(f"📊 Total records: {len(all_texts)}")

    for i in range(0, len(all_texts), BATCH_SIZE):
        batch = all_texts[i:i + BATCH_SIZE]

        print(f"➡️ Processing batch {i // BATCH_SIZE + 1}")

        vectors = emb.embed_documents(batch)

        insert_batch(batch, vectors)

    create_index()

    print("🎉 Data ingestion completed successfully!")

# -----------------------------
# ENTRY POINT
# -----------------------------
if __name__ == "__main__":
    try:
        run_ingestion()
    except Exception as e:
        print("❌ Error:", e)
    finally:
        cur.close()
        conn.close()