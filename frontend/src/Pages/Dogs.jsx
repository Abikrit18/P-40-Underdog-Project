// src/DogList.js
import React, { useState, useEffect } from 'react';
import DogCard from './DogCard';
import { Box, Button, TextField, CircularProgress, Container } from '@mui/material';
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/dogs', newDog);
      await fetchDogs(); // Refresh the list
      setNewDog({ name: '', age: '', color: '', picture: '' });
    } catch (error) {
      console.error('Error adding dog:', error);
    }
  };

  // Handle delete (you'll need to implement the backend endpoint)
  const handleDelete = async (dog) => {
    try {
      // await axios.delete(`http://localhost:3000/dogs/${dog._id}`);
      await fetchDogs();
    } catch (error) {
      console.error('Error deleting dog:', error);
    }
  };

  // Handle edit (you'll need to implement the backend endpoint)
  const handleEdit = async (dog) => {
    console.log('Edit dog:', dog);
    // Implementation for edit would go here
  };

  if (loading) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      {/* Add Dog Form */}
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
        <TextField
          label="Image URL"
          value={newDog.picture}
          onChange={(e) => setNewDog({ ...newDog, picture: e.target.value })}
          fullWidth
          margin="normal"
          required
        />
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>
          Add Dog
        </Button>
      </Box>

      {/* Dogs Grid */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {dogs.map((dog) => (
          <DogCard
            key={dog._id}
            dog={dog}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
      </Box>
    </Container>
  );
};

export default DogList;