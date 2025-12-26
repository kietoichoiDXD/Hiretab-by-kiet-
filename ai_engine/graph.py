from langgraph.graph import StateGraph, END
from state import ScanState
from nodes.agents import loyalty_agent, star_agent, ats_agent, edu_agent
from nodes.cross_check import cross_check_node

def setup_node(state):
    print("--- [Setup] Initializing Scan ---")
    return {"agent_outputs": {}}

def aggregator_node(state):
    print("--- [Aggregator] Generating Final Report ---")
    
    results = state.get('cross_check_results', [])
    report = "FINAL REPORT\n================\n"
    
    # Process Cross-Check Results
    if not results:
        report += "No issues found."
    else:
        for item in results:
            if item['action'] == 'downgrade_risk':
                report += f"[INFO] {item['reason']} (Risk downgraded)\n"
            elif item['action'] == 'flag_unverified':
                report += f"[WARNING] Unverified Skills: {', '.join(item['skills'])}\n"
            elif item['action'] == 'flag_conflict':
                report += f"[CRITICAL] {item['reason']}\n"
                
    return {"final_report": report}

# Define Graph
workflow = StateGraph(ScanState)

# 1. Add Nodes
workflow.add_node("setup", setup_node)
workflow.add_node("loyalty", loyalty_agent)
workflow.add_node("star", star_agent)
workflow.add_node("ats", ats_agent)
workflow.add_node("edu", edu_agent)
workflow.add_node("cross_check", cross_check_node)
workflow.add_node("aggregator", aggregator_node)

# 2. Define Edges (Fan-Out)
workflow.set_entry_point("setup")
workflow.add_edge("setup", "loyalty")
workflow.add_edge("setup", "star")
workflow.add_edge("setup", "ats")
workflow.add_edge("setup", "edu")

# 3. Fan-In to Cross-Check
workflow.add_edge("loyalty", "cross_check")
workflow.add_edge("star", "cross_check")
workflow.add_edge("ats", "cross_check")
workflow.add_edge("edu", "cross_check")

# 4. To Aggregator
workflow.add_edge("cross_check", "aggregator")
workflow.add_edge("aggregator", END)

app = workflow.compile()
