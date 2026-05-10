import api from '../../services/api';

// Get all items
export const getAllItems = async (params) => {
  try {
    const response = await api.get('/lost', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

// Report item (with optional image)
export const reportItem = async (formData) => {
  try {
    const response = await api.post('/lost/with-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error reporting item:', error);
    throw error;
  }
};

// Report item without image
export const reportItemWithoutImage = async (itemData) => {
  try {
    const response = await api.post('/lost', itemData);
    return response.data;
  } catch (error) {
    console.error('Error reporting item:', error);
    throw error;
  }
};

// Claim an item
export const claimItem = async (id) => {
  try {
    const response = await api.put(`/lost/${id}/claim`);
    return response.data;
  } catch (error) {
    console.error('Error claiming item:', error);
    throw error;
  }
};

// Update item status
export const updateItemStatus = async (itemId, status) => {
  try {
    console.log('Updating item status:', { itemId, status });
    const response = await api.put(`/lost/${itemId}/status`, { status });
    console.log('Status update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating item status:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    throw error;
  }
};

// Delete an item (Admin only)
export const deleteItem = async (id) => {
  try {
    const response = await api.delete(`/lost/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
};
