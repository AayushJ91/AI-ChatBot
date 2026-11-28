from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status

from schemas.users import UserCreate, UserLogin, UserOut
from services import users_service

router = APIRouter(prefix="/auth", tags=["Auth"])

COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = users_service.ACCESS_TOKEN_EXPIRE_DAYS * 24 * 60 * 60


def _set_auth_cookie(response: Response, user_id: str) -> None:
    token = users_service.create_access_token(user_id)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # Set True in production behind HTTPS
        max_age=COOKIE_MAX_AGE,
        path="/",
    )


def get_current_user(access_token: str | None = Cookie(default=None)) -> UserOut:
    """Reusable dependency that reads the JWT cookie and returns the logged-in user."""
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    user_id = users_service.decode_access_token(access_token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = users_service.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(body: UserCreate, response: Response):
    try:
        user = users_service.register_user(body)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    _set_auth_cookie(response, user.id)
    return user


@router.post("/login", response_model=UserOut, status_code=status.HTTP_200_OK)
async def login(body: UserLogin, response: Response):
    user = users_service.authenticate_user(body)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    _set_auth_cookie(response, user.id)
    return user


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"detail": "Logged out"}


@router.get("/me", response_model=UserOut, status_code=status.HTTP_200_OK)
async def me(current_user: UserOut = Depends(get_current_user)):
    return current_user
