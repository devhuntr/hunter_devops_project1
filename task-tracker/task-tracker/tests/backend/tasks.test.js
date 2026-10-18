'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('backend/tasks', () => {
  let dir;
  let file;
  let tasks;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasks-test-'));
    file = path.join(dir, 'tasks.json');
    process.env.TASKS_FILE = file;
    jest.isolateModules(() => { tasks = require('../../backend/tasks'); });
  });

  afterEach(() => {
    delete process.env.TASKS_FILE;
    jest.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const readFile = () => JSON.parse(fs.readFileSync(file, 'utf8'));

  describe('all', () => {
    test('returns an empty list when the data file does not exist', () => {
      expect(tasks.all()).toEqual([]);
    });

    test('returns the stored tasks', () => {
      const stored = [{ id: '1', title: 'Saved', completed: false, createdAt: '2026-01-01T00:00:00.000Z' }];
      fs.writeFileSync(file, JSON.stringify(stored));
      expect(tasks.all()).toEqual(stored);
    });

    test('returns an empty list when the file does not contain an array', () => {
      fs.writeFileSync(file, JSON.stringify({ not: 'an array' }));
      expect(tasks.all()).toEqual([]);
    });

    test('throws when the file contains invalid JSON', () => {
      fs.writeFileSync(file, '{ broken');
      expect(() => tasks.all()).toThrow(SyntaxError);
    });
  });

  describe('create', () => {
    test('creates an incomplete task with an id and timestamp', () => {
      const task = tasks.create('Write tests');
      expect(task).toEqual({
        id: expect.any(String),
        title: 'Write tests',
        completed: false,
        createdAt: expect.any(String)
      });
      expect(new Date(task.createdAt).toISOString()).toBe(task.createdAt);
    });

    test('persists new tasks newest first', () => {
      const first = tasks.create('First');
      const second = tasks.create('Second');
      expect(readFile().map(t => t.id)).toEqual([second.id, first.id]);
    });

    test('generates unique ids', () => {
      expect(tasks.create('A').id).not.toBe(tasks.create('B').id);
    });

    test('does not leave a temporary file behind', () => {
      tasks.create('Atomic write');
      expect(fs.existsSync(file + '.tmp')).toBe(false);
    });
  });

  describe('setCompleted', () => {
    test('updates and persists the completed flag', () => {
      const task = tasks.create('Toggle me');
      expect(tasks.setCompleted(task.id, true)).toMatchObject({ id: task.id, completed: true });
      expect(readFile()[0].completed).toBe(true);
      expect(tasks.setCompleted(task.id, false).completed).toBe(false);
      expect(readFile()[0].completed).toBe(false);
    });

    test('returns null for an unknown id', () => {
      tasks.create('Existing');
      expect(tasks.setCompleted('missing', true)).toBeNull();
    });
  });

  describe('remove', () => {
    test('removes the task and returns true', () => {
      const keep = tasks.create('Keep');
      const drop = tasks.create('Drop');
      expect(tasks.remove(drop.id)).toBe(true);
      expect(readFile()).toEqual([keep]);
    });

    test('returns false and leaves data untouched for an unknown id', () => {
      const keep = tasks.create('Keep');
      expect(tasks.remove('missing')).toBe(false);
      expect(readFile()).toEqual([keep]);
    });
  });

  test('defaults to data/tasks.json when TASKS_FILE is not set', () => {
    delete process.env.TASKS_FILE;
    const spy = jest.spyOn(fs, 'readFileSync').mockReturnValue('[]');
    let defaultTasks;
    jest.isolateModules(() => { defaultTasks = require('../../backend/tasks'); });
    expect(defaultTasks.all()).toEqual([]);
    expect(spy).toHaveBeenCalledWith(path.join(__dirname, '..', '..', 'data', 'tasks.json'), 'utf8');
  });
});
