/**
 * Lucky Draw Wheel - Main Application
 * Physics-based spinning wheel with touch/mouse interaction
 * Supports both D1 database (when deployed) and localStorage (fallback)
 */

// Fresh color palette for wheel segments
const WHEEL_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#a855f7', // Purple
];

// Default prize configuration (no emoji, auto colors)
const DEFAULT_PRIZES = [
  { name: '一等奖' },
  { name: '二等奖' },
  { name: '三等奖' },
  { name: '幸运奖' },
  { name: '参与奖' },
  { name: '再来一次' },
];

// Storage keys for localStorage fallback
const STORAGE_KEYS = {
  PRIZES: 'lucky_draw_prizes',
  HISTORY: 'lucky_draw_history',
};

// App state
let prizes = [];
let history = [];
let wheel = null;
let confetti = null;
let useAPI = false; // Will be set to true if API is available

/**
 * API Functions - Try D1 database first, fallback to localStorage
 */
async function checkAPIAvailable() {
  try {
    const response = await fetch('/api/prizes', { method: 'GET' });
    if (response.ok) {
      useAPI = true;
      console.log('Using D1 database for storage');
      return true;
    }
  } catch (e) {
    console.log('API not available, using localStorage');
  }
  useAPI = false;
  return false;
}

async function loadPrizes() {
  if (useAPI) {
    try {
      const response = await fetch('/api/prizes');
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        return result.data.map(p => ({ name: p.name }));
      }
    } catch (e) {
      console.warn('Failed to load prizes from API:', e);
    }
  }
  // Fallback to localStorage
  return loadFromStorage(STORAGE_KEYS.PRIZES, JSON.parse(JSON.stringify(DEFAULT_PRIZES)));
}

async function savePrizesToDB(prizesData) {
  if (useAPI) {
    try {
      const response = await fetch('/api/prizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizes: prizesData }),
      });
      const result = await response.json();
      if (result.success) return true;
    } catch (e) {
      console.warn('Failed to save prizes to API:', e);
    }
  }
  // Fallback to localStorage
  saveToStorage(STORAGE_KEYS.PRIZES, prizesData);
  return true;
}

async function loadHistory() {
  if (useAPI) {
    try {
      const response = await fetch('/api/history');
      const result = await response.json();
      if (result.success) {
        return result.data.map(h => ({
          name: h.prize_name,
          color: h.prize_color,
          timestamp: new Date(h.created_at).getTime(),
        }));
      }
    } catch (e) {
      console.warn('Failed to load history from API:', e);
    }
  }
  // Fallback to localStorage
  return loadFromStorage(STORAGE_KEYS.HISTORY, []);
}

async function saveHistoryRecord(prizeName, prizeColor) {
  if (useAPI) {
    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prize_name: prizeName, prize_color: prizeColor }),
      });
      const result = await response.json();
      if (result.success) return true;
    } catch (e) {
      console.warn('Failed to save history to API:', e);
    }
  }
  // Fallback handled in addToHistory
  return false;
}

async function clearHistoryFromDB() {
  if (useAPI) {
    try {
      const response = await fetch('/api/history', { method: 'DELETE' });
      const result = await response.json();
      if (result.success) return true;
    } catch (e) {
      console.warn('Failed to clear history from API:', e);
    }
  }
  // Fallback to localStorage
  saveToStorage(STORAGE_KEYS.HISTORY, []);
  return true;
}

async function resetPrizesToDefault() {
  if (useAPI) {
    try {
      const response = await fetch('/api/prizes', { method: 'PUT' });
      const result = await response.json();
      if (result.success) {
        return result.data.map(p => ({ name: p.name }));
      }
    } catch (e) {
      console.warn('Failed to reset prizes from API:', e);
    }
  }
  // Fallback
  return JSON.parse(JSON.stringify(DEFAULT_PRIZES));
}

/**
 * Confetti Effect
 */
class ConfettiEffect {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.isRunning = false;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  createParticle() {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    return {
      x: Math.random() * this.canvas.width,
      y: -20,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2,
      speedX: (Math.random() - 0.5) * 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    };
  }
  
  start(duration = 3000) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.particles = [];
    
    for (let i = 0; i < 100; i++) {
      const p = this.createParticle();
      p.y = Math.random() * this.canvas.height * 0.5;
      this.particles.push(p);
    }
    
