// Firebase — 구글 로그인 + Firestore 클라우드 동기화
import { initializeApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, getRedirectResult,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// 웹 공개 설정 (비밀 아님 — Firestore 보안 규칙으로 접근 제어)
const firebaseConfig = {
  apiKey: 'AIzaSyBXZgyu3lBGOnBK5oU3qBf9mTIvE5sNDxU',
  authDomain: 'timejig-1af48.firebaseapp.com',
  projectId: 'timejig-1af48',
  storageBucket: 'timejig-1af48.firebasestorage.app',
  messagingSenderId: '365198863627',
  appId: '1:365198863627:web:34a5fd21f152a8ac09060e',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();
// 로그인할 때 항상 계정 선택 창을 띄움 — 브라우저에 로그인된 계정으로 자동 로그인되는 것 방지
provider.setCustomParameters({ prompt: 'select_account' });

// 데스크톱은 팝업, 막히거나 안 되면(모바일/웹뷰 등) 무조건 리디렉트로 폴백
export async function signInGoogle() {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    const code = e?.code || '';
    // 사용자가 팝업을 직접 닫은 경우만 멈춤. 그 외 모든 실패(팝업 차단·미지원·웹뷰 등)는 리디렉트로 재시도
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
    await signInWithRedirect(auth, provider);
  }
}

export function signOutGoogle() {
  return signOut(auth);
}

export function checkRedirect() {
  return getRedirectResult(auth);
}

export { onAuthStateChanged, doc, getDoc, setDoc, onSnapshot };
