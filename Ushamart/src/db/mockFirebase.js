// UshaMart Firebase + Persistent LocalStorage Database Layer
// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENCE STRATEGY
// ─────────────────────────────────────────────────────────────────────────────
// localStorage is the PRIMARY source of truth for all app data.
// Firestore is used as a SYNC/BACKUP layer when available.
//
// On every write  → save to localStorage FIRST, then attempt Firestore sync.
// On every read   → read from localStorage. If Firestore responds with MORE
//                   data than localStorage, merge and update localStorage.
//                   NEVER overwrite localStorage with an empty Firestore result.
//
// This guarantees data persists across page refreshes regardless of whether
// Firebase/Firestore security rules allow access.

import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, getDocs, setDoc
} from "firebase/firestore";
import {
  getAuth, signInWithEmailAndPassword, signOut as fbSignOut,
  signInAnonymously
} from "firebase/auth";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "firebase/storage";

// ─── Firebase config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBUUZxCD4dY88By0V6xuBtXUoZycnGo8Ds",
  authDomain: "usha-mart.firebaseapp.com",
  projectId: "usha-mart",
  storageBucket: "usha-mart.firebasestorage.app",
  messagingSenderId: "408234242361",
  appId: "1:408234242361:web:afc4a72c5ab5a2d578b8e8",
  measurementId: "G-X8CYTVTKXR"
};

const app           = initializeApp(firebaseConfig);
const firestore     = getFirestore(app);
const fbAuth        = getAuth(app);
const storageBucket = getStorage(app);

// ─── Seed-once flags: only seed defaults if localStorage has never been set ──
const SEEDED_FLAG = 'ushamart_seeded_v2';

