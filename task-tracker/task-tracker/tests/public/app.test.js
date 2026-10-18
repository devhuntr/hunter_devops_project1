'use strict';

// public/app.js is a browser script that calls `new Vue({...})`. We stub the
// global Vue constructor to capture the component options, then exercise the
// computed properties and methods against a fake view-model.
describe('public/app', () => {
  let options;

  beforeAll(() => {
    global.Vue = jest.fn(function (opts) { options = opts; });
    jest.isolateModules(() => { require('../../public/app'); });
  });

  afterAll(() => { delete global.Vue; });

  // A request that resolves or rejects synchronously, like a settled promise.
  const respond = (ok, value) => ({ then: (onSuccess, onError) => (ok ? onSuccess(value) : onError(value)) });

  const makeVm = (overrides = {}) => {
    const vm = Object.assign({}, options.data, { tasks: [] }, overrides);
    Object.keys(options.methods).forEach(name => { vm[name] = options.methods[name].bind(vm); });
    vm.$http = {
      get: jest.fn(() => respond(true, { data: [] })),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn()
    };
    return vm;
  };

  const computed = (name, vm) => {
    const fn = options.computed[name];
    const ctx = Object.assign({}, vm);
    Object.keys(options.computed).forEach(key => {
      if (key !== name && !(key in ctx)) Object.defineProperty(ctx, key, { get: () => computed(key, vm) });
    });
    return fn.call(ctx);
  };

  const sample = () => [
    { id: 'a', title: 'Done', completed: true },
    { id: 'b', title: 'Active 1', completed: false },
    { id: 'c', title: 'Active 2', completed: false }
  ];

  test('mounts on #tracker with default state', () => {
    expect(global.Vue).toHaveBeenCalledTimes(1);
    expect(options.el).toBe('#tracker');
    expect(options.data).toMatchObject({ newTitle: '', tasks: [], filter: 'all', busy: false, error: '' });
    expect(options.data.filters.map(f => f.value)).toEqual(['all', 'active', 'completed']);
  });

  test('ready() loads tasks', () => {
    const vm = makeVm();
    options.ready.call(vm);
    expect(vm.$http.get).toHaveBeenCalledWith('/api/tasks');
  });

  describe('computed', () => {
    test('counts completed and remaining tasks', () => {
      const vm = { tasks: sample() };
      expect(computed('completedCount', vm)).toBe(1);
      expect(computed('remaining', vm)).toBe(2);
    });

    test('percent is 0 with no tasks and rounds otherwise', () => {
      expect(computed('percent', { tasks: [] })).toBe(0);
      expect(computed('percent', { tasks: sample() })).toBe(33);
    });

    test.each([
      ['all', ['a', 'b', 'c']],
      ['active', ['b', 'c']],
      ['completed', ['a']]
    ])('visibleTasks with filter "%s"', (filter, ids) => {
      expect(computed('visibleTasks', { tasks: sample(), filter }).map(t => t.id)).toEqual(ids);
    });

    test.each([
      ['completed', 'Nothing finished yet', 'Completed tasks will show up here.'],
      ['active', 'All caught up!', 'You have no active tasks. Enjoy the moment.'],
      ['all', 'A fresh start.', 'Add your first task above to get started.']
    ])('empty state text for filter "%s"', (filter, title, message) => {
      expect(computed('emptyTitle', { filter })).toBe(title);
      expect(computed('emptyMessage', { filter })).toBe(message);
    });
  });

  describe('fail', () => {
    test('uses the server error message when present', () => {
      const vm = makeVm();
      vm.fail({ data: { error: 'Bad title' } });
      expect(vm.error).toBe('Bad title');
    });

    test.each([
      ['no response', undefined],
      ['no data', {}],
      ['no error field', { data: {} }]
    ])('falls back to a generic message with %s', (_label, response) => {
      const vm = makeVm();
      vm.fail(response);
      expect(vm.error).toBe('Something went wrong. Please try again.');
    });
  });

  describe('loadTasks', () => {
    test('stores loaded tasks', () => {
      const vm = makeVm();
      vm.$http.get.mockReturnValue(respond(true, { data: sample() }));
      vm.loadTasks();
      expect(vm.tasks).toEqual(sample());
    });

    test('shows an error when loading fails', () => {
      const vm = makeVm();
      vm.$http.get.mockReturnValue(respond(false, { data: { error: 'Server down' } }));
      vm.loadTasks();
      expect(vm.error).toBe('Server down');
    });
  });

  describe('addTask', () => {
    test('posts a trimmed title and prepends the new task', () => {
      const vm = makeVm({ newTitle: '  New task ', filter: 'completed', tasks: sample() });
      const created = { id: 'n', title: 'New task', completed: false };
      vm.$http.post.mockReturnValue(respond(true, { data: created }));
      vm.addTask();
      expect(vm.$http.post).toHaveBeenCalledWith('/api/tasks', { title: 'New task' });
      expect(vm.tasks[0]).toBe(created);
      expect(vm).toMatchObject({ newTitle: '', filter: 'all', busy: false, error: '' });
    });

    test('does nothing for a blank title', () => {
      const vm = makeVm({ newTitle: '   ' });
      vm.addTask();
      expect(vm.$http.post).not.toHaveBeenCalled();
    });

    test('does nothing while busy', () => {
      const vm = makeVm({ newTitle: 'Task', busy: true });
      vm.addTask();
      expect(vm.$http.post).not.toHaveBeenCalled();
    });

    test('shows an error and keeps the title when the request fails', () => {
      const vm = makeVm({ newTitle: 'Task' });
      vm.$http.post.mockReturnValue(respond(false, { data: { error: 'Too long' } }));
      vm.addTask();
      expect(vm).toMatchObject({ newTitle: 'Task', busy: false, error: 'Too long' });
      expect(vm.tasks).toEqual([]);
    });
  });

  describe('toggleTask', () => {
    test('patches the opposite completed value and applies the result', () => {
      const vm = makeVm();
      const task = { id: 'a b', completed: false };
      vm.$http.patch.mockReturnValue(respond(true, { data: { completed: true } }));
      vm.toggleTask(task);
      expect(vm.$http.patch).toHaveBeenCalledWith('/api/tasks/a%20b', { completed: true });
      expect(task.completed).toBe(true);
      expect(vm.busy).toBe(false);
    });

    test('does nothing while busy', () => {
      const vm = makeVm({ busy: true });
      vm.toggleTask({ id: 'a', completed: false });
      expect(vm.$http.patch).not.toHaveBeenCalled();
    });

    test('leaves the task unchanged when the request fails', () => {
      const vm = makeVm();
      const task = { id: 'a', completed: false };
      vm.$http.patch.mockReturnValue(respond(false, { data: { error: 'Task not found.' } }));
      vm.toggleTask(task);
      expect(task.completed).toBe(false);
      expect(vm).toMatchObject({ busy: false, error: 'Task not found.' });
    });
  });

  describe('deleteTask', () => {
    test('deletes the task and removes it from the list', () => {
      const vm = makeVm({ tasks: sample() });
      vm.$http.delete.mockReturnValue(respond(true, {}));
      vm.deleteTask(vm.tasks[1]);
      expect(vm.$http.delete).toHaveBeenCalledWith('/api/tasks/b');
      expect(vm.tasks.map(t => t.id)).toEqual(['a', 'c']);
      expect(vm.busy).toBe(false);
    });

    test('does nothing while busy', () => {
      const vm = makeVm({ busy: true, tasks: sample() });
      vm.deleteTask(vm.tasks[0]);
      expect(vm.$http.delete).not.toHaveBeenCalled();
    });

    test('keeps the task when the request fails', () => {
      const vm = makeVm({ tasks: sample() });
      vm.$http.delete.mockReturnValue(respond(false, undefined));
      vm.deleteTask(vm.tasks[0]);
      expect(vm.tasks).toHaveLength(3);
      expect(vm).toMatchObject({ busy: false, error: 'Something went wrong. Please try again.' });
    });
  });
});
