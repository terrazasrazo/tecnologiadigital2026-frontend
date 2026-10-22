import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { ClientApiError, postJson } from '../../lib/api/browser';
import { messageFor } from '../../lib/errorMessages';

interface Props {
  token: string;
}

type Status = 'verifying' | 'success' | 'error';

/** Verifica el correo automáticamente al cargar la página. */
export default function VerifyEmail({ token }: Props) {
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState<string | null>(null);
  const [code, setCode] = useState<string | undefined>();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    postJson('/api/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        if (err instanceof ClientApiError) {
          setMessage(messageFor(err.code, err.message));
          setCode(err.code);
        } else {
          setMessage('Ocurrió un error inesperado.');
        }
        setStatus('error');
      });
  }, [token]);

  if (status === 'verifying') {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-slate-500">
        <Spinner />
        <p className="text-sm">Verificando tu correo…</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          <p className="font-semibold">Correo verificado</p>
          <p className="mt-1">Tu cuenta está activa. Ya puedes iniciar sesión.</p>
        </div>
        <a
          href="/auth/login"
          className="inline-flex items-center justify-center rounded-lg bg-[#05003b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#121a7c]"
        >
          Iniciar sesión
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <p className="font-semibold">No se pudo verificar</p>
        <p className="mt-1">{message}</p>
        {code && <p className="mt-1 font-mono text-xs text-red-500">{code}</p>}
      </div>
      <Button
        variant="secondary"
        onClick={() => window.location.assign('/auth/login')}
        className="w-full"
      >
        Ir a iniciar sesión
      </Button>
    </div>
  );
}
