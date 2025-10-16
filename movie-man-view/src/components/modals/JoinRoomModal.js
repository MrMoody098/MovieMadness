import React, { useState, useEffect } from 'react';
import { joinRoom, onRoomChange } from '../../utils/watchParty';
import { ensureAnonymousAuth } from '../../utils/firebase';
import '../css/WatchParty.css';

const JoinRoomModal = ({ isOpen, onClose, onJoinSuccess }) => {
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load saved nickname on component mount
  useEffect(() => {
    const savedNickname = localStorage.getItem('watchPartyNickname') || 'Anonymous';
    setNickname(savedNickname);
  }, []);

  // Save nickname to localStorage when it changes
  useEffect(() => {
    if (nickname) {
      localStorage.setItem('watchPartyNickname', nickname);
    }
  }, [nickname]);

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!roomCode.trim() || !nickname.trim()) {
      setError('Please enter both room code and nickname');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Ensure room code is lowercase (as stored in Firebase)
      const lowerCaseRoomCode = roomCode.trim().toLowerCase();
      
      // First, check if room exists by trying to join
      await joinRoom(lowerCaseRoomCode, nickname.trim());
      
      // If join successful, fetch room data to determine content type
      const unsubscribe = onRoomChange(lowerCaseRoomCode, (roomData) => {
        if (roomData) {
          unsubscribe(); // Stop listening
          onJoinSuccess(roomData, lowerCaseRoomCode);
          onClose();
        }
      });

      // Set a timeout in case room doesn't exist
      setTimeout(() => {
        unsubscribe();
        setError('Room not found or invalid room code');
        setIsLoading(false);
      }, 5000);

    } catch (error) {
      console.error('Error joining room:', error);
      setError('Failed to join room. Please check the room code.');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRoomCode('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="join-room-modal">
      <div className="join-room-content">
        <h2 className="join-room-title">Join Watch Party</h2>
        <form onSubmit={handleJoinRoom} className="join-room-form">
          <div className="form-group">
            <label className="form-label">Your Nickname</label>
            <input
              type="text"
              className="form-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              maxLength={20}
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Room Code</label>
            <input
              type="text"
              className="form-input"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toLowerCase())}
              onPaste={(e) => {
                // Handle paste events to ensure lowercase conversion
                const pastedText = e.clipboardData.getData('text').toLowerCase();
                e.preventDefault();
                setRoomCode(pastedText);
              }}
              placeholder="Enter room code"
              maxLength={8}
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="error-message" style={{ 
              color: '#e74c3c', 
              fontSize: '14px', 
              marginBottom: '10px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div className="form-buttons">
            <button
              type="submit"
              className="form-button primary"
              disabled={!roomCode.trim() || !nickname.trim() || isLoading}
            >
              {isLoading ? 'Joining...' : 'Join Room'}
            </button>
            <button
              type="button"
              className="form-button secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinRoomModal;
