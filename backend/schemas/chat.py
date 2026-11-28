from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field


class Message(BaseModel):
    """Represents a single stored or returned message in a chat."""

    id: str = Field(default_factory=lambda: str(uuid4()))
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MessageCreate(BaseModel):
    """Request body when a user sends a new message."""

    content: str = Field(..., min_length=1, description="The text sent by the user")


class SendMessageResponse(BaseModel):
    """Response returned after sending a message and getting an AI reply."""

    user_message: Message
    assistant_message: Message


class ChatCreate(BaseModel):
    """Request body when creating a new conversation."""

    title: str = Field(default="New Chat", min_length=1, max_length=100)


class ChatSummary(BaseModel):
    """Lightweight chat metadata (without messages) for listing all chats."""

    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str | None = None
    title: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Chat(ChatSummary):
    """Full conversation model including all messages, used for storage and chat details."""

    messages: list[Message] = Field(default_factory=list)