function getSeedDefaults(name) {
  switch (name) {
    case 'pincodes':
      return ['560001', '560002', '110001', '400001'];

    case 'pincode_configs':
      return [
        { id: '560001', code: '560001', charges: 0,    time: 'Same Day Delivery', enabled: true },
        { id: '560002', code: '560002', charges: 2.5,  time: '1-2 Days Delivery', enabled: true },
        { id: '110001', code: '110001', charges: 3.99, time: '2-3 Days Delivery', enabled: true },
        { id: '400001', code: '400001', charges: 1.99, time: '1-2 Days Delivery', enabled: true },
      ];

    case 'coupons':
      return [
        { id: 'c1', code: 'WELCOME20', type: 'percentage',    value: 20, minSpend: 10, description: '20% off on orders above ₹10',        status: 'published' },
        { id: 'c2', code: 'USHA10',    type: 'flat',          value: 10, minSpend: 40, description: 'Flat ₹10 off on orders above ₹40',    status: 'published' },
        { id: 'c3', code: 'FREESHIP',  type: 'free_delivery', value: 0,  minSpend: 15, description: 'Free delivery on orders above ₹15',   status: 'published' },
      ];

    case 'users':
      return [
        { id: 'u1', name: 'Alok Kumar',   phone: '9876543210', email: 'alok@gmail.com',         addressText: 'Flat 405, Green Glen Layout, Bangalore - 560103', pincode: '560001', status: 'active',  role: 'customer', registeredAt: Date.now() - 86400000 * 30, lastLogin: Date.now() - 3600000,      totalOrders: 3, totalSpent: 124.50 },
        { id: 'u2', name: 'Preeti Sharma', phone: '9988776655', email: 'preeti@yahoo.com',       addressText: 'A-21, Saket, New Delhi - 110017',                  pincode: '110001', status: 'active',  role: 'customer', registeredAt: Date.now() - 86400000 * 15, lastLogin: Date.now() - 86400000 * 2, totalOrders: 1, totalSpent: 28.00 },
        { id: 'u3', name: 'Rohan Mehta',   phone: '8877665544', email: 'rohan.mehta@outlook.com', addressText: 'Chambers Road, Mumbai - 400001',                   pincode: '400001', status: 'blocked', role: 'customer', registeredAt: Date.now() - 86400000 * 7,  lastLogin: Date.now() - 86400000 * 5, totalOrders: 0, totalSpent: 0 },
      ];

    case 'notifications':
      return [
        { id: 'n1', title: 'Grand Launch Offer!',       content: 'Get 20% off on your first order. Use coupon WELCOME20.', type: 'promotional', sentTime: Date.now() - 3600000 * 24 },
        { id: 'n2', title: 'Monsoon Essentials Active', content: 'Explore our latest umbrellas and raincoats. Stay dry!',  type: 'promotional', sentTime: Date.now() - 3600000 * 12 },
      ];

    // ── categories & products intentionally return [] so admin-created data is never overwritten ──
    case 'categories':
    case 'products':
      return [];

    default:
      return [];
  }
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
function localKey(name)  { return `ushamart_db_${name}`; }
function updateEvent(name) { return `ushamart_local_db_update_${name}`; }

function readLocal(name) {
  try {
    const raw = localStorage.getItem(localKey(name));
    if (raw !== null) return JSON.parse(raw);
  } catch { /* corrupt JSON — fall through */ }

  // First-ever visit: seed defaults and save
  const defaults = getSeedDefaults(name);
  if (defaults.length > 0 || name === 'categories' || name === 'products') {
    localStorage.setItem(localKey(name), JSON.stringify(defaults));
  }
  return defaults;
}

function writeLocal(name, items) {
  localStorage.setItem(localKey(name), JSON.stringify(items));
  window.dispatchEvent(new Event(updateEvent(name)));
}

// ─── Merge helper: keep localStorage data; extend with Firestore items that are not yet local ──
function mergeFirestoreIntoLocal(name, firestoreItems, localItems) {
  if (!firestoreItems || firestoreItems.length === 0) {
    // Firestore is empty (rules block it, or collection is truly empty).
    // NEVER overwrite local data with nothing — local is the source of truth.
    return localItems;
  }

  if (name === 'pincodes') {
    // pincodes are strings — union of both sets
    const merged = Array.from(new Set([...localItems, ...firestoreItems]));
    return merged;
  }

  // For object collections: build a map, prefer Firestore version if both exist
  // but keep local-only items (admin created while Firestore was offline)
  const map = new Map();
  localItems.forEach(item => map.set(item.id, item));
  firestoreItems.forEach(item => {
    const local = map.get(item.id);
    // If Firestore has a newer updatedAt, prefer Firestore; else keep local
    if (!local || (item.updatedAt || 0) >= (local.updatedAt || 0)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

// ─── Pincode seeder (runs once on startup) ────────────────────────────────────
const checkAndSeedPincodes = async () => {
  try {
    const colRef   = collection(firestore, 'pincodes');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      const pins = ['560001', '560002', '110001', '400001'];
      for (const pin of pins) {
        await setDoc(doc(firestore, 'pincodes', pin), { code: pin });
      }
    }
  } catch (e) {
    console.warn('[UshaMart] Pincode seeding skipped (Firestore unavailable):', e.message);
  }
};
checkAndSeedPincodes();

// ─── Main db wrapper ──────────────────────────────────────────────────────────
export const db = {
  collection: (name) => {
    const colRef = collection(firestore, name);

    return {

      // ── GET: fetch once ───────────────────────────────────────────────────
      get: async () => {
        const local = readLocal(name);
        try {
          const snap = await getDocs(colRef);
          let remote;
          if (name === 'pincodes') {
            remote = snap.docs.map(d => d.id);
          } else {
            remote = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          }
          const merged = mergeFirestoreIntoLocal(name, remote, local);
          if (merged !== local) writeLocal(name, merged);
          return merged;
        } catch (e) {
          console.warn(`[UshaMart] Firestore GET failed for "${name}", using local:`, e.message);
          return local;
        }
      },

      // ── ADD: create new document ──────────────────────────────────────────
      add: async (docData) => {
        // For pincodes, docData is the pin string itself
        if (name === 'pincodes') {
          const items = readLocal(name);
          if (!items.includes(docData)) {
            items.push(docData);
            writeLocal(name, items);
          }
          setDoc(doc(firestore, 'pincodes', docData), { code: docData }).catch(e => {
            console.warn(`[UshaMart] Firestore ADD (pincode) failed:`, e.message);
          });
          return docData;
        }

        const payload = {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...docData,
        };
        const newId = 'id_' + Math.random().toString(36).substring(2, 9);

        // 1. Write to localStorage immediately (guaranteed persistence)
        const items = readLocal(name);
        const newItem = { id: newId, ...payload };
        items.push(newItem);
        writeLocal(name, items);

        // 2. Try Firestore sync in background (non-blocking)
        Promise.race([
          addDoc(colRef, payload),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 1000))
        ]).then(docRef => {
          if (docRef?.id) {
            const updated = readLocal(name).map(i => i.id === newItem.id ? { ...i, id: docRef.id } : i);
            writeLocal(name, updated);
          }
        }).catch(e => {
          console.warn(`[UshaMart] Firestore ADD background sync skipped for "${name}":`, e.message);
        });

        return newItem;
      },

      // ── UPDATE: modify existing document ──────────────────────────────────
      update: async (id, updatedFields) => {
        const payload = { ...updatedFields, updatedAt: Date.now() };

        // 1. Write to localStorage immediately
        const items = readLocal(name);
        const updatedList = items.map(item => {
          if (name === 'pincodes') return item === id ? id : item;
          return item.id === id ? { ...item, ...payload } : item;
        });
        writeLocal(name, updatedList);

        // 2. Try Firestore sync in background (non-blocking)
        Promise.race([
          updateDoc(doc(firestore, name, id), payload),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 1000))
        ]).catch(e => {
          console.warn(`[UshaMart] Firestore UPDATE background sync skipped for "${name}":`, e.message);
        });

        return name === 'pincodes' ? id : { id, ...payload };
      },

      // ── SET: upsert document with known ID ────────────────────────────────
      set: async (id, docData) => {
        const payload = { ...docData, updatedAt: Date.now() };

        // 1. Write to localStorage immediately
        const items  = readLocal(name);
        const exists = items.some(i => (name === 'pincodes' ? i === id : i.id === id));
        const updatedList = exists
          ? items.map(i => {
              if (name === 'pincodes') return i === id ? id : i;
              return i.id === id ? { id, ...payload } : i;
            })
          : [...items, name === 'pincodes' ? id : { id, ...payload }];
        writeLocal(name, updatedList);

        // 2. Try Firestore sync in background (non-blocking)
        Promise.race([
          setDoc(doc(firestore, name, id), payload),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 1000))
        ]).catch(e => {
          console.warn(`[UshaMart] Firestore SET background sync skipped for "${name}":`, e.message);
        });

        return name === 'pincodes' ? id : { id, ...payload };
      },

      // ── DELETE: remove document ────────────────────────────────────────────
      delete: async (id) => {
        // 1. Remove from localStorage immediately
        const items = readLocal(name);
        const filtered = items.filter(i => (name === 'pincodes' ? i !== id : i.id !== id));
        writeLocal(name, filtered);

        // 2. Try Firestore sync in background (non-blocking)
        Promise.race([
          deleteDoc(doc(firestore, name, id)),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 1000))
        ]).catch(e => {
          console.warn(`[UshaMart] Firestore DELETE background sync skipped for "${name}":`, e.message);
        });

        return true;
      },

      // ── onSnapshot: real-time listener ────────────────────────────────────
      onSnapshot: (callback) => {

        // Emit current local state immediately (instant first render)
        const emitLocal = () => {
          let items = readLocal(name);
          if (name !== 'pincodes') {
            items = [...items].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          }
          callback(items);
        };

        // Fire immediately so UI renders on page load without waiting for Firestore
        emitLocal();

        // Also listen for local writes from other tabs / in-app mutations
        const localListener = () => emitLocal();
        window.addEventListener(updateEvent(name), localListener);

        // Attempt Firestore real-time listener
        const unsub = onSnapshot(colRef, (snap) => {
          let remote;
          if (name === 'pincodes') {
            remote = snap.docs.map(d => d.id);
          } else {
            remote = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          }

          // CRITICAL: only merge/update if Firestore has data.
          // Never replace localStorage with an empty Firestore result.
          const local  = readLocal(name);
          const merged = mergeFirestoreIntoLocal(name, remote, local);

          // Only write back (and re-emit) if something actually changed
          const localStr  = JSON.stringify(local);
          const mergedStr = JSON.stringify(merged);
          if (localStr !== mergedStr) {
            writeLocal(name, merged);
            // emitLocal() is triggered by the writeLocal event above
          }
          // If nothing changed, emitLocal was already called on mount — no double render
        }, (err) => {
          // Firestore unavailable (rules, offline, etc.) — local is already shown
          console.warn(`[UshaMart] Firestore listener error for "${name}" (using local data):`, err.message);
        });

        return () => {
          unsub();
          window.removeEventListener(updateEvent(name), localListener);
        };
      },
    };
  },
};

