import { useState, useEffect } from 'react';
import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc,
  query, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Todo, Event } from '../types';

type FirestoreTodo  = Omit<Todo,  'id'>;
type FirestoreEvent = Omit<Event, 'id'>;

function colRef(uid: string, name: 'todos' | 'events') {
  return collection(db, 'users', uid, name);
}

/* ── Todos ── */
export function useTodos(uid: string | null) {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    if (!uid) { setTodos([]); return; }
    const q = query(colRef(uid, 'todos'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setTodos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Todo)));
    });
  }, [uid]);

  const add = async (data: FirestoreTodo) => {
    if (!uid) return;
    await addDoc(colRef(uid, 'todos'), { ...data, createdAt: serverTimestamp() });
  };

  const update = async (id: string, data: Partial<FirestoreTodo>) => {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid, 'todos', id), data);
  };

  const remove = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'todos', id));
  };

  return { todos, add, update, remove };
}

/* ── Events ── */
export function useEvents(uid: string | null) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!uid) { setEvents([]); return; }
    const q = query(colRef(uid, 'events'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Event)));
    });
  }, [uid]);

  const add = async (data: FirestoreEvent) => {
    if (!uid) return;
    await addDoc(colRef(uid, 'events'), { ...data, createdAt: serverTimestamp() });
  };

  const update = async (id: string, data: Partial<FirestoreEvent>) => {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid, 'events', id), data);
  };

  const remove = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'events', id));
  };

  return { events, add, update, remove };
}
