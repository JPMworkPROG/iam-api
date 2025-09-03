import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Limpar dados existentes (opcional - remova se quiser preservar dados)
  console.log('🧹 Cleaning existing data...');
  await prisma.user.deleteMany();

  // Hash para as senhas (mesmo padrão que será usado na aplicação)
  const saltRounds = 10;

  // Criar usuário administrador
  console.log('👑 Creating admin user...');
  const adminPassword = await bcrypt.hash('Admin@123456', saltRounds);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@authbase.com',
      name: 'Administrador do Sistema',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  console.log('✅ Admin user created:', {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });

  // Criar usuários comuns de exemplo
  console.log('👥 Creating sample users...');
  
  const users = [
    {
      email: 'joao.silva@example.com',
      name: 'João Silva',
      password: await bcrypt.hash('User@123456', saltRounds),
      role: Role.USER,
    },
    {
      email: 'maria.santos@example.com',
      name: 'Maria Santos',
      password: await bcrypt.hash('User@789012', saltRounds),
      role: Role.USER,
    },
    {
      email: 'pedro.oliveira@example.com',
      name: 'Pedro Oliveira',
      password: await bcrypt.hash('User@345678', saltRounds),
      role: Role.USER,
    },
    {
      email: 'ana.costa@example.com',
      name: 'Ana Costa',
      password: await bcrypt.hash('User@901234', saltRounds),
      role: Role.USER,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData,
    });
    console.log(`✅ User created: ${user.email}`);
  }

  // Estatísticas finais
  const totalUsers = await prisma.user.count();
  const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
  const userCount = await prisma.user.count({ where: { role: Role.USER } });

  console.log('\n📊 Seeding completed successfully!');
  console.log('📈 Database statistics:');
  console.log(`   Total users: ${totalUsers}`);
  console.log(`   Admin users: ${adminCount}`);
  console.log(`   Regular users: ${userCount}`);
  
  console.log('\n🔑 Default credentials:');
  console.log('   Admin: admin@authbase.com / Admin@123456');
  console.log('   User:  joao.silva@example.com / User@123456');
  console.log('   User:  maria.santos@example.com / User@789012');
  console.log('   User:  pedro.oliveira@example.com / User@345678');
  console.log('   User:  ana.costa@example.com / User@901234');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
