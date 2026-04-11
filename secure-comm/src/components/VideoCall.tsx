import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, Phone, VolumeX, UserPlus } from 'lucide-react';
import { Peer } from '../types';

interface CallParticipant {
  id: string;
  alias: string;
  status: 'connecting' | 'connected' | 'on-hold';
  stream?: MediaStream | null;
}

interface VideoCallProps {
  localStream: MediaStream | null;
  participants: CallParticipant[];
  onEndCall: () => void;
  onRejectCall?: () => void;
  onAcceptCall?: () => void;
  status: 'incoming' | 'outgoing' | 'connected' | 'on-hold';
  initiatorName?: string;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onMuteAll: () => void;
  onInvitePeer: (peerId: string) => void;
  availablePeers: Peer[];
}

const ParticipantVideo: React.FC<{ participant: CallParticipant }> = ({ participant }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream, participant.status]);

  return (
    <div className="relative bg-black border border-monix-border overflow-hidden flex-1 min-h-[150px] min-w-[200px]">
      {participant.stream && participant.status !== 'on-hold' ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover grayscale contrast-125 brightness-90 sepia-[.2] hue-rotate-[180deg]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          {participant.status === 'on-hold' ? (
            <span className="text-[10px] opacity-50 uppercase text-monix-emerald">On_Hold</span>
          ) : (
            <>
              <div className="w-8 h-8 border-2 border-monix-cyan border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="text-[10px] opacity-50 uppercase">Connecting...</span>
            </>
          )}
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 text-[10px] uppercase border border-monix-border text-monix-cyan">
        {participant.alias}
      </div>
    </div>
  );
};

export default function VideoCall({
  localStream,
  participants,
  onEndCall,
  onRejectCall,
  onAcceptCall,
  status,
  initiatorName,
  isAudioMuted,
  isVideoMuted,
  onToggleAudio,
  onToggleVideo,
  onMuteAll,
  onInvitePeer,
  availablePeers
}: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, status]);

  if (status === 'incoming') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="glass-panel p-8 max-w-sm w-full text-center animate-[slideDown_0.3s_ease-out]">
          <div className="w-20 h-20 mx-auto rounded-full bg-monix-cyan/20 border-2 border-monix-cyan flex items-center justify-center mb-6 animate-pulse-fast">
            <Phone size={32} className="text-monix-cyan" />
          </div>
          <h3 className="text-xl font-bold text-monix-cyan mb-2 uppercase tracking-widest">Incoming Link</h3>
          <p className="text-monix-cyan/70 mb-8">{initiatorName} is requesting a secure connection...</p>
          
          <div className="flex justify-center gap-4">
            <button
              onClick={onRejectCall || onEndCall}
              className="px-6 py-3 border border-monix-red text-monix-red hover:bg-monix-red hover:text-black transition-colors font-bold uppercase tracking-widest"
            >
              Reject
            </button>
            <button
              onClick={onAcceptCall}
              className="px-6 py-3 bg-monix-emerald/20 border border-monix-emerald text-monix-emerald hover:bg-monix-emerald hover:text-black transition-colors font-bold uppercase tracking-widest"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  const peersToInvite = availablePeers.filter(p => !participants.some(part => part.id === p.id));

  return (
    <div className="glass-panel border-b border-monix-border p-4 shadow-lg animate-[slideDown_0.3s_ease-out]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === 'on-hold' ? 'bg-monix-emerald' : 'bg-monix-red'} animate-pulse-fast`}></div>
          <span className={`uppercase tracking-widest text-sm font-bold ${status === 'on-hold' ? 'text-monix-emerald' : status === 'outgoing' ? 'text-monix-cyan animate-pulse' : 'text-monix-red'}`}>
            {status === 'on-hold' ? `Link_Suspended` : status === 'outgoing' ? `Establishing_Link...` : `Encrypted_Link_Active (${participants.length + 1} Nodes)`}
          </span>
        </div>
        <div className="font-mono text-[10px] opacity-50 relative">
          <button 
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-1 hover:text-monix-cyan transition-colors"
          >
            <UserPlus size={14} /> ADD_NODE
          </button>
          {showInvite && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-monix-panel border border-monix-border shadow-lg z-10">
              <div className="p-2 border-b border-monix-border text-xs font-bold">AVAILABLE NODES</div>
              <div className="max-h-40 overflow-y-auto">
                {peersToInvite.length === 0 ? (
                  <div className="p-2 text-xs opacity-50">No available nodes.</div>
                ) : (
                  peersToInvite.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { onInvitePeer(p.id); setShowInvite(false); }}
                      className="w-full text-left p-2 text-xs hover:bg-monix-cyan/20 transition-colors"
                    >
                      {p.alias}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 max-h-[60vh] overflow-y-auto crt-scanlines">
        {participants.map(p => (
          <ParticipantVideo key={p.id} participant={p} />
        ))}

        {/* Local Video */}
        <div className="relative bg-black border border-monix-border overflow-hidden flex-1 min-h-[150px] min-w-[200px] max-w-[300px]">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover grayscale contrast-125 brightness-90 sepia-[.2] hue-rotate-[180deg]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] opacity-50 uppercase">No_Signal</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 text-[10px] uppercase border border-monix-border text-monix-cyan">
            Self
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={onToggleAudio}
          className={`p-3 rounded-full border ${
            isAudioMuted 
              ? 'bg-monix-red/20 border-monix-red text-monix-red' 
              : 'bg-monix-panel border-monix-border hover:bg-monix-bg text-monix-cyan'
          } transition-colors`}
          title="Toggle Audio"
        >
          {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-full border ${
            isVideoMuted 
              ? 'bg-monix-red/20 border-monix-red text-monix-red' 
              : 'bg-monix-panel border-monix-border hover:bg-monix-bg text-monix-cyan'
          } transition-colors`}
          title="Toggle Video"
        >
          {isVideoMuted ? <VideoOff size={20} /> : <VideoIcon size={20} />}
        </button>
        <button
          onClick={onMuteAll}
          className="p-3 rounded-full border bg-monix-panel border-monix-border hover:bg-monix-bg text-monix-cyan transition-colors"
          title="Force Mute All Remotes"
        >
          <VolumeX size={20} />
        </button>
        <button
          onClick={onEndCall}
          className="p-3 rounded-full bg-monix-red text-black hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(255,0,60,0.4)]"
          title="End Call"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}

