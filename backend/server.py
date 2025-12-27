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
app = FastAPI(
    title="Couple Bliss API",
    description="API per l'app di coppia - gestione ciclo, intimità, mood e molto altro",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

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

# New: Cycle History for tracking actual periods
class CycleHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    couple_code: Optional[str] = None
    period_start_date: str  # YYYY-MM-DD - when period actually started
    period_end_date: Optional[str] = None  # When period ended
    cycle_length: Optional[int] = None  # Days since last period (calculated)
    notes: Optional[str] = None
    was_early: Optional[bool] = None  # True if came early, False if late, None if on time
    days_difference: Optional[int] = None  # How many days early (-) or late (+)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CycleHistoryCreate(BaseModel):
    user_id: str
    period_start_date: str
    notes: Optional[str] = None

class IntimacyEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    couple_code: str
    date: str  # YYYY-MM-DD
    quality_rating: int  # 1-5
    positions_used: List[str] = []  # List of position IDs used
    duration_minutes: Optional[int] = None
    location: Optional[str] = None  # bedroom, shower, couch, etc.
    notes: Optional[str] = None
    created_by: str  # user_id
    created_at: datetime = Field(default_factory=datetime.utcnow)

class IntimacyEntryCreate(BaseModel):
    couple_code: str
    date: str
    quality_rating: int
    positions_used: List[str] = []
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
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

# New models for advanced features
class WishlistItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    couple_code: str
    user_id: str
    title: str
    description: str
    category: str  # "romantic", "spicy", "adventure", "fantasy"
    partner_wants_too: bool = False
    unlocked: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WishlistItemCreate(BaseModel):
    couple_code: str
    user_id: str
    title: str
    description: str
    category: str

class QuizAnswer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    couple_code: str
    user_id: str
    question_id: int
    answer_index: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class QuizAnswerCreate(BaseModel):
    couple_code: str
    user_id: str
    question_id: int
    answer_index: int

class SpecialDate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    couple_code: str
    title: str
    date: str  # YYYY-MM-DD
    time: Optional[str] = None  # HH:MM
    notes: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SpecialDateCreate(BaseModel):
    couple_code: str
    title: str
    date: str
    time: Optional[str] = None
    notes: Optional[str] = None
    created_by: str

class WeeklyChallenge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    couple_code: str
    week_number: int
    year: int
    challenge: dict
    completed: bool = False
    completed_at: Optional[datetime] = None

# ================= NEW MODELS =================

class MoodEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    couple_code: str
    date: str  # YYYY-MM-DD
    mood: int  # 1-5 (1=terrible, 5=amazing)
    energy: int  # 1-5
    stress: int  # 1-5 (1=none, 5=very stressed)
    libido: int  # 1-5
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MoodEntryCreate(BaseModel):
    user_id: str
    couple_code: str
    date: str
    mood: int
    energy: int
    stress: int
    libido: int
    notes: Optional[str] = None

class LoveNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    couple_code: str
    sender_id: str
    sender_name: str
    message: str
    category: str  # "sweet", "spicy", "funny", "romantic"
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LoveNoteCreate(BaseModel):
    couple_code: str
    sender_id: str
    sender_name: str
    message: str
    category: str

# ================= CHALLENGES & SUGGESTIONS DATABASE =================

# Love Dice data
LOVE_DICE_ACTIONS = [
    # Dolci
    "Bacia", "Accarezza", "Massaggia", "Sussurra a", "Abbraccia", 
    "Tocca dolcemente", "Sfiora", "Coccola", "Stringi",
    # Sensuali
    "Lecca", "Soffia su", "Mordicchia", "Strofina", "Esplora con le dita",
    "Succhia delicatamente", "Graffia leggermente", "Pizzica dolcemente",
    # Piccanti
    "Morsica", "Lecca lentamente", "Bacia appassionatamente", 
    "Accarezza sensualmente", "Premi il corpo contro", "Strusciati su",
    "Respira caldo su", "Passa la lingua su", "Bacia umido",
    # Audaci
    "Lecce a spirale", "Mordi e tira", "Succhia forte", 
    "Afferra con decisione", "Spingi contro"
]

LOVE_DICE_BODY_PARTS = [
    # Classici
    "collo", "labbra", "orecchio", "schiena", "pancia",
    # Sensuali  
    "interno coscia", "fianchi", "glutei", "petto", "capezzoli",
    # Intimi
    "inguine", "basso ventre", "osso del bacino", "incavo del collo",
    "dietro il ginocchio", "caviglia", "polso", "dita",
    # Piccanti
    "lato del seno", "zona lombare", "sotto l'ombelico", 
    "attaccatura dei capelli", "lobo dell'orecchio",
    # Audaci
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
    {
        "title": "Massaggio Sensuale",
        "description": "Scaldate olio di cocco tra le mani. Partite dalle spalle, scendete lungo la schiena con movimenti lenti e profondi. Lasciate che le mani esplorino ogni curva, avvicinandovi alle zone più sensibili senza mai toccarle direttamente. Aumentate la pressione quando sentite i muscoli rilassarsi...",
        "category": "romantic",
        "duration": "30 min",
        "intensity": 2
    },
    {
        "title": "Doccia Bollente",
        "description": "Entrate insieme sotto l'acqua calda. Insaponatevi a vicenda partendo dal collo, scendendo lentamente sul petto. Lasciate che il vapore vi avvolga mentre le vostre mani scivolano sul corpo bagnato dell'altro. Baciatevi sotto il getto d'acqua...",
        "category": "spicy",
        "duration": "20 min",
        "intensity": 3
    },
    {
        "title": "Bendati e Vulnerabili",
        "description": "Uno di voi viene bendato e disteso sul letto. L'altro ha il controllo totale: usa le dita, le labbra, piume, cubetti di ghiaccio. Alternare sensazioni calde e fredde, sfioramenti leggeri e tocchi più decisi. Chi è bendato deve solo... sentire.",
        "category": "spicy",
        "duration": "45 min",
        "intensity": 4
    },
    {
        "title": "Striptease Privato",
        "description": "Preparate la stanza: luci soffuse, musica sensuale. Uno dei due si spoglia lentamente per l'altro, mantenendo il contatto visivo. Ogni capo rimosso è un invito. Chi guarda non può toccare... finché non viene concesso il permesso.",
        "category": "spicy",
        "duration": "15 min",
        "intensity": 3
    },
    {
        "title": "Gioco del Ghiaccio",
        "description": "Tenete un cubetto di ghiaccio in bocca e tracciate linee sul corpo del partner: dal collo al petto, sulla pancia, lungo l'interno coscia. Alternate con baci caldi. Il contrasto tra freddo e caldo farà impazzire i sensi...",
        "category": "spicy",
        "duration": "20 min",
        "intensity": 4
    },
    {
        "title": "Lettera Erotica",
        "description": "Scrivete una lettera descrivendo nel dettaglio la vostra fantasia più segreta con il partner. Cosa vorreste fare, dove, come. Scambiatevi le lettere e leggetele ad alta voce, poi... realizzate almeno una delle fantasie.",
        "category": "adventure",
        "duration": "60 min",
        "intensity": 4
    },
    {
        "title": "Maestro e Allieva/o",
        "description": "Uno dei due è l'insegnante esperto, l'altro il principiante curioso. Il maestro guida ogni movimento, spiega cosa fare e come, corregge la 'tecnica'. Il gioco di potere e la guida vocale aumentano l'eccitazione...",
        "category": "adventure",
        "duration": "45 min",
        "intensity": 4
    },
    {
        "title": "Countdown dell'Attesa",
        "description": "Per tutto il giorno, mandatevi messaggi sempre più espliciti su cosa farete la sera. Descrizioni dettagliate, anticipazioni. Vietatevi di toccarvi fino a sera. L'attesa costruisce un desiderio esplosivo...",
        "category": "romantic",
        "duration": "tutto il giorno",
        "intensity": 3
    },
    {
        "title": "Esplorazione Sensoriale",
        "description": "Raccogliete oggetti con texture diverse: seta, pelliccia sintetica, piume, corda morbida. Ad occhi chiusi, il partner traccia percorsi sul vostro corpo con ogni materiale. Indovinate cosa sta usando mentre vi abbandonate alle sensazioni.",
        "category": "spicy",
        "duration": "30 min",
        "intensity": 3
    },
    {
        "title": "Svegliarsi Insieme",
        "description": "Svegliate il partner con baci leggeri sul collo, carezze sotto le coperte. Niente fretta, niente parole. Lasciate che il desiderio cresca lentamente nel dormiveglia, quando i sensi sono ancora intorpiditi e tutto è più intenso...",
        "category": "romantic",
        "duration": "30 min",
        "intensity": 2
    },
    {
        "title": "Solo Mani",
        "description": "Per tutta la sessione, usate solo le mani. Niente labbra, niente altro. Esplorate ogni centimetro del corpo del partner usando solo il tatto. Scoprirete zone erogene che non sapevate di avere...",
        "category": "spicy",
        "duration": "40 min",
        "intensity": 3
    },
    {
        "title": "Specchio delle Brame",
        "description": "Posizionatevi davanti a uno specchio. Guardatevi mentre vi amate. Osservate le espressioni del partner, i movimenti dei vostri corpi insieme. Guardarsi aumenta incredibilmente l'intensità...",
        "category": "adventure",
        "duration": "30 min",
        "intensity": 4
    },
]

POSITION_SUGGESTIONS = [
    {
        "id": "missionary",
        "name": "Missionario Classico",
        "emoji": "💑",
        "difficulty": "facile",
        "intimacy_level": 5,
        "pleasure_her": 3,
        "pleasure_him": 4,
        "description": "Lui sopra, lei sotto. Faccia a faccia, perfetto per baciarsi e guardarsi negli occhi.",
        "tips": "Lei può avvolgere le gambe intorno a lui per maggiore profondità. Cuscino sotto i fianchi di lei per angolazione migliore.",
        "benefits": ["Massimo contatto visivo", "Facilità di baci", "Controllo del ritmo", "Intimità emotiva"],
        "best_for": ["Romanticismo", "Prima volta", "Connessione profonda"],
        "variation": "Lei alza le gambe sulle spalle di lui per sensazioni più intense"
    },
    {
        "id": "cowgirl",
        "name": "Amazzone (Cowgirl)",
        "emoji": "🤠",
        "difficulty": "facile",
        "intimacy_level": 4,
        "pleasure_her": 5,
        "pleasure_him": 4,
        "description": "Lei sopra, seduta su di lui. Ha il controllo totale del ritmo e della profondità.",
        "tips": "Lei può appoggiarsi in avanti per stimolazione clitoridea, o indietro per sensazioni diverse. Lui può stimolarla con le mani.",
        "benefits": ["Lei controlla l'angolazione", "Stimolazione punto G", "Vista eccitante per lui", "Meno fatica per lui"],
        "best_for": ["Lei che vuole controllare", "Stimolazione clitoridea", "Sessioni lunghe"],
        "variation": "Amazzone inversa: lei girata di spalle, vista diversa e sensazioni nuove"
    },
    {
        "id": "doggy",
        "name": "Pecorina",
        "emoji": "🔥",
        "difficulty": "facile",
        "intimacy_level": 2,
        "pleasure_her": 4,
        "pleasure_him": 5,
        "description": "Lei a quattro zampe, lui dietro. Permette penetrazione profonda e stimolazione intensa.",
        "tips": "Lei può abbassare il petto sul letto per angolazione migliore. Lui può stimolare il clitoride con la mano.",
        "benefits": ["Penetrazione profonda", "Stimolazione punto G", "Sensazione di dominanza", "Accesso per stimolazione manuale"],
        "best_for": ["Passione intensa", "Varietà", "Stimolazione profonda"],
        "variation": "Lei completamente distesa sulla pancia, più intimo e meno faticoso"
    },
    {
        "id": "spoon",
        "name": "Cucchiaio",
        "emoji": "🥄",
        "difficulty": "facile",
        "intimacy_level": 5,
        "pleasure_her": 4,
        "pleasure_him": 4,
        "description": "Entrambi su un fianco, lui dietro di lei. Intimo, rilassante, perfetto per la mattina.",
        "tips": "Lei può alzare la gamba superiore per facilitare l'accesso. Lui può accarezzarla ovunque.",
        "benefits": ["Molto intimo", "Poco faticoso", "Baci sul collo", "Mani libere per carezze"],
        "best_for": ["Mattina pigra", "Gravidanza", "Intimità romantica", "Sessioni lente"],
        "variation": "Lei si gira parzialmente sulla schiena per baci sul viso"
    },
    {
        "id": "lotus",
        "name": "Loto (Yab-Yum)",
        "emoji": "🧘",
        "difficulty": "medio",
        "intimacy_level": 5,
        "pleasure_her": 4,
        "pleasure_him": 3,
        "description": "Lui seduto a gambe incrociate, lei in braccio a lui avvolta intorno. Massima connessione.",
        "tips": "Muovetevi insieme con un ritmo lento e ondulatorio. Respirate insieme. Guardarsi negli occhi intensifica tutto.",
        "benefits": ["Connessione tantrica", "Intimità massima", "Respiro sincronizzato", "Contatto totale del corpo"],
        "best_for": ["Connessione spirituale", "Intimità profonda", "Sesso tantrico"],
        "variation": "Lui può sdraiarsi leggermente indietro appoggiandosi sulle mani"
    },
    {
        "id": "69",
        "name": "69",
        "emoji": "🔄",
        "difficulty": "medio",
        "intimacy_level": 3,
        "pleasure_her": 5,
        "pleasure_him": 5,
        "description": "Piacere orale simultaneo. Uno sopra l'altro, testa ai piedi dell'altro.",
        "tips": "Comunicare cosa piace. Chi sta sopra controlla la pressione. Alternare chi sta sopra.",
        "benefits": ["Piacere simultaneo", "Dare e ricevere insieme", "Molto eccitante", "Ottimo preliminare"],
        "best_for": ["Preliminari intensi", "Piacere reciproco", "Varietà"],
        "variation": "Versione laterale: entrambi su un fianco, più comodo per sessioni lunghe"
    },
    {
        "id": "standing",
        "name": "In Piedi",
        "emoji": "🚿",
        "difficulty": "difficile",
        "intimacy_level": 2,
        "pleasure_her": 3,
        "pleasure_him": 4,
        "description": "Entrambi in piedi, lei appoggiata al muro o lui che la solleva. Spontaneo e passionale.",
        "tips": "Un dislivello di altezza aiuta. Lei può alzare una gamba. Un muro dà supporto.",
        "benefits": ["Molto spontaneo", "Passionale", "Perfetto per doccia", "Sensazione di urgenza"],
        "best_for": ["Momenti spontanei", "Doccia", "Quando non potete aspettare"],
        "variation": "Lei di spalle al muro, avvolta intorno a lui che la sostiene"
    },
    {
        "id": "reverse_cowgirl",
        "name": "Amazzone Inversa",
        "emoji": "🔄",
        "difficulty": "medio",
        "intimacy_level": 2,
        "pleasure_her": 4,
        "pleasure_him": 5,
        "description": "Come l'amazzone ma lei girata di spalle. Vista eccitante e sensazioni diverse.",
        "tips": "Lei può appoggiarsi sulle ginocchia di lui. Lui ha le mani libere per accarezzare schiena e glutei.",
        "benefits": ["Vista eccitante per lui", "Angolazione diversa", "Lei mantiene il controllo", "Sensazioni nuove"],
        "best_for": ["Varietà visiva", "Sperimentazione", "Stimolazione diversa"],
        "variation": "Lei si appoggia in avanti tra le gambe di lui"
    },
    {
        "id": "seated",
        "name": "Sedia del Piacere",
        "emoji": "🪑",
        "difficulty": "medio",
        "intimacy_level": 3,
        "pleasure_her": 4,
        "pleasure_him": 4,
        "description": "Lui seduto su una sedia, lei sopra di lui. Può essere ovunque ci sia una sedia.",
        "tips": "Sedia senza braccioli funziona meglio. Lei può usare i piedi per terra come leva.",
        "benefits": ["Versatile", "Si può fare ovunque", "Buona penetrazione", "Mani libere"],
        "best_for": ["Fuori dalla camera", "Spontaneità", "Varietà di location"],
        "variation": "Lei di spalle per sensazioni diverse"
    },
    {
        "id": "prone",
        "name": "Distesa Prona",
        "emoji": "😴",
        "difficulty": "facile",
        "intimacy_level": 3,
        "pleasure_her": 5,
        "pleasure_him": 4,
        "description": "Lei distesa a pancia in giù, gambe unite. Lui sopra o dietro. Molto stretta e intensa.",
        "tips": "Un cuscino sotto i fianchi di lei aiuta. Lui può sussurrarle all'orecchio.",
        "benefits": ["Sensazione molto stretta", "Stimolazione intensa", "Lui può baciarle il collo", "Rilassante per lei"],
        "best_for": ["Sensazioni intense", "Stimolazione clitoridea indiretta", "Intimità"],
        "variation": "Lei con le gambe leggermente aperte per accesso più facile"
    },
    {
        "id": "legs_up",
        "name": "Gambe in Alto",
        "emoji": "🦵",
        "difficulty": "medio",
        "intimacy_level": 4,
        "pleasure_her": 5,
        "pleasure_him": 4,
        "description": "Missionario con le gambe di lei sulle spalle di lui. Penetrazione molto profonda.",
        "tips": "Iniziare lentamente, la penetrazione è molto profonda. Cuscino sotto i fianchi aiuta.",
        "benefits": ["Penetrazione profondissima", "Stimolazione punto G", "Contatto visivo", "Molto intenso"],
        "best_for": ["Stimolazione profonda", "Intensità", "Orgasmo vaginale"],
        "variation": "Una gamba sola sulla spalla per angolazione asimmetrica"
    },
    {
        "id": "face_to_face",
        "name": "Faccia a Faccia Seduti",
        "emoji": "👫",
        "difficulty": "medio",
        "intimacy_level": 5,
        "pleasure_her": 4,
        "pleasure_him": 3,
        "description": "Entrambi seduti uno di fronte all'altro, lei avvolta intorno a lui. Massimo contatto.",
        "tips": "Muoversi insieme a ritmo lento. Respirare insieme. Mantere il contatto visivo.",
        "benefits": ["Intimità massima", "Contatto totale", "Molto romantico", "Connessione profonda"],
        "best_for": ["Romanticismo", "Connessione emotiva", "Sesso lento e intenso"],
        "variation": "Su un divano o bordo del letto per più supporto"
    },
]

COMPATIBILITY_QUESTIONS = [
    {"id": 0, "question": "Qual è il momento ideale per l'intimità?", "options": ["Mattina", "Pomeriggio", "Sera", "Notte fonda"]},
    {"id": 1, "question": "Quanto è importante il romanticismo prima?", "options": ["Fondamentale", "Piacevole", "Non necessario", "Dipende"]},
    {"id": 2, "question": "Preferisci sessioni lunghe o intense?", "options": ["Lunghe e slow", "Intense e veloci", "Un mix", "Dipende dall'umore"]},
    {"id": 3, "question": "Quanto sei aperto a sperimentare?", "options": ["Molto aperto", "Abbastanza", "Poco", "Preferisco il classico"]},
    {"id": 4, "question": "Cosa ti eccita di più?", "options": ["Parole dolci", "Contatto fisico", "Atmosfera", "Spontaneità"]},
    {"id": 5, "question": "Quanto spesso vorresti stare insieme?", "options": ["Ogni giorno", "3-4 volte a settimana", "1-2 volte a settimana", "Quando capita"]},
    {"id": 6, "question": "Preferisci iniziare tu o che inizi il partner?", "options": ["Io sempre", "Il partner", "A turno", "Chi ha voglia"]},
    {"id": 7, "question": "Luogo preferito?", "options": ["Camera da letto", "Divano", "Doccia/Bagno", "Ovunque!"]},
    {"id": 8, "question": "Musica durante?", "options": ["Sempre", "A volte", "Mai", "Solo playlist speciale"]},
    {"id": 9, "question": "Quanto è importante la comunicazione durante?", "options": ["Molto, parliamo sempre", "Abbastanza", "Poco, preferiamo il silenzio", "Solo feedback base"]},
    {"id": 10, "question": "Dopo, cosa preferisci?", "options": ["Coccole lunghe", "Dormire subito", "Chiacchierare", "Snack time!"]},
    {"id": 11, "question": "Fantasy: cosa ti intriga di più?", "options": ["Roleplay", "Nuovi posti", "Toys", "Niente di particolare"]},
]

WEEKLY_CHALLENGES_POOL = [
    {"title": "Settimana del Massaggio", "description": "Ogni sera, 10 minuti di massaggio a turno prima di dormire", "difficulty": "facile"},
    {"title": "Complimenti Quotidiani", "description": "Ogni giorno, ditevi 3 cose che amate dell'altro", "difficulty": "facile"},
    {"title": "No Phone Zone", "description": "Almeno 2 sere questa settimana: telefoni spenti dopo cena", "difficulty": "medio"},
    {"title": "Sorpresa Romantica", "description": "Organizza una sorpresa per il partner entro la settimana", "difficulty": "medio"},
    {"title": "Nuova Posizione", "description": "Provate almeno una posizione nuova questa settimana", "difficulty": "spicy"},
    {"title": "Appuntamento Settimanale", "description": "Pianificate e fate un vero appuntamento, come ai primi tempi", "difficulty": "facile"},
    {"title": "Gioco di Ruolo", "description": "Inventate insieme un piccolo scenario e interpretatelo", "difficulty": "spicy"},
    {"title": "Settimana Spontanea", "description": "Almeno 2 momenti completamente spontanei, non pianificati", "difficulty": "medio"},
    {"title": "Esplorazione Sensoriale", "description": "Usate bende, piume, ghiaccio... esplorate i sensi", "difficulty": "spicy"},
    {"title": "Lettere d'Amore", "description": "Scrivetevi una lettera (anche piccante) e scambiatevela a fine settimana", "difficulty": "romantico"},
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

# ================= CYCLE HISTORY (Track actual periods) =================

@api_router.post("/cycle/start-period")
async def start_new_period(input: CycleHistoryCreate):
    """Mark the start of a new period - updates predictions based on actual data"""
    user = await db.users.find_one({"id": input.user_id})
    couple_code = user.get("couple_code") if user else None
    
    # Get current cycle settings
    current_cycle = await db.cycle_data.find_one({"user_id": input.user_id})
    if not current_cycle:
        # If no cycle data, try couple_code
        if couple_code:
            current_cycle = await db.cycle_data.find_one({"couple_code": couple_code})
    
    # Get last period from history
    last_history = await db.cycle_history.find_one(
        {"user_id": input.user_id},
        sort=[("period_start_date", -1)]
    )
    
    # Calculate actual cycle length
    actual_cycle_length = None
    was_early = None
    days_difference = None
    
    if last_history:
        last_period_date = datetime.strptime(last_history["period_start_date"], "%Y-%m-%d")
        new_period_date = datetime.strptime(input.period_start_date, "%Y-%m-%d")
        actual_cycle_length = (new_period_date - last_period_date).days
        
        # Compare with expected
        expected_cycle_length = current_cycle["cycle_length"] if current_cycle else 28
        days_difference = actual_cycle_length - expected_cycle_length
        was_early = days_difference < 0
    
    # Create history entry
    history_entry = CycleHistory(
        user_id=input.user_id,
        couple_code=couple_code,
        period_start_date=input.period_start_date,
        cycle_length=actual_cycle_length,
        notes=input.notes,
        was_early=was_early,
        days_difference=days_difference
    )
    await db.cycle_history.insert_one(history_entry.dict())
    
    # Update cycle data with new last_period_date and optionally adjust cycle length
    if current_cycle:
        # Calculate average cycle length from history
        all_history = await db.cycle_history.find(
            {"user_id": input.user_id, "cycle_length": {"$ne": None}}
        ).to_list(12)  # Last 12 cycles
        
        if len(all_history) >= 3:
            avg_cycle_length = sum(h["cycle_length"] for h in all_history) / len(all_history)
            avg_cycle_length = round(avg_cycle_length)
        else:
            avg_cycle_length = current_cycle["cycle_length"]
        
        # Update cycle data
        await db.cycle_data.update_one(
            {"id": current_cycle["id"]},
            {"$set": {
                "last_period_date": input.period_start_date,
                "cycle_length": avg_cycle_length,
                "updated_at": datetime.utcnow()
            }}
        )
    else:
        # Create new cycle data
        new_cycle = CycleData(
            user_id=input.user_id,
            couple_code=couple_code,
            last_period_date=input.period_start_date,
            cycle_length=28,
            period_length=5
        )
        await db.cycle_data.insert_one(new_cycle.dict())
    
    return {
        "message": "Nuovo ciclo registrato!",
        "actual_cycle_length": actual_cycle_length,
        "was_early": was_early,
        "days_difference": abs(days_difference) if days_difference else None,
        "history_id": history_entry.id
    }

@api_router.get("/cycle/history/{user_id}")
async def get_cycle_history(user_id: str):
    """Get cycle history for a user"""
    # Get user's history
    history = await db.cycle_history.find({"user_id": user_id}).sort("period_start_date", -1).to_list(24)
    
    if not history:
        # Try partner's history via couple_code
        user = await db.users.find_one({"id": user_id})
        if user and user.get("couple_code"):
            history = await db.cycle_history.find(
                {"couple_code": user["couple_code"]}
            ).sort("period_start_date", -1).to_list(24)
    
    # Calculate statistics
    cycles_with_length = [h for h in history if h.get("cycle_length")]
    
    stats = {
        "total_tracked": len(history),
        "average_cycle_length": None,
        "shortest_cycle": None,
        "longest_cycle": None,
        "regularity": "unknown"
    }
    
    if cycles_with_length:
        lengths = [h["cycle_length"] for h in cycles_with_length]
        stats["average_cycle_length"] = round(sum(lengths) / len(lengths), 1)
        stats["shortest_cycle"] = min(lengths)
        stats["longest_cycle"] = max(lengths)
        
        # Calculate regularity (standard deviation)
        if len(lengths) >= 3:
            mean = sum(lengths) / len(lengths)
            variance = sum((x - mean) ** 2 for x in lengths) / len(lengths)
            std_dev = variance ** 0.5
            
            if std_dev <= 2:
                stats["regularity"] = "molto regolare"
            elif std_dev <= 4:
                stats["regularity"] = "regolare"
            elif std_dev <= 7:
                stats["regularity"] = "variabile"
            else:
                stats["regularity"] = "irregolare"
    
    return {
        "history": [CycleHistory(**h) for h in history],
        "stats": stats
    }

@api_router.put("/cycle/end-period/{history_id}")
async def end_period(history_id: str, end_date: str):
    """Mark the end of a period"""
    result = await db.cycle_history.update_one(
        {"id": history_id},
        {"$set": {"period_end_date": end_date}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="History entry not found")
    return {"message": "Fine ciclo registrata"}

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
    
    # Badges system - return IDs that match frontend
    badges = []
    
    # First time badge - if at least 1 entry
    if len(entries) >= 1:
        badges.append("first_time")
    
    # Week streak - 7+ days consecutive (simplified: check if streak >= 1)
    if streak >= 1:
        badges.append("week_streak")
    
    # Quality king - average quality > 4
    if avg_quality > 4:
        badges.append("quality_king")
    
    # Explorer - 5+ different locations (check unique locations)
    unique_locations = set(e.get("location") for e in entries if e.get("location"))
    if len(unique_locations) >= 5:
        badges.append("explorer")
    
    # Marathon - any session 60+ minutes
    has_marathon = any((e.get("duration_minutes") or 0) >= 60 for e in entries)
    if has_marathon:
        badges.append("marathon")
    
    # Morning person - any entry with morning time
    # For simplicity, check if entries exist in early dates (we don't have time data)
    if len(entries) >= 5:  # Simplified: unlock after 5 entries
        badges.append("morning")
    
    # Night owl - simplified: unlock after 8 entries
    if len(entries) >= 8:
        badges.append("night_owl")
    
    # Perfect month - 20+ in a month
    if monthly_count >= 20:
        badges.append("perfect_month")
    
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

# ================= LOVE DICE =================
@api_router.get("/love-dice/roll")
async def roll_love_dice():
    action = random.choice(LOVE_DICE_ACTIONS)
    body_part = random.choice(LOVE_DICE_BODY_PARTS)
    duration = random.choice(LOVE_DICE_DURATION)
    scenario = random.choice(LOVE_DICE_SCENARIOS)
    
    # 50% chance to include scenario
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

# ================= WISHLIST =================
@api_router.post("/wishlist", response_model=WishlistItem)
async def add_wishlist_item(input: WishlistItemCreate):
    # Check if partner already has this wish
    user = await db.users.find_one({"id": input.user_id})
    if user and user.get("partner_id"):
        partner_wish = await db.wishlist.find_one({
            "couple_code": input.couple_code,
            "user_id": user["partner_id"],
            "item_id": input.item_id
        })
        if partner_wish:
            # Both want it! Unlock both
            await db.wishlist.update_one(
                {"id": partner_wish["id"]},
                {"$set": {"both_want": True}}
            )
            item = WishlistItem(**input.dict(), both_want=True)
        else:
            item = WishlistItem(**input.dict())
    else:
        item = WishlistItem(**input.dict())
    
    await db.wishlist.insert_one(item.dict())
    return item

@api_router.post("/wishlist/toggle")
async def toggle_wishlist_item(couple_code: str, user_id: str, item_id: str):
    """Toggle a wishlist item - add if not exists, remove if exists"""
    # Check if user already has this wish
    existing = await db.wishlist.find_one({
        "couple_code": couple_code,
        "user_id": user_id,
        "item_id": item_id
    })
    
    if existing:
        # Remove it
        await db.wishlist.delete_one({"id": existing["id"]})
        # Also unset both_want on partner's wish if exists
        user = await db.users.find_one({"id": user_id})
        if user and user.get("partner_id"):
            await db.wishlist.update_one(
                {"couple_code": couple_code, "user_id": user["partner_id"], "item_id": item_id},
                {"$set": {"both_want": False}}
            )
        return {"action": "removed", "unlocked": False}
    else:
        # Add it
        user = await db.users.find_one({"id": user_id})
        both_want = False
        
        if user and user.get("partner_id"):
            partner_wish = await db.wishlist.find_one({
                "couple_code": couple_code,
                "user_id": user["partner_id"],
                "item_id": item_id
            })
            if partner_wish:
                both_want = True
                # Update partner's wish too
                await db.wishlist.update_one(
                    {"id": partner_wish["id"]},
                    {"$set": {"both_want": True}}
                )
        
        new_item = {
            "id": str(uuid.uuid4()),
            "couple_code": couple_code,
            "user_id": user_id,
            "item_id": item_id,
            "title": item_id,  # Will be shown from frontend
            "both_want": both_want,
            "created_at": datetime.utcnow()
        }
        await db.wishlist.insert_one(new_item)
        
        return {"action": "added", "unlocked": both_want}

@api_router.get("/wishlist/{couple_code}/{user_id}")
async def get_wishlist(couple_code: str, user_id: str):
    # Get user's own wishes
    my_wishes_cursor = await db.wishlist.find({"couple_code": couple_code, "user_id": user_id}).to_list(100)
    my_wishes = []
    for w in my_wishes_cursor:
        my_wishes.append({
            "id": w.get("id"),
            "item_id": w.get("item_id"),
            "title": w.get("title"),
            "both_want": w.get("both_want", False)
        })
    
    # Get partner's wishes count (without revealing details)
    user = await db.users.find_one({"id": user_id})
    partner_wishes_count = 0
    unlocked_items = []
    
    if user and user.get("partner_id"):
        partner_wishes = await db.wishlist.find({
            "couple_code": couple_code, 
            "user_id": user["partner_id"],
            "both_want": {"$ne": True}
        }).to_list(100)
        partner_wishes_count = len(partner_wishes)
        
        # Get unlocked (both want)
        unlocked = await db.wishlist.find({
            "couple_code": couple_code,
            "both_want": True
        }).to_list(100)
        # Deduplicate by item_id
        seen = set()
        for w in unlocked:
            if w.get("item_id") not in seen:
                unlocked_items.append({
                    "id": w.get("id"),
                    "item_id": w.get("item_id"),
                    "title": w.get("title"),
                    "both_want": True
                })
                seen.add(w.get("item_id"))
    
    return {
        "my_wishes": my_wishes,
        "unlocked_wishes": unlocked_items,
        "partner_secret_wishes_count": partner_wishes_count
    }

@api_router.delete("/wishlist/{item_id}")
async def delete_wishlist_item(item_id: str):
    await db.wishlist.delete_one({"id": item_id})
    return {"message": "Deleted"}

# ================= QUIZ COMPARATIVO =================
@api_router.post("/quiz/answer")
async def save_quiz_answer(input: QuizAnswerCreate):
    # Remove existing answer for this question from this user
    await db.quiz_answers.delete_many({
        "couple_code": input.couple_code,
        "user_id": input.user_id,
        "question_id": input.question_id
    })
    
    answer = QuizAnswer(**input.dict())
    await db.quiz_answers.insert_one(answer.dict())
    return answer

@api_router.get("/quiz/results/{couple_code}")
async def get_quiz_results(couple_code: str):
    answers = await db.quiz_answers.find({"couple_code": couple_code}).to_list(200)
    
    # Get both users in couple
    users = await db.users.find({"couple_code": couple_code}).to_list(2)
    if len(users) < 2:
        return {
            "complete": False,
            "message": "Entrambi i partner devono completare il quiz",
            "compatibility_score": 0,
            "comparisons": []
        }
    
    user1_id = users[0]["id"]
    user2_id = users[1]["id"]
    user1_name = users[0]["name"]
    user2_name = users[1]["name"]
    
    user1_answers = {a["question_id"]: a["answer_index"] for a in answers if a["user_id"] == user1_id}
    user2_answers = {a["question_id"]: a["answer_index"] for a in answers if a["user_id"] == user2_id}
    
    # Check if both completed all questions
    total_questions = len(COMPATIBILITY_QUESTIONS)
    if len(user1_answers) < total_questions or len(user2_answers) < total_questions:
        return {
            "complete": False,
            "message": f"Quiz incompleto. {user1_name}: {len(user1_answers)}/{total_questions}, {user2_name}: {len(user2_answers)}/{total_questions}",
            "compatibility_score": 0,
            "comparisons": []
        }
    
    # Calculate compatibility
    matches = 0
    comparisons = []
    
    for q in COMPATIBILITY_QUESTIONS:
        q_id = q["id"]
        u1_answer = user1_answers.get(q_id, -1)
        u2_answer = user2_answers.get(q_id, -1)
        
        is_match = u1_answer == u2_answer
        if is_match:
            matches += 1
        
        comparisons.append({
            "question": q["question"],
            "options": q["options"],
            "user1_answer": q["options"][u1_answer] if 0 <= u1_answer < len(q["options"]) else "?",
            "user2_answer": q["options"][u2_answer] if 0 <= u2_answer < len(q["options"]) else "?",
            "user1_name": user1_name,
            "user2_name": user2_name,
            "match": is_match
        })
    
    compatibility_score = int((matches / total_questions) * 100)
    
    # Fun interpretation
    if compatibility_score >= 80:
        interpretation = "Anime gemelle! Siete incredibilmente in sintonia"
    elif compatibility_score >= 60:
        interpretation = "Ottima intesa! Le differenze vi rendono interessanti"
    elif compatibility_score >= 40:
        interpretation = "Buona base! C'è spazio per scoprirvi ancora"
    else:
        interpretation = "Opposti che si attraggono! Esplorate le differenze"
    
    return {
        "complete": True,
        "compatibility_score": compatibility_score,
        "matches": matches,
        "total_questions": total_questions,
        "interpretation": interpretation,
        "comparisons": comparisons
    }

# ================= SPECIAL DATES / COUNTDOWN =================
@api_router.post("/special-dates", response_model=SpecialDate)
async def create_special_date(input: SpecialDateCreate):
    date_obj = SpecialDate(**input.dict())
    await db.special_dates.insert_one(date_obj.dict())
    return date_obj

@api_router.get("/special-dates/{couple_code}")
async def get_special_dates(couple_code: str):
    dates = await db.special_dates.find({"couple_code": couple_code}).to_list(50)
    
    # Sort by date
    dates.sort(key=lambda x: x["date"])
    
    # Find next upcoming
    from datetime import timedelta
    today = datetime.utcnow().strftime("%Y-%m-%d")
    upcoming = [d for d in dates if d["date"] >= today]
    past = [d for d in dates if d["date"] < today]
    
    # Calculate countdown for next date
    next_date = None
    days_until = None
    if upcoming:
        next_date = upcoming[0]
        next_date_obj = datetime.strptime(next_date["date"], "%Y-%m-%d")
        days_until = (next_date_obj - datetime.utcnow()).days + 1
    
    return {
        "upcoming": [SpecialDate(**d) for d in upcoming],
        "past": [SpecialDate(**d) for d in past[-5:]],  # Last 5
        "next_date": SpecialDate(**next_date) if next_date else None,
        "days_until_next": days_until
    }

@api_router.delete("/special-dates/{date_id}")
async def delete_special_date(date_id: str):
    await db.special_dates.delete_one({"id": date_id})
    return {"message": "Deleted"}

# ================= WEEKLY CHALLENGE =================
@api_router.get("/weekly-challenge/{couple_code}")
async def get_weekly_challenge(couple_code: str):
    now = datetime.utcnow()
    week_number = now.isocalendar()[1]
    year = now.year
    
    # Check if challenge exists for this week
    existing = await db.weekly_challenges.find_one({
        "couple_code": couple_code,
        "week_number": week_number,
        "year": year
    })
    
    if existing:
        return WeeklyChallenge(**existing)
    
    # Generate new weekly challenge
    challenge = random.choice(WEEKLY_CHALLENGES_POOL)
    weekly = WeeklyChallenge(
        couple_code=couple_code,
        week_number=week_number,
        year=year,
        challenge=challenge
    )
    await db.weekly_challenges.insert_one(weekly.dict())
    
    return weekly

@api_router.put("/weekly-challenge/{couple_code}/complete")
async def complete_weekly_challenge(couple_code: str):
    now = datetime.utcnow()
    week_number = now.isocalendar()[1]
    year = now.year
    
    result = await db.weekly_challenges.update_one(
        {"couple_code": couple_code, "week_number": week_number, "year": year},
        {"$set": {"completed": True, "completed_at": now}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    return {"message": "Sfida settimanale completata!"}

# ================= FERTILITY PREDICTIONS FOR HOME =================
@api_router.get("/fertility/predictions/{user_id}")
async def get_fertility_predictions(user_id: str):
    """Get fertility predictions for display on home screen"""
    # Get cycle data
    cycle = await db.cycle_data.find_one({"user_id": user_id})
    
    if not cycle:
        # Try partner's cycle
        user = await db.users.find_one({"id": user_id})
        if user and user.get("couple_code"):
            cycle = await db.cycle_data.find_one({"couple_code": user["couple_code"]})
    
    if not cycle:
        return {
            "has_data": False,
            "today_status": None,
            "next_period": None,
            "next_fertile_start": None,
            "next_ovulation": None,
            "fertility_tip": "Configura il ciclo per vedere le previsioni"
        }
    
    from datetime import timedelta
    
    last_period = datetime.strptime(cycle["last_period_date"], "%Y-%m-%d")
    cycle_length = cycle["cycle_length"]
    period_length = cycle["period_length"]
    today = datetime.utcnow().date()
    
    # Calculate current and next cycles
    current_cycle_start = last_period
    while (current_cycle_start + timedelta(days=cycle_length)).date() <= today:
        current_cycle_start += timedelta(days=cycle_length)
    
    next_period = current_cycle_start + timedelta(days=cycle_length)
    ovulation_date = current_cycle_start + timedelta(days=cycle_length - 14)
    fertile_start = ovulation_date - timedelta(days=5)
    fertile_end = ovulation_date + timedelta(days=1)
    period_end = current_cycle_start + timedelta(days=period_length - 1)
    
    # Determine today's status
    today_dt = datetime.combine(today, datetime.min.time())
    
    if current_cycle_start.date() <= today <= period_end.date():
        status = "period"
        status_text = "Ciclo mestruale"
        status_color = "#ff4757"
        tip = "Riposo e cura di te. Momenti di intimità possono aiutare con i crampi!"
    elif fertile_start.date() <= today <= fertile_end.date():
        if today == ovulation_date.date():
            status = "ovulation"
            status_text = "Ovulazione - Massima fertilità!"
            status_color = "#ffa502"
            tip = "Oggi è il giorno ideale per concepire! Massima fertilità."
        else:
            status = "fertile"
            status_text = "Finestra fertile"
            status_color = "#2ed573"
            tip = "Alta probabilità di concepimento. Giorni ideali per provare!"
    else:
        status = "safe"
        status_text = "Giorni sicuri"
        status_color = "#1e90ff"
        tip = "Bassa probabilità di concepimento. Momento ideale per intimità senza pensieri!"
    
    days_to_ovulation = (ovulation_date.date() - today).days
    days_to_period = (next_period.date() - today).days
    days_to_fertile = (fertile_start.date() - today).days
    
    return {
        "has_data": True,
        "today_status": status,
        "today_status_text": status_text,
        "today_status_color": status_color,
        "fertility_tip": tip,
        "next_period": next_period.strftime("%Y-%m-%d"),
        "days_to_period": max(0, days_to_period),
        "next_ovulation": ovulation_date.strftime("%Y-%m-%d"),
        "days_to_ovulation": days_to_ovulation,
        "next_fertile_start": fertile_start.strftime("%Y-%m-%d") if days_to_fertile > 0 else None,
        "days_to_fertile": max(0, days_to_fertile) if days_to_fertile > 0 else 0,
        "is_trying_to_conceive_day": status in ["fertile", "ovulation"]
    }

# ================= MOOD TRACKER =================

@api_router.post("/mood", response_model=MoodEntry)
async def log_mood(input: MoodEntryCreate):
    # Remove existing mood for this date
    await db.mood_entries.delete_many({
        "user_id": input.user_id,
        "date": input.date
    })
    
    entry = MoodEntry(**input.dict())
    await db.mood_entries.insert_one(entry.dict())
    return entry

@api_router.get("/mood/{couple_code}")
async def get_mood_entries(couple_code: str, days: int = 30):
    """Get mood entries for couple in last N days"""
    from datetime import timedelta
    cutoff_date = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
    
    entries = await db.mood_entries.find({
        "couple_code": couple_code,
        "date": {"$gte": cutoff_date}
    }).sort("date", -1).to_list(100)
    
    return [MoodEntry(**e) for e in entries]

@api_router.get("/mood/today/{couple_code}")
async def get_today_mood(couple_code: str):
    """Get today's mood for both partners"""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    entries = await db.mood_entries.find({
        "couple_code": couple_code,
        "date": today
    }).to_list(2)
    
    return [MoodEntry(**e) for e in entries]

@api_router.get("/mood/stats/{couple_code}")
async def get_mood_stats(couple_code: str):
    """Get mood statistics for couple"""
    from datetime import timedelta
    
    # Last 30 days
    cutoff_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
    entries = await db.mood_entries.find({
        "couple_code": couple_code,
        "date": {"$gte": cutoff_date}
    }).to_list(200)
    
    if not entries:
        return {
            "avg_mood": 0,
            "avg_energy": 0,
            "avg_stress": 0,
            "avg_libido": 0,
            "sync_score": 0,
            "best_day": None,
            "entries_count": 0
        }
    
    # Calculate averages
    avg_mood = sum(e["mood"] for e in entries) / len(entries)
    avg_energy = sum(e["energy"] for e in entries) / len(entries)
    avg_stress = sum(e["stress"] for e in entries) / len(entries)
    avg_libido = sum(e["libido"] for e in entries) / len(entries)
    
    # Calculate sync score (how similar partners' moods are)
    sync_scores = []
    dates_with_both = {}
    for e in entries:
        date = e["date"]
        if date not in dates_with_both:
            dates_with_both[date] = []
        dates_with_both[date].append(e)
    
    for date, day_entries in dates_with_both.items():
        if len(day_entries) == 2:
            diff = abs(day_entries[0]["mood"] - day_entries[1]["mood"])
            sync_scores.append(1 - (diff / 4))  # 0-1 score
    
    sync_score = sum(sync_scores) / len(sync_scores) * 100 if sync_scores else 0
    
    # Find best day
    from collections import Counter
    day_counts = Counter()
    day_moods = {}
    for e in entries:
        day = datetime.strptime(e["date"], "%Y-%m-%d").strftime("%A")
        day_counts[day] += 1
        if day not in day_moods:
            day_moods[day] = []
        day_moods[day].append(e["mood"])
    
    best_day = None
    best_avg = 0
    day_names_it = {
        "Monday": "Lunedì", "Tuesday": "Martedì", "Wednesday": "Mercoledì",
        "Thursday": "Giovedì", "Friday": "Venerdì", "Saturday": "Sabato", "Sunday": "Domenica"
    }
    for day, moods in day_moods.items():
        avg = sum(moods) / len(moods)
        if avg > best_avg:
            best_avg = avg
            best_day = day_names_it.get(day, day)
    
    return {
        "avg_mood": round(avg_mood, 1),
        "avg_energy": round(avg_energy, 1),
        "avg_stress": round(avg_stress, 1),
        "avg_libido": round(avg_libido, 1),
        "sync_score": round(sync_score, 0),
        "best_day": best_day,
        "entries_count": len(entries)
    }

# ================= LOVE NOTES =================

LOVE_NOTE_TEMPLATES = {
    "sweet": [
        "Sei la cosa più bella della mia giornata 💕",
        "Non vedo l'ora di tornare a casa da te",
        "Pensavo a te... come sempre",
        "Mi manchi già, anche se ci siamo visti stamattina",
        "Sei il mio pensiero preferito",
    ],
    "spicy": [
        "Non riesco a smettere di pensare a ieri notte... 🔥",
        "Ho delle idee per stasera...",
        "Mi fai impazzire, lo sai?",
        "Conto i minuti fino a stasera",
        "Ho bisogno di te. Adesso.",
    ],
    "funny": [
        "Se fossi un vegetale, saresti un carote-ino 🥕",
        "Ti amo più della pizza. E sai quanto amo la pizza.",
        "Sei la mia persona preferita da infastidire",
        "Grazie per sopportare la mia follia",
        "Reminder: sono figo/a e tu sei fortunato/a",
    ],
    "romantic": [
        "In un universo infinito, ho trovato te ✨",
        "Ogni giorno con te è un regalo",
        "Sei il mio per sempre",
        "Mi hai rubato il cuore e non lo rivoglio indietro",
        "Con te, tutto ha senso",
    ]
}

@api_router.post("/love-notes", response_model=LoveNote)
async def send_love_note(input: LoveNoteCreate):
    note = LoveNote(**input.dict())
    await db.love_notes.insert_one(note.dict())
    return note

@api_router.get("/love-notes/{couple_code}/{user_id}")
async def get_love_notes(couple_code: str, user_id: str):
    """Get notes received by user (not sent by them)"""
    notes = await db.love_notes.find({
        "couple_code": couple_code,
        "sender_id": {"$ne": user_id}
    }).sort("created_at", -1).to_list(50)
    
    return [LoveNote(**n) for n in notes]

@api_router.get("/love-notes/unread/{couple_code}/{user_id}")
async def get_unread_notes(couple_code: str, user_id: str):
    """Get unread notes for user"""
    notes = await db.love_notes.find({
        "couple_code": couple_code,
        "sender_id": {"$ne": user_id},
        "is_read": False
    }).sort("created_at", -1).to_list(50)
    
    return {"count": len(notes), "notes": [LoveNote(**n) for n in notes]}

@api_router.put("/love-notes/{note_id}/read")
async def mark_note_read(note_id: str):
    await db.love_notes.update_one(
        {"id": note_id},
        {"$set": {"is_read": True}}
    )
    return {"message": "Note marked as read"}

@api_router.get("/love-notes/templates")
async def get_note_templates():
    return LOVE_NOTE_TEMPLATES

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
