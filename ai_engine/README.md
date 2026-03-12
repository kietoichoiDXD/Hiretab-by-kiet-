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
# HireTab AI Engine — LangGraph + MCP + n8n (Scan CV chuẩn theo JD)

Tài liệu này gộp toàn bộ: kiến trúc AI engine (LangGraph), cách chạy MCP server, cách nối n8n, best practices để scan CV “chuẩn” hơn, và 1 transcript để bạn thuyết trình/dạy lại.

## 1) Tổng quan

Mục tiêu: n8n điều phối workflow tuyển dụng; MCP là “cổng tool chuẩn”; LangGraph điều phối nhiều agent để scan CV theo **job criteria (JD)** và có **cross-check** giữa các agent.

## 2) Kiến trúc trong repo

- `graph.py`: định nghĩa LangGraph pipeline (fan-out agents → cross-check → aggregator)
- `state.py`: schema state + merge strategy
- `nodes/agents.py`: các agent (async node) tạo tín hiệu riêng
- `nodes/cross_check.py`: luật đối chiếu/cảnh báo/mismatch
- `mcp_server.py`: expose tool MCP để n8n gọi
- `demo_ui.py`: Streamlit demo gọi `app.ainvoke(...)` trực tiếp

### LangGraph flow (đang dùng)

1) `setup`
2) Fan-out: `loyalty`, `star`, `ats`, `edu`
3) Fan-in: `cross_check`
4) `aggregator` → `END`

Điểm quan trọng: `job_criteria` là input giúp scan “chuẩn” theo từng job, thay vì report chung chung.

## 3) Chạy local (Windows / PowerShell)

### 3.1 Tạo venv + cài deps

Chạy từ repo root `HireTab/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -U pip

pip install langgraph mcp streamlit pypdf
```

### 3.2 Chạy MCP server (để n8n gọi)

```powershell
cd ai_engine
python mcp_server.py
```

### 3.3 Chạy demo UI

```powershell
cd ai_engine
streamlit run demo_ui.py
```

## 4) MCP tool: input/output (chuẩn để n8n map)

Tool hiện có: `analyze_cv_logic(cv_text, job_criteria?)`

### Input

- `cv_text`: string
- `job_criteria` (optional object):

```json
{
  "title": "Senior Backend Engineer",
  "level": "Senior",
  "min_years_exp": 3,
  "required_skills": ["python", "aws", "microservices"],
  "description_keywords": ["distributed", "scalability", "ci/cd"]
}
```

### Output

Tool trả về **JSON string** (để n8n parse dễ):

```json
{
  "final_report": "FINAL REPORT\n================\nNo issues found.",
  "cross_check_results": [
    {
      "action": "flag_mismatch",
      "logic_id": "LOW_SKILL_MATCH",
      "reason": "Only matches 40% required skills...",
      "severity": "High"
    }
  ]
}
```

## 5) Nối n8n + MCP + LangGraph (luồng chuẩn)

### 5.1 Luồng tổng thể

1) n8n nhận trigger (ứng viên apply / HR bấm scan / cron batch)
2) n8n lấy dữ liệu: CV + Job Description (JD)
3) n8n chuẩn hoá:
   - extract `cv_text`
   - dựng `job_criteria`
4) n8n gọi MCP tool `analyze_cv_logic`
5) LangGraph chạy fan-out agents + cross-check
6) n8n parse output và xử lý:
   - lưu DB
   - notify HR
   - route theo severity

### 5.2 Gợi ý workflow nodes trong n8n

- **Trigger**: Webhook / DB Trigger / Email Trigger
- **HTTP Request**: lấy candidate + job detail (JD)
- **Extract CV text**:
  - nếu CV là PDF: dùng node/service của bạn để PDF → text
- **Code/Set**: build `job_criteria`
- **MCP node**: call tool `analyze_cv_logic`
- **Code node**: parse JSON string output
- **IF / Switch**: phân luồng theo `severity`
- **DB / HTTP Request**: lưu report, cập nhật candidate status
- **Slack/Email**: chỉ notify khi High/Critical

### 5.3 Code node để parse output

```js
// n8n Code node
// Lưu ý: field output của MCP node có thể khác nhau theo node/connector.
// Hãy thay $json["result"] bằng field thực tế bạn nhận được.

const raw = $json["result"];
const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
return [{ json: parsed }];
```

### 5.4 Routing theo severity (khuyến nghị)

- Nếu có `Critical`: tạo task manual review + notify HR ngay
- Nếu có `High`: đưa vào queue “Risk review”
- Nếu chỉ `Medium/Low`: lưu insight, không spam notify

## 6) Làm scan “chuẩn hơn” (best practices)

### 6.1 Chuẩn hoá CV text

- Remove header/footer lặp lại của PDF
- Giữ mốc thời gian (YYYY, ranges) vì logic exp phụ thuộc
- Normalize text: lowercase/strip extra whitespace (n8n có thể làm trước)

### 6.2 Chuẩn hoá job_criteria

- `required_skills`: lowercase, thống nhất alias (js/javascript, node/nodejs)
- `description_keywords`: tránh từ quá chung; chọn keyword phân biệt domain/tech
- `min_years_exp` + `level`: dùng nhất quán để cross-check seniority

### 6.3 Vận hành trong n8n

- **Batch scan**: Split in Batches → gọi tool từng CV → merge
- **Retry**: retry với backoff khi MCP call lỗi transient
- **Audit**: lưu raw output JSON + timestamp + candidateId/jobId
- **Timeout**: đặt timeout hợp lý; chạy MCP server gần n8n (cùng máy/VPC)

### 6.4 Bảo mật

- API keys chỉ để trong n8n credentials / env vars
- Không commit `.env` hoặc secret vào git

