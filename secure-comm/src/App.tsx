import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Chat from './components/Chat';
import VideoCall from './components/VideoCall';
import { Peer, Message, CallSignal, CallHistoryEntry } from './types';

export interface CallParticipant {
  id: string;
  alias: string;
  status: 'connecting' | 'connected' | 'on-hold';
  stream?: MediaStream | null;
}

export interface CallSession {
  roomId: string;
  isVideo: boolean;
  status: 'incoming' | 'outgoing' | 'connected' | 'on-hold';
  initiator?: { id: string, alias: string };
  participants: CallParticipant[];
}

export default function App() {
  const [localPeer, setLocalPeer] = useState<Peer | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [activeChat, setActiveChat] = useState<Peer | null>(null);
  const activeChatRef = useRef<Peer | null>(null);
  useEffect(() => {
    activeChatRef.current = activeChat;
    if (activeChat) {
      setUnreadMessages(prev => {
        const next = { ...prev };
        delete next[activeChat.id];
        return next;
      });
    }
  }, [activeChat]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({});
  const incomingFilesRef = useRef<Record<string, { chunks: string[], received: number, total: number, fileName: string, fileType: string, from: string }>>({});
  const [callHistory, setCallHistory] = useState<CallHistoryEntry[]>([]);
  
  // Call State
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [heldCall, setHeldCall] = useState<CallSession | null>(null);
  const [pendingCall, setPendingCall] = useState<CallSession | null>(null);
  
  const activeCallRef = useRef<CallSession | null>(null);
  const pendingCallRef = useRef<CallSession | null>(null);
  const heldCallRef = useRef<CallSession | null>(null);
  
  const iceCandidateBatchRef = useRef<Map<string, RTCIceCandidate[]>>(new Map());
  const iceCandidateTimerRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    pendingCallRef.current = pendingCall;
  }, [pendingCall]);

  useEffect(() => {
    heldCallRef.current = heldCall;
  }, [heldCall]);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [callNotification, setCallNotification] = useState<string | null>(null);

  // Refs for WebRTC and Supabase Channel
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const iceCandidateQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  
  // WebRTC Data Channels for File Transfer
  const dataPcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map());

  useEffect(() => {
    const savedAlias = localStorage.getItem('monix_alias');
    const savedId = localStorage.getItem('monix_id');
    if (savedAlias && savedId) {
      setLocalPeer({ id: savedId, alias: savedAlias });
    }
    // Zero-log mode: Do not load call history from localStorage
  }, []);

  const handleIncomingMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
    if (activeChatRef.current?.id !== msg.from) {
      setUnreadMessages(prev => ({
        ...prev,
        [msg.from]: (prev[msg.from] || 0) + 1
      }));
    }
  };

  const addCallHistory = (peerId: string, peerAlias: string, type: 'incoming' | 'outgoing' | 'missed') => {
    const entry: CallHistoryEntry = {
      id: uuidv4(),
      peerId,
      peerAlias,
      type,
      timestamp: Date.now()
    };
    setCallHistory(prev => {
      const next = [entry, ...prev].slice(0, 50);
      return next;
    });
  };

  const handleLogin = (alias: string) => {
    const id = uuidv4();
    localStorage.setItem('monix_alias', alias);
    localStorage.setItem('monix_id', id);
    setLocalPeer({ id, alias });
  };

  // Global Channel for Presence and WebRTC Signaling
  useEffect(() => {
    if (!localPeer) return;

    const channel = supabase.channel('monix-secure-comm', {
      config: {
        presence: { key: localPeer.id },
        broadcast: { self: false }
      }
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlinePeers: Peer[] = [];
        for (const id in state) {
          if (id !== localPeer.id) {
            // @ts-ignore
            onlinePeers.push({ id, alias: state[id][0].alias });
          }
        }
        setPeers(onlinePeers);
      })
      .on('broadcast', { event: 'private_msg' }, ({ payload }) => {
        const msg = payload as Message;
        if (msg.to === localPeer.id) {
          handleIncomingMessage(msg);
        }
      })
      .on('broadcast', { event: 'file_chunk' }, ({ payload }) => {
        if (payload.to !== localPeer.id) return;
        
        const { fileId, chunkIndex, totalChunks, chunk, fileName, fileType, from } = payload;
        
        if (!incomingFilesRef.current[fileId]) {
          incomingFilesRef.current[fileId] = {
            chunks: new Array(totalChunks).fill(''),
            received: 0,
            total: totalChunks,
            fileName,
            fileType,
            from
          };
        }
        
        const fileData = incomingFilesRef.current[fileId];
        if (!fileData.chunks[chunkIndex]) {
          fileData.chunks[chunkIndex] = chunk;
          fileData.received++;
          
          setFileProgress(prev => ({
            ...prev,
            [fileId]: Math.round((fileData.received / totalChunks) * 100)
          }));
          
          if (fileData.received === totalChunks) {
            const base64String = fileData.chunks.join('');
            const newMessage: Message = {
              id: fileId,
              from: fileData.from,
              to: localPeer.id,
              content: `Received file: ${fileName}`,
              timestamp: Date.now(),
              status: 'delivered',
              imageBase64: base64String,
              fileName
            };
            handleIncomingMessage(newMessage);
            
            setFileProgress(prev => {
              const next = { ...prev };
              delete next[fileId];
              return next;
            });
            delete incomingFilesRef.current[fileId];
          }
        }
      })
      .on('broadcast', { event: 'webrtc_data_signal' }, async ({ payload }) => {
        const signal = payload;
        if (signal.to !== localPeer.id) return;
        
        let pc = dataPcsRef.current.get(signal.from);
        if (!pc) {
          pc = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          });
          dataPcsRef.current.set(signal.from, pc);
          
          pc.onicecandidate = (event) => {
            if (event.candidate && localPeer && channelRef.current) {
              channelRef.current.send({
                type: 'broadcast',
                event: 'webrtc_data_signal',
                payload: {
                  type: 'ice-candidate',
                  from: localPeer.id,
                  to: signal.from,
                  payload: { candidate: event.candidate }
                }
              });
            }
          };
          
          pc.ondatachannel = (event) => {
            setupDataChannel(event.channel, signal.from);
          };
        }

        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channelRef.current?.send({
            type: 'broadcast',
            event: 'webrtc_data_signal',
            payload: {
              type: 'answer',
              from: localPeer.id,
              to: signal.from,
              payload: { answer }
            }
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload.answer));
        } else if (signal.type === 'ice-candidate') {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.payload.candidate));
          } catch (e) {
            console.error('Error adding data ice candidate', e);
          }
        }
      })
      .on('broadcast', { event: 'webrtc_signal' }, async ({ payload }) => {
        const signal = payload as CallSignal;
        if (signal.to !== localPeer.id) return;
        handleSignalingData(signal);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ alias: localPeer.alias, online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.unsubscribe();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      pcsRef.current.forEach(pc => pc.close());
      pcsRef.current.clear();
      remoteStreamsRef.current.clear();
    };
  }, [localPeer]);

  const updateParticipantStream = (peerId: string, stream: MediaStream) => {
    setActiveCall(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants.map(p => p.id === peerId ? { ...p, stream } : p)
      };
    });
  };

  const updateParticipantStatus = (peerId: string, status: 'connecting' | 'connected' | 'on-hold') => {
    setActiveCall(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants.map(p => p.id === peerId ? { ...p, status } : p)
      };
    });
  };

  const removeParticipant = (peerId: string, reason?: string) => {
    let shouldEndCall = false;
    let peerName = 'Peer';
    
    setActiveCall(prev => {
      if (!prev) return prev;
      const participant = prev.participants.find(p => p.id === peerId);
      if (participant) peerName = participant.alias;
      
      const nextParticipants = prev.participants.filter(p => p.id !== peerId);
      if (nextParticipants.length === 0) {
        shouldEndCall = true;
        return prev; // Return prev temporarily, we will clear it in endCallLocally
      }
      return { ...prev, participants: nextParticipants };
    });

    if (shouldEndCall) {
      showCallNotification(`Call disconnected (${reason || peerName + ' left'})`);
      // Use setTimeout to ensure this runs after the current render cycle
      setTimeout(() => {
        endCallLocally();
      }, 0);
    } else {
      showCallNotification(`${peerName} ${reason || 'left the call'}`);
    }
  };

  // Adaptive Bitrate logic needs to loop over all pcsRef
  useEffect(() => {
    if (!activeCall || activeCall.status !== 'connected') return;

    const interval = setInterval(async () => {
      pcsRef.current.forEach(async (pc, peerId) => {
        try {
          const stats = await pc.getStats();
          let packetLoss = 0;
          let rtt = 0;

          stats.forEach(report => {
            if (report.type === 'inbound-rtp' && report.kind === 'video') {
              packetLoss = report.packetsLost / (report.packetsReceived + report.packetsLost || 1);
            }
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              rtt = report.currentRoundTripTime;
            }
          });

          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video');
          if (videoSender && videoSender.track) {
            const params = videoSender.getParameters();
            if (!params.encodings) params.encodings = [{}];
            
            let needsUpdate = false;
            // Enhance adaptive bitrate: adjust maxFramerate as well
            if (packetLoss > 0.05 || rtt > 0.2) {
              if (params.encodings[0].scaleResolutionDownBy !== 2) {
                params.encodings[0].scaleResolutionDownBy = 2;
                params.encodings[0].maxBitrate = 250000;
                params.encodings[0].maxFramerate = 15; // lower framerate
                needsUpdate = true;
              }
            } else {
              if (params.encodings[0].scaleResolutionDownBy !== 1) {
                params.encodings[0].scaleResolutionDownBy = 1;
                params.encodings[0].maxBitrate = 1000000;
                params.encodings[0].maxFramerate = 30; // restore framerate
                needsUpdate = true;
              }
            }
            
            if (needsUpdate) {
              await videoSender.setParameters(params);
            }
          }
        } catch (e) {
          console.error('Error checking stats', e);
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [activeCall]);

  // Handle read receipts
  useEffect(() => {
    if (!activeChat || !localPeer || !channelRef.current) return;
    
    const unreadMessages = messages.filter(m => m.from === activeChat.id && m.to === localPeer.id && m.status !== 'read');
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(m => m.id);
      
      setMessages(prev => prev.map(m => messageIds.includes(m.id) ? { ...m, status: 'read' } : m));
      
      channelRef.current.send({
        type: 'broadcast',
        event: 'webrtc_signal',
        payload: {
          type: 'read-receipt',
          from: localPeer.id,
          to: activeChat.id,
          payload: { messageIds }
        }
      });
    }
  }, [messages, activeChat, localPeer]);

  useEffect(() => {
    if (activeChat && localPeer) {
      initiateDataConnection(activeChat.id);
    }
  }, [activeChat, localPeer]);

  const setupDataChannel = (dc: RTCDataChannel, peerId: string) => {
    dc.bufferedAmountLowThreshold = 512 * 1024;
    dataChannelsRef.current.set(peerId, dc);
    
    dc.onopen = () => console.log('Data channel open with', peerId);
    dc.onclose = () => {
      console.log('Data channel closed with', peerId);
      dataChannelsRef.current.delete(peerId);
      dataPcsRef.current.delete(peerId);
    };
    
    dc.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'file-start') {
        incomingFilesRef.current[data.fileId] = {
          chunks: new Array(data.totalChunks).fill(''),
          received: 0,
          total: data.totalChunks,
          fileName: data.fileName,
          fileType: data.fileType,
          from: peerId
        };
      } else if (data.type === 'file-chunk') {
        const fileData = incomingFilesRef.current[data.fileId];
        if (fileData && !fileData.chunks[data.chunkIndex]) {
          fileData.chunks[data.chunkIndex] = data.chunk;
          fileData.received++;
          
          setFileProgress(prev => ({
            ...prev,
            [data.fileId]: Math.round((fileData.received / fileData.total) * 100)
          }));
        }
      } else if (data.type === 'file-end') {
        const fileData = incomingFilesRef.current[data.fileId];
        if (fileData) {
          const base64String = fileData.chunks.join('');
          const newMessage: Message = {
            id: data.fileId,
            from: fileData.from,
            to: localPeer!.id,
            content: `Received file: ${fileData.fileName}`,
            timestamp: Date.now(),
            status: 'delivered',
            imageBase64: base64String,
            fileName: fileData.fileName
          };
          handleIncomingMessage(newMessage);
          
          setFileProgress(prev => {
            const next = { ...prev };
            delete next[data.fileId];
            return next;
          });
          delete incomingFilesRef.current[data.fileId];
        }
      }
    };
  };

  const initiateDataConnection = async (peerId: string) => {
    if (dataPcsRef.current.has(peerId)) return;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    dataPcsRef.current.set(peerId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate && localPeer && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'webrtc_data_signal',
          payload: {
            type: 'ice-candidate',
            from: localPeer.id,
            to: peerId,
            payload: { candidate: event.candidate }
          }
        });
      }
    };

    pc.ondatachannel = (event) => {
      setupDataChannel(event.channel, peerId);
    };

    // To avoid glare, only the peer with the smaller ID creates the offer
    if (localPeer!.id < peerId) {
      const dc = pc.createDataChannel('fileTransfer');
      setupDataChannel(dc, peerId);
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      channelRef.current?.send({
        type: 'broadcast',
        event: 'webrtc_data_signal',
        payload: {
          type: 'offer',
          from: localPeer!.id,
          to: peerId,
          payload: { offer }
        }
      });
    }
  };

  const handleSendMessage = (content: string, imageBase64?: string, fileName?: string) => {
    if (!localPeer || !activeChat || !channelRef.current) return;

    const newMessage: Message = {
      id: uuidv4(),
      from: localPeer.id,
      to: activeChat.id,
      content,
      timestamp: Date.now(),
      status: 'sent',
      imageBase64,
      fileName
    };

    setMessages(prev => [...prev, newMessage]);

    channelRef.current.send({
      type: 'broadcast',
      event: 'private_msg',
      payload: newMessage
    });
  };

  const handleSendFile = (file: File) => {
    if (!localPeer || !activeChat || !channelRef.current) return;
    
    const dc = dataChannelsRef.current.get(activeChat.id);
    if (!dc || dc.readyState !== 'open') {
      alert('Establishing secure data link... Please try again in a moment.');
      initiateDataConnection(activeChat.id);
      return;
    }
    
    const fileId = uuidv4();
    const chunkSize = 65535; // 64KB per chunk for WebRTC
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const totalChunks = Math.ceil(base64.length / chunkSize);
      
      setFileProgress(prev => ({ ...prev, [fileId]: 0 }));
      
      dc.send(JSON.stringify({
        type: 'file-start',
        fileId,
        fileName: file.name,
        fileType: file.type,
        totalChunks
      }));
      
      let offset = 0;
      let chunkIndex = 0;
      
      const sendNextChunk = () => {
        while (offset < base64.length) {
          if (dc.bufferedAmount > 1024 * 1024) { // 1MB buffer limit
            dc.onbufferedamountlow = () => {
              dc.onbufferedamountlow = null;
              sendNextChunk();
            };
            return;
          }
          
          const chunk = base64.slice(offset, offset + chunkSize);
          dc.send(JSON.stringify({
            type: 'file-chunk',
            fileId,
            chunkIndex,
            chunk
          }));
          
          offset += chunkSize;
          chunkIndex++;
          
          setFileProgress(prev => ({
            ...prev,
            [fileId]: Math.round((chunkIndex / totalChunks) * 100)
          }));
        }
        
        dc.send(JSON.stringify({ type: 'file-end', fileId }));
        
        const newMessage: Message = {
          id: fileId,
          from: localPeer.id,
          to: activeChat.id,
          content: `Sent file: ${file.name}`,
          timestamp: Date.now(),
          status: 'sent',
          imageBase64: base64,
          fileName: file.name
        };
        setMessages(prev => [...prev, newMessage]);
        
        setFileProgress(prev => {
          const next = { ...prev };
          delete next[fileId];
          return next;
        });
      };
      
      sendNextChunk();
    };
    reader.readAsDataURL(file);
  };

  // WebRTC Logic
  const createPeerConnection = (peerId: string, roomId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    if (!iceCandidateQueueRef.current.has(peerId)) {
      iceCandidateQueueRef.current.set(peerId, []);
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && localPeer && channelRef.current) {
        const batch = iceCandidateBatchRef.current.get(peerId) || [];
        batch.push(event.candidate);
        iceCandidateBatchRef.current.set(peerId, batch);

        if (!iceCandidateTimerRef.current.has(peerId)) {
          const timer = setTimeout(() => {
            const candidatesToSend = iceCandidateBatchRef.current.get(peerId) || [];
            if (candidatesToSend.length > 0) {
              channelRef.current?.send({
                type: 'broadcast',
                event: 'webrtc_signal',
                payload: {
                  type: 'ice-candidate-batch',
                  from: localPeer!.id,
                  to: peerId,
                  payload: { roomId, candidates: candidatesToSend }
                }
              });
              iceCandidateBatchRef.current.set(peerId, []);
            }
            iceCandidateTimerRef.current.delete(peerId);
          }, 250); // Batch candidates every 250ms
          iceCandidateTimerRef.current.set(peerId, timer);
        }
      }
    };

    pc.ontrack = (event) => {
      remoteStreamsRef.current.set(peerId, event.streams[0]);
      updateParticipantStream(peerId, event.streams[0]);
    };

    pcsRef.current.set(peerId, pc);
    return pc;
  };

  const startCall = async (peerId: string, isVideo: boolean) => {
    if (!localPeer || !channelRef.current) return;
    
    const peer = peers.find(p => p.id === peerId);
    if (!peer) return;

    if (activeCall) {
      alert("You are already in a call. Use 'Add Node' to invite them.");
      return;
    }

    try {
      let stream = localStream;
      if (!stream) {
        const hdConstraints = {
          video: isVideo ? { width: { ideal: 1920 }, height: { ideal: 1080 } } : false,
          audio: { echoCancellation: true, noiseSuppression: true }
        };
        stream = await navigator.mediaDevices.getUserMedia(hdConstraints);
        setLocalStream(stream);
        localStreamRef.current = stream;
      }

      const roomId = uuidv4();
      setActiveCall({
        roomId,
        isVideo,
        status: 'outgoing',
        participants: [{ id: peerId, alias: peer.alias, status: 'connecting' }]
      });
      addCallHistory(peerId, peer.alias, 'outgoing');

      channelRef.current.send({
        type: 'broadcast',
        event: 'webrtc_signal',
        payload: {
          type: 'invite',
          from: localPeer.id,
          to: peerId,
          payload: { roomId, alias: localPeer.alias, isVideo, participants: [{ id: localPeer.id, alias: localPeer.alias }] }
        }
      });
    } catch (err) {
      console.error('Error accessing media devices:', err);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  const invitePeerToCall = (peerId: string) => {
    if (!localPeer || !channelRef.current || !activeCall) return;
    const peer = peers.find(p => p.id === peerId);
    if (!peer) return;

    const currentParticipants = activeCall.participants.map(p => ({ id: p.id, alias: p.alias }));
    currentParticipants.push({ id: localPeer.id, alias: localPeer.alias });

    setActiveCall(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: [...prev.participants, { id: peerId, alias: peer.alias, status: 'connecting' }]
      };
    });

    channelRef.current.send({
      type: 'broadcast',
      event: 'webrtc_signal',
      payload: {
        type: 'invite',
        from: localPeer.id,
        to: peerId,
        payload: { roomId: activeCall.roomId, alias: localPeer.alias, isVideo: activeCall.isVideo, participants: currentParticipants }
      }
    });
  };

  const processIceQueue = async (peerId: string, pc: RTCPeerConnection) => {
    const queue = iceCandidateQueueRef.current.get(peerId) || [];
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding queued ice candidate', e);
      }
    }
    iceCandidateQueueRef.current.set(peerId, []);
  };

  const initiateWebRTC = async (peerId: string, roomId: string, isVideo: boolean) => {
    try {
      let stream = localStreamRef.current;
      if (!stream) {
        const hdConstraints = {
          video: isVideo ? { width: { ideal: 1920 }, height: { ideal: 1080 } } : false,
          audio: { echoCancellation: true, noiseSuppression: true }
        };
        stream = await navigator.mediaDevices.getUserMedia(hdConstraints);
        setLocalStream(stream);
        localStreamRef.current = stream;
      }

      const pc = createPeerConnection(peerId, roomId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream!));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      channelRef.current?.send({
        type: 'broadcast',
        event: 'webrtc_signal',
        payload: {
          type: 'offer',
          from: localPeer?.id,
          to: peerId,
          payload: { roomId, offer, isVideo, alias: localPeer?.alias }
        }
      });
    } catch (err) {
      console.error('Error initiating WebRTC:', err);
      closePeerConnection(peerId);
    }
  };

  const handleReceiveOffer = async (peerId: string, roomId: string, offer: any, isVideo: boolean, alias: string) => {
    // If we don't have this peer in participants, add them
    setActiveCall(prev => {
      if (!prev) return prev;
      if (!prev.participants.some(p => p.id === peerId)) {
        return {
          ...prev,
          participants: [...prev.participants, { id: peerId, alias, status: 'connecting' }]
        };
      }
      return prev;
    });

    try {
      let stream = localStreamRef.current;
      if (!stream) {
        const hdConstraints = {
          video: isVideo ? { width: { ideal: 1920 }, height: { ideal: 1080 } } : false,
          audio: { echoCancellation: true, noiseSuppression: true }
        };
        stream = await navigator.mediaDevices.getUserMedia(hdConstraints);
        setLocalStream(stream);
        localStreamRef.current = stream;
      }

      const pc = createPeerConnection(peerId, roomId);
      stream.getTracks().forEach(track => pc.addTrack(track, stream!));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await processIceQueue(peerId, pc);
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      channelRef.current?.send({
        type: 'broadcast',
        event: 'webrtc_signal',
        payload: {
          type: 'answer',
          from: localPeer?.id,
          to: peerId,
          payload: { roomId, answer }
        }
      });
      
      updateParticipantStatus(peerId, 'connected');
    } catch (err) {
      console.error('Error handling offer:', err);
      closePeerConnection(peerId);
    }
  };

  const handleSignalingData = async (signal: CallSignal) => {
    if (!localPeer || !channelRef.current) return;

    const currentActiveCall = activeCallRef.current;
    const currentPendingCall = pendingCallRef.current;

    switch (signal.type) {
      case 'invite':
        addCallHistory(signal.from, signal.payload.alias, 'incoming');
        const newCall: CallSession = {
          roomId: signal.payload.roomId,
          isVideo: signal.payload.isVideo,
          status: 'incoming',
          initiator: { id: signal.from, alias: signal.payload.alias },
          participants: signal.payload.participants.map((p: any) => ({ ...p, status: 'connecting' }))
        };
        if (currentActiveCall) {
          setPendingCall(newCall);
        } else {
          setActiveCall(newCall);
        }
        break;
      case 'join-room':
        if (currentActiveCall?.roomId === signal.payload.roomId) {
          const isNewParticipant = !currentActiveCall.participants.some(p => p.id === signal.from);
          if (isNewParticipant && currentActiveCall.status !== 'outgoing') {
            showCallNotification(`${signal.payload.alias} joined the call`);
          }

          setActiveCall(prev => {
            if (!prev) return prev;
            const updatedParticipants = prev.participants.some(p => p.id === signal.from)
              ? prev.participants
              : [...prev.participants, { id: signal.from, alias: signal.payload.alias, status: 'connecting' as const }];
            return {
              ...prev,
              status: 'connected', // Update status to connected if it was outgoing
              participants: updatedParticipants
            };
          });
          
          if (currentActiveCall.status === 'connected' || currentActiveCall.status === 'outgoing') {
            await initiateWebRTC(signal.from, currentActiveCall.roomId, currentActiveCall.isVideo);
          }
        } else if (currentPendingCall?.roomId === signal.payload.roomId) {
          setPendingCall(prev => {
            if (!prev) return prev;
            const updatedParticipants = prev.participants.some(p => p.id === signal.from)
              ? prev.participants
              : [...prev.participants, { id: signal.from, alias: signal.payload.alias, status: 'connecting' as const }];
            return {
              ...prev,
              participants: updatedParticipants
            };
          });
        }
        break;
      case 'reject':
        if (currentActiveCall?.roomId === signal.payload.roomId) {
          addCallHistory(signal.from, currentActiveCall.participants.find(p => p.id === signal.from)?.alias || 'Unknown', 'missed');
          closePeerConnection(signal.from);
          removeParticipant(signal.from, 'rejected the call');
        } else if (currentPendingCall?.roomId === signal.payload.roomId) {
          setPendingCall(null);
        }
        break;
      case 'offer':
        if (currentActiveCall?.roomId === signal.payload.roomId) {
          await handleReceiveOffer(signal.from, signal.payload.roomId, signal.payload.offer, signal.payload.isVideo, signal.payload.alias);
        }
        break;
      case 'answer':
        if (currentActiveCall?.roomId === signal.payload.roomId) {
          const pcAnswer = pcsRef.current.get(signal.from);
          if (pcAnswer) {
            await pcAnswer.setRemoteDescription(new RTCSessionDescription(signal.payload.answer));
            await processIceQueue(signal.from, pcAnswer);
            updateParticipantStatus(signal.from, 'connected');
          }
        }
        break;
      case 'ice-candidate':
        if (currentActiveCall?.roomId === signal.payload.roomId) {
          const pcIce = pcsRef.current.get(signal.from);
          if (pcIce && pcIce.remoteDescription) {
            try {
              await pcIce.addIceCandidate(new RTCIceCandidate(signal.payload.candidate));
            } catch (e) {
              console.error('Error adding received ice candidate', e);
            }
          } else {
            const queue = iceCandidateQueueRef.current.get(signal.from) || [];
            queue.push(signal.payload.candidate);
            iceCandidateQueueRef.current.set(signal.from, queue);
          }
        }
        break;
      case 'ice-candidate-batch':
        if (currentActiveCall?.roomId === signal.payload.roomId) {
          const pcIce = pcsRef.current.get(signal.from);
          const candidates = signal.payload.candidates;
          if (pcIce && pcIce.remoteDescription) {
            for (const candidate of candidates) {
              try {
                await pcIce.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.error('Error adding received ice candidate', e);
              }
            }
          } else {
            const queue = iceCandidateQueueRef.current.get(signal.from) || [];
            queue.push(...candidates);
            iceCandidateQueueRef.current.set(signal.from, queue);
          }
        }
        break;
      case 'leave-room':
        if (currentActiveCall?.roomId === signal.payload.roomId) {
          closePeerConnection(signal.from);
          removeParticipant(signal.from);
        }
        break;
      case 'end-room':
        if (currentActiveCall?.roomId === signal.payload.roomId) {
          showCallNotification('Call ended by host');
          endCallLocally();
        }
        break;
      case 'mute-all':
        if (currentActiveCall?.roomId === signal.payload.roomId && localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
          setIsAudioMuted(true);
        }
        break;
      case 'hold':
        if (currentActiveCall?.roomId === signal.payload.roomId) {
          updateParticipantStatus(signal.from, 'on-hold');
        }
        break;
      case 'resume':
        if (currentActiveCall?.roomId === signal.payload.roomId) {
          updateParticipantStatus(signal.from, 'connected');
        }
        break;
      case 'read-receipt':
        setMessages(prev => prev.map(m => 
          signal.payload.messageIds.includes(m.id) ? { ...m, status: 'read' } : m
        ));
        break;
    }
  };

  const acceptCall = async () => {
    if (!activeCall || !localPeer || !channelRef.current) return;
    
    try {
      let stream = localStreamRef.current;
      if (!stream) {
        const hdConstraints = {
          video: activeCall.isVideo ? { width: { ideal: 1920 }, height: { ideal: 1080 } } : false,
          audio: { echoCancellation: true, noiseSuppression: true }
        };
        stream = await navigator.mediaDevices.getUserMedia(hdConstraints);
        setLocalStream(stream);
        localStreamRef.current = stream;
      }

      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);

      // Send join-room to all participants
      activeCall.participants.forEach(p => {
        channelRef.current!.send({
          type: 'broadcast',
          event: 'webrtc_signal',
          payload: {
            type: 'join-room',
            from: localPeer.id,
            to: p.id,
            payload: { roomId: activeCall.roomId, alias: localPeer.alias }
          }
        });
      });
    } catch (err) {
      console.error('Error accessing media devices:', err);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  const acceptWaitingCall = () => {
    if (!activeCall || !pendingCall || !localPeer || !channelRef.current) return;
    
    // Put active call on hold
    activeCall.participants.forEach(p => {
      channelRef.current!.send({
        type: 'broadcast', event: 'webrtc_signal',
        payload: { type: 'hold', from: localPeer.id, to: p.id, payload: { roomId: activeCall.roomId } }
      });
    });
    
    setHeldCall({ ...activeCall, status: 'on-hold' });
    
    const newCall = { ...pendingCall, status: 'connected' as const };
    setActiveCall(newCall);
    setPendingCall(null);
    
    // Send join-room to all participants of the new call
    newCall.participants.forEach(p => {
      channelRef.current!.send({
        type: 'broadcast', event: 'webrtc_signal',
        payload: { type: 'join-room', from: localPeer.id, to: p.id, payload: { roomId: newCall.roomId, alias: localPeer.alias } }
      });
    });
  };

  const rejectWaitingCall = () => {
    if (!pendingCall || !localPeer || !channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast', event: 'webrtc_signal',
      payload: { type: 'reject', from: localPeer.id, to: pendingCall.initiator!.id, payload: { roomId: pendingCall.roomId } }
    });
    setPendingCall(null);
  };

  const closePeerConnection = (peerId: string) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) {
      pc.close();
      pcsRef.current.delete(peerId);
    }
    remoteStreamsRef.current.delete(peerId);
    iceCandidateQueueRef.current.delete(peerId);
  };

  const endCallLocally = () => {
    const currentActiveCall = activeCallRef.current;
    const currentHeldCall = heldCallRef.current;
    const currentLocalStream = localStreamRef.current;

    if (currentActiveCall) {
      currentActiveCall.participants.forEach(p => {
        closePeerConnection(p.id);
      });
    }
    
    if (currentHeldCall) {
      setActiveCall({ ...currentHeldCall, status: 'connected' });
      setHeldCall(null);
      currentHeldCall.participants.forEach(p => {
        channelRef.current?.send({
          type: 'broadcast', event: 'webrtc_signal',
          payload: { type: 'resume', from: localPeer!.id, to: p.id, payload: { roomId: currentHeldCall.roomId } }
        });
      });
    } else {
      setActiveCall(null);
      if (currentLocalStream) {
        currentLocalStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        localStreamRef.current = null;
      }
    }
  };

  const showCallNotification = (message: string) => {
    setCallNotification(message);
    setTimeout(() => setCallNotification(null), 3000);
  };

  const rejectCall = () => {
    if (activeCall && localPeer && channelRef.current) {
      activeCall.participants.forEach(p => {
        channelRef.current!.send({
          type: 'broadcast',
          event: 'webrtc_signal',
          payload: {
            type: 'reject',
            from: localPeer.id,
            to: p.id,
            payload: { roomId: activeCall.roomId }
          }
        });
      });
      endCallLocally();
    }
  };

  const handleEndCall = () => {
    if (activeCall && localPeer && channelRef.current) {
      const isInitiator = activeCall.initiator.id === localPeer.id;
      
      activeCall.participants.forEach(p => {
        channelRef.current!.send({
          type: 'broadcast',
          event: 'webrtc_signal',
          payload: {
            type: isInitiator ? 'end-room' : 'leave-room',
            from: localPeer.id,
            to: p.id,
            payload: { roomId: activeCall.roomId }
          }
        });
      });
      endCallLocally();
    }
  };

  const handleMuteAll = () => {
    if (!activeCall || !localPeer || !channelRef.current) return;
    activeCall.participants.forEach(p => {
      channelRef.current!.send({
        type: 'broadcast', event: 'webrtc_signal',
        payload: { type: 'mute-all', from: localPeer.id, to: p.id, payload: { roomId: activeCall.roomId } }
      });
    });
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoMuted(!isVideoMuted);
    }
  };

  if (!localPeer) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-full bg-monix-bg text-monix-cyan font-mono flex flex-col overflow-hidden relative">
      {callNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[70] bg-monix-panel border border-monix-cyan text-monix-cyan px-4 py-2 rounded shadow-[0_0_15px_rgba(0,255,255,0.3)] animate-in slide-in-from-top-4 fade-in duration-300">
          {callNotification}
        </div>
      )}
      
      {pendingCall && (
        <div className="absolute top-20 right-10 z-[60] glass-panel p-4 border border-monix-cyan animate-pulse-fast shadow-[0_0_20px_rgba(0,255,255,0.2)]">
          <h4 className="text-monix-cyan font-bold mb-2 uppercase tracking-widest text-sm">Incoming Link: {pendingCall.initiator?.alias}</h4>
          <div className="flex gap-2 mt-4">
            <button 
              onClick={acceptWaitingCall} 
              className="px-3 py-1 bg-monix-emerald/20 text-monix-emerald border border-monix-emerald text-xs uppercase font-bold hover:bg-monix-emerald hover:text-black transition-colors"
            >
              Hold & Accept
            </button>
            <button 
              onClick={rejectWaitingCall} 
              className="px-3 py-1 bg-monix-red/20 text-monix-red border border-monix-red text-xs uppercase font-bold hover:bg-monix-red hover:text-black transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {activeCall && (
        <div className="z-50 w-full max-w-4xl mx-auto absolute top-0 left-0 right-0">
          <VideoCall
            localStream={localStream}
            participants={activeCall.participants}
            onEndCall={handleEndCall}
            onRejectCall={rejectCall}
            onAcceptCall={acceptCall}
            status={activeCall.status}
            initiatorName={activeCall.initiator?.alias}
            isAudioMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onMuteAll={handleMuteAll}
            onInvitePeer={invitePeerToCall}
            availablePeers={peers}
          />
        </div>
      )}

      <div className="flex-1 flex overflow-hidden pt-[env(safe-area-inset-top)]">
        <Sidebar 
          localPeer={localPeer} 
          peers={peers}
          activeChat={activeChat}
          callHistory={callHistory}
          unreadMessages={unreadMessages}
          onSelectChat={setActiveChat}
          onStartCall={startCall}
        />
        <Chat 
          localPeer={localPeer} 
          activeChat={activeChat}
          messages={messages} 
          fileProgress={fileProgress}
          onSendMessage={handleSendMessage}
          onSendFile={handleSendFile}
          onStartCall={startCall}
        />
      </div>
    </div>
  );
}
