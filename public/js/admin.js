// Basic admin UI script: fetch lists, render tables, basic modals, socket updates
(function(){
  const pkMap = { parents: 'parent_id', drivers: 'driver_id', buses: 'bus_id', students: 'student_id', routes: 'route_id', stops: 'stop_id', schedules: 'schedule_id', assignments: 'assignment_id', messages: 'message_id', notifications: 'notif_id', 'pickup-records':'record_id', 'driver-reports':'report_id' };
  const resources = ['parents','drivers','buses','students','routes','stops','schedules','assignments','messages','notifications','pickup-records','driver-reports'];

  function $(sel){ return document.querySelector(sel); }
  function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

  // Role check
  document.addEventListener('DOMContentLoaded', init);

  function init(){
    const role = localStorage.getItem('role') || 'guest';
    $('#role-indicator').textContent = role;
    if (role !== 'admin') {
      // strict client-side guard: redirect non-admin users to login
      window.location.href = '/login.html';
      return;
    }

    // nav
    $all('.sidebar .btn[data-view]').forEach(b=> b.addEventListener('click', () => showView(b.dataset.view)));
    showView('dashboard');

    // buttons for adding
    $('#add-parent')?.addEventListener('click', () => openModal('add','parents'));
    $('#add-driver')?.addEventListener('click', () => openModal('add','drivers'));
    $('#add-bus')?.addEventListener('click', () => openModal('add','buses'));
    $('#add-route')?.addEventListener('click', () => openModal('add','routes'));
    $('#add-stop')?.addEventListener('click', () => openModal('add','stops'));
    $('#add-schedule')?.addEventListener('click', () => openModal('add','schedules'));

    // modal events
    $('#modal-close').addEventListener('click', closeModal);
    $('#modal-cancel').addEventListener('click', closeModal);
    $('#modal-form').addEventListener('submit', onSubmitForm);

    // socket
    if (window.io) {
      const socket = io();
      // expose for debugging
      window.adminSocket = socket;
      socket.on('connect', ()=> console.log('admin socket connected', socket.id));
      // commonly emitted events
      ['parentAdded','parentUpdated','parentDeleted','driverAdded','driverUpdated','driverDeleted','busAdded','busUpdated','busDeleted','routeAdded','routeUpdated','routeDeleted','stopAdded','stopUpdated','stopDeleted','scheduleAdded','scheduleUpdated','scheduleDeleted','assignmentAdded','assignmentUpdated','assignmentDeleted','messageAdded','notificationAdded','pickupRecordAdded','reportAdded','updateBuses'].forEach(evt=>{
        socket.on(evt, data => {
          console.log('socket',evt,data);
          if (evt.startsWith('parent')) fetchAndRender('parents');
          if (evt.startsWith('driver')) fetchAndRender('drivers');
          if (evt.startsWith('bus') || evt==='updateBuses') fetchAndRender('buses');
          if (evt.startsWith('route')) fetchAndRender('routes');
          if (evt.startsWith('stop')) fetchAndRender('stops');
          if (evt.startsWith('schedule')) fetchAndRender('schedules');
          if (evt.startsWith('assignment')) fetchAndRender('assignments');
          if (evt.startsWith('message')) fetchAndRender('messages');
          if (evt.startsWith('notification')) fetchAndRender('notifications');
          if (evt.startsWith('pickup')) fetchAndRender('pickup-records');
          if (evt.startsWith('report')) fetchAndRender('driver-reports');
        });
      });

      // position-specific realtime updates: update marker directly
      socket.on('positionUpdated', data => {
        try{ console.log('socket positionUpdated', data); updateMarker(data); }catch(e){console.error(e)}
      });

      socket.on('busDeleted', data => {
        try{ const id = data.bus_id || data.id; if (id) removeMarker(id); }catch(e){console.error(e)}
      });
    }

    // initial fetch
    resources.forEach(r => fetchAndRender(r));
    fetchHealth();
    updateStatistics();

    // fetch maps key and load Google Maps script (if available)
    try{
      fetch('/api/config').then(r=>r.json()).then(cfg=>{
        if (cfg && cfg.mapsKey){
          loadGoogleMapsScript(cfg.mapsKey);
        } else {
          console.warn('No Google Maps API key configured (process.env.GOOGLE_MAPS_API_KEY)');
        }
      }).catch(err=>console.warn('Failed to load map config',err));
    }catch(e){console.warn('map init err',e)}

    // search functionality (server-side)
    const debounce = (fn, wait=300) => { let t; return (...a)=>{ clearTimeout(t); t = setTimeout(()=>fn(...a), wait); }; };
    document.getElementById('parents-search')?.addEventListener('input', debounce((e) => {
      fetchAndRender('parents', e.target.value);
    }));
    document.getElementById('drivers-search')?.addEventListener('input', debounce((e) => {
      fetchAndRender('drivers', e.target.value);
    }));
    document.getElementById('buses-search')?.addEventListener('input', debounce((e) => {
      fetchAndRender('buses', e.target.value);
    }));

    // logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      localStorage.removeItem('role');
      window.location.href = '/login.html';
    });
  }

  function showView(name){
    $all('.view').forEach(v=> v.classList.add('hidden'));
    const el = document.getElementById('view-' + name);
    if (el) el.classList.remove('hidden');
    $('#view-title').textContent = name.charAt(0).toUpperCase() + name.slice(1);
  }

  async function fetchAndRender(resource, q){
    try{
      let url = `/api/${resource}/list`;
      if (q) url += `?q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if(!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      const rows = data.data || data;
      renderTable(resource, rows);
    }catch(err){
      console.error('fetchAndRender',resource,err);
    }
  }

  function renderTable(resource, rows){
    const tbody = document.getElementById(resource + '-table-body');
    if(!tbody) return;
    tbody.innerHTML = '';
    rows.forEach((r, idx)=>{
      const id = r[pkMap[resource]] ?? r.id ?? r[Object.keys(r)[0]];
      const tr = document.createElement('tr');
      if (resource === 'parents'){
        tr.innerHTML = `<td>${id}</td><td>${escapeHtml(r.full_name)}</td><td>${escapeHtml(r.phone)}</td><td>${escapeHtml(r.email)}</td><td>
          <button class="btn ghost" data-action="edit" data-resource="${resource}" data-id="${id}">Sửa</button>
          <button class="btn danger" data-action="delete" data-resource="${resource}" data-id="${id}">Xóa</button>
        </td>`;
      } else if (resource === 'drivers'){
        tr.innerHTML = `<td>${id}</td><td>${escapeHtml(r.full_name)}</td><td>${escapeHtml(r.phone)}</td><td>${escapeHtml(r.license_no||'')}</td><td>
          <button class="btn ghost" data-action="edit" data-resource="${resource}" data-id="${id}">Sửa</button>
          <button class="btn danger" data-action="delete" data-resource="${resource}" data-id="${id}">Xóa</button>
        </td>`;
      } else if (resource === 'buses'){
        tr.innerHTML = `<td>${id}</td><td>${escapeHtml(r.plate_no)}</td><td>${escapeHtml(r.capacity||'')}</td><td>
          <button class="btn ghost" data-action="edit" data-resource="${resource}" data-id="${id}">Sửa</button>
          <button class="btn danger" data-action="delete" data-resource="${resource}" data-id="${id}">Xóa</button>
        </td>`;
      } else if (resource === 'students'){
        tr.innerHTML = `<td>${id}</td><td>${escapeHtml(r.full_name)}</td><td>${escapeHtml(r.student_code)}</td><td>${escapeHtml(r.parent_id||'')}</td><td>
          <button class="btn ghost" data-action="edit" data-resource="${resource}" data-id="${id}">Sửa</button>
          <button class="btn danger" data-action="delete" data-resource="${resource}" data-id="${id}">Xóa</button>
        </td>`;
      } else if (resource === 'routes'){
        tr.innerHTML = `<td>${id}</td><td>${escapeHtml(r.route_name||r.name||'')}</td><td>${escapeHtml(r.description||'')}</td><td>
          <button class="btn ghost" data-action="edit" data-resource="${resource}" data-id="${id}">Sửa</button>
          <button class="btn danger" data-action="delete" data-resource="${resource}" data-id="${id}">Xóa</button>
        </td>`;
      } else if (resource === 'stops'){
        tr.innerHTML = `<td>${id}</td><td>${escapeHtml(r.stop_name||r.name||'')}</td><td>${escapeHtml(r.lat||'')}</td><td>${escapeHtml(r.lon||'')}</td><td>
          <button class="btn ghost" data-action="edit" data-resource="${resource}" data-id="${id}">Sửa</button>
          <button class="btn danger" data-action="delete" data-resource="${resource}" data-id="${id}">Xóa</button>
        </td>`;
      } else if (resource === 'schedules'){
        tr.innerHTML = `<td>${id}</td><td>${escapeHtml(r.route_id||r.route_name||'')}</td><td>${escapeHtml(r.schedule_date||'')}</td><td>${escapeHtml(r.start_time||'')}</td><td>
          <button class="btn ghost" data-action="edit" data-resource="${resource}" data-id="${id}">Sửa</button>
          <button class="btn danger" data-action="delete" data-resource="${resource}" data-id="${id}">Xóa</button>
        </td>`;
      } else if (resource === 'assignments'){
        tr.innerHTML = `<td>${id}</td><td>${escapeHtml(r.schedule_id||'')}</td><td>${escapeHtml(r.bus_id||'')}</td><td>${escapeHtml(r.driver_id||'')}</td><td>
          <button class="btn ghost" data-action="edit" data-resource="${resource}" data-id="${id}">Sửa</button>
          <button class="btn danger" data-action="delete" data-resource="${resource}" data-id="${id}">Xóa</button>
        </td>`;
      } else if (resource === 'messages'){
        tr.innerHTML = `<td>${id}</td><td>${escapeHtml(r.to_type+'#'+(r.to_id||''))}</td><td>${escapeHtml(r.message_text||'')}</td><td>${escapeHtml(r.created_at||r.timestamp||'')}</td><td>
          <button class="btn ghost" data-action="edit" data-resource="${resource}" data-id="${id}">Sửa</button>
          <button class="btn danger" data-action="delete" data-resource="${resource}" data-id="${id}">Xóa</button>
        </td>`;
      } else if (resource === 'notifications'){
        tr.innerHTML = `<td>${id}</td><td>${escapeHtml(r.notif_type||'')}</td><td>${escapeHtml(r.content||'')}</td><td>
          <button class="btn ghost" data-action="edit" data-resource="${resource}" data-id="${id}">Sửa</button>
          <button class="btn danger" data-action="delete" data-resource="${resource}" data-id="${id}">Xóa</button>
        </td>`;
      } else if (resource === 'pickup-records'){
        tr.innerHTML = `<td>${id}</td><td>${escapeHtml(r.student_id||'')}</td><td>${escapeHtml(r.action||'')}</td><td>${escapeHtml(r.created_at||'')}</td><td>
          <button class="btn danger" data-action="delete" data-resource="${resource}" data-id="${id}">Xóa</button>
        </td>`;
      } else if (resource === 'driver-reports'){
        tr.innerHTML = `<td>${id}</td><td>${escapeHtml(r.driver_id||'')}</td><td>${escapeHtml(r.report_type||'')}</td><td>${escapeHtml(r.description||'')}</td><td>${escapeHtml(r.created_at||'')}</td>`;
      }
      tbody.appendChild(tr);
    });

    // attach action handlers
    tbody.querySelectorAll('button[data-action]').forEach(btn=>{
      btn.addEventListener('click', async (e)=>{
        const action = btn.dataset.action, resource = btn.dataset.resource, id = btn.dataset.id;
        if (action === 'edit'){
          // fetch single item if endpoint exists
          try{
            const res = await fetch(`/api/${resource}/${id}`);
            const d = await res.json();
            openModal('edit', resource, d.data || d);
          }catch(err){ openModal('edit', resource, { [pkMap[resource]]: id }); }
        } else if (action === 'delete'){
          if (!confirm('Bạn có chắc muốn xóa?')) return;
          try{
            await fetch(`/api/${resource}/${id}`, { method: 'DELETE' });
            fetchAndRender(resource);
          }catch(err){ console.error('delete error',err); }
        }
      });
    });
  }

  function openModal(mode, resource, data){
    $('#modal').classList.remove('hidden');
    $('#modal-backdrop').classList.remove('hidden');
    $('#modal-title').textContent = (mode==='add' ? 'Thêm ' : 'Sửa ') + resource;
    $('#modal-form').dataset.mode = mode;
    $('#modal-form').dataset.resource = resource;
    $('#modal-form').dataset.id = data ? (data[pkMap[resource]] || data.id) : '';

    const fields = $('#modal-fields');
    fields.innerHTML = '';
    if (resource === 'parents'){
      fields.innerHTML = `
        <label>Id_Parent <input name="parent_id" value="${escapeHtml(data?.parent_id||'')}"></label>
        <label>Họ tên <input name="full_name" value="${escapeHtml(data?.full_name||'')}"></label>
        <label>SĐT <input name="phone" value="${escapeHtml(data?.phone||'')}"></label>
        <label>Email <input name="email" value="${escapeHtml(data?.email||'')}"></label>
      `;
    } else if (resource === 'drivers'){
      fields.innerHTML = `
        <label>Họ tên <input name="full_name" value="${escapeHtml(data?.full_name||'')}"></label>
        <label>SĐT <input name="phone" value="${escapeHtml(data?.phone||'')}"></label>
        <label>Bằng lái <input name="license_no" value="${escapeHtml(data?.license_no||'')}"></label>
        <label>Email <input name="email" value="${escapeHtml(data?.email||'')}"></label>
      `;
    } else if (resource === 'buses'){
      fields.innerHTML = `
        <label>Biển <input name="plate_no" value="${escapeHtml(data?.plate_no||'')}"></label>
        <label>Sức chứa <input name="capacity" value="${escapeHtml(data?.capacity||'')}"></label>
      `;
    } else {
      fields.innerHTML = `<label>Data JSON<textarea name="raw">${escapeHtml(JSON.stringify(data||{}))}</textarea></label>`;
    }
  }

  function closeModal(){
    $('#modal').classList.add('hidden');
    $('#modal-backdrop').classList.add('hidden');
    $('#modal-fields').innerHTML = '';
  }

  async function onSubmitForm(e){
    e.preventDefault();
    const form = e.target;
    const mode = form.dataset.mode; const resource = form.dataset.resource; const id = form.dataset.id;
    const fd = new FormData(form);
    const body = {};
    for (const [k,v] of fd.entries()) body[k] = v;

    try{
      const url = `/api/${resource}` + (mode==='edit' ? `/${id}` : '');
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success){
        closeModal();
        fetchAndRender(resource);
      } else {
        alert(data.error || data.message || 'Lỗi');
      }
    }catch(err){ console.error('submit error',err); alert('Lỗi gửi dữ liệu'); }
  }

  async function fetchHealth(){
    try{
      // try /api/health then /health
      let res = await fetch('/api/health');
      if (!res.ok) res = await fetch('/health');
      const data = await res.json();
      $('#health-status').textContent = JSON.stringify(data);
    }catch(err){ $('#health-status').textContent = 'Không thể kiểm tra: ' + err.message; }
  }

  function escapeHtml(s){ if (s==null) return ''; return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }

  // Update statistics on dashboard
  async function updateStatistics(){
    try{
      const parentsRes = await fetch('/api/parents/list');
      const parentsData = await parentsRes.json();
      const parentCount = (parentsData.data || parentsData).length;
      document.getElementById('stat-parents').textContent = parentCount;
      const parentsCountEl = document.getElementById('parents-count'); if (parentsCountEl) parentsCountEl.textContent = parentCount;

      const driversRes = await fetch('/api/drivers/list');
      const driversData = await driversRes.json();
      const driverCount = (driversData.data || driversData).length;
      document.getElementById('stat-drivers').textContent = driverCount;
      const driversCountEl = document.getElementById('drivers-count'); if (driversCountEl) driversCountEl.textContent = driverCount;

      const busesRes = await fetch('/api/buses/list');
      const busesData = await busesRes.json();
      const busCount = (busesData.data || busesData).length;
      document.getElementById('stat-buses').textContent = busCount;
      const busesCountEl = document.getElementById('buses-count'); if (busesCountEl) busesCountEl.textContent = busCount;

      const studentsRes = await fetch('/api/students/list');
      const studentsData = await studentsRes.json();
      const studentCount = (studentsData.data || studentsData).length;
      const statStudents = document.getElementById('stat-students'); if (statStudents) statStudents.textContent = studentCount;
    }catch(err){
      console.error('updateStatistics error',err);
    }
  }

  // Filter table by search term
  function filterTable(resource, searchTerm){
    const tbody = document.getElementById(resource + '-table-body');
    if(!tbody) return;
    const rows = tbody.querySelectorAll('tr');
    const term = (searchTerm||'').toLowerCase();
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(term) ? '' : 'none';
    });
  }

  // --- Google Maps integration ---
  let map = null;
  let mapMarkers = new Map();
  let infoWindow = null;

  function loadGoogleMapsScript(apiKey){
    if (!apiKey) return console.warn('No maps api key provided');
    if (window.google && window.google.maps) return initMap();
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    s.async = true; s.defer = true;
    document.head.appendChild(s);
    window.initMap = initMap;
  }

  function initMap(){
    try{
      const el = document.getElementById('map');
      if (!el) return console.warn('Map container not found');
      const defaultCenter = { lat: 21.0277644, lng: 105.8341598 };
      map = new google.maps.Map(el, { center: defaultCenter, zoom: 12 });
      infoWindow = new google.maps.InfoWindow();
      // initial load
      loadPositions();
    }catch(e){ console.error('initMap error',e); }
  }

  async function loadPositions(){
    try{
      const res = await fetch('/api/positions/latest');
      if (!res.ok) throw new Error('Failed to fetch positions');
      const arr = await res.json();
      if (!Array.isArray(arr)) return;
      const bounds = new google.maps.LatLngBounds();
      arr.forEach(b => {
        if (b.current_lat==null || b.current_lon==null) return;
        updateMarker(b);
        bounds.extend({ lat: parseFloat(b.current_lat), lng: parseFloat(b.current_lon) });
      });
      if (!bounds.isEmpty) map.fitBounds(bounds);
    }catch(err){ console.warn('loadPositions', err); }
  }

  function updateMarker(bus){
    try{
      if (!bus) return;
      const id = bus.bus_id || bus.id || bus.busId;
      const lat = bus.current_lat || bus.lat || bus.lat;
      const lon = bus.current_lon || bus.lon || bus.lng || bus.lng;
      if (lat==null || lon==null) return;
      const pos = { lat: parseFloat(lat), lng: parseFloat(lon) };
      const key = String(id);
      let marker = mapMarkers.get(key);
      if (marker){
        marker.setPosition(pos);
      } else {
        marker = new google.maps.Marker({ position: pos, map, title: bus.plate_no || bus.plate || ('Bus ' + key) });
        marker.addListener('click', () => {
          const content = `<div><strong>${escapeHtml(bus.plate_no||bus.plate||'Xe')}</strong><br/>ID: ${escapeHtml(key)}<br/>Trạng thái: ${escapeHtml(bus.status||'')}<br/>Cập nhật: ${escapeHtml(bus.last_position_time||bus.reported_at||'')}</div>`;
          infoWindow.setContent(content);
          infoWindow.open(map, marker);
        });
        mapMarkers.set(key, marker);
      }
    }catch(e){ console.error('updateMarker',e); }
  }

  function removeMarker(bus_id){
    try{
      const key = String(bus_id);
      const m = mapMarkers.get(key);
      if (m){ m.setMap(null); mapMarkers.delete(key); }
    }catch(e){ console.error('removeMarker',e); }
  }

})();
