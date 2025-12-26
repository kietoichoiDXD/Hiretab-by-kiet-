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

## n8n + MCP + LangGraph (How it links together)

### High-level flow

1) **n8n** receives an event (new candidate / new application / HR click “scan”).
2) n8n prepares inputs (`cv_text`, `job_criteria`).
3) n8n calls the **MCP tool** `analyze_cv_logic(...)` exposed by `mcp_server.py`.
4) MCP tool runs the **LangGraph** app (`app.ainvoke(state)`), which:
   - fans out into agents (`loyalty`, `star`, `ats`, `edu`)
   - fans in to `cross_check` to detect mismatches
   - aggregates a final report in `aggregator`
5) n8n parses the JSON output, routes by severity, stores results, notifies HR.

### What n8n nodes typically look like

- **Trigger**: Webhook / Database trigger / IMAP email trigger
- **Extract CV text**:
  - If CV is already text: skip
  - If CV is PDF: use your existing extractor step (or a custom service)
- **Set / Code node**: build `job_criteria` from Job Description (JD)
- **MCP node** (recommended): call tool `analyze_cv_logic`
- **Code node**: `JSON.parse()` the tool output string
- **IF node**: route by `cross_check_results[*].severity`
- **DB node / HTTP Request**: store report back to your backend
- **Slack/Email**: notify HR when `High`/`Critical`

### Suggested n8n payload mapping

Input to tool:

```json
{
  "cv_text": "(string)",
  "job_criteria": {
    "title": "Senior Backend Engineer",
    "level": "Senior",
    "min_years_exp": 3,
    "required_skills": ["python", "aws", "microservices"],
    "description_keywords": ["distributed", "scalability", "ci/cd"]
  }
}
```

Tool output is a JSON **string**. In n8n, parse it in a Code node:

```js
// n8n Code node (JavaScript)
const raw = $json["result"]; // depends on your MCP node output field
const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
return [{ json: parsed }];
```

### How LangGraph state maps to the tool

The MCP tool constructs a LangGraph `state` with:

- `cv_text`: candidate CV text
- `job_criteria`: the JD requirements used by agents and cross-check
- `agent_outputs`: agent partial outputs (merged dict)
- `cross_check_results`: list of findings (merged list)

### Handling & operational tips

- **No secrets in git**: keep all API keys in n8n credentials or environment variables; never commit `.env`.
- **Timeouts**: if n8n has a hard timeout, prefer running the MCP server close to n8n (same machine/VPC) and keep CV text sizes reasonable.
- **Retries**: if the MCP call fails transiently, retry at the n8n node level (small backoff).
- **Batch scan**: use **Split in Batches** in n8n and call `analyze_cv_logic` per candidate; merge results at the end.
- **Severity routing**: treat any `Critical` as immediate notify + manual review; `High` as review queue; `Medium/Low` as informational.

```
