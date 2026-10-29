import ConfirmModal from '../ConfirmModal';
import { useEffect, useMemo, useState } from 'react';
import { X, AlertCircle, Camera, ChevronDown, Plus, Trash2, Sparkles } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../../theme';
import adminService from '../../services/adminService';
import clubService from '../../services/clubService';
import ClubPicker from '../ClubPicker';
import ComboInput from '../ComboInput';
import { plain, uniqueSorted, canonical } from '../../utils/text';

const PROVINCE_OWNER = 'province';

const MAX_PHOTOS = 4;
const SURFACES = [['', 'Sin dato'], ['natural', 'Césped natural'], ['sintetico', 'Césped sintético'], ['hibrido', 'Híbrido']];
const STATUSES = [['', 'Sin dato'], ['activo', 'Activo'], ['en_obra', 'En obra'], ['demolido', 'Demolido']];

const emptyForm = {
  name: '', capacity: '', city: '', province: '', country: '',
  lat: '', lng: '', mainClub: '',
  nickname: '', openedYear: '', surface: '', status: '', pitchLength: '', pitchWidth: '',
  otherUses: '', history: '', funFacts: '',
};

const fieldStyle = { backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright };
const fieldClass = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus';

// Una línea por elemento en el textarea; al guardar se vuelve lista
const toLines = (list) => (list || []).join('\n');
const fromLines = (text) => text.split('\n').map((line) => line.trim()).filter(Boolean);

// Fotos del estadio: la primera es la portada. Un estadio viejo con solo imageUrl arranca con esa foto.
function toPhotoState(stadium) {
  const photos = stadium?.photos?.length ? stadium.photos : (stadium?.imageUrl ? [{ url: stadium.imageUrl, credit: '' }] : []);
  return photos.map((photo) => ({ url: photo.url, credit: photo.credit || '', file: null, preview: photo.url }));
}

// Sección plegable del formulario
function Section({ title, open, onToggle, children }) {
  return (
    <div className="rounded-2xl" style={{ border: `1px solid ${C.border}` }}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full flex items-center justify-between px-4 py-3 gc-focus rounded-2xl">
        <span className="text-sm font-semibold" style={{ color: C.bright }}>{title}</span>
        <ChevronDown size={16} color={C.muted} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-4">{children}</div>}
    </div>
  );
}

function toFormState(stadium) {
  if (!stadium) return emptyForm;
  return {
    name: stadium.name || '',
    capacity: stadium.capacity ?? '',
    city: stadium.location?.city || '',
    province: stadium.location?.province || '',
    country: stadium.location?.country || '',
    lat: stadium.location?.coordinates?.lat ?? '',
    lng: stadium.location?.coordinates?.lng ?? '',
    // Valor del selector de dueño: 'province', id del club, o '' (sin club)
    mainClub: stadium.ownerType === 'province' ? PROVINCE_OWNER : (stadium.mainClub?._id ?? stadium.mainClub ?? ''),
    nickname: stadium.nickname || '',
    openedYear: stadium.openedYear ?? '',
    surface: stadium.surface || '',
    status: stadium.status || '',
    pitchLength: stadium.pitch?.length ?? '',
    pitchWidth: stadium.pitch?.width ?? '',
    otherUses: toLines(stadium.otherUses),
    history: stadium.history || '',
    funFacts: toLines(stadium.funFacts),
  };
}

