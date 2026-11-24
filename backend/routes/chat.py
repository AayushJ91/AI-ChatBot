from fastapi import APIRouter, Body, HTTPException, status

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
@router.get("/", response_model=list[ChatSummary])
async def list_convos():
    # logic: call chat_service to fetch all conversations from storage
    # return: list[ChatSummary] (id, title, created_at — no messages)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented yet",
    )


# 2. Create a new chat
@router.post("/", response_model=Chat, status_code=status.HTTP_201_CREATED)
async def create_chat(body: ChatCreate = Body(default_factory=ChatCreate)):
    # logic: call chat_service to create a new Chat (auto-generates id & created_at) and save to storage
    # return: 201 Created with the newly created Chat object
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented yet",
    )


# 3. Get all messages of a specific chat
@router.get("/{chat_id}/messages", response_model=list[Message])
async def get_mssg(chat_id: str):
    # logic: call chat_service to fetch messages for chat_id (raise 404 if chat not found)
    # return: list[Message] belonging to this chat
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented yet",
    )


# 4. Get a specific chat (metadata + messages)
@router.get("/{chat_id}", response_model=Chat)
async def specific_chat(chat_id: str):
    # logic: call chat_service to fetch the full Chat by chat_id (raise 404 if chat not found)
    # return: full Chat object (id, title, created_at, messages)
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented yet",
    )


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
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented yet",
    )


# 6. Delete a specific conversation
@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_convo(chat_id: str):
    # logic: call chat_service to delete chat_id from storage (raise 404 if chat not found)
    # return: 204 No Content
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented yet",
    )
