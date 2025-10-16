import { updatePlaybackState, seekTo } from './watchParty';

class VideoSync {
  constructor(roomId, isHost = false) {
    this.roomId = roomId;
    this.isHost = isHost;
    this.lastSyncTime = 0;
    this.syncThreshold = 2; // seconds
    this.debounceTimeout = null;
    this.isListening = false;
    this.iframeRef = null;
  }

  // Initialize sync with iframe reference
  init(iframeRef) {
    this.iframeRef = iframeRef;
    this.startListening();
  }

  // Start listening to iframe messages
  startListening() {
    if (this.isListening) return;
    this.isListening = true;

    window.addEventListener('message', this.handlePlayerMessage.bind(this));
  }

  // Stop listening to iframe messages
  stopListening() {
    this.isListening = false;
    window.removeEventListener('message', this.handlePlayerMessage.bind(this));
  }

  // Handle messages from the iframe player
  handlePlayerMessage(event) {
    try {
      const messageData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      
      // Handle VidKing player events
      if (messageData.type === 'PLAYER_EVENT' && messageData.data) {
        const { event: playerEvent, currentTime, duration, progress, id, mediaType, season, episode } = messageData.data;
        
        console.log('VideoSync received VidKing player event:', { 
          playerEvent, 
          currentTime, 
          duration, 
          progress, 
          id, 
          mediaType, 
          isHost: this.isHost 
        });
        
        // Only host can broadcast playback state changes
        if (this.isHost) {
          console.log('Host broadcasting VidKing player event:', playerEvent);
          this.handleHostPlayerEvent(playerEvent, currentTime, duration);
        } else {
          console.log('Participant ignoring VidKing player event (not host)');
        }
      }
    } catch (error) {
      // Ignore non-JSON messages
      console.log('VideoSync received non-JSON message:', event.data);
    }
  }

  // Handle player events when user is host
  handleHostPlayerEvent(playerEvent, currentTime, duration) {
    switch (playerEvent) {
      case 'play':
        console.log('Host play event - updating playback state');
        this.debouncedUpdatePlaybackState(true, currentTime);
        break;
      case 'pause':
        console.log('Host pause event - updating playback state');
        this.debouncedUpdatePlaybackState(false, currentTime);
        break;
      case 'timeupdate':
        // Only update every 2 seconds to avoid excessive Firebase writes
        console.log('Host timeupdate event - debounced update');
        this.debouncedUpdatePlaybackState(true, currentTime);
        break;
      case 'seeked':
        console.log('Host seeked event - immediate seek update');
        this.handleSeek(currentTime);
        break;
      case 'ended':
        console.log('Host ended event - video finished');
        this.debouncedUpdatePlaybackState(false, currentTime);
        break;
      default:
        console.log('Host unknown event:', playerEvent);
    }
  }

  // Debounced update to prevent excessive Firebase writes
  debouncedUpdatePlaybackState(isPlaying, currentTime) {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    this.debounceTimeout = setTimeout(() => {
      console.log('Host updating playback state:', { isPlaying, currentTime, roomId: this.roomId });
      updatePlaybackState(this.roomId, { isPlaying, currentTime });
    }, 500); // 500ms debounce
  }

  // Handle seek events
  handleSeek(currentTime) {
    console.log('Host seeking to:', currentTime, 'in room:', this.roomId);
    seekTo(this.roomId, currentTime);
  }

  // Sync to remote playback state (for participants)
  syncToRemoteState(playbackState) {
    if (!this.iframeRef) return;

    const { isPlaying, currentTime } = playbackState;
    const timeDiff = Math.abs(currentTime - this.lastSyncTime);

    console.log('Participant syncing to remote state:', { isPlaying, currentTime, timeDiff, isHost: this.isHost });

    // VidKing doesn't support real-time control via postMessage
    // We need to reload the iframe with new progress parameter for seeking
    if (timeDiff > this.syncThreshold) {
      console.log('Participant seeking to:', currentTime, '- reloading iframe with progress parameter');
      this.seekByReloading(currentTime);
      this.lastSyncTime = currentTime;
    }

    // Note: VidKing doesn't support external play/pause control
    // Participants will need to manually sync play/pause state
    console.log('Participant should manually sync play/pause state:', isPlaying ? 'play' : 'pause');
  }

  // Seek by reloading iframe with progress parameter
  seekByReloading(currentTime) {
    if (!this.iframeRef) return;

    const currentSrc = this.iframeRef.src;
    console.log('Current iframe src:', currentSrc);
    
    try {
      // Check if the src is a valid URL
      if (!currentSrc || currentSrc === 'about:blank') {
        console.log('Invalid iframe src, cannot seek');
        return;
      }
      
      const url = new URL(currentSrc);
      
      // Add or update progress parameter
      url.searchParams.set('progress', Math.floor(currentTime));
      
      // Reload iframe with new progress
      this.iframeRef.src = url.toString();
      console.log('Reloaded iframe with progress:', Math.floor(currentTime), 'new src:', url.toString());
    } catch (error) {
      console.error('Error parsing iframe URL for seeking:', error);
      console.log('Current src that failed:', currentSrc);
      
      // Fallback: try to manually add progress parameter
      if (currentSrc.includes('?')) {
        // URL already has parameters
        const separator = currentSrc.includes('progress=') ? '&' : '&';
        const newSrc = currentSrc.replace(/[?&]progress=\d+/, '') + `${separator}progress=${Math.floor(currentTime)}`;
        this.iframeRef.src = newSrc;
        console.log('Fallback: Reloaded iframe with progress:', Math.floor(currentTime), 'new src:', newSrc);
      } else {
        // URL has no parameters
        const newSrc = currentSrc + `?progress=${Math.floor(currentTime)}`;
        this.iframeRef.src = newSrc;
        console.log('Fallback: Reloaded iframe with progress:', Math.floor(currentTime), 'new src:', newSrc);
      }
    }
  }

  // Send commands to the iframe player
  sendCommandToPlayer(command, value = null) {
    if (!this.iframeRef || !this.iframeRef.contentWindow) return;

    try {
      // VidKing player expects specific command format
      let commandData = {
        type: 'CONTROL_COMMAND',
        command: command
      };
      
      if (value !== null) {
        commandData.value = value;
      }
      
      console.log('Sending command to VidKing player:', commandData);
      this.iframeRef.contentWindow.postMessage(commandData, '*');
    } catch (error) {
      console.error('Error sending command to VidKing player:', error);
    }
  }

  // Cleanup
  destroy() {
    this.stopListening();
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  }
}

export default VideoSync;
