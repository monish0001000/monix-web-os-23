import { useEffect, useRef, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff, Phone, VolumeX, UserPlus } from 'lucide-react';
import { Peer, CallParticipant } from './CommTypes';

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

const ParticipantVideo = ({ participant }: { participant: CallParticipant }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream, participant.status]);

  return (
    <div className="relative bg-black border border-[#1a1a1a] overflow-hidden flex-1 min-h-[150px] min-w-[200px]">
      {participant.stream && participant.status !== 'on-hold' ? (
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale contrast-125 brightness-90" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          {participant.status === 'on-hold' ? (
            <span className="text-[10px] opacity-50 uppercase text-[#10b981]">On_Hold</span>
          ) : (
            <>
              <div className="w-8 h-8 border-2 border-[#00ffff] border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-[10px] opacity-50 uppercase text-[#00ffff]">Connecting...</span>
            </>
          )}
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 text-[10px] uppercase border border-[#1a1a1a] text-[#00ffff]">
        {participant.alias}
      </div>
    </div>
  );
};

export default function CommVideoCall({
  localStream, participants, onEndCall, onRejectCall, onAcceptCall,
  status, initiatorName, isAudioMuted, isVideoMuted,
  onToggleAudio, onToggleVideo, onMuteAll, onInvitePeer, availablePeers
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
      /* CRITICAL: absolute (not fixed) so it stays inside the OS window */
      <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-[rgba(10,10,10,0.9)] border border-[rgba(0,255,255,0.2)] backdrop-blur-xl p-8 max-w-sm w-full text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-[rgba(0,255,255,0.2)] border-2 border-[#00ffff] flex items-center justify-center mb-6 animate-pulse">
            <Phone size={32} className="text-[#00ffff]" />
          </div>
          <h3 className="text-xl font-bold text-[#00ffff] mb-2 uppercase tracking-widest">Incoming Link</h3>
          <p className="text-[rgba(0,255,255,0.7)] mb-8">{initiatorName} is requesting a secure connection...</p>
          <div className="flex justify-center gap-4">
            <button onClick={onRejectCall || onEndCall} className="px-6 py-3 border border-[#ff003c] text-[#ff003c] hover:bg-[#ff003c] hover:text-black transition-colors font-bold uppercase tracking-widest">
              Reject
            </button>
            <button onClick={onAcceptCall} className="px-6 py-3 bg-[rgba(16,185,129,0.2)] border border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-black transition-colors font-bold uppercase tracking-widest">
              Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  const peersToInvite = availablePeers.filter(p => !participants.some(part => part.id === p.id));

  return (
    <div className="bg-[rgba(10,10,10,0.85)] backdrop-blur-xl border-b border-[#1a1a1a] p-4 shadow-lg shrink-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === 'on-hold' ? 'bg-[#10b981]' : 'bg-[#ff003c]'} animate-pulse`} />
          <span className={`uppercase tracking-widest text-sm font-bold ${status === 'on-hold' ? 'text-[#10b981]' : status === 'outgoing' ? 'text-[#00ffff] animate-pulse' : 'text-[#ff003c]'}`}>
            {status === 'on-hold' ? 'Link_Suspended' : status === 'outgoing' ? 'Establishing_Link...' : `Encrypted_Link_Active (${participants.length + 1} Nodes)`}
          </span>
        </div>
        <div className="font-mono text-[10px] opacity-50 relative">
          <button onClick={() => setShowInvite(!showInvite)} className="flex items-center gap-1 hover:text-[#00ffff] transition-colors">
            <UserPlus size={14} /> ADD_NODE
          </button>
          {showInvite && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#0a0a0a] border border-[#1a1a1a] shadow-lg z-10">
              <div className="p-2 border-b border-[#1a1a1a] text-xs font-bold text-[#00ffff]">AVAILABLE NODES</div>
              <div className="max-h-40 overflow-y-auto">
                {peersToInvite.length === 0 ? (
                  <div className="p-2 text-xs opacity-50">No available nodes.</div>
                ) : (
                  peersToInvite.map(p => (
                    <button key={p.id} onClick={() => { onInvitePeer(p.id); setShowInvite(false); }} className="w-full text-left p-2 text-xs hover:bg-[rgba(0,255,255,0.2)] transition-colors text-[#00ffff]">
                      {p.alias}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 max-h-[55vh] overflow-y-auto">
        {participants.map(p => <ParticipantVideo key={p.id} participant={p} />)}
        <div className="relative bg-black border border-[#1a1a1a] overflow-hidden flex-1 min-h-[150px] min-w-[200px] max-w-[300px]">
          {localStream ? (
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale contrast-125 brightness-90" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] opacity-50 uppercase text-[#00ffff]">No_Signal</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 text-[10px] uppercase border border-[#1a1a1a] text-[#00ffff]">Self</div>
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-4">
        <button onClick={onToggleAudio} className={`p-3 rounded-full border ${isAudioMuted ? 'bg-[rgba(255,0,60,0.2)] border-[#ff003c] text-[#ff003c]' : 'bg-[#0a0a0a] border-[#1a1a1a] text-[#00ffff] hover:bg-[#050505]'} transition-colors`} title="Toggle Audio">
          {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button onClick={onToggleVideo} className={`p-3 rounded-full border ${isVideoMuted ? 'bg-[rgba(255,0,60,0.2)] border-[#ff003c] text-[#ff003c]' : 'bg-[#0a0a0a] border-[#1a1a1a] text-[#00ffff] hover:bg-[#050505]'} transition-colors`} title="Toggle Video">
          {isVideoMuted ? <VideoOff size={20} /> : <VideoIcon size={20} />}
        </button>
        <button onClick={onMuteAll} className="p-3 rounded-full border bg-[#0a0a0a] border-[#1a1a1a] text-[#00ffff] hover:bg-[#050505] transition-colors" title="Mute All">
          <VolumeX size={20} />
        </button>
        <button onClick={onEndCall} className="p-3 rounded-full bg-[#ff003c] text-black hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(255,0,60,0.4)]" title="End Call">
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}
