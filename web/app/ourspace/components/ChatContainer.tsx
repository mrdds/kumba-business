'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import {
  ArrowLeft,
  Search,
  Phone,
  Video,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  RefreshCw,
  X,
  Mic,
  LayoutGrid,
  Loader2,
  Camera,
  MapPin,
  Users as UsersIcon,
  File as FileIcon,
  BarChart2,
  Calendar,
  Sparkles,
  Image as ImageIcon,
  Star,
  Check,
  CheckCheck,
  Shield,
  Info,
  MessageCircle,
  User as UserIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import MessageInfoPanel from './MessageInfoPanel'
import UserProfileModal from './UserProfileModal'
import ConfirmModal from './ConfirmModal'
import ContactPickerModal from './ContactPickerModal'
import PollCreatorModal from './PollCreatorModal'
import EventCreatorModal from './EventCreatorModal'
import CallOverlay from './CallOverlay'
import MeetingSchedulerModal from './MeetingSchedulerModal'
import {
  fetchConversations,
  fetchMessages,
  createMessage,
  updatePublicKey,
  getPublicKey,
  searchUsers,
  createConversation,
  createMeeting,
  uploadMedia,
  reactToMessage,
  starMessage,
  deleteMessage,
  toggleConversationAction,
  clearConversation,
  deleteConversation
} from '../../../modules/connect/services/api'
import { useAuth } from '../../../context/AuthContext'
import useWebSocket from 'react-use-websocket'
import {
  getStoredKeys,
  generateKeyPair,
  storeKeyPair,
  decryptMessage,
  encryptMessage,
  purgeStoredKeys
} from '../../../utils/crypto'
import clsx from 'clsx'

// Constants
const WS_BASE_URL = typeof window !== 'undefined'
  ? `ws://${window.location.hostname}:8000/ws/connect`
  : 'ws://localhost:8000/ws/connect';
const API_BASE_URL = typeof window !== 'undefined'
  ? `http://${window.location.hostname}:8000/api`
  : 'http://localhost:8000/api';

interface Message {
  id: string
  sender_id: number
  sender_name?: string
  sender_avatar?: string
  content: string
  content_type: string
  created_at: string
  decryptedContent?: string
  is_read?: boolean
  reactions?: { [key: string]: number[] }
  is_starred?: boolean
}

interface Participant {
  id: number
  email: string
  first_name: string
  last_name: string
  public_key?: string
  avatar?: string
  phone_number?: string
  department?: string
  job_title?: string
  last_seen?: string
  kumba_id?: string
  supervisor_name?: string
}

interface Conversation {
  id: string
  title: string
  type: string
  last_message?: { content: string; created_at: string } | null
  is_unread?: boolean
  target_user_id?: number
  participants_details?: Participant[]
  icon?: string
  description?: string
}

