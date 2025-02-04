import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const DogCard = ({ dog, onDelete, onEdit }) => {
  return (
    <Card
      sx={{
        maxWidth: 300,
        minWidth: 250,
        margin: "20px",
        borderRadius: "15px",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        position: "relative",
        textAlign: "center",
        padding: "10px",
        backgroundColor: "#fdfbf7",
      }}
    >
      <CardMedia
        component="img"
        height="140"
        image={dog.picture}
        alt={dog.name}
        sx={{
          borderRadius: "10px",
          objectFit: "cover",
        }}
      />
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          {dog.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Age: {dog.age} years
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Color: {dog.color}
        </Typography>
      </CardContent>
      
      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 1 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<EditIcon />}
          onClick={() => onEdit(dog)}
        >
          Edit
        </Button>
        <Button
          variant="contained"
          color="error"
          size="small"
          startIcon={<DeleteIcon />}
          onClick={() => onDelete(dog)}
        >
          Delete
        </Button>
      </Box>
    </Card>
  );
};

export default DogCard;
