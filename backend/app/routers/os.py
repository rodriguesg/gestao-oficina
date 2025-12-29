from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from .. import models, schemas, security
from ..database import get_db

router = APIRouter(
    prefix="/os", 
    tags=["Ordens de Serviço"],
    dependencies=[Depends(security.get_current_user)]
)

@router.post("/", response_model=schemas.OSResponse)
def abrir_os(os_data: schemas.OSCreate, db: Session = Depends(get_db)):
    veiculo = db.query(models.Veiculo).filter(models.Veiculo.id == os_data.veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")

    mecanico = db.query(models.Mecanico).filter(models.Mecanico.id == os_data.mecanico_id).first()
    if not mecanico:
        raise HTTPException(status_code=404, detail="Mecânico não encontrado")

    try:
        nova_os = models.OrdemServico(
            **os_data.model_dump(),
            cliente_id=veiculo.cliente_id,
            status="ORCAMENTO"
        )
        
        db.add(nova_os)
        db.commit()
        db.refresh(nova_os)
        nova_os.numero_os = nova_os.id 
        
        return nova_os
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao abrir OS: {str(e)}")

@router.get("/", response_model=List[schemas.OSResponse])
def listar_os(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    lista_os = db.query(models.OrdemServico).offset(skip).limit(limit).all()
    
    for os in lista_os:
        os.numero_os = os.id
        
    return lista_os

@router.post("/{os_id}/adicionar-peca")
def adicionar_peca_os(os_id: int, payload: schemas.OSPecaAdd, db: Session = Depends(get_db)):
    os_obj = db.query(models.OrdemServico).filter(models.OrdemServico.id == os_id).first()
    if not os_obj: raise HTTPException(404, "OS não encontrada")

    try:
        novo_item = models.OSPeca(
            ordem_servico_id=os_id, 
            quantidade=payload.quantidade
        )

        if payload.peca_id:
            peca = db.query(models.Peca).filter(models.Peca.id == payload.peca_id).with_for_update().first()
            if not peca: raise HTTPException(404, "Peça não encontrada")
            
            if peca.estoque_atual < payload.quantidade:
                raise HTTPException(400, f"Estoque insuficiente. Disponível: {peca.estoque_atual}")
            
            peca.estoque_atual -= payload.quantidade
            
            novo_item.peca_id = peca.id
            novo_item.valor_unitario = peca.valor_venda
            
        else:
            if not payload.nome_peca or not payload.valor_unitario:
                raise HTTPException(400, "Informe nome e valor para item avulso")
            
            novo_item.peca_id = None
            novo_item.valor_unitario = payload.valor_unitario
        
        db.add(novo_item)
        db.commit()
        
        return {"message": "Item adicionado e estoque atualizado"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
        
    except Exception as e:
        db.rollback()
        raise e

@router.delete("/debug/resetar-itens-os")
def resetar_itens(db: Session = Depends(get_db)):
    try:
        num_rows = db.query(models.OSPeca).delete()
        db.commit()
        return {"status": "sucesso", "itens_removidos": num_rows}
    except Exception as e:
        db.rollback()
        return {"erro": str(e)}

@router.post("/{os_id}/adicionar-servico/")
def adicionar_servico_na_os(os_id: int, item: schemas.OSServicoAdd, db: Session = Depends(get_db)):
    os = db.query(models.OrdemServico).filter(models.OrdemServico.id == os_id).first()
    if not os:
        raise HTTPException(status_code=404, detail="OS não encontrada")
    
    servico = db.query(models.Servico).filter(models.Servico.id == item.servico_id).first()
    if not servico:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
        
    valor_final = item.valor if item.valor is not None else servico.valor_mao_obra

    novo_item_servico = models.OSServico(
        ordem_servico_id=os_id,
        servico_id=item.servico_id,
        quantidade=item.quantidade,
        valor_unitario=valor_final # <--- USA O VALOR FINAL
    )
    
    db.add(novo_item_servico)
    db.commit()
    
    return {"status": "Serviço adicionado", "servico": servico.descricao}

# Mudar Status
@router.patch("/{os_id}/status", response_model=schemas.OSResponse)
def atualizar_status_os(os_id: int, status_data: schemas.OSStatusUpdate, db: Session = Depends(get_db)):
    os = db.query(models.OrdemServico).filter(models.OrdemServico.id == os_id).first()
    if not os:
        raise HTTPException(status_code=404, detail="OS não encontrada")
    
    os.status = status_data.status

    if status_data.status == "FINALIZADO":
        os.data_fechamento = date.today()
        
    db.commit()
    db.refresh(os)
    
    os.numero_os = os.id
    return os

@router.get("/{os_id}/detalhes", response_model=schemas.OSDetalhada)
def ver_detalhes_os(os_id: int, db: Session = Depends(get_db)):
    os = db.query(models.OrdemServico).filter(models.OrdemServico.id == os_id).first()
    if not os:
        raise HTTPException(status_code=404, detail="OS não encontrada")
    
    lista_pecas = []
    total_pecas = 0.0
    for item in os.itens_pecas:
        subtotal = item.quantidade * float(item.valor_unitario)
        total_pecas += subtotal
        lista_pecas.append({
            "peca_id": item.peca_id,
            "quantidade": item.quantidade,
            "valor_unitario": item.valor_unitario,
            "nome_peca": item.peca.nome,
            "subtotal": subtotal
        })

    lista_servicos = []
    total_servicos = 0.0
    for item in os.itens_servicos:
        subtotal = item.quantidade * float(item.valor_unitario)
        total_servicos += subtotal
        lista_servicos.append({
            "servico_id": item.servico_id,
            "quantidade": item.quantidade,
            "valor_unitario": item.valor_unitario,
            "descricao_servico": item.servico.descricao,
            "subtotal": subtotal
        })

    total_pago = 0.0
    lista_pagamentos = []
    for pag in os.pagamentos:
        total_pago += float(pag.valor)
        lista_pagamentos.append(pag)

    total_geral = total_pecas + total_servicos
    saldo_devedor = total_geral - total_pago

    return {
        "id": os.id,
        "km_atual": os.km_atual,
        "defeito_reclamado": os.defeito_reclamado,
        "data_abertura": os.data_abertura,
        "status": os.status,
        "veiculo_id": os.veiculo_id,
        "mecanico_id": os.mecanico_id,
        
        "pecas": lista_pecas,
        "servicos": lista_servicos,
        "pagamentos": lista_pagamentos, # Lista nova
        
        "total_pecas": total_pecas,
        "total_servicos": total_servicos,
        "total_geral": total_geral,
        "total_pago": total_pago,       # Campo calculado
        "saldo_devedor": saldo_devedor  # Campo calculado
    }

@router.delete("/{os_id}/pecas/{peca_id}")
def remover_peca_os(os_id: int, peca_id: int, db: Session = Depends(get_db)):
    item_os = db.query(models.OSPeca).filter(
        models.OSPeca.ordem_servico_id == os_id,
        models.OSPeca.peca_id == peca_id
    ).first()
    
    if not item_os:
        raise HTTPException(status_code=404, detail="Item não encontrado nesta OS")

    peca_estoque = db.query(models.Peca).filter(models.Peca.id == peca_id).first()
    if peca_estoque:
        peca_estoque.estoque_atual += item_os.quantidade

    db.delete(item_os)
    db.commit()
    
    return {"message": "Peça removida e estoque estornado"}

@router.delete("/{os_id}/servicos/{servico_id}")
def remover_servico_os(os_id: int, servico_id: int, db: Session = Depends(get_db)):
    item_os = db.query(models.OSServico).filter(
        models.OSServico.ordem_servico_id == os_id,
        models.OSServico.servico_id == servico_id
    ).first()
    
    if not item_os:
        raise HTTPException(status_code=404, detail="Serviço não encontrado nesta OS")
    
    db.delete(item_os)
    db.commit()
    
    return {"message": "Serviço removido"}
