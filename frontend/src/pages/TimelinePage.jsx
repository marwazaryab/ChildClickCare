import React from 'react';
import { useTimeline } from '../context/TimelineContext';
import TimelineCard from '../components/TimeLineCard'
import '../styles/Timeline.css';

const Timeline = () => {
  const { events } = useTimeline();

  if (events.length === 0) {
    return (
      <div className="timeline-empty">
        <div className="timeline-empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3 className="timeline-empty-title">No events yet</h3>
        <p className="timeline-empty-text">
          Start chatting with BabyCheck AI about your baby's health, milestones, or symptoms.
          Events will automatically appear here!
        </p>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      {events.map((event) => (
        <TimelineCard key={event.id} event={event} />
      ))}
    </div>
  );
};

export default Timeline;