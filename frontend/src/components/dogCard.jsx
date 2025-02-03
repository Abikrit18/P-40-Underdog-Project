import React from 'react';
import { Card, CardContent, CardMedia, Typography, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const DogCard = ({ dog, onDelete, onEdit }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <Card style={{ maxWidth: 345, margin: '20px', position: 'relative' }}>
            <CardMedia
                component="img"
                height="140"
                image={dog.picture}
                alt={dog.name}
            />
            <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                    {dog.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Age: {dog.age}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Color: {dog.color}
                </Typography>
            </CardContent>
            <IconButton
                aria-label="settings"
                onClick={handleMenuOpen}
                style={{ position: 'absolute', top: 10, right: 10 }}
            >
                <MoreVertIcon />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => { onEdit(dog); handleMenuClose(); }}>Edit</MenuItem>
                <MenuItem onClick={() => { onDelete(dog); handleMenuClose(); }}>Delete</MenuItem>
            </Menu>
        </Card>
    );
};

export default DogCard;