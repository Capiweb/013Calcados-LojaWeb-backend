# 🔐 Documentação da API de Autenticação

## Endpoints

### 1. Registro de Usuário

**POST** `/api/auth/register`

Registra um novo usuário no sistema.

#### Request Body

```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "confirmPassword": "senha123",
  "address": "Rua Exemplo, 123" // Opcional
}
```

#### Validações

- Nome, email, senha e confirmação de senha são obrigatórios
- Email deve ter formato válido
- Senha deve ter no mínimo 6 caracteres
- Senha e confirmação de senha devem ser iguais
- Email não pode estar já cadastrado

#### Response Success (201)

```json
{
  "message": "Usuário registrado com sucesso",
  "user": {
    "name": "João Silva",
    "email": "joao@example.com"
  }
}
```

#### Response Error (400)

```json
{
  "error": "A senha e a confirmação de senha não coincidem"
}
```

#### Response Error (409)

```json
{
  "error": "Email já está em uso"
}
```

---

### 2. Login

**POST** `/api/auth/login`

Autentica um usuário e retorna um token JWT.

#### Request Body

```json
{
  "email": "joao@example.com",
  "password": "senha123"
}
```

#### Validações

- Email e senha são obrigatórios
- Email deve ter formato válido
- Credenciais devem ser válidas

#### Response Success (200)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "name": "João Silva",
    "email": "joao@example.com",
    "address": "Rua Exemplo, 123"
  }
}
```

#### Response Error (400)

```json
{
  "error": "Email e senha são obrigatórios"
}
```

#### Response Error (401)

```json
{
  "error": "Credenciais inválidas"
}
```

---

## 🔒 Segurança

### Token JWT

- O token JWT é gerado com expiração configurável (padrão: 24h)
- O token contém o ID e email do usuário
- Use o header `Authorization: Bearer <token>` para autenticar requisições protegidas

### Criptografia

- Senhas são criptografadas usando bcrypt com salt rounds de 10
- Senhas nunca são retornadas nas respostas da API

### Variáveis de Ambiente

Certifique-se de configurar as seguintes variáveis no arquivo `.env`:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/calcados_db"
JWT_SECRET="sua-chave-secreta-super-segura-aqui"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV="development"
```

---

## 📝 Notas Importantes

1. **Payload Leve**: O login retorna apenas nome, email e endereço (sem ID, role ou informações internas)
2. **Validações**: Todas as validações são feitas no controller antes de processar a requisição
3. **Códigos de Status**: 
   - 200: Sucesso
   - 201: Criado com sucesso
   - 400: Erro de validação
   - 401: Não autorizado
   - 409: Conflito (email já cadastrado)
   - 500: Erro interno do servidor

---

## 🚀 Próximos Passos

- [ ] Refresh token
- [ ] Middleware de autenticação para rotas protegidas
- [ ] Sistema de permissões
- [ ] Recuperação de senha
- [ ] Verificação de email

