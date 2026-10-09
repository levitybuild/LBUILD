import { StaticFile } from './types';

export interface SampleTemplate {
  id: string;
  name: string;
  appId: string;
  themeColor: string;
  fullscreen: boolean;
  description: string;
  files: StaticFile[];
}

export const SAMPLE_TEMPLATES: SampleTemplate[] = [
  {
    id: 'streak_habit',
    name: 'StreakHero (Duolingo Style)',
    appId: 'com.larp.streakhero',
    themeColor: '#D97757',
    fullscreen: false,
    description: 'Gamified habit tracker featuring dynamic app icon swapping (Fire Streak, Stealth Dark, Golden), theme color reactivity, and haptics.',
    files: [
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#FAF8F5">
  <title>StreakHero</title>
  <style>
    :root {
      --primary: #D97757;
      --bg: #FAF8F5;
      --surface: #FFFFFF;
      --text: #1F1E1D;
      --muted: #736E67;
      --border: #E8E4DD;
    }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      box-sizing: border-box;
      padding: env(safe-area-inset-top, 16px) 20px env(safe-area-inset-bottom, 20px);
    }
    header {
      padding: 16px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .streak-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      color: var(--primary);
      font-size: 1rem;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
    }
    h2 {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
    }
    p {
      margin: 0 0 16px 0;
      font-size: 0.9rem;
      color: var(--muted);
      line-height: 1.4;
    }
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 12px;
    }
    .icon-btn {
      background: #F4EFEB;
      border: 2px solid transparent;
      border-radius: 12px;
      padding: 14px 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }
    .icon-btn.active {
      border-color: var(--primary);
      background: #FFFFFF;
      box-shadow: 0 4px 12px rgba(217, 119, 87, 0.15);
    }
    .icon-glyph {
      font-size: 2rem;
    }
    .icon-name {
      font-size: 0.75rem;
      font-weight: 600;
      text-align: center;
    }
    .theme-palette {
      display: flex;
      gap: 10px;
      margin-top: 12px;
    }
    .color-dot {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 3px solid #FFF;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      cursor: pointer;
    }
    .btn-action {
      width: 100%;
      background: var(--primary);
      color: #FFF;
      border: none;
      padding: 14px;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    .notice {
      font-size: 0.78rem;
      color: var(--muted);
      text-align: center;
      margin-top: auto;
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">StreakHero</div>
    <div class="streak-badge">
      <span id="streak-icon">🔥</span>
      <span id="streak-count">14 Days</span>
    </div>
  </header>

  <div class="card">
    <h2>Dynamic App Icon (Duolingo Style)</h2>
    <p>Tap a variant below. LARP triggers the native Android <code>&lt;activity-alias&gt;</code> and iOS alternate icon engine to swap your home screen icon instantly!</p>
    
    <div class="icon-grid">
      <button class="icon-btn active" onclick="switchIcon('default', '🦉')">
        <span class="icon-glyph">🦉</span>
        <span class="icon-name">Classic</span>
      </button>
      <button class="icon-btn" onclick="switchIcon('streak_fire', '🔥')">
        <span class="icon-glyph">🔥</span>
        <span class="icon-name">Fire Streak</span>
      </button>
      <button class="icon-btn" onclick="switchIcon('stealth_dark', '⚡')">
        <span class="icon-glyph">⚡</span>
        <span class="icon-name">Stealth Pro</span>
      </button>
    </div>
  </div>

  <div class="card">
    <h2>Reactive Theme Color</h2>
    <p>Selecting a color updates the DOM's <code>&lt;meta name="theme-color"&gt;</code>. LARP's native observer synchronizes the mobile status bar in real-time.</p>
    
    <div class="theme-palette">
      <div class="color-dot" style="background: #D97757;" onclick="setTheme('#D97757')"></div>
      <div class="color-dot" style="background: #2563EB;" onclick="setTheme('#2563EB')"></div>
      <div class="color-dot" style="background: #059669;" onclick="setTheme('#059669')"></div>
      <div class="color-dot" style="background: #7C3AED;" onclick="setTheme('#7C3AED')"></div>
      <div class="color-dot" style="background: #111827;" onclick="setTheme('#111827')"></div>
    </div>
  </div>

  <button class="btn-action" onclick="logStreak()">Complete Daily Habit (+1)</button>

  <div class="notice">Powered by LARP Offline Runtime Bridge</div>

  <script>
    let streak = 14;

    function switchIcon(variantId, glyph) {
      document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));
      event.currentTarget.classList.add('active');
      document.getElementById('streak-icon').textContent = glyph;
      
      if (window.LarpBridge) {
        window.LarpBridge.haptic('MEDIUM');
        window.LarpBridge.setIcon(variantId);
      }
    }

    function setTheme(color) {
      document.documentElement.style.setProperty('--primary', color);
      // Update DOM meta - LARP Bridge observes this and synchronizes native status bar!
      let meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', color);
      }
      if (window.LarpBridge) {
        window.LarpBridge.setThemeColor(color);
      }
    }

    function logStreak() {
      streak++;
      document.getElementById('streak-count').textContent = streak + ' Days';
      if (window.LarpBridge) {
        window.LarpBridge.haptic('HEAVY');
      }
      if (streak >= 15) {
        switchIcon('streak_fire', '🔥');
      }
    }
  </script>
</body>
</html>`
      }
    ]
  },
  {
    id: 'zenith_fullscreen',
    name: 'Zenith Kinetic (True Fullscreen)',
    appId: 'com.larp.zenithflow',
    themeColor: '#0F172A',
    fullscreen: true,
    description: 'Fluid simulation canvas utilizing true immersive sticky fullscreen mode, display cutout shortEdges, and native haptics.',
    files: [
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#0F172A">
  <title>Zenith Kinetic</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #0B0F19;
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    .hud {
      position: absolute;
      top: env(safe-area-inset-top, 20px);
      left: 20px;
      right: 20px;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      pointer-events: none;
    }
    .title {
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .controls {
      position: absolute;
      bottom: env(safe-area-inset-bottom, 24px);
      left: 20px;
      right: 20px;
      z-index: 10;
      display: flex;
      gap: 10px;
    }
    .glass-btn {
      flex: 1;
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #FFF;
      padding: 14px;
      border-radius: 14px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="hud">
    <div class="title">ZENITH · FULLSCREEN</div>
    <div style="font-size: 0.8rem; opacity: 0.7;">60 FPS IMMERSIVE</div>
  </div>

  <canvas id="c"></canvas>

  <div class="controls">
    <button class="glass-btn" onclick="pulse()">Burst Kinetic Pulse</button>
    <button class="glass-btn" onclick="toggleColor()">Shift Color</button>
  </div>

  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const colors = ['#D97757', '#38BDF8', '#818CF8', '#34D399'];
    let currentColor = colors[0];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 3 + 1.5
      });
    }

    function animate() {
      ctx.fillStyle = 'rgba(11, 15, 25, 0.2)';
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = currentColor;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }
    animate();

    function pulse() {
      if (window.LarpBridge) {
        window.LarpBridge.haptic('HEAVY');
      }
      particles.forEach(p => {
        p.vx = (Math.random() - 0.5) * 6;
        p.vy = (Math.random() - 0.5) * 6;
      });
    }

    let colIdx = 0;
    function toggleColor() {
      colIdx = (colIdx + 1) % colors.length;
      currentColor = colors[colIdx];
      if (window.LarpBridge) {
        window.LarpBridge.setThemeColor(currentColor);
      }
    }
  </script>
</body>
</html>`
      }
    ]
  }
];
