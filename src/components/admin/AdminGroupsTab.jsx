import React, { useEffect, useState } from 'react';
import { getAdminGroups } from '../../services/chatService';
import { ChevronDown, ChevronRight, Users, Shield } from 'lucide-react';

export default function AdminGroupsTab() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getAdminGroups(category || undefined);
        if (res?.success) setGroups(res.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [category]);

  const toggle = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-gray-600">Filter:</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-300 rounded-md text-sm px-2 py-1"
        >
          <option value="">All</option>
          <option value="department">Department</option>
          <option value="batch">Batch</option>
          <option value="course">Course</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600">
          <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          Loading groups...
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y">
          {groups.map((g) => {
            const open = !!expanded[g._id];
            return (
              <div key={g._id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{g.name}</div>
                      <div className="text-xs text-gray-500">
                        {g.category?.toUpperCase()} • Members: {g.memberCount}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(g._id)}
                    className="text-sm px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-1"
                  >
                    {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />} Details
                  </button>
                </div>

                {open && (
                  <div className="mt-3">
                    {!!g.description && (
                      <div className="text-sm text-gray-700 mb-2">{g.description}</div>
                    )}
                    <div className="text-xs text-gray-500 mb-2">Created: {new Date(g.createdAt).toLocaleString()}</div>
                    {!!(g.admins && g.admins.length) && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-900 mb-1 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-red-600" /> Admins
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {g.admins.map((a) => (
                            <span key={`admin-${a._id}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs border border-red-200">
                              {a.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900 mb-1">Members</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {(g.members || []).map((m) => (
                          <div key={`m-${m._id}`} className="flex items-center justify-between p-2 rounded border bg-gray-50">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{m.name || m.email}</div>
                              <div className="text-xs text-gray-500">{m.email}</div>
                            </div>
                            <div className={`text-xs px-2 py-0.5 rounded ${m.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{m.isActive ? 'Active' : 'Inactive'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {groups.length === 0 && (
            <div className="p-6 text-center text-gray-600">No groups found</div>
          )}
        </div>
      )}
    </div>
  );
}
