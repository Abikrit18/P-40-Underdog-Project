import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <div className="w-full bg-gray-200 relative">
        <div className="relative w-full h-[500px] overflow-hidden">
          <img 
            src="https://plus.unsplash.com/premium_photo-1669769591345-b1dc7f2d2bde?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8c2x1bWRvZ3xlbnwwfHwwfHx8MA%3D%3D"
            alt="Dogs running in park" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Welcome to UnderDogs</h1>
            <p className="text-xl md:text-2xl text-white mb-8 max-w-3xl">
              Helping rescue dogs find joy, exercise, and forever homes.
            </p>
            <Link to="/dogs" className="bg-orange-700 hover:bg-orange-800 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform duration-300 hover:scale-105 text-decoration-none">
              Meet Our Dogs
            </Link>
          </div>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
        <p className="text-lg mb-6">
          We believe that all dogs deserve an opportunity to exercise and experience the world around them. Many dogs stay stuck in kennels for months and even years at a time. This is where you come in to help. Simply sign up, fill out a waiver, and start walking dogs!
        </p>
      </div>

      {/* Feature Cards */}
      <div className="w-full bg-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How You Can Help</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Walk Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-2">
              <img 
                src="https://images.unsplash.com/photo-1504826260979-242151ee45b7?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8ZG9nJTIwd2l0aCUyMGRvbmF0ZSUyMHNpZ258ZW58MHx8MHx8fDA%3D" 
                alt="Walking dogs" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Walk a Dog</h3>
                <p className="text-gray-700 mb-4">
                  Take a shelter dog for a walk. Exercise is crucial for their physical and mental well-being.
                </p>
                <Link to="/walk" className="text-orange-700 font-semibold hover:text-orange-900 text-decoration-none">
                  Schedule a Walk →
                </Link>
              </div>
            </div>

            {/* Adoption Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-2">
              <img 
                src="https://plus.unsplash.com/premium_photo-1661337105502-c60ec08d5d09?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8YWRvcHRpb24lMjBkb2d8ZW58MHx8MHx8fDA%3D" 
                alt="Dog adoption" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Adopt a Friend</h3>
                <p className="text-gray-700 mb-4">
                  Give a deserving dog a forever home. Our adoption process is designed to find perfect matches.
                </p>
                <Link to="/adoption" className="text-orange-700 font-semibold hover:text-orange-900 text-decoration-none">
                  Learn About Adoption →
                </Link>
              </div>
            </div>

            {/* Donation Card */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-2">
              <img 
                src="https://thumbs.dreamstime.com/b/portrait-cute-dog-letter-board-inscription-need-your-help-lying-floor-funny-219207465.jpg" 
                alt="Supporting dogs" 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Donate</h3>
                <p className="text-gray-700 mb-4">
                  Your contribution helps provide food, shelter, medical care, and more for our rescue dogs.
                </p>
                <Link to="/donation" className="text-orange-700 font-semibold hover:text-orange-900 text-decoration-none">
                  Make a Donation →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Volunteers Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Testimonial 1 */}
          <div className="bg-gray-50 p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full overflow-hidden mr-4">
                <img 
                  src="https://randomuser.me/api/portraits/women/44.jpg" 
                  alt="Volunteer" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold">Sarah Johnson</h4>
                <p className="text-sm text-gray-600">Regular Walker</p>
              </div>
            </div>
            <p className="italic text-gray-700">
              "Walking these dogs has become the highlight of my week. Seeing how excited they get for their walks is so rewarding!"
            </p>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-gray-50 p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full overflow-hidden mr-4">
                <img 
                  src="https://randomuser.me/api/portraits/men/32.jpg" 
                  alt="Volunteer" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold">Michael Chen</h4>
                <p className="text-sm text-gray-600">Adopter</p>
              </div>
            </div>
            <p className="italic text-gray-700">
              "After walking Max for several weeks, I couldn't imagine life without him. The adoption process was smooth, and now he's part of our family!"
            </p>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-gray-50 p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full overflow-hidden mr-4">
                <img 
                  src="https://randomuser.me/api/portraits/women/68.jpg" 
                  alt="Volunteer" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold">Emma Rodriguez</h4>
                <p className="text-sm text-gray-600">Marshall</p>
              </div>
            </div>
            <p className="italic text-gray-700">
              "Being a Marshall at UnderDogs gives me purpose. I get to see the positive impact regular walks have on these dogs' well-being and adoptability."
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full bg-red-900 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl text-white mb-8">
            Join our community of dog lovers and help give these deserving dogs the attention they need.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/login" className="bg-white text-red-900 hover:bg-gray-200 font-bold py-3 px-8 rounded-full text-lg text-decoration-none">
              Sign Up Today
            </Link>
            <Link to="/walk" className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold py-3 px-8 rounded-full text-lg text-decoration-none">
              Schedule a Walk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
