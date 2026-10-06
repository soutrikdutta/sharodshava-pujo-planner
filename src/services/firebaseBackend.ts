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

// Multi-device UID aliases linking Google sub IDs <-> Firebase Auth UIDs
const KNOWN_UID_ALIASES: Record<string, string[]> = {
  '100706602503033180208': ['PYNmwAz7YbTwZvslooDeZLNluQD2'],
  'PYNmwAz7YbTwZvslooDeZLNluQD2': ['100706602503033180208'],
  '112352330910615785622': ['mA36I31MRTgddd2ykiXH0b5vlp72'],
  'mA36I31MRTgddd2ykiXH0b5vlp72': ['112352330910615785622']
};

export function getEquivalentUids(uid: string): string[] {
  const aliases = KNOWN_UID_ALIASES[uid] || [];
  return Array.from(new Set([uid, ...aliases]));
}

// Helper: All deterministic Chat IDs across any potential alias UIDs
export function getAllDeterministicChatIds(uid1: string, uid2: string): string[] {
  const uids1 = getEquivalentUids(uid1);
  const uids2 = getEquivalentUids(uid2);
  const set = new Set<string>();
  for (const u1 of uids1) {
    for (const u2 of uids2) {
      if (u1 !== u2) {
        set.add([u1, u2].sort().join('__'));
      }
    }
  }
  if (set.size === 0) {
    set.add([uid1, uid2].sort().join('__'));
  }
  return Array.from(set);
}

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
 * Helper: Resolve a user's authentic last updated location.
 * If never shared or if it's the old dummy default 'Maddox Square', returns 'No location found'.
 */
