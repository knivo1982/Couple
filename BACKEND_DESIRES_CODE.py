# ================= DESIDERI SEGRETI =================
# AGGIUNGI QUESTO CODICE AL TUO app.py SUL SERVER
# Prima della riga: app.include_router(api_router)

# 1. Prima aggiungi questa tabella al database (esegui una sola volta):
"""
CREATE TABLE IF NOT EXISTS secret_desires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    couple_code VARCHAR(50) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    desires JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_desires (couple_code, user_id)
);
"""

# 2. Aggiungi questo modello SQLAlchemy (dopo gli altri modelli):
class SecretDesire(Base):
    __tablename__ = "secret_desires"
    id = Column(Integer, primary_key=True, index=True)
    couple_code = Column(String(50), nullable=False)
    user_id = Column(String(100), nullable=False)
    desires = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# 3. Aggiungi questi endpoint (prima di app.include_router):

class SaveDesiresRequest(BaseModel):
    couple_code: str
    user_id: str
    desires: List[str]

@api_router.get("/desires/{couple_code}/{user_id}")
async def get_desires(couple_code: str, user_id: str):
    """Get user's desires and matches with partner"""
    db = SessionLocal()
    try:
        # Get my desires
        my_record = db.query(SecretDesire).filter(
            SecretDesire.couple_code == couple_code,
            SecretDesire.user_id == user_id
        ).first()
        
        my_desires = my_record.desires if my_record else []
        
        # Get partner's desires
        partner_record = db.query(SecretDesire).filter(
            SecretDesire.couple_code == couple_code,
            SecretDesire.user_id != user_id
        ).first()
        
        partner_has_selected = partner_record is not None and len(partner_record.desires or []) > 0
        partner_desires = partner_record.desires if partner_record else []
        
        # Calculate matches (only desires both have selected)
        matches = list(set(my_desires) & set(partner_desires)) if partner_desires else []
        
        return {
            "my_desires": my_desires,
            "matches": matches,
            "partner_has_selected": partner_has_selected
        }
    except Exception as e:
        return {"my_desires": [], "matches": [], "partner_has_selected": False, "error": str(e)}
    finally:
        db.close()


@api_router.post("/desires/save")
async def save_desires(request: SaveDesiresRequest):
    """Save user's secret desires"""
    db = SessionLocal()
    try:
        # Check if record exists
        existing = db.query(SecretDesire).filter(
            SecretDesire.couple_code == request.couple_code,
            SecretDesire.user_id == request.user_id
        ).first()
        
        if existing:
            existing.desires = request.desires
            existing.updated_at = datetime.utcnow()
        else:
            new_record = SecretDesire(
                couple_code=request.couple_code,
                user_id=request.user_id,
                desires=request.desires
            )
            db.add(new_record)
        
        db.commit()
        
        # Get partner's desires to calculate matches
        partner_record = db.query(SecretDesire).filter(
            SecretDesire.couple_code == request.couple_code,
            SecretDesire.user_id != request.user_id
        ).first()
        
        partner_has_selected = partner_record is not None and len(partner_record.desires or []) > 0
        partner_desires = partner_record.desires if partner_record else []
        
        # Calculate matches
        matches = list(set(request.desires) & set(partner_desires)) if partner_desires else []
        
        return {
            "success": True,
            "matches": matches,
            "partner_has_selected": partner_has_selected
        }
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}
    finally:
        db.close()
