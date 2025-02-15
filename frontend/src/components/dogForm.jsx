import React, { useState } from 'react';

const DogForm = () => {
  // Simplified form state
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    color: '',
    picture: null, // This will store the image URL returned by the backend after upload
  });

  // Handle input changes and file upload if needed
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // If handling file upload for the "picture" field
    if (name === 'picture' && files && files[0]) {
      const data = new FormData();
      data.append('image', files[0]);

      // Retrieve the JWT token from localStorage
      const token = localStorage.getItem('token');

      fetch('http://localhost:5000/upload', { // Adjust URL as needed
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`, // Attach the JWT token here
        },
        body: data,
      })
        .then((res) => res.json())
        .then((result) => {
          // Save the image URL returned from the backend in formData
          setFormData((prev) => ({ ...prev, picture: result.url }));
        })
        .catch((err) => console.error('Upload error:', err));
    } else {
      // Handle text and number inputs
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to submit the form?')) {
      // Retrieve the JWT token from localStorage
      const token = localStorage.getItem('token');

      fetch('http://localhost:5000/dogs', { // Adjust URL as needed
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Attach the JWT token here
        },
        body: JSON.stringify(formData),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('Dog added successfully:', data);
          // Optionally, clear the form here if desired
        })
        .catch((err) => console.error('Error adding dog:', err));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="name">Name:</label>
      <input 
        type="text" 
        id="name" 
        name="name" 
        value={formData.name} 
        onChange={handleChange} 
        required 
      />
      <br />

      <label htmlFor="age">Age:</label>
      <input 
        type="number" 
        id="age" 
        name="age" 
        value={formData.age} 
        onChange={handleChange} 
        required 
      />
      <br />

      <label htmlFor="color">Color:</label>
      <input 
        type="text" 
        id="color" 
        name="color" 
        value={formData.color} 
        onChange={handleChange} 
        required 
      />
      <br />

      <label htmlFor="picture">Picture:</label>
      <input 
        type="file" 
        id="picture" 
        name="picture" 
        accept="image/*" 
        onChange={handleChange} 
      />
      <br />

      <button type="submit">Submit</button>
    </form>
  );
};

export default DogForm;