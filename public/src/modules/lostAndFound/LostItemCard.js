// src/modules/lostAndFound/LostItemCard.js
import React, { useState } from "react";
import { Card, CardContent, Typography, Button, CardMedia, Box, Chip } from "@mui/material";
import { claimItem, deleteItem, updateItemStatus } from "./lostAndFoundService";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const LostItemCard = ({ item, onClaimed, onDeleted, onStatusChanged }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClaim = async () => {
    if (!user) {
      toast.error("Please login to claim items");
      return;
    }

    setLoading(true);
    try {
      const result = await claimItem(item._id);
      if (result.success) {
        toast.success("Item claimed successfully!");
        if (onClaimed) onClaimed();
      } else {
        toast.error(result.message || "Failed to claim item");
      }
    } catch (error) {
      console.error("Error claiming item:", error);
      toast.error("Error claiming item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!user) {
      toast.error("Please login to change item status");
      return;
    }

    if (!window.confirm(`Are you sure you want to mark this item as "${newStatus}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await updateItemStatus(item._id, newStatus);
      if (result.success) {
        toast.success(`Item marked as "${newStatus}" successfully!`);
        if (onStatusChanged) onStatusChanged();
        
        // Show admin notification message
        if (newStatus === 'found') {
          toast.success("📢 Admins have been notified about this status change!", {
            duration: 5000
          });
        }
      } else {
        toast.error(result.message || "Failed to update item status");
      }
    } catch (error) {
      console.error("Error updating item status:", error);
      toast.error("Error updating item status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || user.role !== 'admin') {
      toast.error("Only admins can delete items");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteItem(item._id);
      if (result.success) {
        toast.success("Item deleted successfully!");
        if (onDeleted) onDeleted();
      } else {
        toast.error(result.message || "Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Error deleting item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isOwnItem = user && item.reportedBy && item.reportedBy._id === user._id;
  const canClaim = user && item.status === "found" && isOwnItem; // Only original reporter can claim
  const canDelete = user && user.role === 'admin';
  const canMarkAsFound = user && item.status === 'lost'; // Any user can mark as found

  const getStatusColor = (status) => {
    switch (status) {
      case 'lost': return 'error';
      case 'found': return 'success';
      case 'claimed': return 'info';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'lost': return 'Lost';
      case 'found': return 'Found';
      case 'claimed': return 'Claimed';
      default: return status;
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        boxShadow: 2,
        transition: "all 0.3s ease",
        "&:hover": { 
          boxShadow: 4,
          transform: "translateY(-2px)"
        },
        border: isOwnItem ? "2px solid #2563eb" : "1px solid #e0e0e0",
        backgroundColor: isOwnItem ? "#f8faff" : "white",
        position: 'relative'
      }}
    >
      {/* Status Badge */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
        <Chip 
          label={getStatusText(item.status)} 
          color={getStatusColor(item.status)}
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      </Box>

      {/* Own Item Badge */}
      {isOwnItem && (
        <Box sx={{ 
          position: 'absolute', 
          top: 8, 
          left: 8, 
          zIndex: 1,
          backgroundColor: '#2563eb',
          color: 'white',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          fontSize: '0.75rem',
          fontWeight: 'bold'
        }}>
          YOUR ITEM
        </Box>
      )}

      {/* Image */}
      {item.imageUrl && (
        <CardMedia
          component="img"
          image={`http://localhost:5000${item.imageUrl}`}
          alt={item.itemName}
          sx={{
            height: 200,
            objectFit: "cover",
            backgroundColor: "#f5f5f5",
          }}
        />
      )}

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Title */}
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
          {item.itemName}
        </Typography>

        {/* Description */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2, 
            flexGrow: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {item.description}
        </Typography>

        {/* Location */}
        <Typography variant="body2" sx={{ mb: 1, color: 'primary.main' }}>
          📍 {item.location}
        </Typography>

        {/* Date */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          📅 {item.date ? new Date(item.date).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()}
        </Typography>

        {/* Reporter Information */}
        {item.reportedBy && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            👤 {item.reportedBy.profile?.firstName} {item.reportedBy.profile?.lastName}
            {user?.role === 'admin' && (
              <span> ({item.reportedBy.email})</span>
            )}
          </Typography>
        )}

        {/* Found By Information */}
        {item.status === 'found' && item.foundBy && (
          <Typography variant="body2" color="success.main" sx={{ mb: 1, fontWeight: 'bold' }}>
            🔍 Found by: {item.foundBy.profile?.firstName} {item.foundBy.profile?.lastName}
          </Typography>
        )}

        {/* Claimed Information */}
        {item.status === 'claimed' && item.claimedBy && (
          <Typography variant="body2" color="success.main" sx={{ mb: 1, fontWeight: 'bold' }}>
            ✅ Claimed by: {item.claimedBy.profile?.firstName} {item.claimedBy.profile?.lastName}
          </Typography>
        )}

        {/* Action Buttons */}
        <Box sx={{ mt: 'auto', pt: 2 }}>
          {/* Mark as Found Button (for any user when item is lost) */}
          {canMarkAsFound && (
            <Button
              fullWidth
              variant="contained"
              color="success"
              size="small"
              onClick={() => handleStatusChange('found')}
              disabled={loading}
              sx={{ borderRadius: 1, mb: 1 }}
            >
              {loading ? "Updating..." : "🔍 I Found This Item"}
            </Button>
          )}

          {/* Claim Button (only for original reporter when item is found) */}
          {canClaim && (
            <Button
              fullWidth
              variant="contained"
              size="small"
              onClick={handleClaim}
              disabled={loading}
              sx={{ borderRadius: 1, mb: 1 }}
            >
              {loading ? "Claiming..." : "🎯 Claim My Item"}
            </Button>
          )}

          {/* Delete Button (for admins) */}
          {canDelete && (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              size="small"
              onClick={handleDelete}
              disabled={loading}
              sx={{ borderRadius: 1 }}
            >
              {loading ? "Deleting..." : "🗑️ Delete"}
            </Button>
          )}

          {/* Claimed Status */}
          {item.status === "claimed" && (
            <Box sx={{ 
              textAlign: 'center', 
              py: 1,
              backgroundColor: '#e8f5e8',
              borderRadius: 1,
              border: '1px solid #4caf50'
            }}>
              <Typography color="success.main" sx={{ fontWeight: "bold" }}>
                ✅ Claimed
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default LostItemCard;
