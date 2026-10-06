import { useEffect, useState } from 'react';
import { Search, ChevronDown, User, LogOut, MapPin, ShieldCheck, Info, Activity } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import { isAdminRole } from '../utils/roles';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import logoIcon from '../assets/giracanchera-icono.svg';
import LogoutConfirmModal from './LogoutConfirmModal';
import { Logo } from './ClubPicker';

const FILTERS = [
  { key: 'visited', label: 'Mis visitas' },
  { key: 'wishlist', label: 'Visitaré próximamente' },
  { key: 'all', label: 'Todos los estadios' },
];

function initialsOf(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

export default function Navbar({
  query, onQueryChange, filter, onFilterChange, onOpenProfile, onOpenUserProfile, onGoHome, onOpenAdmin, onOpenAbout, onOpenStats, searchResults = [], onSelectSearchResult, onAuthSuccess,
  authModal, onAuthModalChange,
}) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  // Buscador compartido: el modo decide si busca estadios (filtra el mapa) o usuarios (abre su perfil)
  const [searchMode, setSearchMode] = useState('stadiums');
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const isUsers = searchMode === 'users';
  const showResults = (isUsers ? userQuery : query).trim().length > 0;

  useEffect(() => {
    if (!isUsers || !user || !userQuery.trim()) {
      setUserResults([]);
      return undefined;
    }
    let cancelled = false;
    setSearchingUsers(true);
    const t = setTimeout(() => {
      userService.searchUsers(userQuery.trim())
        .then((data) => { if (!cancelled) setUserResults(data); })
        .catch(() => { if (!cancelled) setUserResults([]); })
        .finally(() => { if (!cancelled) setSearchingUsers(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [isUsers, userQuery, user]);

  function renderUserResults() {
    if (!user) {
      return <div className="px-4 py-3 text-sm" style={{ color: C.muted }}>Iniciá sesión para buscar usuarios</div>;
    }
    if (searchingUsers) {
      return <div className="px-4 py-3 text-sm" style={{ color: C.muted }}>Buscando...</div>;
    }
    if (userResults.length === 0) {
      return <div className="px-4 py-3 text-sm" style={{ color: C.muted }}>Sin resultados para "{userQuery}"</div>;
    }
    return userResults.map((u) => (
      <button
        key={u._id}
        onClick={() => { setUserQuery(''); onOpenUserProfile?.(u._id); }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left gc-focus gc-tap"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        {u.avatarUrl ? (
          <img src={u.avatarUrl} alt={u.username} className="w-7 h-7 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ backgroundColor: C.brand, color: C.bright }}>
            {initialsOf(u.username || '?')}
          </div>
        )}
        <span className="text-sm truncate" style={{ color: C.bright }}>@{u.username}</span>
      </button>
    ));
  }

  return (
    <>
    <div
      className="fixed top-0 left-0 right-0 z-[1000] px-4 pt-4 pb-3"
      style={{ backgroundColor: rgba(C.bg, 0.72), backdropFilter: 'blur(14px)', borderBottom: `1px solid ${rgba(C.border, 0.6)}` }}
    >
      <div className="max-w-[1400px] mx-auto flex items-center gap-3 flex-wrap">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 shrink-0 gc-focus gc-tap rounded-lg"
          style={{ opacity: 1 }}
          aria-label="Ir al mapa"
        >
          <img src={logoIcon} alt="" className="w-8 h-8 object-contain shrink-0" />
          <span className="text-xl tracking-wide uppercase shrink-0" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>Gira<span style={{ color: C.brandBright }}>Canchera</span></span>
        </button>

        <div className="relative shrink-0 w-64">
          <div className="gc-search-box flex items-center gap-2 rounded-full px-3 py-2" style={{ backgroundColor: C.surface }}>
            <Search size={16} color={C.muted} />
            <button
              type="button"
              onClick={() => setSearchMode(isUsers ? 'stadiums' : 'users')}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 gc-focus"
              style={{ backgroundColor: C.border, color: C.bright }}
              aria-label="Cambiar entre buscar estadios y usuarios"
            >
              {isUsers ? 'Usuarios' : 'Estadios'}
            </button>
            <input
              value={isUsers ? userQuery : query}
              onChange={(e) => (isUsers ? setUserQuery(e.target.value) : onQueryChange(e.target.value))}
              placeholder={isUsers ? 'Buscar usuarios...' : 'Buscar estadios...'}
              className="bg-transparent outline-none text-sm flex-1 min-w-0"
              style={{ color: C.bright }}
            />
          </div>

          {showResults && (
            <div
              className="absolute left-0 right-0 mt-2 rounded-2xl overflow-hidden max-h-64 overflow-y-auto gc-hide-scrollbar"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: `0 12px 24px ${rgba('#000000', 0.35)}` }}
            >
              {isUsers ? renderUserResults() : searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm" style={{ color: C.muted }}>
                  Sin resultados para "{query}"
                </div>
              ) : (
                searchResults.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelectSearchResult(s)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left gc-focus gc-tap"
                    style={{ borderTop: `1px solid ${C.border}` }}
                  >
                    <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                      <Logo url={s.clubLogoUrl} size={44} />
                    </div>
                    <span className="min-w-0">
                      <span className="block text-xl truncate" style={{ color: C.bright, fontFamily: DISPLAY_FONT, letterSpacing: '0.02em', fontWeight: 400 }}>{s.name}</span>
                      <span className="block text-xs truncate" style={{ color: C.muted }}>{s.clubName || s.club}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => onFilterChange(filter === f.key && f.key !== 'all' ? 'all' : f.key)}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium gc-focus gc-tap"
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

        <div className="flex-1" />

        {user ? (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full gc-focus gc-tap"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-10 h-10 rounded-full object-cover shrink-0" style={{ backgroundColor: C.brand }} />
              ) : (
                <span className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0" style={{ backgroundColor: C.brand, color: C.bright }}>
                  {initialsOf(user.username || user.nombre || user.email)}
                </span>
              )}
              <span className="hidden sm:flex flex-col items-start leading-tight max-w-[8rem]">
                <span className="text-xs font-semibold truncate w-full" style={{ color: C.bright }}>{user.username || user.nombre}</span>
                {user.clubHincha?.name && (
                  <span className="text-[11px] truncate w-full" style={{ color: C.muted }}>{user.clubHincha.name}</span>
                )}
              </span>
              <ChevronDown size={14} color={C.muted} style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
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
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left gc-focus gc-tap"
                    style={{ color: C.bright }}
                  >
                    <User size={15} color={C.muted} /> Mi Perfil
                  </button>
                  {isAdminRole(user.rol) && (
                    <button
                      onClick={() => { setMenuOpen(false); onOpenAdmin?.(); }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left gc-focus gc-tap"
                      style={{ color: C.bright, borderTop: `1px solid ${C.border}` }}
                    >
                      <ShieldCheck size={15} color={C.muted} /> Panel admin
                    </button>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); setLogoutConfirmOpen(true); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left gc-focus gc-tap"
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
              onClick={() => onAuthModalChange('login')}
              className="px-3 py-1.5 rounded-full text-xs font-semibold gc-focus gc-tap"
              style={{ backgroundColor: 'transparent', border: `1px solid ${C.border}`, color: C.bright }}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => onAuthModalChange('register')}
              className="px-3 py-1.5 rounded-full text-xs font-semibold gc-focus gc-tap"
              style={{ backgroundColor: C.brand, color: C.bright }}
            >
              Registrarse
            </button>
          </div>
        )}

        <button
          onClick={() => onOpenStats?.()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold gc-focus gc-tap shrink-0"
          style={{ backgroundColor: 'transparent', color: C.muted }}
        >
          <Activity size={13} /> Estadísticas
        </button>

        <button
          onClick={() => onOpenAbout?.()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold gc-focus gc-tap shrink-0"
          style={{ backgroundColor: 'transparent', color: C.muted }}
        >
          <Info size={13} /> Acerca de
        </button>
      </div>
    </div>

    {authModal === 'login' && (
      <LoginModal onClose={() => onAuthModalChange(null)} onSwitchToRegister={() => onAuthModalChange('register')} onSuccess={onAuthSuccess} />
    )}
    {authModal === 'register' && (
      <RegisterModal onClose={() => onAuthModalChange(null)} onSwitchToLogin={() => onAuthModalChange('login')} onSuccess={onAuthSuccess} />
    )}
    {logoutConfirmOpen && (
      <LogoutConfirmModal
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={() => { setLogoutConfirmOpen(false); logout(); }}
      />
    )}
    </>
  );
}
