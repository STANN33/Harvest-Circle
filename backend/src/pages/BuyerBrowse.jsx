import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const BuyerBrowse = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    radius: 50,
    category: 'all',
    minPrice: '',
    maxPrice: '',
    search: ''
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);

  // Get user's location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          fetchProducts(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Nairobi if location access denied
          const defaultLocation = { lat: -1.2921, lng: 36.8219 };
          setUserLocation(defaultLocation);
          fetchProducts(defaultLocation);
        }
      );
    } else {
      // Default to Nairobi
      const defaultLocation = { lat: -1.2921, lng: 36.8219 };
      setUserLocation(defaultLocation);
      fetchProducts(defaultLocation);
    }
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    if (userLocation) {
      fetchProducts(userLocation);
    }
  }, [filters]);

  const fetchProducts = async (location) => {
    setLoading(true);
    try {
      let url = `${process.env.REACT_APP_API_URL}/api/products?lat=${location.lat}&lng=${location.lng}&radius=${filters.radius}`;
      
      if (filters.category !== 'all') {
        url += `&category=${filters.category}`;
      }
      if (filters.minPrice) {
        url += `&minPrice=${filters.minPrice}`;
      }
      if (filters.maxPrice) {
        url += `&maxPrice=${filters.maxPrice}`;
      }
      if (filters.search) {
        url += `&search=${encodeURIComponent(filters.search)}`;
      }

      const response = await axios.get(url);
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getTotalCartAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const checkout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    navigate('/checkout', { state: { cart } });
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 70px)' }}>
      {/* Left Panel - Filters and Product List */}
      <div style={{
        width: '400px',
        backgroundColor: '#f5f5f5',
        overflowY: 'auto',
        padding: '20px',
        borderRight: '1px solid #ddd'
      }}>
        <h2 style={{ color: '#2E7D32', marginBottom: '20px' }}>Find Fresh Produce</h2>

        {/* Search Bar */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            name="search"
            placeholder="Search products..."
            value={filters.search}
            onChange={handleFilterChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '10px' }}>Filters</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Distance Radius (km)
            </label>
            <select
              name="radius"
              value={filters.radius}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Category
            </label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="all">All Categories</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="grains">Grains</option>
              <option value="dairy">Dairy</option>
              <option value="meat">Meat</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Price Range (KES)
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="number"
                name="minPrice"
                placeholder="Min"
                value={filters.minPrice}
                onChange={handleFilterChange}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <input
                type="number"
                name="maxPrice"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Product List */}
        <div>
          <h3 style={{ marginBottom: '15px' }}>
            Products Found: {products.length}
          </h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={() => setSelectedProduct(product)}
                  onAddToCart={() => addToCart(product)}
                  isSelected={selectedProduct?.id === product.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Map and Cart */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Map */}
        {userLocation && (
          <MapContainer
            center={[userLocation.lat, userLocation.lng]}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            
            {/* User Location Marker */}
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>You are here</Popup>
            </Marker>

            {/* Product Markers */}
            {products.map(product => (
              <Marker
                key={product.id}
                position={[
                  product.location?.coordinates[1],
                  product.location?.coordinates[0]
                ]}
                eventHandlers={{
                  click: () => setSelectedProduct(product)
                }}
              >
                <Popup>
                  <div>
                    <strong>{product.name}</strong><br/>
                    Farmer: {product.farmer?.firstName}<br/>
                    Price: KES {product.price}/{product.unit}<br/>
                    Distance: {product.distance?.toFixed(1)} km<br/>
                    <button
                      onClick={() => addToCart(product)}
                      style={{
                        marginTop: '5px',
                        padding: '5px 10px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Cart Sidebar */}
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '300px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.2)',
          padding: '15px',
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#2E7D32' }}>
            Your Cart ({cart.length})
          </h3>

          {cart.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center' }}>
              Your cart is empty
            </p>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.id} style={{
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{item.name}</strong>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f44336',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    KES {item.price}/{item.unit}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '5px'
                  }}>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      style={{
                        width: '25px',
                        height: '25px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      style={{
                        width: '25px',
                        height: '25px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              <div style={{
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Total:</strong>
                  <strong>KES {getTotalCartAmount().toFixed(2)}</strong>
                </div>
              </div>

              <button
                onClick={checkout}
                style={{
                  width: '100%',
                  marginTop: '15px',
                  padding: '12px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Checkout with M-Pesa
              </button>
            </>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ color: '#2E7D32', marginBottom: '15px' }}>
              {selectedProduct.name}
            </h2>
            
            <p><strong>Farmer:</strong> {selectedProduct.farmer?.firstName} {selectedProduct.farmer?.lastName}</p>
            <p><strong>Category:</strong> {selectedProduct.category}</p>
            <p><strong>Price:</strong> KES {selectedProduct.price}/{selectedProduct.unit}</p>
            <p><strong>Available:</strong> {selectedProduct.quantity} {selectedProduct.unit}</p>
            {selectedProduct.description && (
              <p><strong>Description:</strong> {selectedProduct.description}</p>
            )}
            {selectedProduct.harvestDate && (
              <p><strong>Harvest Date:</strong> {new Date(selectedProduct.harvestDate).toLocaleDateString()}</p>
            )}
            {selectedProduct.distance && (
              <p><strong>Distance:</strong> {selectedProduct.distance.toFixed(1)} km from you</p>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add to Cart
              </button>
              <button
                onClick={() => setSelectedProduct(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductCard = ({ product, onSelect, onAddToCart, isSelected }) => (
  <div
    onClick={onSelect}
    style={{
      backgroundColor: isSelected ? '#e8f5e8' : 'white',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      cursor: 'pointer',
      border: isSelected ? '2px solid #4CAF50' : 'none'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
      <div>
        <h4 style={{ margin: '0 0 5px 0', color: '#2E7D32' }}>{product.name}</h4>
        <p style={{ margin: '2px 0', fontSize: '14px' }}>
          {product.farmer?.firstName} • {product.distance?.toFixed(1)} km
        </p>
        <p style={{ margin: '2px 0', fontWeight: 'bold' }}>
          KES {product.price}/{product.unit}
        </p>
        <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>
          Available: {product.quantity} {product.unit}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddToCart();
        }}
        style={{
          padding: '5px 10px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Add to Cart
      </button>
    </div>
  </div>
);

export default BuyerBrowse;