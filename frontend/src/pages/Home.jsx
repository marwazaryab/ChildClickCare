import React, { useState } from 'react';
import '../styles/Home.css';

const Home = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I am BabyCheck AI. Ask me anything about your baby!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = () => {
    if (input.trim() === '') return;

    // Use functional state update to ensure we always have the latest messages
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: 'user', text: input }
    ]);
    setInput('');
    setIsTyping(true);

    // Example AI response
    setTimeout(() => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'bot', text: 'Got it! I\'ve logged that for you.' }
      ]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="home-container">
      <div className="header-section">
        <h1 className="home-title">BabyCheck AI</h1>
        <p className="home-subtitle">Your trusted companion for baby care</p>
      </div>

      <div className="chat-window" aria-live="polite">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.sender}`}>
            <div className="message-content">
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chat-message bot">
            <div className="message-content typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-container">
        <div className="chat-input">
          <input
            type="text"
            placeholder="Ask about feeding, sleeping, development..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            aria-label="Type your message"
          />
          <button 
            onClick={sendMessage} 
            disabled={!input.trim()}
            aria-label="Send message"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
