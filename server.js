const express = require('express');
const path = require('path');
<<<<<<< HEAD
const session = require('express-session');
const seedHolidays = require('./data/holidays.json');
const { initDb, all, get, run } = require('./db');
=======
<<<<<<< HEAD
const session = require('express-session');
const seedHolidays = require('./data/holidays.json');
const { initDb, all, get, run } = require('./db');
=======
const holidays = require('./data/holidays.json');
>>>>>>> main
>>>>>>> origin/main

const app = express();
const PORT = process.env.PORT || 4173;

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'kerala-school-holidays-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 4,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  })
);

app.use(express.static(path.join(__dirname)));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/admin/login', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.get('/admin/dashboard', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

function requireAdmin(req, res, next) {
  if (!req.session?.adminUser) {
    return res.status(401).json({ message: 'Unauthorized. Please login as admin.' });
  }
  return next();
}

function validateHolidayPayload(payload) {
  const required = ['date', 'title', 'category', 'district', 'subDistrict', 'scope', 'description', 'image'];
  return required.every((key) => payload[key] && String(payload[key]).trim());
}

let db;

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await get(db, 'SELECT username, password, display_name, role FROM admins WHERE username = ?', [username]);

  if (!admin || admin.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
  }

  req.session.adminUser = {
    username: admin.username,
    name: admin.display_name,
    role: admin.role,
    loginAt: new Date().toISOString()
  };

  return res.json({ success: true, user: req.session.adminUser });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/admin/me', (req, res) => {
  if (!req.session?.adminUser) {
    return res.status(401).json({ authenticated: false });
  }

  return res.json({ authenticated: true, user: req.session.adminUser });
});

app.get('/api/admin/dashboard', requireAdmin, async (_req, res) => {
  const holidays = await all(db, 'SELECT * FROM holidays ORDER BY date DESC');

  const categoryCounts = holidays.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const districtCounts = holidays.reduce((acc, item) => {
    acc[item.district] = (acc[item.district] || 0) + 1;
    return acc;
  }, {});

  const rainUpdates = holidays.filter((item) => item.category === 'rain_holiday');
  const auditLogs = await all(db, 'SELECT admin_username, action, entity, created_at FROM audit_logs ORDER BY id DESC LIMIT 6');

  return res.json({
    totalLeaves: holidays.length,
    categoryCounts,
    districtCounts,
    rainUpdates,
    latestUpdates: holidays.slice(0, 5),
    auditLogs
  });
});

app.post('/api/admin/holidays', requireAdmin, async (req, res) => {
  if (!validateHolidayPayload(req.body)) {
    return res.status(400).json({ success: false, message: 'All holiday fields are required.' });
  }

  const { date, title, category, district, subDistrict, scope, description, image } = req.body;

  const result = await run(
    db,
    'INSERT INTO holidays (date, title, category, district, subDistrict, scope, description, image, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [date, title, category, district, subDistrict, scope, description, image, req.session.adminUser.username]
  );

  await run(
    db,
    'INSERT INTO audit_logs (admin_username, action, entity, entity_id, payload_json) VALUES (?, ?, ?, ?, ?)',
    [req.session.adminUser.username, 'create', 'holiday', result.lastID, JSON.stringify(req.body)]
  );

  return res.json({ success: true, id: result.lastID });
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

<<<<<<< HEAD
=======
=======
app.use(express.static(path.join(__dirname)));

app.get('/api/holidays', (req, res) => {
  const { category, district } = req.query;
  let result = holidays;

  if (category && category !== 'all') {
    result = result.filter((item) => item.category === category);
  }
  if (district && district !== 'all') {
    result = result.filter((item) => item.district.toLowerCase() === district.toLowerCase());
  }

  res.json({ count: result.length, data: result });
});

app.get('/api/summary', (_req, res) => {
>>>>>>> main
>>>>>>> origin/main
  const categoryCounts = holidays.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const rainUpdates = holidays
    .filter((item) => item.category === 'rain_holiday')
    .map((item) => ({ district: item.district, subDistrict: item.subDistrict, date: item.date }));

  res.json({
    totalLeaves: holidays.length,
    categoryCounts,
    rainUpdates
  });
});

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> origin/main
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

(async () => {
  db = await initDb(seedHolidays);
  app.listen(PORT, () => {
    console.log(`Kerala school holidays app running at http://localhost:${PORT}`);
  });
})();
<<<<<<< HEAD
=======
=======
app.listen(PORT, () => {
  console.log(`Kerala school holidays app running at http://localhost:${PORT}`);
});
>>>>>>> main
>>>>>>> origin/main
