import React from 'react';
import { Helmet } from 'react-helmet-async';

const Products = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Products - ExportIndia</title>
      </Helmet>
      
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Products</h1>
        <p className="text-gray-600">Product listing page - to be implemented</p>
      </div>
    </div>
  );
};

export default Products;