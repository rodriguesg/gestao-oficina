from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from typing import Optional

#Cliente
class ClienteBase(BaseModel):
    nome: str
    telefone: str
    email: Optional[str] = None
    cpf_cnpj: str
    endereco: str

class ClienteCreate(ClienteBase):
    pass 

class ClienteResponse(ClienteBase):
    id: int

    # config permite que o Pydantic leia dados direto do SQLAlchemy
    class Config:
        from_attributes = True

#Veiculo
class VeiculoBase(BaseModel):
    placa: str
    modelo: str
    marca: str
    ano: int
    cor: str

class VeiculoCreate(VeiculoBase):
    cliente_id: int

class VeiculoResponse(VeiculoBase):
    id: int
    cliente_id: int
    
    #incluir dados do dono na resposta
    
    class Config:
        from_attributes = True

#Mecanico
class MecanicoBase(BaseModel):
    nome: str
    especialidade: str

class MecanicoCreate(MecanicoBase):
    pass

class MecanicoResponse(MecanicoBase):
    id: int
    class Config:
        from_attributes = True

#OS
class OSBase(BaseModel):
    defeito_reclamado: str
    km_atual: int

class OSCreate(OSBase):
    veiculo_id: int
    mecanico_id: int

class OSResponse(OSBase):
    id: int
    numero_os: int 
    data_abertura: date
    status: str
    veiculo_id: int
    cliente_id: int
    mecanico_id: int

    class Config:
        from_attributes = True

# Peças
class PecaBase(BaseModel):
    codigo: str
    nome: str
    valor_venda: float
    estoque_atual: int

class PecaCreate(PecaBase):
    pass

class PecaResponse(PecaBase):
    id: int
    class Config:
        from_attributes = True

# Serviços
class ServicoBase(BaseModel):
    descricao: str
    valor_mao_obra: float
    tempo_estimado_minutos: int

class ServicoCreate(ServicoBase):
    pass

class ServicoResponse(ServicoBase):
    id: int
    class Config:
        from_attributes = True

class OSPecaAdd(BaseModel):
    quantidade: int = 1
    peca_id: Optional[int] = None 
    
    nome_peca: Optional[str] = None
    valor_unitario: Optional[float] = None

class OSServicoAdd(BaseModel):
    servico_id: int
    quantidade: int = 1

class OSPecaDetail(BaseModel):
    # O ID pode vir nulo na resposta se foi cadastrado manualmente
    peca_id: Optional[int] = None 
    quantidade: int
    valor_unitario: float
    nome_peca: str
    subtotal: float

# Item de Serviço(os)
class OSServicoDetail(BaseModel):
    servico_id: int
    quantidade: int
    valor_unitario: float
    descricao_servico: str
    subtotal: float

# --- Schemas de Pagamento ---
class PagamentoBase(BaseModel):
    valor: float
    forma_pagamento: str # PIX, CARTAO_CREDITO, DINHEIRO
    parcela: int = 1
    observacao: Optional[str] = None

class PagamentoCreate(PagamentoBase):
    ordem_servico_id: int # Precisamos saber o que está sendo pago

class PagamentoResponse(PagamentoBase):
    id: int
    data_pagamento: date
    class Config:
        from_attributes = True

# --- Schema para Atualizar Status da OS ---
class OSStatusUpdate(BaseModel):
    status: str # Ex: APROVADO, EM_ANDAMENTO, FINALIZADO, CANCELADO

# OS Completa
class OSDetalhada(OSBase):
    id: int
    status: str
    data_abertura: date
    veiculo_id: int
    mecanico_id: int
    
    pecas: List[OSPecaDetail] = []
    servicos: List[OSServicoDetail] = []
    # Lista de pagamentos já feitos
    pagamentos: List[PagamentoResponse] = [] 
    
    # Matemática Financeira
    total_pecas: float
    total_servicos: float
    total_geral: float
    total_pago: float     # Novo
    saldo_devedor: float  # Novo (O quanto falta pagar)

    class Config:
        from_attributes = True
