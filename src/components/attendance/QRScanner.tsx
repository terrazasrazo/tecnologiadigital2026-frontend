import Button from '../ui/Button';
import { useQRScanner } from '../../hooks/useQRScanner';

interface Props {
  /** Se invoca con el contenido crudo del QR detectado. */
  onDetect: (raw: string) => void;
  /** Oculta el botón de inicio (cuando el panel controla el ciclo de vida). */
  className?: string;
}

/** Vista de la cámara con detección de QR nativa (`BarcodeDetector`). */
export default function QRScanner({ onDetect, className = '' }: Props) {
  const { videoRef, active, error, supported, start, stop } = useQRScanner({ onDetect });

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-slate-950 ${className}`}>
      <div className="relative aspect-video w-full">
        <video
          ref={videoRef}
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Marco de apuntado */}
        {active && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-44 w-44 rounded-lg border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        )}
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width={1.5} aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
            <p className="text-sm">
              {supported ? 'La cámara está apagada' : 'Escáner no disponible en este navegador'}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-800 bg-slate-900 px-4 py-3">
        <p className="text-xs text-slate-400">
          {active
            ? 'Apunta al QR de la ponencia…'
            : supported
              ? 'Activa la cámara para escanear el código QR.'
              : 'Usa el campo de texto con el contenido del QR.'}
        </p>
        {active ? (
          <Button variant="secondary" size="sm" onClick={stop}>
            Detener
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={start}
            disabled={!supported}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Activar cámara
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="border-t border-red-900 bg-red-950/60 px-4 py-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
