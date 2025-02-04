import React, { useState } from "react";

const DogCard = ({ dog, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDog, setEditedDog] = useState(dog);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedDog({ ...editedDog, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedDog({ ...editedDog, picture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = () => {
    onEdit(editedDog);
    setIsEditing(false);
  };

  return (
    <div className="max-w-xs rounded overflow-hidden shadow-lg m-4 bg-white">
      {isEditing ? (
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full mb-2 p-2 border rounded"
        />
      ) : (
        <img className="w-full h-48 object-cover" src={dog.picture} alt={dog.name} />
      )}
      <div className="px-6 py-4">
        {isEditing ? (
          <>
            <input
              type="text"
              name="name"
              value={editedDog.name}
              onChange={handleEditChange}
              className="block w-full mb-2 p-2 border rounded"
            />
            <input
              type="number"
              name="age"
              value={editedDog.age}
              onChange={handleEditChange}
              className="block w-full mb-2 p-2 border rounded"
            />
            <input
              type="text"
              name="color"
              value={editedDog.color}
              onChange={handleEditChange}
              className="block w-full mb-2 p-2 border rounded"
            />
            <button
              onClick={handleEditSubmit}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
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
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(dog)}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mx-2"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default DogCard;