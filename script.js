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

async function loadSummary() {
  const totalEl = document.getElementById('totalLeaveCount');
  const catEl = document.getElementById('categoryTotals');
  if (!totalEl && !catEl) return;

  const res = await fetch('/api/summary');
  const payload = await res.json();

  if (totalEl) totalEl.textContent = payload.totalLeaves;

  if (catEl) {
    catEl.innerHTML = Object.entries(payload.categoryCounts)
      .map(([key, val]) => `
        <div class="total-box ${CATEGORY_COLORS[key] || ''}">
          <strong>${val}</strong>
          <span>${CATEGORY_LABELS[key] || key}</span>
        </div>
      `)
      .join('');
  }
}

async function loadHolidays() {
  const container = document.getElementById('holidayCards');
  const districtFilter = document.getElementById('districtFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const countEl = document.getElementById('resultCount');

  if (!container) return;

  const params = new URLSearchParams({
    category: categoryFilter?.value || 'all',
    district: districtFilter?.value || 'all'
  });

  const res = await fetch(`/api/holidays?${params.toString()}`);
  const payload = await res.json();

  container.innerHTML = payload.data
    .map(
      (item) => `
      <article class="holiday-card panel">
        <img src="${item.image}" alt="${item.title}" />
        <div class="holiday-meta-line">
          <span class="pill">Date: ${item.date}</span>
          <span class="pill ${CATEGORY_COLORS[item.category] || ''}">${CATEGORY_LABELS[item.category] || item.category}</span>
        </div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="meta-footer">
          <span><b>District:</b> ${item.district}</span>
          <span><b>Sub-district:</b> ${item.subDistrict}</span>
          <span><b>Scope:</b> ${item.scope.replace('_', ' ')}</span>
        </div>
      </article>
    `
    )
    .join('');

  if (countEl) countEl.textContent = payload.count;
}

document.addEventListener('DOMContentLoaded', async () => {
  const districtFilter = document.getElementById('districtFilter');
  const categoryFilter = document.getElementById('categoryFilter');

  await loadSummary();
  await loadHolidays();

  districtFilter?.addEventListener('change', loadHolidays);
  categoryFilter?.addEventListener('change', loadHolidays);
});
