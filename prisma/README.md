# 🗄️ Database Setup & Management

Este diretório contém todos os arquivos relacionados ao banco de dados PostgreSQL usando Prisma ORM.

## 📁 Estrutura

```
prisma/
├── schema.prisma          # Schema do banco de dados
├── seed.ts               # Script para popular dados iniciais
└── migrations/           # Histórico de migrações
```

## 🚀 Scripts Disponíveis

### Setup Completo
```bash
npm run db:setup          # Generate + Migrate + Seed (setup completo)
```

### Operações Individuais
```bash
npm run prisma:generate   # Gerar Prisma Client
npm run prisma:migrate    # Aplicar migrações pendentes
npm run prisma:seed       # Popular banco com dados iniciais
npm run prisma:studio     # Abrir Prisma Studio (localhost:5555)
npm run prisma:reset      # Reset completo do banco (CUIDADO!)
```

## 👥 Dados Iniciais (Seed)

O seed cria os seguintes usuários de teste:

### 👑 Administrador
- **Email**: `admin@authbase.com` / `Admin@123456` / `ADMIN`

### 👤 Usuários Comuns
- **João Silva**: `joao.silva@example.com` / `User@123456`
- **Maria Santos**: `maria.santos@example.com` / `User@789012`
- **Pedro Oliveira**: `pedro.oliveira@example.com` / `User@345678`
- **Ana Costa**: `ana.costa@example.com` / `User@901234`

## 🛡️ Segurança

- **Senhas**: Todas as senhas são hasheadas com bcrypt (saltRounds: 10)
- **IDs**: Gerados automaticamente com CUID
- **Validação**: Email único obrigatório
- **Papéis**: USER/ADMIN

### Logs de Migração
- Todas as migrações ficam em `prisma/migrations/`
- Cada migração tem timestamp e nome descritivo

## 📝 Convenções

### Nomenclatura
- **Tabelas**: snake_case (ex: `users`)
- **Campos**: camelCase (ex: `createdAt`)
- **Enums**: PascalCase (ex: `Role`)

---

📚 **Documentação Adicional**:
- [Prisma Docs](https://www.prisma.io/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)

