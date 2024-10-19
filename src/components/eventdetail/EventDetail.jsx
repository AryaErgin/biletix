import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './EventDetail.css';

const EventDetail = () => {
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);

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

    return (
        <div className="event-detail">
            <img src={event.imageUrl || '/placeholder.png'} alt={event.name} />
            <h2>{event.name}</h2>
            <p><strong>Location:</strong> {event.location}</p>
            <p><strong>Date:</strong> {event.date}</p>
            <p><strong>Description:</strong> {event.description}</p>
        </div>
    );
};

export default EventDetail;
