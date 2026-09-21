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
  subscribeToCurrentUserProfile,
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
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { locality, coordinates } = useLocation();

  const [allUsers, setAllUsers] = useState<FriendProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>({});
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  // Reset states completely when authenticated user changes
  useEffect(() => {
    setAllUsers([]);
    setRequests([]);
    setChats({});
    setCurrentUserProfile(null);
  }, [user?.uid]);

  // 1. Sync Current Google User Profile to Firebase Backend
  useEffect(() => {
    if (user?.uid) {
      syncUserProfile(user, {
        locality: locality || 'Kolkata',
        coordinates: coordinates ? { lat: coordinates.latitude, lng: coordinates.longitude } : undefined
      });
    }
  }, [user, locality, coordinates]);

  // 2. Subscribe to Current User Document in Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToCurrentUserProfile(user.uid, (profile) => {
      setCurrentUserProfile(profile);
    });
    return () => unsub();
  }, [user?.uid]);

  // 3. Real-time Subscription to ALL registered Google devotees in Cloud Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToAllUsers(user.uid, (users) => {
      setAllUsers(users);
    });
    return () => unsub();
  }, [user?.uid]);

  // 4. Real-time Subscription to Friend Requests for this user in Cloud Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToFriendRequests(user.uid, (dbRequests) => {
      setRequests(dbRequests);
    });
    return () => unsub();
  }, [user?.uid]);

  // Compute confirmed Friends strictly based on Firestore user document friends & accepted requests
  const friends = useMemo(() => {
    if (!user?.uid) return [];

    const acceptedUserIds = new Set<string>();
    
    // 1. Live friends from current user profile
    if (currentUserProfile?.friends) {
      currentUserProfile.friends.forEach(fId => acceptedUserIds.add(fId));
    }

    // 2. Verified accepted friend requests strictly matching UIDs
    requests.forEach(r => {
      if (r.status === 'accepted') {
        if (r.fromUserId === user.uid && r.toUserId) acceptedUserIds.add(r.toUserId);
        if (r.toUserId === user.uid && r.fromUserId) acceptedUserIds.add(r.fromUserId);
      }
    });

    return allUsers.filter(u => acceptedUserIds.has(u.id));
  }, [user?.uid, currentUserProfile, requests, allUsers]);

  // 5. Real-time Chat Subscription for all confirmed friends (keyed strictly by chatId)
  useEffect(() => {
    if (!user?.uid || friends.length === 0) return;
    const unsubs: (() => void)[] = [];

    friends.forEach(friend => {
      const chatId = getDeterministicChatId(user.uid, friend.id);
      const unsub = subscribeToChatMessages(chatId, (messages) => {
        setChats(prev => ({
          ...prev,
          [chatId]: messages,
          [friend.id]: messages
        }));
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach(u => u());
  }, [user?.uid, friends]);

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

  // 1. Send Friend Request
  const sendJoinRequest = useCallback((friend: FriendProfile, customMessage?: string) => {
    if (!user) return;
    sendFriendRequestToDb(user, friend, customMessage);
  }, [user]);

  // 2. Accept Friend Request (Tick Button)
  const acceptRequest = useCallback((requestId: string, friendId?: string) => {
    if (!user) return;
    const req = requests.find(r => r.id === requestId);
    const targetFriendId = friendId || req?.fromUserId || req?.toUserId;
    
    if (targetFriendId && targetFriendId !== user.uid) {
      acceptFriendRequestInDb(requestId, user.uid, targetFriendId);
    }
  }, [user, requests]);

  // 3. Decline Friend Request (Cross Button)
  const declineRequest = useCallback((requestId: string) => {
    declineFriendRequestInDb(requestId);
  }, []);

  // 4. Delete Friend (Unfriend)
  const deleteFriend = useCallback((friendId: string) => {
    if (!user) return;
    deleteFriendInDb(user.uid, friendId);
  }, [user]);

  // 5. Send Direct Message
  const sendMessage = useCallback((friendId: string, text: string) => {
    if (!text.trim() || !user) return;
    const chatId = getDeterministicChatId(user.uid, friendId);
    sendChatMessageToDb(chatId, friendId, user, text.trim());
  }, [user]);

  // 6. Share Route Card in Chat
  const shareRouteWithFriend = useCallback((friendId: string, pandals: string[]) => {
    if (!user) return;
    const routeText = pandals.length > 0
      ? `🗺️ My Sharodshav Puja Route:\n${pandals.map((p, i) => `${i + 1}. ${p}`).join('\n')}\nLet's meet up along the way!`
      : `🗺️ Hey! Join our Pujo hopping route tonight!`;

    const chatId = getDeterministicChatId(user.uid, friendId);
    sendChatMessageToDb(chatId, friendId, user, routeText, pandals);
  }, [user]);

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
        shareRouteWithFriend
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
