import httpx
import logging
import json
from app.core.config import settings

logger = logging.getLogger(__name__)

# Fallback lyrics templates in different languages to ensure 100% reliability
FALLBACK_LYRICS = {
    "English": {
        "romantic": """(Verse 1)
I remember the day our paths crossed, a beautiful spark in the dark,
{memories}
Every heartbeat of mine sings your name, {receiver_name}.
With you, I've found where I belong, my guiding light, my home.

(Chorus)
Oh, {receiver_name}, you're the song in my soul,
Making me complete, making me whole.
From {sender_name} to you, this love is true,
Forever and always, I'm here for you.

(Verse 2)
On this special {occasion}, under the stars that shine,
I promise to hold your hand, to merge your heart with mine.
No matter where the wind blows, or what the future brings,
You're my favorite melody, the joy my spirit sings.

(Chorus)
Oh, {receiver_name}, you're the song in my soul,
Making me complete, making me whole.
From {sender_name} to you, this love is true,
Forever and always, I'm here for you.""",
        "emotional": """(Verse 1)
Life has its seasons, its highs and its lows,
But having you by my side is the greatest gift I know.
{memories}
Thank you for being my anchor, my friend, my guide,
With you, {receiver_name}, I have nothing to hide.

(Chorus)
Through the tears and the smiles, we stand tall,
Through the years and the storms, we have it all.
Dedication from {sender_name} to you, my dear,
Whenever you're down, remember I am near.""",
        "happy": """(Verse 1)
Sunlight is streaming, a new day is here,
With you in my life, there is nothing to fear!
{memories}
Let's celebrate this {occasion} with laughter and cheer,
{receiver_name}, you make the whole world clear!

(Chorus)
Dance to the rhythm, let's make some noise,
You are the source of my infinite joys!
From {sender_name} to you, let the good times roll,
Your happy vibe is healing my soul!"""
    },
    "Tamil": {
        "romantic": """(Verse 1)
உன்னை பார்த்த அந்த நொடி, நெஞ்சில் பூத்த ஒரு செடி,
{memories}
உன் சிரிப்பில் என் உலகம் வாழுதடி, {receiver_name}.
நீயின்றி நான் இல்லை, என் காதல் என்றும் குறையவில்லை.

(Chorus)
ஓ {receiver_name}, என் உயிர் நீதானே,
உன் பின்னே என் நெஞ்சம் அலைகிறதே.
{sender_name} எழுதும் காதல் கவிதை இது,
என்றென்றும் உன்னோடு என் வாழ்க்கை அது.

(Verse 2)
இந்த இனிய {occasion} நாளில், உனக்காக பாடுகிறேன்,
உன் கரம் பிடித்து, காலம் கடக்க நினைக்கிறேன்.
விண்மீன்கள் மறைந்தாலும், என் காதல் மறையாது,
உன் அன்பு இல்லாமல், என் மூச்சு ஓடாது.

(Chorus)
ஓ {receiver_name}, என் உயிர் நீதானே,
உன் பின்னே என் நெஞ்சம் அலைகிறதே.
{sender_name} எழுதும் காதல் கவிதை இது,
என்றென்றும் உன்னோடு என் வாழ்க்கை அது.""",
        "emotional": """(Verse 1)
வாழ்க்கை பயணத்தில் நீ கிடைத்தாய், ஒரு வரமாய்,
{memories}
தோள் கொடுக்க நீ இருக்கும்போது, பயமில்லை என் நெஞ்சில்,
{receiver_name}, என் இன்ப துன்பங்களின் பாதியாய் நீ.

(Chorus)
கண்ணீரின் வழியிலும் புன்னகை நீயே,
காலங்கள் கடந்தாலும் என் துணை நீயே.
{sender_name} சமர்ப்பிக்கும் அன்பு கீதம் இது,
என்றும் உன் நிழலாய் தொடர்வேன் நான்."""
    }
}

# Add fallbacks for Hindi and Telugu
FALLBACK_LYRICS["Hindi"] = {
    "romantic": """(Verse 1)
Tumse hi subah hoti hai, tumse hi shaam,
{memories}
Mere har lamhe pe likha hai tera naam, {receiver_name}.
Tum ho toh hai zindagi haseen, tum nahi toh kuch bhi nahi.

(Chorus)
O {receiver_name}, tum hi ho meri bandagi,
Tumse hi judi hai meri ye zindagi.
{sender_name} ki taraf se ye pyaara sa paigaam,
Tumhare naam likh di maine ye shaam.

(Verse 2)
Is khushi ke {occasion} par, dil se ye dua nikli,
Ki tum sada muskurati raho, ban ke khushboo.
Duniya ki har khushi mile tumko mere humdum,
Saath chalenge hum har kadam.""",
    "emotional": """(Verse 1)
Zindagi ke har safar mein, tumne diya mera saath,
{memories}
Jab bhi main gira, tumne thama mera haath.
{receiver_name}, tumse hi seekha maine jeena aur muskurana.

(Chorus)
Har dard mein tum hi hamdard ho,
Har khushi ka tum hi toh rang ho.
{sender_name} ka ye geet tumhare liye hai,
Mera ye dil bas tumhare liye jiye hai."""
}

