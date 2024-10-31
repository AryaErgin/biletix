import React, { useState } from 'react';
import './FilterSection.css';

const FilterSection = ({ onFilter }) => {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [ageRangeFilter, setAgeRangeFilter] = useState('');

  const handleFilterChange = () => {
    onFilter({ 
      location: location || '', 
      date: date || '',
      organizer: organizer || '',
      minCapacity: minCapacity || '',
      ageRangeFilter: ageRangeFilter || '' 
    });
  };

  return (
    <div className="filter-section">
      <div className="title">
        <h1>Gelecek Etkinlikler</h1>
      </div>

      <div className="filters">
        <div className="filter-location">
          <input className='locinp'
            type="text"
            placeholder="Konum Giriniz"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            aria-label="Location filter"
          />
        </div>
        
        <div className="filter-date">
          <input className='dateinp'
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Date filter"
          />
        </div>

        <div className="filter-organizer">
          <input className='orginp'
            type="text"
            placeholder="Organizatör Giriniz"
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
            aria-label="Organizer filter"
          />
        </div>
      
        <label>
          <input
            type="number"
            value={minCapacity}
            onChange={(e) => setMinCapacity(e.target.value)}
            placeholder="Minimum Kapasite"
          />
        </label>

        <label>
          <select value={ageRangeFilter} onChange={(e) => setAgeRangeFilter(e.target.value)}>
            <option value="">Yaş Aralığı Seçiniz</option>
            <option value="all">Her Yaş</option>
            <option value="0-12">0-12</option>
            <option value="13-17">13-17</option>
            <option value="18+">18+</option>
            <option value="21+">21+</option>
          </select>
        </label>
        
        <button 
          className="filter-button" 
          onClick={handleFilterChange}
          data-text="Filtrele"
        >
          Filtrele
        </button>
      </div>
    </div>
  );
};

export default FilterSection;