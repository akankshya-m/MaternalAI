import sqlite3
import os
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), "feedback.db")


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_name TEXT,
            action TEXT,
            rating TEXT,
            correction TEXT,
            timestamp TEXT
        )
    """)
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")


def log_feedback(patient_name: str, action: str, rating: str, correction: str = ""):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO feedback (patient_name, action, rating, correction, timestamp) VALUES (?, ?, ?, ?, ?)",
        (patient_name, action, rating, correction, datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    conn.close()


def get_all_feedback() -> list:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM feedback ORDER BY id DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


if __name__ == "__main__":
    init_db()
    log_feedback("Priya M.", "risk_score", "thumbs_up")
    log_feedback("Aisha K.", "care_plan", "thumbs_down", "Plan should mention transport assistance")
    records = get_all_feedback()
    print(f"\nFeedback records ({len(records)}):")
    for r in records:
        print(r)
