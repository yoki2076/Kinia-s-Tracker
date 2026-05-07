// ══════════════════════════════════════════════════════
//  auth-guard.js  —  登入保護 + 頂部導覽列
//  每個 HTML 頁面 <body> 最開頭引入即可
// ══════════════════════════════════════════════════════

import { getCurrentUser, onAuthChange, signInWithGoogle, signOutUser, handleRedirectResult } from './firebase-config.js';

// ── 注入登入牆 CSS ────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  #auth-wall {
    position: fixed; inset: 0; z-index: 9000;
    background: linear-gradient(160deg, #6B4428 0%, #3a2010 100%);
    display: flex; align-items: center; justify-content: center;
    padding: 24px; font-family: 'Noto Sans TC', sans-serif;
  }
  #auth-wall .auth-card {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 24px;
    padding: 40px 28px;
    width: 100%; max-width: 340px;
    text-align: center;
    backdrop-filter: blur(12px);
  }
  #auth-wall .auth-logo { font-size: 48px; margin-bottom: 12px; }
  #auth-wall .auth-title {
    font-size: 22px; font-weight: 700; color: #fff;
    margin-bottom: 6px; letter-spacing: -0.3px;
  }
  #auth-wall .auth-sub {
    font-size: 13px; color: rgba(255,255,255,0.65);
    margin-bottom: 32px; line-height: 1.6;
  }
  #auth-wall .google-btn {
    display: flex; align-items: center; justify-content: center;
    gap: 10px; width: 100%; padding: 14px 20px;
    border-radius: 14px; border: none; cursor: pointer;
    background: #fff; color: #2C2016;
    font-size: 14px; font-weight: 600;
    font-family: 'Noto Sans TC', sans-serif;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    transition: all 0.2s;
  }
  #auth-wall .google-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,0,0,0.35); }
  #auth-wall .google-btn:active { transform: scale(0.98); }
  #auth-wall .google-btn img { width: 20px; height: 20px; }
  #auth-wall .auth-note {
    margin-top: 20px; font-size: 11px;
    color: rgba(255,255,255,0.45); line-height: 1.7;
  }
  #auth-wall .loading-spinner {
    width: 28px; height: 28px; border-radius: 50%;
    border: 3px solid rgba(255,255,255,0.2);
    border-top-color: #fff;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── 頂部導覽欄 ── */
  #app-nav {
    display: none;
    position: fixed; top: 0; left: 0; right: 0; z-index: 8000;
    background: rgba(247,243,238,0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid #DDD4C6;
    padding: 0 12px;
    height: 52px;
    align-items: center;
    justify-content: space-between;
    font-family: 'Noto Sans TC', sans-serif;
    max-width: 430px;
    margin: 0 auto;
  }
  #app-nav .nav-apps {
    display: flex; gap: 4px; overflow-x: auto;
    scrollbar-width: none; flex: 1;
  }
  #app-nav .nav-apps::-webkit-scrollbar { display: none; }
  #app-nav .nav-app-btn {
    flex-shrink: 0; padding: 5px 10px;
    border-radius: 20px; border: 1px solid transparent;
    background: transparent; color: #6B5744;
    font-size: 11px; cursor: pointer;
    font-family: 'Noto Sans TC', sans-serif;
    white-space: nowrap; transition: all 0.15s;
    text-decoration: none; display: inline-flex; align-items: center; gap: 4px;
  }
  #app-nav .nav-app-btn:hover { background: #F0EBE3; }
  #app-nav .nav-app-btn.current {
    background: #8B5E3C; color: #fff;
    border-color: #6B4428;
  }
  #app-nav .nav-user {
    display: flex; align-items: center; gap: 8px; flex-shrink: 0;
  }
  #app-nav .nav-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    border: 1.5px solid #DDD4C6; object-fit: cover;
    cursor: pointer;
  }
  #app-nav .nav-avatar-placeholder {
    width: 28px; height: 28px; border-radius: 50%;
    background: #8B5E3C; color: #fff;
    font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0;
  }
  #app-nav .logout-btn {
    padding: 4px 10px; border-radius: 20px;
    border: 1px solid #DDD4C6; background: transparent;
    color: #6B5744; font-size: 11px; cursor: pointer;
    font-family: 'Noto Sans TC', sans-serif;
    transition: all 0.15s; flex-shrink: 0;
  }
  #app-nav .logout-btn:hover { background: #F0EBE3; }

  /* Push body down for nav */
  body.auth-ready { padding-top: 52px !important; }
