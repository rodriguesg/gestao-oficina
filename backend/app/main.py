from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import clientes, veiculos, mecanicos, os, estoque, financeiro, auth

app = FastAPI(title="Gestão de Oficina API")

origins = ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra as rotas
app.include_router(clientes.router)
app.include_router(veiculos.router)
app.include_router(mecanicos.router)
app.include_router(os.router)
app.include_router(estoque.router)
app.include_router(financeiro.router)
app.include_router(auth.router)

@app.get("/")
def root():
    return {"status": "Sistema Operacional", "version": "1.0.0"}