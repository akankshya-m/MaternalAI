# MaternaWatch AI — Maternal Health Early Warning PWA

## Project Overview
A Gen AI agent for maternal health equity hackathon (TCS AI Fridays IWD Special).
Detects high-risk pregnant women, generates AI care plans, answers questions
about patients using RAG. Deployed as a PWA — judges install it on their phones.

## Tech Stack

### Backend
- FastAPI (Python, port 8000)
- LangChain AgentExecutor with 4 tools
- LLM: Google Gemini 1.5 Flash (free) via langchain-google-genai
- ChromaDB PersistentClient at ./chroma_db for RAG
- SentenceTransformers all-MiniLM-L6-v2 for embeddings (local, free)
- SQLite via python sqlite3 for feedback logging
- pandas for patients.csv

### Frontend
- React 18 + Vite
- Tailwind CSS v4
- Axios for API calls to FastAPI
- Recharts for bar charts
- PWA: manifest.json + sw.js service worker + icon.png

## Folder Structure
```
maternawatch/
  CLAUDE.md
  .gitignore
  backend/
    main.py          FastAPI 5 routes + CORS
    agent.py         LangChain agent + 4 tools
    rag.py           ChromaDB build_index + search
    database.py      SQLite init_db + log_feedback + get_all_feedback
    generate_data.py creates patients.csv with 15 patients
    patients.csv     auto-generated
    requirements.txt all pip packages
    .env             GOOGLE_API_KEY (never commit this)
    chroma_db/       auto-created by ChromaDB
    feedback.db      auto-created by SQLite
  frontend/
    src/
      App.jsx              two-column layout, tab system
      components/
        PatientPanel.jsx   patient selector, score+plan buttons, feedback
        ChatPanel.jsx      chat messages, quick prompts, citations
        ImpactPanel.jsx    metrics, recharts bar chart, equity stats
        FeedbackLog.jsx    feedback history from SQLite
    public/
      manifest.json        PWA config
      sw.js                service worker cache-first
      icon.png             512x512 green health icon
    index.html             links manifest + registers sw
    .env                   VITE_API_URL=http://localhost:8000
    vite.config.js
    tailwind.config.js
```

## Env Files

### backend/.env
```
GOOGLE_API_KEY=your_key_here
```

### frontend/.env
```
VITE_API_URL=http://localhost:8000
```

## requirements.txt
```
fastapi
uvicorn
langchain
langchain-google-genai
langchain-community
chromadb
sentence-transformers
pandas
pypdf2
python-multipart
python-dotenv
```

## Frontend Packages
```
npm install axios tailwindcss recharts @tailwindcss/vite
```

## The 4 LangChain Tools (in agent.py)

### 1. risk_score_tool(patient_name: str)
- Find patient row in df by name using pandas
- Build prompt asking Gemini: HIGH/MED/LOW risk, top 3 risk factors, urgency, confidence %
- Return Gemini response as string

### 2. care_playbook_tool(patient_name: str)
- Find patient row in df by name
- Build prompt asking Gemini for 5-step equity-aware care plan considering income/transport/area barriers
- Return response

### 3. rag_chat_tool(question: str)
- Call search(question) from rag.py → gets context + citations
- Build prompt with retrieved patient context
- Ask Gemini to answer using only that data with citations
- Return answer

### 4. pdf_tool(text: str)
- Given extracted PDF text as input
- Ask Gemini to answer questions about it
- Return response

## Agent System Prompt
```
You are MaternaWatch, an AI agent for maternal health equity.
Use risk_score_tool ONLY when user asks to score or assess a SPECIFIC named patient.
Use care_playbook_tool ONLY when user asks for a care plan for a SPECIFIC named patient.
Use rag_chat_tool for ANY question about the patient population, searching patients, or general queries.
Use pdf_tool ONLY when user mentions an uploaded PDF document.
Always be equity-aware and mention socioeconomic barriers.
```

## FastAPI Routes (main.py)
- GET  /                  health check
- POST /api/chat          runs agent_executor, returns answer + tool_used
- POST /api/score         runs risk_score_tool directly
- POST /api/plan          runs care_playbook_tool directly
- POST /api/feedback      logs to SQLite, returns status
- GET  /api/feedback      returns all feedback rows
- CORS for: http://localhost:5173 and https://*.netlify.app

