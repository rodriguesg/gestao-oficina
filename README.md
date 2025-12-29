# gestao-oficina
software para gestao de oficina

fastapi: O framework da API.

uvicorn[standard]: O servidor web que roda o Python. O [standard] já instala extras para rodar mais rápido.

sqlalchemy: O ORM (o tradutor Python <-> Banco de Dados).

psycopg2-binary: O motorista (driver) que ensina o SQLAlchemy a falar a língua do PostgreSQL.

alembic: Ferramenta de migração. É ela que vai ler seu models.py e criar as tabelas no banco automaticamente (essencial para não ficar rodando CREATE TABLE na mão).

pydantic-settings: O jeito moderno de ler variáveis de ambiente (.env) para pegar a senha do banco com segurança.



# System design

Padrão Arquitetural: Monolito Modular (Backend único em FastAPI, dividido em routers).

Comunicação: REST API (JSON) entre Frontend (React) e Backend.

Infraestrutura: Containerização via Docker
