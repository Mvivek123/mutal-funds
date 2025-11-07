<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mutual Funds Dashboard</title>
  <style>
    :root{--bg:#0f172a;--card:#0b1220;--muted:#94a3b8;--accent:#06b6d4}
    *{box-sizing:border-box}
    body{font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0; background:linear-gradient(180deg,#071027 0%, #071a2a 100%); color:#e6eef6; padding:28px}
    .container{max-width:1100px;margin:0 auto}
    header{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
    h1{font-size:20px;margin:0}
    .controls{display:flex;gap:10px;align-items:center}
    input,select,button{padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);color:inherit}
    button{cursor:pointer}
    .grid{display:grid;grid-template-columns:1fr 360px;gap:18px}
    .card{background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));padding:14px;border-radius:12px;box-shadow:0 6px 18px rgba(2,6,23,0.6)}
    .fund-list{display:flex;flex-direction:column;gap:10px}
    .fund{display:flex;align-items:center;justify-content:space-between;padding:12px;border-radius:10px;background:rgba(255,255,255,0.01)}
    .fund .left{display:flex;gap:12px;align-items:center}
    .avatar{width:44px;height:44px;border-radius:8px;background:linear-gradient(135deg,var(--accent),#7c3aed);display:flex;align-items:center;justify-content:center;font-weight:700}
    .meta small{display:block;color:var(--muted)}
    .tag{font-size:13px;padding:6px 8px;border-radius:999px;background:rgba(255,255,255,0.03)}
    form{display:flex;flex-direction:column;gap:8px}
    label{font-size:13px;color:var(--muted)}
    .row{display:flex;gap:8px}
    .row > *{flex:1}
    .actions{display:flex;justify-content:flex-end;gap:8px}
    .empty{color:var(--muted);text-align:center;padding:40px}
    footer{margin-top:18px;color:var(--muted);font-size:13px;text-align:center}
    @media (max-width:880px){.grid{grid-template-columns:1fr}.controls{flex-direction:column;align-items:stretch}}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Mutual Funds Dashboard</h1>
      <div class="controls">
        <input id="search" placeholder="Search fund name or category" />
        <select id="sort">
          <option value="name">Sort: Name</option>
          <option value="aum_desc">AUM (high → low)</option>
          <option value="aum_asc">AUM (low → high)</option>
          <option value="ret_1y">1Y Return (high → low)</option>
        </select>
        <button id="export">Export CSV</button>
      </div>
    </header>

    <main class="grid">
      <section class="card">
        <h3 style="margin-top:0">Funds</h3>
        <div id="fundList" class="fund-list"></div>
        <div id="empty" class="empty" style="display:none">No funds yet. Add one from the form.</div>
      </section>

      <aside class="card">
        <h3 style="margin-top:0">Add / Edit Fund</h3>
        <form id="fundForm">
          <input type="hidden" id="fundId" />
          <div>
            <label for="name">Fund name</label>
            <input id="name" required placeholder="e.g. Bluechip Growth Fund" />
          </div>
          <div>
            <label for="category">Category</label>
            <input id="category" placeholder="Large Cap / Mid Cap / Debt / Hybrid" />
          </div>
          <div class="row">
            <div>
              <label for="aum">AUM (₹ crores)</label>
              <input id="aum" type="number" step="0.01" placeholder="e.g. 2500" />
            </div>
            <div>
              <label for="ret1y">1Y Return (%)</label>
              <input id="ret1y" type="number" step="0.01" placeholder="e.g. 12.5" />
            </div>
          </div>
          <div class="actions">
            <button type="button" id="reset">Reset</button>
            <button type="submit" id="save">Save Fund</button>
          </div>
        </form>

        <hr style="margin:12px 0;border:none;border-top:1px solid rgba(255,255,255,0.03)" />
        <div>
          <h4 style="margin:6px 0">Quick filters</h4>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="filter" data-cat="All">All</button>
            <button class="filter" data-cat="Large Cap">Large Cap</button>
            <button class="filter" data-cat="Mid Cap">Mid Cap</button>
            <button class="filter" data-cat="Debt">Debt</button>
            <button class="filter" data-cat="Hybrid">Hybrid</button>
          </div>
        </div>
      </aside>
    </main>

    <footer>Simple client-only demo. Data is saved locally in your browser (localStorage).</footer>
  </div>

  <script>
    // Simple Mutual Funds single-file app (no frameworks)
    const sample = [
      {id: genId(), name: 'Bluechip Growth Fund', category: 'Large Cap', aum: 4320.5, ret1y: 14.2},
      {id: genId(), name: 'MidCap Opportunity', category: 'Mid Cap', aum: 880.3, ret1y: 22.5},
      {id: genId(), name: 'Income Stable Fund', category: 'Debt', aum: 1240.0, ret1y: 6.1},
      {id: genId(), name: 'Balanced Advantage', category: 'Hybrid', aum: 1500, ret1y: 11.3}
    ];

    const KEY = 'mf_demo_v1';
    const state = { funds: loadFunds() };

    // DOM refs
    const fundList = document.getElementById('fundList');
    const emptyEl = document.getElementById('empty');
    const form = document.getElementById('fundForm');
    const idInput = document.getElementById('fundId');
    const nameInput = document.getElementById('name');
    const catInput = document.getElementById('category');
    const aumInput = document.getElementById('aum');
    const retInput = document.getElementById('ret1y');
    const searchInput = document.getElementById('search');
    const sortSelect = document.getElementById('sort');
    const exportBtn = document.getElementById('export');
    const resetBtn = document.getElementById('reset');

    // initial render
    render();

    // events
    form.addEventListener('submit', e => {
      e.preventDefault();
      const id = idInput.value || genId();
      const fund = {
        id,
        name: nameInput.value.trim(),
        category: catInput.value.trim() || 'Unspecified',
        aum: parseFloat(aumInput.value || 0),
        ret1y: parseFloat(retInput.value || 0)
      };
      upsertFund(fund);
      formReset();
      render();
    });

    resetBtn.addEventListener('click', () => { formReset(); });
    searchInput.addEventListener('input', render);
    sortSelect.addEventListener('change', render);
    exportBtn.addEventListener('click', exportCSV);

    document.querySelectorAll('.filter').forEach(btn => btn.addEventListener('click', (e)=>{
      const cat = e.target.dataset.cat;
      searchInput.value = ''; // clear search
      if(cat === 'All') catInput.value = '';
      render(cat);
    }));

    // functions
    function genId(){return 'f_' + Math.random().toString(36).slice(2,9)}
    function loadFunds(){
      try{
        const raw = localStorage.getItem(KEY);
        if(!raw) { localStorage.setItem(KEY, JSON.stringify(sample)); return sample.slice(); }
        return JSON.parse(raw);
      }catch(e){console.error(e); return sample.slice();}
    }
    function saveFunds(){ localStorage.setItem(KEY, JSON.stringify(state.funds)); }

    function upsertFund(f){
      const idx = state.funds.findIndex(x=>x.id===f.id);
      if(idx >= 0) state.funds[idx] = f; else state.funds.unshift(f);
      saveFunds();
    }
    function deleteFund(id){
      if(!confirm('Delete this fund?')) return;
      state.funds = state.funds.filter(x=>x.id!==id);
      saveFunds(); render();
    }

    function editFund(id){
      const f = state.funds.find(x=>x.id===id); if(!f) return;
      idInput.value = f.id; nameInput.value = f.name; catInput.value = f.category; aumInput.value = f.aum; retInput.value = f.ret1y;
    }

    function formReset(){ form.reset(); idInput.value=''; }

    function render(forcedCategory){
      const q = searchInput.value.trim().toLowerCase();
      let list = state.funds.slice();
      if(forcedCategory){ if(forcedCategory!=='All') list = list.filter(x=>x.category===forcedCategory); }
      if(q) list = list.filter(f=> f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));

      const sortBy = sortSelect.value;
      if(sortBy === 'aum_desc') list.sort((a,b)=>b.aum - a.aum);
      else if(sortBy === 'aum_asc') list.sort((a,b)=>a.aum - b.aum);
      else if(sortBy === 'ret_1y') list.sort((a,b)=>b.ret1y - a.ret1y);
      else list.sort((a,b)=> a.name.localeCompare(b.name));

      fundList.innerHTML = '';
      if(list.length === 0){ emptyEl.style.display='block'; return; } else emptyEl.style.display='none';

      list.forEach(f=>{
        const el = document.createElement('div'); el.className='fund';
        el.innerHTML = `
          <div class="left">
            <div class="avatar">${initials(f.name)}</div>
            <div class="meta">
              <strong>${escapeHtml(f.name)}</strong>
              <small>${escapeHtml(f.category)} • AUM: ₹${formatNumber(f.aum)} cr</small>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <div class="tag">${formatPercent(f.ret1y)}</div>
            <button onclick="window.__edit('${f.id}')">Edit</button>
            <button onclick="window.__del('${f.id}')">Delete</button>
          </div>
        `;
        fundList.appendChild(el);
      });
    }

    // helpers bound to window for inline handlers
    window.__edit = (id) => editFund(id);
    window.__del = (id) => deleteFund(id);

    function initials(name){ return name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase(); }
    function formatNumber(n){ return Number(n).toLocaleString(undefined,{maximumFractionDigits:2}); }
    function formatPercent(n){ const s = isNaN(n)? '—' : (n >= 0 ? `+${n.toFixed(2)}%` : `${n.toFixed(2)}%`); return s; }
    function escapeHtml(s){ return (s+'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function exportCSV(){
      if(!state.funds.length){ alert('No data to export'); return; }
      const rows = [['Name','Category','AUM (₹ cr)','1Y Return (%)']];
      state.funds.forEach(f=> rows.push([f.name,f.category,f.aum,f.ret1y]));
      const csv = rows.map(r=> r.map(c=> '"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
      const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'mutual-funds.csv'; a.click(); URL.revokeObjectURL(url);
    }

  </script>
</body>
</html>
