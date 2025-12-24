import { useEffect, useState } from 'react';
import { getTickets, updateTicket } from '../api/ticketsApi';

export default function useTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await getTickets({ page: 1, limit: 50 });
      setTickets(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const resolve = async (ticketId, adminReply) => {
    const res = await updateTicket({ ticketId, status: 'resolved', adminReply });
    await refresh();
    return res.data;
  };

  useEffect(() => { refresh(); }, []);

  return { tickets, loading, refresh, resolve };
}

