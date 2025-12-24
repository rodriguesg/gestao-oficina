from pydantic import BaseModel
from typing import Optional

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