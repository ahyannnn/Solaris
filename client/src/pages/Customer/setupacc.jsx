// pages/Customer/setupacc.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FaUser,
  FaPhone,
  FaHome,
  FaCity,
  FaGlobe,
  FaMailBulk,
  FaCheckCircle,
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt,
  FaBuilding,
  FaRoad,
  FaIndustry,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';
import logo from '../../assets/Salfare_Logo.png';
import '../../styles/Customer/setupacc.css';

const SetupAccount = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [clientData, setClientData] = useState(null);

  const token = sessionStorage.getItem('token');

  // Generate years (last 100 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // RootScratch API States
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [citiesMunicipalities, setCitiesMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    accountType: 'residential',
    companyName: '',
    phoneNumber: '',
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    // Address fields
    houseOrBuilding: '',
    street: '',
    region: '',
    province: '',
    cityMunicipality: '',
    barangay: '',
    zipCode: ''
  });

  const [errors, setErrors] = useState({});
  const [birthdayError, setBirthdayError] = useState('');

  // Fetch existing client data on mount
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setClientData(data.client);

          if (data.client) {
            setFormData(prev => ({
              ...prev,
              accountType: data.client.client_type ?
                data.client.client_type.toLowerCase() : 'residential',
              companyName: data.client.companyName || '',
              phoneNumber: data.client.contactNumber || '',
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
      }
    };

    if (token) {
      fetchClientData();
    }
  }, [token]);

  // Fetch Regions on component mount
  useEffect(() => {
    const fetchRegions = async () => {
      setLoadingRegions(true);
      try {
        const response = await fetch('https://rootscratch.com/api/psgc/regions?limit=20', {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch regions');
        }

        const data = await response.json();
        setRegions(data.data || []);
      } catch (error) {
        console.error('Error fetching regions:', error);
        setApiError('Failed to load regions. Please refresh the page.');
      } finally {
        setLoadingRegions(false);
      }
    };

    fetchRegions();
  }, []);

  // Fetch Provinces when Region changes
  useEffect(() => {
    const fetchProvinces = async () => {
      if (!formData.region) {
        setProvinces([]);
        setCitiesMunicipalities([]);
        setBarangays([]);
        // Reset dependent fields
        setFormData(prev => ({
          ...prev,
          province: '',
          cityMunicipality: '',
          barangay: ''
        }));
        return;
      }

      // Extract region code from selected region
      const selectedRegion = regions.find(r => r.name === formData.region);
      if (!selectedRegion) {
        setProvinces([]);
        return;
      }

      // Region code is like "1200000000", we need to extract the numeric part
      // The API expects region_code like "12" from "1200000000"
      const regionCode = selectedRegion.code.replace(/0+$/, '');

      setLoadingProvinces(true);
      try {
        const response = await fetch(
          `https://rootscratch.com/api/psgc/provinces?region_code=${regionCode}&limit=500`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch provinces');
        }

        const data = await response.json();
        setProvinces(data.data || []);
        setCitiesMunicipalities([]);
        setBarangays([]);
        setFormData(prev => ({
          ...prev,
          province: '',
          cityMunicipality: '',
          barangay: ''
        }));
      } catch (error) {
        console.error('Error fetching provinces:', error);
        setApiError('Failed to load provinces. Please try again.');
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, [formData.region, regions]);

  // Fetch Cities/Municipalities when Province changes
  useEffect(() => {
    const fetchCitiesMunicipalities = async () => {
      if (!formData.province) {
        setCitiesMunicipalities([]);
        setBarangays([]);
        setFormData(prev => ({
          ...prev,
          cityMunicipality: '',
          barangay: ''
        }));
        return;
      }

      // Find the selected province
      const selectedProvince = provinces.find(p => p.name === formData.province);
      if (!selectedProvince) {
        setCitiesMunicipalities([]);
        return;
      }

      // Province code like "1206300000" - remove trailing zeros to get "12063"
      const provinceCode = selectedProvince.code.replace(/0+$/, '');

      setLoadingCities(true);
      try {
        const response = await fetch(
          `https://rootscratch.com/api/psgc/cities-municipalities?province_code=${provinceCode}&limit=500`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch cities/municipalities');
        }

        const data = await response.json();
        setCitiesMunicipalities(data.data || []);
        setBarangays([]);
        setFormData(prev => ({
          ...prev,
          cityMunicipality: '',
          barangay: ''
        }));
      } catch (error) {
        console.error('Error fetching cities/municipalities:', error);
        setApiError('Failed to load cities/municipalities. Please try again.');
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCitiesMunicipalities();
  }, [formData.province, provinces]);

  // Fetch Barangays when City/Municipality changes
  useEffect(() => {
    const fetchBarangays = async () => {
      if (!formData.cityMunicipality) {
        setBarangays([]);
        setFormData(prev => ({
          ...prev,
          barangay: ''
        }));
        return;
      }

      // Find the selected city/municipality
      const selectedCity = citiesMunicipalities.find(c => c.name === formData.cityMunicipality);
      if (!selectedCity) {
        setBarangays([]);
        return;
      }

      // City code like "1206306000" - remove trailing zeros to get "1206306"
      const cityCode = selectedCity.code.replace(/0+$/, '');

      setLoadingBarangays(true);
      try {
        const response = await fetch(
          `https://rootscratch.com/api/psgc/barangays?city_municipality_code=${cityCode}&limit=100`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch barangays');
        }

        const data = await response.json();
        setBarangays(data.data || []);
        setFormData(prev => ({
          ...prev,
          barangay: ''
        }));
      } catch (error) {
        console.error('Error fetching barangays:', error);
        setApiError('Failed to load barangays. Please try again.');
      } finally {
        setLoadingBarangays(false);
      }
    };

    fetchBarangays();
  }, [formData.cityMunicipality, citiesMunicipalities]);

  // Enhanced birthday validation with detailed error messages
  const validateBirthday = (month, day, year) => {
    if (!month || !day || !year) {
      return 'Please complete your birthday';
    }

    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    const yearNum = parseInt(year);

    // Check if month is valid
    if (monthNum < 1 || monthNum > 12) {
      return 'Invalid month selected. Please choose a month between 1 and 12.';
    }

    // Check if day is valid for the month
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    if (dayNum < 1 || dayNum > daysInMonth) {
      const monthName = months[monthNum - 1];
      return `${monthName} ${yearNum} only has ${daysInMonth} days. Please select a valid day (1-${daysInMonth}).`;
    }

    // Check if year is valid
    if (yearNum < 1900) {
      return 'Year must be 1900 or later. Please select a valid year.';
    }

    // Check if year is in the future
    if (yearNum > currentYear) {
      return `Year cannot be in the future. Please select a year between 1900 and ${currentYear}.`;
    }

    const birthDate = new Date(yearNum, monthNum - 1, dayNum);
    const today = new Date();

    // Check if birthday is in the future (including same year but future month/day)
    if (birthDate > today) {
      return `Birthday cannot be in the future. Please select a date on or before ${today.toLocaleDateString()}.`;
    }

    // Calculate exact age
    let age = today.getFullYear() - yearNum;
    const monthDiff = today.getMonth() - (monthNum - 1);
    const dayDiff = today.getDate() - dayNum;

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    // Check minimum age (18 years old)
    if (age < 18) {
      const yearsUntil18 = 18 - age;
      return `You must be at least 18 years old to register. You are currently ${age} years old.`;
    }

    // Check maximum age (120 years old)
    if (age > 120) {
      return `Age (${age}) exceeds maximum allowed (120 years). Please verify your birth year.`;
    }

    return '';
  };

  // Update the validateBirthdayFields function
  const validateBirthdayFields = () => {
    const newErrors = {};

    // Check if any field is empty - show single error message
    if (!formData.birthMonth || !formData.birthDay || !formData.birthYear) {
      newErrors.birthday = 'Please complete your birth month, day, and year';
    }

    // If all fields are filled, validate the complete date
    if (formData.birthMonth && formData.birthDay && formData.birthYear) {
      const birthdayErrorMsg = validateBirthday(
        formData.birthMonth,
        formData.birthDay,
        formData.birthYear
      );
      if (birthdayErrorMsg) {
        newErrors.birthday = birthdayErrorMsg;
        setBirthdayError(birthdayErrorMsg);
      }
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Phone number formatting - only allow digits
    if (name === 'phoneNumber') {
      // Only allow numeric input
      const numericValue = value.replace(/\D/g, '');
      // Limit to 11 digits (09 + 9 digits)
      if (numericValue.length <= 11) {
        setFormData({ ...formData, [name]: numericValue });
      }
      // Clear phone error when typing
      if (errors.phoneNumber) {
        setErrors({ ...errors, phoneNumber: '' });
      }
    }
    // Zip code formatting - only allow digits
    else if (name === 'zipCode') {
      // Only allow numeric input
      const numericValue = value.replace(/\D/g, '');
      // Limit to 4 digits
      if (numericValue.length <= 4) {
        setFormData({ ...formData, [name]: numericValue });
      }
      // Clear zip error when typing
      if (errors.zipCode) {
        setErrors({ ...errors, zipCode: '' });
      }
    }
    else {
      setFormData({ ...formData, [name]: value });
    }

    // Clear other errors when user types
    if (errors[name] && name !== 'phoneNumber' && name !== 'zipCode') {
      setErrors({ ...errors, [name]: '' });
    }
    if (apiError) setApiError('');

    // Clear birthday error when any birthday field changes
    if (name === 'birthMonth' || name === 'birthDay' || name === 'birthYear') {
      setBirthdayError('');
      if (errors.birthday) {
        setErrors({ ...errors, birthday: '' });
      }
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    // Account type validation
    if (!formData.accountType) {
      newErrors.accountType = 'Account type is required';
    }

    // Company name validation
    if ((formData.accountType === 'company' || formData.accountType === 'industrial') && !formData.companyName) {
      newErrors.companyName = `${formData.accountType === 'company' ? 'Company' : 'Business/Organization'} name is required`;
    }

    // Phone number validation - only 09xxxxxxxxx format
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (formData.phoneNumber.length < 11) {
      newErrors.phoneNumber = 'Phone number must be exactly 11 digits (09XXXXXXXXX)';
    } else if (formData.phoneNumber.length > 11) {
      newErrors.phoneNumber = 'Phone number must be exactly 11 digits (09XXXXXXXXX)';
    } else if (!formData.phoneNumber.startsWith('09')) {
      newErrors.phoneNumber = 'Phone number must start with 09 (e.g., 09123456789)';
    } else if (!/^09\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format. Use 09XXXXXXXXX (11 digits)';
    }

    // Birthday validation - separate error messages
    const birthdayErrors = validateBirthdayFields();
    Object.assign(newErrors, birthdayErrors);

    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.houseOrBuilding) newErrors.houseOrBuilding = 'House/Building number is required';
    if (!formData.street) newErrors.street = 'Street is required';
    if (!formData.region) newErrors.region = 'Region is required';
    if (!formData.province) newErrors.province = 'Province is required';
    if (!formData.cityMunicipality) newErrors.cityMunicipality = 'City/Municipality is required';
    if (!formData.barangay) newErrors.barangay = 'Barangay is required';
    if (!formData.zipCode) newErrors.zipCode = 'ZIP code is required';
    if (formData.zipCode && !/^\d{4}$/.test(formData.zipCode)) {
      newErrors.zipCode = 'ZIP code must be exactly 4 digits (0-9)';
    }
    return newErrors;
  };

  const handleNext = () => {
    // Clear previous errors
    setErrors({});
    setBirthdayError('');

    const stepErrors = validateStep1();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setCurrentStep(2);
  };

  const handleBack = () => setCurrentStep(1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    const stepErrors = validateStep2();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      // Final birthday validation before submission
      const birthdayErrorMsg = validateBirthday(
        formData.birthMonth,
        formData.birthDay,
        formData.birthYear
      );

      if (birthdayErrorMsg) {
        setBirthdayError(birthdayErrorMsg);
        setErrors(prev => ({ ...prev, birthday: birthdayErrorMsg }));
        setIsLoading(false);
        return;
      }

      const birthday = formData.birthYear && formData.birthMonth && formData.birthDay
        ? `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`
        : null;

      const clientUpdate = {
        contactNumber: formData.phoneNumber,
        client_type: formData.accountType === 'residential' ? 'Residential' :
          formData.accountType === 'company' ? 'Company' : 'Industrial',
        companyName: (formData.accountType === 'company' || formData.accountType === 'industrial') ? formData.companyName : '',
        birthday: birthday,
        account_setup: true
      };

      const clientRes = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clientUpdate)
      });

      const clientData = await clientRes.json();

      if (!clientRes.ok) {
        throw new Error(clientData.message || 'Failed to update client information');
      }

      const addressData = {
        houseOrBuilding: formData.houseOrBuilding,
        street: formData.street,
        region: formData.region,
        province: formData.province,
        cityMunicipality: formData.cityMunicipality,
        barangay: formData.barangay,
        zipCode: formData.zipCode,
        label: 'Primary',
        isPrimary: true
      };

      const addressRes = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/me/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addressData)
      });

      const addressResult = await addressRes.json();

      if (!addressRes.ok) {
        throw new Error(addressResult.message || 'Failed to save address');
      }

      sessionStorage.setItem('hasCompletedSetup', 'true');
      sessionStorage.setItem('clientData', JSON.stringify({
        ...clientData.client,
        primaryAddress: addressResult.address
      }));

      setCurrentStep(3);
    } catch (error) {
      console.error('Setup error:', error);
      setApiError(error.message || 'Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
    sessionStorage.setItem('hasCompletedSetup', 'true');
    navigate('/app/customer');
  };

  const getBusinessLabel = () => {
    if (formData.accountType === 'company') {
      return 'Company Name';
    } else if (formData.accountType === 'industrial') {
      return 'Business/Organization Name';
    }
    return '';
  };

  const getBusinessPlaceholder = () => {
    if (formData.accountType === 'company') {
      return 'Enter company name';
    } else if (formData.accountType === 'industrial') {
      return 'Enter business/organization name';
    }
    return '';
  };

  const getBusinessIcon = () => {
    if (formData.accountType === 'company') {
      return <FaBuilding className="new-setup-input-icon" />;
    } else if (formData.accountType === 'industrial') {
      return <FaIndustry className="new-setup-input-icon" />;
    }
    return null;
  };

  // Get account type icon
  const getAccountTypeIcon = () => {
    if (formData.accountType === 'residential') {
      return <FaUser className="new-setup-select-icon" />;
    } else if (formData.accountType === 'company') {
      return <FaBuilding className="new-setup-select-icon" />;
    } else if (formData.accountType === 'industrial') {
      return <FaIndustry className="new-setup-select-icon" />;
    }
    return <FaUser className="new-setup-select-icon" />;
  };

  // Get branding content based on step
  const getBrandingContent = (step) => {
    switch (step) {
      case 1:
        return {
          title: 'Complete Your Profile',
          subtitle: 'Tell us about yourself',
          description: 'We need a few details to personalize your solar experience. This helps us provide better service.',
          features: ['Personalized Solar Solutions', 'Accurate Assessment', 'Better Service']
        };
      case 2:
        return {
          title: 'Address Information',
          subtitle: 'Where are you located?',
          description: 'Your address helps us determine solar potential and provide accurate installation estimates.',
          features: ['Site Assessment', 'Solar Potential Analysis', 'Installation Planning']
        };
      case 3:
        return {
          title: 'Setup Complete!',
          subtitle: 'You\'re all set',
          description: 'Your account is now fully configured. You can start exploring solar solutions and book assessments.',
          features: ['Ready to Go', 'Explore Solutions', 'Book Assessments']
        };
      default:
        return {
          title: 'Complete Your Profile',
          subtitle: 'Tell us about yourself',
          description: 'We need a few details to personalize your solar experience.',
          features: ['Personalized Solar Solutions', 'Accurate Assessment', 'Better Service']
        };
    }
  };

  // Form starts on LEFT for step 1 & 3, RIGHT for step 2
  const isFormLeft = currentStep === 1 || currentStep === 3;

  return (
    <>
      <Helmet>
        <title>Complete Your Account Setup | Salfer Engineering</title>
        <meta name="description" content="Finish setting up your Salfer Engineering account by providing your personal information and address details to access your solar project dashboard." />
      </Helmet>

      <div className="new-setup-page">
        {/* FORM SECTION - Step 1: Left, Step 2: Right, Step 3: Left */}
        <div className={`new-setup-form-container ${isFormLeft ? 'form-left' : 'form-right'}`}>
          <div className="new-setup-form-wrapper">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <>
                <div className="new-setup-form-header">
                  <h2 className="new-setup-form-title">Complete Your Profile</h2>
                  <p className="new-setup-form-subtitle">Tell us more about yourself</p>
                </div>

                {clientData && (
                  <div className="new-setup-info-box">
                    <p className="new-setup-info-text">
                      Welcome, <strong className="new-setup-welcome-name">{clientData.contactFirstName} {clientData.contactLastName}</strong>!
                    </p>
                    <p className="new-setup-info-subtext">
                      Your name is already saved. Please complete the rest of your profile.
                    </p>
                  </div>
                )}

                <form className="new-setup-form">
                  {/* ACCOUNT TYPE - WITH ICON */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">Account Type <span className="new-setup-required">*</span></label>
                    <div className="new-setup-select-wrapper">
                      {getAccountTypeIcon()}
                      <select
                        name="accountType"
                        value={formData.accountType}
                        onChange={handleChange}
                        className={`new-setup-select ${errors.accountType ? 'error' : ''}`}
                      >
                        <option value="residential">Residential</option>
                        <option value="company">Company</option>
                        <option value="industrial">Industrial</option>
                      </select>
                    </div>
                    {errors.accountType && <span className="new-setup-error-message">{errors.accountType}</span>}
                  </div>

                  {/* BUSINESS/COMPANY NAME */}
                  {(formData.accountType === 'company' || formData.accountType === 'industrial') && (
                    <div className="new-setup-form-group">
                      <label className="new-setup-form-label">{getBusinessLabel()} <span className="new-setup-required">*</span></label>
                      <div className="new-setup-input-wrapper">
                        {getBusinessIcon()}
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          className={`new-setup-form-input ${errors.companyName ? 'error' : ''}`}
                          placeholder={getBusinessPlaceholder()}
                        />
                      </div>
                      {errors.companyName && <span className="new-setup-error-message">{errors.companyName}</span>}
                    </div>
                  )}

                  {/* PHONE NUMBER */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">Phone Number <span className="new-setup-required">*</span></label>
                    <div className="new-setup-input-wrapper">
                      <FaPhone className="new-setup-input-icon" />
                      <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className={`new-setup-form-input ${errors.phoneNumber ? 'error' : ''}`}
                        placeholder="09XXXXXXXXX"
                        maxLength="11"
                      />
                    </div>
                    {errors.phoneNumber && <span className="new-setup-error-message">{errors.phoneNumber}</span>}
                    <small className="new-setup-hint-text">Format: 09XXXXXXXXX (11 digits)</small>
                  </div>


                  {/* BIRTHDAY */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">Birthday <span className="new-setup-required">*</span></label>
                    <div className="new-setup-birthday-row">
                      <div className="new-setup-select-wrapper">
                        <FaCalendarAlt className="new-setup-select-icon" />
                        <select
                          name="birthMonth"
                          value={formData.birthMonth}
                          onChange={handleChange}
                          className={`new-setup-select ${errors.birthday ? 'error' : ''}`}
                        >
                          <option value="">Month</option>
                          {months.map((month, index) => (
                            <option key={index} value={index + 1}>{month}</option>
                          ))}
                        </select>
                      </div>

                      <div className="new-setup-select-wrapper">
                        <select
                          name="birthDay"
                          value={formData.birthDay}
                          onChange={handleChange}
                          className={`new-setup-select ${errors.birthday ? 'error' : ''}`}
                        >
                          <option value="">Day</option>
                          {days.map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>

                      <div className="new-setup-select-wrapper">
                        <select
                          name="birthYear"
                          value={formData.birthYear}
                          onChange={handleChange}
                          className={`new-setup-select ${errors.birthday ? 'error' : ''}`}
                        >
                          <option value="">Year</option>
                          {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Single birthday error message */}
                    {errors.birthday && <span className="new-setup-error-message">{errors.birthday}</span>}

                    <small className="new-setup-hint-text">Select your birth month, day, and year</small>
                  </div>

                  <div className="new-setup-form-actions">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="new-setup-btn-next"
                    >
                      Next Step <FaArrowRight />
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 2: Address Information */}
            {currentStep === 2 && (
              <>
                <div className="new-setup-form-header">
                  <h2 className="new-setup-form-title">Address Information</h2>
                  <p className="new-setup-form-subtitle">Where are you located?</p>
                </div>

                {apiError && (
                  <div className="new-setup-api-error">
                    <span className="new-setup-error-message">{apiError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="new-setup-form">
                  {/* HOUSE/BUILDING NUMBER */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">House/Building No. <span className="new-setup-required">*</span></label>
                    <div className="new-setup-input-wrapper">
                      <FaHome className="new-setup-input-icon" />
                      <input
                        type="text"
                        name="houseOrBuilding"
                        value={formData.houseOrBuilding}
                        onChange={handleChange}
                        className={`new-setup-form-input ${errors.houseOrBuilding ? 'error' : ''}`}
                        placeholder="Enter house/building number"
                      />
                    </div>
                    {errors.houseOrBuilding && <span className="new-setup-error-message">{errors.houseOrBuilding}</span>}
                  </div>

                  {/* STREET */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">Street <span className="new-setup-required">*</span></label>
                    <div className="new-setup-input-wrapper">
                      <FaRoad className="new-setup-input-icon" />
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        className={`new-setup-form-input ${errors.street ? 'error' : ''}`}
                        placeholder="Enter street name"
                      />
                    </div>
                    {errors.street && <span className="new-setup-error-message">{errors.street}</span>}
                  </div>

                  {/* REGION - Dropdown */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">Region <span className="new-setup-required">*</span></label>
                    <div className="new-setup-select-wrapper">
                      <FaGlobe className="new-setup-select-icon" />
                      <select
                        name="region"
                        value={formData.region}
                        onChange={handleChange}
                        className={`new-setup-select ${errors.region ? 'error' : ''}`}
                        disabled={loadingRegions}
                      >
                        <option value="">Select Region</option>
                        {regions.map((region) => (
                          <option key={region.code} value={region.name}>
                            {region.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {loadingRegions && <small className="new-setup-hint-text">Loading regions...</small>}
                    {errors.region && <span className="new-setup-error-message">{errors.region}</span>}
                  </div>

                  {/* PROVINCE - Dropdown */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">Province <span className="new-setup-required">*</span></label>
                    <div className="new-setup-select-wrapper">
                      <FaGlobe className="new-setup-select-icon" />
                      <select
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        className={`new-setup-select ${errors.province ? 'error' : ''}`}
                        disabled={!formData.region || loadingProvinces}
                      >
                        <option value="">Select Province</option>
                        {provinces.map((province) => (
                          <option key={province.code} value={province.name}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {loadingProvinces && <small className="new-setup-hint-text">Loading provinces...</small>}
                    {!formData.region && <small className="new-setup-hint-text">Please select a region first</small>}
                    {errors.province && <span className="new-setup-error-message">{errors.province}</span>}
                  </div>

                  {/* CITY/MUNICIPALITY - Dropdown */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">City/Municipality <span className="new-setup-required">*</span></label>
                    <div className="new-setup-select-wrapper">
                      <FaCity className="new-setup-select-icon" />
                      <select
                        name="cityMunicipality"
                        value={formData.cityMunicipality}
                        onChange={handleChange}
                        className={`new-setup-select ${errors.cityMunicipality ? 'error' : ''}`}
                        disabled={!formData.province || loadingCities}
                      >
                        <option value="">Select City/Municipality</option>
                        {citiesMunicipalities.map((city) => (
                          <option key={city.code} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {loadingCities && <small className="new-setup-hint-text">Loading cities/municipalities...</small>}
                    {!formData.province && <small className="new-setup-hint-text">Please select a province first</small>}
                    {errors.cityMunicipality && <span className="new-setup-error-message">{errors.cityMunicipality}</span>}
                  </div>

                  {/* BARANGAY - Dropdown */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">Barangay <span className="new-setup-required">*</span></label>
                    <div className="new-setup-select-wrapper">
                      <FaCity className="new-setup-select-icon" />
                      <select
                        name="barangay"
                        value={formData.barangay}
                        onChange={handleChange}
                        className={`new-setup-select ${errors.barangay ? 'error' : ''}`}
                        disabled={!formData.cityMunicipality || loadingBarangays}
                      >
                        <option value="">Select Barangay</option>
                        {barangays.map((barangay) => (
                          <option key={barangay.code} value={barangay.name}>
                            {barangay.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {loadingBarangays && <small className="new-setup-hint-text">Loading barangays...</small>}
                    {!formData.cityMunicipality && <small className="new-setup-hint-text">Please select a city/municipality first</small>}
                    {errors.barangay && <span className="new-setup-error-message">{errors.barangay}</span>}
                  </div>
                  {/* STREET */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">Street <span className="new-setup-required">*</span></label>
                    <div className="new-setup-input-wrapper">
                      <FaRoad className="new-setup-input-icon" />
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        className={`new-setup-form-input ${errors.street ? 'error' : ''}`}
                        placeholder="Enter street name"
                      />
                    </div>
                    {errors.street && <span className="new-setup-error-message">{errors.street}</span>}
                  </div>
                  {/* HOUSE/BUILDING NUMBER */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">House/Building No. <span className="new-setup-required">*</span></label>
                    <div className="new-setup-input-wrapper">
                      <FaHome className="new-setup-input-icon" />
                      <input
                        type="text"
                        name="houseOrBuilding"
                        value={formData.houseOrBuilding}
                        onChange={handleChange}
                        className={`new-setup-form-input ${errors.houseOrBuilding ? 'error' : ''}`}
                        placeholder="Enter house/building number"
                      />
                    </div>
                    {errors.houseOrBuilding && <span className="new-setup-error-message">{errors.houseOrBuilding}</span>}
                  </div>



                  {/* ZIP CODE */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">ZIP Code <span className="new-setup-required">*</span></label>
                    <div className="new-setup-input-wrapper">
                      <FaMailBulk className="new-setup-input-icon" />
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        className={`new-setup-form-input ${errors.zipCode ? 'error' : ''}`}
                        placeholder="Enter ZIP code"
                        maxLength="4"
                        pattern="[0-9]{4}"
                        inputMode="numeric"
                      />
                    </div>
                    {errors.zipCode && <span className="new-setup-error-message">{errors.zipCode}</span>}
                    <small className="new-setup-hint-text">Format: 4 digits (e.g., 1234)</small>
                  </div>

                  <div className="new-setup-form-actions">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="new-setup-btn-back"
                    >
                      <FaArrowLeft /> Back
                    </button>
                    <button
                      type="submit"
                      className="new-setup-btn-submit"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Complete Setup'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 3: Success */}
            {currentStep === 3 && (
              <div className="new-setup-success-container">
                <div className="new-setup-success-icon">
                  <FaCheckCircle />
                </div>
                <h2 className="new-setup-success-title">✓ All Set!</h2>
                <p className="new-setup-success-message">
                  Your account setup is complete. You can now access your dashboard and start booking assessments.
                </p>
                <button
                  onClick={handleContinueToDashboard}
                  className="new-setup-btn-dashboard"
                >
                  Continue to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>

        {/* BRANDING SECTION - Opposite of form */}
        <div className={`new-setup-branding ${!isFormLeft ? 'branding-left' : 'branding-right'}`}>
          <div className="new-setup-branding-content">
            <div className="new-setup-brand-header">
              <img src={logo} alt="Salfer Engineering" className="new-setup-brand-logo" />
              <h1 className="new-setup-brand-name">Salfer Engineering</h1>
            </div>
            <h2 className="new-setup-brand-tagline">
              {getBrandingContent(currentStep).title}
            </h2>
            <p className="new-setup-brand-description">
              {getBrandingContent(currentStep).description}
            </p>
            <div className="new-setup-brand-features">
              {getBrandingContent(currentStep).features.map((feature, index) => (
                <div className="new-setup-brand-feature" key={index}>
                  <span className="new-setup-feature-dot"></span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SetupAccount;