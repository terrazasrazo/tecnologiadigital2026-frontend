import { useState } from 'react';

export interface NavItem {
  href: string;
  label: string;
}

interface MobileNavProps {
  items: NavItem[];
  /** Ruta del panel según sesión/rol. */
  panelHref: string;
  loggedIn: boolean;
}

/** Menú hamburguesa para pantallas pequeñas. */
export default function MobileNav({ items, panelHref, loggedIn }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-lg text-slate-700 hover:bg-slate-100"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-slate-200 bg-white p-4 shadow-lg">
          <nav className="flex flex-col gap-1" aria-label="Menú móvil">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
            {loggedIn ? (
              <a
                href={panelHref}
                onClick={() => setOpen(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Mi panel
              </a>
            ) : (
              <>
                <a
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700"
                >
                  Iniciar sesión
                </a>
                <a
                  href="/auth/register"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white"
                >
                  Registrarse
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
