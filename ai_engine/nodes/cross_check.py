from datetime import datetime

async def cross_check_node(state):
    print("--- 🔄 CHẠY CROSS-CHECK LOGIC ---")
    
    outputs = state.get('agent_outputs', {})
    criteria = state.get('job_criteria', {})
    
    # Extract Data
    loyalty = outputs.get('loyalty', {}).get('data', {})
    ats = outputs.get('ats', {}).get('data', {})
    star = outputs.get('star', {}).get('data', {})
    edu = outputs.get('edu', {}).get('data', {})
    
    updates = []
    
    # --- CHECK 1: Experience vs Requirement (Loyalty Agent) ---
    if not loyalty.get('meets_criteria', True):
        updates.append({
            "action": "flag_mismatch",
            "logic_id": "EXP_BELOW_THRESHOLD",
            "reason": f"Candidate has {loyalty.get('total_years_exp')} years exp, but Criteria requires {criteria.get('min_years_exp')}+ years.",
            "severity": "High"
        })

    # --- CHECK 2: Skill Match (ATS Agent) ---
    if ats.get('match_score', 100) < 50:
         updates.append({
            "action": "flag_mismatch",
            "logic_id": "LOW_SKILL_MATCH",
            "reason": f"Only matches {ats.get('match_score')}% of required skills. Missing: {ats.get('missing_skills')}",
            "severity": "High"
        })
        
    # --- CHECK 3: Seniority Reality Check (ATS vs Loyalty) ---
    # Convert 'Senior' text requirement to numeric year check if implied
    if criteria.get('level') == 'Senior' and loyalty.get('total_years_exp', 0) < 3:
         updates.append({
            "action": "flag_conflict",
            "logic_id": "LEVEL_MISMATCH",
            "reason": "Applied for Senior role but insufficient years of experience (<3).",
            "severity": "Critical"
        })

    # --- CHECK 4: Project Relevance (STAR Agent) ---
    if star.get('context_match_score', 0) == 0 and criteria.get('description_keywords'):
        updates.append({
            "action": "flag_warning",
            "logic_id": "NO_CONTEXT_MATCH",
            "reason": "Projects do not seem to mention key tech/domain from JD.",
            "severity": "Medium"
        })

    # --- CHECK 5: Gap Logic (Restored) ---
    if loyalty.get('has_gap') and star.get('has_projects'):
         updates.append({
                "action": "downgrade_risk",
                "logic_id": "GAP_EXPLAINED",
                "reason": "Gap year resolved by Freelance Project presence.",
                "severity": "Low"
            })

    # Final Report String Construction
    final_score = (ats.get('match_score', 0) + star.get('complexity_score', 0)*10) / 2
    state['final_report'] = f"Estimated Match Score: {final_score:.1f}/100"

    # Return results
    return {'cross_check_results': updates, 'final_report': state['final_report']}
