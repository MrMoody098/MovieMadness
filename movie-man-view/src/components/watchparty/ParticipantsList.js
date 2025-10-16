import React from 'react';
import { ensureAnonymousAuth } from '../../utils/firebase';
import '../css/WatchParty.css';

const ParticipantsList = ({ participants, hostUid }) => {
  const [currentUserId, setCurrentUserId] = React.useState(null);

  React.useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const user = await ensureAnonymousAuth();
        setCurrentUserId(user.uid);
      } catch (error) {
        console.error('Error getting current user:', error);
      }
    };
    getCurrentUser();
  }, []);

  // Get participant list as array
  const participantList = participants ? Object.entries(participants).map(([uid, data]) => ({
    uid,
    ...data
  })) : [];

  // Sort participants (host first)
  const sortedParticipants = participantList.sort((a, b) => {
    if (a.uid === hostUid) return -1;
    if (b.uid === hostUid) return 1;
    return 0;
  });

  // Get initials from nickname
  const getInitials = (nickname) => {
    if (!nickname) return '?';
    return nickname
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar color based on nickname
  const getAvatarColor = (nickname) => {
    if (!nickname) return '#f5c518';
    
    const colors = [
      '#f5c518', '#e74c3c', '#3498db', '#2ecc71', 
      '#9b59b6', '#f39c12', '#1abc9c', '#e67e22'
    ];
    
    let hash = 0;
    for (let i = 0; i < nickname.length; i++) {
      hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="participants-list">
      <div className="participants-title">
        Participants ({participantList.length})
      </div>
      {sortedParticipants.map((participant) => {
        const isHost = participant.uid === hostUid;
        const isCurrentUser = participant.uid === currentUserId;
        
        return (
          <div key={participant.uid} className="participant-item">
            <div 
              className="participant-avatar"
              style={{ backgroundColor: getAvatarColor(participant.nickname) }}
            >
              {getInitials(participant.nickname)}
            </div>
            <span className="participant-name">
              {participant.nickname || 'Anonymous'}
              {isCurrentUser && ' (You)'}
            </span>
            {isHost && (
              <span className="host-badge">HOST</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ParticipantsList;
