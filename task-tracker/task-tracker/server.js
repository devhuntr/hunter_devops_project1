'use strict';
const express = require('express');
const path = require('path');
const tasks = require('./backend/tasks');
const app = express();
app.use(express.json({ limit: '16kb' }));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/tasks', (req, res) => res.json(tasks.all()));
app.post('/api/tasks', (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  if (!title || title.length > 160) return res.status(400).json({ error: 'Task title must be 1–160 characters.' });
  res.status(201).json(tasks.create(title));
});
app.patch('/api/tasks/:id', (req, res) => {
  if (typeof req.body.completed !== 'boolean') return res.status(400).json({ error: 'completed must be a boolean.' });
  const task = tasks.setCompleted(req.params.id, req.body.completed);
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  res.json(task);
});
app.delete('/api/tasks/:id', (req, res) => {
  if (!tasks.remove(req.params.id)) return res.status(404).json({ error: 'Task not found.' });
  res.status(204).end();
});
app.use('/api', (req, res) => res.status(404).json({ error: 'Unknown API endpoint.' }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400) return res.status(400).json({ error: 'Invalid JSON.' });
  console.error(err);
  res.status(500).json({ error: 'Unexpected server error.' });
});
const port = Number(process.env.PORT) || 8080;
app.set('port', port);
/* istanbul ignore if -- entry point only runs via `npm start`, not under Jest */
if (require.main === module) app.listen(port, () => console.log(`Task Tracker running at http://localhost:${port}`));
module.exports = app;
