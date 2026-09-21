import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  type FriendProfile,
  type FriendRequest,
  type ChatMessage
} from '../config/friendsSocialData';
import { useAuth } from './AuthContext';
import { useLocation } from './LocationContext';
import { 
  syncUserProfile, 
  subscribeToAllUsers, 
  subscribeToFriendRequests, 
  sendFriendRequestToDb, 
  acceptFriendRequestInDb,
  declineFriendRequestInDb,
  deleteFriendInDb,
  sendChatMessageToDb, 
  subscribeToChatMessages,
  getDeterministicChatId,
  type UserProfile
} from '../services/firebaseBackend';

interface SocialContextType {
  allUsers: FriendProfile[];
  friends: FriendProfile[];
  requests: FriendRequest[];
  chats: Record<string, ChatMessage[]>;
  pendingReceivedCount: number;
  updateUserRoute: (activeRoute: string[], currentPandal?: string, zone?: 'north' | 'central' | 'south') => void;
  sendJoinRequest: (friend: FriendProfile, customMessage?: string) => void;
  acceptRequest: (requestId: string, friendId?: string) => void;
  declineRequest: (requestId: string) => void;
  deleteFriend: (friendId: string) => void;
  sendMessage: (friendId: string, text: string) => void;
  shareRouteWithFriend: (friendId: string, pandals: string[]) => void;
  addSimulatedDevotee: (name: string, pandal: string, zone?: 'north' | 'central' | 'south') => void;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);


