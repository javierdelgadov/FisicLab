// ===================== DOM =====================
const canvas = document.getElementById("sim");
const ctx = canvas.getContext("2d");

const tabPendulo = document.getElementById("tabPendulo");
const tabResorte = document.getElementById("tabResorte");
const panel = document.getElementById("panel");
const panelTitle = document.getElementById("panelTitle");
const readout = document.getElementById("readout");

const playToggle = document.getElementById("playToggle");
const playIco = document.getElementById("playIco");
const playText = document.getElementById("playText");
const btnReset = document.getElementById("reset");
const btnFull = document.getElementById("btnFull");

const chkValues = document.getElementById("chkValues");
const chkGuide  = document.getElementById("chkGuide");
const chkTrail  = document.getElementById("chkTrail");
const chkRuler  = document.getElementById("chkRuler");
const chkProtractor = document.getElementById("chkProtractor");
const chkEnergy = document.getElementById("chkEnergy");

const energyPanel = document.getElementById("energyPanel");
const barEp = document.getElementById("barEp");
const barEc = document.getElementById("barEc");
const barEm = document.getElementById("barEm");
const valEp = document.getElementById("valEp");
const valEc = document.getElementById("valEc");
const valEm = document.getElementById("valEm");

const TavgEl = document.getElementById("Tavg");
const gEstEl = document.getElementById("gEst");

const chkAutoRecord = document.getElementById("chkAutoRecord");
const btnTakeData = document.getElementById("btnTakeData");
const btnClearData = document.getElementById("btnClearData");
const btnExportCSV = document.getElementById("btnExportCSV");
const dataBody = document.getElementById("dataBody");
const colMain = document.getElementById("colMain");
const plot = document.getElementById("plot");
const plotCtx = plot.getContext("2d");
const plotNote = document.getElementById("plotNote");
const plotVar = document.getElementById("plotVar");

const dragHint = document.getElementById("dragHint");

// ===================== Canvas responsive =====================
let size = { w: 0, h: 0 };

function fitCanvases() {
  const dpr = window.devicePixelRatio || 1;

  const r = canvas.getBoundingClientRect();
  const cssW = Math.max(320, r.width || window.innerWidth);
  const cssH = Math.max(320, r.height || 420);

  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const pr = plot.getBoundingClientRect();
  const pW = Math.max(260, pr.width || 520);
  const pH = Math.max(130, pr.height || 170);

  plot.width = Math.floor(pW * dpr);
  plot.height = Math.floor(pH * dpr);
  plotCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  size = { w: cssW, h: cssH };
}
window.addEventListener("resize", ()=> setTimeout(fitCanvases, 0));

// ===================== Helpers =====================
const clamp = (v,a,b)=> Math.max(a, Math.min(b,v));
const rad = (d)=> d*Math.PI/180;
const deg = (r)=> r*180/Math.PI;

// ===================== View toggles =====================
let view = {
  showValues: true,
  showGuide: true,
  showTrail: false,
  showRuler: true,
  showProtractor: false,
  showEnergy: true
};

// ===================== Trail =====================
let trail = [];
function trailReset(){ trail = []; }
function trailAdd(pt){
  if (!view.showTrail) return;
  trail.push(pt);
  if (trail.length > 180) trail.shift();
}
function drawTrail(){
  if (!view.showTrail || trail.length < 2) return;
  ctx.strokeStyle = "rgba(95,150,255,0.30)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(trail[0].x, trail[0].y);
  for (let i=1;i<trail.length;i++) ctx.lineTo(trail[i].x, trail[i].y);
  ctx.stroke();
}

// ===================== Regla vertical =====================
const ruler = { x: 18, y: 90, w: 44, h: 320, dragging:false, resizing:false, offX:0, offY:0 };

function pointInRect(px,py,x,y,w,h){ return px>=x && px<=x+w && py>=y && py<=y+h; }
function rulerResizeHandle(px,py){ return pointInRect(px,py, ruler.x, ruler.y + ruler.h - 10, ruler.w, 20); }

