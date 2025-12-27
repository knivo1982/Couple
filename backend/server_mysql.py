from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import random
import uuid
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, Text, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import json

load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://user:password@localhost/couplebliss")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ================= MODELS =================
class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    gender = Column(String(20))
    user_code = Column(String(10), unique=True)
    couple_code = Column(String(10))
    partner_id = Column(String(36))
    push_token = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

class IntimacyLog(Base):
    __tablename__ = "intimacy_logs"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    couple_code = Column(String(10), nullable=False)
    date = Column(String(10), nullable=False)
    quality_rating = Column(Integer, default=3)
    logged_by = Column(String(36))
    positions_used = Column(Text)  # JSON array
    duration_minutes = Column(Integer)
    location = Column(String(100))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class CycleData(Base):
    __tablename__ = "cycle_data"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False)
    start_date = Column(String(10), nullable=False)
    end_date = Column(String(10))
    cycle_length = Column(Integer, default=28)
    period_length = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.utcnow)

class Mood(Base):
    __tablename__ = "moods"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False)
    couple_code = Column(String(10), nullable=False)
    date = Column(String(10), nullable=False)
    mood = Column(Integer, default=3)
    energy = Column(Integer, default=3)
    stress = Column(Integer, default=3)
    libido = Column(Integer, default=3)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class Wishlist(Base):
    __tablename__ = "wishlist"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    couple_code = Column(String(10), nullable=False)
    user_id = Column(String(36), nullable=False)
    item_id = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class SpecialDate(Base):
    __tablename__ = "special_dates"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    couple_code = Column(String(10), nullable=False)
    title = Column(String(200), nullable=False)
    date = Column(String(10), nullable=False)
    time = Column(String(10))
    notes = Column(Text)
    created_by = Column(String(36))
    created_at = Column(DateTime, default=datetime.utcnow)

class LoveNote(Base):
    __tablename__ = "love_notes"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    couple_code = Column(String(10), nullable=False)
    sender_id = Column(String(36), nullable=False)
    sender_name = Column(String(100))
    message = Column(Text, nullable=False)
    category = Column(String(50))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class WeeklyChallenge(Base):
    __tablename__ = "weekly_challenges"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    couple_code = Column(String(10), nullable=False)
    challenge_id = Column(String(50), nullable=False)
    week_start = Column(String(10), nullable=False)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(bind=engine)

# ================= PYDANTIC MODELS =================
class UserCreate(BaseModel):
    name: str
    gender: str
    partner_code: Optional[str] = None

class IntimacyCreate(BaseModel):
    couple_code: str
    date: str
    quality_rating: int = 3
    logged_by: Optional[str] = None
    positions_used: Optional[List[str]] = []
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class CycleCreate(BaseModel):
    user_id: str
    start_date: str
    cycle_length: int = 28
    period_length: int = 5

class MoodCreate(BaseModel):
    user_id: str
    couple_code: str
    date: str
    mood: int
    energy: int
    stress: int
    libido: int
    notes: Optional[str] = None

class WishlistToggle(BaseModel):
    couple_code: str
    user_id: str
    item_id: str

class SpecialDateCreate(BaseModel):
    couple_code: str
    title: str
    date: str
    time: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None

class LoveNoteCreate(BaseModel):
    couple_code: str
    sender_id: str
    sender_name: str
    message: str
    category: str

class JoinCoupleInput(BaseModel):
    user_id: str
    partner_code: str

# ================= STATIC DATA =================
def generate_code(length=6):
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return ''.join(random.choices(chars, k=length))

LOVE_DICE_ACTIONS = [
    "Bacia", "Accarezza", "Massaggia", "Sussurra a", "Abbraccia", 
    "Tocca dolcemente", "Sfiora", "Coccola", "Stringi",
    "Lecca", "Soffia su", "Mordicchia", "Strofina", "Esplora con le dita",
    "Succhia delicatamente", "Graffia leggermente", "Pizzica dolcemente",
    "Morsica", "Lecca lentamente", "Bacia appassionatamente", 
    "Accarezza sensualmente", "Premi il corpo contro", "Strusciati su",
    "Respira caldo su", "Passa la lingua su", "Bacia umido",
    "Lecce a spirale", "Mordi e tira", "Succhia forte", 
    "Afferra con decisione", "Spingi contro"
]

