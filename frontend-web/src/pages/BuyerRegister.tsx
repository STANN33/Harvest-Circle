import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  verificationCode: string;
}

interface Errors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  submit?: string;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const BuyerRegister: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error
    if (errors[name as keyof Errors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  const validateStep1 = (): Errors => {
    const newErrors: Errors = {};

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.phone || !/^[0-9]{10,12}$/.test(formData.phone)) newErrors.phone = 'Valid phone required';
    if (!formData.password || formData.password.length < 6) newErrors.password = 'Password must be 6+ chars';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords must match';

    return newErrors;
  };

  const handleNext = () => {
    const stepErrors = validateStep1();
    if (Object.keys(stepErrors).length === 0) {
      setStep(2);
    } else {
      setErrors(stepErrors);
    }
  };

const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (step === 1) {
        // Send verification code (works for new/existing)
        const response = await axios.post(`${API_URL}/auth/register`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          password: formData.password,
          role: 'buyer',
        });

        console.log('Registration response:', response.data);
        if (response.data.success) {
          localStorage.setItem('token', response.data.data.token);
          setStep(2);
        }
      } else {
        // Verify
        const response = await axios.post(`${API_URL}/auth/verify-phone`, {
          phone: formData.phone,
          code: formData.verificationCode,
        });

        if (response.data.success) {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMsg = 'Something went wrong';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.status === 400) {
        // Validation error or exists - still send SMS
        setStep(2);
      }
      setErrors({ submit: errorMsg });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <div style={{ backgroundColor: '#FF9800', color: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
        <h1>🛒 Join as Buyer</h1>
        <p>Browse fresh produce from local farmers</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '30px' }}>
        <div style={{ padding: '10px', backgroundColor: step >= 1 ? '#FF9800' : '#e0e0e0', color: step >= 1 ? 'white' : '#666', borderRadius: '4px' }}>Step 1: Account</div>
        <div style={{ padding: '10px', backgroundColor: step >= 2 ? '#FF9800' : '#e0e0e0', color: step >= 2 ? 'white' : '#666', borderRadius: '4px' }}>Step 2: Verify</div>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div>
            <h2>Create Buyer Account</h2>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>First Name *</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: errors.firstName ? '1px solid red' : '1px solid #ddd', borderRadius: '4px' }} />
              {errors.firstName && <p style={{ color: 'red', fontSize: '12px' }}>{errors.firstName}</p>}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Last Name *</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: errors.lastName ? '1px solid red' : '1px solid #ddd', borderRadius: '4px' }} />
              {errors.lastName && <p style={{ color: 'red', fontSize: '12px' }}>{errors.lastName}</p>}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Phone *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="0712345678" style={{ width: '100%', padding: '10px', border: errors.phone ? '1px solid red' : '1px solid #ddd', borderRadius: '4px' }} />
              {errors.phone && <p style={{ color: 'red', fontSize: '12px' }}>{errors.phone}</p>}
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Password *</label>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: errors.password ? '1px solid red' : '1px solid #ddd', borderRadius: '4px' }} />
              {errors.password && <p style={{ color: 'red', fontSize: '12px' }}>{errors.password}</p>}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Confirm Password *</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} style={{ width: '100%', padding: '10px', border: errors.confirmPassword ? '1px solid red' : '1px solid #ddd', borderRadius: '4px' }} />
              {errors.confirmPassword && <p style={{ color: 'red', fontSize: '12px' }}>{errors.confirmPassword}</p>}
            </div>
            <button type="button" onClick={handleNext} disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}>
              Create Account
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2>Verify Phone</h2>
            <p>Code sent to {formData.phone}</p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Verification Code *</label>
              <input type="text" name="verificationCode" value={formData.verificationCode} onChange={handleInputChange} placeholder="123456" style={{ width: '100%', padding: '15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '18px', textAlign: 'center', letterSpacing: '5px' }} />
            </div>
            {errors.submit && <p style={{ color: 'red', marginBottom: '20px' }}>{errors.submit}</p>}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}>
              {loading ? 'Verifying...' : 'Verify & Continue to Browse'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '20px' }}>
              Didn't receive? <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#FF9800', textDecoration: 'underline' }}>Edit Phone</button>
            </p>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          Already have an account? <Link to="/login" style={{ color: '#FF9800' }}>Login here</Link>
        </p>
      </form>
    </div>
  );
};

export default BuyerRegister;

