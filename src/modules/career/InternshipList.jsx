import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, Layers } from 'lucide-react';
import { getInternships } from '../api/careerApi';
import { useAuth } from '../../contexts/AuthContext';
import InternshipCard from './InternshipCard';

const InternshipList = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');

  const params = useMemo(() => {
    const p = {};
    if (q) p.q = q;
    if (type) p.type = type;
    if (location) p.location = location;
    if (skills) p.skills = skills;
    return p;
  }, [q, type, location, skills]);

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    (async () => {
      setLoading(true);
      try {
        const { items: list } = await getInternships(params);
        setItems(Array.isArray(list) ? list : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, params]);

  if (!user || user.role !== 'student') {
    return (
      <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-xl p-4">
        Only logged-in students can access Internship & Career Guidance.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-full pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search by title, company, skills..."
            />
          </div>
          <div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-full px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="internship">Internships</option>
              <option value="job">Jobs</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-full pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Filter by location"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-full pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Skills (comma separated)"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-600">Loading internships...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-600">No opportunities found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((it) => (
            <InternshipCard key={it._id || `${it.company}-${it.title}`} item={it} />
          ))}
        </div>
      )}
    </div>
  );
};

export default InternshipList;
