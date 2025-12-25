from pydantic import BaseModel
from typing import Optional
from datetime import date

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