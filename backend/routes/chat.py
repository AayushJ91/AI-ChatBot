from fastapi import APIRouter, Body, HTTPException, status
from services import chat_service
from schemas.chat import (
    Chat,
    ChatCreate,
    ChatSummary,
    Message,
    MessageCreate,
    SendMessageResponse,
)

router = APIRouter(prefix="/chats", tags=["Chats"])


# 1. Get all chats (metadata only: id, title, created_at)
@router.get("/", response_model=list[ChatSummary], status_code=status.HTTP_200_OK)
async def list_convos():
    # logic: call chat_service to fetch all conversations from storage
    # return: list[ChatSummary] (id, title, created_at — no messages)
    return chat_service.list_chats()


# 2. Create a new chat
@router.post("/", response_model=Chat, status_code=status.HTTP_201_CREATED)
async def create_chat(body: ChatCreate = Body(default_factory=ChatCreate)):
    # logic: call chat_service to create a new Chat (auto-generates id & created_at) and save to storage
    # return: 201 Created with the newly created Chat object
    return chat_service.create_chat(body)


# 3. Get all messages of a specific chat
@router.get("/{chat_id}/messages", response_model=list[Message])
async def get_mssg(chat_id: str):
    # logic: call chat_service to fetch messages for chat_id (raise 404 if chat not found)
    # return: list[Message] belonging to this chat
    mssgs = chat_service.get_messages(chat_id)
    if mssgs is None:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "Chat not found"
        )
    return mssgs


# 4. Get a specific chat (metadata + messages)
@router.get("/{chat_id}", response_model=Chat)
async def specific_chat(chat_id: str):
    # logic: call chat_service to fetch the full Chat by chat_id (raise 404 if chat not found)
    # return: full Chat object (id, title, created_at, messages)
    chat = chat_service.get_chat(chat_id)
    if chat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found"
        )
    return chat


# 5. Send a message in a specific chat and get an AI response
@router.post(
    "/{chat_id}/messages",
    response_model=SendMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_mssg(chat_id: str, body: MessageCreate):
    # logic: call chat_service to verify chat exists (else 404), save user message,
    #        call llm_service for AI reply, and save assistant message
    # return: 201 Created with SendMessageResponse (user_message + assistant_message)
    try:
        response = chat_service.send_message(chat_id, body)
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    if response is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )

    return response


# 6. Delete a specific conversation
@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_convo(chat_id: str):
    # logic: call chat_service to delete chat_id from storage (raise 404 if chat not found)
    # return: 204 No Content
    deleted = chat_service.delete_chat(chat_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )
