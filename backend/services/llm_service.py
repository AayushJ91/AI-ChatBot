import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

from schemas.chat import Message

# Always load backend/.env regardless of which folder you run uvicorn from
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_FILE)

# OpenAI-compatible Chat Completions endpoint (defaults to local Ollama)
LLM_API_URL = os.getenv("LLM_API_URL", "http://localhost:11434/v1/chat/completions")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.2")
LLM_API_KEY = os.getenv("LLM_API_KEY")


def generate_reply(messages: list[Message]) -> str:
    # 1. Translate your Pydantic Message objects into the plain dicts the API expects
    formatted_messages = [
        {"role": "system", "content": "You are a helpful AI assistant."},
    ]
    for msg in messages:
        formatted_messages.append({"role": msg.role, "content": msg.content})

    # 2. Prepare headers (Authorization is optional for local Ollama) and JSON body
    headers = {"Content-Type": "application/json"}
    if LLM_API_KEY:
        headers["Authorization"] = f"Bearer {LLM_API_KEY}"

    payload = {
        "model": LLM_MODEL,
        "messages": formatted_messages,
    }

    # 3. Send the HTTP POST request (longer timeout for local model cold starts)
    try:
        response = httpx.post(LLM_API_URL, headers=headers, json=payload, timeout=120.0)
    except httpx.ConnectError as exc:
        raise RuntimeError(
            f"Could not connect to LLM server at {LLM_API_URL}. Make sure Ollama is running."
        ) from exc

    if response.is_error:
        raise RuntimeError(
            f"LLM API error ({response.status_code}): {response.text}"
        )

    # 4. Unpack and return just the AI's reply text
    data = response.json()
    return data["choices"][0]["message"]["content"]
