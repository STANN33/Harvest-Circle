import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'vegetables',
    description: '',
    quantity: '',
    unit: 'kg',
    price: '',
    harvestDate: '',
    expiryDate: ''
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchProducts();
    fetchOrders();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/products?farmerId=${JSON.parse(localStorage.getItem('user')).id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setProducts(response.data.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/orders/seller`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/products`,
        {
          ...newProduct,
          quantity: parseFloat(newProduct.quantity),
          price: parseFloat(newProduct.price),
          location: user.location
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setShowAddProduct(false);
        fetchProducts();
        // Reset form
        setNewProduct({
          name: '',
          category: 'vegetables',
          description: '',
          quantity: '',
          unit: 'kg',
          price: '',
          harvestDate: '',
          expiryDate: ''
        });
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/orders/${orderId}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Welcome Header */}
      <div style={{
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h1>Welcome back, {user?.firstName}! 🌾</h1>
        <p>Manage your farm products and orders</p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <StatCard value={products.length} label="Active Products" icon="📦" />
        <StatCard value={orders.length} label="Total Orders" icon="🛒" />
        <StatCard 
          value={orders.filter(o => o.status === 'pending').length} 
          label="Pending Orders" 
          icon="⏳" 
        />
        <StatCard 
          value={`KES ${orders.reduce((sum, o) => sum + o.totalAmount, 0)}`} 
          label="Total Earnings" 
          icon="💰" 
        />
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '2px solid #eee'
      }}>
        <button
          onClick={() => setActiveTab('products')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'products' ? '#4CAF50' : 'transparent',
            color: activeTab === 'products' ? 'white' : '#666',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer'
          }}
        >
          My Products
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'orders' ? '#4CAF50' : 'transparent',
            color: activeTab === 'orders' ? 'white' : '#666',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer'
          }}
        >
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'analytics' ? '#4CAF50' : 'transparent',
            color: activeTab === 'analytics' ? 'white' : '#666',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer'
          }}
        >
          Analytics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'products' && (
        <div>
          {/* Add Product Button */}
          <button
            onClick={() => setShowAddProduct(!showAddProduct)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            {showAddProduct ? '− Cancel' : '+ Add New Product'}
          </button>

          {/* Add Product Form */}
          {showAddProduct && (
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              marginBottom: '30px'
            }}>
              <h3>Add New Product</h3>
              <form onSubmit={handleAddProduct}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '15px'
                }}>
                  <div>
                    <label>Product Name *</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      required
                      style={inputStyle}
                    />
                  </div>
                  
                  <div>
                    <label>Category *</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      style={inputStyle}
                    >
                      <option value="vegetables">Vegetables</option>
                      <option value="fruits">Fruits</option>
                      <option value="grains">Grains</option>
                      <option value="dairy">Dairy</option>
                      <option value="meat">Meat</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label>Quantity *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({...newProduct, quantity: e.target.value})}
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label>Unit *</label>
                    <select
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                      style={inputStyle}
                    >
                      <option value="kg">Kilogram (kg)</option>
                      <option value="g">Gram (g)</option>
                      <option value="piece">Piece</option>
                      <option value="bunch">Bunch</option>
                      <option value="crate">Crate</option>
                      <option value="bag">Bag</option>
                    </select>
                  </div>

                  <div>
                    <label>Price (KES) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      required
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label>Harvest Date</label>
                    <input
                      type="date"
                      value={newProduct.harvestDate}
                      onChange={(e) => setNewProduct({...newProduct, harvestDate: e.target.value})}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label>Expiry Date</label>
                    <input
                      type="date"
                      value={newProduct.expiryDate}
                      onChange={(e) => setNewProduct({...newProduct, expiryDate: e.target.value})}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '15px' }}>
                  <label>Description</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    rows="3"
                    style={{...inputStyle, width: '100%'}}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    marginTop: '15px',
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Add Product
                </button>
              </form>
            </div>
          )}

          {/* Products List */}
          <h2>Your Products</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
            {products.length === 0 && (
              <p>No products yet. Add your first product above!</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <h2>Incoming Orders</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            {orders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onUpdateStatus={updateOrderStatus}
              />
            ))}
            {orders.length === 0 && (
              <p>No orders yet.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div>
          <h2>Sales Analytics</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>💰</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32' }}>
                KES {orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.totalAmount, 0)}
              </div>
              <div>Total Revenue</div>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📊</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>
                {orders.length}
              </div>
              <div>Total Orders</div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>⭐</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                {orders.filter(o => o.status === 'delivered').length}
              </div>
              <div>Delivered Orders</div>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏰</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFC107' }}>
                {orders.filter(o => o.status === 'pending').length}
              </div>
              <div>Pending Orders</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders List - always visible */}
      {orders.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h2>Recent Orders</h2>
          <div style={{
            display: 'grid',
            gap: '15px'
          }}>
            {orders.slice(0, 3).map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onUpdateStatus={updateOrderStatus}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ value, label, icon }) => (
  <div style={{
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center'
  }}>
    <div style={{ fontSize: '32px', marginBottom: '10px' }}>{icon}</div>
    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2E7D32' }}>{value}</div>
    <div style={{ color: '#666' }}>{label}</div>
  </div>
);

const ProductCard = ({ product }) => (
  <div style={{
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  }}>
    <h3 style={{ margin: '0 0 10px 0', color: '#2E7D32' }}>{product.name}</h3>
    <p style={{ margin: '5px 0' }}>📦 Quantity: {product.quantity} {product.unit}</p>
    <p style={{ margin: '5px 0' }}>💰 Price: KES {product.price}/{product.unit}</p>
    <p style={{ margin: '5px 0' }}>📊 Status: {product.status}</p>
    {product.expiryDate && (
      <p style={{ margin: '5px 0', color: '#f44336' }}>
        ⏰ Expires: {new Date(product.expiryDate).toLocaleDateString()}
      </p>
    )}
  </div>
);

const OrderCard = ({ order, onUpdateStatus }) => (
  <div style={{
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    borderLeft: `4px solid ${
      order.status === 'delivered' ? '#4CAF50' :
      order.status === 'cancelled' ? '#f44336' :
      order.status === 'pending' ? '#FFC107' : '#2196F3'
    }`
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h3 style={{ margin: '0 0 5px 0' }}>Order #{order.orderNumber}</h3>
        <p style={{ margin: '2px 0' }}>Buyer: {order.buyer?.firstName} {order.buyer?.lastName}</p>
        <p style={{ margin: '2px 0' }}>Product: {order.Product?.name}</p>
        <p style={{ margin: '2px 0' }}>Quantity: {order.quantity}</p>
        <p style={{ margin: '2px 0' }}>Total: KES {order.totalAmount}</p>
        <p style={{ margin: '2px 0' }}>Status: {order.status}</p>
        <p style={{ margin: '2px 0' }}>Payment: {order.paymentStatus}</p>
      </div>
      
      <select
        value={order.status}
        onChange={(e) => onUpdateStatus(order.id, e.target.value)}
        style={{
          padding: '8px',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}
      >
        <option value="pending">Pending</option>
        <option value="confirmed">Confirm</option>
        <option value="processing">Processing</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancel</option>
      </select>
    </div>
  </div>
);

const inputStyle = {
  width: '100%',
  padding: '8px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  marginTop: '5px'
};

export default FarmerDashboard;

