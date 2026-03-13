import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LocationPicker from '../components/LocationPicker';

const FarmerRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: null,
    address: '',
    verificationCode: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: null
      });
    }
  };

  const handleLocationSelect = (location) => {
    setFormData({
      ...formData,
      location
    });
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10,12}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.location) {
      newErrors.location = 'Please select your farm location on the map';
    }
    return newErrors;
  };

  const handleNext = () => {
    if (step === 1) {
      const stepErrors = validateStep1();
      if (Object.keys(stepErrors).length === 0) {
        setStep(2);
      } else {
        setErrors(stepErrors);
      }
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (step === 2) {
      const stepErrors = validateStep2();
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
    }

    setLoading(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      if (step === 2 && !formData.verificationCode) {
        // Submit registration
        const response = await axios.post(
          `${API_URL}/auth/register`,
          {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            password: formData.password,
            role: 'farmer',
            location: formData.location,
            address: formData.address
          }
        );

        if (response.data.success) {
          // Move to verification step
          setStep(3);
          // Store token
          localStorage.setItem('token', response.data.data.token);
        }
      } else if (step === 3) {
        // Verify phone
        const response = await axios.post(
          `${API_URL}/auth/verify-phone`,
          {
            phone: formData.phone,
            code: formData.verificationCode
          }
        );

        if (response.data.success) {
          // Redirect to farmer dashboard
          navigate('/farmer/dashboard');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({
        submit: error.response?.data?.message || 'Registration failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h1>🌾 Join Harvest Circle as a Farmer</h1>
        <p>Connect directly with buyers and get fair prices for your produce</p>
      </div>

      {/* Progress Steps */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '30px',
        padding: '0 20px'
      }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{
            flex: 1,
            textAlign: 'center',
            padding: '10px',
            backgroundColor: step >= s ? '#4CAF50' : '#e0e0e0',
            color: step >= s ? 'white' : '#666',
            margin: '0 5px',
            borderRadius: '4px'
          }}>
            Step {s}: {s === 1 ? 'Account' : s === 2 ? 'Location' : 'Verify'}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {step === 1 && (
          <div>
            <h2>Create Your Account</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: errors.firstName ? '1px solid red' : '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              {errors.firstName && (
                <p style={{ color: 'red', fontSize: '12px', margin: '5px 0 0' }}>
                  {errors.firstName}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: errors.lastName ? '1px solid red' : '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              {errors.lastName && (
                <p style={{ color: 'red', fontSize: '12px', margin: '5px 0 0' }}>
                  {errors.lastName}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Phone Number (e.g., 0712345678) *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="0712345678"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: errors.phone ? '1px solid red' : '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              {errors.phone && (
                <p style={{ color: 'red', fontSize: '12px', margin: '5px 0 0' }}>
                  {errors.phone}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: errors.password ? '1px solid red' : '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              {errors.password && (
                <p style={{ color: 'red', fontSize: '12px', margin: '5px 0 0' }}>
                  {errors.password}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: errors.confirmPassword ? '1px solid red' : '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              {errors.confirmPassword && (
                <p style={{ color: 'red', fontSize: '12px', margin: '5px 0 0' }}>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleNext}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                width: '100%'
              }}
            >
              Next: Set Farm Location
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2>Set Your Farm Location</h2>
            <p>Click on the map to mark where your farm is located</p>
            
            <LocationPicker onLocationSelect={handleLocationSelect} />
            
            {errors.location && (
              <p style={{ color: 'red', fontSize: '12px', margin: '5px 0 0' }}>
                {errors.location}
              </p>
            )}

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Farm Address (Optional)
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter your farm address or additional location details"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '80px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={handleBack}
                style={{
                  backgroundColor: '#666',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  flex: 1
                }}
              >
                Back
              </button>
              
              <button
                type="submit"
                disabled={!formData.location}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: formData.location ? 'pointer' : 'not-allowed',
                  fontSize: '16px',
                  flex: 1,
                  opacity: formData.location ? 1 : 0.5
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2>Verify Your Phone Number</h2>
            <p>We've sent a verification code to {formData.phone}</p>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Enter Verification Code *
              </label>
              <input
                type="text"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleInputChange}
                placeholder="Enter 6-digit code"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '18px',
                  textAlign: 'center'
                }}
              />
            </div>

            {errors.submit && (
              <p style={{ color: 'red', fontSize: '14px', margin: '10px 0' }}>
                {errors.submit}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                width: '100%',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Complete Registration'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '20px' }}>
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleSubmit}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4CAF50',
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                Resend Code
              </button>
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default FarmerRegister;