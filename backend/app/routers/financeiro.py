from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/pagamentos", tags=["Financeiro"])

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