import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("A variável DATABASE_URL não foi encontrada no arquivo .env")

engine = create_engine(DATABASE_URL)

# SessionLocal será usada para criar uma sessão de banco para cada requisição da API.
# autocommit=False: Garante que só salvamos se dermos 'commit' explícito (segurança).
# autoflush=False: Evita que o SQLAlchemy mande dados pro banco antes da hora.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()