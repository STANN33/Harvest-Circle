// Calculate distance between two coordinates using Haversine formula
exports.calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

// Convert degrees to radians
const toRad = (value) => {
  return value * Math.PI / 180;
};

// Format location for database
exports.formatLocationForDB = (lat, lng) => {
  return {
    type: 'Point',
    coordinates: [lng, lat] // PostGIS expects [longitude, latitude]
  };
};

// Extract coordinates from database format
exports.extractCoordinates = (location) => {
  if (location && location.coordinates) {
    return {
      lng: location.coordinates[0],
      lat: location.coordinates[1]
    };
  }
  return null;
};

// Get address from coordinates (reverse geocoding)
exports.getAddressFromCoordinates = async (lat, lng) => {
  try {
    // Using OpenStreetMap Nominatim API (free)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return data.display_name;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};