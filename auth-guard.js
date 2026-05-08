// ══════════════════════════════════════════════════════
//  auth-guard.js  —  Kinia's Tracker
//  自包含版本：直接引入 Firebase CDN，不依賴外部 import
//  ⚠️  請把下方 firebaseConfig 換成你自己的設定
// ══════════════════════════════════════════════════════

(function () {

// ── 🔧 填入你的 Firebase 設定 ──────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBylnTy_pDq8fnF9j0rfz6X8NAz2nOPwtE",
  authDomain: "kinia-s-tracker.firebaseapp.com",
  projectId: "kinia-s-tracker",
  storageBucket: "kinia-s-tracker.firebasestorage.app",
  messagingSenderId: "51395444020",
  appId: "1:51395444020:web:e467a74bdbdb3d5e3eb961"
};
// ──────────────────────────────────────────────────────

const APPS = [
  { label: '🌸 首頁',  href: 'index.html' },
  { label: '💰 記帳',  href: '購物紀錄.html' },
  { label: '🛍 購物',  href: 'wishlist.html' },
  { label: '🎨 藝文',  href: 'arts-tracker.html' },
  { label: '📋 計畫',  href: 'routine_tracker.html' },
];

const style = document.createElement('style');
style.textContent = `
  #auth-wall {
    position:fixed;inset:0;z-index:9000;
    background:linear-gradient(160deg,#6B4428 0%,#3a2010 100%);
    display:flex;align-items:center;justify-content:center;
    padding:24px;font-family:'Noto Sans TC',sans-serif;
  }
  #auth-wall .auth-card {
    background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);
    border-radius:24px;padding:40px 28px;width:100%;max-width:340px;
    text-align:center;backdrop-filter:blur(12px);
  }
  #auth-wall .auth-logo{font-size:48px;margin-bottom:12px;}
  #auth-wall .auth-title{font-size:22px;font-weight:700;color:#fff;margin-bottom:6px;}
  #auth-wall .auth-sub{font-size:13px;color:rgba(255,255,255,0.65);margin-bottom:32px;line-height:1.6;}
  #auth-wall .google-btn {
    display:flex;align-items:center;justify-content:center;gap:10px;
    width:100%;padding:14px 20px;border-radius:14px;border:none;cursor:pointer;
    background:#fff;color:#2C2016;font-size:14px;font-weight:600;
    font-family:'Noto Sans TC',sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.25);transition:all 0.2s;
  }
  #auth-wall .google-btn:hover{transform:translateY(-1px);}
  #auth-wall .google-btn:active{transform:scale(0.98);}
  #auth-wall .google-btn img{width:20px;height:20px;}
  #auth-wall .auth-note{margin-top:20px;font-size:11px;color:rgba(255,255,255,0.45);line-height:1.7;}
  #auth-wall .loading-spinner {
    width:28px;height:28px;border-radius:50%;
    border:3px solid rgba(255,255,255,0.2);border-top-color:#fff;
    animation:ag-spin 0.8s linear infinite;margin:0 auto 16px;
  }
  @keyframes ag-spin{to{transform:rotate(360deg);}}

  #app-nav {
    display:none;position:fixed;top:0;left:0;right:0;z-index:8000;
    background:rgba(247,243,238,0.96);backdrop-filter:blur(8px);
    border-bottom:1px solid #DDD4C6;padding:0 12px;height:52px;
    align-items:center;justify-content:space-between;
    font-family:'Noto Sans TC',sans-serif;
    max-width:430px;margin:0 auto;
  }
  #app-nav .nav-apps{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;flex:1;}
  #app-nav .nav-apps::-webkit-scrollbar{display:none;}
  #app-nav .nav-app-btn {
    flex-shrink:0;padding:5px 10px;border-radius:20px;border:1px solid transparent;
    background:transparent;color:#6B5744;font-size:11px;cursor:pointer;
    font-family:'Noto Sans TC',sans-serif;white-space:nowrap;transition:all 0.15s;
    text-decoration:none;display:inline-flex;align-items:center;gap:4px;
  }
  #app-nav .nav-app-btn:hover{background:#F0EBE3;}
  #app-nav .nav-app-btn.current{background:#8B5E3C;color:#fff;border-color:#6B4428;}
  #app-nav .nav-user{display:flex;align-items:center;gap:8px;flex-shrink:0;}
  #app-nav .nav-avatar{width:28px;height:28px;border-radius:50%;border:1.5px solid #DDD4C6;object-fit:cover;}
  #app-nav .nav-avatar-ph{
    width:28px;height:28px;border-radius:50%;background:#8B5E3C;color:#fff;
    font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;
  }
  #app-nav .logout-btn{
    padding:4px 10px;border-radius:20px;border:1px solid #DDD4C6;
    background:transparent;color:#6B5744;font-size:11px;cursor:pointer;
    font-family:'Noto Sans TC',sans-serif;transition:all 0.15s;flex-shrink:0;
  }
  #app-nav .logout-btn:hover{background:#F0EBE3;}
  body.auth-ready{padding-top:52px !important;}
`;
document.head.appendChild(style);

const currentFile = location.pathname.split('/').pop() || 'index.html';

function createAuthWall(loading) {
  const div = document.createElement('div');
  div.id = 'auth-wall';
  div.innerHTML = `
    <div class="auth-card">
      <div class="auth-logo">🌸</div>
      <div class="auth-title">Kinia's Tracker</div>
      <div class="auth-sub">你的私人小幫手<br>登入後資料雲端同步</div>
      ${loading
        ? `<div class="loading-spinner"></div><div style="color:rgba(255,255,255,0.6);font-size:13px;">驗證中…</div>`
        : `<button class="google-btn" id="ag-signin-btn">
             <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G">
             使用 Google 帳號登入
           </button>
           <div class="auth-note">登入即代表同意資料儲存於你的 Google 帳號下<br>資料僅供個人使用</div>`
      }
    </div>`;
  document.body.insertBefore(div, document.body.firstChild);
  return div;
}

function createAppNav(user) {
  if (document.getElementById('app-nav')) return;
  const nav = document.createElement('nav');
  nav.id = 'app-nav';
  const links = APPS.map(function(a) {
    return '<a class="nav-app-btn' + (a.href === currentFile ? ' current' : '') + '" href="' + a.href + '">' + a.label + '</a>';
  }).join('');
  const avatar = user.photoURL
    ? '<img class="nav-avatar" src="' + user.photoURL + '" alt="avatar">'
    : '<div class="nav-avatar-ph">' + (user.displayName || 'K')[0].toUpperCase() + '</div>';
  nav.innerHTML = '<div class="nav-apps">' + links + '</div><div class="nav-user">' + avatar + '<button class="logout-btn" id="ag-logout-btn">登出</button></div>';
  document.body.insertBefore(nav, document.body.firstChild);
  nav.style.display = 'flex';
  document.body.classList.add('auth-ready');
  document.getElementById('ag-logout-btn').onclick = function () {
    firebase.auth().signOut().then(function () { location.reload(); });
  };
}

function onReady(user) {
  var wall = document.getElementById('auth-wall');
  if (wall) wall.remove();
  createAppNav(user);
  try { localStorage.setItem('tripApp_uid', user.uid); } catch(e) {}
  window.dispatchEvent(new CustomEvent('tripapp:ready', { detail: { user: user } }));
}

function loadScript(src) {
  return new Promise(function (resolve, reject) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

createAuthWall(true);

Promise.all([
  loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js'),
  loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js'),
  loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js'),
  loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js'),
]).then(function () {
  firebase.initializeApp(firebaseConfig);

  // 把 Firestore / Storage 方法掛到 window._fb 供各頁面使用
  window._fb = {
    fsGet: function (path) { return firebase.firestore().doc(path).get(); },
    fsSet: function (path, data) { return firebase.firestore().doc(path).set(data, { merge: true }); },
    uploadFile: function (storagePath, file) {
      var ref = firebase.storage().ref(storagePath);
      return ref.put(file).then(function () { return ref.getDownloadURL(); });
    },
    uploadBlob: function (storagePath, blob) {
      var ref = firebase.storage().ref(storagePath);
      return ref.put(blob).then(function () { return ref.getDownloadURL(); });
    },
    deleteFile: function (storagePath) {
      return firebase.storage().ref(storagePath).delete().catch(function(){});
    },
  };

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      onReady(user);
    } else {
      var wall = document.getElementById('auth-wall');
      if (wall) wall.remove();
      createAuthWall(false);
      document.getElementById('ag-signin-btn').onclick = function () {
        var provider = new firebase.auth.GoogleAuthProvider();
        if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
          firebase.auth().signInWithRedirect(provider);
        } else {
          firebase.auth().signInWithPopup(provider).catch(function (e) {
            alert('登入失敗：' + e.message);
          });
        }
      };
    }
  });

}).catch(function (e) {
  console.error('Firebase 載入失敗', e);
  var wall = document.getElementById('auth-wall');
  if (wall) wall.innerHTML = '<div style="color:#fff;padding:40px;text-align:center;">⚠️ 載入失敗，請重新整理頁面</div>';
});

})();
