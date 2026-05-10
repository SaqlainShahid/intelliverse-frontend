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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-gray-700 pl-1 uppercase tracking-wider text-[11px]">Item Name</label>
          <input
            type="text"
            name="itemName"
            placeholder="e.g. Blue Hydroflask, Keys..."
            value={formData.itemName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-gray-700 pl-1 uppercase tracking-wider text-[11px]">Location (Lost or Found)</label>
          <input
            type="text"
            name="location"
            placeholder="e.g. Main Library, Room 101"
            value={formData.location}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-bold text-gray-700 pl-1 uppercase tracking-wider text-[11px]">Description</label>
        <textarea
          name="description"
          placeholder="Detailed description of the item..."
          value={formData.description}
          onChange={handleChange}
          required
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-gray-700 pl-1 uppercase tracking-wider text-[11px]">Status</label>
          <select 
            name="status" 
            value={formData.status} 
            onChange={handleChange}
            className={`w-full px-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-800 text-sm font-semibold focus:bg-white focus:ring-2 focus:border-transparent transition-all outline-none cursor-pointer ${formData.status === 'lost' ? 'focus:ring-orange-400' : 'focus:ring-emerald-400'}`}
          >
            <option value="lost">I Lost this item</option>
            <option value="found">I Found this item</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-bold text-gray-700 pl-1 uppercase tracking-wider text-[11px]">Photo (Optional)</label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`w-full flex items-center justify-center px-4 py-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${dragActive ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              <div className="mx-auto h-8 w-8 text-indigo-400 mb-2">
                 <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </div>
              <p className="text-sm font-bold text-gray-700">Drag & Drop image</p>
              <p className="text-xs text-gray-500 mt-1">or click to browse</p>
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
            <p className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg truncate shadow-sm text-center">
              Selected: {image.name}
            </p>
          )}
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 px-4 rounded-2xl hover:shadow-[0_8px_25px_-5px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all font-bold text-sm tracking-wide shadow-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase"
      >
        {loading ? "Submitting..." : (formData.status === 'lost' ? "Report Lost Item" : "Report Found Item")}
      </button>
    </form>
  );
};

export default LostForm;
