import { useEffect, useRef, useState } from 'react';
import { Search, ChevronDown, User, UserPlus, LogOut, ShieldCheck, Info, Activity, Menu } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import { isAdminRole } from '../utils/roles';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import logoIcon from '../assets/giracanchera-icono.svg';
import LogoutConfirmModal from './LogoutConfirmModal';
import { Logo } from './ClubPicker';
import FilterSwitch, { FilterPills } from './FilterSwitch';
import { useLogoColors } from '../utils/logoColors';
import useClickOutside from '../utils/useClickOutside';

function initialsOf(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

const menuPanel = { backgroundColor: C.surface, border: `1px solid ${C.border}`, boxShadow: `0 12px 24px ${rgba('#000000', 0.35)}` };

function MenuItem({ Icon, children, onClick, first = false, color = C.muted, active = false }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-left gc-focus gc-tap"
      style={{ color: active ? color : C.bright, backgroundColor: active ? rgba(color, 0.14) : 'transparent', borderTop: first ? 'none' : `1px solid ${C.border}` }}
    >
      <Icon size={15} color={active ? color : C.muted} /> {children}
    </button>
  );
}

export default function Navbar({
  query, onQueryChange, filter, onFilterChange, onOpenProfile, onOpenUserProfile, onOpenAdmin, onOpenAbout, onOpenStats, searchResults = [], onSelectSearchResult, onAuthSuccess,
  authModal, onAuthModalChange,
}) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false); // menú de la cuenta
  const burgerRef = useRef(null);
  // Colores del escudo del club del usuario, para el degradado de la cabecera del menú
  const clubColors = useLogoColors(user?.clubHincha?.logoUrl);
  const [burgerOpen, setBurgerOpen] = useState(false); // celular: todo el navbar menos logo y buscador
  useClickOutside(burgerRef, burgerOpen, () => setBurgerOpen(false));
  const [moreOpen, setMoreOpen] = useState(false); // Estadísticas y Acerca de, solo para quien no inició sesión en pantallas chicas
  const menuRef = useRef(null);
  const moreRef = useRef(null);
  useClickOutside(menuRef, menuOpen, () => setMenuOpen(false));
  useClickOutside(moreRef, moreOpen, () => setMoreOpen(false));
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  // Buscador compartido: el modo decide si busca estadios (filtra el mapa) o usuarios (abre su perfil)
  const [searchMode, setSearchMode] = useState('stadiums');
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const isUsers = searchMode === 'users';
  const showResults = (isUsers ? userQuery : query).trim().length > 0;
  const choose = (action) => () => { setMenuOpen(false); setMoreOpen(false); setBurgerOpen(false); action?.(); };

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
      className="fixed top-0 left-0 right-0 z-[1000] px-4 py-3"
      style={{ backgroundColor: rgba(C.bg, 0.72), backdropFilter: 'blur(14px)', borderBottom: `1px solid ${rgba(C.border, 0.6)}` }}
    >
      <div className="max-w-[1400px] mx-auto flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => window.location.assign('/')}
          className="flex items-center gap-1.5 shrink-0 gc-focus gc-tap rounded-lg"
          aria-label="Ir al mapa"
        >
          <img src={logoIcon} alt="" className="w-8 h-8 object-contain shrink-0" />
          <span className="hidden min-[900px]:inline text-xl tracking-wide uppercase shrink-0" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>Gira<span style={{ color: C.brandBright }}>Canchera</span></span>
        </button>

        {/* Buscador */}
        <div className="relative flex-1 min-w-0 sm:max-w-md">
          <div className="gc-search-box flex items-center gap-2 rounded-full px-3 py-2" style={{ backgroundColor: C.surface }}>
            <Search size={16} color={C.muted} className="hidden sm:block shrink-0" />
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
            <div className="absolute left-0 right-0 mt-2 rounded-2xl overflow-hidden max-h-64 overflow-y-auto gc-hide-scrollbar z-10" style={menuPanel}>
              {isUsers ? renderUserResults() : searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm" style={{ color: C.muted }}>Sin resultados para "{query}"</div>
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

        <div className="hidden sm:block"><FilterSwitch filter={filter} onChange={onFilterChange} /></div>

        <div className="hidden sm:block flex-1" />

        {user ? (
          <div ref={menuRef} className="relative shrink-0 hidden sm:block">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
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
              <div className="absolute right-0 mt-2 w-48 rounded-2xl overflow-hidden" style={menuPanel}>
                <MenuItem Icon={User} first onClick={choose(onOpenProfile)}>Mi Perfil</MenuItem>
                {isAdminRole(user.rol) && <MenuItem Icon={ShieldCheck} onClick={choose(onOpenAdmin)}>Panel admin</MenuItem>}
                {/* En pantallas anchas estas dos están a la vista, fuera del menú */}
                <div className="min-[1100px]:hidden">
                  <MenuItem Icon={Activity} onClick={choose(onOpenStats)}>Estadísticas</MenuItem>
                  <MenuItem Icon={Info} onClick={choose(onOpenAbout)}>Acerca de</MenuItem>
                </div>
                <MenuItem Icon={LogOut} onClick={choose(() => setLogoutConfirmOpen(true))}>Cerrar sesión</MenuItem>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-2 shrink-0">
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
            <div ref={moreRef} className="relative min-[1100px]:hidden">
              <button
                onClick={() => setMoreOpen((v) => !v)}
                aria-label="Más secciones"
                aria-expanded={moreOpen}
                className="w-9 h-9 flex items-center justify-center rounded-full gc-focus gc-tap"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
              >
                <Menu size={18} color={C.bright} />
              </button>
              {moreOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl overflow-hidden" style={menuPanel}>
                  <MenuItem Icon={Activity} first onClick={choose(onOpenStats)}>Estadísticas</MenuItem>
                  <MenuItem Icon={Info} onClick={choose(onOpenAbout)}>Acerca de</MenuItem>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Celular: el navbar es solo logo y buscador; todo lo demás va en este menú */}
        <div ref={burgerRef} className="relative sm:hidden shrink-0">
          <button
            onClick={() => setBurgerOpen((v) => !v)}
            aria-label="Menú"
            aria-expanded={burgerOpen}
            className="w-10 h-10 flex items-center justify-center rounded-full gc-focus gc-tap"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : user ? (
              <span className="w-full h-full rounded-full flex items-center justify-center font-semibold text-sm" style={{ backgroundColor: C.brand, color: C.bright }}>
                {initialsOf(user.username || user.nombre || user.email)}
              </span>
            ) : (
              <Menu size={18} color={C.bright} />
            )}
          </button>
          {burgerOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl overflow-hidden max-h-[75vh] overflow-y-auto gc-hide-scrollbar" style={menuPanel}>
                {/* Cabecera: mini vista previa del perfil */}
                {user ? (
                  <button onClick={choose(onOpenProfile)} className="relative w-full text-left px-4 pt-4 pb-4 gc-focus" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 85% 0%, ${rgba(clubColors?.[0] ?? C.brandBright, 0.3)}, transparent 60%)` }} />
                    <div className="relative">
                      <div className="relative w-16 h-16">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" style={{ backgroundColor: C.brand }} />
                        ) : (
                          <span className="w-16 h-16 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: C.brand, color: C.bright, fontFamily: DISPLAY_FONT }}>
                            {initialsOf(user.username || user.nombre || user.email)}
                          </span>
                        )}
                        {user.clubHincha?.logoUrl && (
                          <img src={user.clubHincha.logoUrl} alt="" className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full object-cover" style={{ backgroundColor: C.surface, border: `2px solid ${C.bg}` }} />
                        )}
                      </div>
                      <p className="mt-3 text-2xl leading-none truncate" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>{user.nombre || user.username}</p>
                      <p className="text-sm mt-1 truncate" style={{ color: C.muted }}>@{user.username}</p>
                      {user.clubHincha?.name && <p className="text-xs mt-2 truncate" style={{ color: C.brandBright }}>Hincha de {user.clubHincha.name}</p>}
                      {user.bio?.trim() && (
                        <p className="text-xs mt-2" style={{ color: C.muted, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{user.bio}</p>
                      )}
                    </div>
                  </button>
                ) : (
                  <div className="px-4 pt-4 pb-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <img src={logoIcon} alt="" className="w-12 h-12 object-contain" />
                    <p className="mt-3 text-2xl leading-none uppercase" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>Gira<span style={{ color: C.brandBright }}>Canchera</span></p>
                    <p className="text-xs mt-2" style={{ color: C.muted }}>Iniciá sesión para guardar tus visitas.</p>
                  </div>
                )}

                <div className="p-3 flex justify-center" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <FilterPills filter={filter} onChange={onFilterChange} />
                </div>
                <MenuItem Icon={Activity} first onClick={choose(onOpenStats)}>Estadísticas</MenuItem>
                <MenuItem Icon={Info} onClick={choose(onOpenAbout)}>Acerca de</MenuItem>
                {user ? (
                  <>
                    <MenuItem Icon={User} onClick={choose(onOpenProfile)}>Mi Perfil</MenuItem>
                    {isAdminRole(user.rol) && <MenuItem Icon={ShieldCheck} onClick={choose(onOpenAdmin)}>Panel admin</MenuItem>}
                    <MenuItem Icon={LogOut} onClick={choose(() => setLogoutConfirmOpen(true))}>Cerrar sesión</MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem Icon={User} onClick={choose(() => onAuthModalChange('login'))}>Iniciar sesión</MenuItem>
                    <MenuItem Icon={UserPlus} onClick={choose(() => onAuthModalChange('register'))}>Registrarse</MenuItem>
                  </>
                )}
            </div>
          )}
        </div>

        <button
          onClick={() => onOpenStats?.()}
          className="hidden min-[1100px]:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold gc-focus gc-tap shrink-0"
          style={{ backgroundColor: 'transparent', color: C.muted }}
        >
          <Activity size={13} /> Estadísticas
        </button>

        <button
          onClick={() => onOpenAbout?.()}
          className="hidden min-[1100px]:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold gc-focus gc-tap shrink-0"
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
