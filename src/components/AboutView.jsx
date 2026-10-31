import logoIcon from '../assets/giracanchera-icono.svg';
import {
  ChevronLeft, Link2, Code2, MapPin, Star, Wallet, ListChecks, Users, Heart, ShieldCheck, Database, Server, User,
  BookOpen, GraduationCap, Bot, GitBranch, KeyRound, Lock, Globe, Bell,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import Navbar from './Navbar';
import statsService from '../services/statsService';

const LINKEDIN_URL = 'https://www.linkedin.com/in/wenceslaojosevillegas/';
const GITHUB_URL = 'https://github.com/wevillegas';

const FEATURES = [
  { title: 'Mapa de estadios', text: 'Un planeta en 3D con imágenes satelitales: viajá a cada cancha, con su escudo y filtros por país, provincia y ciudad.', Icon: MapPin },
  { title: 'Ficha de cada estadio', text: 'Postal con fotos, historia, datos curiosos, medidas de la cancha, gasto típico, ubicación y otros estadios cerca.', Icon: BookOpen },
  { title: 'Reseñas y visitas', text: 'Registrá cada partido con puntuación, texto, fotos, local, visitante y resultado.', Icon: Star },
  { title: 'Gastos del día', text: 'Llevá el detalle de entradas, comida, estacionamiento y transporte, y mirá el gasto típico de cada estadio.', Icon: Wallet },
  { title: 'Visitados y por visitar', text: 'Tu lista de canchas ya visitadas y las que querés conocer, ordenadas por la última que agregaste.', Icon: ListChecks },
  { title: 'Comunidad', text: 'Seguí a otros hinchas, mirá sus reseñas y las fotos que suben desde las tribunas.', Icon: Users },
  { title: 'Me gusta y guardadas', text: 'Dale me gusta a las reseñas de otros y guardá las que quieras volver a leer. Son privadas.', Icon: Heart },
  { title: 'Cuidado entre todos', text: 'Podés denunciar una reseña o sugerir una corrección de datos de un estadio; el equipo lo revisa desde el panel.', Icon: ShieldCheck },
  { title: 'Tu perfil', text: 'Tu bitácora personal: avatar, bio, club de hincha y tus estadios, reseñas y seguidores.', Icon: User },
];

const STACK = [
  { group: 'Frontend', Icon: Code2, items: ['React 19', 'Vite 8', 'Tailwind CSS 3', 'MapLibre GL', 'Lucide', 'Vercel'] },
  { group: 'Backend', Icon: Server, items: ['Node.js', 'Express 5', 'JWT y bcrypt', 'Helmet', 'Cloudinary', 'Render'] },
  { group: 'Datos', Icon: Database, items: ['PostgreSQL', 'Neon', 'Prisma 7', 'Docker', 'Wikidata'] },
];

const PILLARS = [
  { title: 'Universidad', text: 'Nació como proyecto de Ingeniería Informática en la Universidad del Norte Santo Tomás de Aquino (UNSTA), para practicar el desarrollo full-stack con MongoDB, Express, React y Node.js. Más adelante la base de datos pasó a PostgreSQL.', Icon: GraduationCap },
  { title: 'Agentes de IA', text: 'Se usó IA como parte del flujo de trabajo diario: para explorar ideas, escribir código y revisar cambios, siempre con una persona decidiendo.', Icon: Bot },
  { title: 'Historial en Git', text: 'Todo el desarrollo se versionó con Git, con un historial de commits que documenta la evolución desde el primer scaffold hasta cada nueva funcionalidad.', Icon: GitBranch },
];

const COMING = [
  { title: 'Recuperar la contraseña', text: 'Restablecerla por email si la olvidás.', Icon: KeyRound },
  { title: 'Privacidad del perfil y las listas', text: 'Elegir quién puede ver tu perfil, tus visitas y tus listas.', Icon: Lock },
  { title: 'Más estadios del mundo', text: 'Seguir sumando canchas de otros países y continentes.', Icon: Globe },
  { title: 'Avisos de moderación', text: 'Que te avisen si una reseña tuya fue ocultada o tu cuenta silenciada, con la opción de apelar.', Icon: Bell },
];

const card = { backgroundColor: C.surface, border: `1px solid ${C.border}` };

const Section = ({ title, subtitle, children }) => (
  <section className="mt-12">
    <h2 className="text-2xl sm:text-3xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>{title}</h2>
    {subtitle && <p className="text-sm mt-2" style={{ color: C.muted }}>{subtitle}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

const IconBadge = ({ Icon }) => (
  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: rgba(C.brandBright, 0.12), color: C.brandBright }}>
    <Icon size={18} />
  </div>
);

export default function AboutView({ onBackToMap, navbarProps }) {
  // Números del proyecto tomados de la base, para que se actualicen solos
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    let cancelled = false;
    statsService.getPublicStats()
      .then((data) => { if (!cancelled) setTotals(data.totals); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const counters = [
    { label: 'Estadios', value: totals?.stadiums, Icon: MapPin },
    { label: 'Clubes', value: totals?.clubs, Icon: ShieldCheck },
    { label: 'Reseñas', value: totals?.reviews, Icon: Star },
    { label: 'Hinchas', value: totals?.users, Icon: Users },
  ];

  return (
    <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
      <Navbar {...navbarProps} />
      <div className="max-w-5xl mx-auto px-4 pt-24 sm:pt-28 pb-10">
        <button onClick={onBackToMap} aria-label="Volver al mapa" className="w-9 h-9 rounded-full flex items-center justify-center gc-focus gc-tap" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <ChevronLeft size={18} color={C.bright} />
        </button>

        {/* Cabecera */}
        <header className="relative mt-4 sm:mt-5 rounded-3xl overflow-hidden p-6 sm:p-10" style={card}>
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 85% 0%, ${rgba(C.brandBright, 0.22)}, transparent 55%), radial-gradient(circle at 0% 100%, ${rgba(C.gold, 0.1)}, transparent 50%)` }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
            <img src={logoIcon} alt="Logo de GiraCanchera" className="w-20 h-20 sm:w-28 sm:h-28 object-contain shrink-0" />
            <div className="min-w-0">
              <h1 className="text-4xl sm:text-6xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>GiraCanchera</h1>
              <p className="text-base sm:text-lg mt-2" style={{ color: C.brandBright }}>Tu bitácora de estadios de fútbol</p>
              <p className="text-sm sm:text-base leading-relaxed mt-4 max-w-2xl" style={{ color: C.muted }}>
                Recorré el mapa, registrá cada cancha que pisaste, contá cómo la viviste y descubrí cuánto cuesta y cómo es ir a cada estadio, con la mirada de otros hinchas.
              </p>
            </div>
          </div>

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            {counters.map(({ label, value, Icon }) => (
              <div key={label} className="rounded-2xl p-3.5 sm:p-4" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}><Icon size={13} /> {label}</div>
                <p className="text-3xl sm:text-4xl leading-none mt-2" style={{ fontFamily: DISPLAY_FONT, color: C.brandBright }}>{value?.toLocaleString('es-AR') ?? '—'}</p>
              </div>
            ))}
          </div>
        </header>

        <Section title="Qué podés hacer" subtitle="Todo lo que ofrece la app hoy.">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map(({ title, text, Icon }) => (
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

        <Section title="Cómo está construido">
          <div className="grid md:grid-cols-3 gap-3">
            {STACK.map(({ group, Icon, items }) => (
              <div key={group} className="p-4 sm:p-5 rounded-2xl" style={card}>
                <p className="text-xs uppercase tracking-widest flex items-center gap-1.5 mb-3" style={{ color: C.muted }}>
                  <Icon size={13} /> {group}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <span key={item} className="px-3 py-1 rounded-full text-xs sm:text-sm" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.bright }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="El proyecto">
          <div className="grid md:grid-cols-3 gap-3">
            {PILLARS.map(({ title, text, Icon }) => (
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

        <Section title="Próximamente" subtitle="Lo que viene en camino.">
          <div className="grid sm:grid-cols-2 gap-3">
            {COMING.map(({ title, text, Icon }) => (
              <div key={title} className="p-4 sm:p-5 rounded-2xl flex gap-4" style={{ ...card, border: `1px dashed ${C.border}` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: rgba(C.gold, 0.12), color: C.gold }}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold" style={{ color: C.bright }}>{title}</p>
                  <p className="text-sm mt-1 leading-relaxed" style={{ color: C.muted }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="El desarrollador">
          <div className="relative rounded-3xl overflow-hidden p-5 sm:p-7" style={card}>
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 100% 0%, ${rgba(C.brandBright, 0.14)}, transparent 55%)` }} />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div className="min-w-0">
                <p className="text-2xl sm:text-3xl leading-none" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>Wenceslao José Villegas</p>
                <p className="text-sm sm:text-base mt-2 leading-relaxed max-w-xl" style={{ color: C.muted }}>
                  Estudiante de Ingeniería Informática en la UNSTA y desarrollador de GiraCanchera.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gc-action px-5 gap-2 gc-focus gc-tap"
                  style={{ backgroundColor: rgba('#0A66C2', 0.15), border: `1px solid ${rgba('#0A66C2', 0.4)}`, color: '#7FBFFF' }}
                >
                  <Link2 size={15} /> LinkedIn
                </a>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gc-action px-5 gap-2 gc-focus gc-tap"
                  style={{ backgroundColor: rgba(C.bright, 0.08), border: `1px solid ${C.border}`, color: C.bright }}
                >
                  <Link2 size={15} /> GitHub
                </a>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
