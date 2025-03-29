import React, { useState } from "react";
import { CircularProgress } from '@mui/material';
import axios from 'axios';
import { motion } from "framer-motion";
import { 
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  Cancel as CancelIcon,
  Save as SaveIcon,
  Pets as PetsIcon
} from '@mui/icons-material';
import { toast } from "react-toastify";

const DogCard = ({ dog, onDelete, onEdit, role, onToggleFavorite, isFavorite }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDog, setEditedDog] = useState({...dog});
  const [uploadLoading, setUploadLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDetails, setShowFullDetails] = useState(false);

  // Ensure we have a valid array of images
  const allImages = [
    dog.picture, 
    ...(dog.additionalImages || [])
  ].filter(img => img && img.trim() !== "");  // Filter out empty/null values

  // Use placeholder only if no valid images exist
  const images = allImages.length > 0 
    ? allImages 
    : ["https://via.placeholder.com/300x200?text=No+Image"];

  // Generate a gradient based on dog color
  const getColorGradient = (color) => {
    switch(color?.toLowerCase()) {
      case 'brown': return 'from-amber-400 to-amber-600';
      case 'black': return 'from-gray-700 to-gray-900';
      case 'white': return 'from-gray-100 to-gray-300';
      case 'golden': return 'from-yellow-300 to-amber-500';
      case 'cream': return 'from-orange-100 to-yellow-200';
      case 'tan': return 'from-yellow-600 to-amber-700';
      case 'red': return 'from-red-400 to-red-600';
      case 'gray': return 'from-gray-400 to-gray-600';
      default: return 'from-orange-400 to-red-500';
    }
  };

  const colorGradient = getColorGradient(dog.color);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedDog({ ...editedDog, [name]: value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
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
      
      setEditedDog({ ...editedDog, picture: response.data.url });
      toast.success('Image uploaded successfully!', {
        position: "top-center",
        autoClose: 2000
      });
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

  const handleAdditionalImageChange = async (e) => {
    const file = e.target.files[0];
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
      
      const currentAdditionalImages = editedDog.additionalImages || [];
      setEditedDog({
        ...editedDog,
        additionalImages: [...currentAdditionalImages, response.data.url]
      });
      
      toast.success('Additional image uploaded!', {
        position: "top-center",
        autoClose: 2000
      });
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

  const handleEditSubmit = () => {
    onEdit(editedDog);
    setIsEditing(false);
  };

  const handlePrevImage = (e) => {
    e.preventDefault(); // Prevent event bubbling
    e.stopPropagation(); // Stop event from triggering parent clicks
    setCurrentImageIndex(prevIndex => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = (e) => {
    e.preventDefault(); // Prevent event bubbling
    e.stopPropagation(); // Stop event from triggering parent clicks
    setCurrentImageIndex(prevIndex => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleRemoveAdditionalImage = (index) => {
    const updatedImages = [...editedDog.additionalImages];
    updatedImages.splice(index, 1);
    setEditedDog({...editedDog, additionalImages: updatedImages});
  };

  // Card container animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 300,
        damping: 20,
        duration: 0.5 
      } 
    },
    hover: { 
      y: -12, 
      boxShadow: "0 25px 30px -12px rgba(0, 0, 0, 0.2)", 
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 15 
      }
    }
  };

  // Image gallery section
  const ImageGallery = () => (
    <div className="relative h-64 overflow-hidden group cursor-pointer">
      {uploadLoading ? (
        <div className="w-full h-full flex items-center justify-center bg-amber-50">
          <CircularProgress sx={{ color: "#B45309" }} />
        </div>
      ) : (
        <div className="relative w-full h-full">
          <motion.img
            className="w-full h-full object-cover transition-transform duration-700"
            src={images[currentImageIndex]}
            alt={dog.name}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Navigation arrows - Always visible */}
          {images.length > 1 && (
            <>
              <button 
                className="absolute left-2 top-1/2 transform -translate-y-1/2 
                         bg-amber-800/90 text-white p-2 rounded-full
                         transition-all duration-300 hover:bg-amber-900
                         shadow-lg hover:shadow-xl"
                onClick={handlePrevImage}
              >
                <ArrowBackIosIcon style={{ fontSize: 20 }} />
              </button>
              
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 
                         bg-amber-800/90 text-white p-2 rounded-full
                         transition-all duration-300 hover:bg-amber-900
                         shadow-lg hover:shadow-xl"
                onClick={handleNextImage}
              >
                <ArrowForwardIosIcon style={{ fontSize: 20 }} />
              </button>

              {/* Image counter */}
              <div className="absolute bottom-2 right-2 bg-amber-800/90 text-white 
                           px-3 py-1 rounded-full text-sm font-medium">
                {currentImageIndex + 1} / {images.length}
              </div>

              {/* Image indicators */}
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-3 h-3 rounded-full transition-all duration-300
                      ${currentImageIndex === index 
                        ? 'bg-amber-500 scale-110 shadow-lg' 
                        : 'bg-amber-400/70 hover:bg-amber-500'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <motion.div 
      className="max-w-xs relative rounded-2xl overflow-hidden shadow-xl bg-white border-2 border-amber-200"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      layout
    >
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${getColorGradient(dog.color)}`} />
      
      {/* Favorite button */}
      {!isEditing && (
        <motion.button
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white shadow-lg hover:shadow-xl"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(dog);
          }}
        >
          {isFavorite ? (
            <FavoriteIcon className="text-red-500" />
          ) : (
            <FavoriteBorderIcon className="text-gray-400" />
          )}
        </motion.button>
      )}

      {/* Image Gallery */}
      <ImageGallery />

      <div className="px-5 py-4 bg-gradient-to-br from-amber-50 to-white">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={editedDog.name}
                onChange={handleEditChange}
                className="shadow appearance-none border border-amber-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Name"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="age">
                Age
              </label>
              <input
                id="age"
                type="number"
                name="age"
                value={editedDog.age}
                onChange={handleEditChange}
                className="shadow appearance-none border border-amber-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Age"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="color">
                Color
              </label>
              <input
                id="color"
                type="text"
                name="color"
                value={editedDog.color}
                onChange={handleEditChange}
                className="shadow appearance-none border border-amber-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Color"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={editedDog.description || ""}
                onChange={handleEditChange}
                className="shadow appearance-none border border-amber-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Description"
                rows="2"
              />
            </div>
            
            {/* Main image upload */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">
                Main Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-amber-100 file:text-amber-700
                          hover:file:bg-amber-200 transition-colors duration-300"
                disabled={uploadLoading}
              />
            </div>
            
            {/* Additional image upload */}
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">
                Additional Images
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAdditionalImageChange}
                className="block w-full text-sm text-gray-500 
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-amber-100 file:text-amber-700
                          hover:file:bg-amber-200 transition-colors duration-300"
                disabled={uploadLoading}
              />
            </div>
            
            {/* Display additional images with delete option */}
            {editedDog.additionalImages && editedDog.additionalImages.length > 0 && (
              <div className="mt-2">
                <p className="block text-gray-700 text-sm font-bold mb-1">
                  Current Additional Images
                </p>
                <div className="flex flex-wrap gap-2">
                  {editedDog.additionalImages.map((img, index) => (
                    <div key={index} className="relative w-16 h-16 overflow-hidden rounded-md border-2 border-amber-200">
                      <img
                        src={img}
                        alt={`Additional ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <motion.button
                        onClick={() => handleRemoveAdditionalImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        ×
                      </motion.button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-start">
              <div className="flex gap-2 items-center">
                <PetsIcon className="text-amber-600" sx={{ fontSize: 18 }} />
                <p className="text-amber-800 font-medium">
                  Age: {dog.age} {dog.age === 1 ? 'year' : 'years'}
                </p>
              </div>
              
              <motion.span 
                className={`bg-gradient-to-r ${colorGradient} text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm`}
                whileHover={{ scale: 1.05 }}
              >
                {dog.color}
              </motion.span>
            </div>
            
            <motion.div
              initial={false}
              animate={showFullDetails ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-2"
            >
              <p className="text-gray-700 text-sm mt-3 bg-white/80 p-3 rounded-lg border border-amber-100">
                {dog.description || "No additional information available for this dog."}
              </p>
              
              {/* Dog traits/tags with improved visuals */}
              <div className="mt-4 flex flex-wrap gap-2">
                <motion.span 
                  className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full border border-blue-200 shadow-sm"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Friendly
                </motion.span>
                <motion.span 
                  className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full border border-green-200 shadow-sm"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Healthy
                </motion.span>
                <motion.span 
                  className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full border border-purple-200 shadow-sm"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Playful
                </motion.span>
                <motion.span 
                  className="bg-rose-100 text-rose-800 text-xs px-3 py-1 rounded-full border border-rose-200 shadow-sm"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Loyal
                </motion.span>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      
      <div className={`px-5 pt-2 pb-5 ${!isEditing ? 'bg-gradient-to-br from-amber-50 to-white' : ''}`}>
        {role === "admin" ? (
          <div className="flex justify-between items-center">
            <motion.button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1 py-2 px-4 rounded-lg text-sm font-medium shadow-md ${
                isEditing 
                  ? "bg-gray-200 text-gray-800 hover:bg-gray-300" 
                  : "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700"
              }`}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              disabled={uploadLoading}
            >
              {isEditing ? (
                <>
                  <CancelIcon fontSize="small" /> Cancel
                </>
              ) : (
                <>
                  <EditIcon fontSize="small" /> Edit
                </>
              )}
            </motion.button>
            
            {isEditing ? (
              <motion.button
                onClick={handleEditSubmit}
                className="flex items-center gap-1 py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg text-sm font-medium shadow-md"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                disabled={uploadLoading}
              >
                <SaveIcon fontSize="small" /> Save
              </motion.button>
            ) : (
              <motion.button
                onClick={() => onDelete(dog)}
                className="flex items-center gap-1 py-2 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-medium shadow-md"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                disabled={uploadLoading}
              >
                <DeleteOutlineIcon fontSize="small" /> Delete
              </motion.button>
            )}
          </div>
        ) : (
          <motion.button
            onClick={() => setShowFullDetails(!showFullDetails)}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg font-medium text-sm transition-colors duration-300 shadow-md"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {showFullDetails ? "Show Less" : "Learn More"}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default DogCard;
