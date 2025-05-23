const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

// === Middleware ===
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// === Penyimpanan Data Sementara ===
let users = [];
let exercises = {}; // key: userId, value: array of exercises

// === Helper Function ===
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

// === Endpoint: POST /api/users ===
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  if (!username) return res.status(400).json({ error: 'Username is required' });

  const newUser = {
    username,
    _id: generateId()
  };

  users.push(newUser);
  exercises[newUser._id] = [];
  res.json(newUser);
});

// === Endpoint: GET /api/users ===
app.get('/api/users', (req, res) => {
  res.json(users);
});

// === Endpoint: POST /api/users/:_id/exercises ===
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  const user = users.find(u => u._id === userId);
  if (!user) return res.status(400).json({ error: 'User not found' });

  const parsedDuration = parseInt(duration);
  if (!description || isNaN(parsedDuration)) {
    return res.status(400).json({ error: 'Description and valid duration are required' });
  }

  const exerciseDate = date ? new Date(date) : new Date();
  const exercise = {
    description,
    duration: parsedDuration,
    date: exerciseDate
  };

  exercises[userId].push(exercise);

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
    _id: user._id
  });
});

// === Endpoint: GET /api/users/:_id/logs ===
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  const user = users.find(u => u._id === userId);
  if (!user) return res.status(400).json({ error: 'User not found' });

  let log = exercises[userId] || [];

  if (from) {
    const fromDate = new Date(from);
    log = log.filter(e => new Date(e.date) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    log = log.filter(e => new Date(e.date) <= toDate);
  }

  if (limit) {
    log = log.slice(0, parseInt(limit));
  }

  const formattedLog = log.map(e => ({
    description: e.description,
    duration: e.duration,
    date: new Date(e.date).toDateString()
  }));

  res.json({
    username: user.username,
    count: formattedLog.length,
    _id: user._id,
    log: formattedLog
  });
});

// === Server Listen ===
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
