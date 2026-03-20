import React from 'react';
import { Helmet } from 'react-helmet-async';

const CustomerDashboard = () => {
  return (
    <>
      <Helmet>
        <title>Customer Dashboard | Salfer Engineering</title>
        <meta name="description" content="View your solar project status, updates, and manage your account on the Salfer Engineering customer dashboard." />
      </Helmet>
      
      <div>
        <h1>Customer Dashboard</h1>
        <p>Welcome to your customer dashboard. View your project status and updates here.</p>
      </div>
    </>
  );
};

export default CustomerDashboard;