import { useState } from 'react';
import { ChevronLeft, Users, LandPlot, Shield, Flag, Activity, ScrollText } from 'lucide-react';
import { C, DISPLAY_FONT } from '../../theme';
import Navbar from '../Navbar';
import AdminUsersView from './AdminUsersView';
import AdminStadiumsView from './AdminStadiumsView';
import AdminClubsView from './AdminClubsView';
import AdminReportsView from './AdminReportsView';
import AdminStatsView from './AdminStatsView';
import AdminAuditView from './AdminAuditView';

const TABS = [
  { key: 'users', label: 'Usuarios', Icon: Users },
  { key: 'stadiums', label: 'Estadios', Icon: LandPlot },
  { key: 'clubs', label: 'Clubes', Icon: Shield },
  { key: 'reports', label: 'Reportes', Icon: Flag },
  { key: 'analytics', label: 'Analíticas', Icon: Activity },
  { key: 'audit', label: 'Auditoría', Icon: ScrollText },
];

export default function AdminView({ onBackToMap, onToast, navbarProps }) {
  const [tab, setTab] = useState('users');

  return (
    <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
      <Navbar {...navbarProps} />
      <div className="max-w-3xl mx-auto px-4 pt-32 pb-10">
        <button onClick={onBackToMap} className="flex items-center gap-1.5 text-sm gc-focus gc-tap" style={{ color: C.muted }}>
          <ChevronLeft size={16} /> Mapa
        </button>

        <h1 className="text-3xl mt-3" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>
          Panel de administrador
        </h1>

        <div className="flex items-center gap-2 mt-5 mb-6">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium gc-focus gc-tap"
              style={{
                backgroundColor: tab === key ? C.brandBright : C.surface,
                color: tab === key ? C.bg : C.muted,
                border: `1px solid ${tab === key ? C.brandBright : C.border}`,
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {tab === 'users' && <AdminUsersView onToast={onToast} />}
        {tab === 'stadiums' && <AdminStadiumsView onToast={onToast} />}
        {tab === 'clubs' && <AdminClubsView onToast={onToast} />}
        {tab === 'reports' && <AdminReportsView onToast={onToast} />}
        {tab === 'analytics' && <AdminStatsView />}
        {tab === 'audit' && <AdminAuditView />}
      </div>
    </div>
  );
}
