import asyncio
from graph import app

async def main():
    print("Starting CV Analysis System Demo...")
    
    # Initial State
    initial_state = {
        "cv_text": "Dummy CV Text",
        "job_criteria": {
            "title": "",
            "level": "",
            "min_years_exp": 0,
            "required_skills": [],
            "description_keywords": [],
        },
        "agent_outputs": {},
        "cross_check_results": [],
    }
    
    # Run the graph
    result = await app.ainvoke(initial_state)
    
    print("\n\n" + "="*30)
    print(result.get("final_report", "No Report Generated"))
    print("="*30)

if __name__ == "__main__":
    asyncio.run(main())
