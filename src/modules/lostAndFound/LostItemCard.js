// src/modules/lostAndFound/LostItemCard.js
import React, { useState } from "react";
import { claimItem, deleteItem, updateItemStatus } from "./lostAndFoundService";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import { MapPin, CalendarDays, ShieldCheck } from "lucide-react";

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

  const approvalStatus = item?.approvalStatus || 'approved';
  const isApproved = approvalStatus === 'approved';
  const isOwnItem = user && item.reportedBy && item.reportedBy._id === user._id;
  const canClaim = user && isApproved && item.status === "found" && isOwnItem; // Only original reporter can claim
  const canDelete = user && user.role === 'admin';
  const canMarkAsFound = user && isApproved && item.status === 'lost'; // Any user can mark as found

  const getStatusText = (status) => {
    switch (status) {
      case 'lost': return 'Lost';
      case 'found': return 'Found';
      case 'claimed': return 'Claimed';
      default: return status;
    }
  };

  return (
    <div className={`bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${isOwnItem ? 'ring-2 ring-iv-indigo' : ''} hover:-translate-y-1 hover:shadow-indigo-500/10`}>
      <div className="relative">
        {item.imageUrl && (
          <img
            src={`http://localhost:5000${item.imageUrl}`}
            alt={item.itemName}
            className="h-48 w-full object-cover bg-gray-100 rounded-t-2xl transform transition-transform duration-300 hover:scale-105"
          />
        )}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'found' ? 'bg-iv-emerald/10 text-iv-emerald ring-1 ring-iv-emerald/20' : item.status === 'claimed' ? 'bg-iv-indigo/10 text-iv-indigo ring-1 ring-iv-indigo/20' : 'bg-iv-orange/10 text-iv-orange ring-1 ring-iv-orange/20'}`}>{getStatusText(item.status)}</span>
        </div>
        {approvalStatus !== 'approved' && (
          <div className="absolute top-12 right-3">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${approvalStatus === 'pending' ? 'bg-iv-orange/10 text-iv-orange ring-1 ring-iv-orange/20 animate-pulse' : 'bg-red-100 text-red-700 ring-1 ring-red-200'}`}>{approvalStatus === 'pending' ? 'Pending approval' : 'Rejected'}</span>
          </div>
        )}
        {isOwnItem && (
          <div className="absolute top-3 left-3 bg-iv-indigo text-white px-2 py-1 rounded-lg text-xs font-bold">Your Item</div>
        )}
      </div>

      <div className="p-4">
        <div className="text-lg font-bold text-iv-text mb-1">{item.itemName}</div>
        <div className="text-sm text-iv-muted mb-2 line-clamp-3">{item.description}</div>
        <div className="grid grid-cols-2 gap-2 text-sm text-iv-muted mb-3">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1 text-iv-indigo" />
            {item.location}
          </div>
          <div className="flex items-center">
            <CalendarDays className="w-4 h-4 mr-1 text-iv-indigo" />
            {item.date ? new Date(item.date).toLocaleDateString() : new Date(item.createdAt).toLocaleDateString()}
          </div>
        </div>

        {item.reportedBy && (
          <div className="text-xs text-iv-muted mb-1">
            {item.reportedBy.profile?.firstName} {item.reportedBy.profile?.lastName}
            {user?.role === 'admin' && (
              <span> ({item.reportedBy.email})</span>
            )}
          </div>
        )}

        {item.status === 'found' && item.foundBy && (
          <div className="text-xs font-semibold text-iv-emerald mb-1">
            Found by: {item.foundBy.profile?.firstName} {item.foundBy.profile?.lastName}
          </div>
        )}

        {item.status === 'claimed' && item.claimedBy && (
          <div className="text-xs font-semibold text-iv-indigo mb-1">
            Claimed by: {item.claimedBy.profile?.firstName} {item.claimedBy.profile?.lastName}
          </div>
        )}

        <div className="mt-3 space-y-2">
          {canMarkAsFound && (
            <button
              onClick={() => handleStatusChange('found')}
              disabled={loading}
              className="w-full bg-iv-emerald text-white py-2 px-4 rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
            >
              {loading ? 'Updating...' : 'I Found This Item'}
            </button>
          )}

          {canClaim && (
            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full bg-iv-indigo text-white py-2 px-4 rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
            >
              {loading ? 'Claiming...' : 'Claim My Item'}
            </button>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="w-full border border-red-300 text-red-700 bg-red-50 py-2 px-4 rounded-xl hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          )}

          {item.status === 'claimed' && (
            <div className="text-center py-2 bg-green-50 border border-green-200 rounded-xl">
              <span className="text-green-700 font-bold text-sm">Claimed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LostItemCard;
