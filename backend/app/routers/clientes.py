from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, security
from ..database import get_db

router = APIRouter(
    prefix="/clientes", 
    tags=["Clientes"],
    dependencies=[Depends(security.get_current_user)]
)

@router.post("/", response_model=schemas.ClienteResponse)
def criar_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):
    if db.query(models.Cliente).filter(models.Cliente.cpf_cnpj == cliente.cpf_cnpj).first():
        raise HTTPException(status_code=400, detail="CPF/CNPJ já cadastrado")
    
    try:
        db_cliente = models.Cliente(**cliente.model_dump())
        db.add(db_cliente)
        db.commit()
        db.refresh(db_cliente)
        return db_cliente
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@router.delete("/{cliente_id}")
def deletar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente: raise HTTPException(404, "Cliente não encontrado")
    
    # erro de chave estrangeira se tiver veiculo
    # isso ou deletar em cascata
    db.delete(cliente)
    db.commit()
    return {"message": "Cliente removido"}

@router.put("/{cliente_id}")
def atualizar_cliente(cliente_id: int, dados: schemas.ClienteCreate, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente: raise HTTPException(404, "Cliente não encontrado")
    
    cliente.nome = dados.nome
    cliente.telefone = dados.telefone
    cliente.cpf_cnpj = dados.cpf_cnpj
    cliente.endereco = dados.endereco
    
    db.commit()
    return cliente

@router.get("/", response_model=List[schemas.ClienteResponse])
def listar_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # deveria retornar apenas o objeto ClienteResponse, não uma List
    return db.query(models.Cliente).offset(skip).limit(limit).all()

@router.get("/{cliente_id}", response_model=List[schemas.ClienteResponse])
def listar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    clientes = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).all()
    if not clientes:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return clientes

@router.get("/{cliente_id}/veiculos", response_model=List[schemas.VeiculoResponse])
def listar_veiculos_do_cliente(cliente_id: int, db: Session = Depends(get_db)):
    if not db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first():
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
        
    return db.query(models.Veiculo).filter(models.Veiculo.cliente_id == cliente_id).all()