import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>404 - Page Not Found | ExportIndia</title>
      </Helmet>
      
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Page not found
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        <div>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

// Create other placeholder components
export const ProductDetail = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="text-center py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Detail</h1>
      <p className="text-gray-600">Product detail page - to be implemented</p>
    </div>
  </div>
);

export const Categories = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="text-center py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Categories</h1>
      <p className="text-gray-600">Categories page - to be implemented</p>
    </div>
  </div>
);

export const Dashboard = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="text-center py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
      <p className="text-gray-600">User dashboard - to be implemented</p>
    </div>
  </div>
);

export const Profile = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="text-center py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Profile</h1>
      <p className="text-gray-600">User profile - to be implemented</p>
    </div>
  </div>
);

export const Login = () => (
  <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="text-center py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Login</h1>
      <p className="text-gray-600">Login page - to be implemented</p>
    </div>
  </div>
);

export const Register = () => (
  <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="text-center py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Register</h1>
      <p className="text-gray-600">Registration page - to be implemented</p>
    </div>
  </div>
);