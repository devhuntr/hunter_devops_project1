'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

describe('server', () => {
  let dir;
  let app;
  let tasks;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'server-test-'));
    process.env.TASKS_FILE = path.join(dir, 'tasks.json');
    jest.isolateModules(() => {
      app = require('../server');
      tasks = require('../backend/tasks');
    });
  });

  afterEach(() => {
    delete process.env.TASKS_FILE;
    jest.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  describe('GET /api/tasks', () => {
    test('returns an empty list initially', async () => {
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('returns created tasks', async () => {
      const task = tasks.create('Existing');
      const res = await request(app).get('/api/tasks');
      expect(res.body).toEqual([task]);
    });
  });

  describe('POST /api/tasks', () => {
    test('creates a task with a trimmed title', async () => {
      const res = await request(app).post('/api/tasks').send({ title: '  Buy milk  ' });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ title: 'Buy milk', completed: false });
      expect(tasks.all()).toHaveLength(1);
    });

    test('accepts a 160 character title', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'x'.repeat(160) });
      expect(res.status).toBe(201);
    });

    test.each([
      ['missing', {}],
      ['not a string', { title: 42 }],
      ['blank', { title: '   ' }],
      ['too long', { title: 'x'.repeat(161) }]
    ])('rejects a title that is %s', async (_label, body) => {
      const res = await request(app).post('/api/tasks').send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/1–160 characters/);
      expect(tasks.all()).toEqual([]);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    test('updates the completed flag', async () => {
      const task = tasks.create('Toggle');
      const res = await request(app).patch(`/api/tasks/${task.id}`).send({ completed: true });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: task.id, completed: true });
    });

    test('rejects a non-boolean completed value', async () => {
      const task = tasks.create('Toggle');
      const res = await request(app).patch(`/api/tasks/${task.id}`).send({ completed: 'yes' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('completed must be a boolean.');
    });

    test('returns 404 for an unknown task', async () => {
      const res = await request(app).patch('/api/tasks/missing').send({ completed: true });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found.');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    test('deletes a task', async () => {
      const task = tasks.create('Delete me');
      const res = await request(app).delete(`/api/tasks/${task.id}`);
      expect(res.status).toBe(204);
      expect(tasks.all()).toEqual([]);
    });

    test('returns 404 for an unknown task', async () => {
      const res = await request(app).delete('/api/tasks/missing');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found.');
    });
  });

  describe('errors and static files', () => {
    test('returns 404 JSON for unknown API endpoints', async () => {
      const res = await request(app).get('/api/nope');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Unknown API endpoint.');
    });

    test('returns 400 for malformed JSON', async () => {
      const res = await request(app).post('/api/tasks').set('Content-Type', 'application/json').send('{ bad json');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid JSON.');
    });

    test('returns 500 when storage fails', async () => {
      jest.spyOn(tasks, 'all').mockImplementation(() => { throw new Error('disk failure'); });
      jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await request(app).get('/api/tasks');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Unexpected server error.');
      expect(console.error).toHaveBeenCalled();
    });

    test('serves the front-end', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('id="tracker"');
    });
  });

  describe('port', () => {
    const loadPort = value => {
      if (value === undefined) delete process.env.PORT; else process.env.PORT = value;
      let port;
      jest.isolateModules(() => { port = require('../server').get('port'); });
      delete process.env.PORT;
      return port;
    };

    test('defaults to 8080', () => {
      expect(loadPort(undefined)).toBe(8080);
    });

    test('uses the PORT environment variable', () => {
      expect(loadPort('3000')).toBe(3000);
    });
  });
});
