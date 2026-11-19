import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addTask,
  createTask,
  filterTasks,
  loadTasks,
  removeTask,
  toggleTask,
} from './tasks.js';

const savedTask = {
  id: 'task-1',
  title: 'Buy milk',
  completed: false,
  createdAt: '2026-11-19T12:00:00.000Z',
};

describe('task state', () => {
  it('creates a task with a trimmed title, unique ID, and ISO timestamp', () => {
    const first = createTask('  Buy milk  ');
    const second = createTask('Buy milk');

    assert.match(first.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.notEqual(first.id, second.id);
    assert.equal(first.title, 'Buy milk');
    assert.equal(first.completed, false);
    assert.equal(new Date(first.createdAt).toISOString(), first.createdAt);
  });

  it('rejects empty task titles', () => {
    assert.throws(() => createTask('  '), TypeError);
    assert.throws(() => createTask(null), TypeError);
  });

  it('adds, toggles, and removes tasks without changing earlier state', () => {
    const original = [savedTask];
    const added = addTask(original, '  Call home  ');
    assert.equal(original.length, 1);
    assert.equal(added.length, 2);
    assert.equal(added[1].title, 'Call home');

    const toggled = toggleTask(added, savedTask.id);
    assert.equal(toggled[0].completed, true);
    assert.equal(added[0].completed, false);
    assert.equal(toggled[1], added[1]);
    assert.equal(toggleTask(toggled, savedTask.id)[0].completed, false);
    assert.deepEqual(toggleTask(original, 'missing'), original);

    const removed = removeTask(toggled, savedTask.id);
    assert.deepEqual(removed, [added[1]]);
    assert.equal(toggled.length, 2);
  });

  it('filters all, active, and completed tasks', () => {
    const completed = { ...savedTask, id: 'task-2', completed: true };
    const tasks = [savedTask, completed];

    assert.deepEqual(filterTasks(tasks, 'all'), tasks);
    assert.notEqual(filterTasks(tasks, 'all'), tasks);
    assert.deepEqual(filterTasks(tasks, 'active'), [savedTask]);
    assert.deepEqual(filterTasks(tasks, 'completed'), [completed]);
  });
});

describe('saved task validation', () => {
  it('loads valid tasks while dropping extra fields', () => {
    assert.deepEqual(
      loadTasks(JSON.stringify([{ ...savedTask, unexpected: 'ignored' }])),
      [savedTask],
    );
  });

  it('returns an empty list for malformed JSON or non-array payloads', () => {
    assert.deepEqual(loadTasks('{'), []);
    assert.deepEqual(loadTasks('{}'), []);
    assert.deepEqual(loadTasks(null), []);
  });

  it('skips invalid and duplicate entries, retaining valid tasks', () => {
    const payload = [
      null,
      { ...savedTask, id: '' },
      { ...savedTask, title: '  ' },
      { ...savedTask, completed: 'false' },
      { ...savedTask, createdAt: 'not a date' },
      savedTask,
      { ...savedTask, title: 'Duplicate ID' },
      { ...savedTask, id: 'task-2', title: '  Call home  ' },
    ];

    assert.deepEqual(loadTasks(JSON.stringify(payload)), [
      savedTask,
      { ...savedTask, id: 'task-2', title: 'Call home' },
    ]);
  });
});
