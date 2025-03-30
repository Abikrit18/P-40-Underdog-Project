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

      {/* Why Adopt Section */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-6">Why Adopt?</h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-12">
            When you adopt a dog, you're not just bringing home a pet; you're saving a life and making a difference.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Reason 1 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="text-orange-700 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Save a Life</h3>
            <p className="text-gray-700">
              Each year, millions of dogs enter shelters. By choosing adoption, you're giving a deserving dog a second chance at happiness and making room for another dog in need.
            </p>
          </div>

          {/* Reason 2 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="text-orange-700 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Cost-Effective</h3>
            <p className="text-gray-700">
              Adoption fees include vaccinations, spay/neuter, microchipping, and initial vet checks - services that would cost significantly more if purchased separately.
            </p>
          </div>

          {/* Reason 3 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="text-orange-700 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Known History</h3>
            <p className="text-gray-700">
              Our dogs are thoroughly evaluated for health and temperament. We provide detailed information about their personality, behavior, and medical history.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mt-8">
          {/* Reason 4 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="text-orange-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Expert Support</h3>
                <p className="text-gray-700">
                  Get ongoing support from our experienced team, including training tips, behavioral advice, and medical guidance throughout your dog's life.
                </p>
              </div>
            </div>
          </div>

          {/* Reason 5 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="text-orange-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Join Our Community</h3>
                <p className="text-gray-700">
                  Become part of our growing family of adopters. Participate in exclusive events, share experiences, and connect with other dog lovers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Stats */}
        <div className="bg-orange-50 rounded-xl p-8 mt-12 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-orange-700 mb-2">500+</div>
              <p className="text-gray-700">Dogs Adopted Last Year</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-700 mb-2">98%</div>
              <p className="text-gray-700">Successful Adoptions</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-700 mb-2">15+</div>
              <p className="text-gray-700">Years of Experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Process Steps */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Adoption Process</h2>
        
        <div className="space-y-12">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/3">
              <div className="bg-orange-100 rounded-full h-48 w-48 mx-auto flex items-center justify-center">
                <span className="text-6xl font-bold text-orange-700">1</span>
              </div>
            </div>
            <div className="w-full md:w-2/3">
              <h3 className="text-2xl font-bold mb-3">Meet Our Dogs</h3>
              <p className="text-lg mb-4">
                Browse our available dogs online or visit our shelter in person. 
                Each dog profile includes details about their personality, background, 
                and specific needs to help you find your perfect match.
              </p>
              <Link to="/dogs" className="text-orange-700 font-semibold hover:text-orange-900">
                View Available Dogs →
              </Link>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="w-full md:w-1/3">
              <div className="bg-orange-100 rounded-full h-48 w-48 mx-auto flex items-center justify-center">
                <span className="text-6xl font-bold text-orange-700">2</span>
              </div>
            </div>
            <div className="w-full md:w-2/3">
              <h3 className="text-2xl font-bold mb-3">Submit an Application</h3>
              <p className="text-lg mb-4">
                Fill out our adoption application with information about your lifestyle, 
                living situation, and experience with pets. This helps us ensure each 
                dog goes to a home that matches their specific needs.
              </p>
              <Link to="/application" className="text-orange-700 font-semibold hover:text-orange-900">
                Start Application →
              </Link>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/3">
              <div className="bg-orange-100 rounded-full h-48 w-48 mx-auto flex items-center justify-center">
                <span className="text-6xl font-bold text-orange-700">3</span>
              </div>
            </div>
            <div className="w-full md:w-2/3">
              <h3 className="text-2xl font-bold mb-3">Home Visit</h3>
              <p className="text-lg">
                After your application is approved, we'll schedule a home visit to ensure 
                your living environment is safe and suitable for a dog. This is also a great 
                opportunity to ask any questions you might have about dog ownership.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="w-full md:w-1/3">
              <div className="bg-orange-100 rounded-full h-48 w-48 mx-auto flex items-center justify-center">
                <span className="text-6xl font-bold text-orange-700">4</span>
              </div>
            </div>
            <div className="w-full md:w-2/3">
              <h3 className="text-2xl font-bold mb-3">Meet and Greet</h3>
              <p className="text-lg">
                Spend time with the dog you're interested in adopting. If you have other 
                pets, we'll arrange a meeting to ensure compatibility. This step ensures that 
                both you and the dog are comfortable with each other.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/3">
              <div className="bg-orange-100 rounded-full h-48 w-48 mx-auto flex items-center justify-center">
                <span className="text-6xl font-bold text-orange-700">5</span>
              </div>
            </div>
            <div className="w-full md:w-2/3">
              <h3 className="text-2xl font-bold mb-3">Adoption Day</h3>
              <p className="text-lg">
                Once approved, you'll sign the adoption contract, pay the adoption fee, 
                and take your new best friend home! The fee includes spay/neuter, vaccinations, 
                microchipping, and initial vet check.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Adoption Requirements */}
      <div className="mb-16 bg-gray-50 rounded-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-8">Adoption Requirements</h2>
        
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="text-orange-700 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-lg">Must be at least 21 years of age</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-orange-700 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-lg">Valid government-issued photo ID</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-orange-700 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-lg">Proof of residence (utility bill, lease, etc.)</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-orange-700 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-lg">If renting, landlord approval documentation</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-orange-700 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-lg">Adoption fee ($200-$350, varies by dog)</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-orange-700 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <p className="text-lg">All household members must meet the dog</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        
        <div className="space-y-8">
          {/* FAQ Item 1 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-bold mb-3 text-orange-700">How long does the adoption process take?</h3>
            <p className="text-gray-700 leading-relaxed">
              The adoption process typically takes 1-2 weeks from application to bringing your new dog home. 
              This includes application review (1-2 days), home visit scheduling and completion (2-4 days), 
              and final paperwork (1-2 days). The timeline may vary based on your availability and the 
              specific circumstances of the adoption.
            </p>
          </div>
          
          {/* FAQ Item 2 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-bold mb-3 text-orange-700">What's included in the adoption fee?</h3>
            <p className="text-gray-700 leading-relaxed">
              Our adoption fee includes:
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Spay/neuter surgery</li>
                <li>Up-to-date vaccinations</li>
                <li>Microchipping</li>
                <li>Deworming treatment</li>
                <li>Flea/tick prevention</li>
                <li>Initial health check</li>
                <li>Basic starter kit with food samples</li>
                <li>30 days of pet insurance</li>
              </ul>
            </p>
          </div>
          
          {/* FAQ Item 3 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-bold mb-3 text-orange-700">What are the requirements for adopting?</h3>
            <p className="text-gray-700 leading-relaxed">
              Basic requirements include:
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Must be at least 21 years old</li>
                <li>Valid government-issued ID</li>
                <li>Proof of residence (lease/mortgage)</li>
                <li>Landlord approval if renting</li>
                <li>All household members must meet the dog</li>
                <li>Secure, fenced yard for certain breeds</li>
                <li>Current pets must be up-to-date on vaccinations</li>
              </ul>
            </p>
          </div>
          
          {/* FAQ Item 4 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-bold mb-3 text-orange-700">Can I return a dog if it doesn't work out?</h3>
            <p className="text-gray-700 leading-relaxed">
              Yes, we have a 30-day adoption guarantee. If for any reason the adoption doesn't work out, 
              you can return the dog and receive a full refund of the adoption fee. We also provide post-adoption 
              support and resources to help ensure a successful transition. Our goal is to make sure both you 
              and your new dog are happy with the match.
            </p>
          </div>
          
          {/* FAQ Item 5 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-bold mb-3 text-orange-700">Do you offer post-adoption support?</h3>
            <p className="text-gray-700 leading-relaxed">
              Yes! We provide comprehensive post-adoption support including:
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Free training consultation</li>
                <li>24/7 behavioral support hotline</li>
                <li>Monthly check-ins for the first 3 months</li>
                <li>Access to our network of preferred veterinarians</li>
                <li>Discounted training classes</li>
                <li>Regular adopter community events</li>
              </ul>
            </p>
          </div>
          
          {/* FAQ Item 6 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-bold mb-3 text-orange-700">What if I already have pets at home?</h3>
            <p className="text-gray-700 leading-relaxed">
              We encourage adoptions into homes with existing pets! We'll arrange a meet-and-greet between your 
              current pets and your potential new family member to ensure compatibility. Our experienced staff 
              will guide you through the introduction process and provide tips for successful integration. 
              We recommend bringing current vaccination records for your existing pets to the meeting.
            </p>
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
