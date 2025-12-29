from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import date
from .. import models, schemas, security
from ..database import get_db

router = APIRouter(
    prefix="/pagamentos", 
    tags=["Financeiro"],
    dependencies=[Depends(security.get_current_user)]
)

@router.post("/", response_model=schemas.PagamentoResponse)
def registrar_pagamento(pagamento: schemas.PagamentoCreate, db: Session = Depends(get_db)):
    os = db.query(models.OrdemServico).filter(models.OrdemServico.id == pagamento.ordem_servico_id).first()
    if not os: raise HTTPException(404, "OS não encontrada")

    try:
        novo_pagamento = models.Pagamento(**pagamento.model_dump())
        db.add(novo_pagamento)
        db.flush()

        total_pecas = sum(i.quantidade * float(i.valor_unitario) for i in os.itens_pecas)
        total_servicos = sum(i.quantidade * float(i.valor_unitario) for i in os.itens_servicos)
        total_pago = sum(float(p.valor) for p in os.pagamentos) + float(novo_pagamento.valor)
        
        total_geral = total_pecas + total_servicos

        if total_pago >= (total_geral - 0.01):
            if os.status != "FINALIZADO":
                os.status = "FINALIZADO"
                os.data_fechamento = date.today()
        
        db.commit()
        db.refresh(novo_pagamento)
        return novo_pagamento
        
    except Exception as e:
        db.rollback()
        raise e

@router.get("/", response_model=List[schemas.PagamentoResponse])
def listar_pagamentos(db: Session = Depends(get_db)):
    return db.query(models.Pagamento).order_by(models.Pagamento.data_pagamento.desc()).all()

@router.get("/resumo", response_model=schemas.ResumoFinanceiro)
def obter_resumo(db: Session = Depends(get_db)):
    valor_receitas = db.query(func.sum(models.Pagamento.valor)).scalar()
    receitas = float(valor_receitas) if valor_receitas else 0.0
    
    valor_despesas = db.query(func.sum(models.Despesa.valor)).scalar()
    despesas = float(valor_despesas) if valor_despesas else 0.0
    
    saldo = receitas - despesas

    return {
        "total_receitas": receitas,
        "total_despesas": despesas,
        "saldo": saldo
    }

# --- ROTAS DE DESPESAS (SAÍDAS) ---
@router.post("/despesas/", response_model=schemas.DespesaResponse)
def registrar_despesa(despesa: schemas.DespesaCreate, db: Session = Depends(get_db)):
    nova_despesa = models.Despesa(**despesa.model_dump())
    if despesa.status == "PAGO":
        nova_despesa.data_pagamento = date.today()
        
    db.add(nova_despesa)
    db.commit()
    db.refresh(nova_despesa)
    return nova_despesa

@router.get("/despesas/", response_model=List[schemas.DespesaResponse])
def listar_despesas(db: Session = Depends(get_db)):
    return db.query(models.Despesa).order_by(models.Despesa.data_vencimento.desc()).all()

@router.delete("/despesas/{id}")
def remover_despesa(id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.require_role(["ADMIN"]))):
    despesa = db.query(models.Despesa).filter(models.Despesa.id == id).first()
    if not despesa: raise HTTPException(404, "Despesa não encontrada")

    print(f"Auditoria: Usuário {current_user.username} (ID: {current_user.id}) está removendo a despesa {id}")

    db.delete(despesa)
    db.commit()
    return {"message": "Removido"}