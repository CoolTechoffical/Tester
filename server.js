const express = require('express');
const path = require('path');
const holidays = require('./data/holidays.json');

const app = express();
const PORT = process.env.PORT || 4173;

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

app.listen(PORT, () => {
  console.log(`Kerala school holidays app running at http://localhost:${PORT}`);
});