export function resolveUserLocation(data: Partial<UserProfile>): { location: string; isKnown: boolean; sector?: string } {
  // Check if user has explicitly picked/visited a pandal
  // Ignore legacy hardcoded default 'Maddox Square' unless user actually has it in their activeRoute
  const isLegacyMaddox = data.currentPandal === 'Maddox Square' && (!data.activeRoute || !data.activeRoute.includes('Maddox Square'));

  if (data.currentPandal && !isLegacyMaddox && data.currentPandal !== 'No location found') {
    return {
      location: data.currentPandal,
      isKnown: true,
      sector: data.sector && data.sector !== 'Ballygunge / Gariahat' ? data.sector : undefined
    };
  }

  // Check if they shared locality from GPS (and not dummy default)
  if (data.locality && data.locality !== 'Kolkata' && data.locality !== 'Ballygunge / Gariahat') {
    return {
      location: data.locality,
      isKnown: true,
      sector: data.sector && data.sector !== 'Ballygunge / Gariahat' ? data.sector : undefined
    };
  }

  // Check if they have an active route with at least 1 pandal
  if (data.activeRoute && data.activeRoute.length > 0) {
    return {
      location: data.activeRoute[0],
      isKnown: true,
      sector: data.sector && data.sector !== 'Ballygunge / Gariahat' ? data.sector : undefined
    };
  }

  // Check if they have coordinates
  if (data.coordinates && typeof data.coordinates.lat === 'number') {
    return {
      location: data.locality || `${data.coordinates.lat.toFixed(2)}°N, ${data.coordinates.lng.toFixed(2)}°E`,
      isKnown: true,
      sector: data.sector && data.sector !== 'Ballygunge / Gariahat' ? data.sector : undefined
    };
  }

  // User has never shared their location
  return {
    location: 'No location found',
    isKnown: false,
    sector: undefined
  };
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
    sector: profileData?.sector,
    currentPandal: profileData?.currentPandal,
    locality: profileData?.locality,
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
  onUpdate: (users: FriendProfile[]) => void,
  currentUserEmail?: string | null
): Unsubscribe {
  const isSelf = (uid: string, email?: string) => {
    if (uid === currentUserId) return true;
    if (currentUserEmail && email && email.toLowerCase() === currentUserEmail.toLowerCase()) return true;
    return false;
  };

  const refreshFromLocal = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USERS);
      const usersMap: Record<string, UserProfile> = raw ? JSON.parse(raw) : {};
      const list: FriendProfile[] = Object.values(usersMap)
        .filter(u => !isSelf(u.uid, u.email) && !u.uid.startsWith('demo-') && !u.uid.startsWith('sim-'))
        .map(u => {
          const loc = resolveUserLocation(u);
          return {
            id: u.uid,
            name: u.displayName,
            avatar: u.photoURL || `https://lh3.googleusercontent.com/a/default-user`,
            zone: u.zone || 'south',
            sector: loc.sector || '',
            currentPandal: loc.location,
            routeTitle: `${u.displayName}'s Pujo Squad`,
            pandalCount: u.activeRoute?.length || 0,
            status: loc.isKnown ? 'at-pandal' : 'active',
            lastSeen: 'Active on Sharodshav',
            mutualFriends: 0,
            activeRoute: u.activeRoute || [],
            coordinates: u.coordinates,
            locality: u.locality,
            email: u.email
          };
        });
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
          if (!isSelf(data.uid, data.email) && !isSelf(docSnap.id, data.email)) {
            const loc = resolveUserLocation(data);
            usersList.push({
              id: data.uid || docSnap.id,
              name: data.displayName,
              avatar: data.photoURL || `https://lh3.googleusercontent.com/a/default-user`,
              zone: data.zone || 'south',
              sector: loc.sector || '',
              currentPandal: loc.location,
              routeTitle: `${data.displayName}'s Pujo Squad`,
              pandalCount: data.activeRoute?.length || 0,
              status: loc.isKnown ? 'at-pandal' : 'active',
              lastSeen: 'Active on Sharodshav',
              mutualFriends: 0,
              activeRoute: data.activeRoute || [],
              coordinates: data.coordinates,
              locality: data.locality,
              email: data.email
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

          // Strictly ignore any self-requests
          if (d.fromUserId === d.toUserId) return;

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
  // CRITICAL GUARD: Prevent sending request to oneself
  if (
    fromUser.uid === toFriend.id ||
    (fromUser.email && toFriend.email && fromUser.email.toLowerCase() === toFriend.email.toLowerCase())
  ) {
    console.warn('[FirebaseBackend] Blocked attempt to send friend request to oneself!');
    throw new Error('You cannot send a friend request to your own account.');
  }

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
 * 9. Real-Time Chat Message Subscription (Multi-Device & Cross-Alias Sync)
 */
export function subscribeToChatMessages(
  chatId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  currentUserId?: string,
  friendId?: string
): Unsubscribe {
  const parts = chatId.split('__');
  const uid1 = currentUserId || parts[0] || '';
  const uid2 = friendId || parts[1] || '';
  const allCandidateChatIds = getAllDeterministicChatIds(uid1, uid2);
  if (!allCandidateChatIds.includes(chatId)) {
    allCandidateChatIds.unshift(chatId);
  }

  // Multi-chat aggregated message map
  const chatMessagesMap = new Map<string, ChatMessage>();

  const mergeAndEmit = () => {
    const list = Array.from(chatMessagesMap.values()).sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      if (timeA && timeB) return timeA - timeB;
      return a.timestamp.localeCompare(b.timestamp);
    });

    // Save to primary local cache
    try {
      localStorage.setItem(STORAGE_KEY_CHATS_PREFIX + chatId, JSON.stringify(list));
    } catch { /* ignore */ }

    onUpdate(list);
  };

  const refreshFromLocal = () => {
    allCandidateChatIds.forEach(cid => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_CHATS_PREFIX + cid);
        if (raw) {
          const msgs: ChatMessage[] = JSON.parse(raw);
          msgs.forEach(m => {
            const key = m.id || `${m.senderId}_${m.text}_${m.timestamp}`;
            chatMessagesMap.set(key, m);
          });
        }
      } catch { /* ignore */ }
    });
    mergeAndEmit();
  };

  refreshFromLocal();

  const handleChatEvent = (e: any) => {
    if (!e.detail || allCandidateChatIds.includes(e.detail.chatId)) {
      refreshFromLocal();
    }
  };
  window.addEventListener('pujo_chats_updated', handleChatEvent as EventListener);

  const unsubs: (() => void)[] = [];

  if (db && isFirestoreAvailable) {
    allCandidateChatIds.forEach(cid => {
      try {
        const messagesRef = collection(db, 'chats', cid, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsub = onSnapshot(q, (snapshot) => {
          snapshot.forEach((dSnap) => {
            const d = dSnap.data();
            const msg: ChatMessage = {
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
            };
            const key = dSnap.id || `${d.senderId}_${d.text}_${d.timestamp}`;
            chatMessagesMap.set(key, msg);
          });

          mergeAndEmit();
        }, (err) => {
          console.warn('[FirebaseBackend] Chat listener error for', cid, err);
        });

        unsubs.push(unsub);
      } catch (err) {
        console.warn('[FirebaseBackend] Setup listener error for', cid, err);
      }
    });
  }

  return () => {
    unsubs.forEach(u => u());
    window.removeEventListener('pujo_chats_updated', handleChatEvent as EventListener);
  };
}

