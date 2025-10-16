import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { sendMessage } from '../../utils/watchParty';
import '../css/WatchParty.css';

const ChatPanel = ({ roomId, messages, currentUserId }) => {
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending messages
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      await sendMessage(roomId, messageText.trim());
      setMessageText('');
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiObject) => {
    setMessageText(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    chatInputRef.current?.focus();
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get user nickname from message
  const getUserNickname = (message) => {
    if (message.type === 'system') return 'System';
    return message.nickname || 'Anonymous';
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type || 'user'}`}>
            <div className="message-header">
              <span className="message-sender">
                {getUserNickname(message)}
              </span>
              <span className="message-time">
                {formatTime(message.createdAt)}
              </span>
            </div>
            <div className="message-text">
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSendMessage} className="chat-input-wrapper">
          <textarea
            ref={chatInputRef}
            className="chat-input"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows="1"
            style={{
              height: 'auto',
              minHeight: '20px',
              maxHeight: '80px',
              overflow: 'auto'
            }}
          />
          <button
            type="button"
            className="emoji-button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Add emoji"
          >
            😀
          </button>
          <button
            type="submit"
            className="send-button"
            disabled={!messageText.trim()}
          >
            Send
          </button>
        </form>

        {showEmojiPicker && (
          <div className="emoji-picker-container">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={300}
              height={300}
              searchDisabled={false}
              skinTonesDisabled={false}
              previewConfig={{
                showPreview: false
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
