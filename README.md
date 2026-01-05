# 013 Calçados - Backend

Template inicial para API backend de e-commerce de tênis. Este é um boilerplate base que **pode ou não ser usado** no projeto final.

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- PostgreSQL
- npm

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Capiweb/013Calcados-LojaWeb-backend.git
cd 013calcados-back

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Configure o banco de dados
npx prisma migrate dev

# Inicie o servidor
npm start
```

## 📁 Estrutura Base

```
src/
├── controllers/      # Controladores
├── middleware/       # Middlewares
├── routes/          # Rotas
├── service/         # Lógica de negócio
prisma/
├── schema.prisma    # Schema do banco
└── migrations/      # Migrações
index.js             # Entry point
package.json
.env                 # Variáveis de ambiente
```

## 🔧 Stack Tecnológico

- Express.js
- Prisma ORM
- PostgreSQL
- JWT + Bcrypt
- CORS, Cookie Parser
- dotenv

## 📝 Variáveis de Ambiente

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/calcados_db"
JWT_SECRET="sua-chave-secreta"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN_PROD="https://seu-dominio.com"
```

## 📖 Documentação Completa

Para detalhes sobre funcionalidades, roadmap e arquitetura do projeto:

- **Tarefas**: [Freedcamp](https://freedcamp.com/view/3693377/tasks/panel/task/68743767)
- **Fluxograma**: Excalidraw anexado no Freedcamp

---

**Template Base v1.0** | Janeiro 2026
