from fastapi import APIRouter, Body, Depends, HTTPException, status

from routes.auth import get_current_user
from schemas.chat import (
    Chat,
    ChatCreate,
    ChatSummary,
    Message,
    MessageCreate,
    SendMessageResponse,
)
from schemas.users import UserOut
from services import chat_service

router = APIRouter(prefix="/chats", tags=["Chats"])


# 1. Get all chats for the logged-in user (metadata only)
@router.get("/", response_model=list[ChatSummary], status_code=status.HTTP_200_OK)
async def list_convos(current_user: UserOut = Depends(get_current_user)):
    return chat_service.list_chats(current_user.id)


# 2. Create a new chat owned by the logged-in user
@router.post("/", response_model=Chat, status_code=status.HTTP_201_CREATED)
async def create_chat(
    body: ChatCreate = Body(default_factory=ChatCreate),
    current_user: UserOut = Depends(get_current_user),
):
    return chat_service.create_chat(body, current_user.id)


# 3. Get all messages of a specific chat (must belong to current_user)
@router.get("/{chat_id}/messages", response_model=list[Message])
async def get_mssg(
    chat_id: str,
    current_user: UserOut = Depends(get_current_user),
):
    mssgs = chat_service.get_messages(chat_id, current_user.id)
    if mssgs is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )
    return mssgs


# 4. Get a specific chat (metadata + messages, must belong to current_user)
@router.get("/{chat_id}", response_model=Chat)
async def specific_chat(
    chat_id: str,
    current_user: UserOut = Depends(get_current_user),
):
    chat = chat_service.get_chat(chat_id, current_user.id)
    if chat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )
    return chat


# 5. Send a message in a specific chat and get an AI response
@router.post(
    "/{chat_id}/messages",
    response_model=SendMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def send_mssg(
    chat_id: str,
    body: MessageCreate,
    current_user: UserOut = Depends(get_current_user),
):
    try:
        response = chat_service.send_message(chat_id, body, current_user.id)
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


# 6. Delete a specific conversation (must belong to current_user)
@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_convo(
    chat_id: str,
    current_user: UserOut = Depends(get_current_user),
):
    deleted = chat_service.delete_chat(chat_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found",
        )
