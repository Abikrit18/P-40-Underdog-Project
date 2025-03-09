import React, { useState, useEffect } from 'react';
import DogCard from '../components/dogCard';
import { Box, Button, TextField, CircularProgress, Container, Pagination } from '@mui/material';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DogList = () => {
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
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


  const token = localStorage.getItem('token');


  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setRole(decodedToken.role);

        console.log(role); // For debugging
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
    }
  }, [token]);
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
      toast.error('Failed to upload image. Please try again.', {
        position: "top-center",
        autoClose: 3000
      });
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
    fetchDogs();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDog.picture) {
      toast.warning('Please upload an image first', {
        position: "top-center",
        autoClose: 3000
      });
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
      toast.success('Dog added successfully!', {
        position: "top-center",
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error adding dog:', error);
      toast.error('Failed to add dog. Please try again.', {
        position: "top-center",
        autoClose: 3000
      });
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
      toast.success('Dog deleted successfully!', {
        position: "top-center",
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error deleting dog:', error);
      toast.error('Failed to delete dog. Please try again.', {
        position: "top-center",
        autoClose: 3000
      });
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
      toast.success('Dog updated successfully!', {
        position: "top-center",
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error updating dog:', error);
      toast.error('Failed to update dog. Please try again.', {
        position: "top-center",
        autoClose: 3000
      });
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
      <ToastContainer />
      {console.log(role)}
      {role === "admin" && (<Box component="form" onSubmit={handleSubmit} sx={{ mt: 4, mb: 4, p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
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
      </Box>)}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
        {currentDogs.map((dog) => (
          <DogCard
            key={dog._id}
            dog={dog}
            onDelete={handleDelete}
            onEdit={handleEdit}
            role={role}
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