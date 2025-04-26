import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaDog, FaUser, FaEnvelope, FaPhone, FaHome, FaBook, FaHeart, FaPaw } from "react-icons/fa";

const Application = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    experience: "",
    reason: "",
    selectedDog: ""
  });
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to access the adoption application.");
      navigate("/login");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:3000/dogs")
      .then(res => res.json())
      .then(data => {
        setDogs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching dogs:", err);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
 
    try {
      const response = await fetch("http://localhost:3000/api/email/adoption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
 
      if (response.ok) {
        alert("Application submitted and email sent!");
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          address: "",
          experience: "",
          reason: "",
          selectedDog: ""
        });
      } else {
        alert("Failed to submit application. Please try again.");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  // Map of field names to their icons
  const fieldIcons = {
    fullName: <FaUser className="text-orange-500" />,
    email: <FaEnvelope className="text-orange-500" />,
    phone: <FaPhone className="text-orange-500" />,
    address: <FaHome className="text-orange-500" />,
    selectedDog: <FaDog className="text-orange-500" />,
    experience: <FaBook className="text-orange-500" />,
    reason: <FaHeart className="text-orange-500" />
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 to-red-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Decorative elements from Login.jsx */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-200 rounded-full filter blur-3xl opacity-40"></div>
      <div className="absolute top-1/2 right-10 w-60 h-60 bg-red-200 rounded-full filter blur-3xl opacity-40"></div>

      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden relative z-10">
        <div className="bg-red-900 py-6 px-8">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <FaPaw className="text-white text-3xl" />
            <h1 className="text-3xl font-bold text-white">Adoption Application</h1>
          </div>
          <p className="text-center text-orange-100">
            Thank you for your interest in adopting one of our amazing dogs!
          </p>
        </div>
        
        <div className="p-8">
          <div className="mb-8 text-center">
            <p className="text-gray-600">
              Please fill out this application so we can find the perfect match for you and your future furry friend.
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["fullName", "email", "phone", "address"].map((field) => (
                  <div key={field} className="relative">
                    <label className="block text-sm font-medium text-gray-700 capitalize mb-2 flex items-center">
                      {fieldIcons[field]}
                      <span className="ml-2">{field.replace(/([A-Z])/g, " $1")}</span>
                    </label>
                    <input
                      type={field === "email" ? "email" : "text"}
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      required
                      className="block w-full border border-gray-300 rounded-lg shadow-sm px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder={`Enter your ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  {fieldIcons.selectedDog}
                  <span className="ml-2">Which dog would you like to adopt?</span>
                </label>
                <div className="relative">
                  <select
                    name="selectedDog"
                    value={formData.selectedDog}
                    onChange={handleChange}
                    required
                    className="block w-full border border-gray-300 rounded-lg shadow-sm px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none transition-colors bg-white"
                  >
                    <option value="">Select a dog</option>
                    {dogs.map((dog) => (
                      <option key={dog._id} value={dog.name}>{dog.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  {fieldIcons.experience}
                  <span className="ml-2">Experience with Pets</span>
                </label>
                <textarea
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  rows={4}
                  className="block w-full border border-gray-300 rounded-lg shadow-sm px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="Tell us about your experience with pets..."
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  {fieldIcons.reason}
                  <span className="ml-2">Why do you want to adopt?</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows={4}
                  className="block w-full border border-gray-300 rounded-lg shadow-sm px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="Share why you'd like to adopt a dog from us..."
                  required
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-red-900 text-white py-3 px-6 rounded-lg hover:bg-orange-800 transition duration-200 shadow-md flex items-center justify-center"
                >
                  <FaPaw className="mr-2" />
                  Submit Application
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Application;