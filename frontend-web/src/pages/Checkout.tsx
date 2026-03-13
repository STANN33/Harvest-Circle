import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
interface CartItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

interface LocationState {
  cart?: CartItem[];
}

const Checkout: React.FC = () => {
  const location = useLocation() as any;
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const cart: CartItem[] = location.state?.cart || [];

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const initiateMpesaPayment = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/mpesa/stkpush`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: getTotalAmount(),
          phoneNumber: '', // Get from user profile or input
          cartItems: cart,
        }),
      });

      const data = await response.json();
      if (data.checkoutRequestID) {
        alert('M-Pesa payment initiated. Please check your phone.');
        // Poll for payment confirmation or use callback
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment initiation failed');
    }
  };

  if (!isAuthenticated) {
    return <div>Please log in to checkout</div>;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#2E7D32', marginBottom: '30px' }}>Checkout</h1>
      
      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666' }}>
          <p>No items in cart</p>
          <button 
            onClick={() => navigate('/buyer/browse')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <>
          <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
            {cart.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
                <div>
                  <strong>{item.name}</strong>
                  <div>{item.quantity} x KES {item.price}/{item.unit}</div>
                </div>
                <div>KES {(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
            <div style={{ fontSize: '18px', fontWeight: 'bold', textAlign: 'right', marginTop: '15px' }}>
              Total: KES {getTotalAmount().toFixed(2)}
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              onClick={initiateMpesaPayment}
              style={{
                padding: '15px 40px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '20px'
              }}
            >
              Pay with M-Pesa
            </button>
            <p style={{ color: '#666', fontSize: '14px' }}>
              You will receive a prompt on your phone to enter your M-Pesa PIN
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Checkout;

