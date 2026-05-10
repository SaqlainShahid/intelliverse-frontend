import React, { useState } from 'react';
import useTickets from './useTickets';

export default function AdminDashboard() {
  const { tickets, loading, resolve } = useTickets();
  const [replyMap, setReplyMap] = useState({});

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold text-green-700 mb-4">AI HelpDesk Tickets</h1>
      {loading && <p className="text-gray-500">Loading...</p>}
      {!loading && tickets.length === 0 && <p className="text-gray-500">No escalated tickets</p>}
      <div className="space-y-4">
        {tickets.map(t => (
          <div key={t._id} className="bg-white border border-green-200 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">{t.ticketNumber}</p>
                <h2 className="text-lg font-medium text-gray-900">{t.title}</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{t.description}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${t.status === 'open' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{t.status === 'open' ? 'Pending' : 'Resolved'}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={replyMap[t._id] || ''}
                onChange={(e) => setReplyMap({ ...replyMap, [t._id]: e.target.value })}
                placeholder="Admin reply to student"
                className="flex-1 rounded-lg border border-green-300 px-3 py-2"
              />
              <button
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                onClick={async () => {
                  await resolve(t._id, replyMap[t._id] || '');
                  setReplyMap({ ...replyMap, [t._id]: '' });
                }}
              >Mark Resolved</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

