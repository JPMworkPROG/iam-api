import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Auth (e2e)', () => {
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

  describe('/auth/register (POST)', () => {
    const validRegisterData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password@123',
      role: Role.USER,
    };

    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: validRegisterData.email,
        name: validRegisterData.name,
        role: validRegisterData.role,
        createdAt: expect.any(String),
      });

      // Verificar se não retorna a senha
      expect(response.body).not.toHaveProperty('password');

      // Verificar se o usuário foi criado no banco
      const userInDb = await prismaService.user.findUnique({
        where: { email: validRegisterData.email },
      });
      expect(userInDb).toBeDefined();
      expect(userInDb?.email).toBe(validRegisterData.email);
    });

    it('should register user with default USER role when role is not provided', async () => {
      const registerDataWithoutRole = {
        name: 'Test User',
        email: 'test2@example.com',
        password: 'Password@123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDataWithoutRole)
        .expect(201);

      expect(response.body.role).toBe(Role.USER);
    });

    it('should return 409 when email already exists', async () => {
      // Criar usuário primeiro
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterData)
        .expect(201);

      // Tentar criar novamente com mesmo email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterData)
        .expect(409);

      expect(response.body).toMatchObject({
        statusCode: 409,
        message: 'Email já está em uso',
      });
    });

    it('should return 400 when email is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterData,
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([
          expect.stringContaining('email must be an email'),
        ]),
      });
    });

    it('should return 400 when password is too weak', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterData,
          password: '123456', // Senha fraca
        })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([
          expect.stringContaining('Password must contain'),
        ]),
      });
    });

    it('should return 400 when name is too short', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterData,
          name: 'A', // Nome muito curto
        })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([
          expect.stringContaining('name must be longer than or equal to 2'),
        ]),
      });
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          // email e password omitidos
        })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([
          expect.stringContaining('email'),
          expect.stringContaining('password'),
        ]),
      });
    });

    it('should return 400 when role is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterData,
          role: 'INVALID_ROLE',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([
          expect.stringContaining('role must be one of the following values'),
        ]),
      });
    });
  });

  describe('/auth/login (POST)', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'Password@123',
    };

    beforeEach(async () => {
      // Criar usuário para testes de login
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: loginData.email,
          password: loginData.password,
        });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });

      // Verificar se os tokens são válidos (não vazios e têm formato JWT)
      expect(response.body.accessToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      expect(response.body.refreshToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });

    it('should return 401 when email does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password@123',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: 'Credenciais inválidas',
      });
    });

    it('should return 401 when password is incorrect', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: loginData.email,
          password: 'WrongPassword@123',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: 'Credenciais inválidas',
      });
    });

    it('should return 400 when email format is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password@123',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([
          expect.stringContaining('email must be an email'),
        ]),
      });
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          // password omitido
        })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([
          expect.stringContaining('password must be a string'),
        ]),
      });
    });
  });

  describe('/auth/refresh (POST)', () => {
    let validRefreshToken: string;

    beforeEach(async () => {
      // Criar usuário e fazer login para obter refresh token válido
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'refresh-test@example.com',
          password: 'Password@123',
        });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'refresh-test@example.com',
          password: 'Password@123',
        });

      validRefreshToken = loginResponse.body.refreshToken;
    });

    it('should successfully refresh tokens with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });

      // Verificar se os tokens são válidos (não vazios e têm formato JWT)
      expect(response.body.accessToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      expect(response.body.refreshToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

      // Verificar se os novos tokens são diferentes dos originais
      expect(response.body.refreshToken).not.toBe(validRefreshToken);
    });

    it('should return 401 when refresh token is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: 'Refresh token inválido ou expirado',
      });
    });

    it('should return 401 when refresh token is expired', async () => {
      // Simular token expirado usando um token JWT malformado
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxfQ.invalid';
      
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: expiredToken,
        })
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: 'Refresh token inválido ou expirado',
      });
    });

    it('should return 400 when refresh token is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([
          expect.stringContaining('refreshToken must be a string'),
        ]),
      });
    });

    it('should return 400 when refresh token is not a string', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: 123,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.arrayContaining([
          expect.stringContaining('refreshToken must be a string'),
        ]),
      });
    });

    it('should be able to use new refresh token to get another set of tokens', async () => {
      // Primeiro refresh
      const firstRefreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: validRefreshToken,
        })
        .expect(200);

      // Segundo refresh usando o novo refresh token
      const secondRefreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: firstRefreshResponse.body.refreshToken,
        })
        .expect(200);

      expect(secondRefreshResponse.body).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });

      // Verificar se todos os tokens são diferentes
      expect(secondRefreshResponse.body.accessToken).not.toBe(firstRefreshResponse.body.accessToken);
      expect(secondRefreshResponse.body.refreshToken).not.toBe(firstRefreshResponse.body.refreshToken);
    });
  });
});
