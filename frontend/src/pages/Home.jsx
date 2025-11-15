import React, { useState, useEffect, useRef } from 'react';
import { useTimeline } from '../context/TimelineContext';
import '../styles/Home.css';

const Home = () => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I am Child Click Care AI. Ask me anything about your child! I can also help you track important health events and milestones.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId] = useState('default');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [showTimelineNotification, setShowTimelineNotification] = useState(false);
  const chatWindowRef = useRef(null);
  const { addEvent } = useTimeline();

  useEffect(() => {
    checkConnection();
  }, []);

  // auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // function to check if ollama is connected
  const checkConnection = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health');
      const data = await response.json();
      setIsConnected(data.ollama === 'connected');
      setError(null);
    } catch (err) {
      setIsConnected(false);
      setError('Cannot connect to server. Make sure the backend is running.');
    }
  };

  // function to send a message
  const sendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]); // previous messages
    setInput('');
    setIsTyping(true);
    setError(null);

    // try to send a message
    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId: conversationId,
          model: 'llama3.2'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: data.response }
      ]);

      // if there's a timeline event, add it to the timeline
      if (data.timelineEvent) {
        addEvent(data.timelineEvent);
        setShowTimelineNotification(true);
        setTimeout(() => setShowTimelineNotification(false), 5000);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to get response. Please check if Ollama is running and the server is connected.');
      setMessages(prev => [
        ...prev,
        { 
          sender: 'bot', 
          text: 'Sorry, I encountered an error. Please make sure Ollama is running and try again.' 
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // trash to delete the conversation
  const clearConversation = async () => {
    try {
      await fetch(`http://localhost:3001/api/chat/${conversationId}`, {
        method: 'DELETE'
      });
      setMessages([
        { sender: 'bot', text: 'Hi! I am Child Click Care AI. Ask me anything about your child! I can also help you track important health events and milestones.' }
      ]);
    } catch (err) {
      console.error('Error clearing conversation:', err);
    }
  };

  return (
    <div className="home-container">
      <div className="header-section">
        <h1 className="home-title">Child Click Care AI</h1>
        <p className="home-subtitle">Your trusted companion for baby care</p>
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">
            {isConnected ? 'Ollama Connected' : 'Ollama Disconnected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </div>
      )}

      {showTimelineNotification && (
        <div className="timeline-notification">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          Event added to timeline!
        </div>
      )}

      <div className="chat-window" ref={chatWindowRef}>
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
        <button 
          className="clear-btn"
          onClick={clearConversation}
          title="Clear conversation"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
        
        <div className="chat-input">
          <input
            type="text"
            placeholder="Ask about feeding, sleeping, development..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={!isConnected || isTyping}
          />
          <button 
            onClick={sendMessage} 
            disabled={!input.trim() || !isConnected || isTyping}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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