export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { locality, coordinates } = useLocation();

  const [allUsers, setAllUsers] = useState<FriendProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});

  // 1. Sync Current Google User Profile to Firebase Backend
  useEffect(() => {
    if (user) {
      syncUserProfile(user, {
        locality: locality || 'Kolkata',
        coordinates: coordinates ? { lat: coordinates.latitude, lng: coordinates.longitude } : undefined
      });
    }
  }, [user, locality, coordinates]);

  // 2. Real-time Subscription to ALL registered devotees in the database
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToAllUsers(user.uid, (users) => {
      setAllUsers(users);
    });
    return () => unsub();
  }, [user]);

  // 3. Real-time Subscription to Friend Requests for this user
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToFriendRequests(user.uid, (dbRequests) => {
      setRequests(dbRequests);
    });
    return () => unsub();
  }, [user]);

  // Compute accepted Friends:
  // A user is a confirmed friend if:
  // 1) There is an accepted request between user and friend, OR
  // 2) The current user's profile lists them in 'friends'
  const friends = useMemo(() => {
    if (!user?.uid) return [];

    // Find all friend user IDs from accepted requests
    const acceptedUserIds = new Set<string>();
    
    requests.forEach(r => {
      if (r.status === 'accepted') {
        const fromId = (r as any).fromUserId;
        const toId = (r as any).toUserId;
        if (fromId === user.uid && toId) acceptedUserIds.add(toId);
        if (toId === user.uid && fromId) acceptedUserIds.add(fromId);
        // Also match by senderName if IDs not present
        const matched = allUsers.find(u => u.name.toLowerCase() === r.senderName.toLowerCase());
        if (matched) acceptedUserIds.add(matched.id);
      }
    });

    // Check local storage user doc for explicit friends array
    try {
      const uRaw = localStorage.getItem('pujo_db_users');
      if (uRaw) {
        const uMap: Record<string, UserProfile> = JSON.parse(uRaw);
        if (uMap[user.uid]?.friends) {
          uMap[user.uid].friends?.forEach(fId => acceptedUserIds.add(fId));
        }
      }
    } catch { /* ignore */ }

    return allUsers.filter(u => acceptedUserIds.has(u.id));
  }, [user, requests, allUsers]);

  // 4. Real-time Chat Subscription for all confirmed friends
  useEffect(() => {
    if (!user?.uid || friends.length === 0) return;
    const unsubs: (() => void)[] = [];

    friends.forEach(friend => {
      const chatId = getDeterministicChatId(user.uid, friend.id);
      const unsub = subscribeToChatMessages(chatId, (messages) => {
        if (messages.length > 0) {
          setChats(prev => ({
            ...prev,
            [friend.id]: messages,
            [chatId]: messages
          }));
        }
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(u => u());
  }, [user, friends]);

  const pendingReceivedCount = useMemo(() => {
    return requests.filter(r => r.type === 'received' && r.status === 'pending').length;
  }, [requests]);

  // Update Route Broadcast
  const updateUserRoute = useCallback((activeRoute: string[], currentPandal?: string, zone?: 'north' | 'central' | 'south') => {
    if (user) {
      syncUserProfile(user, {
        activeRoute,
        currentPandal: currentPandal || (activeRoute.length > 0 ? activeRoute[0] : undefined),
        zone: zone || 'south',
        locality: locality || 'Kolkata',
        coordinates: coordinates ? { lat: coordinates.latitude, lng: coordinates.longitude } : undefined
      });
    }
  }, [user, locality, coordinates]);

  // 1. Send Friend Request (Linked to Real Database)
  const sendJoinRequest = useCallback((friend: FriendProfile, customMessage?: string) => {
    if (!user) return;
    sendFriendRequestToDb(user, friend, customMessage, friend.sector, friend.currentPandal);
  }, [user]);

  // 2. Accept Friend Request (Tick Button clicked)
  const acceptRequest = useCallback((requestId: string, friendId?: string) => {
    if (!user) return;
    const req = requests.find(r => r.id === requestId);
    const targetFriendId = friendId || (req as any)?.fromUserId || allUsers.find(u => u.name === req?.senderName)?.id;
    
    if (targetFriendId) {
      acceptFriendRequestInDb(requestId, user.uid, targetFriendId);
    }
  }, [user, requests, allUsers]);

  // 3. Decline Friend Request (Cross Button clicked)
  const declineRequest = useCallback((requestId: string) => {
    declineFriendRequestInDb(requestId);
  }, []);

  // 4. Delete Friend (Unfriend option)
  const deleteFriend = useCallback((friendId: string) => {
    if (!user) return;
    deleteFriendInDb(user.uid, friendId);
  }, [user]);

  // 5. Send Direct Message
  const sendMessage = useCallback((friendId: string, text: string) => {
    if (!text.trim() || !user) return;
    const chatId = getDeterministicChatId(user.uid, friendId);
    sendChatMessageToDb(chatId, friendId, user.uid, text.trim());
  }, [user]);

  // 6. Share Route Card in Chat
  const shareRouteWithFriend = useCallback((friendId: string, pandals: string[]) => {
    if (!user) return;
    const routeText = pandals.length > 0
      ? `🗺️ My Sharodshav Puja Route:\n${pandals.map((p, i) => `${i + 1}. ${p}`).join('\n')}\nLet's meet up along the way!`
      : `🗺️ Hey! Join our Pujo hopping route tonight!`;

    const chatId = getDeterministicChatId(user.uid, friendId);
    sendChatMessageToDb(chatId, friendId, user.uid, routeText, pandals);
  }, [user]);

  // 7. Seed Simulated Devotee (For immediate testing before multiple physical devices join)
  const addSimulatedDevotee = useCallback((name: string, pandal: string, zone?: 'north' | 'central' | 'south') => {
    const simUid = `devotee-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const simUser: UserProfile = {
      uid: simUid,
      displayName: name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}.pujo@gmail.com`,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${simUid}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
      zone: zone || 'south',
      sector: zone === 'north' ? 'Bagbazar / Shyambazar' : zone === 'central' ? 'College Street / Bowbazar' : 'Ballygunge / Gariahat',
      currentPandal: pandal,
      locality: 'Kolkata, WB',
      activeRoute: [pandal, 'Maddox Square', 'Ballygunge Cultural', 'Ekdalia Evergreen'],
      friends: [],
      lastSeen: Date.now()
    };

    try {
      const uRaw = localStorage.getItem('pujo_db_users');
      const uMap: Record<string, UserProfile> = uRaw ? JSON.parse(uRaw) : {};
      uMap[simUid] = simUser;
      localStorage.setItem('pujo_db_users', JSON.stringify(uMap));
      window.dispatchEvent(new Event('pujo_users_updated'));
    } catch { /* ignore */ }
  }, []);

  return (
    <SocialContext.Provider
      value={{
        allUsers,
        friends,
        requests,
        chats,
        pendingReceivedCount,
        updateUserRoute,
        sendJoinRequest,
        acceptRequest,
        declineRequest,
        deleteFriend,
        sendMessage,
        shareRouteWithFriend,
        addSimulatedDevotee
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};
