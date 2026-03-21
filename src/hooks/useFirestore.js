import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

// Generate a unique string ID
export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function useFirestoreCollection(username, collectionName) {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  // Keep a ref to latest items so async writes always use fresh data
  const itemsRef = useRef([]);
  itemsRef.current = items;

  // ── Realtime listener ──────────────────────────────────────────
  useEffect(() => {
    if (!username) { setLoading(false); return; }

    // Show cached data instantly while Firestore loads
    try {
      const cached = localStorage.getItem(`ll_${collectionName}_${username}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setItems(parsed);
        itemsRef.current = parsed;
      }
    } catch {}

    setLoading(true);
    const colRef = collection(db, 'users', username, collectionName);

    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        setItems(data);
        itemsRef.current = data;
        setLoading(false);
        setError(null);
        try {
          localStorage.setItem(`ll_${collectionName}_${username}`, JSON.stringify(data));
        } catch {}
      },
      (err) => {
        console.error(`[Firestore] ${collectionName} listener error:`, err.code, err.message);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [username, collectionName]);

  // ── Write a single item (add or update) ───────────────────────
  const saveItem = useCallback(async (item) => {
    if (!username) return;
    const id = String(item.id || genId());
    const itemWithId = { ...item, id };
    const docRef = doc(db, 'users', username, collectionName, id);
    try {
      await setDoc(docRef, { ...itemWithId, _updatedAt: Date.now() }, { merge: true });
      setError(null);
    } catch (err) {
      console.error('[Firestore] saveItem error:', err.code, err.message);
      setError(err.message);
    }
    return itemWithId;
  }, [username, collectionName]);

  // ── Delete a single item ──────────────────────────────────────
  const removeItem = useCallback(async (id) => {
    if (!username) return;
    const docRef = doc(db, 'users', username, collectionName, String(id));
    try {
      await deleteDoc(docRef);
      setError(null);
    } catch (err) {
      console.error('[Firestore] removeItem error:', err.code, err.message);
      setError(err.message);
    }
  }, [username, collectionName]);

  return { items, loading, error, saveItem, removeItem };
}

export function useVocab(username) {
  return useFirestoreCollection(username, 'vocabulary');
}

export function useSentences(username) {
  return useFirestoreCollection(username, 'sentences');
}
