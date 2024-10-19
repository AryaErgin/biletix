import React, { useState, useEffect } from 'react';
import EventCard from './eventcard/EventCard.jsx';
import FilterSection from './filtersection/FilterSection.jsx';
import Footer from './footer/Footer.jsx';
import Search from './search/Search.jsx';
import './App.css';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { ConvexProvider } from "convex/react";
import convex from "../convex";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import Profile from "./auth/Profile";
import CreateEvent from './eventcreation/CreateEvent';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import EventDetail from './eventdetail/EventDetail.jsx';

const App = () => {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchEvents = async () => {
          const eventsCollection = collection(db, 'events');
          const eventsSnapshot = await getDocs(eventsCollection);
          const eventsList = eventsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data() 
          }));
          setEvents(eventsList);
          setFilteredEvents(eventsList);
      };

      fetchEvents();
  }, []);

    

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUser(user);
        } else {
          setUser(null);
        }
      });
        return () => unsubscribe();
      }, []);
      
      useEffect(() => {
        const checkAdminStatus = async () => {
          const user = auth.currentUser;
          if (user) {
              const docRef = doc(db, "users", user.uid);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists() && docSnap.data().isAdmin) {
                  setIsAdmin(true);
              } else {
                  setIsAdmin(false);
              }
          } else {
            setIsAdmin(false);
          }
          setLoading(false);
      };
  
      checkAdminStatus();
      })
  
     
  
    const handleSearch = (query) => {
      const filtered = events.filter(event =>
        event.name.toLowerCase().includes(query.toLowerCase())
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
      <ConvexProvider client={convex}>
          <Router>
            <div className="App">
              <header className="main-header">
                <div className="nav-container">
                  <h1 className="logo">INTEGRA</h1>
                  <nav>
                  <Link to="/">Events</Link>
                  <Link to="#about">About Us</Link>
                  <Link to="#contact">Contact</Link>
                  {user ? (
                      <>
                      {isAdmin && !loading && <Link to="/create-event">Create Event</Link>}
                      <Link to="/profile">Profile</Link>
                      </>
                      ) : (
                       <>
                        <Link to="/login">Login</Link>
                        <Link to="/signup">Sign Up</Link>
                      </>
                    )}
                  </nav>
                </div>
              </header>
          
              <Routes>
                        <Route 
                            path="/" 
                            element={
                                <>
                                    <Search onSearch={handleSearch} />
                                    <FilterSection onFilter={handleFilter} />
                                    <div className="event-grid">
                                        {filteredEvents.map(event => (
                                            <EventCard key={event.id} event={event} />
                                        ))}
                                    </div>
                                    <Footer />
                                </>
                            } 
                        />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/profile" element={<Profile />} />
                        {isAdmin && <Route path="/create-event" element={<CreateEvent />} />}
                        <Route path="/event/:eventId" element={<EventDetail />} />
                    </Routes>
            </div>
          </Router>
        </ConvexProvider>
    );
  };
  
  export default App;