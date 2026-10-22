interface EmptyStateProps {
  title?: string;
  description?: string;
  /**
   * Acción opcional. Se pasa como URL + etiqueta (y no como nodo JSX) porque
   * los elementos escritos dentro de expresiones de un archivo `.astro` llegan
   * a los componentes React como objetos de render y provocan un error.
   */
  actionHref?: string;
  actionLabel?: string;
}

/** Mensaje para listas sin resultados. */
export default function EmptyState({
  title = 'No hay nada por aquí',
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m16 0h-3l-2 2H9l-2-2H4"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {actionHref && actionLabel && (
        <div className="mt-4">
          <a
            href={actionHref}
            className="inline-flex items-center rounded-lg bg-[#05003b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#121a7c]"
          >
            {actionLabel}
          </a>
        </div>
      )}
    </div>
  );
}