## Patients CSV Columns (generate_data.py)
patient_id, name (Indian female names), age (18-38), gestational_week (8-40),
systolic_bp (100-160), diastolic_bp (65-105), missed_appointments (0-4),
income_level (low/medium/high), transport_access (none/limited/good),
last_visit_days_ago (1-21), hemoglobin (8.0-13.5),
previous_complications (none/anaemia/preeclampsia/gestational_diabetes),
area (rural/semi-urban/urban)

**4 patients must be clearly HIGH risk: high BP + missed appts + rural + low income combinations**

## React UI Details

### App.jsx
- Header: "MaternaWatch AI" + green "Live" badge
- Two column layout: left 320px PatientPanel, right flex-1 with tabs
- Tabs: Agent Chat | Impact Panel | Feedback Log
- Mobile responsive: stack columns on small screens
- Pass apiUrl from import.meta.env.VITE_API_URL to all components

### PatientPanel.jsx
- 4 metric cards: Total(15), High Risk(4 red), Missed Appts(6 amber), Plans Today(3 green)
- Dropdown with 6 patients showing name + week + risk level
- Patient detail cards showing all fields
- "Score Risk" button → POST /api/score → show result with orange tool badge
- "Care Plan" button → POST /api/plan → show result
- Loading spinner while waiting
- Thumbs up/down feedback buttons below result
- Thumbs down shows correction textarea + submit
- PDF upload input section

### ChatPanel.jsx
- 6 quick prompt buttons: "Who is at highest risk?", "Missed 2+ appointments?",
  "Rural low-income patients", "Score Priya M.", "Care plan for Aisha K.", "High BP patients"
- Scrollable chat area max-height 400px
- User messages right-aligned blue
- Agent messages left-aligned gray with orange tool tag badge
- Citations shown in small blue text below answer
- Text input + Send button, Enter key also sends
- Animated typing indicator (3 dots) while waiting
- POST /api/chat with message

### ImpactPanel.jsx
- 4 metric cards: High-risk flagged(4), Prevented admissions(2 green), Care plans(15), Equity coverage(73%)
- Recharts BarChart: HIGH=4 red, MEDIUM=6 amber, LOW=5 green
- Equity grid: Rural(7), Low income(6), No transport(4), Missed 2+(6)

### FeedbackLog.jsx
- On mount: GET /api/feedback
- Refresh button
- Each entry: patient name, time, thumbs up/down badge, correction text
- "No feedback yet" empty state

## PWA Files

### manifest.json
- name: MaternaWatch AI
- short_name: MaternaWatch
- theme_color: #0f6e56
- background_color: #0f6e56
- display: standalone
- icons: 192x192 and 512x512 pointing to /icon.png

### sw.js
- Cache name: maternawatch-v1
- Cache on install: /, /index.html, /manifest.json, /icon.png
- Cache-first fetch strategy

### index.html additions
- `<link rel="manifest" href="/manifest.json">`
- `<meta name="theme-color" content="#0f6e56">`
- `<meta name="apple-mobile-web-app-capable" content="yes">`
- `<link rel="apple-touch-icon" href="/icon.png">`
- Service worker registration script in body

## Build Order
1. generate_data.py → test: patients.csv created
2. rag.py → test: chroma_db/ folder, search returns names
3. database.py → test: feedback.db created
4. agent.py → test: risk_score_tool("Priya M.") prints result
5. main.py → test: uvicorn runs, /docs shows all routes
6. React setup + all 4 components → test: UI loads, buttons work
7. PWA files → test: manifest loads in DevTools

## Coding Rules
- Never hardcode API keys — always os.getenv()
- load_dotenv() at top of every Python file that needs keys
- ChromaDB: skip rebuild if collection.count() > 0
- All errors: try/except in FastAPI, return {"error": str(e)} 500
- React: show loading state while API call in progress
- React: show error message if API call fails
- Never commit .env or chroma_db/ to git

## Demo Script (2 minutes)
1. "Scan QR → install MaternaWatch on your phone"
2. Select Priya M. → Score Risk → AI explains HIGH risk with confidence %
3. Care Plan → 5-step equity-aware plan appears
4. Chat: "Which rural patients need urgent care?" → RAG answers with citations
5. Thumbs down → correction → "Human-in-the-loop feedback logged"
6. Impact Panel → "2 prevented admissions, 73% equity coverage"
7. "Built in 4 hours using LangChain + ChromaDB + React PWA"
