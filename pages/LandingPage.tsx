import React from 'react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold mb-4">Order Management Dashboard</h1>
        <p className="text-lg text-gray-600 mb-6">Selamat datang — panel manajemen pesanan Anda.</p>
        <div className="space-x-3">
          <a href="#features" className="px-4 py-2 bg-indigo-600 text-white rounded">Fitur</a>
          <a href="/f/example" className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded">Buka Form</a>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
