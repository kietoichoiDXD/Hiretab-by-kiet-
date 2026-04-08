import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class BaseAgent:
    def __init__(self, model="gemini-2.0-flash-exp"):
        self.api_key = os.getenv('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        self.client = genai.Client(api_key=self.api_key)
        self.model = model

    def generate(self, prompt, system_instruction=None):
        try:
            config = types.GenerateContentConfig(
                temperature=0.1, # Low temperature for factual extraction
                max_output_tokens=2000,
                response_mime_type="application/json"
            )
            
            contents = [types.Content(role="user", parts=[types.Part(text=prompt)])]
            
            # Add system instruction if provided (model dependent, but we structure it in prompt for compatibility usually, 
            # here passing as arg if client supports or prepending)
            if system_instruction:
                 # Gemini 1.5 supports system_instruction at model level or request level depending on SDK version
                 # We will prepend it to prompt for maximum compatibility/simplicity in this demo
                 contents[0].parts[0].text = f"System Instruction: {system_instruction}\n\nTask: {contents[0].parts[0].text}"

            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=config
            )
            
            return json.loads(response.text)
        except Exception as e:
            print(f"Error in agent generation: {e}")
            return {"error": str(e), "raw_text": response.text if 'response' in locals() else ""}

class FieldAgent(BaseAgent):
    def __init__(self, field_name, extra_instructions="", model="gemini-2.0-flash-exp"):
        super().__init__(model)
        self.field_name = field_name
        self.extra_instructions = extra_instructions

    def process(self, cv_text, job_description=""):
        system_instruction = f"""
        You are a specialized HR AI Agent responsible for extracting and analyzing the '{self.field_name}' section of a CV.
        Your goal is to be extremely precise, logical, and transparent.
        
        {self.extra_instructions}
        
        You must return a JSON object containing:
        1. 'extracted_data': The structured data found for this field.
        2. 'analysis': A brief analysis of this field (strengths/weaknesses) relative to the Job Description (if provided).
        3. 'confidence_score': A score from 0-100 on how confident you are about the extracted data.
        4. 'matching_score': A score from 0-100 on how well this field matches the Job Description (if provided, otherwise null).
        5. 'reasoning': Explain WHY you gave that matching score (for transparency).
        """
        
        prompt = f"""
        CV CONTENT:
        {cv_text}
        
        JOB DESCRIPTION (Standard for matching):
        {job_description if job_description else "No specific JD provided. Evaluate based on general professional standards."}
        
        Analyze ONLY the '{self.field_name}' information. Ignore other sections.
        """
        
        return self.generate(prompt, system_instruction)

class MasterAgent(BaseAgent):
    def aggregate(self, cv_text, job_description, agent_results):
        system_instruction = """
        You are the Chief HR AI Architect. Your job is to synthesize reports from multiple specialized agents into one final, coherent, and transparent evaluation.
        
        Rules:
        1. Validate consistency across agents (e.g., check if dates in Experience match Education timeline logic).
        2. Summarize the candidate's overall profile.
        3. Calculate a final weighted matching score based on agent sub-scores.
        4. Provide a 'Final Logic' section explaining clearly how the conclusion was reached.
        """
        
        # Serialize agent results for the prompt
        agents_data_str = json.dumps(agent_results, indent=2)
        
        prompt = f"""
        ORIGINAL CV CONTENT (Summary):
        {cv_text[:500]}... [truncated]
        
        JOB DESCRIPTION:
        {job_description}
        
        REPORTS FROM SPECIALIZED AGENTS:
        {agents_data_str}
        
        Please produce the final JSON report containing:
        - candidate_summary
        - final_matching_score (0-100)
        - key_strengths
        - key_gaps
        - consistency_check (Pass/Fail with notes)
        - hiring_recommendation (Strong Hire / Hire / Potential / No Hire)
        - logic_explanation (Why this recommendation?)
        """
        
        return self.generate(prompt, system_instruction)

class CVAgentSystem:
    def __init__(self):
        # Define the team of agents
        self.agents = {
            "personal_info": FieldAgent(
                "Personal Information", 
                "Extract Name, Email, Phone, LinkedIn, Portfolio. Check for professionalism in contact info."
            ),
            "education": FieldAgent(
                "Education", 
                "Extract Degrees, Universities, GDPA, Graduation Years. Match against required education level in JD."
            ),
            "experience": FieldAgent(
                "Work Experience", 
                "Extract Companies, Roles, Durations, Key Responsibilities. Focus heavily on matching keywords and seniority level from JD."
            ),
            "skills": FieldAgent(
                "Skills", 
                "Extract Technical Skills, Soft Skills, Tools, Languages. Cluster them. Compare strictly against JD 'Must-have' and 'Nice-to-have'."
            ),
            "projects": FieldAgent(
                "Projects", 
                "Extract Project Name, Description, Tech Stack, Role. Evaluate complexity and relevance to the target role."
            )
        }
        self.master = MasterAgent()

    def scan_cv(self, cv_text, job_description=""):
        results = {}
        
        # 1. Parallel execution simulation (Sequential in this simple impl, but conceptually independent)
        print("🤖 Starting Multi-Agent CV Scan...")
        
        for name, agent in self.agents.items():
            print(f"   ↳ Agent '{name}' is working...")
            try:
                # Each agent works independently strictly on their domain
                results[name] = agent.process(cv_text, job_description)
            except Exception as e:
                print(f"   ❌ Agent '{name}' failed: {e}")
                results[name] = {"error": str(e)}

        # 2. Master Agent aggregates
        print("👑 Master Agent is synthesizing results...")
        try:
            final_report = self.master.aggregate(cv_text, job_description, results)
        except Exception as e:
            print(f"   ❌ Master Agent failed: {e}")
            final_report = {"error": str(e)}

        # Return comprehensive structure
        return {
            "status": "success",
            "detailed_agent_reports": results,
            "final_assessment": final_report
        }

# Usage Example Helper
def test_system():
    system = CVAgentSystem()
    sample_cv = "John Doe. Developer. Worked at Google 2020-2024 using Python."
    sample_jd = "Looking for Senior Python Developer."
    print(json.dumps(system.scan_cv(sample_cv, sample_jd), indent=2))

if __name__ == "__main__":
    test_system()
