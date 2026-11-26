from schemas.chat import Message


def generate_reply(messages: list[Message]) -> str:
    return f"Response to: {messages[-1].content}"