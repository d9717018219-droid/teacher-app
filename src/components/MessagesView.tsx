import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Search, 
  ChevronRight, 
  User, 
  Clock, 
  ArrowLeft, 
  Send,
  MoreVertical,
  Shield,
  CheckCircle,
  X,
  MapPin,
  Phone,
  AlertTriangle
} from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { useMessages } from '../hooks/useChat';
import { ConnectionRequest, ChatMessage } from '../types';
import { cn, toTitleCase } from '../utils';

// ─── Date Formatting Helpers ────────────────────────────────────────
function formatMessageListDate(date: Date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 6);

  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (d.getTime() === today.getTime()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (d.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  if (d.getTime() >= startOfWeek.getTime()) {
    return date.toLocaleDateString('en-IN', { weekday: 'long' });
  }
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatSeparatorDate(date: Date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === yesterday.getTime()) return 'Yesterday';
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface MessagesViewProps {
  connections: ConnectionRequest[];
  loading: boolean;
  currentUserId: string;
  playTapSound: () => void;
  onHandleConnection: (id: string, status: 'accepted' | 'rejected' | 'blocked') => Promise<void>;
  onReportUser: (connection: ConnectionRequest, reporterId: string, reason: string) => Promise<void>;
}

export default function MessagesView({ connections, loading, currentUserId, playTapSound, onHandleConnection, onReportUser }: MessagesViewProps) {
  const [selectedConnection, setSelectedConnection] = useState<ConnectionRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Update selected connection if status changes
  React.useEffect(() => {
    if (selectedConnection) {
      const updated = connections.find(c => c.id === selectedConnection.id);
      if (updated) setSelectedConnection(updated);
    }
  }, [connections]);

  const filteredConnections = connections.filter(c => {
    const name = (currentUserId === c.parentId ? c.tutorName : c.parentName).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  if (selectedConnection) {
    return (
      <ChatRoom 
        connection={selectedConnection} 
        currentUserId={currentUserId} 
        onBack={() => setSelectedConnection(null)} 
        playTapSound={playTapSound}
        onHandleConnection={onHandleConnection}
        onReportUser={onReportUser}
      />
    );
  }

  return (
    <div className="space-y-6 pb-24 mt-8 px-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-[24px] font-[1000] text-slate-900 tracking-tighter">Messages</h2>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Safe & Private Chats</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversations..."
          className="w-full bg-slate-50 border border-slate-100 rounded-[24px] py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-primary transition-all shadow-sm"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
            <div className="text-4xl">💬</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">No active chats yet.</p>
          </div>
        ) : (
          filteredConnections.map((conn) => {
            const otherName = currentUserId === conn.parentId ? conn.tutorName : conn.parentName;
            const lastMsg = conn.lastMessage || 'No messages yet';
            const time = conn.lastMessageTime?.toDate ? conn.lastMessageTime.toDate() : new Date();
            const isPending = conn.status === 'pending';
            const isRejected = conn.status === 'rejected';
            const isTutor = currentUserId === conn.tutorId;

            return (
              <motion.div
                key={conn.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => { playTapSound(); setSelectedConnection(conn); }}
                className={cn(
                  "bg-white rounded-[28px] p-4 border shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition-all active:bg-slate-50 relative overflow-hidden",
                  isPending ? "border-indigo-200 bg-indigo-50/10" : "border-slate-100",
                  isRejected ? "opacity-60" : ""
                )}
              >
                {isPending && isTutor && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                    New Request
                  </div>
                )}
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border",
                  isPending ? "bg-indigo-100 text-indigo-600 border-indigo-200" : "bg-slate-50 text-slate-400 border-slate-100"
                )}>
                  <User size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-[14px] font-black text-slate-900 truncate pr-2">{toTitleCase(otherName)}</h4>
                    <span className="text-[9px] font-bold text-slate-400 shrink-0 mt-0.5">
                      {formatMessageListDate(time)}
                    </span>
                  </div>
                  <p className={cn(
                    "text-[12px] truncate",
                    isPending ? "font-bold text-indigo-600" : "font-medium text-slate-500"
                  )}>
                    {isRejected ? 'Request declined' : lastMsg}
                  </p>
                </div>
                <ChevronRight size={18} className={isPending ? "text-indigo-400" : "text-slate-300"} />
              </motion.div>
            );
          })
        )}
      </div>

      <div className="bg-emerald-50 border border-emerald-100 rounded-[24px] p-4 flex items-start gap-3">
        <Shield className="text-emerald-600 shrink-0" size={18} />
        <p className="text-[10px] font-bold text-emerald-700 leading-relaxed uppercase tracking-tight">
          Your privacy is our priority. Phone numbers are hidden. Chat freely to discuss requirements.
        </p>
      </div>
    </div>
  );
}

