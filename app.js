(function () {
  const tbody = document.getElementById('table-body');
  const countLabel = document.getElementById('count-label');
  const searchInput = document.getElementById('search');
  const cohortSelect = document.getElementById('filter-cohort');
  const countrySelect = document.getElementById('filter-country');
  const confSelect = document.getElementById('filter-conf');
  const posSelect = document.getElementById('filter-pos');
  const headers = document.querySelectorAll('.dash-table thead th');

  let sortKey = 'name';
  let sortDir = 1;

  // populate select options from data
  function uniqueSorted(values) {
    return Array.from(new Set(values.filter(Boolean))).sort();
  }

  const countries = uniqueSorted(PLAYERS.map(p => p.birth_country));
  countries.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    countrySelect.appendChild(opt);
  });

  const confs = uniqueSorted(
    PLAYERS.flatMap(p => p.ncaa_destinations.map(d => d.conf))
  );
  confs.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    confSelect.appendChild(opt);
  });

  const positions = uniqueSorted(PLAYERS.map(p => p.pos));
  positions.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p; opt.textContent = p;
    posSelect.appendChild(opt);
  });

  function lastProLabel(p) {
    if (!p.last_pro_team) return '&mdash;';
    return `<span class="name-cell">${p.last_pro_team}</span><br>
            <span class="sub-cell">${p.last_pro_league || ''}</span>`;
  }

  function ncaaPathLabel(p) {
    if (!p.ncaa_destinations.length) return '&mdash;';
    return p.ncaa_destinations
      .map(d => `<span class="pill">${d.team}</span>`)
      .join(' ');
  }

  function rowMatches(p) {
    const q = searchInput.value.trim().toLowerCase();
    if (q) {
      const hay = `${p.name} ${p.last_pro_team} ${p.hometown}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (cohortSelect.value && p.cohort !== cohortSelect.value) return false;
    if (countrySelect.value && p.birth_country !== countrySelect.value) return false;
    if (posSelect.value && p.pos !== posSelect.value) return false;
    if (confSelect.value && !p.ncaa_destinations.some(d => d.conf === confSelect.value)) return false;
    return true;
  }

  function sortValue(p, key) {
    if (key === 'ncaa') return p.ncaa_destinations.map(d => d.team).join(', ');
    if (key === 'last_pro') return p.last_pro_team || '';
    return p[key] !== undefined ? p[key] : '';
  }

  function render() {
    const filtered = PLAYERS.filter(rowMatches);
    filtered.sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sortDir;
      return String(av).localeCompare(String(bv)) * sortDir;
    });

    countLabel.textContent = `${filtered.length} of ${PLAYERS.length} players`;

    tbody.innerHTML = filtered.map(p => `
      <tr>
        <td><span class="name-cell">${p.name}</span><br><span class="sub-cell">${p.height}</span></td>
        <td>${p.pos}</td>
        <td>${p.birth_country}</td>
        <td>${lastProLabel(p)}</td>
        <td>${p.pro_seasons_count}</td>
        <td>${ncaaPathLabel(p)}</td>
        <td>${p.cohort}</td>
      </tr>
    `).join('');
  }

  [searchInput, cohortSelect, countrySelect, confSelect, posSelect].forEach(el => {
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });

  headers.forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.key;
      if (sortKey === key) {
        sortDir *= -1;
      } else {
        sortKey = key;
        sortDir = 1;
      }
      render();
    });
  });

  render();
})();
