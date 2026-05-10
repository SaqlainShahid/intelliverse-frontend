import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import helpdeskService from '../services/helpdeskService';
import TicketDetails from '../modules/helpdesk/TicketDetails';

const TicketOverviewPage = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const loadTicket = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await helpdeskService.getTicketById(ticketId);
      setTicket(res?.data || res);
    } catch (e) {
      setError('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  React.useEffect(() => { loadTicket(); }, [loadTicket]);

  React.useEffect(() => {
    if (!loading && ticket && user?.role === 'faculty') {
      const dept = (user?.profile?.department || '').toLowerCase();
      if ((ticket?.department || '').toLowerCase() !== dept) {
        navigate('/helpdesk');
      }
    }
  }, [loading, ticket, user, navigate]);

  const onUpdate = async (id, updateData) => {
    const res = await helpdeskService.updateTicket(id, updateData);
    setTicket(res?.data || res);
    return res;
  };

  const onAddComment = async (id, payload) => {
    const res = await helpdeskService.addComment(id, payload);
    setTicket(res?.data || res);
    return res;
  };

  const onSubmitFeedback = async (id, payload) => {
    const res = await helpdeskService.submitFeedback(id, payload);
    setTicket(res?.data || res);
    return res;
  };

  const onDeleteTicket = async (id) => {
    await helpdeskService.deleteTicket(id);
    navigate('/helpdesk');
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (<div className="text-gray-600">Loading...</div>)}
        {!loading && error && (<div className="text-red-600">{error}</div>)}
        {!loading && !error && ticket && (
          <TicketDetails
            ticket={ticket}
            onUpdate={onUpdate}
            onAddComment={onAddComment}
            onSubmitFeedback={onSubmitFeedback}
            isAdminView={user?.role === 'admin' || user?.role === 'faculty'}
            onClose={() => navigate('/helpdesk')}
            onDeleteTicket={onDeleteTicket}
          />
        )}
      </div>
    </div>
  );
};

export default TicketOverviewPage;