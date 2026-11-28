from schemas.chat import (
    Chat,
    ChatCreate,
    ChatSummary,
    Message,
    MessageCreate,
    SendMessageResponse,
)
from services import llm_service
from storage import mongo_store as store


def list_chats(user_id: str) -> list[ChatSummary]:
    chats = store.get_all_chats(user_id)
    return [
        ChatSummary(
            id=chat.id,
            user_id=chat.user_id,
            title=chat.title,
            created_at=chat.created_at,
        )
        for chat in chats
    ]


def create_chat(data: ChatCreate, user_id: str) -> Chat:
    chat = Chat(title=data.title, user_id=user_id)
    return store.save_chat(chat)


def get_chat(chat_id: str, user_id: str) -> Chat | None:
    return store.get_chat(chat_id, user_id)


def get_messages(chat_id: str, user_id: str) -> list[Message] | None:
    chat = store.get_chat(chat_id, user_id)
    if chat is None:
        return None
    return chat.messages


def send_message(
    chat_id: str, data: MessageCreate, user_id: str
) -> SendMessageResponse | None:
    chat = store.get_chat(chat_id, user_id)
    if chat is None:
        return None

    user_msg = Message(role="user", content=data.content)
    reply_text = llm_service.generate_reply(chat.messages + [user_msg])
    assistant_msg = Message(role="assistant", content=reply_text)

    store.add_message(chat_id, user_msg, user_id)
    store.add_message(chat_id, assistant_msg, user_id)

    return SendMessageResponse(
        user_message=user_msg,
        assistant_message=assistant_msg,
    )


def delete_chat(chat_id: str, user_id: str) -> bool:
    return store.delete_chat(chat_id, user_id)
