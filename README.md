# StockFlow

> Plataforma multi-loja de controle de inventário e vendas, com isolamento por vendedor, histórico completo e deploy em nuvem.

---

## Sobre o projeto

StockFlow é uma aplicação web full-stack voltada para o gerenciamento de estoques e vendas em ambientes com múltiplos pontos de venda. Cada vendedor opera em um espaço isolado, com seus próprios produtos, configurações visuais e histórico de transações.

O sistema foi projetado para ser leve, rápido e totalmente operável via navegador — sem dependência de software instalado. A arquitetura desacopla frontend e backend, permitindo escalabilidade e deploy independente em plataformas gratuitas ou de baixo custo.

---

## Tecnologias utilizadas

### Frontend
- **Angular 17** — framework principal com TypeScript
- **Angular CLI** — build e scaffolding
- **Vercel** — hospedagem do frontend

### Backend
- **Node.js + Express** — servidor REST API
- **SQLite** (local) / **Turso** (cloud) — banco de dados
- **Fly.io** — hospedagem do backend

### Outros
- Script `.bat` para inicialização local no Windows
- Proxy reverso configurado no Fly.io para comunicação entre camadas

---

## Funcionalidades

- **Arquitetura multi-vendedor** — cada loja possui dados completamente isolados, sem interferência entre vendedores distintos
- **Logo e configurações por loja** — upload de imagem com armazenamento em base64 e personalização visual por vendedor
- **Histórico de vendas** — registro completo de transações com suporte a exclusão e auditoria por loja
- **Script de inicialização** — arquivo `.bat` para Windows que sobe frontend e backend com um único clique
- **Deploy em nuvem gratuito** — frontend no Vercel, backend no Fly.io e banco de dados no Turso
- **Proxy reverso configurado** — resolução de erros 502 e comunicação estável entre as camadas

---

## Arquitetura

```
┌─────────────────────┐        ┌─────────────────────┐
│      Frontend       │        │       Backend        │
│                     │        │                      │
│   Angular 17 (TS)   │ ──────▶│  Node.js + Express   │
│   Hospedado: Vercel │        │  Hospedado: Fly.io   │
└─────────────────────┘        └──────────┬──────────┘
                                          │
                               ┌──────────▼──────────┐
                               │      Banco de Dados  │
                               │   SQLite / Turso     │
                               └─────────────────────┘
```

---

## Como rodar localmente

### Pré-requisitos

- Node.js instalado
- Angular CLI instalado globalmente (`npm install -g @angular/cli`)

### Inicialização

Na raiz do projeto, execute o script de inicialização:

```bat
start.bat
```

Isso irá subir o backend (Node.js/Express) e o frontend (Angular) simultaneamente.

Ou manualmente:

```bash
# Backend
cd backend
npm install
node index.js

# Frontend (em outro terminal)
cd frontend
npm install
ng serve
```

---

## Deploy

| Camada   | Plataforma | Observações                        |
|----------|------------|------------------------------------|
| Frontend | Vercel     | Deploy automático via Git          |
| Backend  | Fly.io     | Proxy reverso configurado          |
| Banco    | Turso      | Cloud SQLite, free tier disponível |

---

## Estrutura do projeto

```
C:\stockflow\
├── frontend/        # Aplicação Angular 17
│   ├── src/
│   └── angular.json
├── backend/         # API Node.js + Express
│   ├── routes/
│   ├── db/
│   └── index.js
├── start.bat        # Script de inicialização Windows
└── README.md
```

---

## Autor

Desenvolvido por **Lucas** — [Portfólio](https://lukkidev.vercel.app)
