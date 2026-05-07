// ══════════════════════════════════════════════════════
//  firebase-config.js  —  共用 Firebase 設定
//  ⚠️  請將下方 firebaseConfig 換成你自己的 Firebase 專案設定
// ══════════════════════════════════════════════════════
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';

// ══════════════════════════════════════════════════════
//  🔧 替換這裡的設定！
//  從 Firebase Console → 專案設定 → 你的應用程式 → SDK 設定和配置 複製
// ══════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

// ── Auth helpers ──────────────────────────────────────
export async function signInWithGoogle() {
  try {
    // 手機優先用 redirect，桌機用 popup
    if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      await signInWithRedirect(auth, provider);
    } else {
      await signInWithPopup(auth, provider);
    }
  } catch (e) {
    console.error('登入失敗', e);
    throw e;
  }
}

export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (e) {
    return null;
  }
}

export function signOutUser() {
  return signOut(auth);
}

export function getCurrentUser() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Firestore helpers ─────────────────────────────────
export async function fsGet(path) {
  return getDoc(doc(db, path));
}

export async function fsSet(path, data) {
  return setDoc(doc(db, path), data, { merge: true });
}

export async function fsDelete(path) {
  return deleteDoc(doc(db, path));
}

export async function fsGetCollection(path) {
  const snap = await getDocs(collection(db, path));
  const result = {};
  snap.forEach(d => { result[d.id] = d.data(); });
  return result;
}

// ── Storage helpers ───────────────────────────────────
export async function uploadFile(path, file) {
  const r = storageRef(storage, path);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}

export async function deleteFile(path) {
  const r = storageRef(storage, path);
  return deleteObject(r);
}
