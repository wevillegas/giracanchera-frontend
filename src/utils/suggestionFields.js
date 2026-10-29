const SURFACES = [['natural', 'Césped natural'], ['sintetico', 'Césped sintético'], ['hibrido', 'Césped híbrido']];
const STATUSES = [['activo', 'Activo'], ['en_obra', 'En obra'], ['demolido', 'Demolido']];

// Datos que un usuario puede sugerir corregir; las claves coinciden con las del backend
export const SUGGESTION_FIELDS = [
  { key: 'nickname', label: 'Apodo', type: 'text' },
  { key: 'openedYear', label: 'Año de inauguración', type: 'number' },
  { key: 'surface', label: 'Superficie', type: 'select', options: SURFACES },
  { key: 'status', label: 'Estado', type: 'select', options: STATUSES },
  { key: 'pitchLength', label: 'Largo de la cancha (m)', type: 'number' },
  { key: 'pitchWidth', label: 'Ancho de la cancha (m)', type: 'number' },
  { key: 'capacity', label: 'Capacidad', type: 'number' },
  { key: 'history', label: 'Historia', type: 'textarea' },
  { key: 'other', label: 'Otro dato incorrecto', type: 'textarea' },
];

export const fieldLabel = (key) => SUGGESTION_FIELDS.find((f) => f.key === key)?.label ?? key;

// Texto legible de un valor de ese dato (p. ej. 'natural' → 'Césped natural')
export function displayValue(key, value) {
  if (value === undefined || value === null || value === '') return 'Sin dato';
  return SUGGESTION_FIELDS.find((f) => f.key === key)?.options?.find(([v]) => v === value)?.[1] ?? String(value);
}

// Valor que tiene hoy el estadio (forma cruda del backend) para ese dato, para comparar en el panel
export function currentValue(stadium, key) {
  return displayValue(key, { pitchLength: stadium?.pitch?.length, pitchWidth: stadium?.pitch?.width }[key] ?? stadium?.[key]);
}
