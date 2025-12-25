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
    db.refresh(db_cliente) # Recarrega o objeto com o ID gerado pelo banco
    
    return db_cliente

@app.get("/clientes/", response_model=List[schemas.ClienteResponse])
def listar_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    cliente = db.query(models.Cliente).offset(skip).limit(limit).all()
    return cliente

@app.get("/clientes/{cliente_id}", response_model=List[schemas.ClienteResponse])
def listar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    clientes = db.query(models.Cliente).filter(models.Cliente.id).all()
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

# --- Rotas de Ordem de Serviço (OS) ---

@app.post("/os/", response_model=schemas.OSResponse)
def abrir_os(os_data: schemas.OSCreate, db: Session = Depends(get_db)):
    # 1. Validar Veículo e pegar o dono atual
    veiculo = db.query(models.Veiculo).filter(models.Veiculo.id == os_data.veiculo_id).first()
    if not veiculo:
        raise HTTPException(status_code=404, detail="Veículo não encontrado")
    
    # 2. Validar Mecânico
    mecanico = db.query(models.Mecanico).filter(models.Mecanico.id == os_data.mecanico_id).first()
    if not mecanico:
        raise HTTPException(status_code=404, detail="Mecânico não encontrado")

    # 3. Criar a OS
    # Note que injetamos o cliente_id que veio do cadastro do veículo
    nova_os = models.OrdemServico(
        defeito_reclamado=os_data.defeito_reclamado,
        km_atual=os_data.km_atual,
        veiculo_id=os_data.veiculo_id,
        mecanico_id=os_data.mecanico_id,
        cliente_id=veiculo.cliente_id,  # <--- Automágico
        status="ORCAMENTO"              # <--- Default
    )
    
    db.add(nova_os)
    db.commit()
    db.refresh(nova_os)
    
    # Pequeno hack para o schema responder 'numero_os' igual ao id
    nova_os.numero_os = nova_os.id 
    
    return nova_os

@app.get("/os/", response_model=List[schemas.OSResponse])
def listar_os(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    lista_os = db.query(models.OrdemServico).offset(skip).limit(limit).all()
    # Mapeando id para numero_os na resposta
    for os in lista_os:
        os.numero_os = os.id
    return lista_os