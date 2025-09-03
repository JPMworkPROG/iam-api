# 📚 Documentação da API

Esta pasta contém a especificação completa da API REST usando o padrão OpenAPI 3.0.3.

## 📁 Estrutura

```
documentation/
├── README.md              # Este arquivo - guia da documentação
├── openapi.yaml          # Especificação completa da API OpenAPI 3.0.3
└── insomnia-collection.json # Coleção Insomnia para testes da API
```

## Endpoints da API

### Autenticação
```http
POST /auth/register    # Cadastro de usuário
POST /auth/login       # Login com email/senha
POST /auth/refresh     # Renovação do access token
```

### Usuários
```http
GET    /users/me       # Perfil do usuário logado
GET    /users          # Listar usuários com paginação (admin)
GET    /users/:id      # Obter usuário específico
POST   /users          # Criar usuário (admin)
PATCH  /users/:id      # Atualizar usuário
DELETE /users/:id      # Excluir usuário (admin)
```

## 🔍 Como Visualizar a Documentação

### 1. Swagger UI Online
Copie o conteúdo do arquivo `openapi.yaml` e cole em:
- **Swagger Editor**: https://editor.swagger.io/

### 2. VS Code
Instale as extensões:
- **Swagger Viewer** - Para visualizar specs OpenAPI

### 3. Integração com NestJS (Recomendado)
Execute o projeto com o comando:
```bash
npm run start:dev
```
Acesse: `http://localhost:8080/api/docs`

### 4. Insomnia REST Client
Importe o arquivo `insomnia-collection.json` no Insomnia para:
- ✅ Testes automáticos da API
- 🔄 Scripts after-response para workflow contínuo
- 🏃‍♂️ Environment variables dinâmicas
- 📋 Coleção completa de endpoints

---

Esta documentação serve como **contrato da API** e pode ser usada para:
- 🤝 **Comunicação** entre frontend e backend
- 🧪 **Testes** manuais e automatizados  
- 📖 **Onboarding** de novos desenvolvedores
- 🔄 **Geração** de clientes automáticos
- ✅ **Validação** de implementação
