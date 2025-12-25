from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date
import random
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ================= MODELS =================

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    gender: str  # "male" or "female"
    couple_code: Optional[str] = None
    partner_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    gender: str

class CycleData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    couple_code: Optional[str] = None  # Per condivisione con partner
    last_period_date: str  # YYYY-MM-DD
    cycle_length: int = 28
    period_length: int = 5
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CycleDataCreate(BaseModel):
    user_id: str
    couple_code: Optional[str] = None
    last_period_date: str
    cycle_length: int = 28
    period_length: int = 5

class IntimacyEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    couple_code: str
    date: str  # YYYY-MM-DD
    quality_rating: int  # 1-5
    notes: Optional[str] = None
    created_by: str  # user_id
    created_at: datetime = Field(default_factory=datetime.utcnow)

class IntimacyEntryCreate(BaseModel):
    couple_code: str
    date: str
    quality_rating: int
    notes: Optional[str] = None
    created_by: str

class Challenge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    couple_code: str
    title: str
    description: str
    category: str  # "romantic", "spicy", "adventure"
    completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChallengeCreate(BaseModel):
    couple_code: str
    title: str
    description: str
    category: str

# ================= CHALLENGES & SUGGESTIONS DATABASE =================

SPICY_CHALLENGES = [
    {"title": "Serata Massaggio", "description": "Scambiatevi un massaggio sensuale di 20 minuti a turno", "category": "romantic"},
    {"title": "Colazione a Letto", "description": "Preparate insieme una colazione e mangiatela a letto", "category": "romantic"},
    {"title": "Doccia Insieme", "description": "Fate una doccia o un bagno insieme con candele profumate", "category": "spicy"},
    {"title": "Gioco dei Dadi", "description": "Usate dei dadi per decidere zone e azioni", "category": "spicy"},
    {"title": "Lettera d'Amore", "description": "Scrivete una lettera piccante al partner e leggetela insieme", "category": "romantic"},
    {"title": "Cena Afrodisiaca", "description": "Preparate una cena con cibi afrodisiaci: ostriche, cioccolato, fragole", "category": "romantic"},
    {"title": "Bendati", "description": "Uno dei due bendato mentre l'altro esplora", "category": "spicy"},
    {"title": "Roleplay", "description": "Scegliete un scenario fantasioso e interpretatelo", "category": "adventure"},
    {"title": "Notte Senza Telefoni", "description": "Serata dedicata solo a voi due, telefoni spenti", "category": "romantic"},
    {"title": "Stanza Nuova", "description": "Provate una stanza diversa della casa", "category": "adventure"},
    {"title": "Strip Quiz", "description": "Quiz a tema coppia, chi sbaglia toglie un capo", "category": "spicy"},
    {"title": "Appuntamento al Buio", "description": "Pianificate un appuntamento sorpresa per il partner", "category": "adventure"},
]

POSITION_SUGGESTIONS = [
    {"name": "Missionario Classico", "difficulty": "facile", "description": "Intimo e romantico, perfetto per connessione visiva"},
    {"name": "Cowgirl", "difficulty": "facile", "description": "Lei prende il controllo del ritmo"},
    {"name": "Pecorina", "difficulty": "facile", "description": "Stimolazione profonda e intensa"},
    {"name": "Cucchiaio", "difficulty": "facile", "description": "Romantico e rilassante, ideale per mattina"},
    {"name": "Amazzone Inversa", "difficulty": "medio", "description": "Visuale diversa, sensazioni uniche"},
    {"name": "Lotus", "difficulty": "medio", "description": "Connessione profonda faccia a faccia"},
    {"name": "69", "difficulty": "medio", "description": "Piacere simultaneo per entrambi"},
    {"name": "Ponte", "difficulty": "difficile", "description": "Richiede flessibilità ma molto intenso"},
    {"name": "Standing", "difficulty": "difficile", "description": "Spontaneo e appassionato"},
    {"name": "Sedia", "difficulty": "medio", "description": "Versatile, può essere ovunque ci sia una sedia"},
]