function ChatRoom({ connection, currentUserId, onBack, playTapSound, onHandleConnection, onReportUser }: { connection: ConnectionRequest, currentUserId: string, onBack: () => void, playTapSound: () => void, onHandleConnection: (id: string, status: 'accepted' | 'rejected' | 'blocked') => Promise<void>, onReportUser: (connection: ConnectionRequest, reporterId: string, reason: string) => Promise<void> }) {
  const { messages, loading, sendMessage } = useMessages(connection.id);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const otherName = currentUserId === connection.parentId ? connection.tutorName : connection.parentName;

  const isPending = connection.status === 'pending';
  const isRejected = connection.status === 'rejected';
  const isBlocked = connection.status === 'blocked';
  const isTutor = currentUserId === connection.tutorId;

  // Calculate "Last Seen" using connection's last update
  const updatedDate = connection.updatedAt?.toDate ? connection.updatedAt.toDate() : new Date();
  const isToday = updatedDate.toDateString() === new Date().toDateString();
  const lastSeenText = isToday 
    ? `today at ${updatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : `${updatedDate.toLocaleDateString([], { day: '2-digit', month: 'short' })}`;

  const handleSend = () => {
    if (!inputText.trim()) return;
    playTapSound();
    sendMessage(inputText, currentUserId);
    setInputText('');
  };

  const handleShareLocation = async () => {
    playTapSound();
    
    try {
      setIsProcessing(true);
      
      const isNative = Capacitor.isNativePlatform();
      
      if (isNative) {
        // Step 1: Check current permission status
        let permStatus = await Geolocation.checkPermissions();
        console.log("Current location permission status:", permStatus.location);

        // Step 2: If not granted, request it (this triggers the system popup)
        if (permStatus.location !== 'granted') {
          permStatus = await Geolocation.requestPermissions({ permissions: ['location'] });
        }

        // Step 3: Final check after request
        if (permStatus.location !== 'granted') {
          alert("Permission denied. To share location, please allow 'Location' permission in your Phone Settings > Apps > DoAble India.");
          setIsProcessing(false);
          return;
        }

        // Step 4: Small delay to let the system initialize GPS after permission grant
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Get the current position with optimized settings for mobile
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000 
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      sendMessage(`[ACTION:SHARE_LOCATION|${lat},${lng}]`, currentUserId);

    } catch (error: any) {
      console.error("Detailed Location Error:", error);
      
      if (error.code === 1 || error.message?.toLowerCase().includes('denied')) {
        alert("Permission denied. Please enable Location in App Settings.");
      } else if (error.code === 3 || error.message?.toLowerCase().includes('timeout')) {
        alert("Location timeout. Please ensure your GPS (Location) is ON in the phone's top menu and you are not in a basement.");
      } else {
        alert("Unable to get location: " + (error.message || "Please check if GPS is enabled."));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareContact = () => {
    playTapSound();
    const myId = isTutor ? connection.tutorId : connection.parentId;
    const roleText = isTutor ? "Tutor ID" : "User ID";
    const coordinatorPhone = "9711898248";
    
    sendMessage(`My ${roleText} is #${myId}. Please call our City Coordinator at ${coordinatorPhone} to connect with me over a conference call between 9am to 6pm.`, currentUserId);
  };

  const handleCloseChat = async () => {
    if (window.confirm("Are you sure you want to close this chat? You won't be able to send more messages.")) {
      playTapSound();
      setIsProcessing(true);
      await onHandleConnection(connection.id, 'rejected');
      setIsProcessing(false);
    }
  };

  const handleReport = async () => {
    const reason = window.prompt("Why are you reporting this user? (e.g. Asking for direct payment, abusive language, etc.)");
    if (!reason) return;

    playTapSound();
    setIsProcessing(true);
    try {
      await onReportUser(connection, currentUserId, reason);
      alert("Report submitted to Admin. We will investigate this conversation.");
    } catch (error) {
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[15000] bg-white flex flex-col pt-[env(safe-area-inset-top)] pb-[calc(1rem+var(--safe-area-bottom,20px))]">
      {/* Chat Header */}
      <div className="px-6 py-4 mt-8 border-b border-slate-100 flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600 active:scale-90 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
          <User size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-black text-slate-900 truncate">{toTitleCase(otherName)}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isPending ? (
               <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Pending Request</span>
            ) : isRejected ? (
               <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Declined</span>
            ) : isBlocked ? (
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Blocked</span>
            ) : (
               <span className="text-[10px] font-bold text-slate-500 truncate">Last seen {lastSeenText}</span>
            )}
          </div>
        </div>
        
        {/* Header Actions Menu */}
        <div className="relative shrink-0">
          <button onClick={() => { playTapSound(); setShowMenu(!showMenu); }} className="p-2 text-slate-600 active:bg-slate-50 rounded-full transition-all">
            {showMenu ? <X size={20} /> : <MoreVertical size={20} />}
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  onClick={() => setShowMenu(false)}
                  className="fixed inset-0 z-40"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 shadow-xl rounded-2xl overflow-hidden z-50 py-1"
                >
                  <button 
                    onClick={() => {
                      playTapSound();
                      setShowMenu(false);
                      window.dispatchEvent(new CustomEvent('navigateToTab', { detail: isTutor ? 'jobs' : 'tutors' }));
                    }}
                    className="w-full text-left px-4 py-3 text-[12px] font-bold text-slate-700 active:bg-slate-50 transition-all flex items-center gap-2"
                  >
                    {isTutor ? <MessageSquare size={14} className="text-amber-500"/> : <User size={14} className="text-indigo-500"/>}
                    {isTutor ? 'View Requirement' : 'View Profile'}
                  </button>
                  <div className="h-px bg-slate-50 mx-2" />
                  <button 
                    disabled={isProcessing}
                    onClick={async () => {
                      setShowMenu(false);
                      await handleCloseChat();
                    }}
                    className="w-full text-left px-4 py-3 text-[12px] font-bold text-slate-700 active:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <X size={14} className="text-slate-400" />
                    Close Chat
                  </button>
                  <button 
                    disabled={isProcessing}
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to block this user?")) {
                        playTapSound();
                        setShowMenu(false);
                        setIsProcessing(true);
                        await onHandleConnection(connection.id, 'blocked');
                        setIsProcessing(false);
                      }
                    }}
                    className="w-full text-left px-4 py-3 text-[12px] font-bold text-rose-600 active:bg-rose-50 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Shield size={14} />
                    Block User
                  </button>
                  <div className="h-px bg-slate-50 mx-2" />
                  <button 
                    disabled={isProcessing}
                    onClick={() => {
                      setShowMenu(false);
                      handleReport();
                    }}
                    className="w-full text-left px-4 py-3 text-[12px] font-bold text-amber-600 active:bg-amber-50 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <AlertTriangle size={14} />
                    Report User
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed Safety Warning */}
      <div className="bg-amber-50/95 backdrop-blur-sm border-b border-amber-200 text-amber-800 px-4 py-2 shadow-sm flex gap-2 items-center z-10 shrink-0">
        <Shield className="shrink-0 text-amber-600" size={14} />
        <p className="text-[9px] font-bold leading-tight">
          ⚠️ <b className="text-rose-600">STRICTLY PROHIBITED:</b> Sharing Phone/Address directly. Violators will be blacklisted. Use the buttons below.
        </p>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40 text-center space-y-3">
             <MessageSquare size={48} />
             <p className="text-[12px] font-black uppercase tracking-widest">Start the conversation</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === currentUserId;
            
            const date = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();
            const prevMsg = messages[i - 1];
            const prevDate = prevMsg?.timestamp?.toDate ? prevMsg.timestamp.toDate() : null;
            const showSeparator = !prevDate || date.toDateString() !== prevDate.toDateString();

            return (
              <React.Fragment key={msg.id || i}>
                {showSeparator && (
                  <div className="flex justify-center my-6">
                    <div className="bg-slate-800/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-[0.1em] px-4 py-1.5 rounded-full shadow-lg border border-white/10">
                      {formatSeparatorDate(date)}
                    </div>
                  </div>
                )}
                
                {/* Support system messages */}
                {(msg as any).isSystem ? (
                  <div className="flex justify-center my-4">
                     <div className="bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-indigo-100">
                       {msg.text}
                     </div>
                  </div>
                ) : msg.text === '[ACTION:SHARE_PROFILE]' ? (
                  /* Handle Rich Action Cards */
                   <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                     <div className="w-full max-w-[85%] bg-white border-2 border-indigo-100 rounded-3xl p-4 shadow-md">
                       <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                           <User size={20} />
                         </div>
                         <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Tutor Profile Shared</p>
                           <p className="text-[13px] font-black text-slate-800">{connection.tutorName}</p>
                         </div>
                       </div>
                       <button onClick={() => { playTapSound(); window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'tutors' })); }} className="w-full py-2.5 bg-indigo-50 text-indigo-700 font-bold text-[12px] rounded-xl active:scale-95 transition-all">
                         View Full Profile
                       </button>
                       <div className={cn("text-[8px] mt-2 font-bold uppercase tracking-tighter opacity-40", isMe ? "text-right" : "text-left")}>
                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </div>
                     </div>
                   </div>
                ) : msg.text === '[ACTION:SHARE_JOB]' ? (
                   <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                     <div className="w-full max-w-[85%] bg-white border-2 border-amber-100 rounded-3xl p-4 shadow-md">
                       <div className="flex items-center gap-3 mb-3">
                         <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                           <MessageSquare size={20} />
                         </div>
                         <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Requirement Shared</p>
                           <p className="text-[13px] font-black text-slate-800">{connection.parentName}</p>
                         </div>
                       </div>
                       <button onClick={() => { playTapSound(); window.dispatchEvent(new CustomEvent('navigateToTab', { detail: 'jobs' })); }} className="w-full py-2.5 bg-amber-50 text-amber-700 font-bold text-[12px] rounded-xl active:scale-95 transition-all">
                         View Requirement Details
                       </button>
                       <div className={cn("text-[8px] mt-2 font-bold uppercase tracking-tighter opacity-40", isMe ? "text-right" : "text-left")}>
                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </div>
                     </div>
                   </div>
                ) : msg.text.startsWith('[ACTION:SHARE_LOCATION') ? (
                   (() => {
                     const parts = msg.text.split('|');
                     const coords = parts.length > 1 ? parts[1].replace(']', '') : null;
                     const mapsLink = coords ? `https://www.google.com/maps?q=${coords}` : '#';
                     
                     return (
                       <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                         <div className="w-full max-w-[85%] bg-white border-2 border-emerald-100 rounded-3xl p-4 shadow-md">
                           <div className="flex items-center gap-3 mb-3">
                             <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500">
                               <MapPin size={20} />
                             </div>
                             <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Location Shared</p>
                               <p className="text-[13px] font-black text-slate-800">{isMe ? 'You' : (isTutor ? connection.parentName : connection.tutorName)} shared a location</p>
                             </div>
                           </div>
                           <button onClick={() => { playTapSound(); window.open(mapsLink, '_system'); }} className="w-full py-2.5 bg-emerald-50 text-emerald-700 font-bold text-[12px] rounded-xl active:scale-95 transition-all">
                             Open in Google Maps
                           </button>
                           <div className={cn("text-[8px] mt-2 font-bold uppercase tracking-tighter opacity-40", isMe ? "text-right" : "text-left")}>
                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </div>
                         </div>
                       </div>
                     );
                   })()
                ) : (
                  <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] p-3.5 rounded-[22px] text-[13px] font-[600] shadow-sm",
                      isMe 
                        ? "bg-indigo-600 text-white rounded-tr-none" 
                        : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                    )}>
                      {msg.text}
                      <div className={cn("text-[8px] mt-1 font-bold uppercase tracking-tighter opacity-60", isMe ? "text-right" : "text-left")}>
                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Dynamic Footer Area (Input vs Accept/Reject) */}
      <div className="p-3 bg-white border-t border-slate-100">
        {isRejected ? (
          <div className="py-4 text-center">
            <p className="text-[12px] font-black text-rose-500 uppercase tracking-widest">Request Declined</p>
            <p className="text-[10px] font-bold text-slate-400 mt-1">You cannot send messages to this user.</p>
          </div>
        ) : isPending ? (
          isTutor ? (
            // Tutor Action Box
            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
                Do you want to accept this request?
              </p>
              <div className="flex items-center gap-3">
                <button
                  disabled={isProcessing}
                  onClick={async () => {
                    playTapSound();
                    setIsProcessing(true);
                    await onHandleConnection(connection.id, 'accepted');
                    setIsProcessing(false);
                  }}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-[20px] text-[11px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle size={15} /> Accept
                </button>
                <button
                  disabled={isProcessing}
                  onClick={async () => {
                    playTapSound();
                    setIsProcessing(true);
                    await onHandleConnection(connection.id, 'rejected');
                    setIsProcessing(false);
                  }}
                  className="flex-1 bg-rose-50 text-rose-600 border border-rose-200 py-3 rounded-[20px] text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <X size={15} /> Reject
                </button>
              </div>
            </div>
          ) : (
            // Parent Waiting State
            <div className="py-4 flex items-center justify-center gap-2 text-amber-600 bg-amber-50 rounded-[20px] border border-amber-100">
              <Clock size={16} />
              <p className="text-[10px] font-black uppercase tracking-widest">Waiting for Tutor to Accept</p>
            </div>
          )
        ) : (
          // Normal Chat Input
          <div className="flex flex-col gap-2">
            {/* Quick Actions Bar */}
            <div className="flex flex-nowrap items-center gap-1 px-2 pb-1 overflow-x-auto no-scrollbar">
              {isTutor && (
                <button 
                  onClick={() => { playTapSound(); sendMessage('[ACTION:SHARE_PROFILE]', currentUserId); }}
                  className="shrink-0 bg-indigo-600 text-white shadow-sm px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all"
                >
                  <User size={11} /> Profile
                </button>
              )}
              {!isTutor && (
                <button 
                  onClick={() => { playTapSound(); sendMessage('[ACTION:SHARE_JOB]', currentUserId); }}
                  className="shrink-0 bg-amber-600 text-white shadow-sm px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all"
                >
                  <MessageSquare size={11} /> Requirement
                </button>
              )}
              <button 
                onClick={handleShareLocation}
                className="shrink-0 bg-emerald-600 text-white shadow-sm px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all"
              >
                <MapPin size={11} /> Location
              </button>
              <button 
                onClick={handleShareContact}
                className="shrink-0 bg-blue-600 text-white shadow-sm px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all"
              >
                <Phone size={11} /> Phone
              </button>
              <button 
                disabled={isProcessing}
                onClick={handleCloseChat}
                className="shrink-0 bg-slate-800 text-white shadow-sm px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1 active:scale-95 transition-all disabled:opacity-50"
              >
                <X size={11} strokeWidth={3} /> Close
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type your message..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] py-3 px-4 text-[13px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  />
              </div>
              <button 
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50 disabled:scale-100"
              >
                <Send size={16} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

