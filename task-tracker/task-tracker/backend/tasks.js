'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const file = process.env.TASKS_FILE || path.join(__dirname, '..', 'data', 'tasks.json');
function read() {
  try { const result = JSON.parse(fs.readFileSync(file, 'utf8')); return Array.isArray(result) ? result : []; }
  catch (err) { if (err.code === 'ENOENT') return []; throw err; }
}
function write(items) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(items, null, 2) + '\n');
  fs.renameSync(tmp, file);
}
exports.all = () => read();
exports.create = title => {
  const items = read();
  const task = { id: crypto.randomUUID(), title, completed: false, createdAt: new Date().toISOString() };
  items.unshift(task); write(items); return task;
};
exports.setCompleted = (id, completed) => {
  const items = read(); const task = items.find(item => item.id === id);
  if (!task) return null;
  task.completed = completed; write(items); return task;
};
exports.remove = id => {
  const items = read(); const remaining = items.filter(item => item.id !== id);
  if (remaining.length === items.length) return false;
  write(remaining); return true;
};
