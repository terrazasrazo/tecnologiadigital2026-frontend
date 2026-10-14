import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook del escáner de QR con la API nativa `BarcodeDetector`.
 *
 * - Usa la cámara trasera por defecto en móviles.
 * - Detiene la cámara automáticamente al detectar un código.
 * - Si el navegador no soporta `BarcodeDetector`, expone `supported = false`
 *   para que la UI ofrezca el ingreso manual del token.
 */

interface DetectedCode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedCode[]>;
}

type BarcodeDetectorCtor = new (options: { formats: string[] }) => BarcodeDetectorLike;

function getDetectorCtor(): BarcodeDetectorCtor | null {
  if (typeof window === 'undefined') return null;
  const maybe = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  return typeof maybe === 'function' ? maybe : null;
}

interface UseQRScannerOptions {
  onDetect: (raw: string) => void;
}

export function useQRScanner({ onDetect }: UseQRScannerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const detectRef = useRef(onDetect);
  detectRef.current = onDetect;

  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported] = useState<boolean>(() => getDetectorCtor() !== null);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    busyRef.current = false;
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    const Ctor = getDetectorCtor();
    if (!Ctor) {
      setError('Tu navegador no soporta el escáner automático. Usa el campo de texto.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setActive(true);

      const detector = new Ctor({ formats: ['qr_code'] });
      timerRef.current = window.setInterval(() => {
        if (busyRef.current || !video.videoWidth) return;
        busyRef.current = true;
        detector
          .detect(video)
          .then((codes) => {
            const found = codes.find((code) => code.rawValue?.trim());
            if (found) {
              stop();
              detectRef.current(found.rawValue.trim());
            }
          })
          .catch(() => {
            // Fallos transitorios del detector: se ignoran y se reintenta.
          })
          .finally(() => {
            busyRef.current = false;
          });
      }, 300);
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Permiso de cámara denegado. Actívalo en tu navegador o usa el campo de texto.'
          : 'No se pudo acceder a la cámara de este dispositivo.',
      );
      stop();
    }
  }, [stop]);

  // Liberar la cámara al desmontar.
  useEffect(() => stop, [stop]);

  return { videoRef, active, error, supported, start, stop };
}
