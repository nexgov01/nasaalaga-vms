import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminDashboard } from './AdminDashboard';
import { BAHWDashboard } from './BAHWDashboard';
import { OwnerPortal } from './OwnerPortal';
import { GuestDashboard } from './GuestDashboard';
import { CityHealthDashboard } from './CityHealthDashboard';
import type { User } from '../App';
import { endSession, hasPendingFor } from '../offline';
import { AICreditsNotice } from './AICreditsNotice';
import { DataPrivacyNotice, hasAcceptedPrivacy, recordPrivacyAcceptance } from './DataPrivacyGate';

export function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  // Data Privacy Notice must be accepted before any dashboard is rendered (every login, every role).
  const [privacyOk, setPrivacyOk] = useState<boolean>(() => hasAcceptedPrivacy());
  const navigate = useNavigate();

  const loadUserFromStorage = () => {
    const storedUser = sessionStorage.getItem('nasaalaga_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    loadUserFromStorage();
    // Re-sync React state whenever MyProfile saves — covers avatar, username, etc.
    window.addEventListener('nasaalaga_profile_updated', loadUserFromStorage);
    return () => window.removeEventListener('nasaalaga_profile_updated', loadUserFromStorage);
  }, [navigate]);

  const handleLogout = async () => {
    // Records saved offline stay on this device; make sure nobody logs out unaware they haven't uploaded yet.
    if (await hasPendingFor()) {
      const ok = window.confirm(
        'Some records saved on this device have not been uploaded yet.\n\n' +
        'If you log out now they stay on this device and upload the next time you sign in with this account while online.\n\nLog out anyway?'
      );
      if (!ok) return;
    }
    await endSession({ keepOffline: false });
    setUser(null);
    navigate('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#2B5EA6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!privacyOk) {
    return (
      <DataPrivacyNotice
        onAccept={() => { recordPrivacyAcceptance(); setPrivacyOk(true); }}
        onDecline={handleLogout}
      />
    );
  }

  const role = user.role;

  return (
    <div className="min-h-screen bg-gray-50">
      {(role === 'admin' || role === 'superadmin' || role === 'cvoStaff') && <AICreditsNotice />}
      {(role === 'admin' || role === 'superadmin' || role === 'cvoStaff') ? (
        <AdminDashboard user={user} onLogout={handleLogout} />
      ) : role === 'bahw' ? (
        <BAHWDashboard user={user} onLogout={handleLogout} />
      ) : role === 'cityHealth' ? (
        <CityHealthDashboard user={user} onLogout={handleLogout} />
      ) : (role === 'petOwner' || role === 'owner' || role === 'livestockManager' || role === 'both') ? (
        // One unified portal for every owner account: pet-only, livestock-only, or both.
        <OwnerPortal user={user} onLogout={handleLogout} />
      ) : role === 'guest' ? (
        <GuestDashboard user={user} onLogout={handleLogout} />
      ) : (
        <GuestDashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}
