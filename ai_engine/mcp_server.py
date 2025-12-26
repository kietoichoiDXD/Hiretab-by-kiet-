from mcp.server.fastmcp import FastMCP
import asyncio
import json
from graph import app

# Create an MCP server
mcp = FastMCP("HireTab AI Engine")

@mcp.tool()
async def analyze_cv_logic(cv_text: str, job_criteria: dict | None = None) -> str:
    """
    Analyzes a CV using the HireTab Multi-Agent System (LangGraph).
    Performs cross-checks on job history, skills, and projects.
    
    Args:
        cv_text: The full text content of the CV/Candidate Profile.
        job_criteria: Optional job criteria (title/level/min_years_exp/required_skills/description_keywords).
        
    Returns:
        JSON string containing the final analysis report and detected conflicts.
    """
    print(f"Received request to analyze CV of length {len(cv_text)}")
    
    initial_state = {
        "cv_text": cv_text,
        "job_criteria": job_criteria or {
            "title": "",
            "level": "",
            "min_years_exp": 0,
            "required_skills": [],
            "description_keywords": [],
        },
        "agent_outputs": {},
        "cross_check_results": [],
    }
    
    # Run the LangGraph
    result = await app.ainvoke(initial_state)

    payload = {
        "final_report": result.get("final_report", "No report generated"),
        "cross_check_results": result.get("cross_check_results", []),
    }
    return json.dumps(payload, ensure_ascii=False)

if __name__ == "__main__":
    mcp.run()
