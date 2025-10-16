# Watch Party Feature

## Overview
The Watch Party feature allows users to watch movies and TV shows together in real-time with synchronized playback, chat functionality, and user nicknames.

## Features

### 🎬 Synchronized Playback
- Real-time video sync across all participants
- Host controls playback (play/pause/seek)
- Participants automatically sync to host's actions
- Debounced updates to prevent excessive Firebase writes

### 💬 Chat System
- Real-time messaging between participants
- Emoji picker for reactions and expressions
- System messages for user join/leave events
- Auto-scroll to latest messages

### 👥 User Management
- Custom nicknames for each participant
- Host designation with special controls
- Participant list with avatars
- Persistent nicknames across sessions

### 🎯 Room Management
- Easy room code sharing (8-character codes)
- One-click copy to clipboard
- Join existing rooms with room codes
- Support for both movies and TV shows

## How to Use

### Starting a Watch Party
1. Open any movie or TV show modal
2. Click the "🎉 Start Watch Party" button
3. Enter your nickname
4. Share the room code with friends

### Joining a Watch Party
1. Click "Join Room" in the watch party modal
2. Enter the room code provided by the host
3. Enter your nickname
4. Start watching together!

### During the Watch Party
- **Host**: Controls playback, episode selection (TV shows), and room management
- **Participants**: Watch synchronized content and can chat
- **Chat**: Type messages and use emojis to react
- **Sync**: Video automatically syncs across all participants

## Technical Implementation

### Components
- `WatchPartyManager.js` - Main component managing the watch party
- `ChatPanel.js` - Chat interface with emoji picker
- `ParticipantsList.js` - Display of active participants
- `videoSync.js` - Video synchronization utility

### Firebase Schema
- `watchParties` collection stores room data
- `messages` subcollection for chat messages
- Real-time listeners for live updates

### Video Sync
- Uses iframe postMessage API for player communication
- Debounced updates to prevent excessive Firebase writes
- Host-priority system for conflict resolution

## Dependencies
- `emoji-picker-react` - Emoji picker component
- `react-copy-to-clipboard` - Room code sharing
- Firebase Firestore - Real-time database
- Firebase Auth - Anonymous authentication

## Browser Compatibility
- Modern browsers with iframe postMessage support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile responsive design

## Troubleshooting

### Common Issues
1. **Video not syncing**: Ensure you're using VidKing player (not VidSrc)
2. **Can't join room**: Check room code is correct and room still exists
3. **Chat not working**: Check Firebase configuration
4. **Nickname not saving**: Check localStorage permissions

### Performance Tips
- Limit watch parties to reasonable group sizes (10-20 participants)
- Ensure stable internet connection for best sync
- Close other browser tabs to improve performance
