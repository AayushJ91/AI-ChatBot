from schemas.chat import (
    Chat,
    ChatCreate,
    ChatSummary,
    Message,
    MessageCreate,
    SendMessageResponse,
)
from services import llm_service
from storage import json_store


def list_chats() -> list[ChatSummary]:
    chats = json_store.get_all_chats()
    return [
        ChatSummary(id=chat.id, title=chat.title, created_at=chat.created_at)
        for chat in chats
    ]


def create_chat(data: ChatCreate) -> Chat:
    chat = Chat(title=data.title)
    return json_store.save_chat(chat)


def get_chat(chat_id: str) -> Chat | None:
    return json_store.get_chat(chat_id)


def get_messages(chat_id: str) -> list[Message] | None:
    chat = json_store.get_chat(chat_id)
    if chat is None:
        return None
    return chat.messages


def send_message(chat_id: str, data: MessageCreate) -> SendMessageResponse | None:
    chat = json_store.get_chat(chat_id)
    if chat is None:
        return None

    user_msg = Message(role="user", content=data.content)
    json_store.add_message(chat_id, user_msg)

    reply_text = llm_service.generate_reply(chat.messages + [user_msg])
    assistant_msg = Message(role="assistant", content=reply_text)
    json_store.add_message(chat_id, assistant_msg)

    return SendMessageResponse(
        user_message=user_msg,
        assistant_message=assistant_msg,
    )


def delete_chat(chat_id: str) -> bool:
    return json_store.delete_chat(chat_id)
