# 🌟 Guia de Testes - Sistema de Avaliação de Produtos

## 📋 Pré-requisitos

1. **Token JWT válido** - Você precisa estar autenticado
2. **ID de Produto** - Um produto que você comprou
3. **Estar no banco de dados como cliente que fez uma compra**

---

## 🔑 Autenticação

Primeiro, faça login para obter o token:

```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "seu_email@example.com",
  "senha": "sua_senha"
}
```

**Resposta:**
```json
{
  "token": "seu_token_jwt_aqui"
}
```

Copie o token JWT para usar nos próximos requests.

---

## ⭐ Endpoints de Avaliação

### 1️⃣ Criar Avaliação (POST)

**Endpoint:**
```
POST http://localhost:3000/api/feedback
Authorization: Bearer seu_token_jwt
Content-Type: application/json
```

**Exemplo 1 - Avaliação com 4.5 estrelas e comentário:**
```json
{
  "produtoId": "550e8400-e29b-41d4-a716-446655440000",
  "estrelas": 4.5,
  "comentario": "Produto excelente! Chegou rápido e muito bom mesmo."
}
```

**Exemplo 2 - Avaliação com 5.0 estrelas sem comentário:**
```json
{
  "produtoId": "550e8400-e29b-41d4-a716-446655440000",
  "estrelas": 5.0
}
```

**Exemplo 3 - Avaliação com 3.5 estrelas (feedback construtivo):**
```json
{
  "produtoId": "550e8400-e29b-41d4-a716-446655440000",
  "estrelas": 3.5,
  "comentario": "Produto ok, mas a qualidade poderia ser melhor."
}
```

**Valores válidos de estrelas:**
- 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5

**Respostas possíveis:**

✅ **201 Created** - Sucesso:
```json
{
  "message": "Avaliação criada com sucesso",
  "feedback": {
    "id": "uuid-do-feedback",
    "usuarioId": "uuid-usuario",
    "produtoId": "uuid-produto",
    "estrelas": 4.5,
    "comentario": "Produto excelente!",
    "criadoEm": "2026-01-14T10:30:00Z",
    "atualizadoEm": "2026-01-14T10:30:00Z",
    "usuario": {
      "id": "uuid-usuario",
      "nome": "João Silva"
    }
  }
}
```

❌ **400 Bad Request** - Dados inválidos:
```json
{
  "error": "Avaliação deve ser em incrementos de 0.5 (ex: 1.0, 1.5, 2.0, ...)"
}
```

❌ **401 Unauthorized** - Não autenticado:
```json
{
  "error": "Token não fornecido ou inválido"
}
```

❌ **403 Forbidden** - Não comprou o produto:
```json
{
  "error": "Você precisa ter comprado o produto para avaliá-lo"
}
```

❌ **404 Not Found** - Produto não existe:
```json
{
  "error": "Produto não encontrado"
}
```

❌ **409 Conflict** - Já avaliou este produto:
```json
{
  "error": "Você já avaliou este produto"
}
```

---

### 2️⃣ Listar Avaliações do Produto (GET)

**Endpoint:**
```
GET http://localhost:3000/api/feedback/product/550e8400-e29b-41d4-a716-446655440000
```

**Com paginação:**
```
GET http://localhost:3000/api/feedback/product/550e8400-e29b-41d4-a716-446655440000?page=1&limit=10
```

**Resposta 200 OK:**
```json
{
  "feedbacks": [
    {
      "id": "uuid-feedback-1",
      "usuarioId": "uuid-usuario-1",
      "produtoId": "550e8400-e29b-41d4-a716-446655440000",
      "estrelas": 5.0,
      "comentario": "Excelente produto!",
      "criadoEm": "2026-01-14T10:30:00Z",
      "atualizadoEm": "2026-01-14T10:30:00Z",
      "usuario": {
        "id": "uuid-usuario-1",
        "nome": "João Silva"
      }
    },
    {
      "id": "uuid-feedback-2",
      "usuarioId": "uuid-usuario-2",
      "produtoId": "550e8400-e29b-41d4-a716-446655440000",
      "estrelas": 4.5,
      "comentario": "Bom, mas poderia melhorar",
      "criadoEm": "2026-01-14T09:15:00Z",
      "atualizadoEm": "2026-01-14T09:15:00Z",
      "usuario": {
        "id": "uuid-usuario-2",
        "nome": "Maria Santos"
      }
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

---

### 3️⃣ Estatísticas de Avaliação (GET)

**Endpoint:**
```
GET http://localhost:3000/api/feedback/product/550e8400-e29b-41d4-a716-446655440000/stats
```

**Resposta 200 OK:**
```json
{
  "media": 4.75,
  "total": 4,
  "distribution": {
    "0.5": 0,
    "1.0": 0,
    "1.5": 0,
    "2.0": 0,
    "2.5": 0,
    "3.0": 0,
    "3.5": 0,
    "4.0": 0,
    "4.5": 2,
    "5.0": 2,
    "5.5": 0
  }
}
```

---

## 🔄 Fluxo Completo de Teste

### Passo 1: Login
```
POST http://localhost:3000/api/auth/login
```
→ Copie o token

### Passo 2: Criar uma avaliação
```
POST http://localhost:3000/api/feedback
Authorization: Bearer {token}
```
```json
{
  "produtoId": "seu-produto-id",
  "estrelas": 4.5,
  "comentario": "Produto muito bom!"
}
```

### Passo 3: Listar avaliações do produto
```
GET http://localhost:3000/api/feedback/product/seu-produto-id
```

### Passo 4: Ver estatísticas
```
GET http://localhost:3000/api/feedback/product/seu-produto-id/stats
```

### Passo 5: Tentar criar outra avaliação (deve falhar)
```
POST http://localhost:3000/api/feedback
Authorization: Bearer {token}
```
```json
{
  "produtoId": "seu-produto-id",
  "estrelas": 3.0,
  "comentario": "Segunda avaliação"
}
```
→ Deve retornar **409 Conflict**: "Você já avaliou este produto"

---

## 📝 Dicas para Testes

1. **Valores de Estrelas Válidos**: 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5

2. **Teste com diferentes usuários**: Se você tem acesso a múltiplas contas, teste o mesmo produto com diferentes usuários

3. **Teste o erro 403**: Tente avaliar um produto que você NÃO comprou

4. **Teste comentários opcionais**: Envie avaliações com e sem comentários

5. **Verifique a média**: Após criar múltiplas avaliações, verifique se a média no endpoint `/stats` está correta

---

## 🧪 Importar no Postman

Você pode importar esta coleção no Postman:

1. Copie o arquivo `013_Calcados_Feedback.postman_collection.json` para o Postman
2. Ou crie manualmente os requests conforme os exemplos acima

Boa sorte nos testes! 🚀
