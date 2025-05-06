import React from 'react';

const Donation = () => {
  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <iframe
        src="https://www.clover.com/pay-widgets/d682cd3a-15d8-4ba1-8bfb-b0d73eeb867b"
        title="Donation Page"
        className="w-full h-full border-none"
      ></iframe>
    </div>
  );
};

export default Donation;