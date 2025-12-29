from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, security
from ..database import get_db

router = APIRouter(
    prefix="/veiculos", 
    tags=["Veículos"],
    dependencies=[Depends(security.get_current_user)]
)

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

@router.delete("/{veiculo_id}")
def deletar_veiculo(veiculo_id: int, db: Session = Depends(get_db)):
    veiculo = db.query(models.Veiculo).filter(models.Veiculo.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    try:
        db.delete(veiculo)
        db.commit()
        return {"message": "Veículo removido com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Não é possível excluir veículo com OS vinculada.")

@router.put("/{veiculo_id}")
def atualizar_veiculo(veiculo_id: int, dados: schemas.VeiculoCreate, db: Session = Depends(get_db)):
    veiculo = db.query(models.Veiculo).filter(models.Veiculo.id == veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    veiculo.marca = dados.marca
    veiculo.modelo = dados.modelo
    veiculo.placa = dados.placa
    veiculo.ano = dados.ano
    veiculo.cor = dados.cor
    veiculo.cliente_id = dados.cliente_id
    
    db.commit()
    db.refresh(veiculo)
    return veiculo