function drawRuler(){
  if (!view.showRuler) return;
  ctx.save();

  ctx.fillStyle = "#ffe066";
  ctx.strokeStyle = "#c9a400";
  ctx.lineWidth = 2;
  ctx.fillRect(ruler.x, ruler.y, ruler.w, ruler.h);
  ctx.strokeRect(ruler.x, ruler.y, ruler.w, ruler.h);

  const start = ruler.y + 14;
  const end   = ruler.y + ruler.h - 14;
  const pxPerCm = 10;
  const totalCm = Math.floor((end - start) / pxPerCm);

  ctx.strokeStyle = "rgba(0,0,0,.65)";
  ctx.lineWidth = 1;

  for(let cm=0; cm<=totalCm; cm++){
    const y = start + cm*pxPerCm;
    const big = (cm % 5 === 0);
    const len = big ? 22 : 14;
    ctx.beginPath();
    ctx.moveTo(ruler.x + ruler.w - 4, y);
    ctx.lineTo(ruler.x + ruler.w - 4 - len, y);
    ctx.stroke();
    if (big){
      ctx.fillStyle = "rgba(0,0,0,.75)";
      ctx.font = "12px system-ui";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(String(cm), ruler.x + ruler.w - 26, y);
    }
  }

  ctx.fillStyle = "#c9a400";
  ctx.fillRect(ruler.x, ruler.y + ruler.h - 6, ruler.w, 12);
  ctx.fillStyle = "rgba(0,0,0,.75)";
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("↕", ruler.x + ruler.w/2, ruler.y + ruler.h);

  ctx.restore();
}

// ===================== Transportador =====================
const pro = { x: 260, y: 240, r: 90, dragging:false, offX:0, offY:0 };
function pointInPro(px,py){ return Math.hypot(px - pro.x, py - pro.y) <= pro.r; }

function drawProtractor(){
  if (!view.showProtractor) return;

  ctx.save();
  ctx.translate(pro.x, pro.y);

  ctx.fillStyle = "rgba(248,251,255,0.96)";
  ctx.strokeStyle = "rgba(95,150,255,0.70)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(0,0, pro.r, Math.PI, 0, false);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(31,42,58,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-pro.r,0);
  ctx.lineTo(pro.r,0);
  ctx.stroke();

  ctx.strokeStyle = "rgba(31,42,58,0.60)";
  ctx.lineWidth = 1;

  for (let a=0; a<=180; a+=10){
    const t = (Math.PI * a)/180;
    const inner = (a % 30 === 0) ? pro.r*0.78 : pro.r*0.84;

    const x1 = Math.cos(Math.PI - t) * pro.r;
    const y1 = Math.sin(Math.PI - t) * pro.r;
    const x2 = Math.cos(Math.PI - t) * inner;
    const y2 = Math.sin(Math.PI - t) * inner;

    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();

    if (a % 30 === 0){
      ctx.fillStyle = "rgba(31,42,58,0.75)";
      ctx.font = "12px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lx = Math.cos(Math.PI - t) * (pro.r*0.62);
      const ly = Math.sin(Math.PI - t) * (pro.r*0.62);
      ctx.fillText(String(a), lx, ly);
    }
  }

  ctx.fillStyle = "rgba(31,42,58,0.70)";
  ctx.beginPath();
  ctx.arc(0,0,4,0,Math.PI*2);
  ctx.fill();

  ctx.restore();
}

// ===================== Energy UI =====================
function setEnergyUI(Ep, Ec, Em, E0){
  if (!view.showEnergy){
    energyPanel.style.display = "none";
    return;
  }
  energyPanel.style.display = "block";

  const base = Math.max(1e-6, E0 ?? Em);
  const pEp = clamp((Ep/base)*100, 0, 100);
  const pEc = clamp((Ec/base)*100, 0, 100);
  const pEm = clamp((Em/base)*100, 0, 100);

  barEp.style.width = `${pEp}%`;
  barEc.style.width = `${pEc}%`;
  barEm.style.width = `${pEm}%`;

  valEp.textContent = `${Ep.toFixed(2)} J`;
  valEc.textContent = `${Ec.toFixed(2)} J`;
  valEm.textContent = `${Em.toFixed(2)} J`;
}

// ===================== Period stats (solo péndulo) =====================
let crossTimes = [];
let lastSign = null;

function resetPeriodStats(){
  crossTimes = [];
  lastSign = null;
  TavgEl.textContent = "—";
  gEstEl.textContent = "—";
}

function updatePeriodStats(sim){
  if (!(sim instanceof PenduloSimple)) return;
  const th = sim.theta;
  const s = Math.sign(th === 0 ? 1e-9 : th);

  if (lastSign === null){ lastSign = s; return; }

  if (s !== lastSign){
    if (Math.abs(th) < 0.08){
      crossTimes.push(sim.t);
      if (crossTimes.length > 10) crossTimes.shift();

      if (crossTimes.length >= 5){
        const half = [];
        for (let i=1;i<crossTimes.length;i++) half.push(crossTimes[i] - crossTimes[i-1]);
        const Ts = half.map(h => 2*h);
        const Tavg = Ts.reduce((a,b)=>a+b,0) / Ts.length;
        TavgEl.textContent = `${Tavg.toFixed(3)} s`;

        const gEst = (4*Math.PI*Math.PI * sim.L) / (Tavg*Tavg);
        gEstEl.textContent = `${gEst.toFixed(2)} m/s²`;
      }
    }
    lastSign = s;
  }
}

