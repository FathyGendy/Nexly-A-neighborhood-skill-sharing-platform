import React, { useEffect, useState, useRef } from 'react';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { getChatHistory, uploadChatAttachment, translateMessage } from '../api/client';
import { 
    Send, X, MessageCircle, Loader2, Paperclip, Mic, StopCircle, 
    Video, Languages, FileText, Phone, PhoneOff, MicOff, Camera, CameraOff, Download,
    MoreVertical, Trash2, Edit2, PhoneIncoming, PhoneMissed
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ChatWindowProps {
  bookingId: number;
  onClose: () => void;
  bookingStatus?: string;
}

interface Message {
  id: number;
  senderId: string;
  content: string;
  timestamp: string;
  isMine: boolean;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file' | 'audio';
  fileName?: string;
  isDeleted?: boolean;
  isEdited?: boolean;
  isSystemMessage?: boolean;
}

const RTC_CONFIG = {
    iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }]
};

const ChatWindow: React.FC<ChatWindowProps> = ({ bookingId, onClose }) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);

  // Edit/Delete State
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [translatedMsgId, setTranslatedMsgId] = useState<number | null>(null);
  const [translatedText, setTranslatedText] = useState<string>("");

  const [callStatus, setCallStatus] = useState<'idle' | 'incoming' | 'outgoing' | 'connected'>('idle');
  
  // FIX: Use Refs for streams to ensure cleanup works inside event listeners
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  
  // State for rendering video elements
  const [localStreamState, setLocalStreamState] = useState<MediaStream | null>(null);
  const [remoteStreamState, setRemoteStreamState] = useState<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getToken = () => localStorage.getItem('token');
  const getCurrentUserId = () => {
    const token = getToken();
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.nameid || payload.sub; 
    } catch (e) { return ''; }
  };
  const currentUserId = getCurrentUserId();
  const isMessageMine = (msgSenderId: string) => msgSenderId?.toLowerCase() === currentUserId?.toLowerCase();

  // 1. Initial Load
  useEffect(() => {
    setIsLoading(true);
    getChatHistory(bookingId)
      .then((data) => { if (Array.isArray(data)) setMessages(data); })
      .catch(console.error)
      .finally(() => setIsLoading(false));

    // FIX: Dynamic URL selection (Production vs Local)
    const hubUrl = import.meta.env.PROD 
        ? "/hubs/chat" 
        : "http://localhost:5002/hubs/chat";

    const newConnection = new HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => getToken() || '' })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    // Cleanup on unmount
    return () => {
        endCallCleanup();
    };
  }, [bookingId]);

  // 2. SignalR Event Listeners
  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => connection.invoke('JoinBookingGroup', bookingId.toString()))
        .catch(console.error);

      connection.on('ReceiveMessage', (msg: any) => {
        setMessages((prev) => [...prev, {
          id: msg.id,
          senderId: msg.senderId,
          content: msg.content,
          timestamp: msg.timestamp,
          isMine: isMessageMine(msg.senderId),
          attachmentUrl: msg.attachmentUrl,
          attachmentType: msg.attachmentType,
          fileName: msg.fileName,
          isSystemMessage: msg.isSystemMessage,
          isDeleted: msg.isDeleted,
          isEdited: msg.isEdited
        }]);
      });

      connection.on('MessageUpdated', (data: any) => {
          setMessages(prev => prev.map(m => m.id === data.id ? { ...m, content: data.content, isEdited: true } : m));
      });

      connection.on('MessageDeleted', (id: number) => {
          setMessages(prev => prev.map(m => m.id === id ? { ...m, isDeleted: true, content: "This message was deleted", attachmentUrl: undefined } : m));
      });

      connection.on('ActiveUsers', (activeUserIds: string[]) => {
          const isOtherHere = activeUserIds.some(id => id.toLowerCase() !== currentUserId?.toLowerCase());
          setIsPartnerOnline(isOtherHere);
      });

      // FIX: Ensure this triggers the cleanup function correctly
      connection.on('CallEnded', () => {
          endCallCleanup();
          toast("Call ended", { icon: '📞' });
      });

      connection.on('ReceiveSignal', async (data: any) => {
        if (!peerConnection.current && data.type === 'offer') {
             setCallStatus('incoming');
             (window as any).pendingOffer = data;
        } 
        else if (peerConnection.current) {
            try {
                if (data.type === 'answer') await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data));
                else if (data.candidate) await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (err) { console.error("Signaling error", err); }
        }
      });
    }

    return () => {
      if (connection) {
        connection.invoke('LeaveBookingGroup', bookingId.toString()).catch(() => {});
        connection.off('ReceiveMessage');
        connection.off('ActiveUsers');
        connection.off('ReceiveSignal');
        connection.off('CallEnded');
        connection.off('MessageUpdated');
        connection.off('MessageDeleted');
        connection.stop();
      }
      endCallCleanup();
    };
  }, [connection, bookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, translatedText]);

  const handleDownload = async (url: string, filename: string) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) { toast.error("Download failed"); }
  };

  // --- WEBRTC ---
  const createPeerConnection = () => {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      pc.onicecandidate = (event) => {
          if (event.candidate && connection) connection.invoke('SendSignal', bookingId.toString(), { candidate: event.candidate });
      };
      pc.ontrack = (event) => {
          // Update ref and state
          const stream = event.streams[0];
          remoteStreamRef.current = stream;
          setRemoteStreamState(stream); 
          setCallStatus('connected');
      };
      return pc;
  };

  const startCall = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          // Set Ref AND State
          localStreamRef.current = stream;
          setLocalStreamState(stream);
          
          setCallStatus('outgoing');
          peerConnection.current = createPeerConnection();
          stream.getTracks().forEach(track => peerConnection.current?.addTrack(track, stream));
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          if (connection) await connection.invoke('SendSignal', bookingId.toString(), offer);
      } catch (err) { toast.error("Could not access camera/mic"); }
  };

  const acceptCall = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          localStreamRef.current = stream;
          setLocalStreamState(stream);
          
          const pc = createPeerConnection();
          peerConnection.current = pc;
          stream.getTracks().forEach(track => pc.addTrack(track, stream));
          const offer = (window as any).pendingOffer;
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          setCallStatus('connected');
          if (connection) await connection.invoke('SendSignal', bookingId.toString(), answer);
      } catch (err) { toast.error("Error accepting call"); }
  };

  const rejectCall = async () => {
      if (connection) {
          await connection.invoke('EndVideoCall', bookingId.toString(), "Missed video call");
      }
      endCallCleanup();
  };

  const endCall = async () => {
      endCallCleanup(); // Stop local immediately
      if (connection) {
          await connection.invoke('EndVideoCall', bookingId.toString(), "Video call ended");
      }
  };

  // FIX: Cleanup function uses Refs to guarantee access to the stream tracks
  const endCallCleanup = () => {
      // 1. Stop Local Tracks
      if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => {
              track.stop();
              track.enabled = false;
          });
          localStreamRef.current = null;
      }

      // 2. Stop Remote Tracks (just in case)
      if (remoteStreamRef.current) {
          remoteStreamRef.current.getTracks().forEach(track => track.stop());
          remoteStreamRef.current = null;
      }
      
      // 3. Close PC
      if (peerConnection.current) {
          peerConnection.current.close();
          peerConnection.current = null;
      }
      
      // 4. Reset State
      setLocalStreamState(null);
      setRemoteStreamState(null);
      setCallStatus('idle');
      setIsMuted(false);
      setIsCameraOff(false);
      (window as any).pendingOffer = null;
  };

  const toggleMute = () => {
      if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !t.enabled);
          setIsMuted(!isMuted);
      }
  };

  const toggleCamera = () => {
      if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach(t => t.enabled = !t.enabled);
          setIsCameraOff(!isCameraOff);
      }
  };

  useEffect(() => {
      // Re-attach streams to video elements on state change
      if (localVideoRef.current && localStreamState) localVideoRef.current.srcObject = localStreamState;
      if (remoteVideoRef.current && remoteStreamState) remoteVideoRef.current.srcObject = remoteStreamState;
  }, [localStreamState, remoteStreamState, callStatus]);


  // --- MESSAGE ACTIONS ---
  const handleEdit = (msg: Message) => {
      setEditingMsgId(msg.id);
      setEditContent(msg.content);
      setActiveMenuId(null);
  };

  const submitEdit = async () => {
      if (connection && editingMsgId) {
          await connection.invoke('EditMessage', bookingId.toString(), editingMsgId, editContent);
          setEditingMsgId(null);
          setEditContent('');
      }
  };

  const handleDelete = (id: number) => {
      setActiveMenuId(null);
      toast((t) => (
        <div className="flex flex-col items-start gap-2 min-w-[180px] dark:text-gray-100">
          <p className="font-semibold text-gray-800 dark:text-white text-sm">Unsend this message?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
          
          <div className="flex gap-2 mt-2 w-full">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                if (connection) {
                   await connection.invoke('DeleteMessage', bookingId.toString(), id);
                }
              }}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-colors"
            >
              Unsend
            </button>
          </div>
        </div>
      ), {
        duration: 5000,
        position: 'top-center',
        className: 'dark:bg-gray-800 dark:text-white dark:border-gray-700', // Handled by library if supported, else inline styles below apply
        style: {
            borderRadius: '16px',
            // Default light style, dark mode overrides will need className support in toast lib or CSS var
            // We use standard CSS to allow dark mode if the toast library supports the parent class
            padding: '16px',
        }
      });
  };

  const sendMessage = async (content: string, attUrl?: string, attType?: string, fName?: string) => {
    if (connection) {
      try {
        await connection.invoke('SendMessage', bookingId.toString(), content, attUrl, attType, fName);
        setNewMessage('');
      } catch (e) { toast.error("Failed to send"); }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) { toast.error("File limit is 10MB."); return; }
      const toastId = toast.loading("Uploading...");
      try {
        const url = await uploadChatAttachment(file);
        let type = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        if (file.type.startsWith('audio/')) type = 'audio';
        await sendMessage("", url, type, file.name);
        toast.success("Sent!", { id: toastId });
      } catch (error) { toast.error("Upload failed", { id: toastId }); }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 5 * 1024 * 1024) { toast.error("Voice message max 5MB."); return; }
        const toastId = toast.loading("Sending voice...");
        try {
          const url = await uploadChatAttachment(audioBlob, "voice-message.webm");
          await sendMessage("", url, "audio", "Voice Message");
          toast.success("Sent!", { id: toastId });
        } catch (error) { toast.error("Failed to send", { id: toastId }); }
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      timerRef.current = window.setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) { toast.error("Microphone access denied"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleTranslate = async (text: string, index: number) => {
    if (!text) return;
    const toastId = toast.loading("Translating to English...");
    try {
      const result = await translateMessage(text);
      setTranslatedText(result);
      setTranslatedMsgId(index);
      toast.dismiss(toastId);
    } catch (error) { toast.error("Translation failed", { id: toastId }); }
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- RENDER ---
  return (
    <>
    {callStatus !== 'idle' && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center animate-in fade-in">
            {callStatus === 'incoming' && (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl text-center animate-bounce-short">
                    <h3 className="text-xl font-bold mb-4 dark:text-white">Incoming Video Call...</h3>
                    <div className="flex gap-4 justify-center">
                        <button onClick={acceptCall} className="bg-green-500 p-4 rounded-full text-white hover:bg-green-600 transition shadow-lg"><Phone size={32} /></button>
                        <button onClick={rejectCall} className="bg-red-500 p-4 rounded-full text-white hover:bg-red-600 transition shadow-lg"><PhoneOff size={32} /></button>
                    </div>
                </div>
            )}
            {callStatus === 'outgoing' && (
                <div className="text-white text-center">
                    <div className="w-24 h-24 rounded-full bg-gray-700 animate-pulse mx-auto mb-4 flex items-center justify-center"><Loader2 size={40} className="animate-spin" /></div>
                    <p className="text-lg font-medium">Calling...</p>
                    <button onClick={endCall} className="mt-8 bg-red-500 p-3 rounded-full hover:bg-red-600"><PhoneOff size={24} /></button>
                </div>
            )}
            {callStatus === 'connected' && (
                <div className="relative w-full h-full flex items-center justify-center">
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute top-4 right-4 w-32 h-48 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute bottom-8 flex gap-4 bg-black/50 backdrop-blur-md p-4 rounded-full">
                        <button onClick={toggleMute} className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-600 hover:bg-gray-500'}`}>{isMuted ? <MicOff size={24} color="white" /> : <Mic size={24} color="white" />}</button>
                        <button onClick={endCall} className="p-3 rounded-full bg-red-600 hover:bg-red-700"><PhoneOff size={24} color="white" /></button>
                        <button onClick={toggleCamera} className={`p-3 rounded-full ${isCameraOff ? 'bg-red-500' : 'bg-gray-600 hover:bg-gray-500'}`}>{isCameraOff ? <CameraOff size={24} color="white" /> : <Camera size={24} color="white" />}</button>
                    </div>
                </div>
            )}
        </div>
    )}

    {/* MAIN CHAT WINDOW CONTAINER with Dark Mode Classes */}
    <div className="fixed bottom-6 right-6 w-[380px] h-[600px] flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-[24px] shadow-2xl border border-white/20 dark:border-gray-700 overflow-hidden z-50 font-sans animate-in slide-in-from-bottom-8 duration-500 ring-1 ring-black/5 dark:ring-white/5">
      
      {/* HEADER */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-4 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="relative">
             <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md"><MessageCircle size={22} /></div>
             <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 transition-colors duration-300 ${isPartnerOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-[15px]">Nexly Chat</h3>
            <span className={`text-xs font-medium transition-colors ${isPartnerOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>{isPartnerOnline ? 'Online now' : 'Offline'}</span>
          </div>
        </div>
        <div className="flex gap-1">
            <button onClick={startCall} disabled={!isPartnerOnline} className={`p-2.5 rounded-xl transition-all ${isPartnerOnline ? 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:bg-gray-800' : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'}`}><Video size={20} /></button>
            <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><X size={20} /></button>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 flex flex-col bg-[#F3F4F6] dark:bg-gray-950">
        {isLoading && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>}
        {messages.map((msg, index) => {
            // SYSTEM MESSAGE
            if (msg.isSystemMessage) {
                return (
                    <div key={index} className="flex justify-center my-4 opacity-70">
                        <div className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-gray-300 dark:border-gray-700">
                           {msg.content.includes("Missed") ? <PhoneMissed size={12}/> : <PhoneIncoming size={12}/>}
                           {msg.content} - {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                );
            }

            // REGULAR MESSAGE
            return (
              <div key={index} className={`flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 ${msg.isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                <div className={`px-4 py-3 shadow-sm text-[15px] leading-relaxed break-words relative transition-all hover:shadow-md group/bubble ${msg.isMine ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-2xl rounded-tr-sm' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm'}`}>
                    
                    {/* EDIT MODE */}
                    {editingMsgId === msg.id ? (
                        <div className="flex gap-2 items-center">
                            <input autoFocus value={editContent} onChange={(e) => setEditContent(e.target.value)} className="text-black dark:text-white dark:bg-gray-700 rounded px-1 py-0.5 text-sm w-full outline-none" />
                            <button onClick={submitEdit} className="text-xs bg-white/20 hover:bg-white/40 rounded px-2 py-1">Save</button>
                            <button onClick={() => setEditingMsgId(null)} className="text-xs hover:text-red-200">X</button>
                        </div>
                    ) : (
                        <>
                            {msg.isDeleted ? <p className="italic text-sm opacity-70 flex items-center gap-1"><Trash2 size={12}/> {msg.content}</p> : msg.content && <p className="mb-1 tracking-wide text-sm">{msg.content} {msg.isEdited && <span className="text-[10px] opacity-60 italic ml-1">(edited)</span>}</p>}
                            
                            {/* ATTACHMENTS */}
                            {!msg.isDeleted && msg.attachmentType === 'image' && (
                                <div className="relative group">
                                    <img src={msg.attachmentUrl} alt="attachment" className="w-56 h-auto rounded-lg mt-1 border border-black/5" />
                                    <button onClick={() => handleDownload(msg.attachmentUrl!, msg.fileName || 'image.jpg')} className="absolute bottom-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Download size={14} /></button>
                                </div>
                            )}
                            {!msg.isDeleted && msg.attachmentType === 'audio' && (
                                <div className={`mt-1 flex items-center gap-2 p-2 rounded-lg ${msg.isMine ? 'bg-white/10' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                    <audio controls src={msg.attachmentUrl} className="h-8 w-48" />
                                </div>
                            )}
                            {!msg.isDeleted && msg.attachmentType === 'file' && (
                                <a href={msg.attachmentUrl} onClick={(e) => { e.preventDefault(); handleDownload(msg.attachmentUrl!, msg.fileName || 'file'); }} className={`flex items-center gap-2 mt-1 p-2 rounded-lg ${msg.isMine ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600'}`}>
                                    <FileText size={18} />
                                    <span className="truncate max-w-[150px] text-xs font-medium underline">{msg.fileName || "File"}</span>
                                    <Download size={14} />
                                </a>
                            )}
                        </>
                    )}

                    {/* CONTEXT MENU TRIGGER */}
                    {msg.isMine && !msg.isDeleted && new Date().getTime() - new Date(msg.timestamp).getTime() < 15 * 60 * 1000 && (
                        <button onClick={() => setActiveMenuId(activeMenuId === msg.id ? null : msg.id)} className="absolute -top-2 -left-2 p-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full opacity-0 group-hover/bubble:opacity-100 transition-opacity shadow-sm z-10">
                            <MoreVertical size={12} />
                        </button>
                    )}

                    {/* MENU DROPDOWN */}
                    {activeMenuId === msg.id && (
                        <div className="absolute top-0 -left-20 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-lg py-1 w-24 z-50 text-gray-700 dark:text-gray-200 animate-in fade-in zoom-in-95">
                            <button onClick={() => handleEdit(msg)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-2"><Edit2 size={12} /> Edit</button>
                            <button onClick={() => handleDelete(msg.id)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 text-red-500 flex items-center gap-2"><Trash2 size={12} /> Unsend</button>
                        </div>
                    )}

                    {translatedMsgId === index && <div className={`mt-2 pt-2 border-t text-xs italic ${msg.isMine ? 'border-white/20 text-blue-50' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}>{translatedText}</div>}
                </div>
                <div className="flex items-center gap-2 mt-1.5 px-1">
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {!msg.isMine && msg.content && !msg.isDeleted && <button onClick={() => handleTranslate(msg.content, index)} className="text-[10px] font-semibold text-blue-500 hover:text-blue-700 flex items-center gap-1 bg-blue-50 dark:bg-gray-800 dark:text-blue-400 px-1.5 py-0.5 rounded-full"><Languages size={10} /> Translate</button>}
                </div>
              </div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 relative z-20">
        <div className="relative flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-full border border-gray-200 dark:border-gray-700 focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all duration-300">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf,.doc,.docx,audio/*" />
            <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-all"><Paperclip size={18} /></button>
            <button onClick={isRecording ? stopRecording : startRecording} className={`p-2.5 rounded-full transition-all ${isRecording ? 'text-red-500 bg-red-50 animate-pulse shadow-inner' : 'text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-700'}`}>{isRecording ? <StopCircle size={18} /> : <Mic size={18} />}</button>
            {isRecording ? <div className="flex-1 text-center text-sm font-mono text-red-500 font-bold">{formatTime(recordingTime)}</div> : <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage(newMessage)} placeholder="Type a message..." className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none text-sm px-1" />}
            {!isRecording && <button onClick={() => sendMessage(newMessage)} disabled={!newMessage.trim()} className={`p-2.5 rounded-full transition-all transform ${newMessage.trim() ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:scale-105' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-default'}`}><Send size={16} fill={newMessage.trim() ? "currentColor" : "none"} /></button>}
        </div>
      </div>
    </div>
    </>
  );
};

export default ChatWindow;