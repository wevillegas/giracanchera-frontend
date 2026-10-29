import { useState } from 'react';
import { ChevronLeft, Users, LandPlot, Shield, Flag, Activity, ScrollText, PenLine, LayoutDashboard, MessageSquareText } from 'lucide-react';
import { C, DISPLAY_FONT } from '../../theme';
import Navbar from '../Navbar';
import AdminOverviewView from './AdminOverviewView';
import AdminVisitsView from './AdminVisitsView';
import AdminUsersView from './AdminUsersView';
import AdminStadiumsView from './AdminStadiumsView';
import AdminClubsView from './AdminClubsView';
import AdminReportsView from './AdminReportsView';
import AdminSuggestionsView from './AdminSuggestionsView';
import AdminStatsView from './AdminStatsView';
import AdminAuditView from './AdminAuditView';

const TABS = [
  { key: 'overview', label: 'Resumen', Icon: LayoutDashboard },
  { key: 'users', label: 'Usuarios', Icon: Users },
  { key: 'stadiums', label: 'Estadios', Icon: LandPlot },
  { key: 'clubs', label: 'Clubes', Icon: Shield },
  { key: 'visits', label: 'Reseñas', Icon: MessageSquareText },
  { key: 'reports', label: 'Reportes', Icon: Flag },
  { key: 'suggestions', label: 'Correcciones', Icon: PenLine },
  { key: 'analytics', label: 'Analíticas', Icon: Activity },
  { key: 'audit', label: 'Auditoría', Icon: ScrollText },
];

export default function AdminView({ onBackToMap, onToast, navbarProps }) {
  const [tab, setTab] = useState('overview');
  const [openStadiumId, setOpenStadiumId] = useState(null); // estadio a abrir al llegar desde el resumen
  const editStadium = (id) => { setOpenStadiumId(id); setTab('stadiums'); };

  return (
    <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
      <Navbar {...navbarProps} />
      <div className="max-w-5xl mx-auto px-4 pt-32 pb-10">
        <button onClick={onBackToMap} className="flex items-center gap-1.5 text-sm gc-focus gc-tap" style={{ color: C.muted }}>
          <ChevronLeft size={16} /> Mapa
        </button>

        <h1 className="text-3xl mt-3" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>
          Panel de administrador
        </h1>

        <div className="flex items-center gap-2 mt-5 mb-6 overflow-x-auto gc-hide-scrollbar pb-1">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shrink-0 gc-focus gc-tap"
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

        {tab === 'overview' && <AdminOverviewView onGo={setTab} onEditStadium={editStadium} />}
        {tab === 'users' && <AdminUsersView onToast={onToast} />}
        {tab === 'stadiums' && <AdminStadiumsView onToast={onToast} openId={openStadiumId} onOpenHandled={() => setOpenStadiumId(null)} />}
        {tab === 'clubs' && <AdminClubsView onToast={onToast} />}
        {tab === 'visits' && <AdminVisitsView onToast={onToast} />}
        {tab === 'reports' && <AdminReportsView onToast={onToast} />}
        {tab === 'suggestions' && <AdminSuggestionsView onToast={onToast} />}
        {tab === 'analytics' && <AdminStatsView />}
        {tab === 'audit' && <AdminAuditView />}
      </div>
    </div>
  );
}
