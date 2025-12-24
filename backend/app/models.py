from datetime import date, datetime
from typing import List, Optional
from sqlalchemy import String, Integer, ForeignKey, Numeric, Date, Boolean, DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func

# Classe Base do SQLAlchemy 2.0
class Base(DeclarativeBase):
    pass

# Tabelas Associativas (N:N com atributos extras)

class OSPeca(Base):
    __tablename__ = 'os_peca'

    ordem_servico_id: Mapped[int] = mapped_column(ForeignKey('ordem_servico.id'), primary_key=True)
    peca_id: Mapped[int] = mapped_column(ForeignKey('peca.id'), primary_key=True)
    
    quantidade: Mapped[int] = mapped_column(Integer, default=1)
    valor_unitario: Mapped[float] = mapped_column(Numeric(10, 2))

    # Relacionamentos para navegação
    peca: Mapped["Peca"] = relationship(back_populates="os_associadas")
    os: Mapped["OrdemServico"] = relationship(back_populates="itens_pecas")

class OSServico(Base):
    __tablename__ = 'os_servico'

    ordem_servico_id: Mapped[int] = mapped_column(ForeignKey('ordem_servico.id'), primary_key=True)
    servico_id: Mapped[int] = mapped_column(ForeignKey('servico.id'), primary_key=True)
    
    quantidade: Mapped[int] = mapped_column(Integer, default=1)
    valor_unitario: Mapped[float] = mapped_column(Numeric(10, 2))

    servico: Mapped["Servico"] = relationship(back_populates="os_associadas")
    os: Mapped["OrdemServico"] = relationship(back_populates="itens_servicos")

# Tabelas Principais

class Cliente(Base):
    __tablename__ = 'cliente'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100))
    telefone: Mapped[str] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(100))
    cpf_cnpj: Mapped[str] = mapped_column(String(20), unique=True)
    endereco: Mapped[str] = mapped_column(String(255))
    
    # Relacionamento 1:N
    veiculos: Mapped[List["Veiculo"]] = relationship(back_populates="cliente")

class Veiculo(Base):
    __tablename__ = 'veiculo'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    placa: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    modelo: Mapped[str] = mapped_column(String(50))
    marca: Mapped[str] = mapped_column(String(50))
    ano: Mapped[int] = mapped_column(Integer)
    cor: Mapped[str] = mapped_column(String(30))
    
    cliente_id: Mapped[int] = mapped_column(ForeignKey('cliente.id'))
    
    cliente: Mapped["Cliente"] = relationship(back_populates="veiculos")
    ordens_servico: Mapped[List["OrdemServico"]] = relationship(back_populates="veiculo")

class Mecanico(Base):
    __tablename__ = 'mecanico'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(100))
    especialidade: Mapped[str] = mapped_column(String(50))

class Peca(Base):
    __tablename__ = 'peca'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    codigo: Mapped[str] = mapped_column(String(50), unique=True)
    nome: Mapped[str] = mapped_column(String(100))
    valor_venda: Mapped[float] = mapped_column(Numeric(10, 2))
    estoque_atual: Mapped[int] = mapped_column(Integer)

    os_associadas: Mapped[List["OSPeca"]] = relationship(back_populates="peca")

class Servico(Base):
    __tablename__ = 'servico'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    descricao: Mapped[str] = mapped_column(String(255))
    valor_mao_obra: Mapped[float] = mapped_column(Numeric(10, 2))
    tempo_estimado_minutos: Mapped[int] = mapped_column(Integer)

    os_associadas: Mapped[List["OSServico"]] = relationship(back_populates="servico")

class OrdemServico(Base):
    __tablename__ = 'ordem_servico'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    data_abertura: Mapped[date] = mapped_column(Date, default=func.now())
    data_fechamento: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="ORCAMENTO") # Idealmente usar Enum
    km_atual: Mapped[int] = mapped_column(Integer)
    defeito_reclamado: Mapped[str] = mapped_column(String(255))

    # Chaves Estrangeiras
    cliente_id: Mapped[int] = mapped_column(ForeignKey('cliente.id'))
    veiculo_id: Mapped[int] = mapped_column(ForeignKey('veiculo.id'))
    mecanico_id: Mapped[int] = mapped_column(ForeignKey('mecanico.id'))

    # Relacionamentos
    veiculo: Mapped["Veiculo"] = relationship(back_populates="ordens_servico") # Correcao da linha acima
    
    # Relacionamentos M:N (Acesso aos itens)
    itens_pecas: Mapped[List["OSPeca"]] = relationship(back_populates="os")
    itens_servicos: Mapped[List["OSServico"]] = relationship(back_populates="os")
    
    # Relacionamento 1:N com Pagamento (Ajuste que conversamos)
    pagamentos: Mapped[List["Pagamento"]] = relationship(back_populates="os")

class Pagamento(Base):
    __tablename__ = 'pagamento'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    ordem_servico_id: Mapped[int] = mapped_column(ForeignKey('ordem_servico.id'))
    
    data_pagamento: Mapped[date] = mapped_column(Date, default=func.now())
    valor: Mapped[float] = mapped_column(Numeric(10, 2))
    forma_pagamento: Mapped[str] = mapped_column(String(50)) # Ex: PIX, CREDITO
    parcela: Mapped[int] = mapped_column(Integer, default=1)
    observacao: Mapped[Optional[str]] = mapped_column(String(200))

    os: Mapped["OrdemServico"] = relationship(back_populates="pagamentos")

# Pequena correção na classe Veiculo que citei acima:
# Onde está: ordens_servico: Mapped[List["OrdemServico"]] = mapped_column(...)
# O correto é: ordens_servico: Mapped[List["OrdemServico"]] = relationship(back_populates="veiculo")