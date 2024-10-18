import React, { useState } from 'react';
import './FilterSection.css';

const FilterSection = ({ onFilter }) => {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');

  const handleFilterChange = () => {
    onFilter({ location, date });
  };

  return (
    <div className="filter-section">
      <div className='title'>
        <h1>Gelecek Etkinlikler</h1>
      </div>

      <div className='filters'>
      <select onChange={(e) => setLocation(e.target.value)}>
        <option value="">Any Location</option>
        <option value="Istanbul">Istanbul</option>
        <option value="Ankara">Ankara</option>
        <option value="Izmir">Izmir</option>
      </select>
      
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <button onClick={handleFilterChange}>Filter</button>
      </div>
    </div>
  );
};

export default FilterSection;