from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(tags=["Catálogo (Estoque & Serviços)"])

# =======================
# --- PEÇAS ---
# =======================

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

@router.put("/pecas/{id}", response_model=schemas.PecaResponse)
def atualizar_peca(id: int, peca: schemas.PecaCreate, db: Session = Depends(get_db)):
    db_peca = db.query(models.Peca).filter(models.Peca.id == id).first()
    if not db_peca:
        raise HTTPException(404, "Peça não encontrada")
    
    # Verifica se código duplicado (se mudou o código)
    if peca.codigo != db_peca.codigo:
        if db.query(models.Peca).filter(models.Peca.codigo == peca.codigo).first():
            raise HTTPException(400, "Novo código já está em uso por outra peça")

    db_peca.nome = peca.nome
    db_peca.codigo = peca.codigo
    db_peca.valor_venda = peca.valor_venda
    db_peca.estoque_atual = peca.estoque_atual
    
    db.commit()
    db.refresh(db_peca)
    return db_peca

@router.delete("/pecas/{id}")
def remover_peca(id: int, db: Session = Depends(get_db)):
    db_peca = db.query(models.Peca).filter(models.Peca.id == id).first()
    if not db_peca:
        raise HTTPException(404, "Peça não encontrada")
    
    try:
        db.delete(db_peca)
        db.commit()
        return {"message": "Peça removida com sucesso"}
    except Exception as e:
        db.rollback()
        # O banco vai bloquear se a peça estiver sendo usada em alguma OS
        raise HTTPException(400, "Não é possível excluir: Peça utilizada em Ordens de Serviço.")

# =======================
# --- SERVIÇOS ---
# =======================

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
def listar_servicos(db: Session = Depends(get_db)):
    return db.query(models.Servico).all()

@router.put("/servicos/{id}", response_model=schemas.ServicoResponse)
def atualizar_servico(id: int, servico: schemas.ServicoCreate, db: Session = Depends(get_db)):
    db_servico = db.query(models.Servico).filter(models.Servico.id == id).first()
    if not db_servico:
        raise HTTPException(404, "Serviço não encontrado")

    db_servico.descricao = servico.descricao
    db_servico.valor_mao_obra = servico.valor_mao_obra
    # Se tiver tempo estimado no schema, atualize aqui também
    
    db.commit()
    db.refresh(db_servico)
    return db_servico

@router.delete("/servicos/{id}")
def remover_servico(id: int, db: Session = Depends(get_db)):
    db_servico = db.query(models.Servico).filter(models.Servico.id == id).first()
    if not db_servico:
        raise HTTPException(404, "Serviço não encontrado")
    
    try:
        db.delete(db_servico)
        db.commit()
        return {"message": "Serviço removido com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(400, "Não é possível excluir: Serviço utilizado em Ordens de Serviço.")