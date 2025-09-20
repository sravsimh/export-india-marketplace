import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRightIcon, GlobeAltIcon, TruckIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const Home = () => {
  return (
    <div>
      <Helmet>
        <title>ExportIndia - Connect Indian Exporters with Global Buyers</title>
        <meta name="description" content="Premier marketplace connecting Indian exporters with global buyers. Discover quality products from verified exporters across India." />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Connect Indian Exporters
              <span className="block text-yellow-300">with Global Buyers</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Discover premium quality products from verified Indian exporters. 
              Your gateway to India's finest exports.
            </p>
            <div className="space-x-4">
              <Link
                to="/products"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
              >
                Explore Products
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/register"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Start Selling
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose ExportIndia?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We provide a comprehensive platform that connects buyers and sellers with trust, quality, and efficiency.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheckIcon className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Verified Exporters</h3>
              <p className="text-gray-600">
                All exporters undergo strict verification process including business credentials, 
                quality certifications, and export licenses.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <GlobeAltIcon className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Global Reach</h3>
              <p className="text-gray-600">
                Connect with buyers from over 150 countries and expand your business 
                to international markets with our global network.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <TruckIcon className="h-10 w-10 text-orange-600" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Seamless Trade</h3>
              <p className="text-gray-600">
                End-to-end support for international trade including documentation, 
                logistics, and payment processing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Categories
            </h2>
            <p className="text-xl text-gray-600">
              Explore our diverse range of export categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Textiles & Garments', image: '/images/categories/textiles.jpg' },
              { name: 'Spices & Food', image: '/images/categories/spices.jpg' },
              { name: 'Handicrafts', image: '/images/categories/handicrafts.jpg' },
              { name: 'Electronics', image: '/images/categories/electronics.jpg' },
              { name: 'Pharmaceuticals', image: '/images/categories/pharma.jpg' },
              { name: 'Chemicals', image: '/images/categories/chemicals.jpg' },
              { name: 'Engineering Goods', image: '/images/categories/engineering.jpg' },
              { name: 'Jewelry', image: '/images/categories/jewelry.jpg' },
            ].map((category, index) => (
              <Link
                key={index}
                to={`/categories/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow group"
              >
                <div className="aspect-w-1 aspect-h-1 bg-gray-200 h-32">
                  <div className="bg-gradient-to-br from-blue-400 to-purple-500 h-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm text-center">
                      {category.name}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/categories"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              View All Categories
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">10,000+</div>
              <div className="text-blue-100">Verified Exporters</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">50,000+</div>
              <div className="text-blue-100">Products Listed</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">150+</div>
              <div className="text-blue-100">Countries Served</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">$1B+</div>
              <div className="text-blue-100">Trade Volume</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of exporters and buyers who trust ExportIndia for their international trade needs.
          </p>
          <div className="space-x-4">
            <Link
              to="/register?role=exporter"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Register as Exporter
            </Link>
            <Link
              to="/register?role=buyer"
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors"
            >
              Register as Buyer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;