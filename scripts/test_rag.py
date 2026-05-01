from app.agents.rag_agent import rag_agent

state = {
    "query": "Order 102 ka status kya hai?"
}

result = rag_agent(state)

print("\n🔍 Retrieved Context:\n")
for r in result["context"]:
    print("-", r)