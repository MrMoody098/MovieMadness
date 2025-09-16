import { db, ensureAnonymousAuth } from './firebase';
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  addDoc,
  query,
  orderBy
} from 'firebase/firestore';

const generateRoomId = () => Math.random().toString(36).slice(2, 10);

export const createRoom = async ({ tvShowId, seasonNumber, episodeNumber, tvShowName }) => {
  try {
    const user = await ensureAnonymousAuth();
    const roomId = generateRoomId();
    const roomRef = doc(db, 'watchParties', roomId);
    await setDoc(roomRef, {
      createdAt: serverTimestamp(),
      tvShowId,
      tvShowName: tvShowName || '',
      seasonNumber,
      episodeNumber,
      hostUid: user.uid,
      participants: { [user.uid]: { joinedAt: serverTimestamp() } }
    });
    return { roomId, roomRef };
  } catch (err) {
    console.error('createRoom error:', err);
    throw err;
  }
};

export const joinRoom = async (roomId) => {
  try {
    const user = await ensureAnonymousAuth();
    const roomRef = doc(db, 'watchParties', roomId);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) throw new Error('Room not found');
    await updateDoc(roomRef, {
      [`participants.${user.uid}`]: { joinedAt: serverTimestamp() }
    });
    return { roomId, roomRef };
  } catch (err) {
    console.error('joinRoom error:', err);
    throw err;
  }
};

export const onRoomChange = (roomId, callback) => {
  const roomRef = doc(db, 'watchParties', roomId);
  return onSnapshot(roomRef, (snap) => {
    if (!snap.exists()) return;
    callback(snap.data());
  });
};

export const updateSelection = async (roomId, { seasonNumber, episodeNumber }) => {
  const roomRef = doc(db, 'watchParties', roomId);
  await updateDoc(roomRef, { seasonNumber, episodeNumber });
};

export const sendMessage = async (roomId, text) => {
  const user = await ensureAnonymousAuth();
  const messagesRef = collection(db, 'watchParties', roomId, 'messages');
  await addDoc(messagesRef, {
    uid: user.uid,
    text,
    createdAt: serverTimestamp()
  });
};

export const onMessages = (roomId, callback) => {
  const messagesRef = collection(db, 'watchParties', roomId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    const msgs = [];
    snap.forEach((d) => msgs.push({ id: d.id, ...d.data() }));
    callback(msgs);
  });
};


