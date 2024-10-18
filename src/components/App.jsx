import React, { useState, useEffect } from 'react';
import EventCard from './eventcard/EventCard.jsx';
import FilterSection from './filtersection/FilterSection.jsx';
import Footer from './footer/Footer.jsx';
import Search from './search/Search.jsx';
import './App.css';

const App = () => {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
  
    useEffect(() => {
      const mockEvents = [
        { id: 1, name: 'FRC 2025 Kickoff', location: 'Istanbul', date: '2025-01-10', imageUrl: '/event1.png', description: 'Join us for the exciting FRC 2025 kickoff in Istanbul.', link: '/event/1' },
        { id: 2, name: 'Steam Workshop', location: 'Ankara', date: '2024-12-01', imageUrl: '/event2.png', description: 'Interactive Steam Workshop in Ankara for all ages.', link: '/event/2' },
        { id: 3, name: 'Robotics Expo', location: 'Izmir', date: '2024-11-15', imageUrl: '/event3.png', description: 'Come experience the future of robotics in Izmir.', link: '/event/3' },
        { id: 4, name: 'Tech Symposium', location: 'Istanbul', date: '2025-03-05', imageUrl: '/event4.png', description: 'Tech Symposium featuring top industry speakers in Istanbul.', link: '/event/4' },
        { id: 5, name: 'Game Dev Meetup', location: 'Ankara', date: '2025-02-20', imageUrl: '/event5.png', description: 'A must-attend for all game developers.', link: '/event/5' },
        { id: 6, name: 'AI Conference', location: 'Istanbul', date: '2025-04-10', imageUrl: '/event6.png', description: 'AI and machine learning conference in the heart of Istanbul.', link: '/event/6' },
      ];
      setEvents(mockEvents);
      setFilteredEvents(mockEvents);
    }, []);
  
    // Handle filtering events by search query
    const handleSearch = (query) => {
      const filtered = events.filter(event =>
        event.name.toLowerCase().includes(query.toLowerCase()) // Match event names with the query
      );
      setFilteredEvents(filtered);
    };
  
    const handleFilter = (filters) => {
      const filtered = events.filter(event => {
        return (
          (!filters.location || event.location === filters.location) &&
          (!filters.date || event.date === filters.date)
        );
      });
      setFilteredEvents(filtered);
    };
  
    return (
      <div className="App">
        <header className="main-header">
          <div className="nav-container">
            <h1 className="logo">SteamNearMe</h1>
            <nav>
              <a href="#about">About Us</a>
              <a href="#contact">Contact</a>
              <a href="#login">Login / Sign Up</a>
            </nav>
          </div>
        </header>
  
        {/* Integrate the Search component */}
        <Search onSearch={handleSearch} />
  
        <FilterSection onFilter={handleFilter} />
        <div className="event-grid">
          {filteredEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
        <Footer />
      </div>
    );
  };
  
  export default App;