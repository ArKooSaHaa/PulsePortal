SYSTEM_PROMPT = """You are a medical triage assistant.

Strict rules:
- Ask follow-up symptom questions.
- Do NOT give final diagnosis.
- Suggest only possible conditions.
- Give short, clear advice.
- Always recommend doctor consultation.
- Keep responses under 120 words.
- No prescription drugs.
- No unsafe medical advice.
- No creative writing.
- Support English and Bangla. Reply in the user's language when clear, but keep the section labels exactly as shown.

MANDATORY RESPONSE FORMAT:
Possible causes:
* ...

Advice:
* ...

Follow-up question:
* ...
"""


EMERGENCY_KEYWORDS = [
    "chest pain",
    "breathing difficulty",
    "difficulty breathing",
    "shortness of breath",
    "unconscious",
    "seizure",
    "severe bleeding",
    "বুকে ব্যথা",
    "শ্বাসকষ্ট",
    "অজ্ঞান",
    "খিঁচুনি",
    "অতিরিক্ত রক্তপাত",
]


def check_emergency(text: str):
    normalized = text.lower()
    for keyword in EMERGENCY_KEYWORDS:
        if keyword.lower() in normalized:
            return "⚠️ This may be an emergency. Seek immediate medical care."
    return None


def map_specialist(user_text: str) -> str:
    text = user_text.lower()

    if any(term in text for term in ["chest pain", "chest tightness", "heart pain", "বুকে ব্যথা"]):
        return "Cardiologist"
    if any(term in text for term in ["skin issue", "skin issues", "rash", "itch", "itching", "acne", "allergy", "ত্বক"]):
        return "Dermatologist"
    if any(term in text for term in ["stomach pain", "abdominal pain", "belly pain", "gastric", "indigestion", "পেট ব্যথা"]):
        return "Gastroenterologist"
    if any(term in text for term in ["fever", "temperature", "flu", "cold", "জ্বর"]):
        return "General Physician"

    return "General Physician"


def build_prompt(user_text: str, history=None, specialization=None) -> str:
    history = history or []
    formatted_history = [_format_message(message) for message in history[-5:]]
    memory = "\n".join(message for message in formatted_history if message)
    mapped_specialist = specialization or map_specialist(user_text)
    stage = _conversation_stage(history)

    return (
        f"{SYSTEM_PROMPT}\n\n"
        f"Conversation stage: {stage}\n\n"
        "Conversation memory (last 3-5 messages):\n"
        f"{memory or 'No prior context.'}\n\n"
        f"Mapped doctor specialization: {mapped_specialist}\n\n"
        f"Current patient message:\n{user_text.strip()}\n\n"
        "Return only the mandatory response format."
    )


def _format_message(message):
    role = str(message.get("role", "user")).lower()
    label = "Assistant" if role == "assistant" else "User"
    content = " ".join(str(message.get("content", "")).split())
    return f"{label}: {content}" if content else ""


def _conversation_stage(history):
    message_count = sum(1 for message in history if str(message.get("content", "")).strip())
    if message_count <= 1:
        return "initial symptom clarification; ask one focused follow-up question"
    if message_count <= 4:
        return "focused triage; refine possible causes and ask the most important missing question"
    return "recommendation stage; keep advice concise and guide the patient to the mapped specialist"
