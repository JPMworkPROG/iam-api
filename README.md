# API REST com Autenticação JWT (NestJS + TypeScript)

## Proposta
API REST moderna para demonstrar autenticação JWT, CRUD de usuários, validação de dados e testes automatizados. Projeto focado em arquitetura escalável e boas práticas com NestJS.

## Tecnologias
- **NestJS 11+** (Node.js + TypeScript)
- **JWT** (access + refresh tokens) com Passport
- **Prisma ORM** + PostgreSQL
- **Class-validator + Class-transformer**
- **Bcrypt** (hash de senhas)
- **Jest + Supertest** (testes)
- **Swagger/OpenAPI 3.0.3** (documentação automática)
- **ESLint** + Prettier (qualidade de código)

## Arquitetura
Arquitetura modular do NestJS com injeção de dependência nativa:
- **Modules**: organização em módulos funcionais (Auth, Users, Config, Database)
- **Controllers**: endpoints HTTP com decorators (@Get, @Post, etc.)
- **Services**: lógica de negócio injetada via @Injectable()
- **Guards**: autenticação JWT e autorização por roles
- **Interceptors**: logging automático e transformação de respostas
- **Pipes**: validação e transformação de dados (customizados + class-validator)
- **Filters**: tratamento global de exceções (HTTP, Prisma, Validação)
- **Decorators**: metadata customizada (@CurrentUser, @Roles)

## Padrões Aplicados
- **Dependency Injection** nativo do NestJS
- **Decorator Pattern** para metadata e configuração
- **Module Pattern** para organização e encapsulamento
- **Strategy Pattern** para autenticação (Passport)
- **Repository Pattern** com Prisma Service

## 🚀 Endpoints da API
**📚 Documentação completa:** `http://localhost:8080/api/docs`

## Como Executar

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# 3. Setup completo do banco de dados
npm run db:setup

# 4. Executar em desenvolvimento
npm run start:dev

# 5. Executar testes
npm run test          # Testes unitários
npm run test:e2e      # Testes de integração
npm run test:cov      # Cobertura de testes
```

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento
npm run start         # Produção
npm run start:dev     # Desenvolvimento (watch mode)
npm run start:debug   # Debug mode

# Build e Deploy
npm run build         # Compilar para produção
npm run format        # Formatar código
npm run lint          # Linter

# Banco de Dados
npm run db:setup      # Setup completo (generate + migrate + seed)
npm run prisma:studio # Interface visual do banco
npm run prisma:reset  # Reset completo (CUIDADO!)

# Testes
npm run test:watch    # Testes em watch mode
npm run test:debug    # Debug de testes
```

## Objetivos do Projeto

Este projeto demonstra:

✅ **Arquitetura NestJS** - Framework modular e escalável  
✅ **Injeção de Dependência** - IoC container nativo  
✅ **Decorators & Metadata** - Programação declarativa  
✅ **Guards & Interceptors** - AOP para cross-cutting concerns  
✅ **Autenticação JWT** - Access + refresh tokens com Passport  
✅ **Validação Avançada** - Pipes customizados + class-validator  
✅ **Exception Filters** - Tratamento global de erros estruturado  
✅ **Documentação OpenAPI** - Swagger UI automático  
✅ **Testes Completos** - Unit + E2E + cobertura  
✅ **TypeScript Avançado** - Tipos, decorators e metadata  
✅ **Configuração Robusta** - Validação de env vars com env-var  
✅ **Logging Automático** - Interceptor para monitoramento  

## 📚 Documentação Adicional

### **Guias Específicos**
- 🗄️ **[Banco de Dados](./prisma/README.md)** - Setup, migrations, seeds e troubleshooting
- 📖 **[Documentação da API](./documentation/README.md)** - Como visualizar e usar a especificação OpenAPI

## Referências Técnicas
- [NestJS](https://nestjs.com/) - Framework Node.js progressivo
- [Passport](http://www.passportjs.org/) - Middleware de autenticação
- [Class-validator](https://github.com/typestack/class-validator) - Validação baseada em decorators
- [Prisma](https://www.prisma.io/) - ORM moderno e type-safe
- [JWT](https://jwt.io/) - JSON Web Tokens
- [Jest](https://jestjs.io/) - Framework de testes
