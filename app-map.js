(function () {
  // This app's country names -> the exact `properties.name` strings used in
  // the bundled countries-110m.json (from the world-atlas npm package).
  // Only entries where the names differ are listed; everything else matches directly.
  const NAME_FIXUP = {
    'Bosnia and Herzegovina': 'Bosnia and Herz.',
    'Democratic Republic of the Congo': 'Dem. Rep. Congo',
    'North Macedonia': 'Macedonia',
    'South Sudan': 'S. Sudan',
    'USA': 'United States of America',
    // "England" has no separate shape in this atlas — closest available
    // geometry is the whole United Kingdom. Flagged in the UI as approximate.
    'England': 'United Kingdom',
  };
 
  function appNameToAtlasName(appName) {
    return NAME_FIXUP[appName] || appName;
  }
 
  const ATLAS_TO_APP = {};
  Object.keys(COUNTRY_DATA).forEach(appName => {
    ATLAS_TO_APP[appNameToAtlasName(appName)] = appName;
  });
 
  const counts = Object.entries(COUNTRY_DATA).map(([, v]) => v.count);
  const maxCount = Math.max(...counts);
  const color = d3.scaleSequential()
    .domain([0, maxCount])
    .interpolator(d3.interpolateRgb('#eae5d4', '#0f1f3d'));
 
  // legend
  const legend = document.getElementById('legend');
  const steps = [0, Math.round(maxCount * 0.25), Math.round(maxCount * 0.5), Math.round(maxCount * 0.75), maxCount];
  legend.innerHTML = 'Fewer' + steps.map(s =>
    `<span class="legend-swatch" style="background:${color(s)}"></span>`
  ).join('') + 'More&nbsp;&nbsp;(max: ' + maxCount + ' players &mdash; Spain)';
 
  const svg = d3.select('#map-svg');
  const tooltip = document.getElementById('tooltip');
 
  const projection = d3.geoNaturalEarth1().scale(155).translate([480, 260]);
  const path = d3.geoPath(projection);
 
  try {
    const geo = topojson.feature(WORLD_ATLAS, WORLD_ATLAS.objects.countries);
 
    svg.selectAll('path')
      .data(geo.features)
      .join('path')
      .attr('d', path)
      .attr('class', d => {
        const appName = ATLAS_TO_APP[d.properties.name];
        return 'country-shape' + (appName ? '' : ' no-data');
      })
      .attr('fill', d => {
        const appName = ATLAS_TO_APP[d.properties.name];
        return appName ? color(COUNTRY_DATA[appName].count) : '#e9e4d4';
      })
      .on('mousemove', (event, d) => {
        const appName = ATLAS_TO_APP[d.properties.name];
        if (!appName) { tooltip.style.display = 'none'; return; }
        const cd = COUNTRY_DATA[appName];
        tooltip.style.display = 'block';
        tooltip.style.left = (event.clientX + 14) + 'px';
        tooltip.style.top = (event.clientY + 10) + 'px';
        tooltip.textContent = `${appName} — ${cd.count} player${cd.count === 1 ? '' : 's'}`;
      })
      .on('mouseleave', () => { tooltip.style.display = 'none'; })
      .on('click', (event, d) => {
        const appName = ATLAS_TO_APP[d.properties.name];
        if (!appName) return;
        openPanel(appName);
      });
  } catch (err) {
    console.error('Failed to render world atlas:', err);
    document.getElementById('map-wrap').insertAdjacentHTML('beforeend',
      '<p style="color:#a33; font-family:monospace; font-size:13px;">Map failed to render — see browser console for details.</p>');
  }
 
  function openPanel(name) {
    const cd = COUNTRY_DATA[name];
    const panel = document.getElementById('panel');
    document.getElementById('panel-title').textContent = name;
    document.getElementById('panel-sub').textContent =
      `${cd.count} player${cd.count === 1 ? '' : 's'} played professionally here before the NCAA` +
      (cd.n_reached_ncaa ? ` · ${cd.n_reached_ncaa} with a real NCAA season logged so far` : '');
 
    document.getElementById('panel-players').innerHTML = cd.players.map(p => `
      <div class="player-row">
        <div class="pname">${p.name} <span style="color:var(--slate); font-weight:400;">(${p.pos})</span></div>
        <div class="psub">${p.teams.join(' / ')} &middot; ${p.leagues.join(', ')} &middot; ${p.seasons.join(', ')}</div>
        ${p.ncaa_team ? `<div class="psub">&rarr; ${p.ncaa_team} (${p.ncaa_conf || 'NCAA'})</div>` : `<div class="psub">&rarr; not in the NCAA yet</div>`}
      </div>
    `).join('');
 
    document.getElementById('panel-destinations').innerHTML = cd.top_destinations.length
      ? cd.top_destinations.map(([conf, n]) => `
          <div class="dest-row"><span>${conf}</span><span class="n">${n}</span></div>
        `).join('')
      : '<div class="psub">No players from here have reached the NCAA yet.</div>';
 
    const compare = [
      { k: 'Pro PTS/36', v: cd.avg_pro_pts36 }, { k: 'NCAA PTS/36', v: cd.avg_ncaa_pts36 },
      { k: 'Pro REB/36', v: cd.avg_pro_reb36 }, { k: 'NCAA REB/36', v: cd.avg_ncaa_reb36 },
      { k: 'Pro AST/36', v: cd.avg_pro_ast36 }, { k: 'NCAA AST/36', v: cd.avg_ncaa_ast36 },
    ];
    document.getElementById('panel-compare').innerHTML = compare.map(c => `
      <div class="compare-cell"><div class="v">${c.v !== null && c.v !== undefined ? c.v : '&mdash;'}</div><div class="k">${c.k}</div></div>
    `).join('');
 
    panel.classList.add('open');
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
 
  document.getElementById('panel-close').addEventListener('click', () => {
    document.getElementById('panel').classList.remove('open');
  });
})();