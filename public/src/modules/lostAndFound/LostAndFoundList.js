// src/modules/lostAndFound/LostAndFoundList.js
import React, { useEffect, useState } from "react";
import { 
  Typography, 
  Box, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button, 
  Chip,
  Grid,
  Paper
} from "@mui/material";
import LostItemCard from "./LostItemCard";
import LostForm from "./LostForm";
import { getAllItems } from "./lostAndFoundService";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const LostAndFoundList = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    sort: "newest"
  });

  // Load items from backend
  const loadItems = async () => {
    if (!user) {
      toast.error("Please login to view items");
      return;
    }

    setLoading(true);
    try {
      const params = {
        page: 1,
        limit: 50,
        sort: filters.sort
      };

      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;

      const data = await getAllItems(params);
      setItems(data.items || []);
    } catch (error) {
      console.error("Failed to load items:", error);
      toast.error("Failed to load items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user, filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      sort: "newest"
    });
  };

  const handleItemDeleted = () => {
    loadItems();
  };

  const handleItemStatusChanged = () => {
    loadItems();
  };

  // Filter items for display
  const filteredItems = items.filter(item => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return item.itemName.toLowerCase().includes(searchTerm) ||
             item.description.toLowerCase().includes(searchTerm) ||
             item.location.toLowerCase().includes(searchTerm);
    }
    return true;
  });

  // Separate items by status
  const lostItems = filteredItems.filter(item => item.status === 'lost');
  const foundItems = filteredItems.filter(item => item.status === 'found');
  const claimedItems = filteredItems.filter(item => item.status === 'claimed');

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Please login to view and manage lost & found items
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Lost & Found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Report lost items or claim found items. Help keep our campus organized!
        </Typography>
      </Box>

      {/* Report New Item Form */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          📝 Report New Item
        </Typography>
        <LostForm onItemAdded={loadItems} />
      </Paper>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
            />
          </div>
          
          <div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
            >
              <option value="">All Status</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
              <option value="claimed">Claimed</option>
            </select>
          </div>
          
          <div>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={clearFilters}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-200 text-sm font-medium"
            >
              Clear
            </button>
            <button
              onClick={loadItems}
              className="flex-1 bg-gray-900 text-white py-2 px-3 rounded-md hover:bg-gray-800 text-sm font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Items Display */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Loading items...
          </Typography>
        </Box>
      ) : (
        <Box>
          {/* Lost Items */}
          {lostItems.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main', mr: 2 }}>
                  🔍 Lost Items
                </Typography>
                <Chip 
                  label={lostItems.length} 
                  color="error" 
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
              <Grid container spacing={3}>
                {lostItems.map((item) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                    <LostItemCard 
                      item={item} 
                      onClaimed={loadItems}
                      onDeleted={handleItemDeleted}
                      onStatusChanged={handleItemStatusChanged}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Found Items */}
          {foundItems.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main', mr: 2 }}>
                  ✅ Found Items
                </Typography>
                <Chip 
                  label={foundItems.length} 
                  color="success" 
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
              <Grid container spacing={3}>
                {foundItems.map((item) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                    <LostItemCard 
                      item={item} 
                      onClaimed={loadItems}
                      onDeleted={handleItemDeleted}
                      onStatusChanged={handleItemStatusChanged}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Claimed Items */}
          {claimedItems.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'info.main', mr: 2 }}>
                  🎉 Claimed Items
      </Typography>
                <Chip 
                  label={claimedItems.length} 
                  color="info" 
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
              <Grid container spacing={3}>
                {claimedItems.map((item) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                    <LostItemCard 
                      item={item} 
                      onClaimed={loadItems}
                      onDeleted={handleItemDeleted}
                      onStatusChanged={handleItemStatusChanged}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* No Items Message */}
          {filteredItems.length === 0 && !loading && (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No items found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filters.search || filters.status 
                  ? "Try adjusting your search criteria or clear the filters."
                  : "Be the first to report a lost or found item!"
                }
              </Typography>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
};

export default LostAndFoundList;
