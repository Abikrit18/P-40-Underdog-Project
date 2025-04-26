import React from "react";
import { Link } from "react-router-dom";

const Adoption = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden mb-12">
        <img
          src="https://plus.unsplash.com/premium_photo-1692641997227-d2f3dc4ab021?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Dog adoption"
          className="w-full h-80 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-4xl font-bold text-white mb-4">Adoption Process</h1>
            <p className="text-xl text-white max-w-3xl">
              Find your perfect companion and give a deserving dog their forever home
            </p>
          </div>
        </div>
      </div>

      {/* Introduction/Why Adopt Section */}
      <div className="max-w-4xl mx-auto mb-20 text-center bg-gradient-to-b from-orange-50 to-transparent p-8 rounded-2xl shadow-sm">
        <div className="inline-block mb-8">
          <h2 className="text-4xl font-bold mb-2 text-orange-800">Why Adopt?</h2>
          <div className="h-1 w-24 bg-orange-500 mx-auto rounded-full"></div>
        </div>
        <div className="grid md:grid-cols-2 gap-8 text-left">
          <div className="bg-white p-6 rounded-xl shadow-md transform hover:scale-105 transition-transform duration-300">
            <div className="text-orange-700 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <p className="text-lg leading-relaxed text-gray-700">
              When you adopt a dog, you're not just bringing home a pet; you're saving a life. 
              Each year, millions of dogs enter shelters, and many never find their way out.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md transform hover:scale-105 transition-transform duration-300">
            <div className="text-orange-700 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-lg leading-relaxed text-gray-700">
              At UnderDogs, we work tirelessly to match each dog with the right forever home. 
              We believe every dog deserves love, care, and the perfect family that fits their unique personality.
            </p>
          </div>
        </div>
      </div>

      {/* Process Steps */}
      <div className="mb-20 relative">
        <div className="absolute inset-0 bg-orange-50 skew-y-3 -z-10"></div>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-orange-800 mb-2">Our Adoption Process</h2>
            <div className="h-1 w-32 bg-orange-500 mx-auto rounded-full"></div>
            <p className="text-lg text-gray-600 mt-4">Five simple steps to find your perfect companion</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-full h-24 w-24 mx-auto flex items-center justify-center shadow-inner transform hover:scale-105 transition-transform duration-300 mb-6">
                <span className="text-4xl font-bold text-orange-700">1</span>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3">Meet Our Dogs</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Browse our available dogs online or visit our shelter in person.
                </p>
                <Link to="/dogs" className="text-orange-700 font-semibold hover:text-orange-900 text-sm">
                  View Available Dogs →
                </Link>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-full h-24 w-24 mx-auto flex items-center justify-center shadow-inner transform hover:scale-105 transition-transform duration-300 mb-6">
                <span className="text-4xl font-bold text-orange-700">2</span>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3">Submit Application</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Fill out our adoption application with your information and preferences.
                </p>
                <Link to="/application" className="text-orange-700 font-semibold hover:text-orange-900 text-sm">
                  Start Application →
                </Link>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-full h-24 w-24 mx-auto flex items-center justify-center shadow-inner transform hover:scale-105 transition-transform duration-300 mb-6">
                <span className="text-4xl font-bold text-orange-700">3</span>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3">Home Visit</h3>
                <p className="text-gray-600 text-sm mb-4">
                  We'll schedule a visit to ensure your home is suitable for a dog.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-full h-24 w-24 mx-auto flex items-center justify-center shadow-inner transform hover:scale-105 transition-transform duration-300 mb-6">
                <span className="text-4xl font-bold text-orange-700">4</span>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3">Meet and Greet</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Spend time with your potential new family member to ensure compatibility.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-full h-24 w-24 mx-auto flex items-center justify-center shadow-inner transform hover:scale-105 transition-transform duration-300 mb-6">
                <span className="text-4xl font-bold text-orange-700">5</span>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-3">Adoption Day</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Sign the adoption contract and welcome your new best friend home!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Adoption Requirements */}
      <div className="mb-16 bg-gray-50 rounded-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-8">Adoption Requirements</h2>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex flex-col items-center gap-3 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-orange-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-center text-gray-800 font-medium">Must be at least 21 years of age</p>
            </div>
            
            <div className="flex flex-col items-center gap-3 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-orange-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-center text-gray-800 font-medium">Valid government-issued photo ID</p>
            </div>
            
            <div className="flex flex-col items-center gap-3 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-orange-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-center text-gray-800 font-medium">Proof of residence</p>
            </div>
            
            <div className="flex flex-col items-center gap-3 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-orange-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-center text-gray-800 font-medium">Landlord approval if renting</p>
            </div>
            
            <div className="flex flex-col items-center gap-3 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-orange-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-center text-gray-800 font-medium">Meet all household members</p>
            </div>
            
            <div className="flex flex-col items-center gap-3 bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="text-orange-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-center text-gray-800 font-medium">Complete home check</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="max-w-7xl mx-auto mb-20 px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-orange-800 mb-2">Frequently Asked Questions</h2>
          <div className="h-1 w-32 bg-orange-500 mx-auto rounded-full mb-4"></div>
          <p className="text-lg text-gray-600">Everything you need to know about adopting from us</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* FAQ Card 1 */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-orange-50 p-4">
              <div className="text-orange-700 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">How long does it take?</h3>
              <p className="text-gray-600 text-center">
                The adoption process typically takes 1-2 weeks from application to bringing your new dog home.
              </p>
            </div>
          </div>

          {/* FAQ Card 2 */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-orange-50 p-4">
              <div className="text-orange-700 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">What's the fee?</h3>
              <p className="text-gray-600 text-center">
                Adoption fees range from $150-$300, including vaccinations, microchip, and spaying/neutering.
              </p>
            </div>
          </div>

          {/* FAQ Card 3 */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-orange-50 p-4">
              <div className="text-orange-700 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">Home Requirements?</h3>
              <p className="text-gray-600 text-center">
                We conduct a home visit to ensure a safe environment for the dog's specific needs.
              </p>
            </div>
          </div>

          {/* FAQ Card 4 */}
          <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-orange-50 p-4">
              <div className="text-orange-700 flex justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">Required Documents?</h3>
              <p className="text-gray-600 text-center">
                ID, proof of residence, and landlord approval (if renting) are required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-red-900 rounded-xl p-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to Find Your Forever Friend?</h2>
        <p className="text-xl text-white mb-8 max-w-3xl mx-auto">
          Take the first step toward bringing home a loving companion who needs you as much as you need them.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/dogs" className="bg-white text-orange-700 hover:bg-gray-100 font-bold py-3 px-8 rounded-full text-lg">
            Browse Available Dogs
          </Link>
          <Link to="/application" className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold py-3 px-8 rounded-full text-lg">
            Start Application
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Adoption;
