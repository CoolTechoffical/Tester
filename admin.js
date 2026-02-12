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

function setLoginStatus(message = '', isError = false) {
  const statusEl = document.getElementById('loginStatus');
  const errorEl = document.getElementById('loginError');
  if (statusEl) statusEl.textContent = isError ? '' : message;
  if (errorEl) errorEl.textContent = isError ? message : '';
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const loginBtn = document.getElementById('loginBtn');

  setLoginStatus('Checking credentials...');
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';
  }

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      setLoginStatus('Login failed. Please check admin credentials.', true);
      return;
    }

    setLoginStatus('Login successful. Redirecting...');
    window.location.href = '/admin/dashboard';
  } catch (_error) {
    setLoginStatus('Network error while logging in. Please retry.', true);
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login to Admin Dashboard';
    }
  }
}

function toCard(title, value, hint = '') {
  return `<article class="card"><h3>${title}</h3><p class="metric">${value}</p><small>${hint}</small></article>`;
}

async function loadAdminDashboard() {
  const kpiEl = document.getElementById('adminKpis');
  if (!kpiEl) return;

  try {
    const me = await fetch('/api/admin/me');
    if (!me.ok) {
      window.location.href = '/admin/login';
      return;
    }

    const response = await fetch('/api/admin/dashboard');
    if (!response.ok) {
      window.location.href = '/admin/login';
      return;
    }

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
        ([key, val]) => `
        <div class="total-box ${CATEGORY_COLORS[key] || ''}">
          <strong>${val}</strong>
          <span>${CATEGORY_LABELS[key] || key}</span>
        </div>`
      )
      .join('');

    const latestEl = document.getElementById('adminLatest');
    latestEl.innerHTML = payload.latestUpdates
      .map(
        (item) => `
        <article class="holiday-card panel">
          <img src="${item.image}" alt="${item.title}" />
          <div class="holiday-meta-line">
            <span class="pill">${item.date}</span>
            <span class="pill ${CATEGORY_COLORS[item.category] || ''}">${CATEGORY_LABELS[item.category] || item.category}</span>
          </div>
          <h3>${item.title}</h3>
          <p>${item.description}</p>
        </article>`
      )
      .join('');

    const districtBody = document.getElementById('districtTableBody');
    districtBody.innerHTML = Object.entries(payload.districtCounts)
      .map(([district, count]) => `<tr><td>${district}</td><td>${count}</td></tr>`)
      .join('');

    const auditBody = document.getElementById('auditLogBody');
    if (auditBody) {
      auditBody.innerHTML = payload.auditLogs
        .map(
          (log) => `<tr><td>${log.admin_username}</td><td>${log.action}</td><td>${log.entity}</td><td>${log.created_at}</td></tr>`
        )
        .join('');
    }
  } catch (_error) {
    kpiEl.innerHTML = `<article class="card"><h3>Dashboard Error</h3><p class="metric">⚠️</p><small>Unable to load admin dashboard data. Please refresh.</small></article>`;
  }
}

async function handleCreateHoliday(event) {
  event.preventDefault();
  const form = event.target;
  const message = document.getElementById('createHolidayMessage');
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  try {
    const response = await fetch('/api/admin/holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      message.textContent = 'Failed to create holiday. Check all fields.';
      return;
    }

    message.textContent = 'Holiday created successfully.';
    form.reset();
    await loadAdminDashboard();
  } catch (_error) {
    message.textContent = 'Network error while saving holiday.';
  }
}

async function handleLogout() {
  await fetch('/api/admin/logout', { method: 'POST' });
  window.location.href = '/admin/login';
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('adminLoginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  const createHolidayForm = document.getElementById('createHolidayForm');
  if (createHolidayForm) createHolidayForm.addEventListener('submit', handleCreateHoliday);

  loadAdminDashboard();
});
