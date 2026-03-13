import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BuyerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filter === 'all' 
        ? `${process.env.REACT_APP_API_URL}/api/orders/my-orders`
        : `${process.env.REACT_APP_API_URL}/api/orders/my-orders?status=${filter}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/orders/${orderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#FFC107',
      'confirmed': '#2196F3',
      'processing': '#9C27B0',
      'shipped': '#FF9800',
      'delivered': '#4CAF50',
      'cancelled': '#f44336',
      'payment_failed': '#f44336'
    };
    return colors[status] || '#999';
  };

  const getPaymentStatusBadge = (status) => {
    const colors = {
      'pending': '#FFC107',
      'paid': '#4CAF50',
      'failed': '#f44336',
      'refunded': '#9C27B0'
    };
    return (
      <span style={{
        backgroundColor: colors[status] || '#999',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px'
      }}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        Loading your orders...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#2E7D32', marginBottom: '30px' }}>My Orders</h1>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '2px solid #eee',
        paddingBottom: '10px'
      }}>
        {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: '8px 16px',
              backgroundColor: filter === status ? '#4CAF50' : 'transparent',
              color: filter === status ? 'white' : '#666',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '50px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: '18px', color: '#666' }}>No orders found</p>
          <button
            onClick={() => navigate('/buyer/browse')}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map(order => (
            <div
              key={order.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}
            >
              {/* Order Header */}
              <div style={{
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong>Order #{order.orderNumber}</strong>
                  <span style={{ marginLeft: '15px', color: '#666' }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {getPaymentStatusBadge(order.paymentStatus)}
                  <span style={{
                    backgroundColor: getStatusColor(order.status),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    textTransform: 'capitalize'
                  }}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Order Items */}
              <div style={{ padding: '15px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {/* Product Image Placeholder */}
                  <div style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px'
                  }}>
                    🌾
                  </div>

                  {/* Product Details */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>{order.Product?.name}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      <div>
                        <span style={{ color: '#666' }}>Quantity:</span>
                        <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>
                          {order.quantity} {order.Product?.unit}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#666' }}>Price:</span>
                        <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>
                          KES {order.Product?.price}/{order.Product?.unit}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#666' }}>Total:</span>
                        <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>
                          KES {order.totalAmount}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#666' }}>Farmer:</span>
                        <span style={{ marginLeft: '5px' }}>
                          {order.seller?.firstName} {order.seller?.lastName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                {order.deliveryAddress && (
                  <div style={{
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    <strong>Delivery Address:</strong> {order.deliveryAddress}
                  </div>
                )}

                {/* Order Actions */}
                {['pending', 'confirmed'].includes(order.status) && (
                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => cancelOrder(order.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel Order
                    </button>
                    <button
                      onClick={() => navigate(`/orders/${order.id}`)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      View Details
                    </button>
                  </div>
                )}

                {/* Review Button for Delivered Orders */}
                {order.status === 'delivered' && !order.Review && (
                  <div style={{ marginTop: '15px' }}>
                    <button
                      onClick={() => navigate(`/orders/${order.id}/review`)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#FFC107',
                        color: '#2E7D32',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Write a Review
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Info */}
              {order.mpesaReceiptNumber && (
                <div style={{
                  padding: '10px 15px',
                  backgroundColor: '#e8f5e9',
                  borderTop: '1px solid #c8e6c9',
                  fontSize: '14px'
                }}>
                  <strong>M-Pesa Receipt:</strong> {order.mpesaReceiptNumber}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BuyerOrders;