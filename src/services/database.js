import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp, getDocs, where, writeBatch, runTransaction
} from "firebase/firestore";
import { db } from "./firebase";

const base = (uid, name) => collection(db, "users", uid, name);
const one = (uid, name, id) => doc(db, "users", uid, name, id);

export const subscribeCollection = (uid, name, callback) => {
  return onSnapshot(query(base(uid, name), orderBy("createdAt", "desc")), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, err => console.error(err));
};

export const addItem = (uid, name, data) =>
  addDoc(base(uid, name), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });

export const updateItem = (uid, name, id, data) =>
  updateDoc(one(uid, name, id), { ...data, updatedAt: serverTimestamp() });

export const removeItem = (uid, name, id) => deleteDoc(one(uid, name, id));

export const saveDoc = (uid, name, id, data) =>
  setDoc(one(uid, name, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });

export const listenDoc = (uid, name, id, callback) =>
  onSnapshot(one(uid, name, id), d => callback(d.exists() ? { id: d.id, ...d.data() } : null));


export const renameCategoryAndLaunches = async (uid, categoryId, oldName, newName) => {
  const snap = await getDocs(query(base(uid, "transactions"), where("categoryId", "==", categoryId)));
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { category: newName, categoryId, updatedAt: serverTimestamp() }));
  await batch.commit();
  // Compatibility with transactions created by the earlier version.
  if (snap.empty) {
    const legacy = await getDocs(query(base(uid, "transactions"), where("category", "==", oldName)));
    const b2 = writeBatch(db);
    legacy.docs.forEach(d => b2.update(d.ref, { category: newName, categoryId, updatedAt: serverTimestamp() }));
    await b2.commit();
  }
};

export const nextReceiptNumber = async (uid) => {
  const ref = doc(db, "users", uid, "settings", "receiptCounter");
  return runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? Number(snap.data().value || 338) : 338;
    const next = current + 1;
    tx.set(ref, { value: next }, { merge: true });
    return String(next).padStart(5, "0");
  });
};