COMPATIBILITY_QUESTIONS = [
    {"question": "Qual è il momento ideale per l'intimità?", "options": ["Mattina", "Pomeriggio", "Sera", "Notte fonda"]},
    {"question": "Quanto è importante il romanticismo prima?", "options": ["Fondamentale", "Piacevole", "Non necessario", "Dipende"]},
    {"question": "Preferisci sessioni lunghe o intense?", "options": ["Lunghe e slow", "Intense e veloci", "Un mix", "Dipende dall'umore"]},
    {"question": "Quanto sei aperto a sperimentare?", "options": ["Molto aperto", "Abbastanza", "Poco", "Preferisco il classico"]},
    {"question": "Cosa ti eccita di più?", "options": ["Parole dolci", "Contatto fisico", "Atmosfera", "Spontaneità"]},
]

# ================= ROUTES =================

@api_router.get("/")
async def root():
    return {"message": "Couple Wellness API"}

# User Routes
@api_router.post("/users", response_model=User)
async def create_user(input: UserCreate):
    user_dict = input.dict()
    user_obj = User(**user_dict)
    # Generate unique couple code
    user_obj.couple_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    await db.users.insert_one(user_obj.dict())
    return user_obj

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.post("/users/join-couple")
async def join_couple(user_id: str, couple_code: str):
    # Find partner with this code
    partner = await db.users.find_one({"couple_code": couple_code})
    if not partner:
        raise HTTPException(status_code=404, detail="Codice coppia non trovato")
    
    if partner["id"] == user_id:
        raise HTTPException(status_code=400, detail="Non puoi collegarti a te stesso")
    
    # Link both users
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"partner_id": partner["id"], "couple_code": couple_code}}
    )
    await db.users.update_one(
        {"id": partner["id"]},
        {"$set": {"partner_id": user_id}}
    )
    
    return {"message": "Coppia collegata!", "couple_code": couple_code}

# Cycle Data Routes
@api_router.post("/cycle", response_model=CycleData)
async def save_cycle_data(input: CycleDataCreate):
    # Get user to find couple_code
    user = await db.users.find_one({"id": input.user_id})
    couple_code = user.get("couple_code") if user else None
    
    # Remove existing cycle data for this user
    await db.cycle_data.delete_many({"user_id": input.user_id})
    
    # If there's a couple_code, also update/remove any existing data with same couple_code
    if couple_code:
        await db.cycle_data.delete_many({"couple_code": couple_code})
    
    cycle_dict = input.dict()
    cycle_dict["couple_code"] = couple_code
    cycle_obj = CycleData(**cycle_dict)
    await db.cycle_data.insert_one(cycle_obj.dict())
    return cycle_obj

@api_router.get("/cycle/{user_id}", response_model=Optional[CycleData])
async def get_cycle_data(user_id: str):
    # First try to find by user_id
    cycle = await db.cycle_data.find_one({"user_id": user_id})
    if cycle:
        return CycleData(**cycle)
    
    # If not found, try to find by couple_code (for partner)
    user = await db.users.find_one({"id": user_id})
    if user and user.get("couple_code"):
        cycle = await db.cycle_data.find_one({"couple_code": user["couple_code"]})
        if cycle:
            return CycleData(**cycle)
    
    return None

@api_router.get("/cycle/fertility/{user_id}")
async def get_fertility_calendar(user_id: str):
    # First try to find by user_id
    cycle = await db.cycle_data.find_one({"user_id": user_id})
    
    # If not found, try to find by couple_code (for partner viewing)
    if not cycle:
        user = await db.users.find_one({"id": user_id})
        if user and user.get("couple_code"):
            cycle = await db.cycle_data.find_one({"couple_code": user["couple_code"]})
    
    if not cycle:
        return {"periods": [], "fertile_days": [], "ovulation_days": []}
    
    from datetime import timedelta
    last_period = datetime.strptime(cycle["last_period_date"], "%Y-%m-%d")
    cycle_length = cycle["cycle_length"]
    period_length = cycle["period_length"]
    
    periods = []
    fertile_days = []
    ovulation_days = []
    
    # Calculate for next 6 months
    current_period = last_period
    for _ in range(6):
        # Period days
        for i in range(period_length):
            periods.append((current_period + timedelta(days=i)).strftime("%Y-%m-%d"))
        
        # Ovulation is typically 14 days before next period
        ovulation = current_period + timedelta(days=cycle_length - 14)
        ovulation_days.append(ovulation.strftime("%Y-%m-%d"))
        
        # Fertile window: 5 days before ovulation + ovulation day + 1 day after
        for i in range(-5, 2):
            fertile_day = ovulation + timedelta(days=i)
            fertile_days.append(fertile_day.strftime("%Y-%m-%d"))
        
        current_period = current_period + timedelta(days=cycle_length)
    
    return {
        "periods": periods,
        "fertile_days": fertile_days,
        "ovulation_days": ovulation_days
    }