export default function StadiumFormModal({ stadium, draft, stadiums = [], onClose, onSaved }) {
  const [form, setForm] = useState(() => toFormState(stadium));
  const [clubs, setClubs] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState(() => toPhotoState(stadium));
  const [openSections, setOpenSections] = useState(['basic']);
  const isEditing = Boolean(stadium);

  // Pasa la sugerencia de Wikidata al formulario, pero solo en los campos vacíos: no pisa lo ya cargado.
  // El admin la revisa en pantalla y recién se guarda cuando aprieta "Guardar cambios".
  const suggestions = draft ? ['nickname', 'openedYear', 'status', 'history'].filter((key) => draft[key] && form[key] === '') : [];
  function applyDraft() {
    setForm((prev) => Object.fromEntries(Object.entries(prev).map(([key, value]) => [key, suggestions.includes(key) ? draft[key] : value])));
    setOpenSections((prev) => [...new Set([...prev, 'identity', 'history'])]);
  }

  const toggleSection = (id) => setOpenSections((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const showSection = (id) => setOpenSections((prev) => (prev.includes(id) ? prev : [...prev, id]));

  // index === null agrega una foto nueva; si no, reemplaza la de esa posición
  function handlePhotoFile(e, index) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const next = { url: '', credit: '', file, preview: URL.createObjectURL(file) };
    setPhotos((prev) => (index === null ? [...prev, next] : prev.map((p, i) => (i === index ? { ...next, credit: p.credit } : p))));
  }
  const updatePhoto = (index, changes) => setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, ...changes } : p)));
  const removePhoto = (index) => setPhotos((prev) => prev.filter((_, i) => i !== index));
  const makeCover = (index) => setPhotos((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);

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

  // Opciones de los menús de lugar: salen de los estadios ya cargados, así un lugar nuevo queda como opción
  // apenas se crea el estadio. En cascada: las provincias son las del país elegido y las ciudades, las de esa provincia.
  const countryOptions = useMemo(() => uniqueSorted(stadiums.map((s) => s.location?.country)), [stadiums]);
  const inCountry = useMemo(
    () => stadiums.filter((s) => !form.country.trim() || plain(s.location?.country) === plain(form.country)),
    [stadiums, form.country],
  );
  const provinceOptions = useMemo(() => uniqueSorted(inCountry.map((s) => s.location?.province)), [inCountry]);
  const cityOptions = useMemo(
    () => uniqueSorted(
      inCountry
        .filter((s) => !form.province.trim() || plain(s.location?.province) === plain(form.province))
        .map((s) => s.location?.city),
    ),
    [inCountry, form.province],
  );

  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setConfirmOpen(true);
  }

  async function save() {
    setError('');

    const payload = {
      name: form.name.trim(),
      capacity: Number(form.capacity),
      location: {
        // Si coincide con un lugar existente (sin importar mayúsculas ni acentos) se usa tal como está escrito allí
        city: canonical(form.city, cityOptions),
        province: canonical(form.province, provinceOptions),
        country: canonical(form.country, countryOptions),
        coordinates: { lat: Number(form.lat), lng: Number(form.lng) },
      },
      ownerType: form.mainClub === PROVINCE_OWNER ? 'province' : 'club',
      mainClub: form.mainClub && form.mainClub !== PROVINCE_OWNER ? form.mainClub : null,
      nickname: form.nickname.trim(),
      openedYear: form.openedYear === '' ? null : Number(form.openedYear),
      surface: form.surface,
      status: form.status,
      pitch: {
        length: form.pitchLength === '' ? null : Number(form.pitchLength),
        width: form.pitchWidth === '' ? null : Number(form.pitchWidth),
      },
      otherUses: fromLines(form.otherUses),
      history: form.history.trim(),
      funFacts: fromLines(form.funFacts),
      ...(draft && { clearDraft: true }), // al guardar se da por revisada la sugerencia de Wikidata
    };

    const { lat, lng } = payload.location.coordinates;
    if (!payload.name || !payload.capacity || !payload.location.city || !payload.location.country || Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Completá nombre, capacidad, ciudad, país y coordenadas válidas.');
      showSection('basic');
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('La latitud debe estar entre -90 y 90, y la longitud entre -180 y 180.');
      showSection('basic');
      return;
    }

    setSubmitting(true);
    try {
      // Se suben las fotos nuevas en orden; el servidor toma la primera como portada
      const uploaded = [];
      for (const photo of photos) {
        const url = photo.file ? await adminService.uploadStadiumImage(photo.file) : photo.url;
        uploaded.push({ url, credit: photo.credit.trim() });
      }
      payload.photos = uploaded;
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

        {confirmOpen && (
          <ConfirmModal
            title="¿Guardar cambios en el estadio?"
            message="Los cambios se ven en el mapa para todos los usuarios."
            confirmLabel="Guardar cambios"
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

          {draft && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm" style={{ backgroundColor: rgba(C.gold, 0.1), border: `1px solid ${rgba(C.gold, 0.4)}`, color: C.gold }}>
              <Sparkles size={15} className="shrink-0" />
              <span className="flex-1">
                {suggestions.length
                  ? 'Wikidata sugiere datos para este estadio. Solo se completan los campos vacíos.'
                  : 'Wikidata no trae nada nuevo para los campos vacíos. Al guardar se da por revisada.'}
              </span>
              {suggestions.length > 0 && (
                <button type="button" onClick={applyDraft} className="px-3 py-1 rounded-lg text-xs font-semibold gc-focus" style={{ backgroundColor: C.gold, color: C.bg }}>
                  Aplicar
                </button>
              )}
            </div>
          )}

          <Section title="Básico" open={openSections.includes('basic')} onToggle={() => toggleSection('basic')}>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: C.muted }}>Nombre del estadio</span>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
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
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>Dueño</span>
                <ClubPicker
                  value={form.mainClub}
                  onChange={(v) => update('mainClub', v)}
                  placeholder="Sin club"
                  options={[
                    { value: '', label: 'Sin club' },
                    { value: PROVINCE_OWNER, label: 'Propiedad de la provincia o ciudad' },
                    ...clubs.map((club) => ({ value: club.id ?? club._id, label: club.name, logoUrl: club.logoUrl })),
                  ]}
                />
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: C.muted }}>País</span>
              <ComboInput
                value={form.country}
                onChange={(v) => update('country', v)}
                options={countryOptions}
                placeholder="Elegí o escribí un país"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>Provincia/estado/región (opcional)</span>
                <ComboInput
                  value={form.province}
                  onChange={(v) => update('province', v)}
                  options={provinceOptions}
                  placeholder="Vacío si está en una ciudad, como CABA"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>Ciudad</span>
                <ComboInput
                  value={form.city}
                  onChange={(v) => update('city', v)}
                  options={cityOptions}
                  placeholder="Elegí o escribí una ciudad"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>Latitud</span>
                <input
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={(e) => update('lat', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>Longitud</span>
                <input
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={(e) => update('lng', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none gc-focus"
                  style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.bright }}
                />
              </label>
            </div>
          </Section>

          <Section title="Identidad y cancha" open={openSections.includes('identity')} onToggle={() => toggleSection('identity')}>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>Apodo</span>
                <input maxLength={80} value={form.nickname} onChange={(e) => update('nickname', e.target.value)} className={fieldClass} style={fieldStyle} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>Año de inauguración</span>
                <input type="number" min="1800" value={form.openedYear} onChange={(e) => update('openedYear', e.target.value)} className={fieldClass} style={fieldStyle} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>Estado</span>
                <select value={form.status} onChange={(e) => update('status', e.target.value)} className={fieldClass} style={fieldStyle}>
                  {STATUSES.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>Superficie</span>
                <select value={form.surface} onChange={(e) => update('surface', e.target.value)} className={fieldClass} style={fieldStyle}>
                  {SURFACES.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>Largo de la cancha (m)</span>
                <input type="number" min="50" max="150" step="any" value={form.pitchLength} onChange={(e) => update('pitchLength', e.target.value)} className={fieldClass} style={fieldStyle} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium" style={{ color: C.muted }}>Ancho de la cancha (m)</span>
                <input type="number" min="30" max="100" step="any" value={form.pitchWidth} onChange={(e) => update('pitchWidth', e.target.value)} className={fieldClass} style={fieldStyle} />
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: C.muted }}>Otros usos (uno por línea)</span>
              <textarea rows={3} value={form.otherUses} onChange={(e) => update('otherUses', e.target.value)} placeholder="Selección argentina&#10;Recitales" className={`${fieldClass} resize-y`} style={fieldStyle} />
            </label>
          </Section>

          <Section title="Historia" open={openSections.includes('history')} onToggle={() => toggleSection('history')}>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: C.muted }}>Historia</span>
              <textarea rows={5} value={form.history} onChange={(e) => update('history', e.target.value)} placeholder="Contá cómo nació y qué marcó al estadio" className={`${fieldClass} resize-y`} style={fieldStyle} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: C.muted }}>Datos curiosos (uno por línea)</span>
              <textarea rows={4} value={form.funFacts} onChange={(e) => update('funFacts', e.target.value)} placeholder="" className={`${fieldClass} resize-y`} style={fieldStyle} />
            </label>
          </Section>

          <Section title={`Fotos (${photos.length}/${MAX_PHOTOS})`} open={openSections.includes('photos')} onToggle={() => toggleSection('photos')}>
            <p className="text-xs" style={{ color: C.muted }}>La primera foto es la portada: es la que se ve en el mapa y en las listas.</p>
            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo, index) => (
                <div key={photo.preview} className="flex flex-col gap-1.5">
                  <label className="relative cursor-pointer gc-focus rounded-xl overflow-hidden aspect-video" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                    <img src={photo.preview} alt={`Foto ${index + 1} del estadio`} className="w-full h-full object-cover" />
                    {index === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: C.brand, color: C.bright }}>Portada</span>
                    )}
                    <span className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                      <Camera size={12} color={C.bright} />
                    </span>
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoFile(e, index)} className="hidden" />
                  </label>
                  <input
                    value={photo.credit}
                    onChange={(e) => updatePhoto(index, { credit: e.target.value })}
                    maxLength={100}
                    placeholder="Crédito (ej: Foto: Ana Pérez)"
                    className={fieldClass}
                    style={fieldStyle}
                  />
                  <div className="flex items-center justify-between text-xs">
                    {index > 0 ? (
                      <button type="button" onClick={() => makeCover(index)} className="gc-focus rounded" style={{ color: C.brandBright }}>Hacer portada</button>
                    ) : <span />}
                    <button type="button" onClick={() => removePhoto(index)} aria-label={`Quitar foto ${index + 1}`} className="gc-focus rounded p-1">
                      <Trash2 size={14} color="#f85149" />
                    </button>
                  </div>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="cursor-pointer gc-focus rounded-xl aspect-video flex flex-col items-center justify-center gap-1 text-xs" style={{ border: `1px dashed ${C.border}`, color: C.muted }}>
                  <Plus size={18} />
                  Agregar foto
                  <input type="file" accept="image/*" onChange={(e) => handlePhotoFile(e, null)} className="hidden" />
                </label>
              )}
            </div>
          </Section>

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
