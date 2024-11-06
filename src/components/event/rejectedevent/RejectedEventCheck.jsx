import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRejectedEvents } from './RejectedEventsContext';

const RejectedEventCheck = () => {
  const { rejectedEvents } = useRejectedEvents();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Current rejected events:', rejectedEvents);
    if (rejectedEvents && rejectedEvents.length > 0) {
      console.log('Navigating to rejected event notification:', rejectedEvents[0].id);
      navigate(`/etkinlik-reddedildi/${rejectedEvents[0].id}`);
    }
  }, [rejectedEvents, navigate]);

  return null;
};

export default RejectedEventCheck;