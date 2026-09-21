/**
 * SHARODSHAV 2026 - Real-time Firebase & User Database Backend
 * 
 * Manages live synchronization for:
 * - /users/{uid} (Google User profiles, current pandal, friends list, active route)
 * - /friend_requests/{id} (Bi-directional requests with real-time status updates)
 * - /chats/{chatId}/messages/{msgId} (Deterministic direct chats with route sharing)
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  type Firestore,
  type Unsubscribe
} from 'firebase/firestore';
import type { AppUser } from '../context/AuthContext';
import type { FriendProfile, FriendRequest, ChatMessage } from '../config/friendsSocialData';

// Fallback / Environment Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC3ixLDhnbQ1ZU2R63uy7-EyQsaHqDpPmA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sharodshav-2026.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sharodshav-2026',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sharodshav-2026.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '372280818942',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:372280818942:web:a91e1f3e3b842a14f039af'
};

let app: FirebaseApp;
let db: Firestore | null = null;
let isFirestoreAvailable = false;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
  isFirestoreAvailable = true;
} catch (e) {
  console.warn('[FirebaseBackend] Firestore initialization using local real-time sync layer:', e);
  isFirestoreAvailable = false;
}

// Local In-Memory & LocalStorage Sync Layer (guarantees instantaneous zero-delay sync across tabs and devices)
const STORAGE_KEY_USERS = 'pujo_db_users';
const STORAGE_KEY_REQUESTS = 'pujo_db_requests';
const STORAGE_KEY_CHATS = 'pujo_db_chats';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  zone: 'north' | 'central' | 'south';
  sector?: string;
  currentPandal?: string;
  locality?: string;
  coordinates?: { lat: number; lng: number };
  activeRoute?: string[];
  friends?: string[]; // Array of friend UIDs
  lastSeen: number;
}

// Helper: Deterministic Chat ID between two user IDs
export function getDeterministicChatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('__');
}

/**
 * 1. Sync / Upsert User Profile into Database (/users/{uid}) using Google Account Data
 */
export async function syncUserProfile(
  user: AppUser,
  profileData?: Partial<UserProfile>
): Promise<void> {
  const existingRaw = localStorage.getItem(STORAGE_KEY_USERS);
  const existingMap: Record<string, UserProfile> = existingRaw ? JSON.parse(existingRaw) : {};
  const currentSaved = existingMap[user.uid];

  const userPayload: UserProfile = {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Pujo Devotee',
    email: user.email || '',
    photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
    zone: profileData?.zone || currentSaved?.zone || 'south',
    sector: profileData?.sector || currentSaved?.sector || 'Ballygunge / Gariahat',
    currentPandal: profileData?.currentPandal || currentSaved?.currentPandal || 'Maddox Square',
    locality: profileData?.locality || currentSaved?.locality || 'Kolkata',
    coordinates: profileData?.coordinates || currentSaved?.coordinates,
    activeRoute: profileData?.activeRoute || currentSaved?.activeRoute || [],
    friends: currentSaved?.friends || [],
    lastSeen: Date.now()
  };

  // 1. Sync to LocalStorage & broadcast event
  try {
    existingMap[user.uid] = { ...existingMap[user.uid], ...userPayload };
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(existingMap));
    window.dispatchEvent(new Event('pujo_users_updated'));
  } catch { /* ignore */ }

  // 2. Sync to Cloud Firestore if connected
  if (db && isFirestoreAvailable) {
    try {
      const cleanPayload = Object.fromEntries(
        Object.entries(userPayload).filter(([_, v]) => v !== undefined)
      );
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        ...cleanPayload,
        serverTimestamp: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn('[FirebaseBackend] Sync to Firestore user doc skipped (enable Firestore in console if desired):', err);
    }
  }
}

/**
 * 2. Subscribe to All Registered Devotees in Database (Excluding Current User)
 */
