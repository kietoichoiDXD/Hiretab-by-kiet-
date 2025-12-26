# HireTab AI Engine (LangGraph + MCP)

## What it is

- `graph.py`: LangGraph pipeline (fan-out agents → cross-check → aggregator)
- `nodes/agents.py`: individual async “agents” producing partial signals
- `nodes/cross_check.py`: reconciles signals, emits findings + score
- `mcp_server.py`: exposes the pipeline as an MCP tool
- `demo_ui.py`: Streamlit UI that calls the LangGraph app directly

## Run (Windows / PowerShell)

### 1) Create venv + install deps

From the repo root `HireTab/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip

# core deps used by ai_engine
pip install langgraph mcp streamlit pypdf
```

> If your org pins versions, prefer a shared requirements file.

### 2) Run MCP server (for n8n)

```powershell
cd ai_engine
python mcp_server.py
```

This exposes MCP tool: `analyze_cv_logic(cv_text, job_criteria?)`.

### 3) Run local demo UI

```powershell
cd ai_engine
streamlit run demo_ui.py
```

## Tool I/O

### MCP tool: `analyze_cv_logic`

Input:
- `cv_text` (string)
- `job_criteria` (optional object)

Example `job_criteria`:

```json
{
  "title": "Senior Backend Engineer",
  "level": "Senior",
  "min_years_exp": 3,
  "required_skills": ["python", "aws", "microservices"],
  "description_keywords": ["distributed", "scalability", "ci/cd"]
}
```

Output (stringified JSON):

```json
{
  "final_report": "Estimated Match Score: 75.0/100",
  "cross_check_results": [
    {
      "action": "flag_mismatch",
      "logic_id": "LOW_SKILL_MATCH",
      "reason": "...",
      "severity": "High"
    }
  ]
}
```
