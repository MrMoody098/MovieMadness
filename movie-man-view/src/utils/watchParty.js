import { db, ensureAnonymousAuth, createNewAnonymousUser } from './firebase';
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

export const createRoom = async ({ tvShowId, seasonNumber, episodeNumber, tvShowName, movieId, movieName, contentType = 'tv' }) => {
  try {
    const user = await ensureAnonymousAuth();
    const roomId = generateRoomId();
    const roomRef = doc(db, 'watchParties', roomId);
    
    const roomData = {
      createdAt: serverTimestamp(),
      contentType, // 'tv' or 'movie'
      hostUid: user.uid,
      participants: { [user.uid]: { joinedAt: serverTimestamp(), nickname: 'Host' } },
      // Video sync state
      playbackState: {
        isPlaying: false,
        currentTime: 0,
        lastSyncTime: serverTimestamp()
      }
    };

    if (contentType === 'tv') {
      roomData.tvShowId = tvShowId;
      roomData.tvShowName = tvShowName || '';
      roomData.seasonNumber = seasonNumber;
      roomData.episodeNumber = episodeNumber;
    } else {
      roomData.movieId = movieId;
      roomData.movieName = movieName || '';
    }

    await setDoc(roomRef, roomData);
    return { roomId, roomRef };
  } catch (err) {
    console.error('createRoom error:', err);
    throw err;
  }
};

export const joinRoom = async (roomId, nickname = 'Anonymous') => {
  try {
    // Force create a new anonymous user for joining
    const user = await createNewAnonymousUser();
    console.log('joinRoom - New User UID:', user.uid, 'Nickname:', nickname);
    const roomRef = doc(db, 'watchParties', roomId);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) {
      throw new Error('Room not found');
    }
    console.log('Room data before join:', snap.data());
    await updateDoc(roomRef, {
      [`participants.${user.uid}`]: { joinedAt: serverTimestamp(), nickname }
    });
    console.log('Successfully joined room as participant');
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

export const updatePlaybackState = async (roomId, { isPlaying, currentTime }) => {
  const roomRef = doc(db, 'watchParties', roomId);
  await updateDoc(roomRef, {
    'playbackState.isPlaying': isPlaying,
    'playbackState.currentTime': currentTime,
    'playbackState.lastSyncTime': serverTimestamp()
  });
};

export const seekTo = async (roomId, currentTime) => {
  const roomRef = doc(db, 'watchParties', roomId);
  await updateDoc(roomRef, {
    'playbackState.currentTime': currentTime,
    'playbackState.lastSyncTime': serverTimestamp()
  });
};

export const sendMessage = async (roomId, text) => {
  const user = await ensureAnonymousAuth();
  const messagesRef = collection(db, 'watchParties', roomId, 'messages');
  await addDoc(messagesRef, {
    uid: user.uid,
    text,
    createdAt: serverTimestamp(),
    type: 'user'
  });
};

export const sendSystemMessage = async (roomId, text) => {
  const messagesRef = collection(db, 'watchParties', roomId, 'messages');
  await addDoc(messagesRef, {
    text,
    createdAt: serverTimestamp(),
    type: 'system'
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


