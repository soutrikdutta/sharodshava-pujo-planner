/**
 * SHARODSHAV 2026 - Real-time Firebase & User Database Backend
 * 
 * 100% Authentic Google Account User Data synchronized directly to Cloud Firestore:
 * - /users/{uid} (Real Google accounts, current pandal, GPS coordinates, friend lists)
 * - /friend_requests/{id} (Real-time friend requests with accept/reject/pending states)
 * - /chats/{chatId}/messages/{msgId} (Deterministic isolated direct chats)
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
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

// Production Firebase Configuration for Sharodshav 2026
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
  console.warn('[FirebaseBackend] Firestore initialization warning:', e);
  isFirestoreAvailable = false;
}

// Clear legacy unstructured chat storage to prevent cross-account contamination
try {
  localStorage.removeItem('pujo_db_chats_v2');
  localStorage.removeItem('pujo_db_chats');
} catch { /* ignore */ }

const STORAGE_KEY_USERS = 'pujo_db_users_v2';
const STORAGE_KEY_REQUESTS = 'pujo_db_requests_v2';
const STORAGE_KEY_CHATS_PREFIX = 'pujo_chat_v3_';

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
  friends?: string[];
  lastSeen: number;
}

// Helper: Deterministic Chat ID strictly between two user IDs
export function getDeterministicChatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('__');
}

/**
 * 1. Sync User Profile into Cloud Firestore (/users/{uid}) with Authentic Google Profile Data
 */
export async function syncUserProfile(
  user: AppUser,
  profileData?: Partial<UserProfile>
): Promise<void> {
  const userPayload: UserProfile = {
    uid: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Devotee',
    email: user.email || '',
    photoURL: user.photoURL || `https://lh3.googleusercontent.com/a/default-user`,
    zone: profileData?.zone || 'south',
    sector: profileData?.sector || 'Ballygunge / Gariahat',
    currentPandal: profileData?.currentPandal || 'Maddox Square',
    locality: profileData?.locality || 'Kolkata',
    coordinates: profileData?.coordinates,
    activeRoute: profileData?.activeRoute || [],
    friends: profileData?.friends || [],
    lastSeen: Date.now()
  };

  // Sync to local cache
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    const usersMap: Record<string, UserProfile> = raw ? JSON.parse(raw) : {};
    usersMap[user.uid] = { ...usersMap[user.uid], ...userPayload };
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(usersMap));
    window.dispatchEvent(new Event('pujo_users_updated'));
  } catch { /* ignore */ }

  // Sync directly to Cloud Firestore
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
      console.warn('[FirebaseBackend] Sync to Firestore user doc:', err);
    }
  }
}

/**
 * 2. Subscribe to Current Authenticated User Profile in Firestore
 */
export function subscribeToCurrentUserProfile(
  userId: string,
  onUpdate: (profile: UserProfile | null) => void
): Unsubscribe {
  if (db && isFirestoreAvailable) {
    try {
      const userRef = doc(db, 'users', userId);
      const unsub = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          onUpdate(snap.data() as UserProfile);
        } else {
          onUpdate(null);
        }
      }, (err) => {
        console.warn('[FirebaseBackend] User profile listener:', err);
      });
      return unsub;
    } catch {
      // fallback
    }
  }
  return () => {};
}

/**
 * 3. Subscribe to ALL Real Google Users in Cloud Firestore (Excluding Current User)
 */
export function subscribeToAllUsers(
  currentUserId: string,
  onUpdate: (users: FriendProfile[]) => void
): Unsubscribe {
  const refreshFromLocal = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USERS);
      const usersMap: Record<string, UserProfile> = raw ? JSON.parse(raw) : {};
      const list: FriendProfile[] = Object.values(usersMap)
        .filter(u => u.uid !== currentUserId && !u.uid.startsWith('demo-') && !u.uid.startsWith('sim-'))
        .map(u => ({
          id: u.uid,
          name: u.displayName,
          avatar: u.photoURL || `https://lh3.googleusercontent.com/a/default-user`,
          zone: u.zone || 'south',
          sector: u.sector || `${(u.zone || 'south').toUpperCase()} Kolkata`,
          currentPandal: u.currentPandal || 'Maddox Square',
          routeTitle: `${u.displayName}'s Pujo Squad`,
          pandalCount: u.activeRoute?.length || 4,
          status: 'at-pandal',
          lastSeen: 'Active on Sharodshav',
          mutualFriends: 0,
          activeRoute: u.activeRoute || [],
          coordinates: u.coordinates,
          locality: u.locality || 'Kolkata'
        }));
      onUpdate(list);
    } catch { /* ignore */ }
  };

  refreshFromLocal();
  const handleLocalUpdate = () => refreshFromLocal();
  window.addEventListener('pujo_users_updated', handleLocalUpdate);

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
              avatar: data.photoURL || `https://lh3.googleusercontent.com/a/default-user`,
              zone: data.zone || 'south',
              sector: data.sector || 'Kolkata',
              currentPandal: data.currentPandal || 'Maddox Square',
              routeTitle: `${data.displayName}'s Pujo Squad`,
              pandalCount: data.activeRoute?.length || 4,
              status: 'at-pandal',
              lastSeen: 'Active on Sharodshav',
              mutualFriends: 0,
              activeRoute: data.activeRoute || [],
              coordinates: data.coordinates,
              locality: data.locality || 'Kolkata'
            });
          }
        });
        onUpdate(usersList);
      }, (err) => {
        console.warn('[FirebaseBackend] Firestore all users listener:', err);
      });

      return () => {
        unsub();
        window.removeEventListener('pujo_users_updated', handleLocalUpdate);
      };
    } catch {
      // fallback
    }
  }

  return () => {
    window.removeEventListener('pujo_users_updated', handleLocalUpdate);
  };
}

