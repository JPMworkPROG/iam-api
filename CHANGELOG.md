# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-09-02

### Adicionado
- **Sistema de Autenticação JWT completo**
  - Endpoints de registro, login e refresh de tokens
  - Access tokens e refresh tokens com expiração configurável
  - Hash seguro de senhas com bcrypt e salt rounds configurável
  - Estratégia JWT com Passport.js
  - Guards de autenticação (`JwtAuthGuard`) e autorização (`RolesGuard`)
  - Decorators customizados (`@CurrentUser`, `@Roles`)

- **CRUD completo de Usuários**
  - Endpoints para perfil do usuário (`GET /users/me`)
  - Listagem de usuários com paginação (`GET /users`)
  - Busca de usuário específico (`GET /users/:id`)
  - Criação de usuários (`POST /users`)
  - Atualização de usuários (`PATCH /users/:id`)
  - Remoção de usuários (`DELETE /users/:id`)
  - Controle de acesso baseado em roles (USER/ADMIN)
  - Exclusão automática de senhas nas respostas da API

- **Pipes customizados para validação avançada**
  - `TrimPipe` - Remove espaços em branco recursivamente em objetos
  - `ParsePositiveIntPipe` - Valida números inteiros positivos
  - `ParseOptionalIntPipe` - Valida números opcionais com range configurável
  - `EmailNormalizationPipe` - Normaliza emails (lowercase, trim)
  - `PasswordValidationPipe` - Validação avançada de senhas com critérios configuráveis

- **Sistema de Exception Filters globais**
  - `HttpExceptionFilter` - Tratamento padrão de exceções HTTP
  - `PrismaExceptionFilter` - Mapeamento específico de erros do Prisma
  - `ValidationExceptionFilter` - Formatação de erros de validação
  - Ordem específica de aplicação dos filtros

- **Sistema de Interceptors**
  - `LoggingInterceptor` - Log automático de todas as requisições
  - Monitoramento de tempo de resposta e performance
  - Informações de usuário autenticado nos logs

- **Suite completa de testes**
  - Testes unitários para AuthService (12 testes)
  - Testes unitários para UsersService (21 testes)
  - Testes unitários para Pipes customizados (24 testes)
  - Testes E2E para autenticação (8 testes)
  - Testes E2E para usuários (15 testes)
  - Mocking avançado do Prisma e dependências

- **Scripts NPM organizados**
  - Scripts de desenvolvimento (`start:dev`, `start:debug`)
  - Scripts de teste (`test`, `test:e2e`, `test:cov`)
  - Scripts de banco (`db:setup`, `prisma:studio`)
  - Scripts de qualidade (`lint`, `format`)

### Modificado
- Estrutura de projeto seguindo padrões NestJS modernos
- Organização modular com separação clara de responsabilidades
- Arquitetura escalável com Dependency Injection nativo

## [1.0.0] - 2024-09-01

### Adicionado
- **Configuração robusta de ambiente**
  - Validação automática de variáveis obrigatórias com `env-var`
  - Configuração centralizada em `src/config/configuration.ts`
  - Tratamento de erro para variáveis ausentes ou inválidas

- **Integração completa com PostgreSQL**
  - Schema Prisma com modelo `User` e enum `Role`
  - Sistema de migrações automáticas
  - Script de seed com usuários de teste
  - Comando `npm run db:setup` para configuração completa

- **Documentação Swagger/OpenAPI 3.0.3**
  - Interface interativa em `/api/docs`
  - Documentação automática de todos os endpoints
  - Exemplos detalhados de requisições e respostas
  - Schemas de erro documentados

- **Ferramentas de desenvolvimento**
  - Coleção Insomnia com scripts after-response automáticos
  - Environment variables dinâmicas para fluxo contínuo de testes
  - Configuração ESLint + Prettier para qualidade de código

## [1.0.0] - 2024-08-30

### Adicionado
- Configuração inicial do projeto NestJS 11+
- Estrutura base com TypeScript 5.7
- Configuração do Prisma ORM
- Setup inicial do PostgreSQL
- Configuração básica do Jest para testes
- Estrutura de módulos (App, Config, Database)
- Configuração inicial de environment variables
