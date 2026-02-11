const CATEGORY_LABELS = {
  rain_holiday: 'Rain Holiday',
  school_strike: 'School Strike',
  strike: 'Strike',
  fixed_holiday: 'Fixed Holiday',
  festival_or_seasonal: 'Festival / Seasonal'
};

const CATEGORY_COLORS = {
  rain_holiday: 'tag-rain',
  school_strike: 'tag-school-strike',
  strike: 'tag-strike',
  fixed_holiday: 'tag-fixed',
  festival_or_seasonal: 'tag-festival'
};

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';

  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    errorEl.textContent = 'Login failed. Please check admin credentials.';
    return;
  }

  window.location.href = '/admin/dashboard';
}

function toCard(title, value, hint = '') {
  return `<article class="card"><h3>${title}</h3><p class="metric">${value}</p><small>${hint}</small></article>`;
}

async function loadHolidayTable() {
  const tbody = document.getElementById('adminHolidayTableBody');
  if (!tbody) return;
  const response = await fetch('/api/admin/holidays');
  if (!response.ok) return;

  const payload = await response.json();
  tbody.innerHTML = payload.data
    .map(
      (item) => `<tr>
        <td>${item.id}</td>
        <td>${item.date}</td>
        <td>${item.title}</td>
        <td>${item.district}</td>
        <td><span class="pill ${CATEGORY_COLORS[item.category] || ''}">${CATEGORY_LABELS[item.category] || item.category}</span></td>
        <td><button class="button button-danger" data-del-id="${item.id}">Delete</button></td>
      </tr>`
    )
    .join('');

  tbody.querySelectorAll('[data-del-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-del-id');
      await fetch(`/api/admin/holidays/${id}`, { method: 'DELETE' });
      await loadAdminDashboard();
      await loadHolidayTable();
    });
  });
}

async function loadAdminDashboard() {
  const kpiEl = document.getElementById('adminKpis');
  if (!kpiEl) return;

  const me = await fetch('/api/admin/me');
  if (!me.ok) return (window.location.href = '/admin/login');

  const response = await fetch('/api/admin/dashboard');
  if (!response.ok) return (window.location.href = '/admin/login');

  const payload = await response.json();
  const rainCount = payload.rainUpdates.length;
  const districtCount = Object.keys(payload.districtCounts).length;

  kpiEl.innerHTML = [
    toCard('Total Leave Entries', payload.totalLeaves, 'All categories combined'),
    toCard('Rain Alerts', rainCount, 'District + sub-district updates'),
    toCard('District Coverage', districtCount, 'Distinct districts in records')
  ].join('');

  const categoryEl = document.getElementById('adminCategoryTotals');
  categoryEl.innerHTML = Object.entries(payload.categoryCounts)
    .map(
      ([key, val]) => `<div class="total-box ${CATEGORY_COLORS[key] || ''}"><strong>${val}</strong><span>${CATEGORY_LABELS[key] || key}</span></div>`
    )
    .join('');

  const latestEl = document.getElementById('adminLatest');
  latestEl.innerHTML = payload.latestUpdates
    .map(
      (item) => `<article class="holiday-card panel"><img src="${item.image}" alt="${item.title}" /><div class="holiday-meta-line"><span class="pill">${item.date}</span><span class="pill ${CATEGORY_COLORS[item.category] || ''}">${CATEGORY_LABELS[item.category] || item.category}</span></div><h3>${item.title}</h3><p>${item.description}</p></article>`
    )
    .join('');
}

async function handleCreateHoliday(event) {
  event.preventDefault();
  const status = document.getElementById('createStatus');
  const payload = {
    date: document.getElementById('holidayDate').value,
    title: document.getElementById('holidayTitle').value.trim(),
    category: document.getElementById('holidayCategory').value,
    district: document.getElementById('holidayDistrict').value.trim(),
    subDistrict: document.getElementById('holidaySubDistrict').value.trim(),
    scope: document.getElementById('holidayScope').value,
    description: document.getElementById('holidayDescription').value.trim(),
    image: document.getElementById('holidayImage').value.trim()
  };

  const response = await fetch('/api/admin/holidays', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    status.textContent = 'Could not create holiday entry. Check fields and try again.';
    status.classList.add('error-text');
    return;
  }

  status.textContent = 'Holiday entry created successfully.';
  status.classList.remove('error-text');
  document.getElementById('holidayCreateForm').reset();
  await loadAdminDashboard();
  await loadHolidayTable();
}

async function handleLogout() {
  await fetch('/api/admin/logout', { method: 'POST' });
  window.location.href = '/admin/login';
}

document.addEventListener('DOMContentLoaded', async () => {
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  const createForm = document.getElementById('holidayCreateForm');
  if (createForm) createForm.addEventListener('submit', handleCreateHoliday);

  await loadAdminDashboard();
  await loadHolidayTable();
});
