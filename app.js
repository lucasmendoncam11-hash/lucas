import { addTask, filterTasks, loadTasks, removeTask, toggleTask } from './tasks.js';

const storageKey = 'hoje.tasks.v1';
const form = document.querySelector('#task-form');
const input = document.querySelector('#task-input');
const list = document.querySelector('#task-list');
const count = document.querySelector('#task-count');
const remaining = document.querySelector('#remaining-count');
const clearButton = document.querySelector('#clear-completed');
const empty = document.querySelector('#empty-state');
const emptyTitle = document.querySelector('#empty-title');
const emptyDescription = document.querySelector('#empty-description');
const announcement = document.querySelector('#announcement');
const filterButtons = [...document.querySelectorAll('[data-filter]')];

let tasks;
try {
  tasks = loadTasks(localStorage.getItem(storageKey));
} catch {
  tasks = [];
  announcement.textContent = 'O armazenamento do navegador não está disponível. As tarefas desta sessão não serão salvas.';
}
let filter = 'all';

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  } catch {
    announcement.textContent = 'Não foi possível salvar as tarefas neste navegador.';
  }
}

function render() {
  const visible = filterTasks(tasks, filter);
  const pendingCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.length - pendingCount;

  count.textContent = String(tasks.length);
  remaining.textContent = `${pendingCount} ${pendingCount === 1 ? 'tarefa pendente' : 'tarefas pendentes'}`;
  clearButton.hidden = completedCount === 0;

  for (const button of filterButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
  }

  list.replaceChildren(...visible.map((task) => {
    const item = document.createElement('li');
    item.className = `task-item${task.completed ? ' is-complete' : ''}`;
    item.dataset.id = task.id;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'task-toggle';
    toggle.dataset.action = 'toggle';
    toggle.setAttribute('aria-label', task.completed ? `Marcar ${task.title} como pendente` : `Concluir ${task.title}`);
    toggle.setAttribute('aria-pressed', String(task.completed));
    toggle.textContent = task.completed ? '✓' : '';

    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = task.title;

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'task-remove';
    remove.dataset.action = 'remove';
    remove.setAttribute('aria-label', `Excluir ${task.title}`);
    remove.textContent = '×';

    item.append(toggle, title, remove);
    return item;
  }));

  empty.hidden = visible.length !== 0;
  if (visible.length === 0) {
    const messages = {
      all: ['Tudo em dia por aqui.', 'Adicione sua primeira tarefa para começar.'],
      active: ['Nada pendente.', 'Você concluiu tudo. Que tal aproveitar o tempo livre?'],
      completed: ['Nenhuma tarefa concluída ainda.', 'Quando concluir uma tarefa, ela aparecerá aqui.'],
    };
    [emptyTitle.textContent, emptyDescription.textContent] = messages[filter];
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  tasks = addTask(tasks, title);
  input.value = '';
  filter = 'all';
  save();
  render();
  input.focus();
  announcement.textContent = 'Tarefa adicionada.';
});

list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = button.closest('li').dataset.id;
  tasks = button.dataset.action === 'toggle' ? toggleTask(tasks, id) : removeTask(tasks, id);
  save();
  render();
  announcement.textContent = button.dataset.action === 'toggle' ? 'Tarefa atualizada.' : 'Tarefa excluída.';
});

for (const button of filterButtons) {
  button.addEventListener('click', () => {
    filter = button.dataset.filter;
    render();
  });
}

clearButton.addEventListener('click', () => {
  tasks = tasks.filter((task) => !task.completed);
  save();
  render();
  announcement.textContent = 'Tarefas concluídas removidas.';
});

render();
