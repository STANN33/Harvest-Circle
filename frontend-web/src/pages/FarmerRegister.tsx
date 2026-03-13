import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LocationPicker from '../components/LocationPicker';

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  location: { lat: number; lng: number } | null;
  address: string;
  verificationCode: string;
}

interface Errors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  location?: string;
  verificationCode?: string;
  submit?: string;
}

const FarmerRegister: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: null,
    address: '',
    verificationCode: '',
  });

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState<boolean>(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name as keyof Errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  }, [errors]);

  const handleLocationSelect = useCallback((location: { lat: number; lng: number }) => {
    console.log('✅ Location selected:', location);
    setFormData(prev => ({
      ...prev,
      location,
    }));
    
    if (errors.location) {
      setErrors(prev => ({
        ...prev,
        location: undefined,
      }));
    }
  }, [errors]);

  const validateStep1 = (): Errors => {
    const newErrors: Errors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10,12}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number (0712345678)';
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

  const validateStep2 = (): Errors => {
    const newErrors: Errors = {};
    if (!formData.location) {
      newErrors.location = 'Please select your farm location on the map or click "Use My Current Location"';
    }
    return newErrors;
  };

  const handleNext = () => {
    console.log('Next clicked, step:', step);
    if (step === 1) {
      const stepErrors = validateStep1();
      console.log('Step 1 validation errors:', stepErrors);
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

  const handleRegister = async () => {
    console.log('🚀 Create Account clicked!');
    console.log('Form data:', formData);
    
    const stepErrors = validateStep2();
    console.log('Step 2 validation errors:', stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: 'farmer',
        location: formData.location!,
        address: formData.address.trim() || undefined,
      });

      console.log('✅ Registration response:', response.data);
      
      if (response.data.success) {
        setStep(3);
        localStorage.setItem('token', response.data.data.token);
        if (response.data.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
        console.log('✅ Moved to verification step');
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      let errorMsg = 'Registration failed. Please try again.';
      
      if (error.response) {
        errorMsg = error.response.data.message || errorMsg;
        console.log('Server error:', error.response.status, error.response.data);
      } else if (error.request) {
        errorMsg = 'No response from server. Is backend running on port 5000?';
      }
      
      setErrors({ submit: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    console.log('🔐 Verify clicked, code:', formData.verificationCode);
    
    if (!formData.verificationCode || formData.verificationCode.length !== 6) {
      setErrors({ verificationCode: 'Please enter the 6-digit verification code' });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/verify-phone`, {
        phone: formData.phone,
        code: formData.verificationCode,
      });

      console.log('✅ Verification response:', response.data);

      if (response.data.success) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        (user as any).verified = true;
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('❌ Verification error:', error);
      let errorMsg = 'Invalid verification code';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      setErrors({ verificationCode: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  console.log('Current step:', step, 'Location:', formData.location, 'Loading:', loading);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <h1>🌾 Join Harvest Circle as a Farmer</h1>
        <p>Connect directly with buyers and get fair prices for your produce</p>
      </div>

      {/* Progress Steps */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '30px',
        padding: '0 20px',
      }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{
            flex: 1,
            textAlign: 'center',
            padding: '10px',
            backgroundColor: step >= s ? '#4CAF50' : '#e0e0e0',
            color: step >= s ? 'white' : '#666',
            margin: '0 5px',
            borderRadius: '4px',
          }}>
            Step {s}: {s === 1 ? 'Account' : s === 2 ? 'Location' : 'Verify'}
          </div>
        ))}
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        {step === 1 && (
          <div>
            <h2>Create Your Account</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="firstName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                First Name *
              </label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: errors.firstName ? '1px solid red' : '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              {errors.firstName && <p style={{ color: 'red', fontSize: '12px', margin: '5px 0 0 0' }}>{errors.firstName}</p>}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="lastName" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Last Name *
              </label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: errors.lastName ? '1px solid red' : '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              {errors.lastName && <p style={{ color: 'red', fontSize: '12px', margin: '5px 0 0 0' }}>{errors.lastName}</p>}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="phone" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="0712345678"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: errors.phone ? '1px solid red' : '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              {errors.phone && <p style={{ color: 'red', fontSize: '12px', margin: '5px 0 0 0' }}>{errors.phone}</p>}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Password *
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: errors.password ? '1px solid red' : '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              {errors.password && <p style={{ color: 'red', fontSize: '12px', margin: '5px 0 0 0' }}>{errors.password}</p>}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: errors.confirmPassword ? '1px solid red' : '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              {errors.confirmPassword && <p style={{ color: 'red', fontSize: '12px', margin: '5px 0 0 0' }}>{errors.confirmPassword}</p>}
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                width: '100%',
              }}
            >
              Next: Set Farm Location →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2>Set Your Farm Location</h2>
            <p>Click on the map or "Use My Current Location"</p>

            <LocationPicker onLocationSelect={handleLocationSelect} />

            {formData.location && (
              <div style={{ padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px', margin: '10px 0' }}>
                <strong>✅ Location selected:</strong> lat {formData.location.lat.toFixed(4)}, lng {formData.location.lng.toFixed(4)}
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <label htmlFor="address" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Farm Address (Optional)
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter your farm address..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '80px',
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
                  flex: 1,
                }}
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleRegister}
                disabled={!formData.location || loading}
                style={{
                  backgroundColor: formData.location ? '#4CAF50' : '#ccc',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: formData.location && !loading ? 'pointer' : 'not-allowed',
                  fontSize: '16px',
                  flex: 1,
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
            <p style={{ fontSize: '14px', color: '#666' }}>
              Check backend terminal for SMS code sent to <strong>{formData.phone}</strong>
            </p>

            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="verificationCode" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Enter 6-digit Code *
              </label>
              <input
                id="verificationCode"
                type="text"
                inputMode="numeric"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleInputChange}
                placeholder="123456"
                maxLength={6}
                style={{
                  width: '100%',
                  padding: '15px',
                  border: errors.verificationCode ? '2px solid red' : '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '20px',
                  textAlign: 'center',
                  letterSpacing: '5px',
                  fontFamily: 'monospace',
                }}
              />
              {errors.verificationCode && (
                <p style={{ color: 'red', fontSize: '14px' }}>
                  {errors.verificationCode}
                </p>
              )}
            </div>

            {errors.submit && (
              <div style={{
                backgroundColor: '#ffebee',
                color: '#c62828',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                borderLeft: '4px solid #f44336'
              }}>
                {errors.submit}
              </div>
            )}

            <button
              type="button"
              onClick={handleVerify}
              disabled={loading || !formData.verificationCode}
              style={{
                backgroundColor: formData.verificationCode ? '#4CAF50' : '#ccc',
                color: 'white',
                padding: '15px 30px',
                border: 'none',
                borderRadius: '8px',
                cursor: formData.verificationCode ? 'pointer' : 'not-allowed',
                fontSize: '18px',
                width: '100%',
              }}
            >
              {loading ? 'Verifying...' : 'Complete Registration'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
              Didn't get code? <button
                type="button"
                onClick={handleRegister}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4CAF50',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >Resend</button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerRegister;

