import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import formatTimeForDisplay from '../components/Calendar/formatTime';

const Home = () => {
  const [user, setUser] = useState(null);
  const [scheduledWalks, setScheduledWalks] = useState([]);
  const [timelineVisible, setTimelineVisible] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        axios.get(`https://p-40-underdog-project-backend.onrender.com/users/profile/${decoded.id}`)
          .then((res) => {
            setUser(res.data);
            setScheduledWalks(res.data.walks || []);
          })
          .catch((err) => console.error("Error fetching user profile:", err));
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
  }, []);

  // Toggle timeline visibility
  const toggleTimeline = () => {
    setTimelineVisible(!timelineVisible);
  };

  // Sort walks by date and time for the timeline
  const sortedWalks = [...scheduledWalks].sort((a, b) => {
    // Check if objects have the required properties
    if (!a || !b) return 0;
    
    // First compare dates
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    
    if (dateA > dateB) return 1;
    if (dateA < dateB) return -1;
    
    // If dates are equal, compare times (safely)
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
    }
    
    // Handle cases when one or both times are missing
    if (!a.time) return 1; // Push items without time to the end
    if (!b.time) return -1;
    
    return 0;
  });

  return (
    <div className="flex flex-col md:flex-row">
      {/* Main Content */}
      <div className={`flex-1 flex flex-col items-center ${user && user.role !== 'admin' && scheduledWalks.length > 0 && timelineVisible ? 'md:pr-[320px]' : ''} transition-all duration-300`}>
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
        <div className="w-full bg-gradient-to-b from-white to-orange-50 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left side - Image collage */}
              <div className="relative h-[400px] hidden md:block">
                <div className="absolute top-0 left-0 w-2/3 h-2/3 rounded-lg overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <img 
                    src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&auto=format&fit=crop" 
                    alt="Happy dog" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute bottom-0 right-0 w-2/3 h-2/3 rounded-lg overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <img 
                    src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&auto=format&fit=crop" 
                    alt="Dog with volunteer" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-orange-700 rounded-full opacity-10 blur-3xl"></div>
              </div>

              {/* Right side - Mission content */}
              <div className="space-y-6">
                <div className="inline-block">
                  <h2 className="text-4xl font-bold text-gray-900 mb-2">Our Mission</h2>
                  <div className="h-1 w-20 bg-orange-700 rounded-full"></div>
                </div>
                
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  We believe that all dogs deserve an opportunity to experience joy, love, and the world beyond their kennels. Many dogs spend months, even years, confined to shelter spaces – but you can change that.
                </p>

                <div className="space-y-4">
                  {/* Mission points */}
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Make a Difference</h3>
                      <p className="text-gray-600">Every walk brings joy and essential exercise to shelter dogs.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Simple Process</h3>
                      <p className="text-gray-600">Sign up, complete a waiver, and start making a difference today.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Link 
                    to="/walk" 
                    className="inline-flex items-center px-6 py-3 bg-orange-700 hover:bg-orange-800 text-white font-semibold rounded-full transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                  >
                    Start Walking Dogs
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
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
        <div className="w-full bg-red-900 py-12 mb-16 mx-4 md:mx-8 rounded-xl"> {/* Added mx-4 md:mx-8 and rounded-xl */}
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
      
      {/* Toggle button for timeline - Only show if user has walks and is not admin */}
      {user && user.role !== 'admin' && scheduledWalks.length > 0 && (
        <button 
          onClick={toggleTimeline}
          className="hidden md:flex fixed right-[300px] top-1/2 -translate-y-1/2 z-20 items-center justify-center w-8 h-20 bg-orange-700 hover:bg-orange-800 text-white rounded-l-lg shadow-lg transform transition-all duration-300"
          style={{ right: timelineVisible ? '300px' : '0' }}
          aria-label={timelineVisible ? "Hide upcoming walks" : "Show upcoming walks"}
        >
          {timelineVisible ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      )}
      
      {/* Upcoming Walks Timeline - Fixed to the right side */}
      {user && user.role !== 'admin' && scheduledWalks.length > 0 && (
        <div 
          className={`hidden md:block fixed right-0 top-0 bottom-0 w-[300px] bg-orange-50 p-4 overflow-y-auto shadow-lg z-10 transform transition-transform duration-300 ease-in-out ${
            timelineVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="sticky top-0 bg-orange-50 pb-2 pt-2 z-20">
            <h2 className="text-xl font-bold text-red-900 border-b-2 border-orange-200 pb-2">Your Upcoming Walks</h2>
          </div>
          
          <div className="mt-4 relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-orange-400"></div>
            
            {/* Timeline Events */}
            <div className="space-y-6">
              {sortedWalks.map((walk, index) => {
                // Format the date for better display
                const walkDate = new Date(walk.date);
                const formattedDate = walkDate.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                });
                
                return (
                  <div key={walk._id} className="relative pl-8 group">
                    {/* Timeline Node */}
                    <div className="absolute left-[0.5px] top-1.5 w-7 h-7 rounded-full bg-white border-4 border-orange-700 z-10 transform transition-transform duration-300 group-hover:scale-110"></div>
                    
                    {/* Timeline Content */}
                    <div className="bg-white rounded-lg shadow-md p-3 border-l-4 border-orange-700 transform transition-all duration-300 group-hover:-translate-y-1">
                      <p className="font-bold text-red-900">{formattedDate}</p>
                      <p className="text-gray-800 font-medium">{formatTimeForDisplay(walk.time)}</p>
                      <div className="mt-2 text-sm">
                        <p className="text-gray-700">
                          <span className="font-semibold">Marshall:</span> {walk.marshall?.firstName || "Unknown"}
                        </p>
                        {walk.userid && (
                          <p className="text-gray-700">
                            <span className="font-semibold">Scheduled By:</span> {walk.userid?.firstName || "You"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Only show Manage Walks button for Marshall role */}
          {user && user.role === 'Marshall' && (
            <Link to="/profile" className="mt-4 block text-center bg-orange-700 hover:bg-orange-800 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
              Manage Your Walks
            </Link>
          )}
        </div>
      )}
      
      {/* Mobile version of upcoming walks */}
      {user && user.role !== 'admin' && scheduledWalks.length > 0 && (
        <div className="md:hidden w-full bg-orange-50 p-4 mt-6">
          <h2 className="text-xl font-bold text-red-900 border-b-2 border-orange-200 pb-2 mb-4">Your Upcoming Walks</h2>
          <div className="space-y-4">
            {sortedWalks.slice(0, 3).map((walk) => (
              <div key={walk._id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-700">
                <p className="font-bold text-red-900">{new Date(walk.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                <p className="text-gray-800 font-medium">{walk.time}</p>
                <p className="text-gray-700 text-sm">
                  <span className="font-semibold">Marshall:</span> {walk.marshall?.firstName || "Unknown"}
                </p>
              </div>
            ))}
            {sortedWalks.length > 3 && (
              <p className="text-center text-red-900 font-medium">
                +{sortedWalks.length - 3} more walks
              </p>
            )}
            {/* Only show View All Walks button for Marshall role */}
            {user && user.role === 'Marshall' && (
              <Link to="/profile" className="block text-center bg-orange-700 hover:bg-orange-800 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                View All Walks
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
