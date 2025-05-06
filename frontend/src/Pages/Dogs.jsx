import React, { useState, useEffect } from 'react';
import DogCard from '../components/dogCard';
import {
  Box,
  Button,
  TextField,
  CircularProgress,
  Container,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Chip,
  IconButton,
  InputAdornment,
  Divider,
  Paper
} from '@mui/material';
import {
  Sort as SortIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";

const DogList = () => {
  const [dogs, setDogs] = useState([]);
  const [filteredDogs, setFilteredDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [newDog, setNewDog] = useState({
    name: '',
    age: '',
    color: '',
    picture: '',
    additionalImages: []
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [page, setPage] = useState(1);
  const dogsPerPage = 9; // Updated to 9 dogs per page
  const [favorites, setFavorites] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    name: '',
    minAge: '',
    maxAge: '',
    color: ''
  });

  // Sort state
  const [sortOption, setSortOption] = useState('none');

  const token = localStorage.getItem('token');

  useEffect(() => {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favoriteDogs');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setRole(decodedToken.role);
      } catch (error) {
        console.error('Failed to decode token:', error);
      }
    }
  }, [token]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      handleImageUpload(file, false); // false indicates it's not an additional image
    }
  };

  const handleAdditionalImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file, true); // true indicates it's an additional image
    }
  };

  const handleImageUpload = async (file, isAdditional = false) => {
    if (!file) return;
    setUploadLoading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('http://localhost:3000/api/upload', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Log the Cloudinary response to debug
      console.log('Cloudinary upload response in Dogs.jsx:', response.data);

      if (isAdditional) {
        // Add to additional images array
        const currentAdditionalImages = newDog.additionalImages || [];
        setNewDog({
          ...newDog,
          additionalImages: [...currentAdditionalImages, response.data.url]
        });
        toast.success('Additional image uploaded!', {
          position: "top-center",
          autoClose: 2000
        });
      } else {
        // Set as main image
        setNewDog({ ...newDog, picture: response.data.url });
      }
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

      // Log the response to see what we're getting from the server
      console.log('Dogs from server:', response.data);

      // Use the actual data from the server without modifications
      const dogsData = response.data;

      setDogs(dogsData);
      setFilteredDogs(dogsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dogs:', error);
      setLoading(false);
      toast.error('Error loading dogs. Please try again later.', {
        position: "top-center",
        autoClose: 3000
      });
    }
  };

  useEffect(() => {
    fetchDogs();
  }, []);

  // Apply filters and sorting whenever dogs array or filter/sort options change
  useEffect(() => {
    let result = [...dogs];

    // Apply filters
    if (filters.name) {
      result = result.filter(dog =>
        dog.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.minAge) {
      result = result.filter(dog => dog.age >= Number(filters.minAge));
    }

    if (filters.maxAge) {
      result = result.filter(dog => dog.age <= Number(filters.maxAge));
    }

    if (filters.color) {
      result = result.filter(dog =>
        dog.color.toLowerCase() === filters.color.toLowerCase()
      );
    }

    // Apply sorting
    switch(sortOption) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'age-asc':
        result.sort((a, b) => a.age - b.age);
        break;
      case 'age-desc':
        result.sort((a, b) => b.age - a.age);
        break;
      default:
        // No sorting
    }

    setFilteredDogs(result);
    setPage(1); // Reset to first page when filters change
  }, [dogs, filters, sortOption]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      name: '',
      minAge: '',
      maxAge: '',
      color: ''
    });
    setSortOption('none');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDog.picture) {
      toast.warning('Please upload a main image first', {
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
      setDogs(prev => [response.data, ...prev]);
      setNewDog({ name: '', age: '', color: '', picture: '', additionalImages: [] });
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

      // Also remove from favorites if present
      if (favorites.includes(dog._id)) {
        handleToggleFavorite(dog);
      }

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

  const handleToggleFavorite = (dog) => {
    const dogId = dog._id;
    let newFavorites;

    if (favorites.includes(dogId)) {
      // Remove from favorites
      newFavorites = favorites.filter(id => id !== dogId);
      toast.info(`${dog.name} removed from favorites`, {
        position: "top-center",
        autoClose: 2000
      });
    } else {
      // Add to favorites
      newFavorites = [...favorites, dogId];
      toast.success(`${dog.name} added to favorites!`, {
        position: "top-center",
        autoClose: 2000
      });
    }

    setFavorites(newFavorites);
    localStorage.setItem('favoriteDogs', JSON.stringify(newFavorites));
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    // Smooth scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveAdditionalImage = (index) => {
    const updatedImages = [...newDog.additionalImages];
    updatedImages.splice(index, 1);
    setNewDog({...newDog, additionalImages: updatedImages});
  };

  // Get unique colors for filter
  const uniqueColors = Array.from(new Set(dogs.map(dog => dog.color)));

  const indexOfLastDog = page * dogsPerPage;
  const indexOfFirstDog = indexOfLastDog - dogsPerPage;
  const currentDogs = filteredDogs.slice(indexOfFirstDog, indexOfLastDog);

  if (loading) {
    return (
      <Container style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ToastContainer />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h3" component="h1" align="center" gutterBottom sx={{
          fontWeight: 'bold',
          color: '#8B4513',
          mb: 4
        }}>
          Our Adoptable Dogs
        </Typography>
      </motion.div>

      {/* Search, filter and sort controls */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search Dogs"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              placeholder="Search by name..."
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ flexGrow: 1 }}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>

              <FormControl variant="outlined" sx={{ minWidth: 150, flexGrow: 1 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  label="Sort By"
                  startAdornment={<SortIcon sx={{ mr: 1 }} />}
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="name-asc">Name (A-Z)</MenuItem>
                  <MenuItem value="name-desc">Name (Z-A)</MenuItem>
                  <MenuItem value="age-asc">Age (Young-Old)</MenuItem>
                  <MenuItem value="age-desc">Age (Old-Young)</MenuItem>
                </Select>
              </FormControl>

              {favorites.length > 0 && (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<FavoriteIcon />}
                  onClick={() => {
                    document.getElementById('favorites-section')?.scrollIntoView({
                      behavior: 'smooth'
                    });
                  }}
                >
                  {favorites.length}
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Expanded filter options */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #eee' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Color</InputLabel>
                    <Select
                      name="color"
                      value={filters.color}
                      onChange={handleFilterChange}
                      label="Color"
                    >
                      <MenuItem value="">Any Color</MenuItem>
                      {uniqueColors.map((color) => (
                        <MenuItem key={color} value={color}>
                          {color}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} md={4}>
                  <TextField
                    fullWidth
                    label="Min Age"
                    name="minAge"
                    type="number"
                    value={filters.minAge}
                    onChange={handleFilterChange}
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>

                <Grid item xs={6} md={4}>
                  <TextField
                    fullWidth
                    label="Max Age"
                    name="maxAge"
                    type="number"
                    value={filters.maxAge}
                    onChange={handleFilterChange}
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="text"
                  onClick={resetFilters}
                  sx={{ mr: 1 }}
                >
                  Reset Filters
                </Button>
              </Box>
            </Box>
          </motion.div>
        )}

        {/* Active filter chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
          {filters.name && (
            <Chip
              label={`Name: ${filters.name}`}
              onDelete={() => setFilters({...filters, name: ''})}
              color="primary"
              size="small"
            />
          )}

          {filters.color && (
            <Chip
              label={`Color: ${filters.color}`}
              onDelete={() => setFilters({...filters, color: ''})}
              color="primary"
              size="small"
            />
          )}

          {filters.minAge && (
            <Chip
              label={`Min Age: ${filters.minAge}`}
              onDelete={() => setFilters({...filters, minAge: ''})}
              color="primary"
              size="small"
            />
          )}

          {filters.maxAge && (
            <Chip
              label={`Max Age: ${filters.maxAge}`}
              onDelete={() => setFilters({...filters, maxAge: ''})}
              color="primary"
              size="small"
            />
          )}

          {sortOption !== 'none' && (
            <Chip
              label={`Sorting: ${sortOption}`}
              onDelete={() => setSortOption('none')}
              color="secondary"
              size="small"
            />
          )}
        </Box>
      </Paper>

      {/* Results count */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredDogs.length} {filteredDogs.length === 1 ? 'dog' : 'dogs'}
        </Typography>
      </Box>

      {/* Admin Add Dog Form */}
      {role === "admin" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>
              Add New Dog
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Name"
                    value={newDog.name}
                    onChange={(e) => setNewDog({ ...newDog, name: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Age"
                    type="number"
                    value={newDog.age}
                    onChange={(e) => setNewDog({ ...newDog, age: e.target.value })}
                    fullWidth
                    required
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Color"
                    value={newDog.color}
                    onChange={(e) => setNewDog({ ...newDog, color: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>Main Image</Divider>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="image-upload"
                      type="file"
                      onChange={handleImageChange}
                    />
                    <label htmlFor="image-upload" style={{ width: '100%' }}>
                      <Button
                        variant="contained"
                        component="span"
                        fullWidth
                        disabled={uploadLoading}
                        startIcon={uploadLoading && <CircularProgress size={20} />}
                      >
                        {uploadLoading ? 'Uploading...' : 'Choose Main Image'}
                      </Button>
                    </label>
                  </Box>

                  {newDog.picture && (
                    <Box sx={{ mt: 2, position: 'relative', display: 'inline-block' }}>
                      <img
                        src={newDog.picture}
                        alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }}
                      />
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="additional-image-upload"
                      type="file"
                      onChange={handleAdditionalImageChange}
                    />
                    <label htmlFor="additional-image-upload" style={{ width: '100%' }}>
                      <Button
                        variant="outlined"
                        component="span"
                        fullWidth
                        disabled={uploadLoading}
                      >
                        Add Additional Image
                      </Button>
                    </label>
                  </Box>

                  {/* Display additional images */}
                  {newDog.additionalImages && newDog.additionalImages.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Additional Images:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {newDog.additionalImages.map((img, index) => (
                          <Box key={index} sx={{ position: 'relative', width: 80, height: 80 }}>
                            <img
                              src={img}
                              alt={`Additional ${index}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <IconButton
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: -10,
                                right: -10,
                                bgcolor: 'error.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'error.dark' },
                                width: 20,
                                height: 20,
                                fontSize: '0.75rem'
                              }}
                              onClick={() => handleRemoveAdditionalImage(index)}
                            >
                              ×
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={!newDog.picture || uploadLoading}
                    sx={{ mt: 2 }}
                  >
                    Add Dog
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </motion.div>
      )}

      {/* No results message */}
      {filteredDogs.length === 0 ? (
        <Box sx={{
          py: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No dogs match your search criteria
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Try adjusting your filters or search term
          </Typography>
          <Button variant="outlined" onClick={resetFilters}>
            Reset All Filters
          </Button>
        </Box>
      ) : (
        <>
          {/* Dog cards grid */}
          <Grid container spacing={3}>
            {currentDogs.map((dog) => (
              <Grid item xs={12} sm={6} md={4} key={dog._id}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <DogCard
                    dog={dog}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    role={role}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={favorites.includes(dog._id)}
                  />
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          <Box sx={{ mt: 6, mb: 4, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.ceil(filteredDogs.length / dogsPerPage)}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>

          {/* Favorites section */}
          {favorites.length > 0 && (
            <div id="favorites-section">
              <Divider sx={{ my: 6 }}>
                <Chip
                  icon={<FavoriteIcon />}
                  label="Your Favorites"
                  color="secondary"
                />
              </Divider>

              <Grid container spacing={3}>
                {dogs
                  .filter(dog => favorites.includes(dog._id))
                  .map((dog) => (
                    <Grid item xs={12} sm={6} md={4} key={`fav-${dog._id}`}>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        <DogCard
                          dog={dog}
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                          role={role}
                          onToggleFavorite={handleToggleFavorite}
                          isFavorite={true}
                        />
                      </motion.div>
                    </Grid>
                  ))
                }
              </Grid>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default DogList;