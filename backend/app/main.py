from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas
from .database import get_db

app = FastAPI(title="Gestão de Oficina API")

#Clientes
@app.post("/clientes/", response_model=schemas.ClienteResponse)
def criar_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):
    cliente_existente = db.query(models.Cliente).filter(models.Cliente.cpf_cnpj == cliente.cpf_cnpj).first()
    if cliente_existente:
        raise HTTPException(status_code=400, detail="CPF/CNPJ já cadastrado")
    
    db_cliente = models.Cliente(**cliente.model_dump())

    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    
    return db_cliente

@app.get("/clientes/", response_model=List[schemas.ClienteResponse])
def listar_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).offset(skip).limit(limit).all()
    return cliente

@app.get("/clientes/{cliente_id}", response_model=List[schemas.ClienteResponse])
def listar_cliente(id: int, db: Session = Depends(get_db)):
    clientes = db.query(models.Cliente).filter(models.Cliente.id == id).all()
    return clientes

#Veiculos
@app.post("/veiculos/", response_model=schemas.VeiculoResponse)
def criar_veiculo(veiculo: schemas.VeiculoCreate, db: Session = Depends(get_db)):
    veiculo_existente = db.query(models.Veiculo).filter(models.Veiculo.placa == veiculo.placa).first()
    if veiculo_existente:
        raise HTTPException(status_code=400, detail="Placa já cadastrada")
    
    cliente = db.query(models.Cliente).filter(models.Cliente.id == veiculo.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    db_veiculo = models.Veiculo(**veiculo.model_dump())
    db.add(db_veiculo)
    db.commit()
    db.refresh(db_veiculo)
    
    return db_veiculo

@app.get("/veiculos/", response_model=List[schemas.VeiculoResponse])
def listar_veiculos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    veiculos = db.query(models.Veiculo).offset(skip).limit(limit).all()
    return veiculos

@app.get("/clientes/{cliente_id}/veiculos", response_model=List[schemas.VeiculoResponse])
def listar_veiculos_do_cliente(cliente_id: int, db: Session = Depends(get_db)):
    veiculos = db.query(models.Veiculo).filter(models.Veiculo.cliente_id == cliente_id).all()
    return veiculos

# Mecânico
@app.post("/mecanicos/", response_model=schemas.MecanicoResponse)
def criar_mecanico(mecanico: schemas.MecanicoCreate, db: Session = Depends(get_db)):
    db_mecanico = models.Mecanico(**mecanico.model_dump())
    db.add(db_mecanico)
    db.commit()
    db.refresh(db_mecanico)
    return db_mecanico

@app.get("/mecanicos/", response_model=List[schemas.MecanicoResponse])
def listar_mecanicos(db: Session = Depends(get_db)):
    return db.query(models.Mecanico).all()

# OS

@app.post("/os/", response_model=schemas.OSResponse)
def abrir_os(os_data: schemas.OSCreate, db: Session = Depends(get_db)):
    veiculo = db.query(models.Veiculo).filter(models.Veiculo.id == os_data.veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    mecanico = db.query(models.Mecanico).filter(models.Mecanico.id == os_data.mecanico_id).first()
    if not mecanico:
        raise HTTPException(status_code=404, detail="Mecânico não encontrado")

    nova_os = models.OrdemServico(
        defeito_reclamado=os_data.defeito_reclamado,
        km_atual=os_data.km_atual,
        veiculo_id=os_data.veiculo_id,
        mecanico_id=os_data.mecanico_id,
        cliente_id=veiculo.cliente_id,
        status="ORCAMENTO"              # Default
    )
    
    db.add(nova_os)
    db.commit()
    db.refresh(nova_os)

    nova_os.numero_os = nova_os.id 
    
    return nova_os

@app.get("/os/", response_model=List[schemas.OSResponse])
def listar_os(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    lista_os = db.query(models.OrdemServico).offset(skip).limit(limit).all()

    for os in lista_os:
        os.numero_os = os.id
    return lista_os

# Catalogo (pecas e servicos)

@app.post("/pecas/", response_model=schemas.PecaResponse)
def criar_peca(peca: schemas.PecaCreate, db: Session = Depends(get_db)):
    db_peca = models.Peca(**peca.model_dump())
    db.add(db_peca)
    db.commit()
    db.refresh(db_peca)
    return db_peca

@app.get("/pecas/", response_model=List[schemas.PecaResponse])
def listar_pecas(db: Session = Depends(get_db)):
    return db.query(models.Peca).all()

@app.post("/servicos/", response_model=schemas.ServicoResponse)
def criar_servico(servico: schemas.ServicoCreate, db: Session = Depends(get_db)):
    db_servico = models.Servico(**servico.model_dump())
    db.add(db_servico)
    db.commit()
    db.refresh(db_servico)
    return db_servico

# Adicionar Itens na OS

@app.post("/os/{os_id}/adicionar-peca/")
def adicionar_peca_na_os(os_id: int, item: schemas.OSPecaAdd, db: Session = Depends(get_db)):
    os = db.query(models.OrdemServico).filter(models.OrdemServico.id == os_id).first()
    if not os:
        raise HTTPException(status_code=404, detail="OS não encontrada")
    
    peca = db.query(models.Peca).filter(models.Peca.id == item.peca_id).first()
    if not peca:
        raise HTTPException(status_code=404, detail="Peça não encontrada")
    
    novo_item_os = models.OSPeca(
        ordem_servico_id=os_id,
        peca_id=item.peca_id,
        quantidade=item.quantidade,
        valor_unitario=peca.valor_venda  # <--- O Segredo do ERP está aqui
    )
    
    db.add(novo_item_os)
    db.commit()
    
    return {"status": "Peça adicionada", "item": item.model_dump(), "valor_congelado": peca.valor_venda}

@app.post("/os/{os_id}/adicionar-servico/")
def adicionar_servico_na_os(os_id: int, item: schemas.OSServicoAdd, db: Session = Depends(get_db)):
    os = db.query(models.OrdemServico).filter(models.OrdemServico.id == os_id).first()
    if not os:
        raise HTTPException(status_code=404, detail="OS não encontrada")
    
    servico = db.query(models.Servico).filter(models.Servico.id == item.servico_id).first()
    if not servico:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
        
    novo_item_servico = models.OSServico(
        ordem_servico_id=os_id,
        servico_id=item.servico_id,
        quantidade=item.quantidade,
        valor_unitario=servico.valor_mao_obra
    )
    
    db.add(novo_item_servico)
    db.commit()
    
    return {"status": "Serviço adicionado", "servico": servico.descricao}

# --- Rota de Pagamento ---
@app.post("/pagamentos/", response_model=schemas.PagamentoResponse)
def registrar_pagamento(pagamento: schemas.PagamentoCreate, db: Session = Depends(get_db)):
    # 1. Verifica se a OS existe
    os = db.query(models.OrdemServico).filter(models.OrdemServico.id == pagamento.ordem_servico_id).first()
    if not os:
        raise HTTPException(status_code=404, detail="Ordem de Serviço não encontrada")
    
    # 2. Registra o Pagamento
    novo_pagamento = models.Pagamento(**pagamento.model_dump())
    db.add(novo_pagamento)
    db.commit()
    db.refresh(novo_pagamento)
    
    return novo_pagamento

# --- Rota para Mudar Status (Aprovar/Finalizar) ---
@app.patch("/os/{os_id}/status", response_model=schemas.OSResponse)
def atualizar_status_os(os_id: int, status_data: schemas.OSStatusUpdate, db: Session = Depends(get_db)):
    os = db.query(models.OrdemServico).filter(models.OrdemServico.id == os_id).first()
    if not os:
        raise HTTPException(status_code=404, detail="OS não encontrada")
    
    os.status = status_data.status
    
    # Se finalizar, poderiamos preencher a data de fechamento automaticamente
    if status_data.status == "FINALIZADO":
        os.data_fechamento = func.now()
        
    db.commit()
    db.refresh(os)
    
    # Hack do numero_os novamente
    os.numero_os = os.id
    return os

# --- ATUALIZAÇÃO DA ROTA DE DETALHES (Substitua a anterior) ---
@app.get("/os/{os_id}/detalhes", response_model=schemas.OSDetalhada)
def ver_detalhes_os(os_id: int, db: Session = Depends(get_db)):
    os = db.query(models.OrdemServico).filter(models.OrdemServico.id == os_id).first()
    if not os:
        raise HTTPException(status_code=404, detail="OS não encontrada")
    
    # 1. Cálculos de Peças e Serviços (Igual antes)
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

    # 2. NOVO: Cálculo dos Pagamentos
    total_pago = 0.0
    lista_pagamentos = []
    for pag in os.pagamentos:
        total_pago += float(pag.valor)
        lista_pagamentos.append(pag)

    total_geral = total_pecas + total_servicos
    saldo_devedor = total_geral - total_pago

    # 3. Resposta
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