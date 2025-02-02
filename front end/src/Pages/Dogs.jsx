import React, { useEffect, useState } from "react";

const Dogs = () => {
  const [dogs, setDogs] = useState([]);
  const [newDog, setNewDog] = useState({ name: "", age: "", color: "" });
  const [loading, setLoading] = useState(false); // Loading state for data fetching
  const [error, setError] = useState(null); // Error state for displaying error messages
  const [formError, setFormError] = useState(""); // Form error state for validation

  // Fetch Dogs from Backend
  const fetchData = async () => {
    setLoading(true); // Set loading to true before fetching
    try {
      const response = await fetch("http://localhost:3000/dogs");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const jsonData = await response.json();
      setDogs(jsonData);
      setError(null); // Reset error if fetch is successful
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch dogs. Please try again later.");
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  };

  useEffect(() => {
    fetchData(); // Initial data fetch
  }, []);

  // Handle Input Change
  const handleChange = (e) => {
    setNewDog({ ...newDog, [e.target.name]: e.target.value });
  };

  // Add New Dog
  const addDog = async () => {
    if (!newDog.name || !newDog.age || !newDog.color) {
      setFormError("All fields are required.");
      return;
    }

    setFormError(""); // Clear form error if form is valid

    try {
      console.log("Adding new dog:", newDog); // Log the dog object being sent
      const response = await fetch("http://localhost:3000/dogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDog),
      });

      if (!response.ok) {
        const errorText = await response.text(); // Get the error response text
        throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
      }

      // Fetch updated list of dogs after successfully adding a new dog
      const addedDog = await response.json();
      setDogs((prevDogs) => [...prevDogs, addedDog]);
      setNewDog({ name: "", age: "", color: "" }); // Clear form fields

      // Re-fetch the dog data to ensure the frontend is synchronized with the backend
      fetchData();
    } catch (error) {
      console.error("Error adding dog:", error);
      setError("Failed to add dog. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
          Available Dogs for Adoption
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Here you can find a list of all available dogs for adoption.
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Form to Add New Dog */}
        <div className="bg-blue-100 p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Add a New Dog</h2>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              name="name"
              placeholder="Dog Name"
              value={newDog.name}
              onChange={handleChange}
              className="p-2 border rounded-lg w-full"
            />
            <input
              type="number"
              name="age"
              placeholder="Dog Age"
              value={newDog.age}
              onChange={handleChange}
              className="p-2 border rounded-lg w-full"
            />
            <input
              type="text"
              name="color"
              placeholder="Dog Color"
              value={newDog.color}
              onChange={handleChange}
              className="p-2 border rounded-lg w-full"
            />
            <button
              onClick={addDog}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Add Dog
            </button>
          </div>
          {formError && <p className="text-red-600 mt-2">{formError}</p>}
        </div>

        {/* Display List of Dogs */}
        {loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : dogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dogs.map((dog) => (
              <div
                key={dog._id}  // Use unique id if available
                className="bg-white p-4 rounded-lg shadow-md border border-gray-300"
              >
                <h3 className="text-lg font-semibold text-gray-800">{dog.name}</h3>
                <p className="text-gray-600">
                  <strong>Age:</strong> {dog.age} years
                </p>
                <p className="text-gray-600">
                  <strong>Color:</strong> {dog.color}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600">No dogs available.</p>
        )}
      </div>
    </div>
  );
};

export default Dogs;
