from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text, Numeric, Table, PrimaryKeyConstraint, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String)
    is_premium = Column(Boolean, default=False)
    premium_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    songs = relationship("Song", back_populates="user")
    payments = relationship("Payment", back_populates="user")

class Song(Base):
    __tablename__ = "songs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    sender_name = Column(String, nullable=False)
    receiver_name = Column(String, nullable=False)
    relationship_type = Column("relationship", String, nullable=False) # Maps to relationship column
    mood = Column(String, nullable=False)
    language = Column(String, nullable=False)
    singer_vibe = Column(String, nullable=False)
    occasion = Column(String, nullable=False)
    memories = Column(Text, nullable=True)
    title = Column(String, nullable=True)
    audio_url = Column(Text, nullable=True)
    video_url = Column(Text, nullable=True)
    cover_url = Column(Text, nullable=True)
    duration = Column(Integer, nullable=True)
    theme = Column(String, default="romantic")
    voice_gender = Column(String, default="female")
    status = Column(String, default="pending") # pending, generating, completed, failed
    task_id = Column(String, nullable=True)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="songs")
    lyrics = relationship("Lyrics", back_populates="song", uselist=False, cascade="all, delete-orphan")
    media_assets = relationship("MediaAsset", back_populates="song", cascade="all, delete-orphan")
    views = relationship("SongView", back_populates="song", cascade="all, delete-orphan")

class Lyrics(Base):
    __tablename__ = "lyrics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    song_id = Column(String, ForeignKey("songs.id", ondelete="CASCADE"), unique=True)
    raw_text = Column(Text, nullable=False)
    structured_lyrics = Column(JSON, nullable=True) # List of dictionaries: {"time": float, "text": str}
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    song = relationship("Song", back_populates="lyrics")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    stripe_session_id = Column(String, unique=True, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="usd")
    status = Column(String, nullable=False) # pending, completed, failed, refunded
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="payments")

class MediaAsset(Base):
    __tablename__ = "media_assets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    song_id = Column(String, ForeignKey("songs.id", ondelete="CASCADE"))
    asset_type = Column(String, nullable=False) # receiver_photo, couple_photo, video_clip
    url = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    song = relationship("Song", back_populates="media_assets")

class SongView(Base):
    __tablename__ = "song_views"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    song_id = Column(String, ForeignKey("songs.id", ondelete="CASCADE"))
    viewer_ip = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    viewed_at = Column(DateTime(timezone=True), server_default=func.now())

    song = relationship("Song", back_populates="views")

class Favorite(Base):
    __tablename__ = "favorites"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    song_id = Column(String, ForeignKey("songs.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
