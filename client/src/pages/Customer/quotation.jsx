import React from 'react';
import { Helmet } from 'react-helmet-async';

const Quotation = () => {
  return (
    <>
      <Helmet>
        <title>Quotations & Bills | Salfer Engineering</title>
        <meta name="description" content="View and manage your solar project quotations, billing statements, and payment history on Salfer Engineering." />
      </Helmet>
      
      <div>
        <h1>Quotations & Bills</h1>
        <p>View and manage your quotations and billing statements.</p>
      </div>
    </>
  );
};

export default Quotation;