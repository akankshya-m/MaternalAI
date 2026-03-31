import os
import pandas as pd
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

PATIENTS_CSV = os.path.join(os.path.dirname(__file__), "patients.csv")

_df = None
_llm = None
_agent = None


def _get_df():
    global _df
    if _df is None:
        _df = pd.read_csv(PATIENTS_CSV)
    return _df


def _get_llm():
    global _llm
    if _llm is None:
        _llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.3,
        )
    return _llm


@tool
def risk_score_tool(patient_name: str) -> str:
    """Score the maternal health risk for a specific named patient."""
    df = _get_df()
    match = df[df["name"].str.lower() == patient_name.strip().lower()]
    if match.empty:
        return f"Patient '{patient_name}' not found in records."
    row = match.iloc[0]

    prompt = f"""You are a maternal health AI. Assess the risk for this patient:

Name: {row['name']}
Age: {row['age']} | Gestational week: {row['gestational_week']}
BP: {row['systolic_bp']}/{row['diastolic_bp']} mmHg
Hemoglobin: {row['hemoglobin']} g/dL
Missed appointments: {row['missed_appointments']}
Last visit: {row['last_visit_days_ago']} days ago
Previous complications: {row['previous_complications']}
Area: {row['area']} | Income: {row['income_level']} | Transport: {row['transport_access']}

Respond with:
RISK LEVEL: HIGH / MEDIUM / LOW
TOP 3 RISK FACTORS:
1. ...
2. ...
3. ...
URGENCY: (immediate/within 48h/routine)
CONFIDENCE: X%
SUMMARY: (2 sentences, mention socioeconomic barriers)"""

    response = _get_llm().invoke(prompt)
    return response.content


@tool
def care_playbook_tool(patient_name: str) -> str:
    """Generate a 5-step equity-aware care plan for a specific named patient."""
    df = _get_df()
    match = df[df["name"].str.lower() == patient_name.strip().lower()]
    if match.empty:
        return f"Patient '{patient_name}' not found in records."
    row = match.iloc[0]

    prompt = f"""You are a maternal health equity AI. Create a 5-step care plan for:

Name: {row['name']}
Age: {row['age']} | Gestational week: {row['gestational_week']}
BP: {row['systolic_bp']}/{row['diastolic_bp']} mmHg
Hemoglobin: {row['hemoglobin']} g/dL
Missed appointments: {row['missed_appointments']}
Previous complications: {row['previous_complications']}
Area: {row['area']} | Income: {row['income_level']} | Transport: {row['transport_access']}

Provide a 5-step equity-aware care plan that specifically addresses:
- Her socioeconomic barriers (income: {row['income_level']}, transport: {row['transport_access']})
- Her geographic context (area: {row['area']})
- Her clinical needs

Format:
CARE PLAN FOR {row['name']}:
Step 1: [Clinical action]
Step 2: [Transport/access support]
Step 3: [Community health worker involvement]
Step 4: [Nutritional/supplementation guidance]
Step 5: [Follow-up and monitoring schedule]
EQUITY NOTE: (specific barriers addressed)"""

    response = _get_llm().invoke(prompt)
    return response.content


@tool
def rag_chat_tool(question: str) -> str:
    """Answer questions about the patient population using RAG search over patient records."""
    from rag import search
    result = search(question)
    context = result["context"]
    citations = result["citations"]

    prompt = f"""You are MaternaWatch AI. Answer the following question using ONLY the patient data provided below.
Always cite patient names in your answer.

QUESTION: {question}

PATIENT DATA:
{context}

Provide a clear, concise answer citing specific patients by name. Mention equity factors where relevant."""

    response = _get_llm().invoke(prompt)
    return response.content + f"\n\n[Sources: {', '.join(citations)}]"


@tool
def pdf_tool(text: str) -> str:
    """Answer questions about an uploaded PDF document given its extracted text."""
    prompt = f"""You are MaternaWatch AI. The user has uploaded a document. Analyze and answer based on this content:

{text[:3000]}

Provide a helpful summary or answer based on this document, relating it to maternal health where applicable."""

    response = _get_llm().invoke(prompt)
    return response.content


SYSTEM_PROMPT = """You are MaternaWatch, an AI agent for maternal health equity.
Use risk_score_tool ONLY when user asks to score or assess a SPECIFIC named patient.
Use care_playbook_tool ONLY when user asks for a care plan for a SPECIFIC named patient.
Use rag_chat_tool for ANY question about the patient population, searching patients, or general queries.
Use pdf_tool ONLY when user mentions an uploaded PDF document.
Always be equity-aware and mention socioeconomic barriers."""


def get_agent():
    global _agent
    if _agent is not None:
        return _agent

    tools = [risk_score_tool, care_playbook_tool, rag_chat_tool, pdf_tool]
    _agent = create_agent(_get_llm(), tools, system_prompt=SYSTEM_PROMPT)
    return _agent


def run_agent(message: str) -> dict:
    """Run the agent and return answer + tool_used."""
    agent = get_agent()
    result = agent.invoke({"messages": [{"role": "user", "content": message}]})

    messages = result.get("messages", [])
    answer = ""
    tool_used = None

    for msg in reversed(messages):
        msg_type = type(msg).__name__
        if msg_type == "AIMessage" and hasattr(msg, "content") and msg.content:
            answer = msg.content
            break

    for msg in messages:
        msg_type = type(msg).__name__
        if msg_type == "ToolMessage":
            tool_used = getattr(msg, "name", None)
            break

    return {"answer": answer, "tool_used": tool_used}


if __name__ == "__main__":
    print("Testing risk_score_tool for Priya M....")
    result = risk_score_tool.invoke({"patient_name": "Priya M."})
    print(result)