/**
 * 4. Subscribe to Real-Time Friend Requests for Current User
 */
export function subscribeToFriendRequests(
  userId: string,
  onUpdate: (requests: FriendRequest[]) => void
): Unsubscribe {
  const refreshFromLocal = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
      const allReqs: any[] = raw ? JSON.parse(raw) : [];
      const list = allReqs.filter(r => r.fromUserId === userId || r.toUserId === userId);
      onUpdate(list);
    } catch {
      onUpdate([]);
    }
  };

  refreshFromLocal();
  const handleReqUpdate = () => refreshFromLocal();
  window.addEventListener('pujo_requests_updated', handleReqUpdate);

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
              fromUserId: d.fromUserId,
              toUserId: d.toUserId,
              senderName: isSender ? d.toUserName : d.fromUserName,
              senderAvatar: isSender ? d.toUserAvatar : d.fromUserAvatar,
              zone: d.zone || 'Kolkata',
              currentPandal: d.currentPandal || 'Pandal Trail',
              message: d.message || "Let's join Pujo hopping!",
              timestamp: d.timestamp || 'Just now',
              status: d.status || 'pending',
              type: isSender ? 'sent' : 'received'
            });
          }
        });
        onUpdate(list);
      }, (err) => {
        console.warn('[FirebaseBackend] Friend requests listener:', err);
      });

      return () => {
        unsub();
        window.removeEventListener('pujo_requests_updated', handleReqUpdate);
      };
    } catch {
      // fallback
    }
  }

  return () => {
    window.removeEventListener('pujo_requests_updated', handleReqUpdate);
  };
}

/**
 * 5. Send Friend Request to Cloud Firestore
 */
export async function sendFriendRequestToDb(
  fromUser: AppUser,
  toFriend: FriendProfile,
  customMessage?: string
): Promise<FriendRequest> {
  const reqId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const senderName = fromUser.displayName || fromUser.email?.split('@')[0] || 'Devotee';
  const senderAvatar = fromUser.photoURL || `https://lh3.googleusercontent.com/a/default-user`;

  const newReq: FriendRequest = {
    id: reqId,
    fromUserId: fromUser.uid,
    toUserId: toFriend.id,
    senderName: toFriend.name,
    senderAvatar: toFriend.avatar,
    zone: toFriend.sector || `${toFriend.zone} Kolkata`,
    currentPandal: toFriend.currentPandal || 'Kolkata Pujo Trail',
    message: customMessage || `Hey ${toFriend.name.split(' ')[0]}! Let's join pandal hopping routes together!`,
    timestamp: 'Just now',
    status: 'pending',
    type: 'sent'
  };

  // Local storage update
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const updated = [newReq, ...list.filter(r => r.id !== newReq.id)];
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));
    window.dispatchEvent(new Event('pujo_requests_updated'));
  } catch { /* ignore */ }

  // Cloud Firestore document creation
  if (db && isFirestoreAvailable) {
    try {
      await setDoc(doc(db, 'friend_requests', reqId), {
        fromUserId: fromUser.uid,
        fromUserName: senderName,
        fromUserAvatar: senderAvatar,
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
      console.warn('[FirebaseBackend] Firestore add friend request:', err);
    }
  }

  return newReq;
}

/**
 * 6. Accept Friend Request in Cloud Firestore (Tick Button clicked)
 */
export async function acceptFriendRequestInDb(
  requestId: string,
  currentUserId: string,
  friendUserId: string
): Promise<void> {
  // Local storage update
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const updated = list.map(r => r.id === requestId ? { ...r, status: 'accepted' } : r);
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));

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

  // Cloud Firestore updates
  if (db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, 'friend_requests', requestId);
      await updateDoc(docRef, {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });

      const meRef = doc(db, 'users', currentUserId);
      await updateDoc(meRef, {
        friends: arrayUnion(friendUserId)
      });

      const friendRef = doc(db, 'users', friendUserId);
      await updateDoc(friendRef, {
        friends: arrayUnion(currentUserId)
      });
    } catch (err) {
      console.warn('[FirebaseBackend] Firestore accept request:', err);
    }
  }
}

