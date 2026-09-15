import { useEffect, useState } from 'react';
import { X, Camera, AlertCircle, Shield } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import userService from '../services/userService';
import clubService from '../services/clubService';

function initialsOf(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

export default function EditProfileModal({ profile, onClose, onSaved }) {
  const [bio, setBio] = useState(profile?.bio || '');
  const [clubId, setClubId] = useState(profile?.clubHincha?.id ?? profile?.clubHincha?._id ?? '');
  const [clubs, setClubs] = useState([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState(profile?.avatarUrl || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    clubService.getAll()
      .then((data) => { if (!cancelled) setClubs(data); })
      .catch(() => { if (!cancelled) setClubs([]); })
      .finally(() => { if (!cancelled) setClubsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const updated = await userService.updateProfile({ bio, avatarFile, clubHincha: clubId });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos guardar los cambios. Probá de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  const displayName = profile?.nombre || profile?.username || '';

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 gc-overlay" style={{ backgroundColor: rgba('#000000', 0.6) }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl overflow-y-auto gc-hide-scrollbar"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-3xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>Editar perfil</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center gc-focus" style={{ backgroundColor: C.surface }}>
            <X size={16} color={C.bright} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-6 pt-4 space-y-4">
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm" style={{ backgroundColor: rgba('#f85149', 0.12), border: `1px solid ${rgba('#f85149', 0.4)}`, color: '#f85149' }}>
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col items-center gap-2">
            <label className="relative cursor-pointer gc-focus" style={{ borderRadius: '9999px' }}>
              {preview ? (
                <img src={preview} alt="Avatar" className="w-20 h-20 rounded-full object-cover" style={{ backgroundColor: C.surface }} />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: C.brand, color: C.bright, fontFamily: DISPLAY_FONT }}>
                  {initialsOf(displayName)}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <Camera size={13} color={C.bright} />
              </span>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
            <span className="text-xs" style={{ color: C.muted }}>Tocá el avatar para cambiar tu foto</span>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Contá algo sobre vos..."
              rows={4}
              maxLength={280}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none gc-focus"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
            />
            <span className="text-xs text-right" style={{ color: C.muted }}>{bio.length}/280</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>¿De qué club sos hincha?</span>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <Shield size={15} color={C.muted} />
              <select
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
                disabled={clubsLoading}
                className="bg-transparent outline-none text-sm flex-1 gc-focus"
                style={{ color: C.bright, colorScheme: 'dark' }}
              >
                <option value="" style={{ backgroundColor: C.surface }}>
                  {clubsLoading ? 'Cargando clubes...' : 'Sin club'}
                </option>
                {clubs.map((club) => (
                  <option key={club.id ?? club._id} value={club.id ?? club._id} style={{ backgroundColor: C.surface }}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-semibold text-sm gc-focus"
            style={{ backgroundColor: C.brand, color: C.bright, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
