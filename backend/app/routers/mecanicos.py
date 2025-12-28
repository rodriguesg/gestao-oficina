from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/mecanicos", tags=["Mecânicos"])

@router.post("/", response_model=schemas.MecanicoResponse)
def criar_mecanico(mecanico: schemas.MecanicoCreate, db: Session = Depends(get_db)):
    try:
        db_mecanico = models.Mecanico(**mecanico.model_dump())
        db.add(db_mecanico)
        db.commit()
        db.refresh(db_mecanico)
        return db_mecanico
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[schemas.MecanicoResponse])
def listar_mecanicos(db: Session = Depends(get_db)):
    return db.query(models.Mecanico).all()