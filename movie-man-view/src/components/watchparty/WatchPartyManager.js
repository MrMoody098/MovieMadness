import React, { useState, useEffect, useRef } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { 
  createRoom, 
  joinRoom, 
  onRoomChange, 
  onMessages, 
  sendSystemMessage,
  updateSelection 
} from '../../utils/watchParty';
import { ensureAnonymousAuth, createNewAnonymousUser } from '../../utils/firebase';
import VideoSync from '../../utils/videoSync';
import ChatPanel from './ChatPanel';
import ParticipantsList from './ParticipantsList';
import '../css/WatchParty.css';

const WatchPartyManager = ({ 
  isOpen, 
  onClose, 
  contentType, 
  contentData, 
  iframeRef,
  onSeasonEpisodeChange,
  initialRoomId,
  onHostStatusChange
}) => {
  // Generate unique instance ID to prevent conflicts
  const instanceId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);
  
  const [roomId, setRoomId] = useState(initialRoomId || null);
  const [roomData, setRoomData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isHost, setIsHost] = useState(null);
  // Removed join room functionality - now handled by separate JoinRoomModal
  const [nickname, setNickname] = useState('');
  const [videoSync, setVideoSync] = useState(null);
  const [copied, setCopied] = useState(false);

  // Initialize user and nickname
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const user = await ensureAnonymousAuth();
        setCurrentUserId(user.uid);
        
        // Load saved nickname or set default
        const savedNickname = localStorage.getItem('watchPartyNickname') || 'Anonymous';
        setNickname(savedNickname);
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };
    
    initializeUser();
  }, []);

  // Handle initial room join if initialRoomId is provided
  useEffect(() => {
    if (initialRoomId && !roomId) {
      // When joining an existing room, create a new anonymous user
      const joinExistingRoom = async () => {
        try {
          const user = await createNewAnonymousUser();
          console.log(`[${instanceId}] Joined existing room with new user:`, user.uid, 'room:', initialRoomId);
          setCurrentUserId(user.uid);
          setRoomId(initialRoomId);
        } catch (error) {
          console.error(`[${instanceId}] Error joining existing room:`, error);
        }
      };
      joinExistingRoom();
    }
  }, [initialRoomId, roomId, instanceId]);

  // Save nickname to localStorage when it changes
  useEffect(() => {
    if (nickname) {
      localStorage.setItem('watchPartyNickname', nickname);
    }
  }, [nickname]);

  // Set up room listeners when roomId changes
  useEffect(() => {
    if (!roomId) return;

    // Listen to room changes
    const unsubscribeRoom = onRoomChange(roomId, (data) => {
      setRoomData(data);
      
      // Check if current user is host
      if (data && currentUserId) {
        const newIsHost = data.hostUid === currentUserId;
        console.log(`[${instanceId}] Host detection:`, {
          currentUserId,
          hostUid: data.hostUid,
          isHost: newIsHost,
          participants: data.participants
        });
        setIsHost(newIsHost);
        // Notify parent component of host status change
        onHostStatusChange?.(newIsHost);
      }

      // Sync video if not host and playback state changed
      if (videoSync && isHost === false && data?.playbackState) {
        console.log('WatchPartyManager: Syncing participant to remote state:', data.playbackState);
        videoSync.syncToRemoteState(data.playbackState);
      }

      // Handle season/episode changes for TV shows
      if (contentType === 'tv' && data?.seasonNumber && data?.episodeNumber) {
        onSeasonEpisodeChange?.(data.seasonNumber, data.episodeNumber);
      }
    });

    // Listen to messages
    const unsubscribeMessages = onMessages(roomId, (msgs) => {
      setMessages(msgs);
    });

    return () => {
      unsubscribeRoom();
      unsubscribeMessages();
    };
  }, [roomId, currentUserId, videoSync, isHost, contentType, onSeasonEpisodeChange]);

  // Initialize video sync when iframe is available and host status is determined
  useEffect(() => {
    if (iframeRef && roomId && currentUserId && isHost !== null) {
      // Clean up existing VideoSync first
      if (videoSync) {
        console.log(`[${instanceId}] Destroying existing VideoSync for room:`, roomId);
        videoSync.destroy();
        setVideoSync(null);
      }

      // Create new VideoSync based on host status
      if (isHost) {
        console.log(`[${instanceId}] Creating VideoSync for HOST in room:`, roomId);
        const sync = new VideoSync(roomId, true);
        sync.init(iframeRef);
        setVideoSync(sync);
      } else {
        console.log(`[${instanceId}] Creating VideoSync for PARTICIPANT in room:`, roomId);
        const sync = new VideoSync(roomId, false);
        sync.init(iframeRef);
        setVideoSync(sync);
      }
    }

    return () => {
      if (videoSync) {
        console.log(`[${instanceId}] Cleaning up VideoSync for room:`, roomId);
        videoSync.destroy();
      }
    };
  }, [iframeRef, roomId, currentUserId, isHost]);

  // Handle creating a room
  const handleCreateRoom = async () => {
    try {
      const roomData = {
        contentType,
        nickname
      };

      if (contentType === 'tv') {
        roomData.tvShowId = contentData.id;
        roomData.tvShowName = contentData.name;
        roomData.seasonNumber = contentData.seasonNumber || 1;
        roomData.episodeNumber = contentData.episodeNumber || 1;
      } else {
        roomData.movieId = contentData.id;
        roomData.movieName = contentData.title;
      }

      const { roomId: newRoomId } = await createRoom(roomData);
      setRoomId(newRoomId);
      
      // Send welcome message
      await sendSystemMessage(newRoomId, `${nickname} started a watch party!`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create watch party room. Please try again.');
    }
  };

  // Join room functionality removed - now handled by JoinRoomModal

  // Handle closing watch party
  const handleClose = () => {
    if (videoSync) {
      videoSync.destroy();
    }
    setRoomId(null);
    setRoomData(null);
    setMessages([]);
    setVideoSync(null);
    onClose();
  };

  // Handle copy to clipboard
  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle season/episode change for TV shows
  const handleSeasonEpisodeChange = async (season, episode) => {
    if (isHost === true && roomId) {
      await updateSelection(roomId, { seasonNumber: season, episodeNumber: episode });
    }
  };

  if (!isOpen) return null;

  // Show create room modal if no room is active
  if (!roomId) {
    return (
      <div className="join-room-modal">
        <div className="join-room-content">
          <h2 className="join-room-title">Start Watch Party</h2>
          <div className="join-room-form">
            <div className="form-group">
              <label className="form-label">Your Nickname</label>
              <input
                type="text"
                className="form-input"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                maxLength={20}
              />
            </div>
            <div className="form-buttons">
              <button
                className="form-button primary"
                onClick={handleCreateRoom}
                disabled={!nickname.trim()}
              >
                Start Watch Party
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main watch party interface
  return (
    <div className="watch-party-container">
      <div className="watch-party-header">
        <h3 className="watch-party-title">
          Watch Party
          {isHost === true && <span style={{color: '#f5c518', fontSize: '14px', marginLeft: '10px'}}>👑 HOST</span>}
          {isHost === false && <span style={{color: '#888', fontSize: '14px', marginLeft: '10px'}}>👥 Participant</span>}
        </h3>
        <button className="close-button" onClick={handleClose}>
          ×
        </button>
      </div>

      <div className="room-info">
        <div className="room-code">
          <span className="room-code-label">Room Code:</span>
          <span className="room-code-value">{roomId?.toLowerCase()}</span>
          <CopyToClipboard text={roomId?.toLowerCase() || ''} onCopy={handleCopy}>
            <button className="copy-button">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </CopyToClipboard>
        </div>
        <div className="participants-count">
          {roomData?.participants ? Object.keys(roomData.participants).length : 0} participants
        </div>
        {!isHost && (
          <div style={{
            backgroundColor: '#2d2d2d',
            padding: '8px 12px',
            borderRadius: '5px',
            fontSize: '12px',
            color: '#cccccc',
            marginTop: '8px',
            textAlign: 'center'
          }}>
            🎮 Only the host can control playback, seeking, and episode selection
          </div>
        )}
      </div>

      <ParticipantsList 
        participants={roomData?.participants} 
        hostUid={roomData?.hostUid} 
      />

      <ChatPanel 
        roomId={roomId}
        messages={messages}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default WatchPartyManager;
