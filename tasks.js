/** Create a task from user input. */
export function createTask(title) {
  const normalizedTitle = normalizeTitle(title);

  return {
    id: crypto.randomUUID(),
    title: normalizedTitle,
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

/** Read saved tasks without trusting the contents of localStorage. */
export function loadTasks(raw) {
  if (typeof raw !== 'string') return [];

  let saved;
  try {
    saved = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(saved)) return [];

  const seenIds = new Set();
  const tasks = [];

  for (const item of saved) {
    if (
      item === null ||
      typeof item !== 'object' ||
      Array.isArray(item) ||
      typeof item.id !== 'string' ||
      item.id.trim() === '' ||
      seenIds.has(item.id) ||
      typeof item.title !== 'string' ||
      item.title.trim() === '' ||
      typeof item.completed !== 'boolean' ||
      !isIsoDate(item.createdAt)
    ) {
      continue;
    }

    seenIds.add(item.id);
    tasks.push({
      id: item.id,
      title: item.title.trim(),
      completed: item.completed,
      createdAt: item.createdAt,
    });
  }

  return tasks;
}

/** Return a new list with the task appended. */
export function addTask(tasks, title) {
  return [...tasks, createTask(title)];
}

/** Return a new list with the matching task's completion state changed. */
export function toggleTask(tasks, id) {
  return tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task,
  );
}

/** Return a new list without the matching task. */
export function removeTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}

/** Select tasks for one of the supported views. */
export function filterTasks(tasks, filter) {
  switch (filter) {
    case 'active':
      return tasks.filter((task) => !task.completed);
    case 'completed':
      return tasks.filter((task) => task.completed);
    case 'all':
    default:
      return [...tasks];
  }
}

function normalizeTitle(title) {
  if (typeof title !== 'string' || title.trim() === '') {
    throw new TypeError('Task title must be a nonempty string');
  }
  return title.trim();
}

function isIsoDate(value) {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}
