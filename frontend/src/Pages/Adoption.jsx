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

      {/* Introduction */}
      <div className="max-w-3xl mx-auto mb-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Why Adopt?</h2>
        <p className="text-lg mb-6">
          When you adopt a dog, you're not just bringing home a pet; you're saving a life. 
          Each year, millions of dogs enter shelters, and many never find their way out. 
          By choosing adoption, you're giving a deserving dog a second chance at happiness 
          while making room for another dog in need at the shelter.
        </p>
        <p className="text-lg">
          At UnderDogs, we work tirelessly to match each dog with the right forever home. 
          We believe every dog deserves love, care, and the perfect family that fits their unique personality.
        </p>
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
        <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-2">How long does the adoption process take?</h3>
            <p className="text-lg">
              The adoption process typically takes 1-2 weeks from application to bringing your new dog home, 
              depending on the individual circumstances and how quickly we can schedule the home visit.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-2">What's included in the adoption fee?</h3>
            <p className="text-lg">
              Our adoption fee includes spay/neuter surgery, up-to-date vaccinations, microchipping, 
              deworming, flea/tick prevention, an initial health check, and a basic starter kit with food samples.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-2">Can I adopt if I live in an apartment?</h3>
            <p className="text-lg">
              Yes! We have many dogs that do well in apartments. We consider the dog's specific needs 
              and energy levels when matching them with potential homes, regardless of home size.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-2">What if the adoption doesn't work out?</h3>
            <p className="text-lg">
              We have a 14-day trial period. If for any reason the match isn't working out, 
              you can return the dog and either receive a refund or try another match. We always 
              want what's best for both the dogs and the adopters.
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
