from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas
from .database import get_db

app = FastAPI(title="Gestão de Oficina API")

@app.post("/clientes/", response_model=schemas.ClienteResponse)
def criar_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):
    cliente_existente = db.query(models.Cliente).filter(models.Cliente.cpf_cnpj == cliente.cpf_cnpj).first()
    if cliente_existente:
        raise HTTPException(status_code=400, detail="CPF/CNPJ já cadastrado")
    
    db_cliente = models.Cliente(**cliente.model_dump())

    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente) # Recarrega o objeto com o ID gerado pelo banco
    
    return db_cliente

@app.get("/clientes/", response_model=List[schemas.ClienteResponse])
def listar_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    clientes = db.query(models.Cliente).offset(skip).limit(limit).all()
    return clientes