import hashlib

def generate_cover_art_url(
    receiver_name: str,
    relationship: str,
    mood: str,
    theme: str = "romantic"
) -> str:
    """Generates a fast album cover art URL with reliable fallback (Unsplash)."""
    
    mood_keywords = {
        "romantic": "couple,love,hearts,sunset",
        "sad": "alone,rain,tears,night",
        "happy": "celebration,joy,party,light",
        "nostalgic": "vintage,memories,old,retro",
        "motivational": "mountains,sunrise,strength,power",
        "emotional": "feelings,clouds,abstract,emotion"
    }
    
    keywords = mood_keywords.get(mood, "music,album")
    
    # Hash the receiver name to get a consistent but varied seed for image variety
    seed = int(hashlib.md5(receiver_name.encode()).hexdigest(), 16) % 10000
    
    # Use Unsplash API (faster, always reachable, no CORS issues, no authentication required)
    # Format: https://source.unsplash.com/{width}x{height}?{query}&sig={seed}
    return f"https://source.unsplash.com/512x512?{keywords},{theme}&sig={seed}"
