import asyncio
import random
import time

# Helper so we can track execution times
async def mock_processing(agent_name):
    # Simulate API latency (0.3 to 1.0 seconds)
    duration = random.uniform(0.3, 1.0)
    start_time = time.time()
    await asyncio.sleep(duration) 
    end_time = time.time()
    return {
        "start": start_time,
        "end": end_time,
        "duration": duration,
        "status": "Success"
    }

async def loyalty_agent(state):
    print("--- [Agent] Loyalty Scanning ---")
    meta = await mock_processing("Loyalty")
    text = state.get("cv_text", "").lower()
    criteria = state.get("job_criteria", {})
    
    # Logic: Detect Years of Experience & Gaps
    # Rough heuristic: count specific year tokens or "X years" phrases
    exp_years = 0
    if "2018" in text: exp_years = 5
    elif "2020" in text: exp_years = 3
    elif "2022" in text: exp_years = 1
    
    has_gap = "gap" in text or "sabbatical" in text
    
    # Check against criteria
    required_years = criteria.get('min_years_exp', 0)
    meets_exp = exp_years >= required_years
    
    return {
        "agent_outputs": {
            **state.get("agent_outputs", {}),
            "loyalty": {
                "metadata": meta,
                "data": {
                    "has_gap": has_gap,
                    "total_years_exp": exp_years,
                    "meets_criteria": meets_exp, # New Field
                    "history": [{"role": "Dev", "years": exp_years}]
                }
            }
        }
    }

async def star_agent(state):
    print("--- [Agent] STAR (Project) Scanning ---")
    meta = await mock_processing("STAR")
    text = state.get("cv_text", "").lower()
    criteria = state.get("job_criteria", {})
    
    # Logic: Detect Projects & Keywords from Description
    project_keywords = criteria.get('description_keywords', [])
    matched_keywords = [kw for kw in project_keywords if kw.lower() in text]
    
    # Project complexity score logic
    project_score = 5
    if len(matched_keywords) > 2:
        project_score = 9
    elif "distributed" in text:
        project_score = 8
        
    return {
        "agent_outputs": {
            **state.get("agent_outputs", {}),
            "star": {
                "metadata": meta,
                "data": {
                    "has_projects": "project" in text or "experience" in text,
                    "complexity_score": project_score,
                    "context_match_score": len(matched_keywords) * 10, # 10 pts per keyword
                    "keywords_found": matched_keywords
                }
            }
        }
    }

async def ats_agent(state):
    print("--- [Agent] ATS Scanning ---")
    meta = await mock_processing("ATS")
    text = state.get("cv_text", "").lower()
    criteria = state.get("job_criteria", {})
    
    # Logic: Match Skills
    required = [s.lower() for s in criteria.get('required_skills', [])]
    found = [s for s in required if s in text]
    
    missing = list(set(required) - set(found))
    match_percentage = (len(found) / len(required)) * 100 if required else 100
    
    return {
        "agent_outputs": {
            **state.get("agent_outputs", {}),
            "ats": {
                "metadata": meta,
                "data": {
                    "claimed_seniority": "Senior" if "senior" in text else "Junior",
                    "extracted_skills": found,
                    "missing_skills": missing,
                    "match_score": match_percentage
                }
            }
        }
    }

async def edu_agent(state):
    print("--- [Agent] Edu Scanning ---")
    meta = await mock_processing("Edu")
    text = state.get("cv_text", "").lower()
    
    return {
        "agent_outputs": {
            **state.get("agent_outputs", {}),
            "edu": {
                "metadata": meta,
                "data": {
                    "has_degree": "degree" in text or "bachelor" in text or "master" in text,
                    "graduation_year": 2022 # Mock
                }
            }
        }
    }