FALLBACK_LYRICS["Telugu"] = {
    "romantic": """(Verse 1)
Nee jatha lo gadichina prathi kshanam oka varam,
{memories}
Naa gundello nindindi nee prema swaram, {receiver_name}.
Nuvvunte prathi roju oka pandage, nuvve naa prapanchame.

(Chorus)
O {receiver_name}, nuvve naa prema ragam,
Nee thone naa jeevitha prayanam.
{sender_name} rasina prema lekha idi,
Nee gundello bhadram ga undani.

(Verse 2)
Eee subha {occasion} vela, nee cheyi chetha patti,
Nooteylla payanani saagiddam prema thoti.
Ye kashtalochina edurunda nee needai,
Prathi janma lo unta nee thodai."""
}

async def generate_lyrics_and_title(
    sender_name: str,
    receiver_name: str,
    relationship: str,
    mood: str,
    language: str,
    singer_vibe: str,
    occasion: str,
    memories: str = ""
) -> dict:
    """Generates highly emotional lyrics and a title using Gemini API or custom procedural fallbacks."""
    
    title = f"A Song for {receiver_name}"
    raw_lyrics = ""
    
    # Preprocess memories block
    mem_text = f"We share these memories: {memories}" if memories else "You mean the world to me and make every day brighter."
    
    # Try calling Gemini API if key is available
    if settings.GEMINI_API_KEY:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={settings.GEMINI_API_KEY}"
            prompt = f"""
            Write the lyrics and a title for a personalized song.
            Details:
            - Sender: {sender_name}
            - Receiver: {receiver_name}
            - Relationship: {relationship}
            - Mood/Tone: {mood}
            - Language: {language}
            - Style/Singer vibe: {singer_vibe}
            - Occasion: {occasion}
            - Special Memories: {memories if memories else 'None specified, write a beautiful general dedication.'}
            
            Structure requirement:
            Provide a response in JSON format containing:
            1. "title": A beautiful romantic or emotional title for the song.
            2. "lyrics": The full song lyrics structured with Verses, Chorus, and Bridge.
            
            Do not include any markdown styling inside the JSON string itself.
            """
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json={
                    "contents": [{"parts": [{"text": prompt}]}]
                }, timeout=15.0)
                
                if response.status_code == 200:
                    result = response.json()
                    response_text = result['candidates'][0]['content']['parts'][0]['text']
                    
                    # Try parsing json from Gemini response
                    # Strip any markdown codeblock notation
                    cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
                    try:
                        data = json.loads(cleaned_text)
                        title = data.get("title", f"For {receiver_name}")
                        raw_lyrics = data.get("lyrics", "")
                    except Exception:
                        # Fallback parsing if JSON load fails
                        lines = response_text.split("\n")
                        title = lines[0].replace("Title:", "").strip() if "Title:" in lines[0] else f"Dedicated to {receiver_name}"
                        raw_lyrics = "\n".join(lines[1:])
        except Exception as e:
            logger.error(f"Gemini API generation failed: {str(e)}. Using fallback generator.")

    # If Gemini is not set or failed, use procedural generation
    if not raw_lyrics:
        # Determine language & mood group
        lang_group = language if language in FALLBACK_LYRICS else "English"
        mood_group = mood if mood in FALLBACK_LYRICS[lang_group] else list(FALLBACK_LYRICS[lang_group].keys())[0]
        
        template = FALLBACK_LYRICS[lang_group][mood_group]
        raw_lyrics = template.format(
            sender_name=sender_name,
            receiver_name=receiver_name,
            occasion=occasion,
            memories=mem_text
        )
        
        # Craft beautiful titles based on relationship & mood
        if mood == "romantic":
            title_options = {
                "English": f"Heartbeats for {receiver_name}",
                "Tamil": f"{receiver_name}-ன் நெஞ்சக் கவிதை",
                "Hindi": f"{receiver_name} Ke Liye Ek Geet",
                "Telugu": f"{receiver_name} Prema Geetham"
            }
        else:
            title_options = {
                "English": f"Forever {receiver_name}",
                "Tamil": f"அன்பான {receiver_name}-க்கு",
                "Hindi": f"Tumhaare Liye {receiver_name}",
                "Telugu": f"Nee Kosam {receiver_name}"
            }
        title = title_options.get(language, f"Song for {receiver_name}")

    # Generate timed/structured lyrics for the visualizer player
    structured_lyrics = []
    lines = [line.strip() for line in raw_lyrics.split("\n") if line.strip() and not line.strip().startswith("(")]
    
    # Distribute timing across the standard song duration (e.g., 30s preview or full)
    time_increment = 4.0 # seconds per line
    current_time = 2.0
    for line in lines:
        structured_lyrics.append({
            "time": current_time,
            "text": line
        })
        current_time += time_increment

    return {
        "title": title,
        "raw_text": raw_lyrics,
        "structured_lyrics": structured_lyrics
    }
