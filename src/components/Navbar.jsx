import { useState } from 'react';
import { Search, MapPin, ChevronDown, User, LogOut } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

const FILTERS = [
  { key: 'visited', label: 'Mis visitas' },
  { key: 'wishlist', label: 'Visitaré próximamente' },
  { key: 'all', label: 'Todos los estadios' },
];

function initialsOf(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

export default function Navbar({
  query, onQueryChange, filter, onFilterChange, onOpenProfile, searchResults = [], onSelectSearchResult,
}) {
  const { user, logout } = useAuth();
  const [authModal, setAuthModal] = useState(null); // null | 'login' | 'register'
  const [menuOpen, setMenuOpen] = useState(false);
  const showResults = query.trim().length > 0;

  return (
    <div
      className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-4 pb-3"
      style={{ backgroundColor: rgba(C.bg, 0.55), backdropFilter: 'blur(12px)', borderBottom: `1px solid ${rgba(C.border, 0.6)}` }}
    >
      <div className="max-w-2xl mx-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.brand }}>
            <MapPin size={18} color={C.bright} />
          </div>
          <span className="text-xl tracking-wide" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>GiraCanchera</span>
        </div>

        <div className="relative flex-1">
          <div className="flex items-center gap-2 rounded-full px-3 py-2" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <Search size={16} color={C.muted} />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar estadios o clubes..."
              className="bg-transparent outline-none text-sm flex-1 gc-focus"
              style={{ color: C.bright }}
            />
          </div>

          {showResults && (
            <div
              className="absolute left-0 right-0 mt-2 rounded-2xl overflow-hidden max-h-64 overflow-y-auto gc-hide-scrollbar"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: `0 12px 24px ${rgba('#000000', 0.35)}` }}
            >
              {searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm" style={{ color: C.muted }}>
                  Sin resultados para "{query}"
                </div>
              ) : (
                searchResults.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelectSearchResult(s)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left gc-focus"
                    style={{ borderTop: `1px solid ${C.border}` }}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium truncate" style={{ color: C.bright }}>{s.name}</span>
                      <span className="block text-xs truncate" style={{ color: C.muted }}>{s.club} · {s.city}</span>
                    </span>
                    <MapPin size={14} color={C.muted} className="shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {user ? (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full gc-focus"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
            >
              <span className="w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs shrink-0" style={{ backgroundColor: C.brand, color: C.bright }}>
                {initialsOf(user.username || user.name || user.email)}
              </span>
              <span className="hidden sm:flex flex-col items-start leading-tight max-w-[8rem]">
                <span className="text-xs font-semibold truncate w-full" style={{ color: C.bright }}>{user.username || user.name}</span>
                {(user.club?.name || user.clubName) && (
                  <span className="text-[11px] truncate w-full" style={{ color: C.muted }}>{user.club?.name || user.clubName}</span>
                )}
              </span>
              <ChevronDown size={14} color={C.muted} />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-[999]" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 mt-2 w-48 rounded-2xl overflow-hidden z-[1000]"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: `0 12px 24px ${rgba('#000000', 0.35)}` }}
                >
                  <button
                    onClick={() => { setMenuOpen(false); onOpenProfile(); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left gc-focus"
                    style={{ color: C.bright }}
                  >
                    <User size={15} color={C.muted} /> Mi Perfil
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left gc-focus"
                    style={{ color: C.bright, borderTop: `1px solid ${C.border}` }}
                  >
                    <LogOut size={15} color={C.muted} /> Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setAuthModal('login')}
              className="px-3 py-1.5 rounded-full text-xs font-semibold gc-focus"
              style={{ backgroundColor: 'transparent', border: `1px solid ${C.border}`, color: C.bright }}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setAuthModal('register')}
              className="px-3 py-1.5 rounded-full text-xs font-semibold gc-focus"
              style={{ backgroundColor: C.brand, color: C.bright }}
            >
              Registrarse
            </button>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto flex items-center gap-2 mt-3 overflow-x-auto gc-hide-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors gc-focus"
            style={{
              backgroundColor: filter === f.key ? C.brandBright : rgba(C.surface, 0.9),
              color: filter === f.key ? C.bg : C.muted,
              border: `1px solid ${filter === f.key ? C.brandBright : C.border}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {authModal === 'login' && (
        <LoginModal onClose={() => setAuthModal(null)} onSwitchToRegister={() => setAuthModal('register')} />
      )}
      {authModal === 'register' && (
        <RegisterModal onClose={() => setAuthModal(null)} onSwitchToLogin={() => setAuthModal('login')} />
      )}
    </div>
  );
}