/**
 * 10. Send Direct Chat Message to Cloud Firestore
 * Explicitly associates the message with senderUser.uid and mirrors across aliases
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

  const parts = chatId.split('__');
  const allChatIds = getAllDeterministicChatIds(parts[0] || senderUser.uid, parts[1] || friendId);
  if (!allChatIds.includes(chatId)) allChatIds.push(chatId);

  // Local storage isolated cache update
  allChatIds.forEach(cid => {
    const localChatKey = STORAGE_KEY_CHATS_PREFIX + cid;
    try {
      const raw = localStorage.getItem(localChatKey);
      const msgs: ChatMessage[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(localChatKey, JSON.stringify([...msgs, { ...newMsg, chatId: cid }]));
    } catch { /* ignore */ }
  });
  window.dispatchEvent(new CustomEvent('pujo_chats_updated', { detail: { chatId } }));

  // Cloud Firestore add document across all target IDs
  if (db && isFirestoreAvailable) {
    for (const cid of allChatIds) {
      try {
        const [p1, p2] = cid.split('__');
        if (p1 && p2) {
          await setDoc(doc(db, 'chats', cid), {
            participants: [p1, p2],
            lastMessage: text.trim(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

        const messagesRef = collection(db, 'chats', cid, 'messages');
        await setDoc(doc(messagesRef, newMsg.id), {
          chatId: cid,
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
        console.warn('[FirebaseBackend] Firestore send chat message for', cid, err);
      }
    }
  }

  return newMsg;
}

/**
 * 11. Pandal Suggestions System
 * Saves user-suggested pandals to Cloud Firestore and forwards to Google Docs via Apps Script
 */
export interface PandalSuggestion {
  id?: string;
  zone: 'north' | 'central' | 'south';
  zoneLabel: string;
  pandalName: string;
  locality?: string;
  description?: string;
  submittedByName?: string;
  submittedByEmail?: string;
  submittedByUid?: string;
  timestamp: string;
}

export async function submitPandalSuggestionToDb(suggestion: PandalSuggestion): Promise<{ success: boolean; id: string }> {
  const id = `sug-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const record = {
    ...suggestion,
    id,
    createdAt: serverTimestamp ? serverTimestamp() : new Date().toISOString()
  };

  // 1. Save to local storage for quick offline access
  try {
    const raw = localStorage.getItem('pujo_pandal_suggestions');
    const list = raw ? JSON.parse(raw) : [];
    localStorage.setItem('pujo_pandal_suggestions', JSON.stringify([record, ...list]));
  } catch { /* ignore */ }

  // 2. Save to Firestore collection 'pandal_suggestions'
  if (db && isFirestoreAvailable) {
    try {
      await setDoc(doc(db, 'pandal_suggestions', id), record);
    } catch (err) {
      console.warn('[FirebaseBackend] Firestore suggestion error:', err);
    }
  }

  // 3. Forward to Google Docs / Google Apps Script Webhook if configured
  const webhookUrl = (import.meta as any).env?.VITE_GOOGLE_DOCS_WEBHOOK_URL || localStorage.getItem('pujo_docs_webhook_url');
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
    } catch (err) {
      console.warn('[FirebaseBackend] Google Docs Webhook error:', err);
    }
  }

  return { success: true, id };
}
