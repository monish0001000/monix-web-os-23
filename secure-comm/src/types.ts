export interface Peer {
  id: string;
  alias: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  status?: 'sent' | 'delivered' | 'read';
  imageBase64?: string;
  fileName?: string;
}

export interface CallSignal {
  type: 'invite' | 'accept' | 'reject' | 'join-room' | 'offer' | 'answer' | 'ice-candidate' | 'leave-room' | 'mute-all' | 'hold' | 'resume' | 'read-receipt';
  from: string;
  to: string;
  payload?: any;
}

export interface CallHistoryEntry {
  id: string;
  peerId: string;
  peerAlias: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: number;
}
