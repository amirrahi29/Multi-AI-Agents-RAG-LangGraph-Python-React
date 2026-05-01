from app.agents.rag_agent import rag_agent
from app.agents.response_agent import response_agent

# Step 1: user query
state = {
    "query": "Order 103 ka status kya hai?"
}

# Step 2: RAG
rag_result = rag_agent(state)

# Step 3: Response
final_state = {
    "query": state["query"],
    "context": rag_result["context"]
}

response = response_agent(final_state)

print("\n🤖 Final Answer:\n")
print(response["response"])