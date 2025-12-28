from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(tags=["Catálogo (Estoque & Serviços)"])

# --- PEÇAS ---
@router.post("/pecas/", response_model=schemas.PecaResponse)
def criar_peca(peca: schemas.PecaCreate, db: Session = Depends(get_db)):
    if db.query(models.Peca).filter(models.Peca.codigo == peca.codigo).first():
        raise HTTPException(400, "Código da peça já existe")
    
    try:
        db_peca = models.Peca(**peca.model_dump())
        db.add(db_peca)
        db.commit()
        db.refresh(db_peca)
        return db_peca
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))

@router.get("/pecas/", response_model=List[schemas.PecaResponse])
def listar_pecas(db: Session = Depends(get_db)):
    return db.query(models.Peca).all()

# --- SERVIÇOS ---
@router.post("/servicos/", response_model=schemas.ServicoResponse)
def criar_servico(servico: schemas.ServicoCreate, db: Session = Depends(get_db)):
    try:
        db_servico = models.Servico(**servico.model_dump())
        db.add(db_servico)
        db.commit()
        db.refresh(db_servico)
        return db_servico
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))

@router.get("/servicos/", response_model=List[schemas.ServicoResponse])
def listar_servicos(db: Session = Depends(get_db)): # Criei essa rota pois faltava no original
    return db.query(models.Servico).all()