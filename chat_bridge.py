import sys
import json
from triage import check_emergency, build_prompt, map_specialist
from llm import ask_llm


DISCLAIMER = "This AI provides general health information only. Consult a doctor."


def _normalize_history(history):
    normalized = []
    for message in history:
        if not isinstance(message, dict):
            continue
        role = str(message.get("role", "user")).lower()
        role = "assistant" if role == "assistant" else "user"
        content = " ".join(str(message.get("content", "")).split()).strip()
        if not content:
            continue
        normalized.append({"role": role, "content": content[:2000]})
    return normalized[-5:]

def main():
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No input provided"}))
            return

        input_data = json.loads(sys.argv[1])
        user_text = input_data.get("message", "")
        history = _normalize_history(input_data.get("history", []))

        # 1. Check emergency
        emergency_msg = check_emergency(user_text)
        specialization = map_specialist(user_text)

        if emergency_msg:
            print(json.dumps({
                "emergency": True,
                "message": emergency_msg,
                "specialization": specialization,
                "disclaimer": DISCLAIMER,
            }))
            return

        # 2. Build Prompt
        prompt = build_prompt(user_text, history, specialization)

        # 3. Call LLM
        response_text = ask_llm(prompt)

        # 4. Return result
        print(json.dumps({
            "emergency": False,
            "message": response_text,
            "specialization": specialization,
            "disclaimer": DISCLAIMER,
        }))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