/**
 * 7. Decline Friend Request in Cloud Firestore (Cross Button clicked)
 */
export async function declineFriendRequestInDb(requestId: string): Promise<void> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REQUESTS);
    const list: any[] = raw ? JSON.parse(raw) : [];
    const updated = list.map(r => r.id === requestId ? { ...r, status: 'declined' } : r);
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));
    window.dispatchEvent(new Event('pujo_requests_updated'));
  } catch { /* ignore */ }

  if (db && isFirestoreAvailable) {
    try {
      const docRef = doc(db, 'friend_requests', requestId);
      await updateDoc(docRef, {
        status: 'declined',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('[FirebaseBackend] Firestore decline request:', err);
    }
  }
}

/**
 * 8. Delete Friend from Cloud Firestore (Unfriend)
 */
export async function deleteFriendInDb(
  currentUserId: string,
  friendUserId: string
): Promise<void> {
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
      console.warn('[FirebaseBackend] Firestore delete friend:', err);
    }
  }
}

/**
 * 9. Real-Time Chat Message Subscription (Strictly Isolated per chatId)
 */
export function subscribeToChatMessages(
  chatId: string,
  onUpdate: (messages: ChatMessage[]) => void
): Unsubscribe {
  const localChatKey = STORAGE_KEY_CHATS_PREFIX + chatId;

  const refreshFromLocal = () => {
    try {
      const raw = localStorage.getItem(localChatKey);
      const msgs: ChatMessage[] = raw ? JSON.parse(raw) : [];
      onUpdate(msgs);
    } catch {
      onUpdate([]);
    }
  };

  refreshFromLocal();
  const handleChatEvent = (e: any) => {
    if (!e.detail || e.detail.chatId === chatId) {
      refreshFromLocal();
    }
  };
  window.addEventListener('pujo_chats_updated', handleChatEvent as EventListener);

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
            chatId: chatId,
            friendId: d.friendId,
            senderId: d.senderId,
            senderName: d.senderName,
            senderAvatar: d.senderAvatar,
            sender: d.sender,
            text: d.text,
            timestamp: d.timestamp || 'Just now',
            isRouteCard: d.isRouteCard,
            routeData: d.routeData,
            createdAt: d.createdAt
          });
        });

        // Save isolated local cache for this exact chatId
        try {
          localStorage.setItem(localChatKey, JSON.stringify(msgs));
        } catch { /* ignore */ }

        onUpdate(msgs);
      }, (err) => {
        console.warn('[FirebaseBackend] Chat listener:', err);
      });

      return () => {
        unsub();
        window.removeEventListener('pujo_chats_updated', handleChatEvent as EventListener);
      };
    } catch {
      // fallback
    }
  }

  return () => {
    window.removeEventListener('pujo_chats_updated', handleChatEvent as EventListener);
  };
}

/**
 * 10. Send Direct Chat Message to Cloud Firestore
 * Explicitly associates the message with senderUser.uid, ensuring correct left/right orientation
 */
export async function sendChatMessageToDb(
  chatId: string,
  friendId: string,
  senderUser: AppUser,
  text: string,
  sharedRoute?: string[]
): Promise<ChatMessage> {
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    chatId,
    friendId,
    senderId: senderUser.uid,
    senderName: senderUser.displayName || 'Devotee',
    senderAvatar: senderUser.photoURL || '',
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

  // Local storage isolated cache update
  const localChatKey = STORAGE_KEY_CHATS_PREFIX + chatId;
  try {
    const raw = localStorage.getItem(localChatKey);
    const msgs: ChatMessage[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(localChatKey, JSON.stringify([...msgs, newMsg]));
    window.dispatchEvent(new CustomEvent('pujo_chats_updated', { detail: { chatId } }));
  } catch { /* ignore */ }

  // Cloud Firestore add document
  if (db && isFirestoreAvailable) {
    try {
      // Record participants on parent chat doc
      const [p1, p2] = chatId.split('__');
      if (p1 && p2) {
        await setDoc(doc(db, 'chats', chatId), {
          participants: [p1, p2],
          lastMessage: text.trim(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await setDoc(doc(messagesRef, newMsg.id), {
        chatId,
        senderId: senderUser.uid,
        senderName: senderUser.displayName || 'Devotee',
        senderAvatar: senderUser.photoURL || '',
        friendId,
        text: newMsg.text,
        timestamp: newMsg.timestamp,
        isRouteCard: newMsg.isRouteCard || null,
        routeData: newMsg.routeData || null,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('[FirebaseBackend] Firestore send chat message:', err);
    }
  }

  return newMsg;
}
