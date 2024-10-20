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
  const [media, setMedia] = useState([]);
  const [description, setDescription] = useState('');
  const [thumbnailIndex, setThumbnailIndex] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setMedia((prevMedia) => [...prevMedia, ...files]);
  };

  const handleSelectThumbnail = (index) => {
    setThumbnailIndex(index);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      let mediaUrls = [];
      let thumbnailUrl = placeholder;

      for (let i = 0; i < media.length; i++) {
        const file = media[i];
        const uniqueFileName = `${uuidv4()}_${file.name}`;
        const fileRef = ref(storage, `events/${uniqueFileName}`);
        await uploadBytes(fileRef, file);
        const fileUrl = await getDownloadURL(fileRef);
        mediaUrls.push(fileUrl);

        if (i === thumbnailIndex) {
          thumbnailUrl = fileUrl; 
        }
      }

      await addDoc(collection(db, 'events'), {
        name,
        location,
        date,
        description,
        mediaUrls,
        thumbnailUrl,
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
          Upload Event Media:
          <input type="file" accept="image/*,video/*" multiple onChange={handleMediaChange} />
        </label>
        <div className="media-preview">
          {media.map((file, index) => (
            <div
              key={index}
              className={`media-item ${index === thumbnailIndex ? 'selected-thumbnail' : ''}`}
              onClick={() => handleSelectThumbnail(index)} // Set selected thumbnail on click
            >
              {file.type.startsWith('image') ? (
                <img src={URL.createObjectURL(file)} alt="preview" className="preview-image" />
              ) : (
                <video className="preview-video" controls>
                  <source src={URL.createObjectURL(file)} />
                </video>
              )}
            </div>
          ))}
        </div>
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
