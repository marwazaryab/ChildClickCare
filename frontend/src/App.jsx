import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { TimelineProvider } from './context/TimelineContext';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import TimelinePage from './pages/TimelinePage';
import UserProfile from './pages/UserProfile';
import ChildProfile from './pages/ChildProfile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './App.css';

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="app">
      {!isAuthPage && <Sidebar />}
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/child/new" element={<ChildProfile />} />
          <Route path="/child/:childId" element={<ChildProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <TimelineProvider>
      <Router>
        <AppContent />
      </Router>
    </TimelineProvider>
  );
}

export default App;