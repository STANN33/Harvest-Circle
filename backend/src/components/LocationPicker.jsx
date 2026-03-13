import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    },
  });

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
};

const LocationPicker = ({ onLocationSelect, initialLocation = null }) => {
  const [position, setPosition] = useState(initialLocation);
  const [address, setAddress] = useState('');

  // Default center (Nairobi, Kenya)
  const defaultCenter = [-1.2921, 36.8219];

  const handleLocationSelect = (newPosition) => {
    setPosition(newPosition);
    
    // Get address from coordinates
    fetchAddress(newPosition.lat, newPosition.lng);
    
    // Call parent component
    if (onLocationSelect) {
      onLocationSelect(newPosition);
    }
  };

  const fetchAddress = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      setAddress(data.display_name);
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          handleLocationSelect(newPosition);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please click on the map to set your location.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  return (
    <div className="location-picker">
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={getUserLocation}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📍 Use My Current Location
        </button>
      </div>

      <div style={{ height: '400px', width: '100%', marginBottom: '10px' }}>
        <MapContainer
          center={position ? [position.lat, position.lng] : defaultCenter}
          zoom={position ? 15 : 8}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <LocationMarker 
            position={position ? [position.lat, position.lng] : null} 
            setPosition={handleLocationSelect}
          />
        </MapContainer>
      </div>

      {position && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '4px' 
        }}>
          <p><strong>Selected Location:</strong></p>
          <p>Latitude: {position.lat.toFixed(6)}</p>
          <p>Longitude: {position.lng.toFixed(6)}</p>
          {address && <p><strong>Address:</strong> {address}</p>}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;