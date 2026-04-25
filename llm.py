import os

from groq import Groq


MODEL = "llama-3.1-8b-instant"
FALLBACK_MODELS = [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
]


def ask_llm(prompt: str) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not configured.")

    client = Groq(api_key=api_key)
    preferred_model = os.getenv("GROQ_MODEL", MODEL).strip() or MODEL
    models_to_try = []

    for model in [preferred_model, *FALLBACK_MODELS]:
        if model and model not in models_to_try:
            models_to_try.append(model)

    last_error = None

    for model in models_to_try:
        try:
            completion = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=280,
            )

            content = completion.choices[0].message.content
            if content and content.strip():
                return content.strip()

            last_error = RuntimeError("Groq API returned an empty response.")
        except Exception as exc:
            message = str(exc)
            last_error = exc

            if "model_decommissioned" in message or "decommissioned" in message.lower():
                continue

            raise

    raise RuntimeError(f"Groq request failed after trying fallback models: {last_error}")