`;
document.head.appendChild(style);

// ── App 清單（可在此新增頁面）────────────────────────
const APPS = [
  { label: '🌸 首頁', href: 'index.html' },
  { label: '💰 記帳', href: '記帳.html' },
  { label: '🛍 購物', href: '購物紀錄.html' },
  { label: '🎨 藝文', href: 'arts-tracker.html' },
  { label: '📋 計畫', href: 'routine_tracker.html' },
  { label: '⭐ 願望', href: 'wishlist.html' },
];

const currentFile = location.pathname.split('/').pop() || 'index.html';

// ── 建立登入牆 DOM ─────────────────────────────────────
function createAuthWall(loading = true) {
  const div = document.createElement('div');
  div.id = 'auth-wall';
  div.innerHTML = `
    <div class="auth-card">
      <div class="auth-logo">🌸</div>
      <div class="auth-title">Kinia's Tracker</div>
      <div class="auth-sub">你的私人小幫手<br>登入後資料雲端同步</div>
      ${loading
        ? `<div class="loading-spinner"></div><div style="color:rgba(255,255,255,0.6);font-size:13px;">驗證中…</div>`
        : `<button class="google-btn" id="google-signin-btn">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
            使用 Google 帳號登入
           </button>
           <div class="auth-note">登入即代表同意資料儲存於你的 Google 帳號下<br>資料僅供個人使用</div>`
      }
    </div>
  `;
  document.body.insertBefore(div, document.body.firstChild);
  return div;
}

// ── 建立頂部導覽列 ────────────────────────────────────
function createAppNav(user) {
  const nav = document.createElement('nav');
  nav.id = 'app-nav';
  const appsHtml = APPS.map(a =>
    `<a class="nav-app-btn${a.href === currentFile ? ' current' : ''}" href="${a.href}">${a.label}</a>`
  ).join('');

  const avatarHtml = user.photoURL
    ? `<img class="nav-avatar" src="${user.photoURL}" alt="avatar" title="${user.displayName || '使用者'}">`
    : `<div class="nav-avatar-placeholder" title="${user.displayName || '使用者'}">${(user.displayName||'U')[0].toUpperCase()}</div>`;

  nav.innerHTML = `
    <div class="nav-apps">${appsHtml}</div>
    <div class="nav-user">
      ${avatarHtml}
      <button class="logout-btn" id="nav-logout-btn">登出</button>
    </div>
  `;
  document.body.insertBefore(nav, document.body.firstChild);
  nav.style.display = 'flex';
  document.body.classList.add('auth-ready');

  document.getElementById('nav-logout-btn').addEventListener('click', async () => {
    await signOutUser();
    location.reload();
  });
}

// ── 主流程 ────────────────────────────────────────────
let wall = createAuthWall(true);

(async () => {
  // 處理 redirect 回來的結果
  await handleRedirectResult();

  const user = await getCurrentUser();

  if (user) {
    // 已登入 → 移除牆、顯示導覽
    wall.remove();
    createAppNav(user);
    // 把 uid 存到 localStorage 供各頁面使用
    try { localStorage.setItem('tripApp_uid', user.uid); } catch(e) {}
    // 通知頁面登入完成
    window.dispatchEvent(new CustomEvent('tripapp:ready', { detail: { user } }));
  } else {
    // 未登入 → 顯示登入牆
    wall.remove();
    wall = createAuthWall(false);
    document.getElementById('google-signin-btn').addEventListener('click', async () => {
      try { await signInWithGoogle(); } catch(e) { alert('登入失敗，請再試一次'); }
    });
  }

  // 監聽之後的登入狀態變化
  onAuthChange((u) => {
    if (u && !document.getElementById('app-nav')) {
      document.getElementById('auth-wall')?.remove();
      createAppNav(u);
      try { localStorage.setItem('tripApp_uid', u.uid); } catch(e) {}
      window.dispatchEvent(new CustomEvent('tripapp:ready', { detail: { user: u } }));
    }
  });
})();
