# =============================================================================
# CODICE DA AGGIUNGERE AL TUO SERVER app.py
# FUNZIONALITÀ: CONSIGLI INTELLIGENTI CON AI + CALCOLO CALORIE AVANZATO
# =============================================================================

# ============== 1. AGGIUNGI QUESTO IMPORT IN CIMA AL FILE (se non presente) ==============
# Questi import vanno aggiunti vicino agli altri import del file

from openai import OpenAI  # Dovrebbe già esserci se usi "Chiedi"
import random

# ============== 2. SOSTITUISCI LA FUNZIONE analyze_couple_data ==============
# Cerca la funzione "analyze_couple_data" nel tuo app.py e sostituiscila con questa:

@app.post("/api/ai-coach/analyze")
async def analyze_couple_data(data: dict, db: Session = Depends(get_db)):
    """AI Coach - Analisi intelligente con OpenAI per consigli personalizzati"""
    try:
        couple_code = data.get("couple_code")
        user_id = data.get("user_id")
        user_name = data.get("user_name", "")
        partner_name = data.get("partner_name", "il tuo partner")
        
        # Recupera dati della coppia
        intimacy_logs = db.query(IntimacyLog).filter(IntimacyLog.couple_code == couple_code).order_by(IntimacyLog.date.desc()).limit(30).all()
        mood_logs = db.query(MoodLog).filter(MoodLog.couple_code == couple_code).order_by(MoodLog.date.desc()).limit(14).all()
        
        # Calcola statistiche base
        total_intimacy = len(intimacy_logs)
        avg_quality = sum(log.quality_rating for log in intimacy_logs) / len(intimacy_logs) if intimacy_logs else 0
        total_duration = sum(log.duration_minutes or 0 for log in intimacy_logs)
        
        # Analizza mood recente
        recent_moods = [log.mood for log in mood_logs if log.mood]
        avg_mood = sum(recent_moods) / len(recent_moods) if recent_moods else 3
        recent_libido = [log.libido for log in mood_logs if log.libido]
        avg_libido = sum(recent_libido) / len(recent_libido) if recent_libido else 3
        
        # Costruisci contesto per OpenAI
        context_data = f"""
Dati della coppia negli ultimi 30 giorni:
- Momenti intimi registrati: {total_intimacy}
- Qualità media: {avg_quality:.1f}/5
- Durata totale: {total_duration} minuti
- Umore medio (ultimi 14 giorni): {avg_mood:.1f}/5
- Libido media: {avg_libido:.1f}/5
- Nome utente: {user_name}
"""
        
        # Chiedi a OpenAI di generare consigli personalizzati
        openai_api_key = os.getenv("OPENAI_API_KEY")
        
        if openai_api_key:
            client = OpenAI(api_key=openai_api_key)
            
            # Genera Missione del Giorno
            mission_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": """Sei un coach di coppia esperto. Genera UNA missione romantica per oggi.
La missione deve essere:
- Realistica e fattibile in giornata
- Romantica ma non volgare
- Specifica e chiara
- In italiano

Rispondi SOLO con un JSON valido nel formato:
{"description": "descrizione della missione", "difficulty": "facile|medio|difficile", "points": 30-100}"""},
                    {"role": "user", "content": f"Genera una missione romantica basata su questi dati:\n{context_data}"}
                ],
                max_tokens=200,
                temperature=0.8
            )
            
            try:
                import json
                mission_text = mission_response.choices[0].message.content.strip()
                # Pulisci il JSON
                if "```json" in mission_text:
                    mission_text = mission_text.split("```json")[1].split("```")[0]
                elif "```" in mission_text:
                    mission_text = mission_text.split("```")[1].split("```")[0]
                mission_data = json.loads(mission_text)
            except:
                mission_data = {
                    "description": "Scrivi 3 cose che ami del tuo partner e condividile con lui/lei stasera",
                    "difficulty": "facile",
                    "points": 50
                }
            
            # Genera Idee Date Night
            datenight_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": """Sei un esperto di appuntamenti romantici. Genera 4 idee per date night creative.
