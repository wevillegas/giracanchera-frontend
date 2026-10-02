import { useEffect, useState } from 'react';
import { ChevronLeft, MapPin, Edit3, Users, UserPlus, Star, AlertCircle, Mail, Cake, Heart, Pencil, Trash2, Search, Check } from 'lucide-react';
import { C, DISPLAY_FONT } from '../theme';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import visitService from '../services/visitService';
import StadiumArt from './StadiumArt';
import EditProfileModal from './EditProfileModal';
import Navbar from './Navbar';

function initialsOf(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

function formatBirthDate(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

function formatVisitDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

function AddFriendBox({ myFriendIds, onFriendAdded, onToast }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      userService.searchUsers(query.trim())
        .then((data) => { if (!cancelled) setResults(data); })
        .catch(() => { if (!cancelled) setResults([]); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [query]);

  async function handleAdd(userId) {
    setAddingId(userId);
    try {
      await userService.addFriend(userId);
      onFriendAdded(userId);
      onToast?.('¡Ahora son amigos!');
    } catch {
      onToast?.('No pudimos agregar a este usuario. Probá de nuevo.');
    } finally {
      setAddingId(null);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium gc-focus"
        style={{ color: C.brandBright }}
      >
        <UserPlus size={13} /> Agregar amigo
      </button>
    );
  }

  return (
    <div className="rounded-2xl p-3 mt-2" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
        <Search size={14} color={C.muted} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por usuario..."
          className="bg-transparent outline-none text-sm flex-1 gc-focus"
          style={{ color: C.bright }}
        />
      </div>

      {searching && <p className="text-xs mt-2" style={{ color: C.muted }}>Buscando...</p>}

      {!searching && results.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {results.map((u) => {
            const isFriend = myFriendIds.has(u._id);
            return (
              <div key={u._id} className="flex items-center gap-2 px-2 py-1.5 rounded-xl" style={{ backgroundColor: C.bg }}>
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt={u.username} className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: C.brand, color: C.bright }}>
                    {initialsOf(u.username)}
                  </div>
                )}
                <span className="text-sm flex-1 truncate" style={{ color: C.bright }}>@{u.username}</span>
                {isFriend ? (
                  <span className="flex items-center gap-1 text-xs" style={{ color: C.muted }}>
                    <Check size={12} /> Ya son amigos
                  </span>
                ) : (
                  <button
                    onClick={() => handleAdd(u._id)}
                    disabled={addingId === u._id}
                    className="text-xs font-semibold gc-focus"
                    style={{ color: C.brandBright, opacity: addingId === u._id ? 0.6 : 1 }}
                  >
                    Agregar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!searching && query.trim() && results.length === 0 && (
        <p className="text-xs mt-2" style={{ color: C.muted }}>No encontramos usuarios con ese nombre.</p>
      )}

      <button onClick={() => { setOpen(false); setQuery(''); }} className="text-xs mt-2 gc-focus" style={{ color: C.muted }}>
        Cerrar
      </button>
    </div>
  );
}

export default function ProfileView({
  stadiums, onBackToMap, onOpenStadiumFromId, onEditVisit, onToast,
  visitsVersion, onRequireLogin, navbarProps,
}) {
  const { token, user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [visits, setVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(true);

  const [viewFriendId, setViewFriendId] = useState(null);
  const [friendProfile, setFriendProfile] = useState(null);
  const [friendVisits, setFriendVisits] = useState([]);
  const [friendLoading, setFriendLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      onRequireLogin?.();
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    userService.getProfile()
      .then((data) => { if (!cancelled) setProfile(data); })
      .catch((err) => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!user?._id) return;

    let cancelled = false;
    setVisitsLoading(true);
    visitService.getUserVisits(user._id)
      .then((data) => { if (!cancelled) setVisits(data); })
      .catch(() => { if (!cancelled) setVisits([]); })
      .finally(() => { if (!cancelled) setVisitsLoading(false); });

    return () => { cancelled = true; };
  }, [user?._id, visitsVersion]);

  useEffect(() => {
    if (!viewFriendId) {
      setFriendProfile(null);
      setFriendVisits([]);
      return;
    }

    let cancelled = false;
    setFriendLoading(true);
    Promise.all([
      userService.getPublicProfile(viewFriendId),
      visitService.getUserVisits(viewFriendId),
    ])
      .then(([profileData, visitsData]) => {
        if (cancelled) return;
        setFriendProfile(profileData);
        setFriendVisits(visitsData);
      })
      .catch(() => { if (!cancelled) onToast?.('No pudimos cargar ese perfil.'); })
      .finally(() => { if (!cancelled) setFriendLoading(false); });

    return () => { cancelled = true; };
  }, [viewFriendId, onToast]);

  async function handleDeleteVisit(visitId) {
    if (!window.confirm('¿Eliminar esta visita de tu bitácora?')) return;
    try {
      await visitService.deleteVisit(visitId);
      setVisits((prev) => prev.filter((v) => v._id !== visitId));
      onToast?.('Visita eliminada');
    } catch {
      onToast?.('No pudimos eliminar la visita. Probá de nuevo.');
    }
  }

  if (!token) return null;

  if (loading) {
    return (
      <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
        <Navbar {...navbarProps} />
        <div className="max-w-2xl mx-auto px-4 pt-32 pb-6 animate-pulse">
          <div className="flex flex-col items-center mt-4 gap-3">
            <div className="w-20 h-20 rounded-full" style={{ backgroundColor: C.surface }} />
            <div className="h-6 w-40 rounded" style={{ backgroundColor: C.surface }} />
            <div className="h-4 w-56 rounded" style={{ backgroundColor: C.surface }} />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 rounded-2xl" style={{ backgroundColor: C.surface }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex-1 overflow-hidden">
        <Navbar {...navbarProps} />
        <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center" style={{ color: C.muted }}>
          <AlertCircle size={24} />
          <p>No pudimos cargar tu perfil.</p>
          <button
            onClick={onBackToMap}
            className="px-4 py-2 rounded-xl text-sm font-semibold gc-focus"
            style={{ backgroundColor: C.brand, color: C.bright }}
          >
            Volver al mapa
          </button>
        </div>
      </div>
    );
  }

  const isOwn = !viewFriendId;
  const displayedProfile = isOwn ? profile : friendProfile;
  const displayedVisits = isOwn ? visits : friendVisits;
  const displayedVisitsLoading = isOwn ? visitsLoading : friendLoading;
  const myFriendIds = new Set((profile?.friends || []).map((f) => f._id || f));
  const isAlreadyFriend = !isOwn && myFriendIds.has(viewFriendId);

  const visitedCount = new Set(displayedVisits.map((v) => v.stadium?._id).filter(Boolean)).size;
  const wantToVisitIds = new Set((displayedProfile?.wantToVisit || []).map((s) => s._id || s));
  const wishlistStadiums = stadiums.filter((s) => wantToVisitIds.has(s.id));
  const displayName = displayedProfile?.nombre || displayedProfile?.username || 'Sin nombre';
  const bio = displayedProfile?.bio?.trim() || (isOwn ? 'Todavía no escribiste una bio.' : 'Todavía no escribió una bio.');
  const club = displayedProfile?.clubHincha;
  const birthDate = formatBirthDate(displayedProfile?.fechaNacimiento);

  if (!isOwn && friendLoading) {
    return (
      <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
        <Navbar {...navbarProps} />
        <div className="max-w-2xl mx-auto px-4 pt-32 pb-6 flex items-center justify-center" style={{ color: C.muted }}>
          Cargando perfil...
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
      <Navbar {...navbarProps} />
      <div className="max-w-2xl mx-auto px-4 pt-32 pb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => (isOwn ? onBackToMap() : setViewFriendId(null))}
            className="flex items-center gap-1.5 text-sm gc-focus"
            style={{ color: C.muted }}
          >
            <ChevronLeft size={16} /> {isOwn ? 'Mapa' : 'Mi perfil'}
          </button>
        </div>

        <div className="flex flex-col items-center text-center mt-4">
          {displayedProfile?.avatarUrl ? (
            <img src={displayedProfile.avatarUrl} alt={displayName} className="w-20 h-20 rounded-full object-cover" style={{ backgroundColor: C.surface }} />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: C.brand, color: C.bright, fontFamily: DISPLAY_FONT }}>
              {initialsOf(displayName)}
            </div>
          )}
          <h1 className="text-2xl mt-3" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>
            {displayName}
          </h1>
          {displayedProfile?.username && (
            <p className="text-xs" style={{ color: C.muted }}>@{displayedProfile.username}</p>
          )}
          <p className="text-sm mt-1 max-w-xs" style={{ color: C.muted }}>{bio}</p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            {isOwn && displayedProfile?.email && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>
                <Mail size={12} /> {displayedProfile.email}
              </span>
            )}
            {birthDate && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>
                <Cake size={12} /> {birthDate}
              </span>
            )}
          </div>

          {club && (
            <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.brandBright }}>
              {club.logoUrl ? (
                <img src={club.logoUrl} alt={club.name} className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <Star size={12} />
              )}
              Hincha de {club.name}
            </div>
          )}

          {isOwn ? (
            <button
              onClick={() => setEditOpen(true)}
              className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold gc-focus flex items-center gap-1.5"
              style={{ border: `1px solid ${C.border}`, color: C.bright }}
            >
              <Edit3 size={14} /> Editar perfil
            </button>
          ) : (
            <button
              onClick={() => !isAlreadyFriend && userService.addFriend(viewFriendId).then(() => {
                setProfile((p) => ({ ...p, friends: [...(p.friends || []), viewFriendId] }));
                onToast?.('¡Ahora son amigos!');
              }).catch(() => onToast?.('No pudimos agregar a este usuario.'))}
              disabled={isAlreadyFriend}
              className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold gc-focus flex items-center gap-1.5"
              style={{
                backgroundColor: isAlreadyFriend ? 'transparent' : C.brand,
                border: isAlreadyFriend ? `1px solid ${C.border}` : 'none',
                color: C.bright,
              }}
            >
              {isAlreadyFriend ? <><Check size={15} /> Ya son amigos</> : <><UserPlus size={15} /> Agregar amigo</>}
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-8">
          {[
            { label: 'Estadios', value: visitedCount, Icon: MapPin },
            { label: 'Reseñas', value: displayedVisits.length, Icon: Edit3 },
            { label: 'Amigos', value: displayedProfile?.friends?.length ?? 0, Icon: Users },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="flex flex-col items-center py-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <span className="text-3xl" style={{ fontFamily: DISPLAY_FONT, color: C.brandBright }}>{value}</span>
              <span className="text-xs mt-1 flex items-center gap-1" style={{ color: C.muted }}>
                <Icon size={12} /> {label}
              </span>
            </div>
          ))}
        </div>

        {isOwn && (
          <div className="mt-6">
            <AddFriendBox
              myFriendIds={myFriendIds}
              onFriendAdded={(id) => setProfile((p) => ({ ...p, friends: [...(p.friends || []), id] }))}
              onToast={onToast}
            />
          </div>
        )}

        {isOwn && (profile?.friends?.length > 0) && (
          <>
            <h2 className="text-lg font-semibold mt-6 mb-3" style={{ color: C.bright }}>Amigos</h2>
            <div className="flex flex-wrap gap-2">
              {profile.friends.map((f) => (
                <button
                  key={f._id || f}
                  onClick={() => setViewFriendId(f._id || f)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full gc-focus"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
                >
                  {f.avatarUrl ? (
                    <img src={f.avatarUrl} alt={f.username} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: C.brand, color: C.bright }}>
                      {initialsOf(f.username || '?')}
                    </div>
                  )}
                  <span className="text-xs" style={{ color: C.bright }}>@{f.username || '...'}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <h2 className="text-lg font-semibold mt-8 mb-3" style={{ color: C.bright }}>Bitácora</h2>
        {displayedVisitsLoading ? (
          <div className="grid grid-cols-2 gap-3 animate-pulse">
            {[0, 1].map((i) => (
              <div key={i} className="h-36 rounded-2xl" style={{ backgroundColor: C.surface }} />
            ))}
          </div>
        ) : displayedVisits.length === 0 ? (
          <p className="text-sm" style={{ color: C.muted }}>
            {isOwn ? 'Todavía no registraste ninguna visita.' : 'Todavía no registró ninguna visita.'}
          </p>
        ) : (
        <div className="grid grid-cols-2 gap-3">
          {displayedVisits.map((v, i) => {
            const stadiumId = v.stadium?._id;
            return (
              <div key={v._id} className="rounded-2xl overflow-hidden" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <StadiumArt tone={i % 2 === 0 ? 'brand' : 'gold'} uid={v._id} className="w-full h-20" />
                <div className="p-3">
                  <button
                    onClick={() => stadiumId && onOpenStadiumFromId(stadiumId)}
                    disabled={!stadiumId}
                    className="text-sm font-semibold truncate text-left w-full gc-focus"
                    style={{ color: C.bright, cursor: stadiumId ? 'pointer' : 'default' }}
                  >
                    {v.stadium?.name || 'Estadio'}
                  </button>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} fill={C.gold} color={C.gold} />
                    <span className="text-xs font-medium" style={{ color: C.gold }}>{v.rating}/10</span>
                    <span className="text-xs ml-auto" style={{ color: C.muted }}>{formatVisitDate(v.visitDate)}</span>
                  </div>
                  <p
                    className="text-xs mt-2 leading-snug"
                    style={{ color: C.muted, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {v.reviewText?.trim() || 'Sin reseña escrita todavía.'}
                  </p>
                  {isOwn && (
                    <div className="flex items-center gap-3 mt-2.5 pt-2.5" style={{ borderTop: `1px solid ${C.border}` }}>
                      <button
                        onClick={() => onEditVisit(v)}
                        className="flex items-center gap-1 text-xs font-medium gc-focus"
                        style={{ color: C.brandBright }}
                      >
                        <Pencil size={12} /> Editar
                      </button>
                      <button
                        onClick={() => handleDeleteVisit(v._id)}
                        className="flex items-center gap-1 text-xs font-medium gc-focus"
                        style={{ color: '#f85149' }}
                      >
                        <Trash2 size={12} /> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}

        <h2 className="text-lg font-semibold mt-8 mb-3" style={{ color: C.bright }}>Por visitar</h2>
        {wishlistStadiums.length === 0 ? (
          <p className="text-sm" style={{ color: C.muted }}>
            {isOwn ? 'Todavía no agregaste estadios a tu lista.' : 'Todavía no agregó estadios a su lista.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {wishlistStadiums.map((s) => (
              <button
                key={s.id}
                onClick={() => onOpenStadiumFromId(s.id)}
                className="rounded-2xl overflow-hidden text-left gc-focus"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
              >
                <StadiumArt tone={s.tone} uid={s.id} className="w-full h-20" />
                <div className="p-3">
                  <p className="text-sm font-semibold truncate" style={{ color: C.bright }}>{s.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Heart size={12} fill={C.gold} color={C.gold} />
                    <span className="text-xs" style={{ color: C.muted }}>{s.club}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {editOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            setProfile(updated);
            updateUser({ avatarUrl: updated.avatarUrl, bio: updated.bio, clubHincha: updated.clubHincha });
          }}
        />
      )}
    </div>
  );
}
