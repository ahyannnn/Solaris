import React from 'react';
import { Helmet } from 'react-helmet-async';

const MyProject = () => {
  return (
    <>
      <Helmet>
        <title>My Project | Salfer Engineering</title>
        <meta name="description" content="Track your solar panel installation project status, view milestones, and monitor progress on your Salfer Engineering project." />
      </Helmet>
      
      <div>
        <h1>My Project</h1>
        <p>View and track your solar panel installation project.</p>
      </div>
    </>
  );
};

export default MyProject;