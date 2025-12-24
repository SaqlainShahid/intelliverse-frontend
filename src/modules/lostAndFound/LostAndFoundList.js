// src/modules/lostAndFound/LostAndFoundList.js
import React, { useEffect, useState } from "react";
import LostItemCard from "./LostItemCard";
import LostForm from "./LostForm";
import { getAllItems } from "./lostAndFoundService";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import GlassCard from "../../components/dashboard-ui/GlassCard";
import { Search, Filter, ArrowDownWideNarrow, RefreshCcw } from "lucide-react";

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
      <div className="text-center py-12">
        <p className="text-iv-muted">Please login to view and manage lost & found items</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6 rounded-3xl">
        <div className="mb-4 text-xl font-bold text-iv-text">Report New Item</div>
        <LostForm onItemAdded={loadItems} />
      </GlassCard>

      <GlassCard className="p-4 rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-iv-muted" />
            <input
              type="text"
              placeholder="Search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm focus:ring-iv-indigo/30 focus:border-iv-indigo focus:outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-iv-muted" />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm focus:ring-iv-indigo/30 focus:border-iv-indigo focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
              <option value="claimed">Claimed</option>
            </select>
          </div>

          <div className="relative">
            <ArrowDownWideNarrow className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-iv-muted" />
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl bg-white/50 text-sm focus:ring-iv-indigo/30 focus:border-iv-indigo focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>

          <div className="flex gap-2 md:col-span-2">
            <button
              onClick={clearFilters}
              className="flex-1 bg-white/60 text-iv-muted border border-gray-200 py-2 px-3 rounded-xl hover:bg-gray-50 text-sm font-medium"
            >
              Clear
            </button>
            <button
              onClick={loadItems}
              className="flex-1 bg-iv-indigo text-white py-2 px-3 rounded-xl hover:bg-indigo-600 text-sm font-semibold inline-flex items-center justify-center"
            >
              <RefreshCcw className="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-sm p-4 animate-pulse">
              <div className="h-36 bg-gray-200 rounded-xl mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-5/6 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {lostItems.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <div className="text-lg font-bold text-iv-orange mr-2">Lost Items</div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-iv-orange/10 text-iv-orange ring-1 ring-iv-orange/20">{lostItems.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {lostItems.map((item) => (
                  <LostItemCard 
                    key={item._id}
                    item={item} 
                    onClaimed={loadItems}
                    onDeleted={handleItemDeleted}
                    onStatusChanged={handleItemStatusChanged}
                  />
                ))}
              </div>
            </div>
          )}

          {foundItems.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <div className="text-lg font-bold text-iv-emerald mr-2">Found Items</div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-iv-emerald/10 text-iv-emerald ring-1 ring-iv-emerald/20">{foundItems.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {foundItems.map((item) => (
                  <LostItemCard 
                    key={item._id}
                    item={item} 
                    onClaimed={loadItems}
                    onDeleted={handleItemDeleted}
                    onStatusChanged={handleItemStatusChanged}
                  />
                ))}
              </div>
            </div>
          )}

          {claimedItems.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <div className="text-lg font-bold text-iv-indigo mr-2">Claimed Items</div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-iv-indigo/10 text-iv-indigo ring-1 ring-iv-indigo/20">{claimedItems.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {claimedItems.map((item) => (
                  <LostItemCard 
                    key={item._id}
                    item={item} 
                    onClaimed={loadItems}
                    onDeleted={handleItemDeleted}
                    onStatusChanged={handleItemStatusChanged}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredItems.length === 0 && (
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl shadow-sm p-8 text-center">
              <div className="text-5xl mb-3">🔍</div>
              <div className="text-lg font-semibold text-iv-text mb-1">No items found yet.</div>
              <div className="text-sm text-iv-muted">Be the first to report one!</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LostAndFoundList;
