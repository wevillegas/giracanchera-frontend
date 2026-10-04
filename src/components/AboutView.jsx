import {
  ChevronLeft, GitBranch, Link2, Code2, MapPin, Star, Wallet, ListChecks, Users, Heart, Flag, Database, Server, User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import Navbar from './Navbar';
import stadiumService from '../services/stadiumService';
import clubService from '../services/clubService';

const LINKEDIN_URL = 'https://www.linkedin.com/in/wenceslaojosevillegas/';
const GITHUB_URL = 'https://github.com/wevillegas';

const FEATURES = [
  { title: 'Mapa de estadios', text: 'Explorá las canchas del país en el mapa, con su escudo, filtros por país, provincia y ciudad.', Icon: MapPin },
  { title: 'Reseñas y visitas', text: 'Registrá cada partido con puntuación, texto, fotos, gastos, local, visitante y resultado.', Icon: Star },
  { title: 'Gastos del día', text: 'Llevá el detalle de entradas, comida, estacionamiento y transporte, y mirá el promedio de cada estadio.', Icon: Wallet },
  { title: 'Visitados y por visitar', text: 'Tu lista de canchas ya visitadas y las que querés conocer, ordenadas por la última que agregaste.', Icon: ListChecks },
  { title: 'Comunidad', text: 'Seguí a otros hinchas, mirá sus reseñas y buscalos desde el buscador del navbar.', Icon: Users },
  { title: 'Me gusta y guardadas', text: 'Dale me gusta a las reseñas de otros y guardá las que quieras volver a leer. Son privadas.', Icon: Heart },
  { title: 'Moderación', text: 'Cualquier reseña se puede denunciar, y el equipo la revisa desde el panel de administración.', Icon: Flag },
  { title: 'Tu perfil', text: 'Tu bitácora personal: avatar, bio, club de hincha y tus estadios, reseñas y seguidores.', Icon: User },
];

const STACK = [
  { group: 'Frontend', Icon: Code2, items: ['React 19', 'Vite 8', 'Tailwind CSS 3', 'Leaflet', 'Lucide'] },
  { group: 'Backend', Icon: Server, items: ['Node.js', 'Express 5', 'JWT y bcrypt', 'Helmet', 'Cloudinary'] },
  { group: 'Datos', Icon: Database, items: ['MongoDB Atlas', 'Mongoose 9'] },
];

const Section = ({ title, children }) => (
  <section className="mt-10">
    <h2 className="text-xl mb-3" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.03em' }}>{title}</h2>
    {children}
  </section>
);

export default function AboutView({ onBackToMap, navbarProps }) {
  // Números del proyecto tomados de la base, para que se actualicen solos
  const [counts, setCounts] = useState({ stadiums: null, clubs: null, provinces: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all([stadiumService.getAll(), clubService.getAll()])
      .then(([stadiums, clubs]) => {
        if (cancelled) return;
        const provinces = new Set(stadiums.map((s) => s.province).filter(Boolean));
        setCounts({ stadiums: stadiums.length, clubs: clubs.length, provinces: provinces.size });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
      <Navbar {...navbarProps} />
      <div className="max-w-3xl mx-auto px-4 pt-32 pb-6">
        <button onClick={onBackToMap} className="flex items-center gap-1.5 text-sm gc-focus gc-tap" style={{ color: C.muted }}>
          <ChevronLeft size={16} /> Mapa
        </button>

        {/* Cabecera */}
        <header
          className="relative mt-5 p-6 md:p-8 rounded-3xl overflow-hidden"
          style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(circle at 85% 0%, ${rgba(C.brandBright, 0.18)}, transparent 60%)` }}
          />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold shrink-0" style={{ backgroundColor: C.brand, color: C.bright }}>
              GC
            </div>
            <div className="min-w-0">
              <h1 className="text-4xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>GiraCanchera</h1>
              <p className="text-sm mt-1" style={{ color: C.muted }}>Tu bitácora de estadios de fútbol</p>
            </div>
          </div>
          <p className="relative text-sm leading-relaxed mt-5 max-w-xl" style={{ color: C.muted }}>
            Un proyecto universitario pensado para practicar el desarrollo con el stack MERN
            (MongoDB, Express, React y Node.js) y explorar el uso de agentes de IA como parte
            del proceso de desarrollo.
          </p>

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: 'Estadios cargados', value: counts.stadiums, Icon: MapPin },
              { label: 'Clubes', value: counts.clubs, Icon: Users },
              { label: 'Provincias', value: counts.provinces, Icon: Flag },
              { label: 'Stack', value: 'MERN', Icon: Code2 },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="flex flex-col items-center py-3 rounded-2xl" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                <span className="text-xl" style={{ fontFamily: DISPLAY_FONT, color: C.brandBright }}>{value ?? '—'}</span>
                <span className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: C.muted }}>
                  <Icon size={11} /> {label}
                </span>
              </div>
            ))}
          </div>
        </header>

        <Section title="Qué podés hacer">
          <div className="grid md:grid-cols-2 gap-3">
            {FEATURES.map(({ title, text, Icon }) => (
              <div key={title} className="p-4 rounded-2xl flex gap-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: rgba(C.brandBright, 0.12), color: C.brandBright }}>
                  <Icon size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: C.bright }}>{title}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: C.muted }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Cómo está construido">
          <div className="grid md:grid-cols-3 gap-3">
            {STACK.map(({ group, Icon, items }) => (
              <div key={group} className="p-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
                <p className="text-xs uppercase tracking-widest flex items-center gap-1.5 mb-3" style={{ color: C.muted }}>
                  <Icon size={12} /> {group}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <span key={item} className="px-2.5 py-1 rounded-full text-xs" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.bright }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="El proyecto">
          <div className="rounded-2xl p-5 text-sm leading-relaxed space-y-3" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>
            <p>
              GiraCanchera nació como proyecto universitario de la carrera de Ingeniería Informática
              en la Universidad del Norte Santo Tomás de Aquino (UNSTA). El objetivo principal es
              poner en práctica el desarrollo full-stack con MongoDB, Express, React y Node.js, además
              de experimentar con agentes de IA como parte del flujo de trabajo diario.
            </p>
            <p>
              Todo el desarrollo se versionó con Git, llevando un historial de commits que documenta
              la evolución del proyecto desde el scaffold inicial hasta cada nueva funcionalidad.
            </p>
          </div>
        </Section>

        <Section title="Próximamente">
          <ul className="rounded-2xl p-5 text-sm space-y-2 list-disc pl-9" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>
            <li>Recuperación de contraseña por email.</li>
            <li>Opción para elegir la privacidad del perfil y de las listas.</li>
            <li>Más estadísticas por club y por ciudad.</li>
          </ul>
        </Section>

        <Section title="El desarrollador">
          <div className="rounded-2xl p-5" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
            <p className="text-base font-semibold" style={{ color: C.bright }}>Wenceslao José Villegas</p>
            <p className="text-sm mt-1" style={{ color: C.muted }}>
              Estudiante de Ingeniería Informática en la UNSTA y desarrollador de GiraCanchera.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold gc-focus gc-tap"
                style={{ backgroundColor: rgba('#0A66C2', 0.15), border: `1px solid ${rgba('#0A66C2', 0.4)}`, color: '#7FBFFF' }}
              >
                <Link2 size={14} /> LinkedIn
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold gc-focus gc-tap"
                style={{ backgroundColor: rgba(C.bright, 0.08), border: `1px solid ${C.border}`, color: C.bright }}
              >
                <Link2 size={14} /> GitHub
              </a>
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}
