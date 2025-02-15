import React, { useState, useEffect } from 'react';
import DogCard from '../components/dogCard';
import { Box, Button, TextField, CircularProgress, Container, Pagination } from '@mui/material';
import axios from 'axios';
import { decodeToken } from "react-jwt";

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
  const [uploadLoading, setUploadLoading] = useState(false);
  const [page, setPage] = useState(1);
  const dogsPerPage = 3;
  const [isAdmin, setIsAdmin] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      handleImageUpload(file); // Automatically upload when file is selected
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploadLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    console.log(localStorage.getItem('token'));
    try {
      const response = await axios.post('http://localhost:3000/api/upload', formData, {
        headers: {


          Authorization: `Bearer ${localStorage.getItem('token')}`,

        },
      });
      setNewDog({ ...newDog, picture: response.data.url });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const fetchDogs = async () => {
    try {
      const response = await axios.get('http://localhost:3000/dogs', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDogs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dogs:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded  = decodeToken(token);
        setIsAdmin(decoded.role === 'admin');
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
    fetchDogs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDog.picture) {
      alert('Please upload an image first');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3000/dogs', newDog,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          }
        });
      setDogs([...dogs, response.data]);
      setNewDog({ name: '', age: '', color: '', picture: '' });
    } catch (error) {
      console.error('Error adding dog:', error);
      alert('Failed to add dog. Please try again.');
    }
  };

  const handleDelete = async (dog) => {
    try {
      await axios.delete(`http://localhost:3000/dogs/${dog._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDogs(prevDogs => prevDogs.filter((d) => d._id !== dog._id));
    } catch (error) {
      console.error('Error deleting dog:', error);
      alert('Failed to delete dog. Please try again.');
    }
  };

  const handleEdit = async (updatedDog) => {
    try {
      await axios.put(`http://localhost:3000/dogs/${updatedDog._id}`, updatedDog, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDogs(dogs.map(d => d._id === updatedDog._id ? updatedDog : d));
    } catch (error) {
      console.error('Error updating dog:', error);
      alert('Failed to update dog. Please try again.');
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
      {isAdmin && (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4, mb: 4, p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
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
          <Box sx={{ mt: 2, mb: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="image-upload"
              type="file"
              onChange={handleImageChange}
            />
            <label htmlFor="image-upload">
              <Button variant="contained" component="span" disabled={uploadLoading}>
                {uploadLoading ? 'Uploading...' : 'Choose Image'}
              </Button>
            </label>
            {uploadLoading && <CircularProgress size={24} sx={{ ml: 2 }} />}
            {newDog.picture && (
              <Box sx={{ mt: 2 }}>
                <img src={newDog.picture} alt="Preview" style={{ maxWidth: '200px', borderRadius: '4px' }} />
              </Box>
            )}
          </Box>
          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 2 }}
            disabled={!newDog.picture || uploadLoading}
          >
            Add Dog
          </Button>
        </Box>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
        {currentDogs.map((dog) => (
          <DogCard
            key={dog._id}
            dog={dog}
            onDelete={isAdmin ? handleDelete : null}
            onEdit={isAdmin ? handleEdit : null}
            isAdmin={isAdmin}
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