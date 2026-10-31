import { ChevronLeft, User, Star, Eye, Lock, Server, Cookie, Clock, Trash2, Link2 } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import Navbar from './Navbar';
import { card, Section, IconBadge } from './AboutView';

const LINKEDIN_URL = 'https://www.linkedin.com/in/wenceslaojosevillegas/';
const UPDATED = '31 de octubre de 2026';

// Qué datos guarda la app, quién los ve, dónde están y cómo borrarlos. Mantener al día si cambia lo que se guarda.
const DATA = [
  {
    title: 'Tu cuenta',
    Icon: User,
    items: [
      'Usuario, email y contraseña. La contraseña se guarda cifrada: nadie puede leerla, ni siquiera el equipo.',
      'Si los cargás: nombre, fecha de nacimiento, club del que sos hincha, foto de perfil y bio.',
    ],
  },
  {
    title: 'Lo que hacés en la app',
    Icon: Star,
    items: [
      'Tus reseñas: puntuación, texto, fecha, partido, gastos y fotos.',
      'A quién seguís, tus estadios por visitar, tus me gusta y tus reseñas guardadas.',
      'Las denuncias y las correcciones de datos que envíes.',
    ],
  },
];

const VISIBILITY = [
  {
    title: 'Lo ve cualquiera',
    Icon: Eye,
    color: C.brandBright,
    items: [
      'Tu perfil: usuario, nombre, foto, bio, club y fecha de nacimiento (si la cargaste).',
      'Tus reseñas y sus fotos, tus estadios visitados y por visitar, a quién seguís y quién te sigue.',
    ],
  },
  {
    title: 'Solo lo ves vos',
    Icon: Lock,
    color: C.gold,
    items: [
      'Tu email, tus reseñas guardadas, tus me gusta y tus estadísticas personales.',
      'Los administradores pueden ver tu email y tu actividad para moderar la comunidad.',
    ],
  },
];

const POINTS = [
  {
    title: 'Para qué se usan',
    Icon: Star,
    text: 'Solo para que la app funcione: mostrar tu perfil y tus reseñas, armar las estadísticas de la comunidad (que son números agregados, sin datos personales) y moderar. No se venden ni se comparten con nadie para publicidad, y la app no tiene publicidad.',
  },
  {
    title: 'Dónde se guardan',
    Icon: Server,
    text: 'La base de datos está en Neon y el servidor en Render, los dos en Estados Unidos; las fotos, en Cloudinary; la web, en Vercel. El mapa usa imágenes satelitales de Esri, la ubicación de cada estadio se muestra con Google Maps y las tipografías vienen de Google Fonts: tu navegador se conecta a esos servicios al usarlos.',
  },
  {
    title: 'Cookies',
    Icon: Cookie,
    text: 'Una sola: la de tu sesión, para que no tengas que iniciar sesión en cada página. Dura 7 días y el código de la página no puede leerla. No hay cookies de publicidad ni de seguimiento. Si la app falla, en el servidor o en tu navegador, se registra el error en Sentry (sin tus datos personales ni lo que escribís) para poder arreglarlo.',
  },
  {
    title: 'Cuánto tiempo',
    Icon: Clock,
    text: 'Mientras tengas tu cuenta. El registro de cambios del panel de administración se borra solo a los 180 días. La base tiene respaldos privados: lo que borres puede seguir en un respaldo hasta que ese respaldo se reemplace.',
  },
  {
    title: 'Borrar tus datos',
    Icon: Trash2,
    text: 'Podés cambiar tus datos cuando quieras desde "Editar perfil", y ahí mismo borrar tu cuenta: se eliminan tu perfil, tus reseñas con sus fotos, tus me gusta, tus guardadas y a quién seguís. Según la Ley 25.326 de Protección de Datos Personales podés pedir acceso, corrección o eliminación de tus datos.',
  },
];

const ListCard = ({ title, Icon, items, color = C.brandBright }) => (
  <div className="p-4 sm:p-5 rounded-2xl" style={card}>
    <p className="flex items-center gap-2 text-base font-semibold" style={{ color: C.bright }}>
      <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: rgba(color, 0.12), color }}><Icon size={16} /></span>
      {title}
    </p>
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-relaxed" style={{ color: C.muted }}>
          <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          {item}
        </li>
      ))}
    </ul>
  </div>
);

export default function PrivacyView({ onBackToMap, navbarProps }) {
  return (
    <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
      <Navbar {...navbarProps} />
      <div className="max-w-5xl mx-auto px-4 pt-24 sm:pt-28 pb-10">
        <button onClick={onBackToMap} aria-label="Volver al mapa" className="w-9 h-9 rounded-full flex items-center justify-center gc-focus gc-tap" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <ChevronLeft size={18} color={C.bright} />
        </button>

        <header className="relative mt-4 sm:mt-5 rounded-3xl overflow-hidden p-6 sm:p-10" style={card}>
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 85% 0%, ${rgba(C.brandBright, 0.22)}, transparent 55%)` }} />
          <div className="relative">
            <h1 className="text-4xl sm:text-6xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>Privacidad</h1>
            <p className="text-sm sm:text-base leading-relaxed mt-3 max-w-2xl" style={{ color: C.muted }}>
              Qué datos guarda GiraCanchera, quién puede verlos, dónde están y cómo borrarlos. Explicado sin vueltas.
            </p>
            <p className="text-xs mt-4" style={{ color: C.muted }}>Última actualización: {UPDATED}</p>
          </div>
        </header>

        <Section title="Qué datos guardamos">
          <div className="grid md:grid-cols-2 gap-3">
            {DATA.map((block) => <ListCard key={block.title} {...block} />)}
          </div>
        </Section>

        <Section title="Quién los ve">
          <div className="grid md:grid-cols-2 gap-3">
            {VISIBILITY.map((block) => <ListCard key={block.title} {...block} />)}
          </div>
        </Section>

        <Section title="Lo demás">
          <div className="grid sm:grid-cols-2 gap-3">
            {POINTS.map(({ title, text, Icon }) => (
              <div key={title} className="p-4 sm:p-5 rounded-2xl flex flex-col gap-3" style={card}>
                <IconBadge Icon={Icon} />
                <div>
                  <p className="text-base font-semibold" style={{ color: C.bright }}>{title}</p>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: C.muted }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Contacto">
          <div className="p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={card}>
            <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
              Para cualquier consulta sobre tus datos, escribile al desarrollador, Wenceslao José Villegas.
            </p>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="gc-action px-5 gap-2 gc-focus gc-tap shrink-0"
              style={{ backgroundColor: rgba('#0A66C2', 0.15), border: `1px solid ${rgba('#0A66C2', 0.4)}`, color: '#7FBFFF' }}
            >
              <Link2 size={15} /> LinkedIn
            </a>
          </div>
        </Section>
      </div>
    </div>
  );
}