export default function ChatContainer() {
  const { user, token, isLoading: authLoading } = useAuth()
  const [conversations, setConversations] = useState < Conversation[] > ([])
  const [activeConversation, setActiveConversation] = useState < Conversation | null > (null)
  const [messages, setMessages] = useState < Message[] > ([])
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [myKeys, setMyKeys] = useState < { publicKey: string | null; secretKey: string | null } > ({
    publicKey: null,
    secretKey: null
  })
  const [targetPublicKey, setTargetPublicKey] = useState < string | null > (null)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [showMsgInfoPanel, setShowMsgInfoPanel] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState < string | null > (null)
  const [selectedMessageInfo, setSelectedMessageInfo] = useState < any > (null)
  const [viewArchived, setViewArchived] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [selectedProfileUser, setSelectedProfileUser] = useState < Participant | null > (null)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showContactPicker, setShowContactPicker] = useState(false)
  const [showPollCreator, setShowPollCreator] = useState(false)
  const [showEventCreator, setShowEventCreator] = useState(false)
  const [activeCall, setActiveCall] = useState < {
    meetingId: string;
    type: 'audio' | 'video';
    isIncoming: boolean;
    callerInfo?: { first_name: string, last_name: string, avatar?: string };
  } | null > (null)
  const activeCallRef = useRef(activeCall)
  useEffect(() => {
    activeCallRef.current = activeCall
    if (activeCall === null) {
      console.trace('[ChatContainer] activeCall set to NULL');
    } else {
      console.log('[ChatContainer] activeCall updated:', activeCall);
    }
  }, [activeCall])
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false)
  const [otherIsTyping, setOtherIsTyping] = useState < boolean > (false)
  const [confirmModal, setConfirmModal] = useState < {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  } > ({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'danger'
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState < Participant[] > ([])
  const [searching, setSearching] = useState(false)
  const typingTimeoutRef = useRef < NodeJS.Timeout | null > (null)
  const ws = useRef < WebSocket | null > (null)
  const messagesEndRef = useRef < HTMLDivElement > (null)
  const fileInputRef = useRef < HTMLInputElement > (null)

  // Global WebSocket for call signals
  const globalSocket = useWebSocket(token ? `${WS_BASE_URL}/global/?token=${token}` : null, {
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    onOpen: () => console.log('[ChatContainer] Global WebSocket Connected'),
    onClose: () => console.log('[ChatContainer] Global WebSocket Disconnected'),
    onError: (err) => console.error('[ChatContainer] Global WebSocket Error:', err),
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('[ChatContainer] Global WS Message:', data);
        if (data.type === 'call_signal' || data.type === 'global_call_signal') {
          const action = data.action;
          const myId = user?.id || user?.kumba_uid;

          if (action === 'call_offer') {
            // ONLY set active call if someone ELSE is calling us
            const callerId = data.user_id || data.caller_id;
            if (Number(callerId) !== Number(myId)) {
              console.log('[ChatContainer] Incoming call offer from:', callerId, 'is_audio_only:', data.is_audio_only);
              setActiveCall({
                meetingId: data.meeting_id,
                type: (data.is_audio_only === true || data.is_audio_only === 'true') ? 'audio' : 'video',
                isIncoming: true,
                callerInfo: {
                  first_name: data.caller_first_name || 'Collaborateur',
                  last_name: '',
                  avatar: data.caller_avatar
                }
              })
            } else {
              console.log('[ChatContainer] Ignoring own call offer signal');
            }
          } else if (['call_rejected', 'call_canceled', 'call_ended', 'call_timeout'].includes(action)) {
            console.log(`[ChatContainer] Call terminated by signal: ${action}`);
            const meetingId = data.meeting_id;
            const convId = data.conversation_id || activeConversation?.id;
            
            if (convId && action === 'call_ended') {
              console.log('[ChatContainer] Call ended signal received, system message handled by backend');
            }
            setActiveCall(null);
          }
        }
      } catch (e) {
        console.error('[ChatContainer] Error parsing global message', e)
      }
    }
  })

  const getFullAvatarUrl = (path?: string): string | null => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
  }

  const otherParticipant = useMemo(() => {
    if (activeConversation?.type === 'direct' && activeConversation.target_user_id) {
      return activeConversation.participants_details?.find(
        (p) => p.id === activeConversation.target_user_id
      )
    }
    return null
  }, [activeConversation])

  const handleOpenProfile = (p: Participant) => {
    setSelectedProfileUser(p)
    setProfileModalOpen(true)
  }

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getRooms = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const data = await fetchConversations(viewArchived)
      console.log('[ChatContainer] Conversations loaded:', data.map((c: any) => ({ id: c.id, title: c.title, archived: c.is_archived })))
      setConversations(data)
    } catch (err) {
      console.error('Failed to fetch conversations', err)
    } finally {
      setLoading(false)
    }
  }, [viewArchived])

  useEffect(() => {
    const myId = user?.id || user?.kumba_uid;
    console.log('[ChatContainer] Identity Sync:', { userId: user?.id, kumbaUid: user?.kumba_uid, hasToken: !!token, authLoading });

    const loadCryptoKeys = async (): Promise<void> => {
      let keys = getStoredKeys()
      if (!keys.publicKey || !keys.secretKey) {
        console.log('[ChatContainer] Generating new crypto keys...');
        const newKeys = generateKeyPair()
        storeKeyPair(newKeys.secretKeyBase64, newKeys.publicKeyBase64)
        keys = { publicKey: newKeys.publicKeyBase64, secretKey: newKeys.secretKeyBase64 }
        try {
          await updatePublicKey(newKeys.publicKeyBase64)
        } catch (err) {
          console.error('[ChatContainer] Failed to register public key', err)
        }
      }

      setMyKeys({ publicKey: keys.publicKey, secretKey: keys.secretKey })
    }

    if (myId) {
      loadCryptoKeys()
      getRooms()
    } else if (!authLoading) {
      // Auth finished but no user, stop loading
      setLoading(false)
    }
  }, [user?.id, user?.kumba_uid, token, authLoading, getRooms, viewArchived])

  useEffect(() => {
    if (!activeConversation) return

    const fetchChatMessages = async (): Promise<void> => {
      setMessagesLoading(true)
      try {
        if (activeConversation.type === 'direct' && activeConversation.target_user_id) {
          try {
            const keyData = await getPublicKey(activeConversation.target_user_id)
            setTargetPublicKey(keyData?.public_key || null)
          } catch (err: any) {
            // Silencing 404 as it just means the user hasn't initialized their chat/keys yet
            if (err.response?.status !== 404) {
              console.error('Failed to fetch target public key', err)
            }
            setTargetPublicKey(null)
          }
        } else {
          setTargetPublicKey(null)
        }

        const data = await fetchMessages(activeConversation.id)
        setMessages(data)
        setTimeout(scrollToBottom, 100)
      } catch (err) {
        console.error('Failed to fetch messages', err)
      } finally {
        setMessagesLoading(false)
      }
    }

    fetchChatMessages()

    if (ws.current) {
      console.log('[ChatContainer] Closing existing WebSocket');
      ws.current.close();
    }

    const wsUrl = `${WS_BASE_URL}/${activeConversation.id}/?token=${token}`;
    console.log('[ChatContainer] Connecting to WebSocket:', wsUrl);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('[ChatContainer] WebSocket Connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      console.log('[ChatContainer] WS Message received:', data.type, data.id);
      if (data.type === 'chat_message') {
        const newMsg: Message = {
          id: data.id || Math.random().toString(),
          sender_id: Number(data.user_id),
          sender_name: data.sender_name,
          content: data.message,
          content_type: data.content_type,
          created_at: data.timestamp || new Date().toISOString(),
          is_read: false
        }
        setMessages((prev) => {
          // Prevent duplicates if REST API already added it
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        })
        setOtherIsTyping(false)
        setTimeout(scrollToBottom, 50)
      } else if (data.type === 'typing') {
        const myId = user?.id || user?.kumba_uid;
        if (Number(data.user_id) !== Number(myId)) {
          setOtherIsTyping(data.is_typing)
          if (data.is_typing) setTimeout(scrollToBottom, 50)
        }
      } else if (data.type === 'delete_message') {
        setMessages(prev => prev.filter(m => m.id !== data.message_id));
      }
    }

    ws.current.onerror = (err) => {
      console.error('[ChatContainer] WebSocket Error:', err);
    };

    ws.current.onclose = (e) => {
      console.log('[ChatContainer] WebSocket Closed:', e.code, e.reason);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    }
  }, [activeConversation?.id, token, user?.id, user?.kumba_uid])

  const handleSearch = async (val: string): Promise<void> => {
    setSearchQuery(val)
    if (!val.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const results = await searchUsers(val)
      // Filter out duplicates by ID if the backend returns any
      const uniqueResults = Array.from(new Map(results.map((u: any) => [u.id, u])).values()) as Participant[]
      setSearchResults(uniqueResults)
    } catch (err) {
      console.error('Search failed', err)
    } finally {
      setSearching(false)
    }
  }

  const handleToggleAction = async (conversationId: string, action: string) => {
    try {
      const result = await toggleConversationAction(conversationId, action)
      setConversations(prev => prev.map(c =>
        c.id === conversationId ? { ...c, [result.field]: result.value } : c
      ))
      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev => prev ? { ...prev, [result.field]: result.value } : null)
      }
    } catch (err) {
      console.error(`Failed to ${action} conversation`, err)
    }
  }

  const handleClearConversation = async (conversationId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Effacer le chat',
      message: 'Voulez-vous vraiment effacer le contenu de cette conversation ?',
      type: 'warning',
      onConfirm: async () => {
        try {
          await clearConversation(conversationId)
          if (activeConversation?.id === conversationId) {
            setMessages([])
          }
        } catch (err) {
          console.error('Failed to clear conversation', err)
        }
      }
    })
  }

  const handleDeleteConversation = async (conversationId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer la conversation',
      message: 'Voulez-vous vraiment supprimer cette conversation ?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteConversation(conversationId)
          setConversations(prev => prev.filter(c => c.id !== conversationId))
          if (activeConversation?.id === conversationId) {
            setActiveConversation(null)
          }
        } catch (err) {
          console.error('Failed to delete conversation', err)
        }
      }
    })
  }

  const handleDeleteMessage = async (messageId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer le message',
      message: 'Voulez-vous vraiment supprimer ce message ?',
      type: 'danger',
      onConfirm: async () => {
        console.log('[ChatContainer] Deleting message with ID:', messageId);
        try {
          await deleteMessage(messageId)
          setMessages(prev => prev.filter(m => m.id !== messageId))
          setShowMsgInfoPanel(false)
        } catch (err) {
          console.error('Failed to delete message', err)
        }
      }
    })
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file || !activeConversation) return

    try {
      setMessagesLoading(true)
      const data = await uploadMedia(file)
      const payload = {
        content: data.url,
        content_type: file.type.startsWith('image/') ? 'image' : 'file'
      }
      await createMessage(activeConversation.id, payload)
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setMessagesLoading(false)
    }
  }

  const handleSelectUser = async (targetUser: Participant): Promise<void> => {
    console.log('[ChatContainer] Selecting user for chat:', {
      targetId: targetUser.id,
      targetEmail: targetUser.email,
      name: `${targetUser.first_name} ${targetUser.last_name}`
    })
    try {
      const conv = await createConversation({
        participant_ids: [targetUser.id],
        type: 'direct'
      })

      console.log('[ChatContainer] Conversation created/retrieved:', conv)

      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id)
        if (exists) return prev
        return [conv, ...prev]
      })

      setActiveConversation(conv)
      setSearchQuery('')
      setSearchResults([])
    } catch (err) {
      console.error('Failed to start conversation', err)
    }
  }

  const handleShareContact = async (contact: Participant) => {
    if (!activeConversation) return;
    try {
      const payload = {
        content: JSON.stringify({
          id: contact.id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          job_title: contact.job_title,
          avatar: contact.avatar,
          email: contact.email,
          phone_number: contact.phone_number
        }),
        content_type: 'contact'
      };
      await createMessage(activeConversation.id, payload);
    } catch (err) {
      console.error('Failed to share contact', err);
    }
  };

  const handleCreatePoll = async (poll: { question: string, options: string[] }) => {
    if (!activeConversation) return;
    try {
      const payload = {
        content: JSON.stringify({
          question: poll.question,
          options: poll.options.map(o => ({ text: o, votes: [] }))
        }),
        content_type: 'survey'
      };
      await createMessage(activeConversation.id, payload);
    } catch (err) {
      console.error('Failed to create poll', err);
    }
  };

  const handleVote = async (messageId: string, optionIndex: number) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    try {
      const poll = JSON.parse(msg.decryptedContent || msg.content);
      const myId = user?.id || user?.kumba_uid;
      const myIdStr = String(myId);

      poll.options = poll.options.map((opt: any, i: number) => {
        // Remove vote from all options first (one vote per user)
        const votes = opt.votes.filter((v: any) => String(v) !== myIdStr);
        if (i === optionIndex) {
          votes.push(myIdStr);
        }
        return { ...opt, votes };
      });

      const updatedContent = JSON.stringify(poll);
      await api.patch(`/connect/messages/${messageId}`, { content: updatedContent });

      // Update local state immediately for responsiveness
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, content: updatedContent, decryptedContent: updatedContent } : m
      ));
    } catch (err) {
      console.error('Failed to vote', err);
    }
  };

  const handleCreateEvent = async (event: { title: string, date: string, time: string, location?: string, description?: string }) => {
    if (!activeConversation) return;
    try {
      const payload = {
        content: JSON.stringify(event),
        content_type: 'event'
      };
      await createMessage(activeConversation.id, payload);
    } catch (err) {
      console.error('Failed to create event', err);
    }
  };

  const decryptedMessages = useMemo(() => {
    const myId = user?.id || user?.kumba_uid;
    const myIdNum = Number(myId);

    return messages.map((msg) => {
      const isEncryptedPayload =
        typeof msg.content === 'string' && msg.content.trim().startsWith('{"nonce":')

      if (!isEncryptedPayload || msg.decryptedContent) return msg

      try {
        const senderId = msg.sender_id;
        const currentUserId = user?.id;
        const currentKumbaUid = user?.kumba_uid;

        const isMe = Boolean(senderId && currentUserId && Number(senderId) === Number(currentUserId)) ||
          Boolean(senderId && currentKumbaUid && senderId.toString() === currentKumbaUid.toString());

        // Find other participant's public key
        let otherPubKey: string | undefined = undefined;

        if (activeConversation?.type === 'direct') {
          const otherId = activeConversation.target_user_id;
          otherPubKey = activeConversation.participants_details?.find(
            p => Number(p.id) === Number(otherId)
          )?.public_key;

          if (!otherPubKey) {
            otherPubKey = targetPublicKey || undefined;
          }
        } else {
          // Group chat - find the sender's public key
          otherPubKey = activeConversation?.participants_details?.find(
            p => Number(p.id) === Number(msg.sender_id)
          )?.public_key;
        }

        if (otherPubKey && myKeys.secretKey) {
          const decrypted = decryptMessage(msg.content, otherPubKey, myKeys.secretKey)
          if (decrypted && decrypted !== msg.content) {
            return { ...msg, decryptedContent: decrypted }
          }
        } else {
          console.warn(`[ChatContainer] Missing key for decryption: otherPubKey=${!!otherPubKey}, mySecretKey=${!!myKeys.secretKey}`);
        }
      } catch (e) {
        console.error('Decryption error:', e)
      }
      return msg
    })
  }, [messages, activeConversation?.participants_details, activeConversation?.target_user_id, myKeys, targetPublicKey, user?.id, user?.kumba_uid])

  const handleSendMessage = async (): Promise<void> => {
    if (!messageInput.trim() || !activeConversation) return

    let finalContent = messageInput
    let contentType = 'text'

    if (targetPublicKey && myKeys.secretKey) {
      finalContent = encryptMessage(messageInput, targetPublicKey, myKeys.secretKey)
      contentType = 'encrypted_text'
    }

    const payload = {
      content: finalContent,
      content_type: contentType
    }

    try {
      const data = await createMessage(activeConversation.id, payload)
      // Optimistically add message if WS is slow, but check for dupes in WS handler
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
      setMessageInput('')
      setTimeout(scrollToBottom, 100)
    } catch (err) {
      console.error('Failed to send message', err)
    }
  }

  const handleToggleStar = async (messageId: string): Promise<void> => {
    try {
      const updatedMsg = await starMessage(messageId)
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...updatedMsg } : m)))
    } catch (err) {
      console.error('Failed to star message', err)
    }
  }

  const handleAddReaction = async (messageId: string, emoji: string): Promise<void> => {
    try {
      const updatedMsg = await reactToMessage(messageId, emoji)
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...updatedMsg } : m)))
    } catch (err) {
      console.error('Failed to react to message', err)
    }
  }

  const handleCreateMeeting = async (type: 'audio' | 'video'): Promise<void> => {
    if (!activeConversation) return
    try {
      const meeting = await createMeeting({
        conversation_id: activeConversation.id,
        is_audio_only: type === 'audio'
      })
      console.log('[ChatContainer] Meeting API Response:', JSON.stringify(meeting));
      const rawId = meeting.id || meeting.access_token || meeting.meeting_id || (meeting.data && (meeting.data.id || meeting.data.meeting_id));
      const meetingId = (rawId === 'undefined' || !rawId) ? null : rawId;

      if (!meetingId) {
        console.error('[ChatContainer] Meeting created but ID is MISSING in response:', meeting);
      }

      await createMessage(activeConversation.id, {
        content: `Réunion ${type === 'video' ? 'vidéo' : 'audio'} démarrée: ${meetingId || 'ID_INCONNU'}`,
        content_type: 'meeting_link'
      });

      setActiveCall({
        meetingId: meetingId || '',
        type,
        isIncoming: false
      });

      console.log('[ChatContainer] Signaling call offer to target:', activeConversation.target_user_id);
      const payload = {
        type: 'call_signal',
        action: 'call_offer',
        meeting_id: meetingId,
        conversation_id: activeConversation.id,
        is_audio_only: type === 'audio',
        target_user_id: activeConversation.target_user_id,
        caller_first_name: user?.first_name || 'Membre'
      };
      console.log('[ChatContainer] Sending call signal:', payload);

      // Notify the other party via global WebSocket (Manual fallback)
      if (globalSocket?.sendJsonMessage) {
        globalSocket.sendJsonMessage(payload);
      }
    } catch (err) {
      console.error('Failed to create meeting', err);
    }
  }


  const handleScheduleMeeting = async (meetingData: { title: string, scheduled_at: string, is_audio_only: boolean, description?: string }) => {
    if (!activeConversation) return;
    try {
      const meeting = await createMeeting({
        conversation_id: activeConversation.id,
        title: meetingData.title,
        scheduled_at: meetingData.scheduled_at,
        is_audio_only: meetingData.is_audio_only,
        metadata: { description: meetingData.description }
      });

      console.log('[ChatContainer] Scheduled Meeting API Response:', JSON.stringify(meeting));
      const rawId = meeting.id || meeting.access_token || meeting.meeting_id || (meeting.data && (meeting.data.id || meeting.data.meeting_id));
      const meetingId = (rawId === 'undefined' || !rawId) ? null : rawId;

      await createMessage(activeConversation.id, {
        content: JSON.stringify({
          id: meetingId,
          title: meetingData.title,
          scheduled_at: meetingData.scheduled_at,
          is_audio_only: meetingData.is_audio_only,
          description: meetingData.description
        }),
        content_type: 'meeting_scheduled'
      });
    } catch (err) {
      console.error('Failed to schedule meeting', err);
    }
  };

  if (loading && !activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chargement de vos conversations...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-white rounded-[32px] border border-gray-100 shadow-2xl">
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r border-slate-100 flex flex-col shrink-0 bg-[#FBFDFF]">
          <div className="p-6">
            <div className="relative group mb-6">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Rechercher un collègue..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500/20 pl-10 pr-4 py-3 rounded-2xl w-full outline-none transition-all text-xs font-bold"
              />

              {(searchResults.length > 0 || searching) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto p-2">
                  {searching ? (
                    <div className="p-4 text-center text-[10px] font-black uppercase text-slate-400">Recherche...</div>
                  ) : (
                    searchResults.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer flex items-center gap-3 transition-colors"
                      >
                        <div
                          className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600 text-[10px] font-black overflow-hidden hover:ring-2 hover:ring-blue-500/20 transition-all cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenProfile(u);
                          }}
                        >
                          {u.avatar ? (
                            <img src={getFullAvatarUrl(u.avatar) || ''} className="w-full h-full object-cover" alt="" />
                          ) : (
                            u.first_name?.[0]
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-[#1E293B] truncate">{u.first_name} {u.last_name}</p>
                          <p className="text-[9px] font-bold text-slate-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 p-1 bg-slate-100/50 rounded-xl mb-6">
              <button
                onClick={() => setViewArchived(false)}
                className={clsx(
                  "flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                  !viewArchived ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Actifs
              </button>
              <button
                onClick={() => setViewArchived(true)}
                className={clsx(
                  "flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2",
                  viewArchived ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Archivés
                {conversations.some(c => c.is_archived) && !viewArchived && (
                   <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </button>
            </div>

            <div className="space-y-3">
              {conversations.map((conv) => {
                if (viewArchived !== !!conv.is_archived) return null;
                const isActive = activeConversation?.id === conv.id
                const lastMsgTime = conv.last_message
                  ? new Date(conv.last_message.created_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  : ''
                return (
                  <div key={conv.id} className="relative group">
                    <div
                      onClick={() => setActiveConversation(conv)}
                      className={clsx(
                        "p-4 rounded-2xl flex gap-3 cursor-pointer transition-all border",
                        isActive ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20" : "bg-white hover:bg-slate-50 border-slate-50 shadow-sm"
                      )}
                    >
                      <div
                        onClick={(e) => {
                          if (conv.type === 'direct') {
                            e.stopPropagation();
                            const otherParticipantId = conv.target_user_id;
                            const otherParticipant = conv.participants_details?.find(
                              p => Number(p.id) === Number(otherParticipantId)
                            );
                            if (otherParticipant) handleOpenProfile(otherParticipant);
                          }
                        }}
                        className={clsx(
                          "w-12 h-12 rounded-xl relative shrink-0 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500/20 transition-all",
                          isActive ? "bg-white/20" : "bg-slate-100"
                        )}
                      >
                        {conv.icon ? (
                          <img
                            src={getFullAvatarUrl(conv.icon) || ''}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserIcon
                            size={20}
                            className={isActive ? 'text-white' : 'text-slate-400'}
                          />
                        )}
                        {conv.participants_details?.some(
                          (p) =>
                            p.id === conv.target_user_id &&
                            p.last_seen &&
                            Date.now() - new Date(p.last_seen).getTime() < 300000
                        ) && (
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className={clsx("text-xs font-black truncate", isActive ? "text-white" : "text-[#1E293B]")}>
                            {conv.title || 'Inconnu'}
                          </h4>
                          <span className={clsx("text-[9px] font-bold", isActive ? "text-white/60" : "text-slate-400")}>
                            {lastMsgTime}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <p className={clsx("text-[11px] truncate font-medium flex-1", isActive ? "text-white/80" : "text-slate-500")}>
                            {(() => {
                              const lastMsg = conv.last_message;
                              if (!lastMsg || !lastMsg.content) return 'Aucun message';

                              if (typeof lastMsg.content === 'string' && lastMsg.content.trim().startsWith('{"nonce":')) {
                                try {
                                  // Find the other participant in this conversation to get their public key
                                  const otherParticipantId = conv.target_user_id;
                                  const otherParticipant = conv.participants_details?.find(
                                    p => Number(p.id) === Number(otherParticipantId)
                                  );

                                  if (otherParticipant?.public_key && myKeys.secretKey) {
                                    const decrypted = decryptMessage(lastMsg.content, otherParticipant.public_key, myKeys.secretKey);
                                    return decrypted || lastMsg.content;
                                  }
                                } catch (e) {
                                  return 'Message sécurisé';
                                }
                              }
                              return lastMsg.content;
                            })()}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenuId(activeMenuId === conv.id ? null : conv.id)
                            }}
                            className={clsx(
                              "p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all",
                              isActive ? "hover:bg-white/20 text-white" : "hover:bg-slate-100 text-slate-400"
                            )}
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dropdown Menu */}
                    {activeMenuId === conv.id && (
                      <div className="absolute right-2 top-14 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[60] overflow-hidden p-2 animate-in fade-in zoom-in duration-200">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleAction(conv.id, 'pin'); setActiveMenuId(null); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-wider"
                        >
                          <Shield size={14} className="text-slate-400" />
                          {conv.is_pinned ? 'Dépingler' : 'Épingler'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleAction(conv.id, 'archive'); setActiveMenuId(null); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-wider"
                        >
                          <LayoutGrid size={14} className="text-slate-400" />
                          {conv.is_archived ? 'Désarchiver' : 'Archiver'}
                        </button>
                        <div className="h-px bg-slate-50 my-1 mx-2" />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleClearConversation(conv.id); setActiveMenuId(null); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-slate-700 hover:bg-slate-50 rounded-xl transition-colors uppercase tracking-wider"
                        >
                          <RefreshCw size={14} className="text-amber-500" />
                          Vider le chat
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); setActiveMenuId(null); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black text-red-600 hover:bg-red-50 rounded-xl transition-colors uppercase tracking-wider"
                        >
                          <X size={14} className="text-red-500" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-slate-50/30 relative overflow-hidden">
          {activeConversation ? (
            <>
              <div className="px-8 py-5 bg-white border-b border-slate-100 flex justify-between items-center shadow-sm z-10">
                <div
                  className="flex items-center gap-3 cursor-pointer group text-left"
                  onClick={() => setShowInfoPanel(true)}
                >
                  <div
                    className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500/20 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (otherParticipant) handleOpenProfile(otherParticipant);
                    }}
                  >
                    {activeConversation.icon ? (
                      <img
                        src={getFullAvatarUrl(activeConversation.icon) || ''}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon size={18} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#1E293B] group-hover:text-blue-600 transition-colors">
                      {activeConversation.title}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {otherParticipant?.last_seen && Date.now() - new Date(otherParticipant.last_seen).getTime() < 300000 ? (
                        <>
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <p className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">
                            En ligne
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {otherParticipant?.last_seen
                              ? `Vu ${new Date(otherParticipant.last_seen).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}`
                              : 'Hors ligne'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMeetingScheduler(true)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all bg-white border border-slate-100 shadow-sm"
                    title="Programmer une réunion"
                  >
                    <Calendar size={18} />
                  </button>
                  <button
                    onClick={() => handleCreateMeeting('audio')}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all bg-white border border-slate-100 shadow-sm"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    onClick={() => handleCreateMeeting('video')}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all bg-white border border-slate-100 shadow-sm"
                  >
                    <Video size={18} />
                  </button>
                </div>
              </div>

              <div className="flex h-full overflow-hidden relative">
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="flex-1 p-8 overflow-y-auto flex flex-col space-y-6 relative">
                    {messagesLoading && (
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-20 flex items-center justify-center">
                        <RefreshCw className="text-blue-600 animate-spin" size={32} />
                      </div>
                    )}
                    {decryptedMessages.map((msg, idx) => {
                      const senderId = msg.sender_id;
                      const currentUserId = user?.id;
                      const currentKumbaUid = user?.kumba_uid;

                      const isMe = Boolean(senderId && currentUserId && Number(senderId) === Number(currentUserId)) ||
                        Boolean(senderId && currentKumbaUid && senderId.toString() === currentKumbaUid.toString());

                      return (
                        <div
                          key={msg.id}
                          className={clsx("flex w-full mb-4", msg.content_type === 'system' ? "justify-center" : (isMe ? "justify-end" : "justify-start"))}
                        >
                          {msg.content_type === 'system' ? (
                            <div className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-sm">
                              {msg.decryptedContent || msg.content}
                            </div>
                          ) : (
                            <div
                              className={clsx("flex gap-4 max-w-[85%]", isMe ? "flex-row-reverse ml-auto" : "flex-row")}
                            >
                            <div
                              className={clsx(
                                "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-black overflow-hidden",
                                isMe ? "bg-blue-600/20 text-blue-600" : "bg-slate-200 text-slate-500"
                              )}
                            >
                              {msg.sender_avatar ? (
                                <img
                                  src={getFullAvatarUrl(msg.sender_avatar) || ''}
                                  alt=""
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => {
                                    const myId = user?.id || user?.kumba_uid;
                                    const senderIdNum = Number(msg.sender_id);
                                    const myIdNum = Number(myId);
                                    const p = activeConversation?.participants_details?.find(p => Number(p.id) === senderIdNum);
                                    if (p) {
                                      handleOpenProfile(p);
                                    } else if (senderIdNum === myIdNum) {
                                      handleOpenProfile({
                                        id: myIdNum,
                                        first_name: user?.first_name || 'Moi',
                                        last_name: user?.last_name || '',
                                        email: user?.email || '',
                                        avatar: user?.avatar,
                                        username: user?.username,
                                        kumba_id: user?.kumba_id || user?.kumba_uid,
                                        phone_number: user?.phone,
                                        department: user?.company?.name || 'Administration',
                                        job_title: user?.job_title || 'Membre de l\'équipe',
                                        supervisor_name: 'Non assigné'
                                      } as Participant
                                      );
                                    }
                                  }}
                                />
                              ) : (
                                <div
                                  className="w-full h-full flex items-center justify-center cursor-pointer"
                                  onClick={() => {
                                    const myId = user?.id || user?.kumba_uid;
                                    const senderIdNum = Number(msg.sender_id);
                                    const myIdNum = Number(myId);
                                    const p = activeConversation?.participants_details?.find(p => Number(p.id) === senderIdNum);
                                    if (p) {
                                      handleOpenProfile(p);
                                    } else if (senderIdNum === myIdNum) {
                                      handleOpenProfile({
                                        id: myIdNum,
                                        first_name: user?.first_name || 'Moi',
                                        last_name: user?.last_name || '',
                                        email: user?.email || '',
                                        avatar: user?.avatar,
                                        username: user?.username,
                                        kumba_id: user?.kumba_id || user?.kumba_uid,
                                        phone_number: user?.phone,
                                        department: user?.company?.name || 'Administration',
                                        job_title: user?.job_title || 'Membre de l\'équipe',
                                        supervisor_name: 'Non assigné'
                                      } as Participant);
                                    }
                                  }}
                                >
                                  {msg.sender_name?.substring(0, 1) || '?'}
                                </div>
                              )}
                            </div>
                            <div
                              onContextMenu={(e) => {
                                e.preventDefault()
                                setSelectedMessageInfo({ ...msg, onDelete: isMe ? handleDeleteMessage : undefined })
                                setShowMsgInfoPanel(true)
                                setShowInfoPanel(false)
                              }}
                              className={clsx(
                                "p-4 rounded-2xl cursor-default relative group/msg",
                                isMe ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10 rounded-tr-none" : "bg-white border border-slate-100 shadow-sm rounded-tl-none"
                              )}
                            >
                              <button
                                onClick={() => {
                                  setSelectedMessageInfo({ ...msg, onDelete: isMe ? handleDeleteMessage : undefined })
                                  setShowMsgInfoPanel(true)
                                  setShowInfoPanel(false)
                                }}
                                className={clsx(
                                  "absolute -top-2 p-1.5 bg-white rounded-lg shadow-md border border-slate-100 text-slate-400 hover:text-blue-600 opacity-0 group-hover/msg:opacity-100 transition-all scale-75 group-hover/msg:scale-100",
                                  isMe ? "-left-8" : "-right-8"
                                )}
                                title="Infos du message"
                              >
                                <Info size={12} />
                              </button>
                              {!isMe && (
                                <p className="text-[10px] font-black text-blue-600 mb-1 uppercase tracking-tighter">
                                  {msg.sender_name}
                                </p>
                              )}
                              <div className="text-[13px] font-medium leading-relaxed">
                                {(() => {
                                  const content = msg.decryptedContent || msg.content;
                                  switch (msg.content_type) {
                                    case 'meeting_link':
                                      const isAudio = content.toLowerCase().includes('audio');
                                      // Look ahead to see if there's a "Call ended" system message for this call
                                      const isEnded = decryptedMessages.slice(idx + 1, idx + 20).some(m => 
                                        m.content_type === 'system' && (m.content.toLowerCase().includes('terminé') || m.content.toLowerCase().includes('manqué'))
                                      );

                                      return (
                                        <div className="space-y-4 min-w-[240px] mt-1">
                                          <div className="flex items-center gap-3">
                                            <div className={clsx(
                                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                              isAudio ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                                            )}>
                                              {isAudio ? <Mic size={20} /> : <Video size={20} />}
                                            </div>
                                            <div className="min-w-0">
                                              <p className={clsx("text-sm font-black truncate", isMe ? "text-white" : "text-slate-900")}>
                                                {isAudio ? 'Appel audio' : 'Appel vidéo'}
                                              </p>
                                              <p className={clsx("text-[10px] font-bold opacity-60")}>
                                                {isEnded ? 'Appel terminé' : new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                              </p>
                                            </div>
                                          </div>

                                          {!isEnded && (
                                            <button
                                              onClick={() => {
                                                let meetingId = content.split(': ').pop();
                                                if (meetingId === 'undefined') meetingId = null;

                                                if (meetingId) {
                                                  setActiveCall({
                                                    meetingId,
                                                    type: isAudio ? 'audio' : 'video',
                                                    isIncoming: false
                                                  });
                                                }
                                              }}
                                              className={clsx(
                                                "w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                                isMe
                                                  ? "bg-white text-slate-900 hover:bg-white/90 shadow-lg shadow-white/10"
                                                  : (isAudio ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20" : "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20")
                                              )}
                                            >
                                              Rejoindre l'appel
                                            </button>
                                          )}
                                        </div>
                                      );

                                    case 'meeting_scheduled':
                                      try {
                                        const meeting = JSON.parse(content);
                                        const dateObj = new Date(meeting.scheduled_at);
                                        return (
                                          <div className="space-y-4 min-w-[240px] mt-1">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                                <Calendar size={20} />
                                              </div>
                                              <div className="min-w-0">
                                                <p className={clsx("text-sm font-black truncate", isMe ? "text-white" : "text-slate-900")}>
                                                  {meeting.title}
                                                </p>
                                                <p className={clsx("text-[10px] font-bold opacity-60")}>
                                                  Réunion programmée
                                                </p>
                                              </div>
                                            </div>

                                            <div className={clsx("p-3 rounded-xl space-y-2 border", isMe ? "bg-white/10 border-white/10" : "bg-slate-50 border-slate-100")}>
                                              <div className="flex items-center gap-2 text-[11px] font-bold">
                                                <Clock size={14} className="opacity-40" />
                                                <span>
                                                  {dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2 text-[11px] font-bold">
                                                {meeting.is_audio_only ? <Mic size={14} className="opacity-40" /> : <Video size={14} className="opacity-40" />}
                                                <span>{meeting.is_audio_only ? 'Audio uniquement' : 'Vidéo conférence'}</span>
                                              </div>
                                              <div className="flex gap-2">
                                                <button
                                                  className={clsx(
                                                    "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                                    isMe ? "bg-white text-indigo-600 hover:bg-white/90 shadow-lg shadow-white/10" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                                                  )}
                                                >
                                                  Calendrier
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setActiveCall({
                                                      meetingId: meeting.id,
                                                      type: meeting.is_audio_only ? 'audio' : 'video',
                                                      isIncoming: false
                                                    });
                                                  }}
                                                  className={clsx(
                                                    "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                                    isMe ? "bg-indigo-400 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-400/20" : "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20"
                                                  )}
                                                >
                                                  Rejoindre
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      } catch (e) {
                                        return <p className="text-xs italic">Réunion corrompue</p>;
                                      }

                                    case 'event':
                                      try {
                                        const event = JSON.parse(content);
                                        return (
                                          <div className="space-y-4 min-w-[240px] mt-1">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                                                <Calendar size={20} />
                                              </div>
                                              <div className="min-w-0">
                                                <p className={clsx("text-sm font-black truncate", isMe ? "text-white" : "text-slate-900")}>
                                                  {event.title}
                                                </p>
                                                <p className={clsx("text-[10px] font-bold opacity-60")}>
                                                  Événement à venir
                                                </p>
                                              </div>
                                            </div>

                                            <div className={clsx("p-3 rounded-xl space-y-2 border", isMe ? "bg-white/10 border-white/10" : "bg-slate-50 border-slate-100")}>
                                              <div className="flex items-center gap-2 text-[11px] font-bold">
                                                <Clock size={14} className="opacity-40" />
                                                <span>{new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {event.time}</span>
                                              </div>
                                              {event.location && (
                                                <div className="flex items-center gap-2 text-[11px] font-bold">
                                                  <MapPin size={14} className="opacity-40" />
                                                  <span className="truncate">{event.location}</span>
                                                </div>
                                              )}
                                            </div>

                                            {event.description && (
                                              <p className={clsx("text-[11px] font-medium leading-relaxed opacity-80 line-clamp-3")}>
                                                {event.description}
                                              </p>
                                            )}

                                            <button
                                              className={clsx(
                                                "w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                                isMe ? "bg-white text-rose-600 hover:bg-white/90 shadow-lg shadow-white/10" : "bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20"
                                              )}
                                            >
                                              Je participe
                                            </button>
                                          </div>
                                        );
                                      } catch (e) {
                                        return <p className="text-xs italic">Événement corrompu</p>;
                                      }

                                    case 'survey':
                                      try {
                                        const poll = JSON.parse(content);
                                        const totalVotes = poll.options.reduce((acc: number, opt: any) => acc + opt.votes.length, 0);
                                        const myId = user?.id || user?.kumba_uid;
                                        const myIdStr = String(myId);

                                        return (
                                          <div className="space-y-4 min-w-[240px] mt-1">
                                            <p className={clsx("text-sm font-black leading-snug", isMe ? "text-white" : "text-slate-900")}>
                                              {poll.question}
                                            </p>
                                            <div className="space-y-2">
                                              {poll.options.map((opt: any, i: number) => {
                                                const percent = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                                                const hasVoted = opt.votes.some((v: any) => String(v) === myIdStr);

                                                return (
                                                  <button
                                                    key={i}
                                                    onClick={() => handleVote(msg.id, i)}
                                                    className="w-full relative group/opt overflow-hidden rounded-xl border border-slate-100/10 transition-all active:scale-[0.98]"
                                                  >
                                                    <div
                                                      className={clsx(
                                                        "absolute inset-0 transition-all duration-500",
                                                        isMe ? (hasVoted ? "bg-white/20" : "bg-white/5") : (hasVoted ? "bg-blue-500/10" : "bg-slate-50")
                                                      )}
                                                      style={{ width: `${percent}%` }}
                                                    />
                                                    <div className="relative p-3 flex justify-between items-center gap-3">
                                                      <div className="flex items-center gap-2 min-w-0">
                                                        {hasVoted && <div className={clsx("w-1.5 h-1.5 rounded-full shrink-0", isMe ? "bg-white" : "bg-blue-600")} />}
                                                        <span className={clsx("text-[11px] font-bold truncate", isMe ? "text-white" : "text-slate-700")}>
                                                          {opt.text}
                                                        </span>
                                                      </div>
                                                      <span className={clsx("text-[10px] font-black tabular-nums", isMe ? "text-white/60" : "text-slate-400")}>
                                                        {percent}%
                                                      </span>
                                                    </div>
                                                  </button>
                                                );
                                              })}
                                            </div>
                                            <p className={clsx("text-[9px] font-bold uppercase tracking-widest opacity-60")}>
                                              {totalVotes} vote{totalVotes > 1 ? 's' : ''}
                                            </p>
                                          </div>
                                        );
                                      } catch (e) {
                                        return <p className="text-xs italic">Sondage corrompu</p>;
                                      }

                                    case 'contact':
                                      try {
                                        const contact = JSON.parse(content);
                                        return (
                                          <div className="space-y-3 min-w-[200px] mt-1">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                                                {contact.avatar ? (
                                                  <img src={contact.avatar} className="w-full h-full object-cover" alt="" />
                                                ) : <UserIcon size={18} className="text-blue-600" />}
                                              </div>
                                              <div className="min-w-0">
                                                <p className={clsx("text-xs font-black truncate", isMe ? "text-white" : "text-slate-900")}>
                                                  {contact.first_name} {contact.last_name}
                                                </p>
                                                <p className={clsx("text-[10px] font-bold truncate", isMe ? "text-white/60" : "text-slate-400")}>
                                                  {contact.job_title || 'Contact'}
                                                </p>
                                              </div>
                                            </div>
                                            <button
                                              onClick={() => handleOpenProfile(contact)}
                                              className={clsx(
                                                "w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                                isMe ? "bg-white/10 hover:bg-white/20 text-white" : "bg-blue-50 hover:bg-blue-100 text-blue-600"
                                              )}
                                            >
                                              Voir le profil
                                            </button>
                                          </div>
                                        );
                                      } catch (e) {
                                        return <p className="text-xs italic">Contact corrompu</p>;
                                      }

                                    case 'image':
                                      return (
                                        <div className="mt-1 rounded-xl overflow-hidden border border-slate-100/10">
                                          <img
                                            src={content}
                                            alt="Pièce jointe"
                                            className="max-w-full max-h-[300px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(content, '_blank')}
                                          />
                                        </div>
                                      );

                                    case 'file':
                                    case 'document':
                                      return (
                                        <a
                                          href={content}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={clsx(
                                            "flex items-center gap-3 p-3 rounded-xl border transition-all mt-1",
                                            isMe ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100"
                                          )}
                                        >
                                          <div className={clsx("w-9 h-9 rounded-lg flex items-center justify-center", isMe ? "bg-white/20" : "bg-white shadow-sm")}>
                                            <FileIcon size={18} className={isMe ? "text-white" : "text-blue-600"} />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-black truncate">Document</p>
                                            <p className={clsx("text-[9px] font-bold opacity-60 truncate")}>Cliquer pour ouvrir</p>
                                          </div>
                                        </a>
                                      );

                                    default:
                                      return <p>{content}</p>;
                                  }
                                })()}
                              </div>

                              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {Object.entries(msg.reactions).map(([emoji, users]) => (
                                    <div
                                      key={emoji}
                                      onClick={() => handleAddReaction(msg.id, emoji)}
                                      className={clsx(
                                        "px-1.5 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-1 border cursor-pointer hover:bg-slate-50 transition-colors",
                                        users.map(u => Number(u)).includes(Number(user?.id || user?.kumba_uid || 0)) ? "bg-blue-600/5 border-blue-600/20 text-blue-600" : "bg-white border-slate-100 text-slate-400"
                                      )}
                                    >
                                      <span>{emoji}</span>
                                      <span>{users.length}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center justify-between gap-4 mt-1">
                                <div className="flex items-center gap-2">
                                  <span className={clsx("text-[9px] font-bold block uppercase whitespace-nowrap", isMe ? "text-white/50" : "text-slate-300")}>
                                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  {msg.is_starred && (
                                    <div className={isMe ? 'text-white/70' : 'text-yellow-500'}>
                                      <Shield size={8} fill="currentColor" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity relative">
                                  <div className={clsx(
                                    "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-white border border-slate-100 shadow-xl rounded-full px-2 py-1 z-10",
                                    isMe ? "right-0" : "left-0"
                                  )}>
                                    {['❤️', '👍', '🔥', '😂', '😮', '😢'].map((emoji) => (
                                      <button
                                        key={emoji}
                                        onClick={() => handleAddReaction(msg.id, emoji)}
                                        className="w-6 h-6 flex items-center justify-center text-xs hover:scale-125 transition-transform"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                    <div className="w-px h-3 bg-slate-100 mx-1" />
                                    <button
                                      onClick={() => handleToggleStar(msg.id)}
                                      className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                                    >
                                      <Star size={12} className={msg.is_starred ? 'fill-amber-500 text-amber-500' : ''} />
                                    </button>
                                  </div>
                                </div>
                                {isMe && (
                                  <div className="flex items-center">
                                    {msg.is_read ? (
                                      <CheckCheck size={12} className="text-white/70" />
                                    ) : (
                                      <Check size={12} className="text-white/40" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {otherIsTyping && (
                      <div className="flex items-center gap-3 animate-pulse px-2 py-1">
                        <div className="flex gap-1.5 items-center">
                          <span className="w-1.5 h-1.5 bg-blue-600/40 rounded-full animate-bounce delay-0"></span>
                          <span className="w-1.5 h-1.5 bg-blue-600/40 rounded-full animate-bounce delay-150"></span>
                          <span className="w-1.5 h-1.5 bg-blue-600/40 rounded-full animate-bounce delay-300"></span>
                        </div>
                        <span className="text-[10px] font-black text-blue-600/40 uppercase tracking-widest italic">
                          {activeConversation.title} est en train d'écrire...
                        </span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-6 bg-white border-t border-slate-100">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSendMessage()
                      }}
                      className="bg-slate-50 rounded-2xl p-2 flex items-center gap-2 border border-slate-100 focus-within:border-blue-600/20 focus-within:bg-white transition-all shadow-inner"
                    >
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                          className={clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            showAttachmentMenu ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          )}
                        >
                          <Paperclip size={18} />
                        </button>

                        <AnimatePresence>
                          {showAttachmentMenu && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-14 left-0 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-50"
                            >
                              <div className="flex flex-col">
                                {[
                                  { icon: <FileIcon size={20} />, label: 'Fichier', color: 'text-blue-500', bg: 'bg-blue-50', action: () => fileInputRef.current?.click() },
                                  { icon: <ImageIcon size={20} />, label: 'Photos et vidéos', color: 'text-blue-600', bg: 'bg-blue-50', action: () => fileInputRef.current?.click() },
                                  { icon: <UsersIcon size={20} />, label: 'Contact', color: 'text-orange-500', bg: 'bg-orange-50', action: () => setShowContactPicker(true) },
                                  { icon: <BarChart2 size={20} />, label: 'Sondage', color: 'text-amber-500', bg: 'bg-amber-50', action: () => setShowPollCreator(true) },
                                  { icon: <Calendar size={20} />, label: 'Événement', color: 'text-rose-500', bg: 'bg-rose-50', action: () => setShowEventCreator(true) },
                                ].map((item, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => {
                                      item.action?.();
                                      setShowAttachmentMenu(false);
                                    }}
                                    className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors group text-left w-full"
                                  >
                                    <div className={clsx(
                                      "w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
                                      item.bg, item.color
                                    )}>
                                      {item.icon}
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">
                                      {item.label}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleMediaUpload}
                        className="hidden"
                      />
                      <input
                        type="text"
                        placeholder="Écrivez votre message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none px-2 py-3 text-sm font-medium"
                      />
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className={clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                            showEmojiPicker ? "bg-amber-100 text-amber-600" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          )}
                        >
                          <Smile size={18} />
                        </button>

                        <AnimatePresence>
                          {showEmojiPicker && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-14 right-0 z-50 shadow-2xl rounded-3xl overflow-hidden border border-slate-100"
                            >
                              <EmojiPicker
                                onEmojiClick={(emojiData) => {
                                  setMessageInput(prev => prev + emojiData.emoji);
                                  setShowEmojiPicker(false);
                                }}
                                theme={Theme.LIGHT}
                                lazyLoadEmojis={true}
                                searchPlaceHolder="Rechercher un emoji..."
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none"
                      >
                        <Send size={18} className="translate-x-0.5" />
                      </button>
                    </form>
                  </div>
                </div>

                <MessageInfoPanel
                  isOpen={showMsgInfoPanel}
                  onClose={() => setShowMsgInfoPanel(false)}
                  message={selectedMessageInfo}
                />

                <UserProfileModal
                  isOpen={profileModalOpen}
                  onClose={() => setProfileModalOpen(false)}
                  user={selectedProfileUser}
                  onStartChat={(u) => {
                    handleSelectUser(u)
                    setProfileModalOpen(false)
                  }}
                  onStartCall={(type) => {
                    handleCreateMeeting(type)
                    setProfileModalOpen(false)
                  }}
                  onShowMedia={() => {
                    setShowInfoPanel(true)
                    setProfileModalOpen(false)
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
              <MessageCircle size={64} strokeWidth={1} className="mb-4 opacity-20" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Sélectionnez une conversation</p>
            </div>
          )}
        </main>
        <ContactPickerModal
          isOpen={showContactPicker}
          onClose={() => setShowContactPicker(false)}
          onSelect={handleShareContact}
        />
        <PollCreatorModal
          isOpen={showPollCreator}
          onClose={() => setShowPollCreator(false)}
          onCreate={handleCreatePoll}
        />
        <EventCreatorModal
          isOpen={showEventCreator}
          onClose={() => setShowEventCreator(false)}
          onCreate={handleCreateEvent}
        />
        <MeetingSchedulerModal
          isOpen={showMeetingScheduler}
          onClose={() => setShowMeetingScheduler(false)}
          onSchedule={handleScheduleMeeting}
        />
        {activeCall && (
          (() => {
            console.log('[ChatContainer] Rendering CallOverlay with:', activeCall);
            return (
              <CallOverlay
                meetingId={activeCall.meetingId}
                isAudioOnly={activeCall.type === 'audio'}
                isIncoming={activeCall.isIncoming}
                callerInfo={activeCall.callerInfo}
                onClose={() => {
                  if (globalSocket?.sendJsonMessage) {
                    let action = activeCall.isIncoming ? 'call_rejected' : 'call_canceled';
                    // If the call was already in progress or connected, it's an 'end'
                    // We can't easily know the status here unless we lift it up, 
                    // but we can assume 'call_ended' is a safe fallback for closing an active overlay
                    if (activeCall.meetingId) action = 'call_ended';

                    globalSocket.sendJsonMessage({
                      type: 'call_signal',
                      action: action,
                      meeting_id: activeCall.meetingId,
                      conversation_id: activeConversation?.id,
                      target_user_id: activeConversation?.target_user_id
                    });
                  }
                  setActiveCall(null);
                }}
              />
            );
          })()
        )}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
        />
      </div>
    </div>
  )
}

