# ================= NUOVI ENDPOINT DA AGGIUNGERE =================
# Aggiungi questi endpoint al tuo app.py sul server

# 1. FERTILITA' PER COUPLE_CODE (per l'uomo)
@api_router.get("/cycle/fertility/couple/{couple_code}")
async def get_fertility_by_couple(couple_code: str):
    """Get fertility data for couple - used by male partner"""
    db = SessionLocal()
    try:
        # Trova l'utente donna con questo couple_code
        female_user = db.query(User).filter(
            User.couple_code == couple_code,
            User.gender == "female"
        ).first()
        
        if not female_user:
            return {"periods": [], "ovulation_days": [], "fertile_days": []}
        
        # Ottieni i dati del ciclo della donna
        cycle = db.query(Cycle).filter(Cycle.user_id == female_user.id).first()
        
        if not cycle or not cycle.last_period_date:
            return {"periods": [], "ovulation_days": [], "fertile_days": []}
        
        # Calcola fertilità (stesso codice dell'endpoint esistente)
        from datetime import timedelta
        
        periods = []
        ovulation_days = []
        fertile_days = []
        
        start_date = cycle.last_period_date
        cycle_length = cycle.cycle_length or 28
        period_length = cycle.period_length or 5
        
        # Genera per 3 mesi
        for i in range(3):
            cycle_start = start_date + timedelta(days=cycle_length * i)
            
            # Giorni del ciclo
            for j in range(period_length):
                periods.append((cycle_start + timedelta(days=j)).strftime("%Y-%m-%d"))
            
            # Ovulazione (circa giorno 14)
            ovulation = cycle_start + timedelta(days=cycle_length - 14)
            ovulation_days.append(ovulation.strftime("%Y-%m-%d"))
            
            # Giorni fertili (5 giorni prima e 1 dopo ovulazione)
            for j in range(-5, 2):
                fertile_date = ovulation + timedelta(days=j)
                if fertile_date.strftime("%Y-%m-%d") not in periods:
                    fertile_days.append(fertile_date.strftime("%Y-%m-%d"))
        
        return {
            "periods": periods,
            "ovulation_days": ovulation_days,
            "fertile_days": fertile_days
        }
    except Exception as e:
        return {"periods": [], "ovulation_days": [], "fertile_days": [], "error": str(e)}
    finally:
        db.close()


# 2. CALCOLO CALORIE DURANTE IL SESSO
# Aggiungi questo quando salvi un momento intimo
# Le calorie vengono calcolate in base a: durata, posizioni, intensità

POSITION_CALORIES = {
    "missionary": 3.5,      # cal/min
    "cowgirl": 4.5,
    "reverse_cowgirl": 4.5,
    "doggy": 4.0,
    "standing": 5.0,
    "spooning": 2.5,
    "69": 3.0,
    "lotus": 3.5,
    "prone": 3.0,
    "default": 3.5
}

def calculate_calories(duration_minutes: int, positions: list, quality_rating: int):
    """
    Calcola le calorie bruciate durante il sesso
    - Base: 3.5 cal/min
    - Modificato da posizioni usate
    - Modificato da intensità (quality rating)
    """
    if not duration_minutes:
        duration_minutes = 15  # default 15 min
    
    # Calcola calorie base dalle posizioni
    if positions and len(positions) > 0:
        total_cal_per_min = sum(POSITION_CALORIES.get(p, 3.5) for p in positions) / len(positions)
    else:
        total_cal_per_min = 3.5
    
    # Bonus intensità (quality 5 = +30%, quality 1 = -20%)
    intensity_multiplier = 0.8 + (quality_rating * 0.1)
    
    calories = duration_minutes * total_cal_per_min * intensity_multiplier
    
    return round(calories)


# Modifica l'endpoint POST /intimacy per includere le calorie
# Aggiungi questo nel return dopo aver salvato:
# "calories_burned": calculate_calories(duration_minutes, positions_used, quality_rating)


# 3. NOTIFICHE QUANDO PARTNER SELEZIONA UN DESIDERIO
# Modifica l'endpoint POST /desires/save per inviare notifica

# Aggiungi questo import in cima:
# import httpx

async def send_push_notification(push_token: str, title: str, body: str):
    """Invia notifica push tramite Expo"""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                "https://exp.host/--/api/v2/push/send",
                json={
                    "to": push_token,
                    "title": title,
                    "body": body,
                    "sound": "default",
                    "data": {"type": "desire_update"}
                }
            )
    except Exception as e:
        print(f"Push notification error: {e}")


# Modifica l'endpoint save_desires per inviare notifica:
@api_router.post("/desires/save")
async def save_desires(request: SaveDesiresRequest):
    """Save user's secret desires and notify partner"""
    db = SessionLocal()
    try:
        # ... codice esistente per salvare ...
        
        # Dopo aver salvato, notifica il partner
        partner = db.query(User).filter(
            User.couple_code == request.couple_code,
            User.id != request.user_id
        ).first()
        
        if partner and partner.push_token:
            await send_push_notification(
                partner.push_token,
                "💭 Desideri Segreti",
                "Il tuo partner ha aggiornato le sue scelte! Vai a vedere se avete nuovi match 😏"
            )
        
        # ... resto del codice ...
        
    finally:
        db.close()