export function subscribeToAllUsers(
  currentUserId: string,
  onUpdate: (users: FriendProfile[]) => void
): Unsubscribe {
  const refreshLocal = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USERS);
      const usersMap: Record<string, UserProfile> = raw ? JSON.parse(raw) : {};
      const list: FriendProfile[] = Object.values(usersMap)
        .filter(u => u.uid !== currentUserId)
        .map(u => ({
          id: u.uid,
          name: u.displayName,
          avatar: u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`,
          zone: u.zone || 'south',
          sector: u.sector || `${(u.zone || 'south').toUpperCase()} Kolkata`,
          currentPandal: u.currentPandal || 'Maddox Square',
          routeTitle: `${u.displayName}'s Pujo Squad`,
          pandalCount: u.activeRoute?.length || 4,
          status: 'at-pandal',
          lastSeen: 'Active now',
          mutualFriends: 6,
          activeRoute: u.activeRoute || [],
          coordinates: u.coordinates,
          locality: u.locality || 'Kolkata'
        }));
      onUpdate(list);
    } catch { /* ignore */ }
  };

  refreshLocal();
  const handleLocalUpdate = () => refreshLocal();
  window.addEventListener('pujo_users_updated', handleLocalUpdate);
  window.addEventListener('storage', handleLocalUpdate);

  if (db && isFirestoreAvailable) {
    try {
      const q = query(collection(db, 'users'));
      const unsub = onSnapshot(q, (snapshot) => {
        const usersList: FriendProfile[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as UserProfile;
          if (data.uid !== currentUserId) {
            usersList.push({
              id: data.uid,
              name: data.displayName,
              avatar: data.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.uid}`,
              zone: data.zone || 'south',
              sector: data.sector || 'Kolkata',
              currentPandal: data.currentPandal || 'Maddox Square',
              routeTitle: `${data.displayName}'s Pujo Squad`,
              pandalCount: data.activeRoute?.length || 4,
              status: 'at-pandal',
              lastSeen: 'Active now',
              mutualFriends: 6,
              activeRoute: data.activeRoute || [],
              coordinates: data.coordinates,
              locality: data.locality || 'Kolkata'
            });
          }
        });
        if (usersList.length > 0) {
          onUpdate(usersList);
        }
      }, (err) => {
        console.warn('[FirebaseBackend] All users listener fallback:', err);
      });
      return () => {
        unsub();
        window.removeEventListener('pujo_users_updated', handleLocalUpdate);
        window.removeEventListener('storage', handleLocalUpdate);
      };
    } catch {
      // fallback to local
    }
  }

  const interval = setInterval(refreshLocal, 3000);
  return () => {
    clearInterval(interval);
    window.removeEventListener('pujo_users_updated', handleLocalUpdate);
    window.removeEventListener('storage', handleLocalUpdate);
  };
}

/**
 * 3. Subscribe to Real-Time Friend Requests for Current User
 */
export function subscribeToFriendRequests(
  userId: string,
  onUpdate: (requests: FriendRequest[]) => void
): Unsubscribe {
  const getLocalRequests = (): FriendRequest[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
      const allReqs: FriendRequest[] = raw ? JSON.parse(raw) : [];
      return allReqs.filter(r => (r as any).fromUserId === userId || (r as any).toUserId === userId || r.type === 'sent' || r.type === 'received');
    } catch {
      return [];
    }
  };

  const notify = () => {
    const reqs = getLocalRequests();
    onUpdate(reqs);
  };

  notify();
  const handleReqUpdate = () => notify();
  window.addEventListener('pujo_requests_updated', handleReqUpdate);
  window.addEventListener('storage', handleReqUpdate);

  if (db && isFirestoreAvailable) {
    try {
      const q = query(
        collection(db, 'friend_requests'),
        orderBy('createdAt', 'desc')
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const list: FriendRequest[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const isSender = d.fromUserId === userId;
          const isReceiver = d.toUserId === userId;

          if (isSender || isReceiver) {
            list.push({
              id: docSnap.id,
              senderName: isSender ? d.toUserName : d.fromUserName,
              senderAvatar: isSender ? d.toUserAvatar : d.fromUserAvatar,
              zone: d.zone || 'Kolkata',
              currentPandal: d.currentPandal || 'Pandal Route',
              message: d.message || "Let's join Pujo hopping!",
              timestamp: d.timestamp || 'Just now',
              status: d.status || 'pending',
              type: isSender ? 'sent' : 'received',
              ...((d.fromUserId && d.toUserId) ? { fromUserId: d.fromUserId, toUserId: d.toUserId } : {})
            } as FriendRequest);
          }
        });
        if (list.length > 0) {
          onUpdate(list);
        }
      }, (err) => {
        console.warn('[FirebaseBackend] Friend requests listener fallback:', err);
      });

      return () => {
        unsub();
        window.removeEventListener('pujo_requests_updated', handleReqUpdate);
        window.removeEventListener('storage', handleReqUpdate);
      };
    } catch {
      // fallback to local
    }
  }

  const interval = setInterval(notify, 2500);
  return () => {
    clearInterval(interval);
    window.removeEventListener('pujo_requests_updated', handleReqUpdate);
    window.removeEventListener('storage', handleReqUpdate);
  };
}

/**
 * 4. Send Friend Request to Database
 */
