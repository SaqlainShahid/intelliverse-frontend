import React from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Calendar, UserCircle2 } from 'lucide-react';

const UserProfileView = () => {
  const { userId } = useParams();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get(`/user/users/${userId}`)
      .then((res) => {
        if (!mounted) return;
        setData(res.data?.data || null);
        setLoading(false);
      })
      .catch((e) => {
        if (!mounted) return;
        setError('Failed to load profile');
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [userId]);

  const user = data?.user;
  const restricted = !!data?.restricted;

  return (
    <div className="min-h-screen bg-iv-bg">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-iv-glass backdrop-blur-xl border border-iv-border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 border-b border-iv-border flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white overflow-hidden flex items-center justify-center">
              {user?.profile?.avatar ? (
                <img src={user.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCircle2 className="w-10 h-10 text-iv-muted" />
              )}
            </div>
            <div>
              <div className="text-xl font-bold text-iv-text">
                {[user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(' ') || user?.email}
              </div>
              <div className="text-sm text-iv-muted">{user?.role}</div>
            </div>
          </div>

          {loading && (
            <div className="p-6 text-iv-muted">Loading...</div>
          )}
          {error && (
            <div className="p-6 text-red-600">{error}</div>
          )}
          {user && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="text-sm text-iv-muted">Department</div>
                <div className="text-iv-text font-medium">{user?.profile?.department || '—'}</div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-iv-muted">About</div>
                <div className="text-iv-text font-medium">{user?.profile?.bio || '—'}</div>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-iv-muted">Joined</div>
                <div className="text-iv-text font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-iv-muted" />
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                </div>
              </div>
            </div>
          )}

          {restricted && (
            <div className="p-6 border-t border-iv-border text-iv-muted">Limited profile visibility</div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserProfileView;