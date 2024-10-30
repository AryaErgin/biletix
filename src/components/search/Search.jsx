import React, { useState } from 'react';
import './Search.css';

const Search = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSearch = () => {
    onSearch(query); 
  };

  return (
    <section className="search-container">
      <div className="search">
        <h1>Etkinlik Ara</h1>
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Etkinlik Adı Giriniz" 
            value={query}
            onChange={handleInputChange}
          />
          <button onClick={handleSearch} data-text="Ara">Ara</button>
        </div>
      </div>
    </section>
  );
};

export default Search;