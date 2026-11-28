import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import ASCENDING, DESCENDING, MongoClient

from schemas.chat import Chat, Message
from schemas.users import UserInDB

# Always load backend/.env regardless of which folder you run uvicorn from
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_FILE)

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "ai_chatbot")

if not MONGODB_URI:
    raise ValueError("MONGODB_URI is not set in backend/.env")

client = MongoClient(MONGODB_URI)
db = client[MONGODB_DB_NAME]
chats_col = db["chats"]
messages_col = db["messages"]
users_col = db["users"]

# Indexes keep lookup fast and enforce unique IDs / emails
chats_col.create_index("id", unique=True)
chats_col.create_index("user_id")
messages_col.create_index("chat_id")
users_col.create_index("id", unique=True)
users_col.create_index("email", unique=True)


def get_all_chats(user_id: str) -> list[Chat]:
    """Fetch all chat metadata documents for a user (newest first)."""
    cursor = chats_col.find({"user_id": user_id}, {"_id": 0}).sort("created_at", DESCENDING)
    return [Chat.model_validate(doc) for doc in cursor]


def get_chat(chat_id: str, user_id: str) -> Chat | None:
    """Fetch one chat owned by `user_id` plus all its messages sorted oldest -> newest."""
    chat_doc = chats_col.find_one({"id": chat_id, "user_id": user_id}, {"_id": 0})
    if chat_doc is None:
        return None

    msg_cursor = messages_col.find(
        {"chat_id": chat_id},
        {"_id": 0, "chat_id": 0},
    ).sort("created_at", ASCENDING)

    chat_doc["messages"] = list(msg_cursor)
    return Chat.model_validate(chat_doc)


def save_chat(chat: Chat) -> Chat:
    """Insert a new chat metadata document into the `chats` collection."""
    doc = chat.model_dump(mode="json", exclude={"messages"})
    chats_col.insert_one(doc)
    return chat


def add_message(chat_id: str, message: Message, user_id: str) -> Message | None:
    """Append a message linked to `chat_id` (if owned by `user_id`) into `messages`."""
    if chats_col.find_one({"id": chat_id, "user_id": user_id}, {"_id": 1}) is None:
        return None

    doc = message.model_dump(mode="json")
    doc["chat_id"] = chat_id
    messages_col.insert_one(doc)
    return message


def delete_chat(chat_id: str, user_id: str) -> bool:
    """Delete a chat owned by `user_id` and cascade-delete all of its messages."""
    result = chats_col.delete_one({"id": chat_id, "user_id": user_id})
    if result.deleted_count == 0:
        return False

    messages_col.delete_many({"chat_id": chat_id})
    return True
 

def create_user(user: UserInDB) -> UserInDB:
    """Insert a new user document into the `users` collection."""
    doc = user.model_dump(mode="json")
    users_col.insert_one(doc)
    return user


def get_user_by_email(email: str) -> UserInDB | None:
    """Fetch a user by email, or None if not found."""
    doc = users_col.find_one({"email": email}, {"_id": 0})
    if doc is None:
        return None
    return UserInDB.model_validate(doc)


def get_user_by_id(user_id: str) -> UserInDB | None:
    """Fetch a user by id, or None if not found."""
    doc = users_col.find_one({"id": user_id}, {"_id": 0})
    if doc is None:
        return None
    return UserInDB.model_validate(doc)
