# ================= AI COACH =================
# AGGIUNGI QUESTO CODICE AL TUO app.py SUL SERVER
# Prima della riga: app.include_router(api_router)

# Aggiungi questa import in cima al file se non c'è già:
# import httpx
# import random

class AICoachAnalyzeRequest(BaseModel):
    couple_code: str
    user_id: str
    user_name: str
    partner_name: Optional[str] = None

@api_router.post("/ai-coach/analyze")
async def analyze_couple_data(request: AICoachAnalyzeRequest):
    """Analyze couple data and provide AI-powered suggestions"""
    db = SessionLocal()
    try:
        # Get recent intimacy data
        intimacy_entries = db.query(IntimacyLog).filter(
            IntimacyLog.couple_code == request.couple_code
        ).order_by(IntimacyLog.date.desc()).limit(30).all()
        
        # Get recent mood data
        mood_entries = db.query(Mood).filter(
            Mood.couple_code == request.couple_code
        ).order_by(Mood.date.desc()).limit(30).all()
        
        suggestions = []
        weekly_tip = ""
        encouragement = ""
        
        # Analyze patterns
        total_intimacy = len(intimacy_entries)
        avg_quality = 0
        if total_intimacy > 0:
            avg_quality = sum(e.quality_rating or 3 for e in intimacy_entries) / total_intimacy
        
        avg_mood = 0
        avg_libido = 0
        if mood_entries:
            avg_mood = sum(m.mood or 3 for m in mood_entries) / len(mood_entries)
            avg_libido = sum(m.libido or 3 for m in mood_entries) / len(mood_entries)
        
        # Generate contextual suggestions
        if total_intimacy == 0:
            suggestions.append({
                "type": "intimacy",
                "icon": "💑",
                "title": "Iniziate a registrare i vostri momenti",
                "message": "Tenere traccia dei vostri momenti intimi vi aiuterà a capire meglio la vostra relazione.",
                "action": "Registra il primo momento",
                "priority": "high"
            })
        elif total_intimacy < 5:
            suggestions.append({
                "type": "connection",
                "icon": "🌟",
                "title": "State costruendo la vostra storia",
                "message": f"Avete registrato {total_intimacy} momenti insieme. Continuate così!",
                "action": "Aggiungi un nuovo momento",
                "priority": "medium"
            })
        
        if avg_quality > 0 and avg_quality < 3:
            suggestions.append({
                "type": "quality",
                "icon": "💡",
                "title": "Migliora la qualità dei momenti",
                "message": "Provate a dedicare più tempo ai preliminari e alla comunicazione.",
                "action": "Esplora nuove idee",
                "priority": "high"
            })
        elif avg_quality >= 4:
            suggestions.append({
                "type": "quality",
                "icon": "🔥",
                "title": "Siete fantastici insieme!",
                "message": f"Qualità media {avg_quality:.1f}/5. Continuate così!",
                "action": "Mantieni la magia",
                "priority": "low"
            })
        
        if avg_libido > 0 and avg_libido < 2.5:
            suggestions.append({
                "type": "wellness",
                "icon": "🧘",
                "title": "Tempo per voi stessi",
                "message": "Dedicare più tempo al relax insieme potrebbe aiutare.",
                "action": "Pianifica una serata relax",
                "priority": "medium"
            })
        
        if not suggestions:
            suggestions.append({
                "type": "general",
                "icon": "💕",
                "title": "Momento di connessione",
                "message": "Dedicate del tempo di qualità solo a voi due oggi.",
                "action": "Sorprendi il tuo partner",
                "priority": "medium"
            })
        
        weekly_tips = [
            "Prova a iniziare la giornata con un messaggio dolce al tuo partner 💌",
            "Questa settimana, organizza una serata speciale senza telefoni 📵",
            "Ricorda: l'intimità inizia molto prima della camera da letto!",
            "Prova qualcosa di nuovo insieme 🍝",
            "Dedicati 10 minuti al giorno solo per parlare con il tuo partner 💬"
        ]
        weekly_tip = random.choice(weekly_tips)
        
        if total_intimacy > 10:
            encouragement = f"Ottimo lavoro! {total_intimacy} momenti registrati insieme! 🌱"
        elif total_intimacy > 0:
            encouragement = "Ogni momento rafforza il vostro legame. Continuate così! 💪"
        else:
            encouragement = "Benvenuti! Iniziate il vostro viaggio insieme. 🚀"
        
        return {
            "success": True,
            "data": {
                "suggestions": suggestions,
                "weekly_tip": weekly_tip,
                "encouragement": encouragement
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        db.close()


@api_router.get("/ai-coach/insights/{couple_code}")
async def get_ai_insights(couple_code: str):
    """Get intelligent insights about the couple's relationship"""
    db = SessionLocal()
    try:
        intimacy_entries = db.query(IntimacyLog).filter(
            IntimacyLog.couple_code == couple_code
        ).order_by(IntimacyLog.date.desc()).limit(100).all()
        
        mood_entries = db.query(Mood).filter(
            Mood.couple_code == couple_code
        ).order_by(Mood.date.desc()).limit(100).all()
        
        insights = []
        
        total_moments = len(intimacy_entries)
        if total_moments > 0:
            insights.append({
                "icon": "❤️",
                "title": "Momenti Insieme",
                "value": str(total_moments),
                "description": "momenti intimi registrati",
                "color": "#ff6b8a"
            })
            
            avg_quality = sum(e.quality_rating or 3 for e in intimacy_entries) / total_moments
            insights.append({
                "icon": "⭐",
                "title": "Qualità Media",
                "value": f"{avg_quality:.1f}/5",
                "description": "valutazione dei vostri momenti",
                "color": "#f39c12"
            })
            
            locations = {}
            for e in intimacy_entries:
                loc = e.location or "bedroom"
                locations[loc] = locations.get(loc, 0) + 1
            
            if locations:
                top_location = max(locations.items(), key=lambda x: x[1])
                location_names = {
                    "bedroom": "Camera da letto",
                    "shower": "Doccia",
                    "couch": "Divano",
                    "kitchen": "Cucina",
                    "car": "Auto",
                    "outdoor": "All'aperto",
                    "hotel": "Hotel"
                }
                insights.append({
                    "icon": "📍",
                    "title": "Posto Preferito",
                    "value": location_names.get(top_location[0], top_location[0]),
                    "description": f"{top_location[1]} volte",
                    "color": "#9b59b6"
                })
        
        if mood_entries:
            avg_mood = sum(m.mood or 3 for m in mood_entries) / len(mood_entries)
            mood_emoji = "😊" if avg_mood >= 3.5 else "😐" if avg_mood >= 2.5 else "😔"
            insights.append({
                "icon": mood_emoji,
                "title": "Umore Medio",
                "value": f"{avg_mood:.1f}/5",
                "description": "negli ultimi 30 giorni",
                "color": "#2ed573"
            })
        
        return {"success": True, "insights": insights}
    except Exception as e:
        return {"success": False, "insights": [], "error": str(e)}
    finally:
        db.close()


@api_router.post("/ai-coach/question")
async def ask_ai_coach(question: str, couple_code: str):
    """Answer couple-related questions"""
    db = SessionLocal()
    try:
        # Usa la chiave OpenAI se disponibile
        openai_api_key = os.getenv('OPENAI_API_KEY', '')
        
        if openai_api_key:
            import httpx
            intimacy_count = db.query(IntimacyLog).filter(
                IntimacyLog.couple_code == couple_code
            ).count()
            
            mood_entries = db.query(Mood).filter(
                Mood.couple_code == couple_code
            ).order_by(Mood.date.desc()).limit(10).all()
            
            context = f"La coppia ha {intimacy_count} momenti intimi registrati."
            if mood_entries:
                avg_mood = sum(m.mood or 3 for m in mood_entries) / len(mood_entries)
                context += f" Umore medio: {avg_mood:.1f}/5."
            
            system_prompt = """Sei Dr. Sofia, coach di coppia esperta e compassionevole. 
Rispondi in italiano, caldo ed empatico. Dai consigli pratici.
Usa emoji occasionalmente. Max 150 parole. Sii supportivo."""

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openai_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": f"Contesto: {context}\n\nDomanda: {question}"}
                        ],
                        "max_tokens": 500,
                        "temperature": 0.7
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {"success": True, "answer": data["choices"][0]["message"]["content"]}
        
        # Fallback a risposte pre-configurate
        return _generate_smart_response(question)
    except Exception as e:
        return _generate_smart_response(question)
    finally:
        db.close()


def _generate_smart_response(question: str) -> dict:
    """Risposte intelligenti senza API"""
    q = question.lower()
    
    responses = {
        "comunicazione": "La comunicazione è la base! 💬 Dedica 15 minuti al giorno per parlare senza distrazioni. Usa 'Mi sento...' invece di accusare.",
        "passione": "Riaccendi la passione con creatività! 🔥 Sorprendi il partner, scrivi messaggi piccanti, esplora nuove fantasie insieme.",
        "stress": "Lo stress pesa sulla coppia. 🧘 Create momenti di relax insieme e supportatevi a vicenda.",
        "romanticismo": "Il romanticismo si coltiva ogni giorno! 💕 Piccoli gesti contano: messaggi dolci, fiori, colazione a letto.",
        "litigi": "Litigate in modo costruttivo. 🤝 Mai a letto arrabbiati, concentratevi sul problema non sulla persona."
    }
    
    for key, resp in responses.items():
        if key in q:
            return {"success": True, "answer": resp}
    
    return {"success": True, "answer": "Grazie per la domanda! 💕 Comunicare apertamente e dedicare tempo di qualità sono sempre la chiave."}
