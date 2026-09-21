import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MessageSquare,
  UserPlus,
  Search,
  Check,
  X,
  Send,
  Sparkles,
  MapPin,
  Trash2,
  Share2,
  Copy,
  AlertCircle
} from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';
import { getDeterministicChatId } from '../services/firebaseBackend';

interface FriendsAndChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoutePandals?: string[];
}

export const FriendsAndChatModal: React.FC<FriendsAndChatModalProps> = ({
  isOpen,
  onClose,
  activeRoutePandals = []
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'explore' | 'requests' | 'chats'>('explore');
  const [requestSubTab, setRequestSubTab] = useState<'received' | 'sent'>('received');
  
  const { 
    allUsers,
    friends, 
    requests, 
    chats, 
    pendingReceivedCount, 
    sendJoinRequest,
    acceptRequest, 
    declineRequest, 
    deleteFriend,
    sendMessage, 
    shareRouteWithFriend
  } = useSocial();

  const [activeFriendId, setActiveFriendId] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pick default active friend if none selected
  useEffect(() => {
    if (friends.length > 0 && (!activeFriendId || !friends.some(f => f.id === activeFriendId))) {
      setActiveFriendId(friends[0].id);
    }
  }, [friends, activeFriendId]);

  const currentFriend = useMemo(() => {
    return friends.find(f => f.id === activeFriendId) || friends[0] || null;
  }, [friends, activeFriendId]);

  // Compute deterministic chatId for current conversation
  const currentChatId = useMemo(() => {
    if (!user?.uid || !currentFriend?.id) return null;
    return getDeterministicChatId(user.uid, currentFriend.id);
  }, [user?.uid, currentFriend?.id]);

  // Isolated active messages strictly for this conversation
  const activeChatMessages = useMemo(() => {
    if (!currentChatId) return [];
    return chats[currentChatId] || chats[currentFriend?.id || ''] || [];
  }, [chats, currentChatId, currentFriend?.id]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatMessages.length, activeFriendId, activeTab]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !currentFriend) return;

    sendMessage(currentFriend.id, messageInput.trim());
    setMessageInput('');
  };

  const handleShareRouteInChat = () => {
    if (!currentFriend) return;
    shareRouteWithFriend(currentFriend.id, activeRoutePandals);
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredRequests = requests.filter(r => r.type === requestSubTab);

  const getUserRelation = (targetUserId: string) => {
    if (friends.some(f => f.id === targetUserId)) {
      return { status: 'friend' as const };
    }

    const sentReq = requests.find(r => 
      r.type === 'sent' && r.toUserId === targetUserId && r.status === 'pending'
    );
    if (sentReq) {
      return { status: 'request_sent' as const, reqId: sentReq.id };
    }

    const receivedReq = requests.find(r => 
      r.type === 'received' && r.fromUserId === targetUserId && r.status === 'pending'
    );
    if (receivedReq) {
      return { status: 'request_received' as const, reqId: receivedReq.id };
    }

    return { status: 'none' as const };
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-[#0b0d13] border border-[#d4af37]/30 rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10 flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Devotees & Friends</span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#d4af37]/15 text-[#f4e5a9] border border-[#d4af37]/30">
                    Live Pujo Squad
                  </span>
                </h3>
                <p className="text-xs text-white/50">
                  Connect with real Google-authenticated devotees across Kolkata
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2 py-3 shrink-0">
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <UserPlus size={14} />
              <span>Add Friends ({allUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Users size={14} />
              <span>Requests</span>
              {pendingReceivedCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {pendingReceivedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('chats')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'chats'
                  ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <MessageSquare size={14} />
              <span>Chats ({friends.length})</span>
            </button>
          </div>

          {/* Sub-tab for Requests */}
          {activeTab === 'requests' && (
            <div className="flex items-center space-x-2 pb-3 shrink-0">
              <button
                onClick={() => setRequestSubTab('received')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  requestSubTab === 'received'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                Received ({requests.filter(r => r.type === 'received').length})
              </button>
              <button
                onClick={() => setRequestSubTab('sent')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  requestSubTab === 'sent'
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 text-white/50 hover:text-white'
                }`}
              >
                Sent ({requests.filter(r => r.type === 'sent').length})
              </button>
            </div>
          )}

          {/* Main Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-2">
            
            {/* ══════════════════════════════════════════════════════════════
                TAB 1: EXPLORE REAL GOOGLE DEVOTEES (ADD FRIENDS)
                ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'explore' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search devotees by Google name, sector, or pandal..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#d4af37] transition-colors"
                  />
                </div>

                {/* Empty State when no other real Google accounts have registered yet */}
                {allUsers.length === 0 ? (
                  <div className="py-14 text-center text-white/60 space-y-4 border border-dashed border-white/10 rounded-3xl p-6 bg-white/[0.02]">
                    <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mx-auto">
                      <Users size={28} />
                    </div>
                    <div className="space-y-1 max-w-md mx-auto">
                      <h4 className="text-base font-bold text-white">No other devotees registered yet</h4>
                      <p className="text-xs text-white/50 leading-relaxed">
                        You are the first pioneer devotee on Sharodshav! Share the website link with your friends so they can sign in with their Google accounts and join your Pujo squad.
                      </p>
                    </div>

                    <button
                      onClick={handleCopyShareLink}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e6ca65] text-black text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Link to Invite Friends'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {allUsers
                      .filter(u => 
                        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.currentPandal.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((devotee) => {
                        const rel = getUserRelation(devotee.id);
                        return (
                          <div
                            key={devotee.id}
                            className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#d4af37]/30 transition-all flex items-center justify-between gap-3 shadow-sm"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <img
                                src={devotee.avatar}
                                alt={devotee.name}
                                className="w-11 h-11 rounded-2xl object-cover border border-[#d4af37]/40 shrink-0 bg-black/40"
                              />
                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-bold text-white truncate">{devotee.name}</h4>
                                <div className="flex items-center gap-1.5 text-[11px] text-white/50 pt-0.5">
                                  <MapPin size={11} className="text-[#d4af37] shrink-0" />
                                  <span className="truncate">{devotee.currentPandal}</span>
                                </div>
                                <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-medium bg-white/5 text-white/60 border border-white/10">
                                  {devotee.sector}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {rel.status === 'friend' ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setActiveFriendId(devotee.id);
                                      setActiveTab('chats');
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <MessageSquare size={12} />
                                    <span>Chat</span>
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(devotee.id)}
                                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                                    title="Delete / Unfriend"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ) : rel.status === 'request_sent' ? (
                                <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1">
                                  <Sparkles size={12} />
                                  <span>Request Sent</span>
                                </span>
                              ) : rel.status === 'request_received' && rel.reqId ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => acceptRequest(rel.reqId, devotee.id)}
                                    className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all cursor-pointer"
                                    title="Accept Friend Request (✓)"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    onClick={() => declineRequest(rel.reqId)}
                                    className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                                    title="Decline Friend Request (✕)"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => sendJoinRequest(devotee)}
                                  className="px-3.5 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e6ca65] text-black font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_12px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95"
                                >
                                  <UserPlus size={13} />
                                  <span>Add Friend</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB 2: FRIEND REQUESTS (RECEIVED / SENT WITH TICK & CROSS)
                ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'requests' && (
              <div className="space-y-3">
                {filteredRequests.length === 0 ? (
                  <div className="py-16 text-center text-white/40 space-y-2 border border-dashed border-white/10 rounded-2xl">
                    <UserPlus size={32} className="mx-auto text-white/20" />
                    <p className="text-sm font-medium">No {requestSubTab} friend requests</p>
                    <p className="text-xs text-white/40">
                      {requestSubTab === 'received' 
                        ? 'When devotees send you a friend request, their name and response buttons will appear here.'
                        : 'Friend requests you send to other devotees will appear here.'}
                    </p>
                  </div>
                ) : (
                  filteredRequests.map((req) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start space-x-3.5 min-w-0">
                        <img
                          src={req.senderAvatar}
                          alt={req.senderName}
                          className="w-12 h-12 rounded-2xl object-cover border border-[#d4af37]/40 shrink-0 bg-black/40"
                        />
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white">{req.senderName}</h4>
                            <span className="px-2 py-0.2 rounded text-[10px] font-medium bg-[#d4af37]/15 text-[#f4e5a9] border border-[#d4af37]/30">
                              {req.zone}
                            </span>
                            <span className="text-[11px] text-white/40">{req.timestamp}</span>
                          </div>
                          
                          <p className="text-xs text-white/80 italic">
                            "{req.message}"
                          </p>

                          <div className="flex items-center gap-1.5 text-[11px] text-white/50 pt-0.5">
                            <MapPin size={11} className="text-[#d4af37]" />
                            <span>Currently at: <strong>{req.currentPandal}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons: TICK (ACCEPT) and CROSS (REJECT) */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {req.status === 'pending' ? (
                          <>
                            {req.type === 'received' ? (
                              <div className="flex items-center gap-2">
                                {/* TICK BUTTON: ACCEPT */}
                                <button
                                  onClick={() => acceptRequest(req.id, req.fromUserId)}
                                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95"
                                  title="Accept Friend Request (✓)"
                                >
                                  <Check size={16} className="stroke-[3]" />
                                  <span>Accept</span>
                                </button>
                                
                                {/* CROSS BUTTON: REJECT */}
                                <button
                                  onClick={() => declineRequest(req.id)}
                                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                                  title="Reject Friend Request (✕)"
                                >
                                  <X size={15} />
                                  <span>Decline</span>
                                </button>
                              </div>
                            ) : (
                              <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                                <Sparkles size={13} />
                                <span>Pending Response</span>
                              </span>
                            )}
                          </>
                        ) : req.status === 'accepted' ? (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                              <Check size={13} />
                              <span>Friends</span>
                            </span>
                            <button
                              onClick={() => {
                                const targetUid = req.fromUserId === user?.uid ? req.toUserId : req.fromUserId;
                                if (targetUid) setActiveFriendId(targetUid);
                                setActiveTab('chats');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium cursor-pointer"
                            >
                              Open Chat
                            </button>
                          </div>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                            Rejected / Declined
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                TAB 3: LIVE CHATS (ISOLATED, HIGH VISIBILITY, LEFT/RIGHT)
                ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'chats' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full">
                
                {/* Friends List Column */}
                <div className="md:col-span-4 flex flex-col space-y-2 border-r border-white/10 pr-2">
                  {friends.length > 0 && (
                    <div className="relative mb-1">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search friends..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5 overflow-y-auto max-h-[380px] pr-1">
                    {friends.length === 0 ? (
                      <div className="py-12 text-center text-white/40 space-y-3 border border-dashed border-white/10 rounded-2xl px-4">
                        <Users size={32} className="mx-auto text-white/20" />
                        <p className="text-sm font-semibold text-white/60">No friends connected yet</p>
                        <p className="text-[11px] text-white/40 leading-relaxed">
                          Go to <strong>Add Friends</strong> to find devotees who have signed in with Google and send requests!
                        </p>
                        <button
                          onClick={() => setActiveTab('explore')}
                          className="px-3.5 py-1.5 rounded-xl bg-[#d4af37] text-black font-bold text-xs cursor-pointer hover:brightness-110"
                        >
                          Find Friends
                        </button>
                      </div>
                    ) : (
                      friends
                        .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((friend) => {
                          const isSelected = currentFriend?.id === friend.id;
                          return (
                            <div
                              key={friend.id}
                              onClick={() => setActiveFriendId(friend.id)}
                              className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between group ${
                                isSelected
                                  ? 'bg-[#d4af37]/15 border border-[#d4af37]/40 shadow-sm'
                                  : 'bg-white/[0.02] hover:bg-white/[0.06] border border-transparent'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5 min-w-0">
                                <div className="relative shrink-0">
                                  <img
                                    src={friend.avatar}
                                    alt={friend.name}
                                    className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0"
                                  />
                                  <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0b0d13]" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <h5 className={`text-xs font-bold truncate ${isSelected ? 'text-[#f4e5a9]' : 'text-white'}`}>
                                    {friend.name}
                                  </h5>
                                  <p className="text-[10px] text-white/50 truncate flex items-center gap-1">
                                    <MapPin size={9} className="text-[#d4af37]" />
                                    {friend.currentPandal}
                                  </p>
                                </div>
                              </div>

                              {/* Unfriend / Delete Friend button in row */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(friend.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                                title="Delete Friend"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Chat Conversation Column */}
                <div className="md:col-span-8 flex flex-col justify-between h-[420px] pl-1">
                  
                  {!currentFriend ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-white/40 space-y-3 py-8">
                      <MessageSquare size={40} className="text-white/15" />
                      <p className="text-sm font-semibold text-white/50">No friend selected</p>
                      <p className="text-[11px] text-white/35 max-w-[260px] leading-relaxed">
                        Select a friend from the left or accept incoming requests to start chatting!
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Chat Top Banner with Delete Friend Option */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <img
                            src={currentFriend.avatar}
                            alt={currentFriend.name}
                            className="w-9 h-9 rounded-xl object-cover border border-[#d4af37]/40"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">{currentFriend.name}</h4>
                            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active Devotee
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Share Route */}
                          <button
                            onClick={handleShareRouteInChat}
                            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37]/20 to-[#d4af37]/10 hover:from-[#d4af37]/30 hover:to-[#d4af37]/20 border border-[#d4af37]/40 text-[#f4e5a9] text-xs font-medium transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                            title="Share your live Puja itinerary to this chat"
                          >
                            <Share2 size={12} />
                            <span className="hidden sm:inline">Share Route</span>
                          </button>

                          {/* Delete Friend */}
                          <button
                            onClick={() => setConfirmDeleteId(currentFriend.id)}
                            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs transition-colors cursor-pointer"
                            title="Delete / Unfriend"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Message Bubbles Scroll Area */}
                      <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
                        {activeChatMessages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center text-white/40 space-y-2 py-8">
                            <MessageSquare size={32} className="text-white/20" />
                            <p className="text-xs font-semibold text-white/60">No messages yet with {currentFriend.name.split(' ')[0]}</p>
                            <p className="text-[11px] text-white/40 max-w-[240px]">
                              Say Shubho Pujo or share your pandal route to coordinate pandal hopping together!
                            </p>
                          </div>
                        ) : (
                          activeChatMessages.map((msg) => {
                            // DETERMINISTIC CHECK: If senderId === user.uid -> RIGHT (Me), else LEFT (Friend)
                            const isMe = msg.senderId ? msg.senderId === user?.uid : msg.sender === 'me';

                            return (
                              <div
                                key={msg.id}
                                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                              >
                                {/* Left Avatar for Friend */}
                                {!isMe && (
                                  <img
                                    src={msg.senderAvatar || currentFriend.avatar}
                                    alt={currentFriend.name}
                                    className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0 mb-1"
                                  />
                                )}

                                <div className={`max-w-[78%] sm:max-w-[72%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-lg ${
                                  isMe
                                    ? 'bg-gradient-to-r from-[#d4af37] to-[#e6ca65] text-black font-medium rounded-br-none shadow-[0_3px_12px_rgba(212,175,55,0.25)]'
                                    : 'bg-[#181b26] border border-white/20 text-white font-normal rounded-bl-none shadow-[0_3px_12px_rgba(0,0,0,0.5)]'
                                }`}>
                                  {/* Friend Name Label on incoming message */}
                                  {!isMe && (
                                    <span className="block text-[10px] font-bold text-[#d4af37] mb-1">
                                      {msg.senderName || currentFriend.name.split(' ')[0]}
                                    </span>
                                  )}

                                  <p className="whitespace-pre-line select-text font-normal">{msg.text}</p>

                                  {/* Route Card Preview if itinerary is shared */}
                                  {msg.isRouteCard && msg.routeData && (
                                    <div className={`mt-2 p-2.5 rounded-xl border ${
                                      isMe 
                                        ? 'bg-black/10 border-black/15 text-black' 
                                        : 'bg-white/5 border-white/10 text-white'
                                    }`}>
                                      <div className="flex items-center gap-1.5 font-bold text-[11px] mb-1.5">
                                        <MapPin size={12} className={isMe ? 'text-black' : 'text-[#d4af37]'} />
                                        <span>{msg.routeData.title}</span>
                                      </div>
                                      <div className="space-y-1 text-[10px]">
                                        {msg.routeData.pandals.map((p, idx) => (
                                          <div key={idx} className="flex items-center gap-1.5 opacity-90">
                                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                              isMe ? 'bg-black/20 text-black' : 'bg-[#d4af37]/20 text-[#d4af37]'
                                            }`}>
                                              {idx + 1}
                                            </span>
                                            <span className="truncate">{p}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <span className={`text-[9px] block text-right mt-1 ${
                                    isMe ? 'text-black/60 font-semibold' : 'text-white/40'
                                  }`}>
                                    {msg.timestamp}
                                  </span>
                                </div>

                                {/* Right Avatar for Current User */}
                                {isMe && user?.photoURL && (
                                  <img
                                    src={user.photoURL}
                                    alt="You"
                                    className="w-7 h-7 rounded-full object-cover border border-[#d4af37]/60 shrink-0 mb-1"
                                  />
                                )}
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Chat Input Bar */}
                      <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-white/10 shrink-0">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder={`Type a message to ${currentFriend.name.split(' ')[0]}...`}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#d4af37]"
                        />
                        <button
                          type="submit"
                          disabled={!messageInput.trim()}
                          className="p-2.5 rounded-xl bg-[#d4af37] text-black hover:bg-[#e6ca65] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shrink-0"
                        >
                          <Send size={16} />
                        </button>
                      </form>
                    </>
                  )}

                </div>

              </div>
            )}

          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40 shrink-0">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#d4af37]" />
              <span>Real-time Google Account Durga Puja coordination on Firebase</span>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>

          {/* Delete Friend Confirmation Modal */}
          <AnimatePresence>
            {confirmDeleteId && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full max-w-sm p-5 rounded-3xl bg-[#12141c] border border-rose-500/30 text-center space-y-4 shadow-2xl"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Remove Friend?</h3>
                    <p className="text-xs text-white/60 mt-1">
                      Are you sure you want to delete this friend from your Pujo squad? You can add them again anytime.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        deleteFriend(confirmDeleteId);
                        setConfirmDeleteId(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      Yes, Delete Friend
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
