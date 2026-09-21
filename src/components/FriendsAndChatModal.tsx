import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Users, 
  MessageSquare, 
  Send, 
  Check, 
  UserPlus, 
  MapPin, 
  Share2, 
  Sparkles,
  Search,
  UserCheck,
  Clock,
  Trash2,
  AlertCircle,
  Copy
} from 'lucide-react';
import { useSocial } from '../context/SocialContext';
import { useAuth } from '../context/AuthContext';

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

  const [activeFriendId, setActiveFriendId] = useState<string>(friends[0]?.id || '');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentFriend = useMemo(() => {
    return friends.find(f => f.id === activeFriendId) || friends[0] || null;
  }, [friends, activeFriendId]);

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

  const activeChatMessages = (currentFriend ? chats[currentFriend.id] : []) || [];
  const filteredRequests = requests.filter(r => r.type === requestSubTab);

  const getUserRelation = (targetUserId: string, targetName: string) => {
    if (friends.some(f => f.id === targetUserId || f.name.toLowerCase() === targetName.toLowerCase())) {
      return { status: 'friend' as const };
    }

    const sentReq = requests.find(r => 
      (r.type === 'sent' && ((r as any).toUserId === targetUserId || r.senderName.toLowerCase() === targetName.toLowerCase())) &&
      r.status === 'pending'
    );
    if (sentReq) {
      return { status: 'request_sent' as const, reqId: sentReq.id };
    }

    const receivedReq = requests.find(r => 
      (r.type === 'received' && ((r as any).fromUserId === targetUserId || r.senderName.toLowerCase() === targetName.toLowerCase())) &&
      r.status === 'pending'
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
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl rounded-3xl glass-panel border border-white/20 p-5 sm:p-6 shadow-2xl z-10 my-auto overflow-hidden text-left max-h-[92vh] flex flex-col bg-[#0b0d13]/98"
        >
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                <Users size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold tracking-widest text-[#d4af37] uppercase font-sans">
                    SHARODSHAV SOCIAL
                  </span>
                  <span className="text-white/30 text-xs">•</span>
                  <span className="text-white/60 text-xs font-serif">পূজো আড্ডা ও বন্ধু</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Pujo Friends, Requests & Live Chat
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              title="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Top Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 pb-2 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              
              {/* Tab 1: Explore / Add Friends */}
              <button
                onClick={() => setActiveTab('explore')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'explore'
                    ? 'bg-[#d4af37] text-black shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                }`}
              >
                <UserPlus size={14} />
                <span>Add Friends</span>
                {allUsers.length > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    activeTab === 'explore' ? 'bg-black/20 text-black' : 'bg-white/15 text-white'
                  }`}>
                    {allUsers.length}
                  </span>
                )}
              </button>

              {/* Tab 2: Requests */}
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
                  activeTab === 'requests'
                    ? 'bg-[#d4af37] text-black shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                }`}
              >
                <Clock size={14} />
                <span>Friend Requests</span>
                {pendingReceivedCount > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-500 text-white font-bold animate-pulse">
                    {pendingReceivedCount}
                  </span>
                )}
              </button>

              {/* Tab 3: Chats */}
              <button
                onClick={() => setActiveTab('chats')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'chats'
                    ? 'bg-[#d4af37] text-black shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                }`}
              >
                <MessageSquare size={14} />
                <span>Live Chats</span>
                {friends.length > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    activeTab === 'chats' ? 'bg-black/20 text-black' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {friends.length}
                  </span>
                )}
              </button>
            </div>

            {/* Sub-tabs for Requests */}
            {activeTab === 'requests' && (
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setRequestSubTab('received')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    requestSubTab === 'received'
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  Received ({requests.filter(r => r.type === 'received').length})
                </button>
                <button
                  onClick={() => setRequestSubTab('sent')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    requestSubTab === 'sent'
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  Sent ({requests.filter(r => r.type === 'sent').length})
                </button>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto py-4 min-h-[380px]">
            
            {/* ══════════════════════════════════════════════════════════════
                TAB 1: ADD FRIENDS (REAL GOOGLE USERS ONLY - ZERO DUMMY DATA)
                ══════════════════════════════════════════════════════════════ */}
            {activeTab === 'explore' && (
              <div className="space-y-4">
                
                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search devotees by Google name or pandal..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#d4af37] transition-colors"
                    />
                  </div>
                </div>

                {/* Devotees List */}
                {allUsers.length === 0 ? (
                  <div className="py-14 text-center text-white/50 space-y-4 border border-dashed border-white/10 rounded-2xl p-6 bg-white/[0.01]">
                    <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center mx-auto text-[#d4af37]">
                      <Users size={28} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">Signed in as {user?.displayName || 'Devotee'}</h4>
                      <p className="text-xs text-white/50 max-w-md mx-auto mt-1.5 leading-relaxed">
                        Your authentic Google profile is now synchronized in Cloud Firestore. As other devotees log in with their Google accounts on Sharodshav, they will appear here live in real-time!
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleCopyShareLink}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6ca65] text-black font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 mx-auto cursor-pointer"
                      >
                        {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedLink ? 'Copied Site Link!' : 'Share Sharodshav with Friends'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {allUsers
                      .filter(u => 
                        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        u.currentPandal.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (u.locality && u.locality.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map((devotee) => {
                        const rel = getUserRelation(devotee.id, devotee.name);
                        return (
                          <div
                            key={devotee.id}
                            className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#d4af37]/30 transition-all flex items-center justify-between gap-3 group"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="relative shrink-0">
                                <img
                                  src={devotee.avatar}
                                  alt={devotee.name}
                                  className="w-12 h-12 rounded-2xl object-cover border border-[#d4af37]/40 bg-black/40"
                                />
                                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0b0d13]" title="Google Verified Devotee" />
                              </div>

                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="text-xs font-bold text-white truncate group-hover:text-[#f4e5a9] transition-colors">
                                    {devotee.name}
                                  </h4>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-[#d4af37]/15 text-[#f4e5a9] border border-[#d4af37]/30 shrink-0 uppercase font-mono">
                                    {devotee.zone}
                                  </span>
                                </div>

                                <p className="text-[11px] text-white/50 truncate flex items-center gap-1">
                                  <MapPin size={10} className="text-[#d4af37] shrink-0" />
                                  <span>{devotee.currentPandal || 'Kolkata Pandal'}</span>
                                </p>

                                <p className="text-[10px] text-white/30 truncate">
                                  {devotee.locality || 'Kolkata, WB'}
                                </p>
                              </div>
                            </div>

                            {/* Action Button depending on Relationship */}
                            <div className="shrink-0 flex items-center gap-1.5">
                              {rel.status === 'friend' ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                                    <UserCheck size={12} />
                                    <span>Friends</span>
                                  </span>
                                  <button
                                    onClick={() => {
                                      setActiveFriendId(devotee.id);
                                      setActiveTab('chats');
                                    }}
                                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                    title="Open Chat"
                                  >
                                    <MessageSquare size={13} />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(devotee.id)}
                                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                                    title="Delete Friend"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ) : rel.status === 'request_sent' ? (
                                <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                                  <Clock size={12} />
                                  <span>Request Sent</span>
                                </span>
                              ) : rel.status === 'request_received' ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => acceptRequest(rel.reqId, devotee.id)}
                                    className="p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all cursor-pointer shadow-md"
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
                                  onClick={() => acceptRequest(req.id, (req as any).fromUserId)}
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
                                  <X size={15} className="stroke-[2.5]" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                                <Clock size={12} />
                                <span>Pending Response</span>
                              </span>
                            )}
                          </>
                        ) : req.status === 'accepted' ? (
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                              <Check size={13} />
                              <span>Accepted</span>
                            </span>
                            <button
                              onClick={() => {
                                const matched = friends.find(f => f.name === req.senderName);
                                if (matched) setActiveFriendId(matched.id);
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
                TAB 3: LIVE CHATS (WITH DELETE FRIEND OPTION)
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

                  <div className="space-y-1.5 overflow-y-auto max-h-[340px] pr-1">
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
                          const isSelected = activeFriendId === friend.id;
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
                <div className="md:col-span-8 flex flex-col justify-between h-[360px] pl-1">
                  
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
                            className="w-8 h-8 rounded-lg object-cover border border-[#d4af37]/40"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{currentFriend.name}</h4>
                            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              {currentFriend.lastSeen}
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
                      <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
                        {activeChatMessages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center text-white/40 space-y-2 py-8">
                            <MessageSquare size={32} className="text-white/20" />
                            <p className="text-xs font-semibold text-white/60">No messages yet with {currentFriend.name.split(' ')[0]}</p>
                            <p className="text-[11px] text-white/40 max-w-[220px]">
                              Say Shubho Pujo or share your pandal route to plan together!
                            </p>
                          </div>
                        ) : (
                          activeChatMessages.map((msg) => {
                            const isMe = msg.sender === 'me';
                            return (
                              <div
                                key={msg.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                                  isMe
                                    ? 'bg-gradient-to-r from-[#d4af37] to-[#e6ca65] text-black font-medium rounded-tr-none shadow-md'
                                    : 'bg-white/10 border border-white/10 text-white rounded-tl-none'
                                }`}>
                                  <p className="whitespace-pre-line">{msg.text}</p>
                                  <span className={`text-[9px] block text-right mt-1 ${isMe ? 'text-black/60' : 'text-white/40'}`}>
                                    {msg.timestamp}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Chat Input Bar */}
                      <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-white/10 shrink-0">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder={`Type a message to ${currentFriend.name.split(' ')[0]}...`}
                          className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#d4af37]"
                        />
                        <button
                          type="submit"
                          disabled={!messageInput.trim()}
                          className="p-2 rounded-xl bg-[#d4af37] text-black hover:bg-[#e6ca65] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shrink-0"
                        >
                          <Send size={15} />
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
