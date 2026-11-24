from fastapi import FastAPI

app = FastAPI()  # Starting server - uvicorn main:app --reload

@app.get("/")
async def root():
    return {"message" : "Hello World"}  