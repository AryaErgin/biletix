import React, { useState, useEffect, useMemo } from 'react';
import EventCard from './event/eventcard/EventCard.jsx';
import FilterSection from './filtersection/FilterSection.jsx';
import Footer from './footer/Footer.jsx';
import Search from './search/Search.jsx';
import './App.css';
import { auth, db } from '../firebase';
import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import Profile from "./profile/Profile.jsx";
import CreateEvent from './event/eventcreation/CreateEvent.jsx';
import { collection, deleteDoc, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import EventDetail from './event/eventdetail/EventDetail.jsx';
import MapComponent from './map/MapComponent.jsx';
import MapScriptLoader from './map/MapScriptLoader.jsx';
import EventConfirmation from './event/eventconfirmation/EventConfirmation.jsx';
import PendingEventDetail from './event/eventconfirmation/PendingEventDetail.jsx';
import Header from './header/Header.jsx';
import EmailVerification from './auth/EmailVerification.jsx';
import { deleteUser } from 'firebase/auth';
import MyEvents from './event/myevents/MyEvents.jsx';
import { RejectedEventsProvider, useRejectedEvents } from './event/rejectedevent/RejectedEventsContext.jsx';
import RejectedEventNotification from './event/rejectedevent/RejectedEvent.jsx';
import ResetPassword from './auth/resetpassword/ResetPassword.jsx';
import RegisteredUsers from './event/myevents/RegisteredIUsers.jsx';
import GoogleSignupComplete from './auth/GoogleSignUpComplete.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';

const UserChecker = ({ children }) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (!userData.username || !userData.age) {
              navigate('/google-kayıt-tamamla');
            }
          }
        } catch (error) {
          console.error("Error checking user data:", error);
        }
      }
      setChecking(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (checking) {
    return <div>Yükleniyor...</div>;
  }

  return children;
};

const RejectedEventCheck = () => {
  const { rejectedEvents } = useRejectedEvents();
  const navigate = useNavigate();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!hasChecked && rejectedEvents.length > 0) {
      navigate(`/etkinlik-reddedildi/${rejectedEvents[0].id}`);
      setHasChecked(true);
    }
  }, [rejectedEvents, navigate, hasChecked]);

  return null;
};

const App = () => {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const eventsPerPage = 6;
  
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

  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredEvents]);

  // Calculate total pages for pagination.
  const totalPages = Math.ceil(sortedEvents.length / eventsPerPage);

  // Determine events for the current page.
  const currentEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * eventsPerPage;
    return sortedEvents.slice(startIndex, startIndex + eventsPerPage);
  }, [sortedEvents, currentPage]);

  // Handlers for pagination.
  const handleNext = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  useEffect(() => {
    const cleanupUnverifiedUsers = async () => {
      try {
        const fifteenMinutesAgo = new Date().getTime() - (5 * 60 * 1000);
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef, 
          where('emailVerified', '==', false),
          where('createdAt', '<', fifteenMinutesAgo)
        );
        
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(async (document) => {
          const userId = document.id;
          try {
            const user = auth.currentUser;
            if (user && user.uid === userId && !user.emailVerified) {
              await deleteUser(user);
            }
            await deleteDoc(doc(db, 'users', userId));
          } catch (error) {
            console.log(`Error`);
          }
        });
      } catch (error) {
        console.error('Error');
      }
    };

    const interval = setInterval(cleanupUnverifiedUsers, 60000);

    return () => clearInterval(interval);
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
        setCurrentPage(1);
      };
    
      const handleFilter = (filters) => {
        const filtered = events.filter(event => {
          return (
            (!filters.location || 
              (event.location && event.location.toLowerCase().includes(filters.location.toLowerCase()))) &&
            (!filters.date || event.date === filters.date) &&
            (!filters.organizer || 
              (event.organizer && event.organizer.toLowerCase().includes(filters.organizer.toLowerCase()))) &&
            (!filters.ageRangeFilter || event.ageRange === filters.ageRangeFilter) &&
            (!filters.minCapacity || event.maxCapacity >= filters.minCapacity)
          );
        });
        setFilteredEvents(filtered);
        setCurrentPage(1);
      };

    return (
      <RejectedEventsProvider>
        <ThemeProvider>
        <Router>
        <UserChecker>
          <div className="App">
            <Header/>
            <MapScriptLoader>
            <RejectedEventCheck />
            <Routes>
              <Route 
                path="/" 
                element={
                  <>
                    <Search onSearch={handleSearch} />
                    <FilterSection onFilter={handleFilter} />
                    <MapComponent events={events} filteredEvents={filteredEvents} />
                    {sortedEvents.length > 0 ? (
                          <>
                            <div className="event-grid">
                              {currentEvents.map(event => (
                                <EventCard key={event.id} event={event} />
                              ))}
                            </div>
                            <div className="pagination">
                              <button onClick={handlePrevious} disabled={currentPage === 1}>
                               Önceki 
                              </button>
                              <span>
                               {currentPage}. Sayfa 
                              </span>
                              <button onClick={handleNext} disabled={currentPage === totalPages}>
                                Sonraki
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="no-events-message">
                            <p>Etkinlik Bulunamadı</p>
                          </div>
                        )}
                      </>
                    }
                />
              <Route path="/giriş-yap" element={<Login />} />
              <Route path="/hesap-oluştur" element={<Signup />} />
              <Route path="/profil" element={<Profile />} />
              <Route path="/benim-etkinliklerim" element={<MyEvents />} />
              <Route path="/etkinlik-oluştur" element={<CreateEvent />} />
              {isAdmin && !loading && <Route path="/etkinlik-onayla" element={<EventConfirmation />} />}
              {isAdmin && !loading &&  <Route path="/etkinlik-onayla/:eventId" element={<PendingEventDetail />} />}
              <Route path="/etkinlik/:eventId" element={<EventDetail />} />
              <Route path="/email-doğrulama" element={<EmailVerification />}/>
              <Route path="/etkinlik-reddedildi/:eventId" element={<RejectedEventNotification />} />
              <Route path={`/kayıtlı-kişiler/:eventId`} element={<RegisteredUsers/>}/>
              <Route path="/şifre-değiştirme" element={<ResetPassword />} />
              <Route path="google-kayıt-tamamla" element={<GoogleSignupComplete/>}/>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
            </MapScriptLoader>
          </div>
        </UserChecker>
        </Router>
        </ThemeProvider>
        </RejectedEventsProvider>
    );
  };
  
  export default App;