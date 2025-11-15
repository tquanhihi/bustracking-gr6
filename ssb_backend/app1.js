
  const express = require('express');
  const app = express();
  const parentsRouter = require('./routes/parents');


  app.use(express.json());

  // routers
  app.use('/api/parents', parentsRouter);


  // health
  app.get('/health', (req, res) => res.json({ ok: true }));

  // error handler
  app.use(errorHandler);

  module.exports = app;
  // --- IGNORE ---
  document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('role');
    if (!role) {
      window.location.href = 'login.html';
      return;
    }

    // ===== Pages & titles =====
    const pages = ['m-dashboard','m-schedules','m-routes','m-tracking','m-messages','d-schedules','d-users','d-reports','d-messages','p-tracking','p-messages','p-reports'];
    const titles = {
      'm-dashboard':'Tổng quan hệ thống',
      'm-schedules':'Lịch trình',
      'm-routes':'Tuyến & Xe',
      'm-tracking':'Theo dõi vị trí',
      'm-messages':'Tin nhắn',
      'd-schedules':'Lịch làm việc',
      'd-users':'Học sinh / Tài xế',
      'd-messages':'Tin nhắn',
      'd-reports':'Báo cáo',
      'p-tracking':'Theo dõi xe của con',
      'p-messages':'Thông báo xe đến gần',
      'p-reports':'Báo cáo trễ chuyến'
    };
    // ===== THAY BẰNG GỌI API THẬT =====
  let state = { buses: [], routes: [], inbox: [], activities: [] };

  async function loadRealData() {
    try {
      // Gọi API lấy danh sách phụ huynh (có thể mở rộng)
      const res = await fetch('http://localhost:3000/index.html');
      const data = await res.json();

      if (data.success) {
        // Giả sử bạn có thêm bảng `routes`, `buses` → gọi tương tự
        // Ở đây mình dùng dữ liệu phụ huynh để mô phỏng
        console.log('Dữ liệu phụ huynh từ SQL:', data.data);

        // Ví dụ: Dùng tên phụ huynh làm "tài xế" để demo
        state.buses = data.data.map((p, i) => ({
          id: 100 + i,
          plate: `29A-${100 + i}`,
          route: `Tuyến ${i % 2 === 0 ? 'A' : 'B'}`,
          lat: 21.02 + Math.random() * 0.02,
          lon: 105.81 + Math.random() * 0.02,
          status: Math.random() > 0.3 ? 'running' : 'stopped',
          driver: p.name // Dùng tên phụ huynh làm tài xế
        }));

        state.routes = [
          { id: 1, name: 'Tuyến A', stops: ['Cổng A', 'Điểm 1', 'Điểm 2'] },
          { id: 2, name: 'Tuyến B', stops: ['Cổng B', 'Điểm 3', 'Điểm 4'] }
        ];

        renderBuses();
        renderMapItems();
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    }
  }



    // ===== Mock data =====
    const mockRoutes = [
      {id:1,name:'Tuyến A',stops:['Cổng A','Điểm 1','Điểm 2']},
      {id:2,name:'Tuyến B',stops:['Cổng B','Điểm 3','Điểm 4']}
    ];

    const buses = Array.from({length:8}).map((_,i)=>({
      id:100+i,plate:`29A-${100+i}`,
      route: mockRoutes[i%2].name,
      lat:21.02 + Math.random()*0.02,
      lon:105.81 + Math.random()*0.02,
      status:Math.random()>0.2? 'running':'stopped',
      driver:`Tài xế ${i+1}`
    }));

    //const state = {buses, routes:mockRoutes, inbox:[], activities:[]};
    let simRunning = true;

    // ===== Role config (chuẩn đồ án) =====
    const roleConfig = {
      manager: {
        name: 'Quản lý',
        pages: ['m-dashboard','m-schedules','m-routes','m-tracking','m-messages'],
        default: 'm-dashboard'
      },
      driver: {
        name: 'Tài xế',
        pages: ['d-schedules','d-users','d-reports','d-messages'],
        default: 'd-schedules'
      },
      parent: {
        name: 'Phụ huynh',
        pages: ['p-tracking','p-messages','p-reports'],
        default: 'p-tracking'
      }
    };

    const current = roleConfig[role];
    const roleIndicator = document.getElementById('role-indicator');
    if (roleIndicator) roleIndicator.textContent = current.name;

    // ===== Sidebar & Permissions =====
    function applyPermissions() {
      document.querySelectorAll('.sidebar li[data-page]').forEach(li=>{
        const page = li.dataset.page;
        li.style.display = current.pages.includes(page) ? 'flex' : 'none';
      });

      pages.forEach(p=>{
        const v = document.getElementById(p+'-view');
        if(v) {
          if (current.pages.includes(p)) v.classList.remove('hidden');
          else v.classList.add('hidden');
        }
      });
    }

    applyPermissions();

    // ===== Navigation =====
    function navigateTo(page){
      pages.forEach(p=>{
        const v = document.getElementById(p+'-view');
        if(v) v.classList.add('hidden');
      });
      const view = document.getElementById(page+'-view');
      if(view) view.classList.remove('hidden');
      const title = document.getElementById('page-title');
      if(title) title.textContent = titles[page] || page;
    }

    document.querySelectorAll('.sidebar li[data-page]').forEach(li=>{
      li.addEventListener('click',()=>{
        document.querySelectorAll('.sidebar li').forEach(x=>x.classList.remove('active'));
        li.classList.add('active');
        navigateTo(li.dataset.page);
      });
    });

    // ===== Render helpers =====
    function renderBuses(){
      const list = document.getElementById('bus-list'); if(!list) return;
      list.innerHTML='';
      state.buses.forEach(b=>{
        const el=document.createElement('div'); el.className='bus';
        el.innerHTML=`<div class='pin'>${b.id}</div>
          <div style='flex:1'>
            <div style='font-weight:700'>
              ${b.plate}
              <span style='font-size:12px;color:${b.status==='running'?'#059669':'#6b7280'}'>${b.status}</span>
            </div>
            <div class='muted' style='font-size:13px'>${b.route} • ${b.driver}</div>
          </div>`;
        list.appendChild(el);
      });
      const total=document.getElementById('total-buses');
      const running=document.getElementById('running-buses');
      if(total) total.textContent=state.buses.length;
      if(running) running.textContent=state.buses.filter(b=>b.status==='running').length;
    }

    function renderMapItems(){
      const el=document.getElementById('map-items'); if(!el) return;
      el.innerHTML='';
      state.buses.forEach(b=>{
        const d=document.createElement('div'); d.className='bus'; d.style.background='transparent';
        d.innerHTML=`<div class='pin' style='width:28px;height:28px;border-radius:6px'>🚌</div>
          <div style='flex:1'><div style='font-weight:700'>${b.plate}</div>
          <div class='muted' style='font-size:12px'>${b.route} • ${b.lat.toFixed(4)}, ${b.lon.toFixed(4)}</div></div>
          <div class='muted' style='font-size:12px'>${b.status}</div>`;
        el.appendChild(d);
      });
    }

    function renderActivity(){
      const el=document.getElementById('activity-log'); if(!el) return;
      el.innerHTML=state.activities.slice().reverse().map(a=>
        `<div style='font-size:13px;padding:6px;border-bottom:1px solid #f3f5f9'>${a}</div>`).join('');
    }

    function renderInbox(){
      const el=document.getElementById('inbox'); if(!el) return;
      el.innerHTML=state.inbox.slice().reverse().map(m=>
        `<div style='padding:6px;border-bottom:1px solid #f3f5f9;font-size:13px'>${m}</div>`).join('');
    }

    // ===== Simulation (real-time ≤3s) =====
    function tickSimulate(){
      if(!simRunning) return;
      state.buses.forEach(b=>{
        if(Math.random()>0.8) b.status=(b.status==='running'?'stopped':'running');
        if(b.status==='running'){ b.lat+=(Math.random()-0.5)*0.001; b.lon+=(Math.random()-0.5)*0.001; }
      });
      const b=state.buses[Math.floor(Math.random()*state.buses.length)];
      const act=`${new Date().toLocaleTimeString()} — ${b.plate} (${b.route}) ${b.status==='running'?'đang chạy':'dừng lại'}`;
      state.activities.push(act); if(state.activities.length>200) state.activities.shift();
      renderBuses(); renderMapItems(); renderActivity();
    }

    // ===== Init =====
    function init(){
      renderBuses(); renderMapItems(); renderActivity(); renderInbox();
      const fr=document.getElementById('filter-route'); const rr=document.getElementById('sched-route');
      if(fr && rr){
        state.routes.forEach(r=>{
          const o=document.createElement('option'); o.value=r.name; o.textContent=r.name;
          fr.appendChild(o); rr.appendChild(o.cloneNode(true));
        });
      }

      const btnSim=document.getElementById('btn-simulate');
      if(btnSim) btnSim.addEventListener('click',()=>{
        simRunning=!simRunning;
        btnSim.textContent=simRunning?'Tắt mô phỏng':'Bật mô phỏng';
      });

      const send=document.getElementById('send-msg');
      if(send) send.addEventListener('click',()=>{
        const to=document.getElementById('msg-to')?.value||'Tất cả';
        const body=document.getElementById('msg-body')?.value||'—';
        state.inbox.push(`${new Date().toLocaleString()} — Gửi tới: ${to} — ${body}`);
        renderInbox();
      });

      navigateTo(current.default);
      setInterval(tickSimulate,3000); // cập nhật mỗi 3s
    }

    init();

    window.logout = function(){
      localStorage.removeItem('role');
      window.location.href = 'login.html';
    };
  });




