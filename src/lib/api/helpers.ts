/** Helpers de lectura para las páginas SSR. */
import type { PageQuery, Paginated } from '../types';

/**
 * Recorre la paginación del API y devuelve todos los registros.
 * El backend limita `pageSize` a 100, así que itera página por página.
 */
export async function fetchAllPages<T, Q extends PageQuery>(
  list: (query: Q) => Promise<Paginated<T>>,
  query: Omit<Q, 'page' | 'pageSize'> = {} as Omit<Q, 'page' | 'pageSize'>,
  maxPages = 20,
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await list({ ...query, page, pageSize: 100 } as Q);
    all.push(...res.data);
    if (page >= res.meta.totalPages || res.data.length === 0) break;
  }
  return all;
}