// ===================== Datos + gráfica =====================
let data = [];
let lastRecordT = 0;
const recordDt = 0.05;

function resetData(){
  data = [];
  lastRecordT = 0;
  renderTable();
  drawPlot();
}

function getPlotOptionsFor(sim){
  if (sim instanceof PenduloSimple){
    return [
      { key:"theta", label:"θ (°)" },
      { key:"omega", label:"ω (rad/s)" },
      { key:"Ec", label:"Ec (J)" },
      { key:"Ep", label:"Ep (J)" },
      { key:"Em", label:"Em (J)" },
    ];
  }
  return [
    { key:"x", label:"x (m)" },
    { key:"v", label:"v (m/s)" },
    { key:"Ec", label:"Ec (J)" },
    { key:"Ep", label:"Ep (J)" },
    { key:"Em", label:"Em (J)" },
  ];
}

function setPlotVarUI(sim, keepKey){
  const opts = getPlotOptionsFor(sim);
  plotVar.innerHTML = "";
  for (const o of opts){
    const op = document.createElement("option");
    op.value = o.key;
    op.textContent = o.label;
    plotVar.appendChild(op);
  }
  plotVar.value = keepKey && opts.some(o=>o.key===keepKey) ? keepKey : opts[0].key;
  updatePlotLabels();
}

function getYValue(sim, key){
  const E = sim.energy();
  if (sim instanceof PenduloSimple){
    if (key==="theta") return deg(sim.theta);
    if (key==="omega") return sim.omega;
    if (key==="Ec") return E.Ec;
    if (key==="Ep") return E.Ep;
    if (key==="Em") return E.Em;
  } else {
    if (key==="x") return sim.x;
    if (key==="v") return sim.v;
    if (key==="Ec") return E.Ec;
    if (key==="Ep") return E.Ep;
    if (key==="Em") return E.Em;
  }
  return 0;
}

function pushData(sim){
  const key = plotVar.value;
  const E = sim.energy();
  const y = getYValue(sim, key);
  data.push({ t: sim.t, y, Ec: E.Ec, Ep: E.Ep });
  if (data.length > 300) data.shift();
}

