import { ChevronLeft, GitBranch, Link2, GraduationCap, Code2 } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';
import Navbar from './Navbar';

const LINKEDIN_URL = 'https://www.linkedin.com/in/wenceslaojosevillegas/';
const GITHUB_URL = 'https://github.com/wevillegas';

export default function AboutView({ onBackToMap, navbarProps }) {
  return (
    <div className="relative flex-1 overflow-y-auto gc-hide-scrollbar">
      <Navbar {...navbarProps} />
      <div className="max-w-2xl mx-auto px-4 pt-32 pb-6">
        <button onClick={onBackToMap} className="flex items-center gap-1.5 text-sm gc-focus" style={{ color: C.muted }}>
          <ChevronLeft size={16} /> Mapa
        </button>

        <div className="flex flex-col items-center text-center mt-6">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold" style={{ backgroundColor: C.brand, color: C.bright }}>
            GC
          </div>
          <h1 className="text-3xl mt-3" style={{ fontFamily: DISPLAY_FONT, color: C.bright, letterSpacing: '0.02em' }}>
            Acerca de GiraCanchera
          </h1>
          <p className="text-sm mt-2 max-w-md" style={{ color: C.muted }}>
            Un proyecto universitario pensado para practicar el desarrollo con el stack MERN
            (MongoDB, Express, React y Node.js) y explorar el uso de agentes de IA como parte
            del proceso de desarrollo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
          {[
            { label: 'Universidad', value: 'UNSTA', Icon: GraduationCap },
            { label: 'Stack', value: 'MERN', Icon: Code2 },
            { label: 'Control de versiones', value: 'Git', Icon: GitBranch },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="flex flex-col items-center py-4 rounded-2xl" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
              <span className="text-2xl" style={{ fontFamily: DISPLAY_FONT, color: C.brandBright }}>{value}</span>
              <span className="text-xs mt-1 flex items-center gap-1" style={{ color: C.muted }}>
                <Icon size={12} /> {label}
              </span>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-semibold mt-8 mb-3" style={{ color: C.bright }}>El proyecto</h2>
        <div className="rounded-2xl p-4 text-sm leading-relaxed" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.muted }}>
          <p>
            GiraCanchera nació como proyecto universitario de la carrera de Ingeniería Informática
            en la Universidad del Norte Santo Tomás de Aquino (UNSTA). El objetivo principal es
            poner en práctica el desarrollo full-stack con MongoDB, Express, React y Node.js, además
            de experimentar con agentes de IA como parte del flujo de trabajo diario.
          </p>
          <p className="mt-3">
            Todo el desarrollo se versionó con Git, llevando un historial de commits que documenta
            la evolución del proyecto desde el scaffold inicial hasta cada nueva funcionalidad.
          </p>
        </div>

        <h2 className="text-lg font-semibold mt-8 mb-3" style={{ color: C.bright }}>El desarrollador</h2>
        <div className="rounded-2xl p-4" style={{ backgroundColor: C.surface, border: `1px solid ${C.border}` }}>
          <p className="text-base font-semibold" style={{ color: C.bright }}>Wenceslao José Villegas</p>
          <p className="text-sm mt-1" style={{ color: C.muted }}>
            Estudiante de Ingeniería Informática en la UNSTA y desarrollador de GiraCanchera.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold gc-focus"
              style={{ backgroundColor: rgba('#0A66C2', 0.15), border: `1px solid ${rgba('#0A66C2', 0.4)}`, color: '#7FBFFF' }}
            >
              <Link2 size={14} /> LinkedIn
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold gc-focus"
              style={{ backgroundColor: rgba(C.bright, 0.08), border: `1px solid ${C.border}`, color: C.bright }}
            >
              <Link2 size={14} /> GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
