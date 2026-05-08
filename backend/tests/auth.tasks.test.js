require('./setup');
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');

let adminToken, memberToken, adminUser, memberUser, projectId, taskId;

beforeAll(async () => {
  await db.sequelize.sync({ force: true });
});

afterAll(async () => {
  await db.sequelize.close();
});

// ─── AUTH TESTS ────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'Password123!',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@test.com');
    adminToken = res.body.data.accessToken;
    adminUser = res.body.data.user;
  });

  it('rejects duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'Password123!',
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'weak@test.com',
      password: 'weak',
    });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('rejects invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'not-an-email',
      password: 'Password123!',
    });
    expect(res.status).toBe(422);
  });

  it('registers a second member user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Member User',
      email: 'member@test.com',
      password: 'Password123!',
    });
    expect(res.status).toBe(201);
    memberToken = res.body.data.accessToken;
    memberUser = res.body.data.user;
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'Password123!',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    adminToken = res.body.data.accessToken;
  });

  it('rejects invalid password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'WrongPassword1!',
    });
    expect(res.status).toBe(401);
  });

  it('rejects non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@test.com',
      password: 'Password123!',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('admin@test.com');
  });

  it('rejects request without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects request with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});

// ─── PROJECT TESTS ─────────────────────────────────────────────────────────────

describe('POST /api/projects', () => {
  it('creates a project successfully', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Project', description: 'A test project' });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Project');
    projectId = res.body.data.id;
  });

  it('rejects project with short name', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'X' });
    expect(res.status).toBe(422);
  });
});

// ─── TASK TESTS ────────────────────────────────────────────────────────────────

describe('POST /api/projects/:id/tasks', () => {
  it('creates a task in a project', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test Task', priority: 'high', status: 'todo' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Test Task');
    taskId = res.body.data.id;
  });

  it('rejects task with title too short', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'AB' });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/projects/:id/tasks', () => {
  it('lists tasks for a project', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.tasks)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
  });
});

describe('PATCH /api/tasks/:id/status', () => {
  it('updates task status', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in_progress');
  });

  it('rejects invalid status value', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'invalid_status' });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/dashboard/stats', () => {
  it('returns dashboard stats', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalProjects).toBeDefined();
    expect(res.body.data.tasksByStatus).toBeDefined();
    expect(res.body.data.recentActivity).toBeDefined();
  });
});

describe('RBAC enforcement', () => {
  it('member cannot access /api/users (admin only)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });

  it('member cannot access project they are not part of', async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });
});
