import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

const PaymentResult = () => {
    const [status, setStatus] = useState('processing');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const processPayment = async () => {
            const searchParams = new URLSearchParams(location.search);
            const token = searchParams.get('token');

            if (!token) {
                setStatus('error');
                return;
            }

            try {
                const response = await fetch('/api/payment-result', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token }),
                });

                const result = await response.json();

                if (result.status === 'success') {
                    const eventId = result.basketId;
                    await registerForEvent(eventId);
                    setStatus('success');
                    setTimeout(() => navigate(`/etkinlik/${eventId}`), 2000);
                } else {
                    setStatus('error');
                }
            } catch (error) {
                console.error('Error processing payment result:', error);
                setStatus('error');
            }
        };

        processPayment();
    }, [location, navigate]);

    const registerForEvent = async (eventId) => {
        try {
            const eventRef = doc(db, 'events', eventId);
            const userRef = doc(db, 'users', auth.currentUser.uid);

            await updateDoc(eventRef, {
                registeredUsers: arrayUnion(auth.currentUser.uid)
            });
            await updateDoc(userRef, {
                registeredEvents: arrayUnion(eventId)
            });
        } catch (error) {
            console.error('Error registering for event:', error);
            throw error;
        }
    };

    return (
        <div className="payment-result">
            {status === 'processing' && <p>Ödeme işlemi kontrol ediliyor...</p>}
            {status === 'success' && <p>Ödeme başarılı ! Etkinliğe kaydınız tamamlandı.</p>}
            {status === 'error' && <p>Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.</p>}
        </div>
    );
};

export default PaymentResult;