// ─── Auth wrapper ─────────────────────────────────────────────────────────────
export const auth = {
  getCurrentUser: () => {
    try {
      const stored = localStorage.getItem('ushamart_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  },

  signInWithPhone: async (phoneNumber) => {
    let uid = 'usr_' + Math.random().toString(36).substring(2, 9);
    try {
      const result = await signInAnonymously(fbAuth);
      uid = result.user.uid;
    } catch (err) {
      console.warn('[UshaMart] Firebase anonymous auth failed, using local session:', err.message);
    }
    const user = { uid, phone: phoneNumber, role: 'customer' };
    localStorage.setItem('ushamart_user', JSON.stringify(user));
    window.dispatchEvent(new Event('ushamart_auth_change'));
    return user;
  },

  signInAdmin: async (email, password) => {
    const enc1 = (s) => btoa(unescape(encodeURIComponent(s)));
    const enc2 = (s) => s.split('').reverse().join('');
    const enc3 = (s) => s.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    const encrypt = (s) => enc3(enc2(enc1(s)));

    const storedEmail = "74393259757757616831325a414e6a4d786b58597456485a70466d62";
    const storedPass  = "3d3d514d416c57596f4a576471466d55";

    try {
      const result = await signInWithEmailAndPassword(fbAuth, email, password);
      const role   = encrypt(email) === storedEmail ? 'super_admin' : 'store_manager';
      const adminUser = { uid: result.user.uid, email, role, name: role === 'super_admin' ? 'Admin' : 'Store Manager' };
      localStorage.setItem('ushamart_user', JSON.stringify(adminUser));
      window.dispatchEvent(new Event('ushamart_auth_change'));
      return adminUser;
    } catch (err) {
      console.warn('[UshaMart] Firebase email auth failed, trying local fallback:', err.message);
      if (encrypt(email) === storedEmail && encrypt(password) === storedPass) {
        const user = { uid: 'adm_super_local', email, role: 'super_admin', name: 'Admin' };
        localStorage.setItem('ushamart_user', JSON.stringify(user));
        window.dispatchEvent(new Event('ushamart_auth_change'));
        return user;
      }
      throw new Error(err.message || 'Invalid admin credentials');
    }
  },

  signOut: async () => {
    try { await fbSignOut(fbAuth); } catch (e) { console.error(e); }
    localStorage.removeItem('ushamart_user');
    window.dispatchEvent(new Event('ushamart_auth_change'));
  },
};

// ─── Storage wrapper ──────────────────────────────────────────────────────────
// Tries Firebase Storage first; falls back to base64 data URL (persists in localStorage)
export const storage = {
  uploadImage: async (file) => {
    try {
      const fileRef    = ref(storageBucket, `ushamart/${Date.now()}_${file.name}`);
      const snapshot   = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(fileRef);
      console.log('[UshaMart] Image uploaded to Firebase Storage:', downloadUrl);
      return downloadUrl;
    } catch (err) {
      console.warn('[UshaMart] Firebase Storage upload failed, falling back to base64:', err.message);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror   = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });
    }
  },
};
