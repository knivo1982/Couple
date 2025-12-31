# ================= AI COACH ENHANCED =================
# SOSTITUISCI la funzione analyze_couple_data nel tuo app.py con questa versione migliorata

@api_router.post("/ai-coach/analyze")
async def analyze_couple_data(request: AICoachAnalyzeRequest):
    db = SessionLocal()
    try:
        from datetime import datetime, timedelta
        import hashlib
        
        # Get data
        intimacy_entries = db.query(IntimacyLog).filter(
            IntimacyLog.couple_code == request.couple_code
        ).order_by(IntimacyLog.date.desc()).limit(100).all()
        
        mood_entries = db.query(Mood).filter(
            Mood.couple_code == request.couple_code
        ).order_by(Mood.date.desc()).limit(30).all()
        
        total_intimacy = len(intimacy_entries)
        
        # 🎯 MISSIONE DEL GIORNO - Cambia ogni giorno basata sulla data + couple_code
        daily_missions = [
            {"icon": "💌", "title": "Messaggio Speciale", "description": "Scrivi un messaggio romantico al tuo partner con 3 cose che ami di lui/lei", "points": 50, "difficulty": "facile"},
            {"icon": "👀", "title": "Sguardo Profondo", "description": "Guardate negli occhi per 2 minuti senza parlare. Scoprite cosa comunicate", "points": 60, "difficulty": "medio"},
            {"icon": "💆", "title": "Massaggio Relax", "description": "Regalate 10 minuti di massaggio al partner - senza aspettarvi nulla in cambio", "points": 70, "difficulty": "facile"},
            {"icon": "🎵", "title": "La Vostra Canzone", "description": "Ballate insieme la vostra canzone preferita in salotto", "points": 50, "difficulty": "facile"},
            {"icon": "📸", "title": "Selfie di Coppia", "description": "Scattate un selfie insieme e condividete un ricordo felice", "points": 40, "difficulty": "facile"},
            {"icon": "🍳", "title": "Colazione a Letto", "description": "Preparate la colazione a letto per il vostro partner", "points": 80, "difficulty": "medio"},
            {"icon": "💋", "title": "Bacio di 10 Secondi", "description": "Un bacio appassionato di almeno 10 secondi - senza fretta!", "points": 60, "difficulty": "facile"},
            {"icon": "🎁", "title": "Piccola Sorpresa", "description": "Fate una piccola sorpresa inaspettata al partner oggi", "points": 90, "difficulty": "medio"},
            {"icon": "📝", "title": "Lista dei Desideri", "description": "Scrivete insieme 3 cose che vorreste fare come coppia", "points": 50, "difficulty": "facile"},
            {"icon": "🌟", "title": "Complimento Sincero", "description": "Dite al partner qualcosa che ammirate di lui/lei che non avete mai detto", "points": 70, "difficulty": "medio"},
        ]
        
        # Seleziona missione del giorno basata sulla data
        today = datetime.now().strftime("%Y-%m-%d")
        hash_input = f"{today}-{request.couple_code}"
        hash_val = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        daily_mission = daily_missions[hash_val % len(daily_missions)]
        
        # 💑 DATE NIGHT IDEAS - personalizzate
        date_night_ideas = [
            {"icon": "🍿", "title": "Serata Cinema", "description": "Film romantico + popcorn + coccole", "time": "2-3 ore", "budget": "€"},
            {"icon": "🍳", "title": "Chef a Casa", "description": "Cucinate insieme un piatto nuovo", "time": "1-2 ore", "budget": "€€"},
            {"icon": "🌙", "title": "Sotto le Stelle", "description": "Picnic notturno o aperitivo sul balcone", "time": "1-2 ore", "budget": "€"},
            {"icon": "💆", "title": "Spa Casalinga", "description": "Massaggi, candele, musica rilassante", "time": "1-2 ore", "budget": "€"},
            {"icon": "🎮", "title": "Game Night", "description": "Videogiochi o giochi da tavolo insieme", "time": "2-3 ore", "budget": "€"},
            {"icon": "📚", "title": "Lettura Condivisa", "description": "Leggete insieme o a voce alta", "time": "1 ora", "budget": "€"},
        ]
        
        # 🏆 BADGES - calcolati sui dati reali
        badges = []
        
        # Badge: Prima Scintilla
        badges.append({
            "icon": "🔥",
            "title": "Prima Scintilla",
            "description": "Primo momento registrato",
            "unlocked": total_intimacy >= 1
        })
        
        # Badge: 7 giorni consecutivi (semplificato)
        badges.append({
            "icon": "📅",
            "title": "Settimana d'Amore",
            "description": "7 momenti registrati",
            "unlocked": total_intimacy >= 7,
            "progress": min(total_intimacy, 7),
            "total": 7
        })
        
        # Badge: Qualità alta
        high_quality = len([e for e in intimacy_entries if (e.quality_rating or 0) >= 5])
        badges.append({
            "icon": "💯",
            "title": "Perfezionisti",
            "description": "5 momenti qualità 5/5",
            "unlocked": high_quality >= 5,
            "progress": min(high_quality, 5),
            "total": 5
        })
        
        # Badge: Location diverse
        locations = set(e.location for e in intimacy_entries if e.location)
        badges.append({
            "icon": "🌍",
            "title": "Esploratori",
            "description": "5 location diverse",
            "unlocked": len(locations) >= 5,
            "progress": min(len(locations), 5),
            "total": 5
        })
        
        # Badge: 10 momenti
        badges.append({
            "icon": "💕",
            "title": "Innamorati",
            "description": "10 momenti insieme",
            "unlocked": total_intimacy >= 10,
            "progress": min(total_intimacy, 10),
            "total": 10
        })
        
        # Badge: 25 momenti
        badges.append({
            "icon": "👑",
            "title": "Re e Regina",
            "description": "25 momenti insieme",
            "unlocked": total_intimacy >= 25,
            "progress": min(total_intimacy, 25),
            "total": 25
        })
        
        # Calcola punteggio totale badge sbloccati
        unlocked_count = sum(1 for b in badges if b.get("unlocked"))
        
        return {
            "success": True,
            "data": {
                "suggestions": [],  # Non più usato
                "weekly_tip": "",
                "encouragement": f"🏆 {unlocked_count}/{len(badges)} traguardi sbloccati!",
                "daily_mission": daily_mission,
                "date_night_ideas": date_night_ideas[:4],  # Prime 4
                "badges": badges
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        db.close()
