import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, auth } from '../../../firebase';
import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { GoogleMap } from '@react-google-maps/api';
import './EventDetail.css';

const EventDetail = () => {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [isRegistered, setIsRegistered] = useState(false);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvent = async () => {
        try {
            const eventDoc = await getDoc(doc(db, 'events', eventId));
            if (eventDoc.exists()) {
            setEvent({ id: eventDoc.id, ...eventDoc.data() });
            } else {
            console.log('No such event!');
            }
        } catch (error) {
            console.error('Error fetching event:', error);
        }
        };

        fetchEvent();
    }, [eventId]);


        useEffect(() => {
            return () => {
                if (markerRef.current) {
                    markerRef.current.setMap(null);
                }
                mapRef.current = null;
            };
        }, []);

    useEffect(() => {
        const updateMarker = () => {
            if (!mapRef.current || !window.google || !event?.coordinates) {
                return;
            }

            if (markerRef.current) {
                markerRef.current.setMap(null);
            }

            try {
                markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
                    position: { 
                        lat: event.coordinates.lat, 
                        lng: event.coordinates.lng 
                    },
                    map: mapRef.current
                });
            } catch (error) {
                console.error('Error creating marker:', error);
            }
        };

        if (mapRef.current && event?.coordinates) {
            updateMarker();
        }
    }, [event?.coordinates]);

    if (!event) return <div>Yükleniyor...</div>;

    const handleNext = () => {
        setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % event.mediaUrls.length);
    };

    const handlePrev = () => {
        setCurrentMediaIndex((prevIndex) => (prevIndex - 1 + event.mediaUrls.length) % event.mediaUrls.length);
    };

    const handleRegistration = async () => {
        if (!auth.currentUser) {
            setShowSignInModal(true);
            return;
        }

        if (isRegistered) {
            setShowCancelModal(true);
            return;
        }

        await registerForEvent();
    };

    const registerForEvent = async () => {
        const eventRef = doc(db, 'events', eventId);
        const userRef = doc(db, 'users', auth.currentUser.uid);

        await updateDoc(eventRef, {
            registeredUsers: arrayUnion(auth.currentUser.uid)
        });
        await updateDoc(userRef, {
            registeredEvents: arrayUnion(eventId)
        });

        setIsRegistered(true);
    };

    const cancelRegistration = async () => {
        const eventRef = doc(db, 'events', eventId);
        const userRef = doc(db, 'users', auth.currentUser.uid);

        await updateDoc(eventRef, {
            registeredUsers: arrayRemove(auth.currentUser.uid)
        });
        await updateDoc(userRef, {
            registeredEvents: arrayRemove(eventId)
        });

        setIsRegistered(false);
        setShowCancelModal(false);
    };

    const isPending = event.status === 'pending';

    return (
        <div className="event-detail">
            <div className="media-previews">
                <button className="nav-button" onClick={handlePrev}>◀</button>
                {event.mediaUrls.length > 0 && (
                    <div className="media-containers">
                        {event.mediaUrls[currentMediaIndex].includes('.mp4?alt=media&token=') ? (
                            <video className="media-items" controls>
                                <source src={event.mediaUrls[currentMediaIndex]} />
                            </video>
                        ) : (
                            <img src={event.mediaUrls[currentMediaIndex]} alt={event.name} className="media-items" />
                        )}
                    </div>
                )}
                <button className="nav-button" onClick={handleNext}>▶</button>
            </div>

            <div className="map-containers">
                <GoogleMap
                    onLoad={(map) => {
                        mapRef.current = map;
                        if (event?.coordinates) {
                            try {
                                markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
                                    position: { 
                                        lat: event.coordinates.lat, 
                                        lng: event.coordinates.lng 
                                    },
                                    map: map
                                });
                            } catch (error) {
                                console.error('Error creating marker:', error);
                            }
                        }
                    }}
                    mapContainerClassName="maps"
                    center={event.coordinates}
                    zoom={15}
                    options={{
                        mapId: "6100ebed9733d3ab",
                    }}
                />
            </div>

            <h2>{event.name}</h2>
            <p><strong>Organizatör:</strong> {event.organizer}</p>
            <p><strong>Konum:</strong> {event.location}</p>
            <p><strong>Tarih:</strong> {event.date}</p>
            <p><strong>Konteyjan Sınırı: {event.maxCapacity || 'Sınırsız'}</strong></p>
            <p><strong>Yaş Aralığı: {!event.ageRange ? 'Her Yaşa Uygundur' : event.ageRange === 'all' ? 'All Ages' : event.ageRange}</strong></p>
            <p><strong>İletişim Bilgileri:</strong></p>
            <div>
                {event.contactInfo.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                ))}
            </div>
            <p><strong>Etkinlik Bilgileri:</strong></p>
            <div>
                {event.description.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                ))}
            </div>
            
            {!isPending && !event.registrationDisabled && (
                <button 
                    className={`registration-button ${isRegistered ? 'registered' : ''}`}  
                    data-text={isRegistered ? 'Kaydınızı İptal Edin' : 'Etkinliğe Kaydolun'} 
                    onClick={handleRegistration}
                >
                    {isRegistered ? 'Kaydınızı İptal Edin' : 'Etkinliğe Kaydolun'}
                </button>
                )}

            {showSignInModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Giriş Yapın</h3>
                        <p>Etkinlik İçin Giriş Yapmanız Gerekmektedir</p>
                        <div className="modal-buttons">
                            <button className="sign-in-btn" onClick={() => navigate('/giriş-yap')}>Giriş Yap</button>
                            <button className="cancel-btn" onClick={() => setShowSignInModal(false)}>İptal</button>
                        </div>
                    </div>
                </div>
            )}

            {showCancelModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Etkinlik Kayıt İptali</h3>
                        <p>Etkinlik Kaydınızı İptal Etmek İstediğinize Emin Misiniz?</p>
                        <div className="modal-buttons">
                            <button className="confirm-cancel-btn" onClick={cancelRegistration}>Evet, İptal Edin</button>
                            <button className="keep-registration-btn" onClick={() => setShowCancelModal(false)}>Hayır, Kaydınız Kalsın</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventDetail;