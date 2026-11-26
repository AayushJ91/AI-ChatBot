import json
from pathlib import Path

from schemas.chat import Chat, Message

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "chats.json"


def _load_data() -> dict[str, dict]:
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save_data(data: dict[str, dict]) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)


def get_all_chats() -> list[Chat]:
    data = _load_data()
    return [Chat.model_validate(raw) for raw in data.values()]


def get_chat(chat_id: str) -> Chat | None:
    data = _load_data()
    raw = data.get(chat_id)
    if raw is None:
        return None
    return Chat.model_validate(raw)


def save_chat(chat: Chat) -> Chat:
    data = _load_data()
    data[chat.id] = chat.model_dump(mode="json")
    _save_data(data)
    return chat


def add_message(chat_id: str, message: Message) -> Message | None:
    data = _load_data()
    if chat_id not in data:
        return None
    data[chat_id]["messages"].append(message.model_dump(mode="json"))
    _save_data(data)
    return message


def delete_chat(chat_id: str) -> bool:
    data = _load_data()
    if chat_id not in data:
        return False
    del data[chat_id]
    _save_data(data)
    return True