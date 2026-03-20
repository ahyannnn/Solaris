import React from 'react';
import { Helmet } from 'react-helmet-async';

const Profile = () => {
  return (
    <>
      <Helmet>
        <title>My Profile | Salfer Engineering</title>
        <meta name="description" content="Manage your account information, update personal details, and configure your settings on Salfer Engineering." />
      </Helmet>
      
      <div>
        <h1>My Profile</h1>
        <p>Manage your account information and settings.</p>
      </div>
    </>
  );
};

export default Profile;