    const spawnInterval = setInterval(() => {
      for (let i = 0; i < 5; i++) {
        this.particles.push(this.createParticle());
      }
    }, 50);
    
    setTimeout(() => {
      clearInterval(spawnInterval);
    }, duration * 0.7);
    
    setTimeout(() => {
      this.stop();
    }, duration);
    
    this.animate();
  }
  
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  animate() {
    if (!this.isRunning) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles = this.particles.filter(p => p.y < this.canvas.height + 20);
    
    this.particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;
      p.speedY += 0.1;
      
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation * Math.PI / 180);
      this.ctx.fillStyle = p.color;
      
      if (p.shape === 'rect') {
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    });
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

/**
 * PhysicsWheel - Canvas wheel with physics-based rotation
 */
class PhysicsWheel {
  constructor(canvas, prizes) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.prizes = prizes;
    
    this.rotation = 0;
    this.angularVelocity = 0;
    this.friction = 0.985;
    this.minVelocity = 0.001;
    
    this.isDragging = false;
    this.lastAngle = 0;
    this.lastTime = 0;
    this.velocityHistory = [];
    
    this.animationId = null;
    this.isSpinning = false;
    this.onSpinEnd = null;
    
    this.init();
  }
  
  init() {
    this.setupCanvas();
    this.setupEvents();
    this.draw();
    this.startAnimation();
  }
  
  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    
    this.centerX = rect.width / 2;
    this.centerY = rect.height / 2;
    this.radius = Math.min(this.centerX, this.centerY) - 4;
  }
  
  setupEvents() {
    this.canvas.addEventListener('mousedown', this.handleStart.bind(this));
    window.addEventListener('mousemove', this.handleMove.bind(this));
    window.addEventListener('mouseup', this.handleEnd.bind(this));
    
    this.canvas.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
    window.addEventListener('touchend', this.handleEnd.bind(this));
    
    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.draw();
    });
  }
  
  getEventPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left - this.centerX,
      y: clientY - rect.top - this.centerY,
    };
  }
  
  getAngle(pos) {
    return Math.atan2(pos.y, pos.x);
  }
  
  handleStart(e) {
    if (this.isSpinning) return;
    
    e.preventDefault();
    const pos = this.getEventPos(e);
    const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
    
    if (dist > this.radius) return;
    
    this.isDragging = true;
    this.lastAngle = this.getAngle(pos);
    this.lastTime = performance.now();
    this.velocityHistory = [];
    this.angularVelocity = 0;
  }
  
  handleMove(e) {
    if (!this.isDragging) return;
    
    e.preventDefault();
    const pos = this.getEventPos(e);
    const currentAngle = this.getAngle(pos);
    const currentTime = performance.now();
    
    let deltaAngle = currentAngle - this.lastAngle;
    
    if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
    if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
    
    this.rotation += deltaAngle;
    
    const deltaTime = (currentTime - this.lastTime) / 1000;
    if (deltaTime > 0) {
      const velocity = deltaAngle / deltaTime;
      this.velocityHistory.push({ velocity, time: currentTime });
      
      const cutoff = currentTime - 100;
      this.velocityHistory = this.velocityHistory.filter(v => v.time > cutoff);
    }
    
    this.lastAngle = currentAngle;
    this.lastTime = currentTime;
    
    if (navigator.vibrate && Math.abs(deltaAngle) > 0.05) {
      navigator.vibrate(1);
    }
  }
  
  handleEnd() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    
    if (this.velocityHistory.length > 0) {
      const totalVelocity = this.velocityHistory.reduce((sum, v) => sum + v.velocity, 0);
      this.angularVelocity = totalVelocity / this.velocityHistory.length;
      this.angularVelocity *= 0.8;
      
      const maxVelocity = 50;
      this.angularVelocity = Math.max(-maxVelocity, Math.min(maxVelocity, this.angularVelocity));
      
      if (Math.abs(this.angularVelocity) > 3) {
        this.isSpinning = true;
        this.angularVelocity += (Math.random() - 0.5) * 5;
      }
    }
  }
  
  startAnimation() {
    const animate = () => {
      this.update();
      this.draw();
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }
  
  update() {
    if (!this.isDragging && Math.abs(this.angularVelocity) > this.minVelocity) {
      this.angularVelocity *= this.friction;
      this.rotation += this.angularVelocity * 0.016;
      
      const segmentAngle = (2 * Math.PI) / this.prizes.length;
      const normalized = ((this.rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const segmentPos = normalized % segmentAngle;
      
      if (segmentPos < 0.05 || segmentPos > segmentAngle - 0.05) {
        if (navigator.vibrate && this.isSpinning) {
          navigator.vibrate(2);
        }
      }
    } else if (this.isSpinning && Math.abs(this.angularVelocity) <= this.minVelocity) {
      this.angularVelocity = 0;
      this.isSpinning = false;
      
      const winningIndex = this.getWinningIndex();
      if (this.onSpinEnd) {
        this.onSpinEnd(winningIndex);
      }
    }
  }
  
  getWinningIndex() {
    const segmentAngle = (2 * Math.PI) / this.prizes.length;
    const pointerAngle = -Math.PI / 2;
    const normalized = ((pointerAngle - this.rotation) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const index = Math.floor(normalized / segmentAngle);
    return index;
  }
  
  getColor(index) {
    return WHEEL_COLORS[index % WHEEL_COLORS.length];
  }
  
  draw() {
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    const segmentAngle = (2 * Math.PI) / this.prizes.length;
    
    this.prizes.forEach((prize, i) => {
      const startAngle = i * segmentAngle + this.rotation;
      const endAngle = startAngle + segmentAngle;
      const color = this.getColor(i);
      
      ctx.beginPath();
      ctx.moveTo(this.centerX, this.centerY);
      ctx.arc(this.centerX, this.centerY, this.radius, startAngle, endAngle);
      ctx.closePath();
      
      ctx.fillStyle = color;
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.save();
      ctx.translate(this.centerX, this.centerY);
      
      const midAngle = startAngle + segmentAngle / 2;
      const textRadius = this.radius * 0.65;
      const textX = Math.cos(midAngle) * textRadius;
      const textY = Math.sin(midAngle) * textRadius;
      
      const normalizedMid = ((midAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const isLeftSide = normalizedMid > Math.PI / 2 && normalizedMid < 3 * Math.PI / 2;
      
      ctx.translate(textX, textY);
      
      ctx.fillStyle = '#fff';
      const fontSize = Math.max(12, Math.min(16, this.radius / 12));
      ctx.font = `600 ${fontSize}px 'Outfit', sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 3;
      
      if (isLeftSide) {
        ctx.rotate(midAngle + Math.PI);
        ctx.textAlign = 'right';
      } else {
        ctx.rotate(midAngle);
        ctx.textAlign = 'left';
      }
      
      ctx.fillText(prize.name, 0, 0);
      ctx.restore();
    });
    
    const innerHighlight = ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, this.radius * 0.3
    );
    innerHighlight.addColorStop(0, 'rgba(255,255,255,0.1)');
    innerHighlight.addColorStop(1, 'transparent');
    ctx.fillStyle = innerHighlight;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }
  
  updatePrizes(newPrizes) {
    this.prizes = newPrizes;
    this.draw();
  }
  
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

/**
 * LocalStorage utilities (fallback)
 */
function loadFromStorage(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to save to storage:', e);
  }
}

/**
 * UI Functions
 */
function showResult(prize, colorIndex) {
  const display = document.getElementById('result-display');
  const prizeText = document.getElementById('result-prize');
  
  prizeText.textContent = prize.name;
  prizeText.style.color = WHEEL_COLORS[colorIndex % WHEEL_COLORS.length];
  display.hidden = false;
  
  if (confetti) {
    confetti.start(3500);
  }
  
  addToHistory(prize, colorIndex);
  
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
}

function hideResult() {
  document.getElementById('result-display').hidden = true;
}

async function addToHistory(prize, colorIndex) {
  const color = WHEEL_COLORS[colorIndex % WHEEL_COLORS.length];
  
  // Try to save to API
  await saveHistoryRecord(prize.name, color);
  
  // Also update local state
  const record = {
    name: prize.name,
    color: color,
    timestamp: Date.now(),
  };
  
  history.unshift(record);
  
  if (history.length > 50) {
    history = history.slice(0, 50);
  }
  
  // Save to localStorage as backup
  saveToStorage(STORAGE_KEYS.HISTORY, history);
  renderHistory();
}

function renderHistory() {
  const container = document.getElementById('history-list');
  
  if (history.length === 0) {
    container.innerHTML = '<p class="empty-state">暂无抽奖记录</p>';
    return;
  }
  
  container.innerHTML = history.map(record => {
    const date = new Date(record.timestamp);
    const timeStr = date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    
    return `
      <div class="history-item">
        <span class="history-color" style="background: ${record.color}"></span>
        <div class="history-info">
          <div class="history-prize">${record.name}</div>
          <div class="history-time">${timeStr}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function clearHistory() {
  if (confirm('确定要清空所有抽奖记录吗？')) {
    await clearHistoryFromDB();
    history = [];
    renderHistory();
  }
}

function showModal(id) {
  document.getElementById(id).hidden = false;
}

function hideModal(id) {
  document.getElementById(id).hidden = true;
}

function renderPrizeEditor() {
  const container = document.getElementById('prize-list');
  
  container.innerHTML = prizes.map((prize, i) => `
    <div class="prize-item" data-index="${i}">
      <span class="prize-color-indicator" style="background: ${WHEEL_COLORS[i % WHEEL_COLORS.length]}"></span>
      <input 
        type="text" 
        class="prize-input" 
        value="${prize.name}" 
        placeholder="奖项名称"
        data-field="name"
      >
      <button class="btn-remove-prize" data-action="remove" ${prizes.length <= 2 ? 'disabled' : ''}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `).join('');
}

function handlePrizeEdit(e) {
  const item = e.target.closest('.prize-item');
  if (!item) return;
  
  const index = parseInt(item.dataset.index);
  const field = e.target.dataset.field;
  const action = e.target.closest('[data-action]')?.dataset.action;
  
  if (action === 'remove' && prizes.length > 2) {
    prizes.splice(index, 1);
    renderPrizeEditor();
  } else if (field) {
    prizes[index][field] = e.target.value;
  }
}

function addPrize() {
  if (prizes.length >= 12) {
    alert('最多只能添加12个奖项');
    return;
  }
  
  prizes.push({
    name: `奖项${prizes.length + 1}`,
  });
  renderPrizeEditor();
}

async function resetPrizes() {
  if (confirm('确定要恢复默认奖项设置吗？')) {
    prizes = await resetPrizesToDefault();
    renderPrizeEditor();
  }
}

async function savePrizes() {
  const valid = prizes.every(p => p.name.trim());
  if (!valid) {
    alert('请确保所有奖项都有名称');
    return;
  }
  
  await savePrizesToDB(prizes);
  wheel.updatePrizes(prizes);
  hideModal('modal-settings');
}

/**
 * Initialize application
 */
async function init() {
  // Check if API is available (for D1 database)
  await checkAPIAvailable();
  
  // Load data
  prizes = await loadPrizes();
  history = await loadHistory();
  
  // Initialize confetti
  const confettiCanvas = document.getElementById('confetti-canvas');
  confetti = new ConfettiEffect(confettiCanvas);
  
  // Initialize wheel
  const canvas = document.getElementById('wheel-canvas');
  wheel = new PhysicsWheel(canvas, prizes);
  
  wheel.onSpinEnd = (winningIndex) => {
    const prize = prizes[winningIndex];
    setTimeout(() => showResult(prize, winningIndex), 300);
  };
  
  renderHistory();
  renderPrizeEditor();
  
  // Event listeners
  document.getElementById('btn-close-result').addEventListener('click', hideResult);
  
  document.getElementById('btn-history').addEventListener('click', async () => {
    // Refresh history from DB when opening modal
    if (useAPI) {
      history = await loadHistory();
    }
    renderHistory();
    showModal('modal-history');
  });
  document.getElementById('btn-close-history').addEventListener('click', () => hideModal('modal-history'));
  document.querySelector('#modal-history .modal-backdrop').addEventListener('click', () => hideModal('modal-history'));
  document.getElementById('btn-clear-history').addEventListener('click', clearHistory);
  
  document.getElementById('btn-settings').addEventListener('click', () => {
    renderPrizeEditor();
    showModal('modal-settings');
  });
  document.getElementById('btn-close-settings').addEventListener('click', () => hideModal('modal-settings'));
  document.querySelector('#modal-settings .modal-backdrop').addEventListener('click', () => hideModal('modal-settings'));
  
  document.getElementById('prize-list').addEventListener('input', handlePrizeEdit);
  document.getElementById('prize-list').addEventListener('click', handlePrizeEdit);
  document.getElementById('btn-add-prize').addEventListener('click', addPrize);
  document.getElementById('btn-reset-prizes').addEventListener('click', resetPrizes);
  document.getElementById('btn-save-prizes').addEventListener('click', savePrizes);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
