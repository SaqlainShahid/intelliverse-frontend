import React, { useState } from "react";
import { reportItem } from "./lostAndFoundService";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const LostForm = ({ onItemAdded }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    itemName: "",
    description: "",
    location: "",
    status: "lost",
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please login to report items");
      return;
    }

    setLoading(true);
    
    try {
      const data = new FormData();
      data.append("itemName", formData.itemName);
      data.append("description", formData.description);
      data.append("location", formData.location);
      data.append("status", formData.status);
      if (image) data.append("image", image);

      const res = await reportItem(data);
      
      if (res.success) {
        toast.success("Item reported successfully!");
        setFormData({ itemName: "", description: "", location: "", status: "lost" });
        setImage(null);
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';

        // Reload the items list
        if (onItemAdded) onItemAdded();
      } else {
        toast.error(res.message || "Failed to report item");
      }
    } catch (err) {
      console.error("Error reporting item:", err);
      toast.error("Error reporting item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Report Item</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              name="itemName"
              placeholder="Item name"
              value={formData.itemName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>

          <div>
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>
        </div>

        <div>
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <select 
              name="status" 
              value={formData.status} 
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            >
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </div>

          <div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 text-sm"
            />
            {image && (
              <p className="text-xs text-gray-500 mt-1">
                {image.name}
              </p>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          style={{ 
            backgroundColor: '#1f2937', 
            color: 'white', 
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? "Reporting..." : "Report Item"}
        </button>
      </form>
    </div>
  );
};

export default LostForm;
