/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Usuario autenticado (o null) disponible en todas las páginas. */
    user: import('./lib/types').User | null;
    /** Access token vigente para llamar al API desde el servidor. */
    accessToken: string | null;
  }
}
