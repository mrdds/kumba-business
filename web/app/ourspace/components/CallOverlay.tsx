'use client';

import React, { useEffect, useState } from 'react';
import { 
  LiveKitRoom, 
  VideoConference, 
  formatMenuItem, 
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  VideoTrack,
  ParticipantTile,
  GridLayout,
  TrackReference
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { X, Mic, MicOff, Video, VideoOff, Phone, PhoneOff, Maximize2, Minimize2, User as UserIcon } from 'lucide-react';
import api from '../../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface CallOverlayProps {
  meetingId: string;
  isAudioOnly: boolean;
  isIncoming: boolean;
  callerInfo?: {
    first_name: string;
    last_name: string;
    avatar?: string;
  };
  onClose: () => void;
}

export default function CallOverlay({ meetingId, isAudioOnly, isIncoming, callerInfo, onClose }: CallOverlayProps) {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'ringing' | 'connected' | 'error' | 'ended'>(
    isIncoming ? 'ringing' : 'connecting'
  );
  const [isMinimized, setIsMinimized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let oscillator: OscillatorNode | null = null;
    let gainNode: GainNode | null = null;
    let interval: NodeJS.Timeout | null = null;

    if (status === 'ringing' || status === 'connecting') {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = () => {
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        oscillator = audioCtx.createOscillator();
        gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(480, audioCtx.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 1.5);
      };

      playTone();
      interval = setInterval(playTone, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (audioCtx) audioCtx.close();
    };
  }, [status]);

  useEffect(() => {
    if (!isIncoming) {
      handleJoin();
    }
  }, []);

  const handleJoin = async () => {
    if (!meetingId || meetingId === 'undefined' || meetingId === '') {
      console.error('[CallOverlay] Invalid meetingId:', meetingId);
      setErrorMessage('ID de réunion invalide. Réessayez.');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setErrorMessage(null);

    try {
      console.log('[CallOverlay] Joining meeting:', meetingId);
      const res = await api.post(`/connect/meetings/${meetingId}/join`);
      console.log('[CallOverlay] Join response:', res.data);
      const url = (res.data.server_url || res.data.serverUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://kumba-livekit.fly.dev')
        .replace('http', 'ws');
      console.log('[CallOverlay] Connecting to LiveKit at:', url);
      setToken(res.data.token);
      setServerUrl(url);
    } catch (err: any) {
      console.error('[CallOverlay] Failed to join meeting:', err?.response?.data || err);
      setErrorMessage(err?.response?.data?.detail || 'Impossible de rejoindre la réunion');
      setStatus('error');
    }
  };

  const handleDecline = () => {
    setStatus('ended');
    setTimeout(onClose, 500);
  };

  // Error state
  if (status === 'error') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
            <PhoneOff size={36} className="text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">Échec de connexion</h2>
            <p className="text-slate-400 text-sm font-medium">{errorMessage}</p>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Meeting ID: {meetingId || 'non défini'}</p>
          </div>
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleJoin}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all"
            >
              Réessayer
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-wider hover:bg-slate-700 transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }


  // Ringing state (incoming call)
  if (status === 'ringing' && isIncoming) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-blue-500/20 rounded-full"
            />
            <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-700 overflow-hidden relative z-10 flex items-center justify-center">
              {callerInfo?.avatar ? (
                <img src={callerInfo.avatar} className="w-full h-full object-cover" alt="" />
              ) : (
                <UserIcon size={48} className="text-slate-500" />
              )}
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white">{callerInfo?.first_name} {callerInfo?.last_name}</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Appel {isAudioOnly ? 'audio' : 'vidéo'} entrant...</p>
          </div>

          <div className="flex gap-12 mt-8">
            <button 
              onClick={handleDecline}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-xl shadow-red-500/20 hover:scale-110 transition-all active:scale-95"
            >
              <PhoneOff size={28} />
            </button>
            <button 
              onClick={handleJoin}
              className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white shadow-xl shadow-green-500/20 hover:scale-110 transition-all active:scale-95"
            >
              {isAudioOnly ? <Phone size={28} /> : <Video size={28} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!token) return null;

  return (
    <motion.div 
      layout
      className={clsx(
        "fixed z-[200] bg-slate-900 shadow-2xl transition-all duration-500 overflow-hidden",
        isMinimized 
          ? "bottom-8 right-8 w-80 h-48 rounded-2xl" 
          : "inset-0 md:inset-8 md:rounded-3xl"
      )}
    >
      <LiveKitRoom
        video={!isAudioOnly}
        audio={true}
        token={token}
        connect={true}
        serverUrl={serverUrl || 'ws://localhost:7880'}
        onConnected={() => {
          console.log('[CallOverlay] LiveKit Connected');
          setStatus('connected');
        }}
        onDisconnected={() => {
          console.log('[CallOverlay] Disconnected from LiveKit');
          if (status !== 'ended') {
            onClose();
          }
        }}
        onError={(err) => {
          console.error('[CallOverlay] LiveKit Error:', err);
          setErrorMessage(`Erreur LiveKit: ${err.message}`);
          setStatus('error');
        }}
        className="h-full flex flex-col relative"
      >
        {status === 'connecting' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900 backdrop-blur-xl">
            <div className="flex flex-col items-center gap-8">
              <div className="relative">
                <motion.div 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} 
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute inset-0 bg-green-500/20 rounded-full"
                />
                <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-green-500/30 overflow-hidden relative z-10 flex items-center justify-center">
                  <UserIcon size={48} className="text-slate-500" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-black text-white">Connexion en cours...</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  Appel {isAudioOnly ? 'audio' : 'vidéo'}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="mt-4 w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-xl shadow-red-500/20 hover:scale-110 transition-all active:scale-95"
              >
                <PhoneOff size={28} />
              </button>
            </div>
          </div>
        )}
        <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center">
          <div className="flex items-center gap-3 bg-slate-900/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">En direct</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2.5 bg-slate-900/40 backdrop-blur-md text-white rounded-xl border border-white/10 hover:bg-slate-900/60 transition-all"
            >
              {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
            </button>
            <button 
              onClick={onClose}
              className="p-2.5 bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 hover:bg-red-500/30 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </motion.div>
  );
}
