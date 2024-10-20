import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './EventDetail.css';

const EventDetail = () => {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    useEffect(() => {
        const fetchEvent = async () => {
            const docRef = doc(db, 'events', eventId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setEvent(docSnap.data());
            } else {
                console.log('No such document!');
            }
        };
        fetchEvent();
    }, [eventId]);

    if (!event) return <div>Loading...</div>;

    const handleNext = () => {
        setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % event.mediaUrls.length);
    };

    const handlePrev = () => {
        setCurrentMediaIndex((prevIndex) => (prevIndex - 1 + event.mediaUrls.length) % event.mediaUrls.length);
    };

    return (
        <div className="event-detail">
            <div className="media-preview">
                <button className="nav-button" onClick={handlePrev}>◀</button>
                {event.mediaUrls.length > 0 && (
                    <div className="media-container">
                        {event.mediaUrls[currentMediaIndex].includes('.mp4?alt=media&token=') ? (
                            <video className="media-item" controls>
                                <source src={event.mediaUrls[currentMediaIndex]} />
                            </video>
                        ) : (
                            <img src={event.mediaUrls[currentMediaIndex]} alt={event.name} className="media-item" />
                        )}
                    </div>
                )}
                <button className="nav-button" onClick={handleNext}>▶</button>
            </div>
            <h2>{event.name}</h2>
            <p><strong>Location:</strong> {event.location}</p>
            <p><strong>Date:</strong> {event.date}</p>
            <p><strong>Description:</strong> {event.description}</p>
        </div>
    );
};

export default EventDetail;