LOVE_DICE_BODY_PARTS = [
    "collo", "labbra", "orecchio", "schiena", "pancia",
    "interno coscia", "fianchi", "glutei", "petto", "capezzoli",
    "inguine", "basso ventre", "osso del bacino", "incavo del collo",
    "dietro il ginocchio", "caviglia", "polso", "dita",
    "lato del seno", "zona lombare", "sotto l'ombelico", 
    "attaccatura dei capelli", "lobo dell'orecchio",
    "parte alta dell'interno coscia", "curva della schiena",
    "zona bikini", "solco del sedere"
]

LOVE_DICE_DURATION = [
    "per 10 secondi", "per 30 secondi", "per 1 minuto", "per 2 minuti",
    "finché non geme", "finché non sospira", "finché non trema",
    "a occhi chiusi", "lentamente", "intensamente", "con passione",
    "mentre ti guarda negli occhi", "da dietro", "bendato/a",
    "sussurrando cose sporche", "mentre ti tocchi", "senza fermarti",
    "alternando velocità", "usando solo la punta della lingua",
    "con ghiaccio in bocca", "dopo aver bevuto qualcosa di caldo"
]

LOVE_DICE_SCENARIOS = [
    "Al buio completo", "Con musica sensuale", "Sotto la doccia",
    "Sul divano", "Contro il muro", "Sul tavolo", "A letto",
    "In cucina", "Con candele accese", "Allo specchio",
    "Con una benda sugli occhi", "Legati le mani", "In ginocchio",
    "Sdraiato/a a pancia in giù", "Seduto/a sulle gambe"
]

SPICY_CHALLENGES = [
    {"id": "massage", "title": "Massaggio Sensuale", "description": "Preparate oli e candele per un massaggio di 30 minuti a turno", "difficulty": 1, "spicy": True},
    {"id": "strip", "title": "Strip Tease", "description": "Preparate una playlist e fate uno spogliarello per il partner", "difficulty": 2, "spicy": True},
    {"id": "fantasy", "title": "Racconta una Fantasia", "description": "Condividete una fantasia segreta che non avete mai detto", "difficulty": 2, "spicy": True},
    {"id": "toys", "title": "Esplorate Insieme", "description": "Visitate insieme un sexy shop (online o fisico)", "difficulty": 2, "spicy": True},
    {"id": "roleplay", "title": "Gioco di Ruolo", "description": "Scegliete dei personaggi e recitateli per una serata", "difficulty": 3, "spicy": True},
    {"id": "photo", "title": "Servizio Fotografico Privato", "description": "Fatevi delle foto sensuali da tenere solo per voi", "difficulty": 2, "spicy": True},
    {"id": "blindfold", "title": "Benda e Sorprese", "description": "Uno dei due è bendato mentre l'altro esplora", "difficulty": 2, "spicy": True},
    {"id": "public", "title": "Brivido Pubblico", "description": "Un bacio appassionato in un luogo semi-pubblico", "difficulty": 2, "spicy": True}
]

POSITION_SUGGESTIONS = [
    {"id": "missionary", "name": "Missionario Classico", "description": "Faccia a faccia, intimo e romantico", "difficulty": 1, "category": "classic"},
    {"id": "cowgirl", "name": "Cowgirl", "description": "Lei sopra, lui sdraiato", "difficulty": 1, "category": "classic"},
    {"id": "doggy", "name": "Pecorina", "description": "Da dietro, profonda penetrazione", "difficulty": 1, "category": "classic"},
    {"id": "spoon", "name": "Cucchiaio", "description": "Entrambi su un fianco, intimo e rilassato", "difficulty": 1, "category": "intimate"},
    {"id": "lotus", "name": "Fiore di Loto", "description": "Lui seduto, lei sopra abbracciati", "difficulty": 2, "category": "intimate"},
    {"id": "reverse_cowgirl", "name": "Cowgirl Inversa", "description": "Lei sopra girata di spalle", "difficulty": 2, "category": "adventurous"},
    {"id": "standing", "name": "In Piedi", "description": "Faccia a faccia in piedi", "difficulty": 3, "category": "adventurous"},
    {"id": "69", "name": "69", "description": "Piacere orale simultaneo", "difficulty": 2, "category": "oral"}
]

WISHLIST_ITEMS = [
    {"id": "massage_sensual", "title": "Massaggio Sensuale", "emoji": "💆", "description": "Un massaggio completo con oli profumati"},
    {"id": "roleplay", "title": "Gioco di Ruolo", "emoji": "🎭", "description": "Interpretare personaggi o scenari"},
    {"id": "bondage_light", "title": "Bondage Leggero", "emoji": "🎀", "description": "Bende, manette morbide, nastri"},
    {"id": "toys", "title": "Sex Toys", "emoji": "🔮", "description": "Esplorare con vibratori o altri giochi"},
    {"id": "outdoor", "title": "All'Aperto", "emoji": "🌲", "description": "Un'avventura in un luogo appartato"},
    {"id": "food_play", "title": "Giochi con Cibo", "emoji": "🍓", "description": "Panna, cioccolato, frutta..."},
    {"id": "video", "title": "Video Privato", "emoji": "📹", "description": "Registrare un momento intimo"},
    {"id": "shower", "title": "Sotto la Doccia", "emoji": "🚿", "description": "Momento di passione con l'acqua"},
    {"id": "morning", "title": "Sesso Mattutino", "emoji": "🌅", "description": "Iniziare la giornata con passione"},
    {"id": "mirror", "title": "Davanti allo Specchio", "emoji": "🪞", "description": "Guardarsi mentre fate l'amore"},
    {"id": "dress_up", "title": "Lingerie Speciale", "emoji": "👙", "description": "Indossare qualcosa di sexy"},
    {"id": "blindfold", "title": "Benda sugli Occhi", "emoji": "🙈", "description": "Amplificare gli altri sensi"}
]

WEEKLY_CHALLENGES = [
    {"id": "wc1", "title": "Settimana del Romanticismo", "description": "Ogni sera, scambiatevi un complimento sincero prima di dormire"},
    {"id": "wc2", "title": "Date Night", "description": "Organizzate una serata speciale solo per voi due"},
    {"id": "wc3", "title": "Messaggi Piccanti", "description": "Inviate almeno 3 messaggi seducenti durante la settimana"},
    {"id": "wc4", "title": "Prova Qualcosa di Nuovo", "description": "Sperimentate una posizione o un'attività mai provata"},
    {"id": "wc5", "title": "Settimana del Massaggio", "description": "A turno, fatevi un massaggio di 15 minuti ogni sera"},
    {"id": "wc6", "title": "Niente Telefoni", "description": "Una serata senza dispositivi, solo voi due"},
    {"id": "wc7", "title": "Sorpresa!", "description": "Preparate una sorpresa romantica per il partner"},
    {"id": "wc8", "title": "Esplorazione Sensoriale", "description": "Usate bende, piume, ghiaccio per esplorare le sensazioni"}
]

# ================= FASTAPI APP =================
app = FastAPI(title="Couple Bliss API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ================= USER ENDPOINTS =================
@api_router.post("/users")
async def create_user(user_data: UserCreate):
    db = SessionLocal()
    try:
        user_code = generate_code(6)
        couple_code = generate_code(6)
        partner_id = None
        
        # Check if joining existing couple
        if user_data.partner_code:
            partner = db.query(User).filter(User.couple_code == user_data.partner_code).first()
            if partner:
                couple_code = user_data.partner_code
                partner_id = partner.id
                partner.partner_id = None  # Will be set after user creation
        
        user = User(
            id=str(uuid.uuid4()),
            name=user_data.name,
            gender=user_data.gender,
            user_code=user_code,
            couple_code=couple_code,
            partner_id=partner_id
        )
        db.add(user)
        db.commit()
        
        # Update partner with new user's ID
        if partner_id:
            partner = db.query(User).filter(User.id == partner_id).first()
            if partner:
                partner.partner_id = user.id
                db.commit()
        
        return {
            "id": user.id,
            "name": user.name,
            "gender": user.gender,
            "user_code": user.user_code,
            "couple_code": user.couple_code,
            "partner_id": user.partner_id
        }
    finally:
        db.close()

@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "id": user.id,
            "name": user.name,
            "gender": user.gender,
            "user_code": user.user_code,
            "couple_code": user.couple_code,
            "partner_id": user.partner_id
        }
    finally:
        db.close()

