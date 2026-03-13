import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState(location.state?.cart || []);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [orderStatus, setOrderStatus] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    
    // If cart is empty, redirect back to browse
    if (!cart || cart.length === 0) {
      navigate('/buyer/browse');
    }
  }, [navigate, cart]);

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setOrderStatus(null);

    try {
      const token = localStorage.getItem('token');
      
      // Create orders for each product in cart
      for (const item of cart) {
        const orderData = {
          productId: item.id,
          quantity: item.quantity,
          paymentMethod: paymentMethod,
          deliveryAddress: deliveryAddress || user?.address,
          deliveryLocation: user?.location,
          notes: `Order for ${item.quantity} ${item.unit} of ${item.name}`
        };

        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/orders`,
          orderData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          setOrderStatus({
            type: 'success',
            message: 'Order placed successfully! Check your phone to complete M-Pesa payment.'
          });
          
          // Clear cart after successful order
          setTimeout(() => {
            navigate('/buyer/orders');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setOrderStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to place order'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#2E7D32', marginBottom: '30px' }}>Checkout</h1>

      {/* Order Summary */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ marginBottom: '15px' }}>Order Summary</h2>
        
        {cart.map(item => (
          <div key={item.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: '1px solid #eee'
          }}>
            <div>
              <strong>{item.name}</strong>
              <p style={{ fontSize: '14px', color: '#666' }}>
                {item.quantity} {item.unit} × KES {item.price}
              </p>
            </div>
            <div style={{ fontWeight: 'bold' }}>
              KES {(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '15px',
          paddingTop: '15px',
          borderTop: '2px solid #ddd',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          <span>Total</span>
          <span>KES {getTotalAmount().toFixed(2)}</span>
        </div>
      </div>

      {/* Delivery Information */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ marginBottom: '15px' }}>Delivery Information</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Delivery Address
          </label>
          <textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Enter your delivery address"
            rows="3"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      {/* Payment Method */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ marginBottom: '15px' }}>Payment Method</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="radio"
              value="mpesa"
              checked={paymentMethod === 'mpesa'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>M-Pesa (Recommended)</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <input
              type="radio"
              value="cash"
              checked={paymentMethod === 'cash'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>Cash on Delivery</span>
          </label>
        </div>

        {paymentMethod === 'mpesa' && (
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              M-Pesa Phone Number
            </label>
            <input
              type="tel"
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
              placeholder="e.g., 0712345678"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              You'll receive an STK push on this number to complete payment
            </p>
          </div>
        )}
      </div>

      {/* Order Status */}
      {orderStatus && (
        <div style={{
          padding: '15px',
          backgroundColor: orderStatus.type === 'success' ? '#d4edda' : '#f8d7da',
          color: orderStatus.type === 'success' ? '#155724' : '#721c24',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {orderStatus.message}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '15px' }}>
        <button
          onClick={() => navigate('/buyer/browse')}
          style={{
            flex: 1,
            padding: '15px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Back to Shopping
        </button>
        
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          style={{
            flex: 2,
            padding: '15px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Processing...' : `Place Order • KES ${getTotalAmount().toFixed(2)}`}
        </button>
      </div>
    </div>
  );
};

export default Checkout;