Ogni idea deve avere:
- Un emoji appropriato
- Un titolo breve (max 3 parole)
- Una descrizione (max 10 parole)
- Tempo stimato
- Budget (€, €€, o €€€)

Rispondi SOLO con un JSON array valido:
[{"icon": "🍿", "title": "Titolo", "description": "Descrizione", "time": "2 ore", "budget": "€"}]"""},
                    {"role": "user", "content": f"Genera 4 idee date night personalizzate:\n{context_data}\nSuggerisci attività appropriate alla stagione e al loro livello di intimità."}
                ],
                max_tokens=400,
                temperature=0.9
            )
            
            try:
                datenight_text = datenight_response.choices[0].message.content.strip()
                if "```json" in datenight_text:
                    datenight_text = datenight_text.split("```json")[1].split("```")[0]
                elif "```" in datenight_text:
                    datenight_text = datenight_text.split("```")[1].split("```")[0]
                datenight_ideas = json.loads(datenight_text)
            except:
                datenight_ideas = [
                    {"icon": "🍿", "title": "Serata Film", "description": "Film + popcorn + coccole sul divano", "time": "2-3 ore", "budget": "€"},
                    {"icon": "🍳", "title": "Chef a Casa", "description": "Cucinate insieme un piatto nuovo", "time": "1-2 ore", "budget": "€€"},
                    {"icon": "🌙", "title": "Sotto le Stelle", "description": "Picnic notturno romantico", "time": "2 ore", "budget": "€"},
                    {"icon": "💆", "title": "Spa Casalinga", "description": "Massaggi e coccole reciproche", "time": "1-2 ore", "budget": "€"},
                ]
        else:
            # Fallback senza OpenAI
            mission_data = {
                "description": "Sorprendi il tuo partner con un messaggio d'amore inaspettato",
                "difficulty": "facile",
                "points": 40
            }
            datenight_ideas = [
                {"icon": "🍿", "title": "Serata Film", "description": "Film + popcorn + coccole", "time": "2-3 ore", "budget": "€"},
                {"icon": "🍳", "title": "Chef a Casa", "description": "Cucinate insieme", "time": "1-2 ore", "budget": "€€"},
            ]
        
        # Calcola Badge basati su dati reali
        badges = []
        
        # Badge: Prima Scintilla
        badges.append({
            "icon": "🔥",
            "title": "Prima Scintilla",
            "description": "Primo momento registrato",
            "unlocked": total_intimacy >= 1
        })
        
        # Badge: 7 Giorni
        consecutive_days = calculate_consecutive_days(intimacy_logs)
        badges.append({
            "icon": "📅",
            "title": "7 Giorni",
            "description": "7 giorni consecutivi",
            "unlocked": consecutive_days >= 7,
            "progress": min(consecutive_days, 7),
            "total": 7
        })
        
        # Badge: Qualità Top
        high_quality_count = sum(1 for log in intimacy_logs if log.quality_rating >= 4)
        badges.append({
            "icon": "👑",
            "title": "Qualità Top",
            "description": "5 momenti con qualità 4+",
            "unlocked": high_quality_count >= 5,
            "progress": min(high_quality_count, 5),
            "total": 5
        })
        
        # Badge: Esploratori (location diverse)
        unique_locations = set(log.location for log in intimacy_logs if log.location)
        badges.append({
            "icon": "🌍",
            "title": "Esploratori",
            "description": "5 location diverse",
            "unlocked": len(unique_locations) >= 5,
            "progress": min(len(unique_locations), 5),
            "total": 5
        })
        
        # Badge: Innamorati
        badges.append({
            "icon": "💕",
            "title": "Innamorati",
            "description": "10 momenti totali",
            "unlocked": total_intimacy >= 10,
            "progress": min(total_intimacy, 10),
            "total": 10
        })
        
        # Badge: Maratoneti
        long_sessions = sum(1 for log in intimacy_logs if (log.duration_minutes or 0) >= 45)
        badges.append({
            "icon": "⏱️",
            "title": "Maratoneti",
            "description": "Sessione 45+ minuti",
            "unlocked": long_sessions >= 1
        })
        
        return {
            "success": True,
            "data": {
                "daily_mission": {
                    "icon": "🎯",
                    "title": "Missione del Giorno",
                    "description": mission_data.get("description", ""),
                    "difficulty": mission_data.get("difficulty", "medio"),
                    "points": mission_data.get("points", 50)
                },
                "date_night_ideas": datenight_ideas,
                "badges": badges,
                "suggestions": [],  # Legacy field
                "weekly_tip": "",
                "encouragement": f"Ciao {user_name}! 💕"
            }
        }
        
    except Exception as e:
        print(f"Error in analyze_couple_data: {e}")
        # Fallback response
        return {
            "success": True,
            "data": {
                "daily_mission": {
                    "icon": "🎯",
                    "title": "Missione del Giorno",
                    "description": "Fai un complimento sincero al tuo partner oggi",
                    "difficulty": "facile",
                    "points": 30
                },
                "date_night_ideas": [
                    {"icon": "🍿", "title": "Serata Film", "description": "Film + coccole", "time": "2-3 ore", "budget": "€"},
                    {"icon": "🌙", "title": "Passeggiata", "description": "Camminata romantica", "time": "1 ora", "budget": "€"},
                ],
                "badges": [],
                "suggestions": [],
                "weekly_tip": "",
                "encouragement": "Buona giornata! 💕"
            }
        }


def calculate_consecutive_days(logs):
    """Calcola i giorni consecutivi di intimità"""
    if not logs:
        return 0
    
    dates = sorted(set(log.date for log in logs if log.date), reverse=True)
    if not dates:
        return 0
    
    consecutive = 1
    for i in range(1, len(dates)):
        diff = (dates[i-1] - dates[i]).days
        if diff == 1:
            consecutive += 1
        else:
            break
    
    return consecutive


# ============== 3. NUOVO ENDPOINT PER CALCOLO CALORIE AVANZATO ==============
# Aggiungi questo nuovo endpoint nel tuo app.py

# Tabella MET (Metabolic Equivalent of Task) per posizioni sessuali
POSITION_MET_VALUES = {
    "missionary": 2.8,      # Bassa intensità per chi sta sotto
    "cowgirl": 4.0,         # Alta intensità per chi sta sopra
    "reverse_cowgirl": 4.2,
    "doggy": 3.5,
    "standing": 4.5,        # Alta intensità
    "spooning": 2.0,        # Bassa intensità, rilassante
    "69": 3.0,
    "lotus": 3.2,
    "prone": 2.5,
    "edge_of_bed": 3.8,
    "shower": 4.0,          # Extra sforzo per equilibrio
    "wall": 4.5,
    "chair": 3.5,
}

@app.post("/api/calculate-calories")
async def calculate_calories_endpoint(data: dict):
    """
    Calcolo avanzato delle calorie bruciate durante l'intimità
    Basato su ricerca scientifica (MET values) e parametri personalizzati
    """
    try:
        duration_minutes = data.get("duration", 15)
        positions = data.get("positions", [])
        quality = data.get("quality", 3)  # 1-5 scale, influenza intensità
        user_weight_kg = data.get("weight", 70)  # Default 70kg se non specificato
        
        # Calcola MET medio basato sulle posizioni
        if positions and len(positions) > 0:
            total_met = 0
            for pos in positions:
                pos_lower = pos.lower().replace(" ", "_")
                total_met += POSITION_MET_VALUES.get(pos_lower, 3.0)
            avg_met = total_met / len(positions)
        else:
            avg_met = 3.0  # MET medio per attività sessuale generica
        
        # Modifica MET basato su qualità/intensità (quality 1-5)
        # Quality 1 = -20%, Quality 5 = +20%
        intensity_modifier = 0.8 + (quality * 0.1)
        adjusted_met = avg_met * intensity_modifier
        
        # Formula calorie: MET × peso (kg) × tempo (ore)
        hours = duration_minutes / 60
        calories_burned = adjusted_met * user_weight_kg * hours
        
        # Calcoli aggiuntivi divertenti
        chocolate_bars = calories_burned / 100  # ~100 cal per barretta
        pizza_slices = calories_burned / 285    # ~285 cal per fetta
        steps_equivalent = calories_burned / 0.04  # ~0.04 cal per passo
        
        return {
            "success": True,
            "calories": round(calories_burned),
            "met_value": round(adjusted_met, 1),
            "equivalents": {
                "chocolate_bars": round(chocolate_bars, 1),
                "pizza_slices": round(pizza_slices, 1),
                "steps": round(steps_equivalent)
            },
            "details": {
                "duration": duration_minutes,
                "positions_count": len(positions),
                "intensity": quality,
                "base_met": round(avg_met, 1)
            }
        }
        
    except Exception as e:
        print(f"Error calculating calories: {e}")
        return {
            "success": False,
            "calories": 0,
            "error": str(e)
        }


# ============== 4. ENDPOINT PER STATISTICHE CALORIE MENSILI ==============

@app.get("/api/calories/monthly/{couple_code}")
async def get_monthly_calories(couple_code: str, month: int = None, year: int = None, db: Session = Depends(get_db)):
    """
    Restituisce le calorie bruciate totali per un mese specifico
    """
    try:
        from datetime import datetime, date
        from calendar import monthrange
        
        # Default: mese corrente
        if month is None:
            month = datetime.now().month
        if year is None:
            year = datetime.now().year
        
        # Date range per il mese
        first_day = date(year, month, 1)
        last_day = date(year, month, monthrange(year, month)[1])
        
        # Query intimacy logs per questo mese
        logs = db.query(IntimacyLog).filter(
            IntimacyLog.couple_code == couple_code,
            IntimacyLog.date >= first_day,
            IntimacyLog.date <= last_day
        ).all()
        
        total_calories = 0
        total_duration = 0
        session_calories = []
        
        for log in logs:
            duration = log.duration_minutes or 15
            positions = log.positions_used or []
            quality = log.quality_rating or 3
            
            # Calcola MET
            if positions:
                total_met = sum(POSITION_MET_VALUES.get(p.lower(), 3.0) for p in positions)
                avg_met = total_met / len(positions)
            else:
                avg_met = 3.0
            
            intensity_modifier = 0.8 + (quality * 0.1)
            adjusted_met = avg_met * intensity_modifier
            
            # Calorie (assumendo peso medio 70kg)
            calories = adjusted_met * 70 * (duration / 60)
            total_calories += calories
            total_duration += duration
            
            session_calories.append({
                "date": log.date.isoformat() if log.date else None,
                "calories": round(calories),
                "duration": duration
            })
        
        return {
            "success": True,
            "month": month,
            "year": year,
            "total_calories": round(total_calories),
            "total_duration_minutes": total_duration,
            "session_count": len(logs),
            "average_per_session": round(total_calories / len(logs)) if logs else 0,
            "equivalents": {
                "chocolate_bars": round(total_calories / 100, 1),
                "pizza_slices": round(total_calories / 285, 1),
                "km_running": round(total_calories / 60, 1)  # ~60 cal per km
            },
            "sessions": session_calories
        }
        
    except Exception as e:
        print(f"Error getting monthly calories: {e}")
        return {
            "success": False,
            "total_calories": 0,
            "error": str(e)
        }
