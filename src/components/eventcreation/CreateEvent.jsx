import React, { useState } from 'react';
import { db, storage } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { placeholder } from '../../photos';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import './CreateEvent.css';

const CreateEvent = () => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };
  
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = placeholder;
      if (image) {
        const uniqueImageName = `${uuidv4()}_${image.name}`;
        const imageRef = ref(storage, `events/${uniqueImageName}`);
        await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, 'events'), {
        name,
        location,
        date,
        description,
        imageUrl,
      });
      setSuccess('Event created successfully!');
      setError('');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      setError('Error creating event: ' + error.message);
      setSuccess('');
    }
  };

  return (
    <div className="create-event">
      <h2>Create a New Event</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleCreateEvent}>
      <label>
          Upload Event Image:
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Event Name"
          required
        />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          required
        />
        <button type="submit">Create Event</button>
      </form>
    </div>
  );
};

export default CreateEvent;
