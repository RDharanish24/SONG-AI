from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.database import get_db
from app.models.db_models import User
from app.models.schemas import UserResponse, UserCreate
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

@router.post("/login", response_model=UserResponse)
def login_or_register(payload: LoginRequest, db: Session = Depends(get_db)):
    """Logs in or registers a user automatically based on email."""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        user = User(
            email=payload.email,
            full_name=payload.full_name or payload.email.split("@")[0],
            is_premium=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Return user details
    return user

@router.post("/premium/{user_id}", response_model=UserResponse)
def unlock_premium(user_id: str, db: Session = Depends(get_db)):
    """Quickly toggles premium status for testing/free-tier bypassing."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_premium = True
    user.premium_until = datetime.utcnow() + timedelta(days=365)
    db.commit()
    db.refresh(user)
    return user
