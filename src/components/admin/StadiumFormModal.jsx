import { useEffect, useState } from 'react';
import { X, AlertCircle, Camera } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../../theme';
import adminService from '../../services/adminService';
import clubService from '../../services/clubService';

const emptyForm = {
  name: '', capacity: '', city: '', province: '', country: 'Argentina',
  lat: '', lng: '', mainClub: '', imageUrl: '',
};

function toFormState(stadium) {
  if (!stadium) return emptyForm;
  return {
    name: stadium.name || '',
    capacity: stadium.capacity ?? '',
    city: stadium.location?.city || '',
    province: stadium.location?.province || '',
    country: stadium.location?.country || 'Argentina',
    lat: stadium.location?.coordinates?.lat ?? '',
    lng: stadium.location?.coordinates?.lng ?? '',
    mainClub: stadium.mainClub?._id ?? stadium.mainClub ?? '',
    imageUrl: stadium.imageUrl || '',
  };
}

export default function StadiumFormModal({ stadium, onClose, onSaved }) {
  const [form, setForm] = useState(() => toFormState(stadium));
  const [clubs, setClubs] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(stadium?.imageUrl || '');
  const isEditing = Boolean(stadium);

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  useEffect(() => {
    let cancelled = false;
    clubService.getAll()
      .then((data) => { if (!cancelled) setClubs(data); })
      .catch(() => { if (!cancelled) setClubs([]); });
    return () => { cancelled = true; };
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const payload = {
      name: form.name.trim(),
      capacity: Number(form.capacity),
      location: {
        city: form.city.trim(),
        province: form.province.trim(),
        country: form.country.trim(),
        coordinates: { lat: Number(form.lat), lng: Number(form.lng) },
      },
      mainClub: form.mainClub || null,
      imageUrl: form.imageUrl.trim(),
    };

    const { lat, lng } = payload.location.coordinates;
    if (!payload.name || !payload.capacity || !payload.location.city || Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Completá nombre, capacidad, ciudad y coordenadas válidas.');
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('La latitud debe estar entre -90 y 90, y la longitud entre -180 y 180.');
      return;
    }

    setSubmitting(true);
    try {
      if (imageFile) {
        payload.imageUrl = await adminService.uploadStadiumImage(imageFile);
      }
      const saved = isEditing
        ? await adminService.updateStadium(stadium._id, payload)
        : await adminService.createStadium(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos guardar el estadio.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 gc-overlay" style={{ backgroundColor: rgba('#000000', 0.6) }} onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-3xl overflow-y-auto gc-hide-scrollbar"
        style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-3xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>
            {isEditing ? 'Editar estadio' : 'Nuevo estadio'}
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

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>Nombre del estadio</span>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: C.muted }}>Capacidad</span>
              <input
                type="number"
                min="0"
                value={form.capacity}
                onChange={(e) => update('capacity', e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: C.muted }}>Club</span>
              <select
                value={form.mainClub}
                onChange={(e) => update('mainClub', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright, colorScheme: 'dark' }}
              >
                <option value="" style={{ backgroundColor: C.surface }}>Sin club</option>
                {clubs.map((club) => (
                  <option key={club.id ?? club._id} value={club.id ?? club._id} style={{ backgroundColor: C.surface }}>
                    {club.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: C.muted }}>Ciudad</span>
              <input
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: C.muted }}>Provincia</span>
              <input
                value={form.province}
                onChange={(e) => update('province', e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>País</span>
            <input
              value={form.country}
              onChange={(e) => update('country', e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
              style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: C.muted }}>Latitud, hasta 6 decimales</span>
              <input
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => update('lat', e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: C.muted }}>Longitud, hasta 6 decimales</span>
              <input
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => update('lng', e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
                style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
              />
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: C.muted }}>Foto del estadio (16:9)</span>
            <label className="relative cursor-pointer gc-focus rounded-xl overflow-hidden aspect-video" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              {preview ? (
                <img src={preview} alt="Foto del estadio" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: C.muted }}>
                  Tocá para subir una foto
                </div>
              )}
              <span className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <Camera size={14} color={C.bright} />
              </span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl font-semibold text-sm gc-focus gc-tap"
            style={{ backgroundColor: C.brand, color: C.bright, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear estadio'}
          </button>
        </form>
      </div>
    </div>
  );
}