# Intimacy Routes
@api_router.post("/intimacy", response_model=IntimacyEntry)
async def log_intimacy(input: IntimacyEntryCreate):
    entry_obj = IntimacyEntry(**input.dict())
    await db.intimacy.insert_one(entry_obj.dict())
    return entry_obj

@api_router.get("/intimacy/{couple_code}", response_model=List[IntimacyEntry])
async def get_intimacy_entries(couple_code: str):
    entries = await db.intimacy.find({"couple_code": couple_code}).to_list(1000)
    return [IntimacyEntry(**entry) for entry in entries]

@api_router.delete("/intimacy/{entry_id}")
async def delete_intimacy_entry(entry_id: str):
    result = await db.intimacy.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Deleted successfully"}

@api_router.get("/intimacy/stats/{couple_code}")
async def get_intimacy_stats(couple_code: str):
    entries = await db.intimacy.find({"couple_code": couple_code}).to_list(1000)
    
    if not entries:
        return {
            "total_count": 0,
            "monthly_count": 0,
            "weekly_count": 0,
            "average_quality": 0,
            "sessometro_level": "Nuova Coppia",
            "sessometro_score": 0,
            "streak": 0,
            "best_streak": 0,
            "favorite_day": None,
            "hottest_week": None,
            "passion_trend": "stable",
            "fun_stats": {
                "total_hours_estimated": 0,
                "calories_burned_estimated": 0,
                "mood_boost_score": 0,
                "spontaneity_score": 0,
                "romance_vs_passion": "balanced"
            },
            "badges": [],
            "next_milestone": "Prima volta insieme"
        }
    
    from datetime import timedelta
    from collections import Counter
    
    now = datetime.utcnow()
    month_ago = now - timedelta(days=30)
    week_ago = now - timedelta(days=7)
    two_months_ago = now - timedelta(days=60)
    
    # Basic counts
    monthly_entries = [e for e in entries if datetime.strptime(e["date"], "%Y-%m-%d") >= month_ago]
    weekly_entries = [e for e in entries if datetime.strptime(e["date"], "%Y-%m-%d") >= week_ago]
    prev_month_entries = [e for e in entries if two_months_ago <= datetime.strptime(e["date"], "%Y-%m-%d") < month_ago]
    
    monthly_count = len(monthly_entries)
    weekly_count = len(weekly_entries)
    prev_month_count = len(prev_month_entries)
    
    avg_quality = sum(e["quality_rating"] for e in entries) / len(entries)
    monthly_avg_quality = sum(e["quality_rating"] for e in monthly_entries) / len(monthly_entries) if monthly_entries else 0
    
    # Calculate streak (consecutive weeks with activity)
    sorted_entries = sorted(entries, key=lambda x: x["date"], reverse=True)
    dates = [datetime.strptime(e["date"], "%Y-%m-%d") for e in sorted_entries]
    
    streak = 0
    best_streak = 0
    current_streak = 0
    
    # Weekly streak calculation
    if dates:
        current_week = now.isocalendar()[1]
        current_year = now.year
        weeks_with_activity = set()
        for d in dates:
            weeks_with_activity.add((d.year, d.isocalendar()[1]))
        
        # Check consecutive weeks
        for i in range(52):  # Check last year
            week_to_check = current_week - i
            year_to_check = current_year
            if week_to_check <= 0:
                week_to_check += 52
                year_to_check -= 1
            if (year_to_check, week_to_check) in weeks_with_activity:
                current_streak += 1
            else:
                if current_streak > best_streak:
                    best_streak = current_streak
                if i < 2:  # Allow one week gap for current streak
                    continue
                break
        streak = current_streak
        if current_streak > best_streak:
            best_streak = current_streak
    
    # Favorite day of week
    day_counts = Counter()
    for e in entries:
        day = datetime.strptime(e["date"], "%Y-%m-%d").strftime("%A")
        day_counts[day] += 1
    
    day_names_it = {
        "Monday": "Lunedì", "Tuesday": "Martedì", "Wednesday": "Mercoledì",
        "Thursday": "Giovedì", "Friday": "Venerdì", "Saturday": "Sabato", "Sunday": "Domenica"
    }
    favorite_day = day_names_it.get(day_counts.most_common(1)[0][0]) if day_counts else None
    
    # Passion trend
    if prev_month_count > 0:
        trend_change = ((monthly_count - prev_month_count) / prev_month_count) * 100
        if trend_change > 20:
            passion_trend = "rising"
        elif trend_change < -20:
            passion_trend = "cooling"
        else:
            passion_trend = "stable"
    else:
        passion_trend = "rising" if monthly_count > 0 else "stable"
    
    # Fun stats calculations
    avg_duration_minutes = 25  # Estimated average
    total_hours = (len(entries) * avg_duration_minutes) / 60
    calories_per_session = 150  # Average estimate
    total_calories = len(entries) * calories_per_session
    
    # Mood boost (based on frequency and quality)
    mood_boost = min(100, int((monthly_count * 5) + (avg_quality * 10)))
    
    # Spontaneity score (variety in days of week)
    unique_days = len(set(datetime.strptime(e["date"], "%Y-%m-%d").weekday() for e in monthly_entries))
    spontaneity = int((unique_days / 7) * 100) if monthly_entries else 0
    
    # Romance vs Passion (based on quality vs frequency)
    if monthly_count > 8 and monthly_avg_quality < 3.5:
        romance_vs_passion = "più passione"
    elif monthly_count < 4 and monthly_avg_quality > 4:
        romance_vs_passion = "più romanticismo"
    elif monthly_count > 8 and monthly_avg_quality > 4:
        romance_vs_passion = "fuoco totale"
    else:
        romance_vs_passion = "equilibrato"
    
    # Sessometro calculation - MORE COMPLEX NOW
    # Components: frequency (30%), quality (25%), consistency/streak (20%), trend (15%), variety (10%)
    frequency_score = min(monthly_count / 12 * 10, 10)  # 12/month = max
    quality_score = (avg_quality / 5) * 10
    streak_score = min(streak / 8 * 10, 10)  # 8 weeks streak = max
    trend_score = 7 if passion_trend == "rising" else (5 if passion_trend == "stable" else 3)
    variety_score = spontaneity / 10
    
    sessometro_score = (
        frequency_score * 0.30 +
        quality_score * 0.25 +
        streak_score * 0.20 +
        trend_score * 0.15 +
        variety_score * 0.10
    )
    
    # More fun levels
    if sessometro_score >= 9:
        level = "Vulcano in Eruzione"
        level_emoji = "🌋"
    elif sessometro_score >= 8:
        level = "Fuoco e Fiamme"
        level_emoji = "🔥"
    elif sessometro_score >= 7:
        level = "Passione Ardente"
        level_emoji = "💋"
    elif sessometro_score >= 5.5:
        level = "Intesa Perfetta"
        level_emoji = "💕"
    elif sessometro_score >= 4:
        level = "Armonia Dolce"
        level_emoji = "🌸"
    elif sessometro_score >= 2.5:
        level = "Fiamma Timida"
        level_emoji = "🕯️"
    elif sessometro_score >= 1:
        level = "Da Riaccendere"
        level_emoji = "💨"
    else:
        level = "Nuova Coppia"
        level_emoji = "🌱"
    
    # Badges system
    badges = []
    if len(entries) >= 100:
        badges.append({"name": "Centenario", "icon": "💯", "desc": "100 momenti insieme!"})
    if len(entries) >= 50:
        badges.append({"name": "Veterani", "icon": "🏆", "desc": "50 momenti insieme"})
    if len(entries) >= 10:
        badges.append({"name": "Affiatati", "icon": "⭐", "desc": "10 momenti insieme"})
    if streak >= 4:
        badges.append({"name": "Costanti", "icon": "📈", "desc": f"{streak} settimane consecutive"})
    if streak >= 8:
        badges.append({"name": "Inarrestabili", "icon": "🚀", "desc": "8+ settimane di streak"})
    if avg_quality >= 4.5:
        badges.append({"name": "Qualità Top", "icon": "💎", "desc": "Media qualità eccellente"})
    if monthly_count >= 12:
        badges.append({"name": "Maratoneti", "icon": "🏃", "desc": "12+ volte questo mese"})
    if favorite_day == "Domenica" or favorite_day == "Sabato":
        badges.append({"name": "Weekend Warriors", "icon": "🎉", "desc": "Amanti del weekend"})
    if spontaneity >= 70:
        badges.append({"name": "Imprevedibili", "icon": "🎲", "desc": "Alta spontaneità"})
    
    # Next milestone
    total = len(entries)
    if total < 10:
        next_milestone = f"Ancora {10 - total} per il badge 'Affiatati'"
    elif total < 50:
        next_milestone = f"Ancora {50 - total} per il badge 'Veterani'"
    elif total < 100:
        next_milestone = f"Ancora {100 - total} per il badge 'Centenario'"
    else:
        next_milestone = "Siete leggendari! 🏆"
    
    return {
        "total_count": len(entries),
        "monthly_count": monthly_count,
        "weekly_count": weekly_count,
        "average_quality": round(avg_quality, 1),
        "sessometro_level": level,
        "sessometro_level_emoji": level_emoji,
        "sessometro_score": round(sessometro_score, 1),
        "streak": streak,
        "best_streak": best_streak,
        "favorite_day": favorite_day,
        "passion_trend": passion_trend,
        "fun_stats": {
            "total_hours_estimated": round(total_hours, 1),
            "calories_burned_estimated": total_calories,
            "mood_boost_score": mood_boost,
            "spontaneity_score": spontaneity,
            "romance_vs_passion": romance_vs_passion
        },
        "badges": badges,
        "next_milestone": next_milestone,
        "score_breakdown": {
            "frequency": round(frequency_score, 1),
            "quality": round(quality_score, 1),
            "consistency": round(streak_score, 1),
            "trend": round(trend_score, 1),
            "variety": round(variety_score, 1)
        }
    }

