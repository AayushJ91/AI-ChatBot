from fastapi import FastAPI

from routes.chat import router as chat_router

app = FastAPI(title="AI ChatBot API")  # Start server: uvicorn main:app --reload

app.include_router(chat_router)


@app.get("/")
async def root():
    return {"message": "Hello World"}
