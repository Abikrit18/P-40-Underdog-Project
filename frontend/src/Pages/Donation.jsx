import React from 'react';

const Donation = () => {
  return (
    <div className="w-full h-screen bg-gray-100 flex justify-center items-center">
      <iframe
        src="https://www.clover.com/pay-widgets/d682cd3a-15d8-4ba1-8bfb-b0d73eeb867b"
        title="Clover Donation Widget"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    </div>
  );
};

export default Donation;