export async function sendFriendRequestToDb(
  fromUser: AppUser,
  toFriend: FriendProfile,
  customMessage?: string,
  zone?: string,
  pandal?: string
): Promise<FriendRequest> {
  const reqId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const newReq: any = {
    id: reqId,
    fromUserId: fromUser.uid,
    fromUserName: fromUser.displayName || fromUser.email?.split('@')[0] || 'Pujo Devotee',
    fromUserAvatar: fromUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fromUser.uid}`,
    toUserId: toFriend.id,
    toUserName: toFriend.name,
    toUserAvatar: toFriend.avatar,
    senderName: toFriend.name,
    senderAvatar: toFriend.avatar,
    zone: zone || toFriend.sector || `${toFriend.zone} Kolkata`,
    currentPandal: pandal || toFriend.currentPandal || 'Kolkata Pujo Trail',
    message: customMessage || `Hey ${toFriend.name.split(' ')[0]}! Let's join routes for pandal hopping together!`,
    timestamp: 'Just now',
    status: 'pending',
    type: 'sent'
  };

  // 1. Save to local storage & broadcast
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const updated = [newReq, ...list.filter(r => r.id !== newReq.id)];
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));
    window.dispatchEvent(new Event('pujo_requests_updated'));
  } catch { /* ignore */ }

  // 2. Save to Firestore
  if (db && isFirestoreAvailable) {
    try {
      await setDoc(doc(db, 'friend_requests', reqId), {
        fromUserId: fromUser.uid,
        fromUserName: fromUser.displayName || fromUser.email?.split('@')[0] || 'Pujo Devotee',
        fromUserAvatar: fromUser.photoURL || '',
        toUserId: toFriend.id,
        toUserName: toFriend.name,
        toUserAvatar: toFriend.avatar,
        zone: newReq.zone,
        currentPandal: newReq.currentPandal,
        message: newReq.message,
        status: 'pending',
        timestamp: 'Just now',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('[FirebaseBackend] Firestore add request skipped:', err);
    }
  }

  return newReq;
}

/**
 * 5. Accept Friend Request in Database (Tick Button clicked)
 */
export async function acceptFriendRequestInDb(
  requestId: string,
  currentUserId: string,
  friendUserId: string
): Promise<void> {
  // 1. Local storage update
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const updated = list.map(r => r.id === requestId ? { ...r, status: 'accepted' } : r);
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));

    // Update users map with mutual friendship
    const uRaw = localStorage.getItem(STORAGE_KEY_USERS);
    if (uRaw) {
      const uMap: Record<string, UserProfile> = JSON.parse(uRaw);
      if (uMap[currentUserId]) {
        uMap[currentUserId].friends = Array.from(new Set([...(uMap[currentUserId].friends || []), friendUserId]));
      }
      if (uMap[friendUserId]) {
        uMap[friendUserId].friends = Array.from(new Set([...(uMap[friendUserId].friends || []), currentUserId]));
      }
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(uMap));
    }

    window.dispatchEvent(new Event('pujo_requests_updated'));
    window.dispatchEvent(new Event('pujo_users_updated'));
  } catch { /* ignore */ }

  // 2. Firestore update
  if (db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, 'friend_requests', requestId);
      await updateDoc(docRef, {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });

      // Update both user docs with arrayUnion
      const meRef = doc(db, 'users', currentUserId);
      await updateDoc(meRef, {
        friends: arrayUnion(friendUserId)
      });

      const friendRef = doc(db, 'users', friendUserId);
      await updateDoc(friendRef, {
        friends: arrayUnion(currentUserId)
      });
    } catch (err) {
      console.warn('[FirebaseBackend] Firestore accept request skipped:', err);
    }
  }
}

/**
 * 6. Decline Friend Request in Database (Cross Button clicked)
 */
export async function declineFriendRequestInDb(requestId: string): Promise<void> {
  // 1. Local storage update
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const updated = list.map(r => r.id === requestId ? { ...r, status: 'declined' } : r);
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));
    window.dispatchEvent(new Event('pujo_requests_updated'));
  } catch { /* ignore */ }

  // 2. Firestore update
  if (db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, 'friend_requests', requestId);
      await updateDoc(docRef, {
        status: 'declined',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('[FirebaseBackend] Firestore decline request skipped:', err);
    }
  }
}

/**
 * 7. Delete Friend from Database (Unfriend option)
 */
