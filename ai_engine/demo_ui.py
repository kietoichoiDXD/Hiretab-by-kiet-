import streamlit as st
import asyncio
from graph import app
import json
import logging
from pypdf import PdfReader
from datetime import datetime

# --- CONFIGURATION & STYLING ---
st.set_page_config(page_title="HireTab AI Brain", layout="wide", page_icon="👔")

# Custom CSS to mimic a clean, "HireTab-like" interface
st.markdown("""
<style>
    /* Global Font */
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    
    /* Global Background */
    .stApp {
        background-color: #ffffff;
    }
    
    /* Primary Button Style (White Theme) */
    .stButton > button {
        background-color: #ffffff !important;
        color: #0f172a !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        font-weight: 600;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        width: 100%;
        transition: all 0.2s;
    }
    .stButton > button:hover {
        background-color: #f1f5f9 !important; /* Slate 100 */
        border-color: #94a3b8 !important;
        color: #020617 !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    /* Secondary/Outline Button */
    .secondary-btn {
        background-color: white;
        color: #0f172a;
        border: 1px solid #e2e8f0;
    }

    /* Card/Container Styling */
    .css-1r6slb0, .css-12oz5g7 {
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        padding: 1rem;
        background-color: white;
    }
    
    /* Header Styling */
    h1, h2, h3 {
        color: #0f172a;
    }
    
    /* Metrics Board */
    div[data-testid="stMetricValue"] {
        font-size: 1.2rem;
        color: #0f172a;
    }
    
    /* Custom Alert Boxes */
    .ht-alert-error {
        border-left: 4px solid #ef4444;
        background-color: #fef2f2;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 8px;
    }
    .ht-alert-warning {
        border-left: 4px solid #f59e0b;
        background-color: #fffbeb;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 8px;
    }
    .ht-alert-success {
        border-left: 4px solid #22c55e;
        background-color: #f0fdf4;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 8px;
    }
</style>
""", unsafe_allow_html=True)

# --- HEADER SECTION ---
col1, col2 = st.columns([1, 5])
with col1:
    # Placeholder for Logo
    st.markdown("## 👔 **HireTab**")
with col2:
    st.caption("AI-Powered Recruitment Operating System")

st.markdown("---")

# --- MAIN LAYOUT ---
# Left: Job Criteria (HR Input) | Right: Candidate Analysis (AI Output)
left_col, right_col = st.columns([1, 1.5], gap="large")

with left_col:
    st.markdown("### 1. Job Criteria")
    st.caption("Define the standards for the automated screen.")
    
    with st.container():
        job_title = st.text_input("Job Title", value="Senior Backend Engineer")
        
        c1, c2 = st.columns(2)
        with c1:
            level = st.selectbox("Seniority Level", ["Junior", "Mid-Level", "Senior", "Lead", "Exec"])
        with c2:
            min_exp = st.number_input("Min Experience (Years)", min_value=0, value=3)
            
        required_skills_txt = st.text_area("Required Skills (Comma separated)", value="Python, React, AWS, Microservices")
        desc_keywords_txt = st.text_area("Keywords to Match in Projects", value="Distributed Systems, Scalability, CI/CD", help="The AI checks if projects mention these terms.")
        
        # Parse inputs for State
        job_criteria = {
            "title": job_title,
            "level": level,
            "min_years_exp": min_exp,
            "required_skills": [s.strip() for s in required_skills_txt.split(',')],
            "description_keywords": [k.strip() for k in desc_keywords_txt.split(',')]
        }
    
    st.info(f"Looking for: **{level}** with **{min_exp}+ years**\n\nStack: {required_skills_txt}")

with right_col:
    st.markdown("### 2. Candidate Analysis")
    st.caption("Upload CV or use test data.")
    
    tab1, tab2 = st.tabs(["📄 Upload PDF", "✏️ Manual Text"])
    
    cv_text = ""
    with tab1:
        uploaded_file = st.file_uploader("Drop CV (PDF)", type=['pdf'])
        if uploaded_file:
             try:
                reader = PdfReader(uploaded_file)
                for page in reader.pages:
                    cv_text += page.extract_text() + "\n"
                st.success(f"Loaded {len(cv_text)} chars")
             except:
                 st.error("Error reading PDF")
                 
    with tab2:
        default_cv = """John Doe
Senior Developer
Experience: 3 Years (2019-2022)
Skills: Python, HTML, CSS (Missing React, AWS)
Projects: Built simple landing pages.
"""
        cv_text_input = st.text_area("Copy/Paste Resume", value=default_cv, height=200)
        if not cv_text: cv_text = cv_text_input

    # ACTION BUTTON
    analyze_btn = st.button("✨ Scan & Match Candidate")

# --- EXECUTION LOGIC ---
async def run_analysis(txt, criteria):
    state = {
        "cv_text": txt,
        "job_criteria": criteria,
        "agent_outputs": {},
        "cross_check_results": []
    }
    return await app.ainvoke(state)

if analyze_btn:
    st.markdown("---")
    st.markdown("### 🎯 Analysis Results")
    
    # 1. Processing Visualization
    with st.spinner("AI Agents are cross-referencing criteria..."):
        final_state = asyncio.run(run_analysis(cv_text, job_criteria))
        
        # Display Metrics in a "HireTab Dashboard" style
        m1, m2, m3, m4 = st.columns(4)
        outputs = final_state.get('agent_outputs', {})
        
        # Metrics Mapping
        loyalty = outputs.get('loyalty', {}).get('data', {})
        ats = outputs.get('ats', {}).get('data', {})
        
        m1.metric("Exp Match", f"{loyalty.get('total_years_exp')} yrs", delta="Pass" if loyalty.get('meets_criteria') else "Fail")
        m2.metric("Skill Match", f"{ats.get('match_score', 0):.0f}%", delta_color="normal" if ats.get('match_score') > 70 else "inverse")
        m3.metric("Gap Year", "Yes" if loyalty.get('has_gap') else "No", delta="Risk" if loyalty.get('has_gap') else "Safe", delta_color="inverse")
        m4.metric("Seniority", ats.get('claimed_seniority'), "Claimed")

    # 2. Detailed Cross-Check Alerts (The "Smart" part)
    st.subheader("⚠️ Smart Alerts")
    
    results = final_state.get('cross_check_results', [])
    if not results:
        st.success("✅ Perfect Match! No anomalies detected.")
    else:
        for item in results:
            # Render custom HTML alerts
            sev = item.get('severity', 'Low')
            css_class = "ht-alert-error" if sev in ["High", "Critical"] else "ht-alert-warning" if sev == "Medium" else "ht-alert-success"
            
            html = f"""
            <div class="{css_class}">
                <strong>{item['action'].upper()}</strong>: {item['reason']}
            </div>
            """
            st.markdown(html, unsafe_allow_html=True)
            
    # 3. Agent Raw Data Expander
    with st.expander("View Agent Internals (Debug)"):
        st.json(outputs)

    # 4. Final Recommendation
    st.markdown("### 📋 System Recommendation")
    score_str = final_state.get('final_report', "N/A")
    st.info(f"{score_str} — Based on weighted criteria analysis.")

# --- FOOTER ---
st.markdown("---")
st.caption("HireTab Internal Tool v2.0 | Powered by Multi-Agent AI")
