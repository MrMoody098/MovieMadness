<!-- 91f50fa5-ecd0-46a5-b1e7-6a1d2dfcb0c2 91de282f-edde-43ed-93ed-ed5ec79892d9 -->
# Add Join Room to Navigation Bar

## Changes Needed

### 1. Update NavBar Component

Add a "Join Room" button/link to the navigation bar that triggers a join room modal.

### 2. Create JoinRoomModal Component

Create a new modal component (`JoinRoomModal.js`) that:

- Shows input fields for nickname and room code
- Validates inputs before joining
- Uses the existing `joinRoom` function from `watchParty.js`
- Redirects user to the appropriate content (movie/TV show) after joining
- Handles errors gracefully (invalid room code, room doesn't exist)

### 3. Update WatchPartyManager

Simplify the `WatchPartyManager.js` component by:

- Removing the "Join Room" button from the initial modal
- Keeping only "Start Watch Party" functionality
- Component will now only be opened from movie/TV modals for creating rooms

### 4. App State Management

Update `App.js` to:

- Manage the join room modal state
- Handle navigation after successful room join
- Fetch room data to determine if it's a movie or TV show
- Open the appropriate modal with the correct content

## Implementation Details

**Files to Modify:**

- `movie-man-view/src/components/NavBar.js` - Add "Join Room" button
- `movie-man-view/src/App.js` - Add join modal state and logic
- `movie-man-view/src/components/watchparty/WatchPartyManager.js` - Remove join functionality

**Files to Create:**

- `movie-man-view/src/components/modals/JoinRoomModal.js` - Standalone join room modal

## User Flow

1. User clicks "Join Room" in navbar
2. Modal opens with nickname and room code inputs
3. User enters details and clicks "Join"
4. System validates room exists and fetches room data
5. Opens appropriate modal (movie/TV) with watch party active
6. User is automatically connected to the watch party

### To-dos

- [ ] Install required npm packages (emoji-picker-react, react-copy-to-clipboard)
- [ ] Extend watchParty.js to support movies, video sync state, and user nicknames
- [ ] Create videoSync.js utility for handling iframe player sync logic
- [ ] Create ChatPanel.js component with emoji picker integration
- [ ] Create ParticipantsList.js component to display active users
- [ ] Create WatchPartyManager.js main component integrating chat, participants, and sync
- [ ] Add watch party button and integration to MovieModal.js
- [ ] Add watch party button and integration to TvModal.js
- [ ] Create WatchParty.css with responsive dark theme styling