function renderTable(){
  dataBody.innerHTML = "";
  const rows = data.slice(-30);
  for (const r of rows){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.t.toFixed(2)}</td>
      <td>${r.y.toFixed(4)}</td>
      <td>${r.Ec.toFixed(3)}</td>
      <td>${r.Ep.toFixed(3)}</td>
    `;
    dataBody.appendChild(tr);
  }
}

function updatePlotLabels(){
  const key = plotVar.value;
  const opts = getPlotOptionsFor(simObj);
  const selected = opts.find(o=>o.key===key) || opts[0];
  colMain.textContent = selected.label;
  plotNote.textContent = `Gráfica: ${selected.label} vs t`;
  renderTable();
  drawPlot();
}

function drawPlot(){
  const W = plot.clientWidth;
  const H = plot.clientHeight;

  plotCtx.clearRect(0,0,W,H);
  plotCtx.fillStyle = "rgba(248,251,255,0.92)";
  plotCtx.fillRect(0,0,W,H);

  plotCtx.strokeStyle = "rgba(31,42,58,0.20)";
  plotCtx.lineWidth = 1;
  plotCtx.beginPath();
  plotCtx.moveTo(30, 10);
  plotCtx.lineTo(30, H-18);
  plotCtx.lineTo(W-10, H-18);
  plotCtx.stroke();

  if (data.length < 2) return;

  const minT = data[0].t;
  const maxT = Math.max(data[data.length-1].t, minT + 0.01);

  let minY = Infinity, maxY = -Infinity;
  for (const d of data){
    minY = Math.min(minY, d.y);
    maxY = Math.max(maxY, d.y);
  }
  if (Math.abs(maxY - minY) < 1e-9){ maxY += 1; minY -= 1; }

  const xMap = (t)=> 30 + (W-40) * ((t - minT) / (maxT - minT));
  const yMap = (y)=> (H-18) - (H-30) * ((y - minY) / (maxY - minY));

  plotCtx.strokeStyle = "rgba(95,150,255,0.95)";
  plotCtx.lineWidth = 2;
  plotCtx.beginPath();
  plotCtx.moveTo(xMap(data[0].t), yMap(data[0].y));
  for (let i=1;i<data.length;i++){
    plotCtx.lineTo(xMap(data[i].t), yMap(data[i].y));
  }
  plotCtx.stroke();
}

function exportCSV(){
  const opts = getPlotOptionsFor(simObj);
  const selected = opts.find(o=>o.key===plotVar.value) || opts[0];

  const header = `t_s,${selected.label.replace(/\s+/g,"_")},Ec_J,Ep_J\n`;
  let csv = header;
  for (const r of data){
    csv += `${r.t.toFixed(4)},${r.y.toFixed(6)},${r.Ec.toFixed(6)},${r.Ep.toFixed(6)}\n`;
  }
  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "datos_simulacion.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

btnClearData.addEventListener("click", resetData);
btnExportCSV.addEventListener("click", exportCSV);
btnTakeData.addEventListener("click", ()=>{
  pushData(simObj);
  renderTable();
  drawPlot();
});
plotVar.addEventListener("change", updatePlotLabels);

// ===================== Pointer helpers =====================
function getPointerPos(e){
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}
function setCursor(style){ canvas.style.cursor = style; }

// ===================== Simulaciones =====================
class PenduloSimple {
  name = "Péndulo";
  constructor(){
    this.L = 1.0;
    this.m = 1.0;
    this.g = 9.81;

    this.theta = rad(15);
    this.omega = 0;
    this.beta = 0;

    this.t = 0;
    this.running = false;

    this.planetMode = "Tierra";
    this.E0 = null;

    this.dragging = false;
  }

  buildPanel(){
    panelTitle.textContent = "Controles — Péndulo";
    panel.innerHTML = `
      <div class="ctrl">
        <label><span>Planeta</span><b id="vPlanet"></b></label>
        <select id="planet">
          <option value="Tierra" data-g="9.81">Tierra (9.81)</option>
          <option value="Luna" data-g="1.62">Luna (1.62)</option>
          <option value="Marte" data-g="3.71">Marte (3.71)</option>
          <option value="Júpiter" data-g="24.79">Júpiter (24.79)</option>
          <option value="Sol" data-g="274">Sol (274)</option>
          <option value="Manual" data-g="manual">Manual</option>
        </select>
      </div>

      <div class="ctrl">
        <label><span>Gravedad g (m/s²)</span><b id="vg"></b></label>
        <input id="g" type="range" min="0.5" max="300" step="0.01" value="${this.g}">
      </div>

      <div class="ctrl">
        <label><span>Longitud L (m)</span><b id="vL"></b></label>
        <input id="L" type="range" min="0.2" max="2.0" step="0.01" value="${this.L}">
      </div>

      <div class="ctrl">
        <label><span>Masa m (kg)</span><b id="vm"></b></label>
        <input id="m" type="range" min="0.1" max="5" step="0.05" value="${this.m}">
      </div>

      <div class="ctrl">
        <label><span>Rozamiento β (1/s)</span><b id="vb"></b></label>
        <input id="beta" type="range" min="0" max="1.2" step="0.01" value="${this.beta}">
      </div>
    `;

    const selPlanet = panel.querySelector("#planet");
    const sG = panel.querySelector("#g");
    const sL = panel.querySelector("#L");
    const sM = panel.querySelector("#m");
    const sB = panel.querySelector("#beta");

    const vPlanet = panel.querySelector("#vPlanet");
    const vG = panel.querySelector("#vg");
    const vL = panel.querySelector("#vL");
    const vM = panel.querySelector("#vm");
    const vB = panel.querySelector("#vb");

    const applyPlanet = ()=>{
      const opt = selPlanet.selectedOptions[0];
      const mode = opt.value;
      this.planetMode = mode;

      if (mode !== "Manual"){
        const gVal = +opt.dataset.g;
        this.g = gVal;
        sG.value = String(gVal);
      } else {
        this.g = +sG.value;
      }
    };

    const refresh = ()=>{
      applyPlanet();
      this.L = +sL.value;
      this.m = +sM.value;
      this.beta = +sB.value;

      vPlanet.textContent = this.planetMode;
      vG.textContent = this.g.toFixed(2);
      vL.textContent = this.L.toFixed(2);
      vM.textContent = this.m.toFixed(2);
      vB.textContent = this.beta.toFixed(2);

      this.recomputeEnergyBase();
      trailReset();
      resetPeriodStats();
      resetData();
    };

    selPlanet.addEventListener("change", refresh);
    sG.addEventListener("input", ()=>{
      if (selPlanet.value !== "Manual") selPlanet.value = "Manual";
      refresh();
    });
    [sL, sM, sB].forEach(el=> el.addEventListener("input", refresh));

    selPlanet.value = "Tierra";
    refresh();
  }

  pivot(){ return { x: size.w*0.5, y: size.h*0.18 }; }
  Lpx(){ return (size.h*0.70) * (this.L/2.0); }

  bobPos(){
    const p = this.pivot();
    const Lpx = this.Lpx();
    return { x: p.x + Lpx*Math.sin(this.theta), y: p.y + Lpx*Math.cos(this.theta) };
  }

  hitBob(px,py){
    const b = this.bobPos();
    const r = 26;
    return Math.hypot(px - b.x, py - b.y) <= r*1.8;
  }

  dragPointer(px,py){
    const p = this.pivot();
    const dx = px - p.x;
    const dy = py - p.y;
    let th = Math.atan2(dx, dy);
    th = clamp(th, rad(-75), rad(75));
    this.theta = th;
    this.omega = 0;
    this.recomputeEnergyBase();
    trailReset();
    resetPeriodStats();
  }

  recomputeEnergyBase(){
    const h = this.L * (1 - Math.cos(this.theta));
    const Ep = this.m * this.g * h;
    this.E0 = Math.max(1e-6, Ep);
  }

  reset(){
    this.t = 0;
    this.omega = 0;
    this.theta = rad(15);
    this.recomputeEnergyBase();
    trailReset();
    resetPeriodStats();
    resetData();
  }

  step(dt){
    const f = (th, om)=>({
      dth: om,
      dom: -(this.g/this.L)*Math.sin(th) - 2*this.beta*om
    });

    const k1 = f(this.theta, this.omega);
    const k2 = f(this.theta + 0.5*dt*k1.dth, this.omega + 0.5*dt*k1.dom);
    const k3 = f(this.theta + 0.5*dt*k2.dth, this.omega + 0.5*dt*k2.dom);
    const k4 = f(this.theta + dt*k3.dth, this.omega + dt*k3.dom);

    this.theta += (dt/6)*(k1.dth + 2*k2.dth + 2*k3.dth + k4.dth);
    this.omega += (dt/6)*(k1.dom + 2*k2.dom + 2*k3.dom + k4.dom);
    this.t += dt;
  }

  energy(){
    const h = this.L * (1 - Math.cos(this.theta));
    const Ep = this.m * this.g * h;
    const v = this.L * this.omega;
    const Ec = 0.5 * this.m * v * v;
    const Em = Ep + Ec;
    return {Ep, Ec, Em, E0: this.E0};
  }

  draw(){
    const W = size.w, H = size.h;

    /* ✅ Fondo del canvas suave (no blanco puro) */
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, "#f5f9ff");
    grad.addColorStop(1, "#e1ecf8");
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    const pivot = this.pivot();
    const Lpx = this.Lpx();

    if (view.showGuide){
      ctx.strokeStyle = "rgba(31,42,58,0.12)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pivot.x, pivot.y);
      ctx.lineTo(pivot.x, pivot.y + Lpx);
      ctx.stroke();
    }

    const b = this.bobPos();
    trailAdd({x:b.x, y:b.y});
    drawTrail();

    ctx.strokeStyle = "rgba(95,150,255,0.95)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.lineTo(b.x,b.y);
    ctx.stroke();

    const r = 26;
    ctx.fillStyle = "rgba(95,216,180,0.30)";
    ctx.beginPath();
    ctx.arc(b.x,b.y,r*1.8,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle = "rgba(95,150,255,0.95)";
    ctx.beginPath();
    ctx.arc(b.x,b.y,r,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle = "rgba(31,42,58,0.85)";
    ctx.beginPath();
    ctx.arc(pivot.x,pivot.y,7,0,Math.PI*2);
    ctx.fill();

    drawRuler();
    drawProtractor();

    if (view.showValues){
      const Tsmall = 2*Math.PI*Math.sqrt(this.L/this.g);
      readout.innerHTML = `
        <b>${this.name}</b><br>
        t=${this.t.toFixed(2)} s · θ=${deg(this.theta).toFixed(1)}° · ω=${this.omega.toFixed(3)} rad/s<br>
        L=${this.L.toFixed(2)} m · m=${this.m.toFixed(2)} kg · g=${this.g.toFixed(2)} m/s² · β=${this.beta.toFixed(2)}<br>
        T (ángulo pequeño) ≈ <b>${Tsmall.toFixed(4)}</b> s
      `;
    } else readout.innerHTML = "";

    const E = this.energy();
    setEnergyUI(E.Ep, E.Ec, E.Em, E.E0);
  }
}

class MasaResorte {
  name = "Masa–Resorte (vertical)";
  constructor(){
    this.m = 1.0;
    this.k = 20.0;
    this.A = 0.10;
    this.beta = 0;

    this.x = this.A;
    this.v = 0;
    this.t = 0;
    this.running = false;

    this.E0 = null;
    this.dragging = false;
    this.phase = 0;
  }

  buildPanel(){
    panelTitle.textContent = "Controles — Masa–Resorte";
    panel.innerHTML = `
      <div class="ctrl">
        <label><span>Masa m (kg)</span><b id="vm"></b></label>
        <input id="m" type="range" min="0.1" max="5" step="0.05" value="${this.m}">
      </div>

      <div class="ctrl">
        <label><span>Constante k (N/m)</span><b id="vk"></b></label>
        <input id="k" type="range" min="5" max="200" step="1" value="${this.k}">
      </div>

      <div class="ctrl">
        <label><span>Amplitud A (m)</span><b id="vA"></b></label>
        <input id="A" type="range" min="0.02" max="0.30" step="0.01" value="${this.A}">
      </div>

      <div class="ctrl">
        <label><span>Rozamiento β (1/s)</span><b id="vb"></b></label>
        <input id="beta" type="range" min="0" max="1.2" step="0.01" value="${this.beta}">
      </div>
    `;

    const sm = panel.querySelector("#m");
    const sk = panel.querySelector("#k");
    const sA = panel.querySelector("#A");
    const sb = panel.querySelector("#beta");

    const vm = panel.querySelector("#vm");
    const vk = panel.querySelector("#vk");
    const vA = panel.querySelector("#vA");
    const vb = panel.querySelector("#vb");

    const refresh = ()=>{
      this.m = +sm.value;
      this.k = +sk.value;
      this.A = +sA.value;
      this.beta = +sb.value;

      vm.textContent = this.m.toFixed(2);
      vk.textContent = this.k.toFixed(0);
      vA.textContent = this.A.toFixed(2);
      vb.textContent = this.beta.toFixed(2);

      if (!this.running){
        this.x = clamp(this.x, -this.A, this.A);
        this.v = 0;
      }
      this.recomputeEnergyBase();
      trailReset();
      resetData();
    };

    [sm,sk,sA,sb].forEach(el=>el.addEventListener("input", refresh));
    refresh();
  }

  geom(){
    const H = size.h, W = size.w;
    const topY = H*0.16;
    const centerX = W*0.5;

    const baseLen = H*0.50;
    const pxPerM  = H*0.80;

    const yMass = topY + baseLen + this.x*pxPerM;
    const block = { x:centerX-50, y:yMass-40, w:100, h:80 };

    const springTop = { x:centerX, y:topY };
    const springBot = { x:centerX, y:yMass-55 };

    return { centerX, topY, baseLen, pxPerM, yMass, block, springTop, springBot };
  }

  hitMass(px,py){
    const g = this.geom();
    return pointInRect(px, py, g.block.x, g.block.y, g.block.w, g.block.h);
  }

  dragPointer(px,py){
    const g = this.geom();
    const y0 = g.topY + g.baseLen;
    const xNew = (py - y0) / g.pxPerM;
    this.x = clamp(xNew, -this.A, this.A);
    this.v = 0;
    this.recomputeEnergyBase();
    trailReset();
  }

  recomputeEnergyBase(){
    const Ep = 0.5 * this.k * (this.x*this.x);
    const Ec = 0.5 * this.m * (this.v*this.v);
    this.E0 = Math.max(1e-6, Ep + Ec);
  }

  reset(){
    this.t = 0;
    this.x = this.A;
    this.v = 0;
    this.phase = 0;
    this.recomputeEnergyBase();
    trailReset();
    resetData();
  }

  step(dt){
    const w2 = this.k/this.m;
    const f = (x,v)=>({ dx:v, dv:-w2*x - 2*this.beta*v });

    const k1 = f(this.x,this.v);
    const k2 = f(this.x + 0.5*dt*k1.dx, this.v + 0.5*dt*k1.dv);
    const k3 = f(this.x + 0.5*dt*k2.dx, this.v + 0.5*dt*k2.dv);
    const k4 = f(this.x + dt*k3.dx, this.v + dt*k3.dv);

    this.x += (dt/6)*(k1.dx + 2*k2.dx + 2*k3.dx + k4.dx);
    this.v += (dt/6)*(k1.dv + 2*k2.dv + 2*k3.dv + k4.dv);
    this.t += dt;

    const w = Math.sqrt(this.k/this.m);
    this.phase += dt * w * 2.0;
  }

  energy(){
    const Ep = 0.5 * this.k * (this.x*this.x);
    const Ec = 0.5 * this.m * (this.v*this.v);
    const Em = Ep + Ec;
    return {Ep, Ec, Em, E0: this.E0};
  }

  draw(){
    const W = size.w, H = size.h;

    /* ✅ Fondo del canvas suave */
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, "#f5f9ff");
    grad.addColorStop(1, "#e1ecf8");
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    const g = this.geom();

    ctx.fillStyle = "rgba(31,42,58,0.14)";
    ctx.fillRect(g.centerX-90, g.topY-22, 180, 10);

    trailAdd({x:g.centerX, y:g.yMass});
    drawTrail();

    const kN = (clamp(this.k,5,200)-5)/(200-5);
    const thick = 2 + 10*kN;
    const amp   = 16 + 10*(1-kN);

    drawCoilSpringVertical(g.springTop.x, g.springTop.y, g.springBot.y, amp, thick, this.phase);

    ctx.fillStyle = "rgba(95,216,180,0.25)";
    ctx.fillRect(g.block.x-12, g.block.y-12, g.block.w+24, g.block.h+24);

    ctx.fillStyle = "rgba(95,150,255,0.92)";
    ctx.fillRect(g.block.x, g.block.y, g.block.w, g.block.h);

    drawRuler();
    drawProtractor();

    if (view.showValues){
      const T = 2*Math.PI*Math.sqrt(this.m/this.k);
      readout.innerHTML = `
        <b>${this.name}</b><br>
        t=${this.t.toFixed(2)} s · x=${this.x.toFixed(4)} m · v=${this.v.toFixed(4)} m/s<br>
        m=${this.m.toFixed(2)} kg · k=${this.k.toFixed(0)} N/m · A=${this.A.toFixed(2)} m · β=${this.beta.toFixed(2)}<br>
        T (ideal) ≈ <b>${T.toFixed(4)}</b> s
      `;
    } else readout.innerHTML = "";

    const E = this.energy();
    setEnergyUI(E.Ep, E.Ec, E.Em, E.E0);
  }
}

function drawCoilSpringVertical(x, yTop, yBot, ampPx, lineW, phaseShift = 0){
  const hook = 18;
  const start = yTop + hook;
  const end   = yBot - hook;
  const L = Math.max(60, end - start);

  const coils = clamp(Math.floor(L / 58), 4, 12);
  const steps = coils * 30;

  ctx.strokeStyle = "rgba(95,150,255,0.95)";
  ctx.lineWidth = lineW;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(x, yTop);
  ctx.lineTo(x, start);

  for(let i=0;i<=steps;i++){
    const t = i/steps;
    const y = start + L*t;
    const phase = (t * coils * Math.PI * 2) + phaseShift;
    const xx = x + Math.sin(phase) * ampPx;
    ctx.lineTo(xx, y);
  }

  ctx.lineTo(x, end);
  ctx.lineTo(x, yBot);
  ctx.stroke();
}

// ===================== Tabs & playback =====================
let simObj = new PenduloSimple();

function updatePlayUI(){
  const isRunning = !!simObj.running;
  playIco.textContent = isRunning ? "⏸" : "▶";
  playText.textContent = isRunning ? "Pausar" : "Iniciar";
}
function updateDragHint(){
  const show = (!simObj.running);
  dragHint.style.display = show ? "block" : "none";
  dragHint.textContent = simObj instanceof PenduloSimple
    ? "🖱️ En pausa: arrastra la masa del péndulo para fijar el ángulo inicial"
    : "🖱️ En pausa: arrastra la masa del resorte para fijar la posición inicial";
}

function setActiveTab(which){
  const keepKey = plotVar.value;

  if (which==="pendulo"){
    simObj = new PenduloSimple();
    tabPendulo.classList.add("active");
    tabResorte.classList.remove("active");
  } else {
    simObj = new MasaResorte();
    tabResorte.classList.add("active");
    tabPendulo.classList.remove("active");
  }

  simObj.buildPanel();
  simObj.reset();
  trailReset();
  resetPeriodStats();
  resetData();

  setPlotVarUI(simObj, keepKey);
  updatePlotLabels();
  updatePlayUI();
  updateDragHint();
}

tabPendulo.addEventListener("click", ()=> setActiveTab("pendulo"));
tabResorte.addEventListener("click", ()=> setActiveTab("resorte"));

playToggle.addEventListener("click", ()=>{
  simObj.running = !simObj.running;
  updatePlayUI();
  updateDragHint();
});

btnReset.addEventListener("click", ()=>{
  simObj.running = false;
  simObj.reset();
  updatePlayUI();
  updateDragHint();
});

chkValues.addEventListener("change", ()=> view.showValues = chkValues.checked);
chkGuide.addEventListener("change",  ()=> view.showGuide  = chkGuide.checked);
chkTrail.addEventListener("change",  ()=> { view.showTrail = chkTrail.checked; trailReset(); });
chkRuler.addEventListener("change",  ()=> view.showRuler = chkRuler.checked);
chkProtractor.addEventListener("change", ()=> view.showProtractor = chkProtractor.checked);
chkEnergy.addEventListener("change", ()=> view.showEnergy = chkEnergy.checked);

btnFull.addEventListener("click", async ()=>{
  try{
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
    setTimeout(fitCanvases, 0);
  }catch{}
});

// ===================== Mouse / touch interaction =====================
canvas.addEventListener("pointerdown", (e)=>{
  const p = getPointerPos(e);

  if (view.showRuler && rulerResizeHandle(p.x,p.y)){
    ruler.resizing = true;
    canvas.setPointerCapture(e.pointerId);
    return;
  }
  if (view.showRuler && pointInRect(p.x,p.y, ruler.x, ruler.y, ruler.w, ruler.h)){
    ruler.dragging = true;
    ruler.offX = p.x - ruler.x;
    ruler.offY = p.y - ruler.y;
    canvas.setPointerCapture(e.pointerId);
    return;
  }
  if (view.showProtractor && pointInPro(p.x,p.y)){
    pro.dragging = true;
    pro.offX = p.x - pro.x;
    pro.offY = p.y - pro.y;
    canvas.setPointerCapture(e.pointerId);
    return;
  }

  if (!simObj.running){
    if (simObj instanceof PenduloSimple && simObj.hitBob(p.x,p.y)){
      simObj.dragging = true;
      setCursor("grabbing");
      simObj.dragPointer(p.x,p.y);
      canvas.setPointerCapture(e.pointerId);
      return;
    }
    if (simObj instanceof MasaResorte && simObj.hitMass(p.x,p.y)){
      simObj.dragging = true;
      setCursor("grabbing");
      simObj.dragPointer(p.x,p.y);
      canvas.setPointerCapture(e.pointerId);
      return;
    }
  }
});

canvas.addEventListener("pointermove", (e)=>{
  const p = getPointerPos(e);

  if (ruler.resizing){
    ruler.h = clamp(p.y - ruler.y, 120, size.h - 40);
    return;
  }
  if (ruler.dragging){
    ruler.x = clamp(p.x - ruler.offX, 6, size.w - ruler.w - 6);
    ruler.y = clamp(p.y - ruler.offY, 6, size.h - ruler.h - 6);
    return;
  }
  if (pro.dragging){
    pro.x = clamp(p.x - pro.offX, pro.r + 6, size.w - pro.r - 6);
    pro.y = clamp(p.y - pro.offY, pro.r + 6, size.h - 6);
    return;
  }

  if (!simObj.running){
    if (simObj instanceof PenduloSimple){
      if (simObj.dragging){ simObj.dragPointer(p.x,p.y); return; }
      setCursor(simObj.hitBob(p.x,p.y) ? "grab" : "default");
    } else if (simObj instanceof MasaResorte){
      if (simObj.dragging){ simObj.dragPointer(p.x,p.y); return; }
      setCursor(simObj.hitMass(p.x,p.y) ? "grab" : "default");
    }
  } else setCursor("default");
});

canvas.addEventListener("pointerup", ()=>{
  ruler.dragging = false;
  ruler.resizing = false;
  pro.dragging = false;
  if (simObj) simObj.dragging = false;
  setCursor("default");
});

// ===================== Animation loop =====================
let last = performance.now();

function loop(now){
  const dtReal = (now - last) / 1000;
  last = now;

  if (simObj.running){
    const h = 0.002;
    const steps = Math.max(1, Math.floor(dtReal / h));
    const dt = dtReal / steps;
    for (let i=0;i<steps;i++) simObj.step(dt);

    updatePeriodStats(simObj);

    if (chkAutoRecord.checked){
      if (simObj.t - lastRecordT >= recordDt){
        lastRecordT = simObj.t;
        pushData(simObj);
        renderTable();
        drawPlot();
      }
    }
  }

  simObj.draw();
  requestAnimationFrame(loop);
}

// ===================== Init =====================
fitCanvases();
setActiveTab("pendulo");
updatePlayUI();
updateDragHint();
requestAnimationFrame(loop);