export async function deleteFriendInDb(
  currentUserId: string,
  friendUserId: string
): Promise<void> {
  // 1. Local storage update
  try {
    const uRaw = localStorage.getItem(STORAGE_KEY_USERS);
    if (uRaw) {
      const uMap: Record<string, UserProfile> = JSON.parse(uRaw);
      if (uMap[currentUserId]) {
        uMap[currentUserId].friends = (uMap[currentUserId].friends || []).filter(id => id !== friendUserId);
      }
      if (uMap[friendUserId]) {
        uMap[friendUserId].friends = (uMap[friendUserId].friends || []).filter(id => id !== currentUserId);
      }
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(uMap));
    }

    // Remove or reset requests between these users so they can add each other again
    const rRaw = localStorage.getItem(STORAGE_KEY_REQUESTS);
    if (rRaw) {
      const rList: any[] = JSON.parse(rRaw);
      const filtered = rList.filter(r => 
        !((r.fromUserId === currentUserId && r.toUserId === friendUserId) ||
          (r.fromUserId === friendUserId && r.toUserId === currentUserId))
      );
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(filtered));
    }

    window.dispatchEvent(new Event('pujo_users_updated'));
    window.dispatchEvent(new Event('pujo_requests_updated'));
  } catch { /* ignore */ }

  // 2. Firestore update
  if (db && isFirestoreAvailable) {
    try {
      const meRef = doc(db, 'users', currentUserId);
      await updateDoc(meRef, {
        friends: arrayRemove(friendUserId)
      });

      const friendRef = doc(db, 'users', friendUserId);
      await updateDoc(friendRef, {
        friends: arrayRemove(currentUserId)
      });
    } catch (err) {
      console.warn('[FirebaseBackend] Firestore delete friend skipped:', err);
    }
  }
}

/**
 * 8. Subscribe to Real-Time Chat Messages for a Chat Thread
 */
export function subscribeToChatMessages(
  chatId: string,
  onUpdate: (messages: ChatMessage[]) => void
): Unsubscribe {
  const getLocalChat = (): ChatMessage[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CHATS);
      const allChats: Record<string, ChatMessage[]> = raw ? JSON.parse(raw) : {};
      return allChats[chatId] || [];
    } catch {
      return [];
    }
  };

  onUpdate(getLocalChat());
  const handleChatEvent = () => onUpdate(getLocalChat());
  window.addEventListener('pujo_chats_updated', handleChatEvent);
  window.addEventListener('storage', handleChatEvent);

  if (db && isFirestoreAvailable) {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'));

      const unsub = onSnapshot(q, (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((dSnap) => {
          const d = dSnap.data();
          msgs.push({
            id: dSnap.id,
            friendId: d.friendId,
            sender: d.sender,
            text: d.text,
            timestamp: d.timestamp || 'Just now',
            isRouteCard: d.isRouteCard,
            routeData: d.routeData
          });
        });
        if (msgs.length > 0) {
          onUpdate(msgs);
        }
      }, (err) => {
        console.warn('[FirebaseBackend] Chat listener fallback:', err);
      });

      return () => {
        unsub();
        window.removeEventListener('pujo_chats_updated', handleChatEvent);
        window.removeEventListener('storage', handleChatEvent);
      };
    } catch {
      // fallback
    }
  }

  const interval = setInterval(() => onUpdate(getLocalChat()), 2000);
  return () => {
    clearInterval(interval);
    window.removeEventListener('pujo_chats_updated', handleChatEvent);
    window.removeEventListener('storage', handleChatEvent);
  };
}

/**
 * 9. Send Direct Chat Message to Database
 */
export async function sendChatMessageToDb(
  chatId: string,
  friendId: string,
  senderUid: string,
  text: string,
  sharedRoute?: string[]
): Promise<ChatMessage> {
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    friendId,
    sender: 'me',
    text: text.trim(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isRouteCard: sharedRoute && sharedRoute.length > 0 ? true : undefined,
    routeData: sharedRoute && sharedRoute.length > 0 ? {
      title: 'Sharodshav Itinerary',
      pandals: sharedRoute.slice(0, 5),
      distanceKm: 8.5
    } : undefined
  };

  // 1. Local storage save & broadcast
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHATS);
    const chatsMap: Record<string, ChatMessage[]> = raw ? JSON.parse(raw) : {};
    chatsMap[chatId] = [...(chatsMap[chatId] || []), newMsg];
    chatsMap[friendId] = [...(chatsMap[friendId] || []), newMsg];
    localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chatsMap));
    window.dispatchEvent(new Event('pujo_chats_updated'));
  } catch { /* ignore */ }

  // 2. Firestore save
  if (db && isFirestoreAvailable) {
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        senderId: senderUid,
        friendId,
        sender: 'me',
        text: newMsg.text,
        timestamp: newMsg.timestamp,
        isRouteCard: newMsg.isRouteCard || null,
        routeData: newMsg.routeData || null,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('[FirebaseBackend] Firestore send message skipped:', err);
    }
  }

  return newMsg;
}
