import { Link2, GitBranch } from 'lucide-react';
import { C, rgba, DISPLAY_FONT } from '../theme';

const LINKEDIN_URL = 'https://www.linkedin.com/in/wenceslaojosevillegas/';
const GITHUB_URL = 'https://github.com/wevillegas';

export default function Footer({ onOpenAbout }) {
  return (
    <footer className="max-w-2xl mx-auto px-1 pt-10 pb-4 mt-10" style={{ borderTop: `1px solid ${C.border}` }}>
      <div className="flex flex-wrap items-start justify-between gap-6 pt-6">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0" style={{ backgroundColor: C.brand, color: C.bright }}>
              GC
            </div>
            <span className="text-lg tracking-wide uppercase" style={{ fontFamily: DISPLAY_FONT, color: C.bright }}>GiraCanchera</span>
          </div>
          <p className="text-xs mt-2 max-w-xs leading-relaxed" style={{ color: C.muted }}>
            Tu bitácora de estadios de fútbol: registrá visitas, calificá canchas y armá tu lista de pendientes.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wide" style={{ color: C.muted, fontSize: '11px' }}>Proyecto</span>
          <button onClick={onOpenAbout} className="text-left gc-focus gc-tap" style={{ color: C.bright }}>
            Acerca de
          </button>
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 gc-focus gc-tap" style={{ color: C.bright }}>
            <Link2 size={12} /> LinkedIn
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 gc-focus gc-tap" style={{ color: C.bright }}>
            <GitBranch size={12} /> GitHub
          </a>
        </div>

        <div className="flex flex-col gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wide" style={{ color: C.muted, fontSize: '11px' }}>Stack</span>
          <span style={{ color: C.bright }}>MongoDB · Express</span>
          <span style={{ color: C.bright }}>React · Node.js</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-8 pt-4 text-[11px]" style={{ borderTop: `1px solid ${rgba(C.border, 0.6)}`, color: C.muted }}>
        <span>© {new Date().getFullYear()} GiraCanchera · Proyecto de la UNSTA</span>
        <span>Hecho por Wenceslao José Villegas</span>
      </div>
    </footer>
  );
}