@api_router.post("/users/join-couple")
async def join_couple(input: JoinCoupleInput):
    db = SessionLocal()
    try:
        # Find user
        user = db.query(User).filter(User.id == input.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Find partner by couple_code
        partner = db.query(User).filter(User.couple_code == input.partner_code).first()
        if not partner:
            raise HTTPException(status_code=404, detail="Partner code not found")
        
        # Update both users
        user.couple_code = partner.couple_code
        user.partner_id = partner.id
        partner.partner_id = user.id
        
        db.commit()
        
        return {
            "id": user.id,
            "name": user.name,
            "gender": user.gender,
            "user_code": user.user_code,
            "couple_code": user.couple_code,
            "partner_id": user.partner_id
        }
    finally:
        db.close()

# ================= INTIMACY ENDPOINTS =================
@api_router.post("/intimacy")
async def log_intimacy(data: IntimacyCreate):
    db = SessionLocal()
    try:
        entry = IntimacyLog(
            id=str(uuid.uuid4()),
            couple_code=data.couple_code,
            date=data.date,
            quality_rating=data.quality_rating,
            logged_by=data.logged_by,
            positions_used=json.dumps(data.positions_used) if data.positions_used else "[]",
            duration_minutes=data.duration_minutes,
            location=data.location,
            notes=data.notes
        )
        db.add(entry)
        db.commit()
        
        return {"id": entry.id, "message": "Logged successfully"}
    finally:
        db.close()

@api_router.get("/intimacy/{couple_code}")
async def get_intimacy_logs(couple_code: str):
    db = SessionLocal()
    try:
        entries = db.query(IntimacyLog).filter(IntimacyLog.couple_code == couple_code).order_by(IntimacyLog.date.desc()).all()
        return [{
            "id": e.id,
            "couple_code": e.couple_code,
            "date": e.date,
            "quality_rating": e.quality_rating,
            "positions_used": json.loads(e.positions_used) if e.positions_used else [],
            "duration_minutes": e.duration_minutes,
            "location": e.location,
            "notes": e.notes,
            "created_at": str(e.created_at)
        } for e in entries]
    finally:
        db.close()

@api_router.delete("/intimacy/{entry_id}")
async def delete_intimacy(entry_id: str):
    db = SessionLocal()
    try:
        entry = db.query(IntimacyLog).filter(IntimacyLog.id == entry_id).first()
        if entry:
            db.delete(entry)
            db.commit()
        return {"message": "Deleted successfully"}
    finally:
        db.close()

@api_router.get("/intimacy/stats/{couple_code}")
async def get_intimacy_stats(couple_code: str):
    db = SessionLocal()
    try:
        entries = db.query(IntimacyLog).filter(IntimacyLog.couple_code == couple_code).all()
        
        if not entries:
            return {
                "total_count": 0,
                "monthly_count": 0,
                "weekly_count": 0,
                "average_quality": 0,
                "sessometro_level": "Nuova Coppia",
                "sessometro_level_emoji": "🌱",
                "sessometro_score": 0,
                "streak": 0,
                "badges": [],
                "next_milestone": "Ancora 10 per il badge 'Affiatati'"
            }
        
        now = datetime.now()
        month_ago = now - timedelta(days=30)
        week_ago = now - timedelta(days=7)
        
        monthly_entries = [e for e in entries if datetime.strptime(e.date, '%Y-%m-%d') > month_ago]
        weekly_entries = [e for e in entries if datetime.strptime(e.date, '%Y-%m-%d') > week_ago]
        
        monthly_count = len(monthly_entries)
        weekly_count = len(weekly_entries)
        avg_quality = sum(e.quality_rating for e in entries) / len(entries) if entries else 0
        
        # Calculate streak
        dates = sorted(set(e.date for e in entries), reverse=True)
        streak = 0
        if dates:
            current_week = now.isocalendar()[1]
            for date_str in dates:
                entry_date = datetime.strptime(date_str, '%Y-%m-%d')
                if entry_date.isocalendar()[1] >= current_week - streak:
                    streak += 1
                else:
                    break
        
        # Calculate score
        frequency_score = min(monthly_count / 8 * 10, 10)
        quality_score = avg_quality * 2
        streak_score = min(streak * 2, 10)
        sessometro_score = (frequency_score * 0.4 + quality_score * 0.35 + streak_score * 0.25)
        
        # Level
        if sessometro_score >= 8:
            level = "Passione Infuocata"
            level_emoji = "🔥"
        elif sessometro_score >= 6:
            level = "Intesa Perfetta"
            level_emoji = "💕"
        elif sessometro_score >= 4:
            level = "In Crescita"
            level_emoji = "🌸"
        elif sessometro_score >= 2:
            level = "Da Riaccendere"
            level_emoji = "💨"
        else:
            level = "Nuova Coppia"
            level_emoji = "🌱"
        
        # Badges
        badges = []
        if len(entries) >= 1:
            badges.append("first_time")
        if streak >= 1:
            badges.append("week_streak")
        if avg_quality > 4:
            badges.append("quality_king")
        if len(entries) >= 5:
            badges.append("morning")
        if len(entries) >= 8:
            badges.append("night_owl")
        if monthly_count >= 20:
            badges.append("perfect_month")
        
        # Marathon badge
        has_marathon = any((e.duration_minutes or 0) >= 60 for e in entries)
        if has_marathon:
            badges.append("marathon")
        
        # Explorer badge
        unique_locations = set(e.location for e in entries if e.location)
        if len(unique_locations) >= 5:
            badges.append("explorer")
        
        return {
            "total_count": len(entries),
            "monthly_count": monthly_count,
            "weekly_count": weekly_count,
            "average_quality": round(avg_quality, 1),
            "sessometro_level": level,
            "sessometro_level_emoji": level_emoji,
            "sessometro_score": round(sessometro_score, 1),
            "streak": streak,
            "badges": badges,
            "next_milestone": f"Ancora {10 - len(entries)} per il badge 'Affiatati'" if len(entries) < 10 else "Continua così!"
        }
    finally:
        db.close()

# ================= CYCLE ENDPOINTS =================
@api_router.post("/cycle")
async def create_cycle(data: CycleCreate):
    db = SessionLocal()
    try:
        cycle = CycleData(
            id=str(uuid.uuid4()),
            user_id=data.user_id,
            start_date=data.start_date,
            cycle_length=data.cycle_length,
            period_length=data.period_length
        )
        db.add(cycle)
        db.commit()
        return {"id": cycle.id, "message": "Cycle created"}
    finally:
        db.close()

@api_router.get("/cycle/{user_id}")
async def get_cycles(user_id: str):
    db = SessionLocal()
    try:
        cycles = db.query(CycleData).filter(CycleData.user_id == user_id).order_by(CycleData.start_date.desc()).all()
        return [{
            "id": c.id,
            "user_id": c.user_id,
            "start_date": c.start_date,
            "end_date": c.end_date,
            "cycle_length": c.cycle_length,
            "period_length": c.period_length
        } for c in cycles]
    finally:
        db.close()

@api_router.get("/cycle/fertility/{user_id}")
async def get_fertility_data(user_id: str):
    db = SessionLocal()
    try:
        cycle = db.query(CycleData).filter(CycleData.user_id == user_id).order_by(CycleData.start_date.desc()).first()
        
        if not cycle:
            return {"periods": [], "fertile_days": [], "ovulation_days": []}
        
        start = datetime.strptime(cycle.start_date, '%Y-%m-%d')
        periods = []
        fertile_days = []
        ovulation_days = []
        
        # Calculate for next 3 cycles
        for i in range(3):
            cycle_start = start + timedelta(days=cycle.cycle_length * i)
            
            # Period days
            for d in range(cycle.period_length):
                periods.append((cycle_start + timedelta(days=d)).strftime('%Y-%m-%d'))
            
            # Ovulation (typically day 14)
            ovulation_day = cycle_start + timedelta(days=14)
            ovulation_days.append(ovulation_day.strftime('%Y-%m-%d'))
            
            # Fertile window (5 days before ovulation + ovulation day)
            for d in range(-5, 2):
                fertile_days.append((ovulation_day + timedelta(days=d)).strftime('%Y-%m-%d'))
        
        return {
            "periods": periods,
            "fertile_days": fertile_days,
            "ovulation_days": ovulation_days
        }
    finally:
        db.close()

@api_router.get("/fertility/predictions/{user_id}")
async def get_fertility_predictions(user_id: str):
    db = SessionLocal()
    try:
        cycle = db.query(CycleData).filter(CycleData.user_id == user_id).order_by(CycleData.start_date.desc()).first()
        
        if not cycle:
            return {"next_period": None, "days_to_period": None, "current_phase": "unknown"}
        
        start = datetime.strptime(cycle.start_date, '%Y-%m-%d')
        today = datetime.now()
        
        # Find next period
        next_period = start
        while next_period <= today:
            next_period += timedelta(days=cycle.cycle_length)
        
        days_to_period = (next_period - today).days
        
        # Current phase
        days_since_start = (today - start).days % cycle.cycle_length
        if days_since_start < cycle.period_length:
            phase = "mestruale"
        elif days_since_start < 14:
            phase = "follicolare"
        elif days_since_start < 16:
            phase = "ovulazione"
        else:
            phase = "luteale"
        
        return {
            "next_period": next_period.strftime('%Y-%m-%d'),
            "days_to_period": days_to_period,
            "current_phase": phase
        }
    finally:
        db.close()

# ================= MOOD ENDPOINTS =================
@api_router.post("/mood")
async def log_mood(data: MoodCreate):
    db = SessionLocal()
    try:
        # Check if already logged today
        existing = db.query(Mood).filter(
            Mood.user_id == data.user_id,
            Mood.date == data.date
        ).first()
        
        if existing:
            existing.mood = data.mood
            existing.energy = data.energy
            existing.stress = data.stress
            existing.libido = data.libido
            existing.notes = data.notes
        else:
            mood = Mood(
                id=str(uuid.uuid4()),
                user_id=data.user_id,
                couple_code=data.couple_code,
                date=data.date,
                mood=data.mood,
                energy=data.energy,
                stress=data.stress,
                libido=data.libido,
                notes=data.notes
            )
            db.add(mood)
        
        db.commit()
        return {"message": "Mood logged"}
    finally:
        db.close()

@api_router.get("/mood/today/{couple_code}")
async def get_today_moods(couple_code: str):
    db = SessionLocal()
    try:
        today = datetime.now().strftime('%Y-%m-%d')
        moods = db.query(Mood).filter(Mood.couple_code == couple_code, Mood.date == today).all()
        return [{
            "id": m.id,
            "user_id": m.user_id,
            "mood": m.mood,
            "energy": m.energy,
            "stress": m.stress,
            "libido": m.libido
        } for m in moods]
    finally:
        db.close()

@api_router.get("/mood/stats/{couple_code}")
async def get_mood_stats(couple_code: str):
    db = SessionLocal()
    try:
        month_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        moods = db.query(Mood).filter(
            Mood.couple_code == couple_code,
            Mood.date >= month_ago
        ).all()
        
        if not moods:
            return {"average_mood": 0, "average_energy": 0, "average_libido": 0}
        
        return {
            "average_mood": round(sum(m.mood for m in moods) / len(moods), 1),
            "average_energy": round(sum(m.energy for m in moods) / len(moods), 1),
            "average_libido": round(sum(m.libido for m in moods) / len(moods), 1)
        }
    finally:
        db.close()

# ================= WISHLIST ENDPOINTS =================
@api_router.get("/wishlist/{couple_code}/{user_id}")
async def get_wishlist(couple_code: str, user_id: str):
    db = SessionLocal()
    try:
        all_wishes = db.query(Wishlist).filter(Wishlist.couple_code == couple_code).all()
        my_item_ids = [w.item_id for w in all_wishes if w.user_id == user_id]
        partner_item_ids = [w.item_id for w in all_wishes if w.user_id != user_id]
        
        unlocked = set(my_item_ids) & set(partner_item_ids)
        
        my_wishes = []
        for item_id in my_item_ids:
            item = next((i for i in WISHLIST_ITEMS if i["id"] == item_id), None)
            if item:
                my_wishes.append({
                    "id": str(uuid.uuid4()),
                    "item_id": item_id,
                    "title": item["title"],
                    "both_want": item_id in unlocked
                })
        
        unlocked_wishes = []
        for item_id in unlocked:
            item = next((i for i in WISHLIST_ITEMS if i["id"] == item_id), None)
            if item:
                unlocked_wishes.append({
                    "id": str(uuid.uuid4()),
                    "item_id": item_id,
                    "title": item["title"],
                    "both_want": True
                })
        
        return {
            "my_wishes": my_wishes,
            "unlocked_wishes": unlocked_wishes,
            "partner_secret_wishes_count": len(set(partner_item_ids) - set(my_item_ids))
        }
    finally:
        db.close()

@api_router.post("/wishlist/toggle")
async def toggle_wishlist(data: WishlistToggle):
    db = SessionLocal()
    try:
        existing = db.query(Wishlist).filter(
            Wishlist.couple_code == data.couple_code,
            Wishlist.user_id == data.user_id,
            Wishlist.item_id == data.item_id
        ).first()
        
        if existing:
            db.delete(existing)
            action = "removed"
        else:
            wish = Wishlist(
                id=str(uuid.uuid4()),
                couple_code=data.couple_code,
                user_id=data.user_id,
                item_id=data.item_id
            )
            db.add(wish)
            action = "added"
        
        db.commit()
        return {"action": action, "item_id": data.item_id}
    finally:
        db.close()

@api_router.get("/wishlist/items")
async def get_wishlist_items():
    return WISHLIST_ITEMS

# ================= SPECIAL DATES ENDPOINTS =================
@api_router.post("/special-dates")
async def create_special_date(data: SpecialDateCreate):
    db = SessionLocal()
    try:
        date = SpecialDate(
            id=str(uuid.uuid4()),
            couple_code=data.couple_code,
            title=data.title,
            date=data.date,
            time=data.time,
            notes=data.notes,
            created_by=data.created_by
        )
        db.add(date)
        db.commit()
        return {"id": date.id, "message": "Date created"}
    finally:
        db.close()

@api_router.get("/special-dates/{couple_code}")
async def get_special_dates(couple_code: str):
    db = SessionLocal()
    try:
        today = datetime.now().strftime('%Y-%m-%d')
        dates = db.query(SpecialDate).filter(
            SpecialDate.couple_code == couple_code,
            SpecialDate.date >= today
        ).order_by(SpecialDate.date).all()
        
        if not dates:
            return {"dates": [], "next_date": None, "days_until_next": None}
        
        next_date = dates[0]
        days_until = (datetime.strptime(next_date.date, '%Y-%m-%d') - datetime.now()).days
        
        return {
            "dates": [{
                "id": d.id,
                "title": d.title,
                "date": d.date,
                "time": d.time
            } for d in dates],
            "next_date": {
                "id": next_date.id,
                "title": next_date.title,
                "date": next_date.date
            },
            "days_until_next": max(0, days_until)
        }
    finally:
        db.close()

@api_router.delete("/special-dates/{date_id}")
async def delete_special_date(date_id: str):
    db = SessionLocal()
    try:
        date = db.query(SpecialDate).filter(SpecialDate.id == date_id).first()
        if date:
            db.delete(date)
            db.commit()
        return {"message": "Deleted"}
    finally:
        db.close()

# ================= LOVE NOTES ENDPOINTS =================
@api_router.post("/love-notes")
async def send_love_note(data: LoveNoteCreate):
    db = SessionLocal()
    try:
        note = LoveNote(
            id=str(uuid.uuid4()),
            couple_code=data.couple_code,
            sender_id=data.sender_id,
            sender_name=data.sender_name,
            message=data.message,
            category=data.category
        )
        db.add(note)
        db.commit()
        return {"id": note.id, "message": "Note sent"}
    finally:
        db.close()

@api_router.get("/love-notes/{couple_code}/{user_id}")
async def get_love_notes(couple_code: str, user_id: str):
    db = SessionLocal()
    try:
        notes = db.query(LoveNote).filter(
            LoveNote.couple_code == couple_code,
            LoveNote.sender_id != user_id
        ).order_by(LoveNote.created_at.desc()).limit(50).all()
        
        return [{
            "id": n.id,
            "sender_name": n.sender_name,
            "message": n.message,
            "category": n.category,
            "is_read": n.is_read,
            "created_at": str(n.created_at)
        } for n in notes]
    finally:
        db.close()

@api_router.get("/love-notes/unread/{couple_code}/{user_id}")
async def get_unread_count(couple_code: str, user_id: str):
    db = SessionLocal()
    try:
        count = db.query(LoveNote).filter(
            LoveNote.couple_code == couple_code,
            LoveNote.sender_id != user_id,
            LoveNote.is_read == False
        ).count()
        return {"count": count}
    finally:
        db.close()

@api_router.put("/love-notes/{note_id}/read")
async def mark_note_read(note_id: str):
    db = SessionLocal()
    try:
        note = db.query(LoveNote).filter(LoveNote.id == note_id).first()
        if note:
            note.is_read = True
            db.commit()
        return {"message": "Marked as read"}
    finally:
        db.close()

@api_router.get("/love-notes/templates")
async def get_note_templates():
    return [
        {"id": "1", "category": "romantic", "message": "Sei la cosa più bella che mi sia mai capitata 💕"},
        {"id": "2", "category": "romantic", "message": "Non vedo l'ora di rivederti ❤️"},
        {"id": "3", "category": "spicy", "message": "Stasera ho voglia di te... 🔥"},
        {"id": "4", "category": "spicy", "message": "Non riesco a smettere di pensare a ieri notte 😏"},
        {"id": "5", "category": "sweet", "message": "Grazie di esistere nella mia vita 🌹"},
        {"id": "6", "category": "sweet", "message": "Sei il mio pensiero fisso 💭"}
    ]

# ================= WEEKLY CHALLENGE ENDPOINTS =================
@api_router.get("/weekly-challenge/{couple_code}")
async def get_weekly_challenge(couple_code: str):
    db = SessionLocal()
    try:
        today = datetime.now()
        week_start = (today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')
        
        challenge = db.query(WeeklyChallenge).filter(
            WeeklyChallenge.couple_code == couple_code,
            WeeklyChallenge.week_start == week_start
        ).first()
        
        if not challenge:
            # Create new challenge for this week
            random_challenge = random.choice(WEEKLY_CHALLENGES)
            challenge = WeeklyChallenge(
                id=str(uuid.uuid4()),
                couple_code=couple_code,
                challenge_id=random_challenge["id"],
                week_start=week_start
            )
            db.add(challenge)
            db.commit()
        
        challenge_data = next((c for c in WEEKLY_CHALLENGES if c["id"] == challenge.challenge_id), WEEKLY_CHALLENGES[0])
        
        return {
            "challenge": challenge_data,
            "completed": challenge.completed,
            "week_start": challenge.week_start
        }
    finally:
        db.close()

@api_router.put("/weekly-challenge/{couple_code}/complete")
async def complete_weekly_challenge(couple_code: str):
    db = SessionLocal()
    try:
        today = datetime.now()
        week_start = (today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')
        
        challenge = db.query(WeeklyChallenge).filter(
            WeeklyChallenge.couple_code == couple_code,
            WeeklyChallenge.week_start == week_start
        ).first()
        
        if challenge:
            challenge.completed = True
            db.commit()
        
        return {"message": "Challenge completed!"}
    finally:
        db.close()

# ================= GAME ENDPOINTS =================
@api_router.get("/love-dice/roll")
async def roll_love_dice():
    action = random.choice(LOVE_DICE_ACTIONS)
    body_part = random.choice(LOVE_DICE_BODY_PARTS)
    duration = random.choice(LOVE_DICE_DURATION)
    scenario = random.choice(LOVE_DICE_SCENARIOS)
    
    include_scenario = random.random() > 0.5
    
    if include_scenario:
        full_text = f"{action} {body_part} {duration}. {scenario}!"
    else:
        full_text = f"{action} {body_part} {duration}"
    
    return {
        "action": action,
        "body_part": body_part,
        "duration": duration,
        "scenario": scenario if include_scenario else None,
        "full_text": full_text
    }

@api_router.get("/random-suggestion")
async def get_random_suggestion():
    suggestion_type = random.choice(["challenge", "position"])
    if suggestion_type == "challenge":
        return {"type": "challenge", "data": random.choice(SPICY_CHALLENGES)}
    else:
        return {"type": "position", "data": random.choice(POSITION_SUGGESTIONS)}

@api_router.get("/positions")
async def get_positions():
    return POSITION_SUGGESTIONS

@api_router.get("/challenges/suggestions")
async def get_challenge_suggestions():
    return random.sample(SPICY_CHALLENGES, min(3, len(SPICY_CHALLENGES)))

# ================= INCLUDE ROUTER =================
app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": "Couple Bliss API v1.0", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
