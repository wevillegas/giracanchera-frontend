import { useState } from 'react';
import { X, AlertCircle, Camera } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../../theme';
import adminService from '../../services/adminService';

const emptyForm = { name: '', shortName: '', location: '' };

function toFormState(club) {
  if (!club) return emptyForm;
  return {
    name: club.name || '',
    shortName: club.shortName || '',
    location: club.location || '',
  };
}

export default function ClubFormModal({ club, onClose, onSaved }) {
  const [form, setForm] = useState(() => toFormState(club));
  const [logoFile, setLogoFile] = useState(null);
  const [preview, setPreview] = useState(club?.logoUrl || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(club);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const name = form.name.trim();
    if (!name) {
      setError('El nombre completo es obligatorio.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('shortName', form.shortName.trim());
    formData.append('location', form.location.trim());
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    setSubmitting(true);
    try {
      const saved = isEditing
        ? await adminService.updateClub(club._id, formData)
        : await adminService.createClub(formData);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos guardar el club.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 gc-overlay" style={{ backgroundColor: rgba('#000000', 0.6) }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl overflow-y-auto gc-hide-scrollbar"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-3xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>
            {isEditing ? 'Editar club' : 'Nuevo club'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center gc-focus gc-tap" style={{ backgroundColor: C.surface }}>
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
                <img src={preview} alt="Escudo" className="w-20 h-20 rounded-full object-cover" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }} />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-xs text-center" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>
                  Sin escudo
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <Camera size={13} color={C.bright} />
              </span>
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
            <span className="text-xs" style={{ color: C.muted }}>Tocá el escudo para subir una imagen</span>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>Nombre completo</span>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>Apodo / nombre corto</span>
            <input
              value={form.shortName}
              onChange={(e) => update('shortName', e.target.value)}
              placeholder="Ej: Boca"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>Lugar</span>
            <input
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="Ej: Buenos Aires, Argentina"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-semibold text-sm gc-focus gc-tap"
            style={{ backgroundColor: C.brand, color: C.bright, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear club'}
          </button>
        </form>
      </div>
    </div>
  );
}
