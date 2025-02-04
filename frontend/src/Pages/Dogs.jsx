// src/DogList.js
import React, { useState, useEffect } from 'react';
import DogCard from '../components/dogCard';
import { Box, Button, TextField, CircularProgress, Container, Pagination } from '@mui/material';
import axios from 'axios';

const DogList = () => {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDog, setNewDog] = useState({
    name: '',
    age: '',
    color: '',
    picture: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [page, setPage] = useState(1);
  const dogsPerPage = 3;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await axios.post('http://localhost:3000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data.success) {
        setNewDog({ ...newDog, picture: response.data.url });
      } else {
        console.error('Error uploading image:', response.data.message);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };
  
  // Fetch dogs from backend
  const fetchDogs = async () => {
    try {
      const response = await axios.get('http://localhost:3000/dogs');
      setDogs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dogs:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDogs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/dogs', newDog);
      setDogs([...dogs, response.data]);
      setNewDog({ name: '', age: '', color: '', picture: '' });
      setSelectedFile(null);
    } catch (error) {
      console.error('Error adding dog:', error);
    }
  };

  const handleDelete = async (dog) => {
    try {
      await axios.delete(`http://localhost:3000/dogs/${dog._id}`);
      setDogs(dogs.filter((d) => d._id !== dog._id));
    } catch (error) {
      console.error('Error deleting dog:', error);
    }
  };

  const handleEdit = async (dog) => {
    const newName = prompt("Enter new name for the dog:", dog.name);
    const newAge = prompt("Enter new age for the dog:", dog.age);
    const newColor = prompt("Enter new color for the dog:", dog.color);
    if (newName && newAge && newColor) {
      try {
        await axios.put(`http://localhost:3000/dogs/${dog._id}`, { name: newName, age: newAge, color: newColor });
        setDogs(dogs.map(d => d._id === dog._id ? { ...d, name: newName, age: newAge, color: newColor } : d));
      } catch (error) {
        console.error('Error updating dog:', error);
      }
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const indexOfLastDog = page * dogsPerPage;
  const indexOfFirstDog = indexOfLastDog - dogsPerPage;
  const currentDogs = dogs.slice(indexOfFirstDog, indexOfLastDog);

  if (loading) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4, mb: 4, p: 2, border: '1px solid #ddd' }}>
        <TextField
          label="Name"
          value={newDog.name}
          onChange={(e) => setNewDog({ ...newDog, name: e.target.value })}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Age"
          type="number"
          value={newDog.age}
          onChange={(e) => setNewDog({ ...newDog, age: e.target.value })}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Color"
          value={newDog.color}
          onChange={(e) => setNewDog({ ...newDog, color: e.target.value })}
          fullWidth
          margin="normal"
          required
        />
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            label="Image URL"
            value={newDog.picture}
            onChange={(e) => setNewDog({ ...newDog, picture: e.target.value })}
            fullWidth
            margin="normal"
          />
          <input type="file" onChange={handleImageChange} />
          <Button onClick={handleImageUpload} variant="contained">Upload</Button>
        </Box>
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>
          Add Dog
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
        {currentDogs.map((dog) => (
          <DogCard
            key={dog._id}
            dog={dog}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination
          count={Math.ceil(dogs.length / dogsPerPage)}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Container>
  );
};

export default DogList;