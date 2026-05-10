// src/modules/lostAndFound/LostAndFoundList.js
import React, { useEffect, useState } from "react";
import LostItemCard from "./LostItemCard";
import LostForm from "./LostForm";
import { getAllItems } from "./lostAndFoundService";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import { GlassCard } from '../../dashboards/shared';
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
      <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm p-6 sm:p-8 hover:shadow-md transition-shadow">
        <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">Report New Item</h2>
            <div className="h-px bg-gradient-to-r from-indigo-100 to-transparent flex-1 ml-6"></div>
        </div>
        <LostForm onItemAdded={loadItems} />
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Search items..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-medium placeholder:font-normal"
            />
          </div>

          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-medium cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
              <option value="claimed">Claimed</option>
            </select>
          </div>

          <div className="relative group">
            <ArrowDownWideNarrow className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-gray-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none font-medium cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <div className="flex gap-3 md:col-span-2">
            <button
              onClick={clearFilters}
              className="flex-1 bg-white text-gray-600 border border-gray-200 py-3 px-4 rounded-2xl hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 text-sm font-bold uppercase tracking-wide transition-all shadow-sm"
            >
              Clear
            </button>
            <button
              onClick={loadItems}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-2xl hover:shadow-[0_4px_15px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 text-sm font-bold uppercase tracking-wide inline-flex items-center justify-center transition-all shadow-sm"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

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
