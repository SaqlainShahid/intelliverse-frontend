import React, { useRef, useState } from "react";
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
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) setImage(files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
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
        toast.success("Submitted to admin for approval. It will appear after approval.");
        setFormData({ itemName: "", description: "", location: "", status: "lost" });
        setImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            name="itemName"
            placeholder="Item name"
            value={formData.itemName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm focus:ring-iv-indigo/30 focus:border-iv-indigo focus:outline-none"
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
            className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm focus:ring-iv-indigo/30 focus:border-iv-indigo focus:outline-none"
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
          className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm focus:ring-iv-indigo/30 focus:border-iv-indigo focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <select 
            name="status" 
            value={formData.status} 
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-xl bg-white/50 text-sm focus:outline-none focus:ring-iv-indigo/30 focus:border-iv-indigo ${formData.status === 'lost' ? 'border-iv-orange' : 'border-iv-emerald'}`}
          >
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </div>

        <div>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`w-full flex items-center justify-center px-4 py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${dragActive ? 'border-iv-indigo bg-white/60' : 'border-gray-200 bg-white/50'} `}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              <p className="text-sm font-medium text-iv-text">Drag & Drop to upload</p>
              <p className="text-xs text-iv-muted">or click to browse</p>
            </div>
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="hidden"
          />
          {image && (
            <p className="text-xs text-iv-muted mt-2">
              {image.name}
            </p>
          )}
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-gradient-to-r from-iv-indigo to-purple-600 text-white py-2 px-4 rounded-2xl hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-iv-indigo/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-sm"
      >
        {loading ? "Reporting..." : "Submit"}
      </button>
    </form>
  );
};

export default LostForm;
