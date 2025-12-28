from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/veiculos", tags=["Veículos"])

@router.post("/", response_model=schemas.VeiculoResponse)
def criar_veiculo(veiculo: schemas.VeiculoCreate, db: Session = Depends(get_db)):
    if db.query(models.Veiculo).filter(models.Veiculo.placa == veiculo.placa).first():
        raise HTTPException(status_code=400, detail="Placa já cadastrada")
    
    if not db.query(models.Cliente).filter(models.Cliente.id == veiculo.cliente_id).first():
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    try:
        db_veiculo = models.Veiculo(**veiculo.model_dump())
        db.add(db_veiculo)
        db.commit()
        db.refresh(db_veiculo)
        return db_veiculo
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[schemas.VeiculoResponse])
def listar_veiculos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Veiculo).offset(skip).limit(limit).all()