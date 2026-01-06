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
│   ├── auth.controller.js  # Controller de autenticação
│   └── user.js             # Controller de usuários
├── middleware/       # Middlewares
│   └── authMiddleware.js  # Middleware de autenticação JWT
├── repositories/     # Repositórios (acesso ao banco)
│   └── user.repository.js
├── routes/          # Rotas
│   ├── auth.routes.js     # Rotas de autenticação
│   └── user.routes.js     # Rotas de usuários
└── service/         # Lógica de negócio
    ├── auth.service.js    # Service de autenticação
    └── user.js            # Service de usuários
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
JWT_SECRET="sua-chave-secreta-super-segura-aqui"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN_PROD="https://seu-dominio.com"
```

⚠️ **Importante**: Configure o `JWT_SECRET` com uma chave segura e única antes de iniciar o servidor.

## 🔐 Autenticação

O sistema possui um fluxo completo de autenticação com registro e login de usuários.

### Endpoints de Autenticação

- **POST** `/api/auth/register` - Registro de novo usuário
- **POST** `/api/auth/login` - Login e obtenção de token JWT

### Características

- ✅ Criptografia de senhas com bcrypt
- ✅ Validação de dados de entrada
- ✅ Geração de token JWT com expiração configurável
- ✅ Respostas enxutas (sem dados sensíveis)
- ✅ Códigos de status HTTP adequados (400, 401, 409)

Para mais detalhes, consulte [AUTH_API.md](./AUTH_API.md)

## 📖 Documentação Completa

Para detalhes sobre funcionalidades, roadmap e arquitetura do projeto:

- **Tarefas**: [Freedcamp](https://freedcamp.com/view/3693377/tasks/panel/task/68743767)
- **Fluxograma**: Excalidraw anexado no Freedcamp

---

**Template Base v1.0** | Janeiro 2026
