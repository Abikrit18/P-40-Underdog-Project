import React, { useState } from "react";
import { CircularProgress } from '@mui/material';
import axios from 'axios';

const DogCard = ({ dog, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDog, setEditedDog] = useState(dog);
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedDog({ ...editedDog, [name]: value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await axios.post('http://localhost:3000/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setEditedDog({ ...editedDog, picture: response.data.url });
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
      } finally {
        setUploadLoading(false);
      }
    }
  };

  const handleEditSubmit = () => {
    onEdit(editedDog);
    setIsEditing(false);
  };

  return (
    <div className="max-w-xs rounded overflow-hidden shadow-lg m-4 bg-white">
      <div className="relative h-48">
        {uploadLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <CircularProgress />
          </div>
        ) : (
          <img 
            className="w-full h-full object-cover" 
            src={isEditing ? editedDog.picture : dog.picture} 
            alt={dog.name} 
          />
        )}
      </div>
      <div className="px-6 py-4">
        {isEditing ? (
          <>
            <input
              type="text"
              name="name"
              value={editedDog.name}
              onChange={handleEditChange}
              className="block w-full mb-2 p-2 border rounded"
              placeholder="Name"
            />
            <input
              type="number"
              name="age"
              value={editedDog.age}
              onChange={handleEditChange}
              className="block w-full mb-2 p-2 border rounded"
              placeholder="Age"
            />
            <input
              type="text"
              name="color"
              value={editedDog.color}
              onChange={handleEditChange}
              className="block w-full mb-2 p-2 border rounded"
              placeholder="Color"
            />
            <div className="mb-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full p-2 border rounded"
                disabled={uploadLoading}
              />
            </div>
            <button
              onClick={handleEditSubmit}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              disabled={uploadLoading}
            >
              Save
            </button>
          </>
        ) : (
          <>
            <div className="font-bold text-xl mb-2">{dog.name}</div>
            <p className="text-gray-700 text-base">Age: {dog.age} years</p>
            <p className="text-gray-700 text-base">Color: {dog.color}</p>
          </>
        )}
      </div>
      <div className="px-6 pt-4 pb-2 flex justify-between">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mx-2"
          disabled={uploadLoading}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
        <button
          onClick={() => onDelete(dog)}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mx-2"
          disabled={uploadLoading}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default DogCard;