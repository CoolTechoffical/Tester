const express = require('express');
const path = require('path');
const session = require('express-session');
const seedHolidays = require('./data/holidays.json');
const { initDb, all, get, run } = require('./db');

const app = express();
const PORT = process.env.PORT || 4173;

app.use(express.json());
app.use(
  session({
    secret: 'kerala-school-holidays-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 4 }
  })
);

app.use(express.static(path.join(__dirname)));

app.get('/admin/login', (_req, res) => res.sendFile(path.join(__dirname, 'admin-login.html')));
app.get('/admin/dashboard', (_req, res) => res.sendFile(path.join(__dirname, 'admin-dashboard.html')));

function requireAdmin(req, res, next) {
  if (!req.session?.adminUser) return res.status(401).json({ message: 'Unauthorized. Please login as admin.' });
  return next();
}

let db;

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await get(db, 'SELECT id, username, name, role FROM admins WHERE username = ? AND password = ?', [username, password]);
  if (!admin) return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });

  req.session.adminUser = {
    id: admin.id,
    username: admin.username,
    name: admin.name,
    role: admin.role,
    loginAt: new Date().toISOString()
  };

  return res.json({ success: true, user: req.session.adminUser });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/admin/me', (req, res) => {
  if (!req.session?.adminUser) return res.status(401).json({ authenticated: false });
  return res.json({ authenticated: true, user: req.session.adminUser });
});

app.get('/api/admin/dashboard', requireAdmin, async (_req, res) => {
  const holidays = await all(db, 'SELECT * FROM holidays ORDER BY date DESC');
  const categoryCounts = holidays.reduce((acc, item) => ((acc[item.category] = (acc[item.category] || 0) + 1), acc), {});
  const districtCounts = holidays.reduce((acc, item) => ((acc[item.district] = (acc[item.district] || 0) + 1), acc), {});
  const rainUpdates = holidays.filter((item) => item.category === 'rain_holiday');

  return res.json({
    totalLeaves: holidays.length,
    categoryCounts,
    districtCounts,
    rainUpdates,
    latestUpdates: holidays.slice(0, 5)
  });
});

app.get('/api/admin/holidays', requireAdmin, async (_req, res) => {
  const holidays = await all(db, 'SELECT * FROM holidays ORDER BY date DESC');
  res.json({ count: holidays.length, data: holidays });
});

app.post('/api/admin/holidays', requireAdmin, async (req, res) => {
  const { date, title, category, district, subDistrict, scope, description, image } = req.body;
  if (!date || !title || !category || !district || !subDistrict || !scope || !description || !image) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const idRow = await get(db, 'SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM holidays');
  const now = new Date().toISOString();
  await run(
    db,
    `INSERT INTO holidays
     (id, date, title, category, district, subDistrict, scope, description, image, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [idRow.nextId, date, title, category, district, subDistrict, scope, description, image, now, now]
  );
  const created = await get(db, 'SELECT * FROM holidays ORDER BY id DESC LIMIT 1');
  return res.status(201).json({ success: true, data: created });
});

app.delete('/api/admin/holidays/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await run(db, 'DELETE FROM holidays WHERE id = ?', [id]);
  return res.json({ success: true });
});

app.get('/api/holidays', async (req, res) => {
  const { category, district } = req.query;
  const conditions = [];
  const params = [];

  if (category && category !== 'all') {
    conditions.push('category = ?');
    params.push(category);
  }
  if (district && district !== 'all') {
    conditions.push('LOWER(district) = LOWER(?)');
    params.push(district);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await all(db, `SELECT * FROM holidays ${where} ORDER BY date ASC`, params);
  res.json({ count: rows.length, data: rows });
});

app.get('/api/summary', async (_req, res) => {
  const holidays = await all(db, 'SELECT * FROM holidays');
  const categoryCounts = holidays.reduce((acc, item) => ((acc[item.category] = (acc[item.category] || 0) + 1), acc), {});
  const rainUpdates = holidays.filter((item) => item.category === 'rain_holiday').map((item) => ({ district: item.district, subDistrict: item.subDistrict, date: item.date }));
  res.json({ totalLeaves: holidays.length, categoryCounts, rainUpdates });
});

(async () => {
  db = await initDb(seedHolidays);
  app.listen(PORT, () => console.log(`Kerala school holidays app running at http://localhost:${PORT}`));
})();