# Challenges Routes
@api_router.get("/challenges/suggestions")
async def get_challenge_suggestions():
    return {
        "challenges": SPICY_CHALLENGES,
        "positions": POSITION_SUGGESTIONS,
        "quiz_questions": COMPATIBILITY_QUESTIONS
    }

@api_router.post("/challenges", response_model=Challenge)
async def add_challenge(input: ChallengeCreate):
    challenge_obj = Challenge(**input.dict())
    await db.challenges.insert_one(challenge_obj.dict())
    return challenge_obj

@api_router.get("/challenges/{couple_code}", response_model=List[Challenge])
async def get_couple_challenges(couple_code: str):
    challenges = await db.challenges.find({"couple_code": couple_code}).to_list(100)
    return [Challenge(**c) for c in challenges]

@api_router.put("/challenges/{challenge_id}/complete")
async def complete_challenge(challenge_id: str):
    result = await db.challenges.update_one(
        {"id": challenge_id},
        {"$set": {"completed": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return {"message": "Challenge completata!"}

@api_router.get("/random-suggestion")
async def get_random_suggestion():
    suggestion_type = random.choice(["challenge", "position"])
    if suggestion_type == "challenge":
        return {"type": "challenge", "data": random.choice(SPICY_CHALLENGES)}
    else:
        return {"type": "position", "data": random.choice(POSITION_SUGGESTIONS)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
