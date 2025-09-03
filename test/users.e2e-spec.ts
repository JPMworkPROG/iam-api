import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configurar pipes de validação global
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Limpar dados de teste antes de cada teste
    await prismaService.user.deleteMany({
      where: {
        email: {
          contains: 'test',
        },
      },
    });
  });

  async function createUserAndGetToken(userData: any) {
    // Registrar usuário
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(userData);

    // Fazer login para obter token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    return {
      token: loginResponse.body.accessToken,
      userData: loginResponse.body,
    };
  }

  describe('/users/me (GET)', () => {
    it('should return current user profile', async () => {
      const userData = {
        name: 'Test User',
        email: 'me-test@example.com',
        password: 'Password@123',
      };

      const { token } = await createUserAndGetToken(userData);

      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        email: userData.email,
        name: userData.name,
        role: Role.USER,
      });
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });

    it('should return 401 when invalid token is provided', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/users (GET)', () => {
    it('should return list of users for admin', async () => {
      // Criar admin
      const adminData = {
        name: 'Admin User',
        email: 'admin-list@example.com',
        password: 'Password@123',
        role: Role.ADMIN,
      };

      // Criar usuário comum
      const userData = {
        name: 'Regular User',
        email: 'regular-list@example.com',
        password: 'Password@123',
      };

      const { token: adminToken } = await createUserAndGetToken(adminData);
      await createUserAndGetToken(userData);

      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body[0]).not.toHaveProperty('password');
    });

    it('should return 403 for regular users', async () => {
      const userData = {
        name: 'Regular User',
        email: 'regular-forbidden@example.com',
        password: 'Password@123',
      };

      const { token } = await createUserAndGetToken(userData);

      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return user profile when user requests their own profile', async () => {
      const userData = {
        name: 'Test User',
        email: 'own-profile@example.com',
        password: 'Password@123',
      };

      const { token } = await createUserAndGetToken(userData);

      // Buscar o usuário criado para obter o ID
      const user = await prismaService.user.findUnique({
        where: { email: userData.email },
      });

      const response = await request(app.getHttpServer())
        .get(`/users/${user?.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        email: userData.email,
        name: userData.name,
        role: Role.USER,
      });
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return user profile when admin requests any user profile', async () => {
      // Criar admin
      const adminData = {
        name: 'Admin User',
        email: 'admin-get@example.com',
        password: 'Password@123',
        role: Role.ADMIN,
      };

      // Criar usuário comum
      const userData = {
        name: 'Target User',
        email: 'target-user@example.com',
        password: 'Password@123',
      };

      const { token: adminToken } = await createUserAndGetToken(adminData);
      await createUserAndGetToken(userData);

      // Buscar o usuário alvo
      const targetUser = await prismaService.user.findUnique({
        where: { email: userData.email },
      });

      const response = await request(app.getHttpServer())
        .get(`/users/${targetUser?.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        email: userData.email,
        name: userData.name,
        role: Role.USER,
      });
    });

    it('should return 403 when user tries to access another user profile', async () => {
      // Criar dois usuários
      const user1Data = {
        name: 'User 1',
        email: 'user1-forbidden@example.com',
        password: 'Password@123',
      };

      const user2Data = {
        name: 'User 2',
        email: 'user2-forbidden@example.com',
        password: 'Password@123',
      };

      const { token: user1Token } = await createUserAndGetToken(user1Data);
      await createUserAndGetToken(user2Data);

      // User1 tenta acessar perfil do User2
      const user2 = await prismaService.user.findUnique({
        where: { email: user2Data.email },
      });

      await request(app.getHttpServer())
        .get(`/users/${user2?.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);
    });

    it('should return 404 when user does not exist', async () => {
      const userData = {
        name: 'Test User',
        email: 'not-found-test@example.com',
        password: 'Password@123',
        role: Role.ADMIN,
      };

      const { token } = await createUserAndGetToken(userData);

      await request(app.getHttpServer())
        .get('/users/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('/users (POST)', () => {
    it('should create user when admin creates user', async () => {
      const adminData = {
        name: 'Admin User',
        email: 'admin-create@example.com',
        password: 'Password@123',
        role: Role.ADMIN,
      };

      const { token: adminToken } = await createUserAndGetToken(adminData);

      const newUserData = {
        name: 'New User',
        email: 'new-user@example.com',
        password: 'Password@123',
        role: Role.USER,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserData)
        .expect(201);

      expect(response.body).toMatchObject({
        email: newUserData.email,
        name: newUserData.name,
        role: newUserData.role,
      });
      expect(response.body).not.toHaveProperty('password');

      // Verificar se o usuário foi criado no banco
      const userInDb = await prismaService.user.findUnique({
        where: { email: newUserData.email },
      });
      expect(userInDb).toBeDefined();
    });

    it('should return 403 when regular user tries to create user', async () => {
      const userData = {
        name: 'Regular User',
        email: 'regular-create@example.com',
        password: 'Password@123',
      };

      const { token } = await createUserAndGetToken(userData);

      const newUserData = {
        name: 'New User',
        email: 'new-user-forbidden@example.com',
        password: 'Password@123',
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUserData)
        .expect(403);
    });

    it('should return 409 when email already exists', async () => {
      const adminData = {
        name: 'Admin User',
        email: 'admin-conflict@example.com',
        password: 'Password@123',
        role: Role.ADMIN,
      };

      const existingUserData = {
        name: 'Existing User',
        email: 'existing-user@example.com',
        password: 'Password@123',
      };

      const { token: adminToken } = await createUserAndGetToken(adminData);
      await createUserAndGetToken(existingUserData);

      const duplicateUserData = {
        name: 'Duplicate User',
        email: 'existing-user@example.com', // Mesmo email
        password: 'Password@123',
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateUserData)
        .expect(409);
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should update user when user updates their own profile', async () => {
      const userData = {
        name: 'Test User',
        email: 'update-self@example.com',
        password: 'Password@123',
      };

      const { token } = await createUserAndGetToken(userData);

      const user = await prismaService.user.findUnique({
        where: { email: userData.email },
      });

      const updateData = {
        name: 'Updated Name',
        email: 'updated-self@example.com',
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${user?.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        name: updateData.name,
        email: updateData.email,
        role: Role.USER,
      });
    });

    it('should update user when admin updates any user', async () => {
      const adminData = {
        name: 'Admin User',
        email: 'admin-update@example.com',
        password: 'Password@123',
        role: Role.ADMIN,
      };

      const targetUserData = {
        name: 'Target User',
        email: 'target-update@example.com',
        password: 'Password@123',
      };

      const { token: adminToken } = await createUserAndGetToken(adminData);
      await createUserAndGetToken(targetUserData);

      const targetUser = await prismaService.user.findUnique({
        where: { email: targetUserData.email },
      });

      const updateData = {
        name: 'Updated by Admin',
        role: Role.ADMIN,
      };

      const response = await request(app.getHttpServer())
        .patch(`/users/${targetUser?.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        name: updateData.name,
        role: updateData.role,
      });
    });

    it('should return 403 when user tries to update their role', async () => {
      const userData = {
        name: 'Test User',
        email: 'role-update@example.com',
        password: 'Password@123',
      };

      const { token } = await createUserAndGetToken(userData);

      const user = await prismaService.user.findUnique({
        where: { email: userData.email },
      });

      const updateData = {
        role: Role.ADMIN, // Usuário tentando se promover
      };

      await request(app.getHttpServer())
        .patch(`/users/${user?.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(403);
    });

    it('should return 403 when user tries to update another user', async () => {
      const user1Data = {
        name: 'User 1',
        email: 'user1-update@example.com',
        password: 'Password@123',
      };

      const user2Data = {
        name: 'User 2',
        email: 'user2-update@example.com',
        password: 'Password@123',
      };

      const { token: user1Token } = await createUserAndGetToken(user1Data);
      await createUserAndGetToken(user2Data);

      const user2 = await prismaService.user.findUnique({
        where: { email: user2Data.email },
      });

      const updateData = {
        name: 'Hacked Name',
      };

      await request(app.getHttpServer())
        .patch(`/users/${user2?.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData)
        .expect(403);
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should delete user when admin deletes user', async () => {
      const adminData = {
        name: 'Admin User',
        email: 'admin-delete@example.com',
        password: 'Password@123',
        role: Role.ADMIN,
      };

      const targetUserData = {
        name: 'Target User',
        email: 'target-delete@example.com',
        password: 'Password@123',
      };

      const { token: adminToken } = await createUserAndGetToken(adminData);
      await createUserAndGetToken(targetUserData);

      const targetUser = await prismaService.user.findUnique({
        where: { email: targetUserData.email },
      });

      await request(app.getHttpServer())
        .delete(`/users/${targetUser?.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Verificar se o usuário foi deletado
      const deletedUser = await prismaService.user.findUnique({
        where: { id: targetUser?.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('should return 403 when admin tries to delete themselves', async () => {
      const adminData = {
        name: 'Admin User',
        email: 'admin-self-delete@example.com',
        password: 'Password@123',
        role: Role.ADMIN,
      };

      const { token: adminToken } = await createUserAndGetToken(adminData);

      const admin = await prismaService.user.findUnique({
        where: { email: adminData.email },
      });

      await request(app.getHttpServer())
        .delete(`/users/${admin?.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should return 403 when regular user tries to delete user', async () => {
      const userData = {
        name: 'Regular User',
        email: 'regular-delete@example.com',
        password: 'Password@123',
      };

      const targetUserData = {
        name: 'Target User',
        email: 'target-regular-delete@example.com',
        password: 'Password@123',
      };

      const { token } = await createUserAndGetToken(userData);
      await createUserAndGetToken(targetUserData);

      const targetUser = await prismaService.user.findUnique({
        where: { email: targetUserData.email },
      });

      await request(app.getHttpServer())
        .delete(`/users/${targetUser?.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should return 404 when user does not exist', async () => {
      const adminData = {
        name: 'Admin User',
        email: 'admin-delete-404@example.com',
        password: 'Password@123',
        role: Role.ADMIN,
      };

      const { token: adminToken } = await createUserAndGetToken(adminData);

      await request(app.getHttpServer())
        .delete('/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
