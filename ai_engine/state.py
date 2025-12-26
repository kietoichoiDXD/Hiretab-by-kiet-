from typing import TypedDict, List, Dict, Any, Optional, Annotated

def merge_dicts(left: Dict[str, Any], right: Dict[str, Any]) -> Dict[str, Any]:
    if not left:
        return right
    if not right:
        return left
    return {**left, **right}

def merge_lists(left: List[Any], right: List[Any]) -> List[Any]:
    if not left:
        return right
    if not right:
        return left
    return left + right

class JobCriteria(TypedDict):
    title: str
    level: str # Junior, Senior, etc.
    min_years_exp: int
    required_skills: List[str]
    description_keywords: List[str]

class ScanState(TypedDict):
    # Input
    cv_text: str
    job_criteria: JobCriteria # Added Criteria Input
    
    # Intermediate Outputs
    agent_outputs: Annotated[Dict[str, Any], merge_dicts]
    
    # Results from Cross-Check
    cross_check_results: Annotated[List[Dict[str, Any]], merge_lists]
    
    # Final Aggregated Result
    final_report: str
