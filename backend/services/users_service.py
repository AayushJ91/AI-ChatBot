import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
import jwt
from dotenv import load_dotenv

from schemas.users import UserCreate, UserInDB, UserLogin, UserOut
from storage import mongo_store

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_FILE)

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7


def _get_jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET_KEY")
    if not secret:
        raise ValueError("JWT_SECRET_KEY is not set in backend/.env")
    return secret


# Password helpers
def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


# JWT helpers
def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": user_id,
        "exp": expire,
    }
    return jwt.encode(payload, _get_jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, _get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


# User business logic
def register_user(data: UserCreate) -> UserOut:
    normalized_email = data.email.lower()
    if mongo_store.get_user_by_email(normalized_email) is not None:
        raise ValueError("Email is already registered")

    user_in_db = UserInDB(
        username=data.username,
        email=normalized_email,
        hashed_pass=hash_password(data.password),
    )
    saved = mongo_store.create_user(user_in_db)
    return UserOut(
        id=saved.id,
        username=saved.username,
        email=saved.email,
        created_at=saved.created_at,
    )


def authenticate_user(data: UserLogin) -> UserOut | None:
    normalized_email = data.email.lower()
    user = mongo_store.get_user_by_email(normalized_email)
    if user is None or not verify_password(data.password, user.hashed_pass):
        return None

    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        created_at=user.created_at,
    )


def get_user_by_id(user_id: str) -> UserOut | None:
    user = mongo_store.get_user_by_id(user_id)
    if user is None:
        return None
    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        created_at=user.created_at,
    )
