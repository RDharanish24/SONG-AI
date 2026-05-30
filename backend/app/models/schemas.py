from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: str
    is_premium: bool
    premium_until: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Song Schemas
class SongCreate(BaseModel):
    sender_name: str = Field(..., max_length=100)
    receiver_name: str = Field(..., max_length=100)
    relationship: str = Field(..., description="lover, friend, mom, dad, wife, husband, crush, sibling")
    mood: str = Field(..., description="romantic, emotional, sad, happy, motivational, nostalgic")
    language: str = Field(..., description="Tamil, English, Hindi, Telugu")
    singer_vibe: str = Field(..., description="Sid Sriram vibe, Anirudh vibe, AR Rahman vibe")
    occasion: str = Field(..., description="birthday, anniversary, friendship day, proposal, apology, random surprise")
    memories: Optional[str] = None
    theme: Optional[str] = "romantic"
    voice_gender: Optional[str] = "female"
    duration: Optional[int] = 30 # Default 30s preview for free tier

class SongUpdate(BaseModel):
    status: Optional[str] = None
    title: Optional[str] = None
    audio_url: Optional[str] = None
    video_url: Optional[str] = None
    cover_url: Optional[str] = None
    duration: Optional[int] = None

class SongResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    sender_name: str
    receiver_name: str
    relationship_type: str = Field(..., alias="relationship") # Alias to match frontend payload / db mapper
    mood: str
    language: str
    singer_vibe: str
    occasion: str
    memories: Optional[str] = None
    title: Optional[str] = None
    audio_url: Optional[str] = None
    video_url: Optional[str] = None
    cover_url: Optional[str] = None
    duration: Optional[int] = None
    theme: str
    voice_gender: str
    status: str
    task_id: Optional[str] = None
    is_public: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True

# Lyrics Schemas
class LyricsResponse(BaseModel):
    id: str
    song_id: str
    raw_text: str
    structured_lyrics: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Payment Schemas
class PaymentCreate(BaseModel):
    amount: float
    currency: str = "usd"

class PaymentResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    stripe_session_id: Optional[str] = None
    amount: float
    currency: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Analytics / Share Schema
class SongDetailsResponse(BaseModel):
    song: SongResponse
    lyrics: Optional[LyricsResponse] = None
    views_count: int = 0
    is_favorite: bool = False
