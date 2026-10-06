import ConfirmModal from './ConfirmModal';
import { useEffect, useState } from 'react';
import { X, Camera, AlertCircle, Trash2 } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import userService from '../services/userService';
import clubService from '../services/clubService';
import ClubPicker from './ClubPicker';

function initialsOf(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

export default function EditProfileModal({ profile, onClose, onSaved, onAccountDeleted }) {
  const [bio, setBio] = useState(profile?.bio || '');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError('');
    try {
      await userService.deleteAccount(deletePassword);
      onAccountDeleted?.();
      onClose();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'No pudimos eliminar la cuenta. Probá de nuevo.');
    } finally {
      setDeleting(false);
    }
  }
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

  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setConfirmOpen(true);
  }

  async function save() {
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

        {confirmOpen && (
          <ConfirmModal
            title="¿Guardar cambios en tu perfil?"
            message="Se van a actualizar los datos que ven otros hinchas."
            confirmLabel="Guardar"
            onConfirm={() => { setConfirmOpen(false); save(); }}
            onCancel={() => setConfirmOpen(false)}
          />
        )}
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
            <ClubPicker
              value={clubId}
              onChange={setClubId}
              options={[{ value: '', label: 'Sin club' }, ...clubs.map((club) => ({ value: club.id ?? club._id, label: club.name, logoUrl: club.logoUrl }))]}
              placeholder={clubsLoading ? 'Cargando clubes...' : 'Sin club'}
              disabled={clubsLoading}
            />
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

        <div className="px-5 pb-6 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
          {!deleteOpen ? (
            <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-1.5 text-xs font-medium gc-focus" style={{ color: '#f85149' }}>
              <Trash2 size={13} /> Eliminar mi cuenta
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: C.muted }}>
                Se borran tu cuenta, tus reseñas, fotos y listas. Esta acción no se puede deshacer. Para confirmar, ingresá tu contraseña.
              </p>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Tu contraseña"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
              />
              {deleteError && <p className="text-xs" style={{ color: '#f85149' }}>{deleteError}</p>}
              <button
                onClick={handleDeleteAccount}
                disabled={!deletePassword || deleting}
                className="w-full py-2.5 rounded-xl font-semibold text-sm gc-focus disabled:opacity-40"
                style={{ backgroundColor: '#f85149', color: C.bright }}
              >
                {deleting ? 'Eliminando...' : 'Eliminar cuenta definitivamente'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
