/**
 * Configuration d'environnement lue par Vite.
 * VITE_API_URL vaut par défaut l'URL du backend en local ; aucune URL
 * n'est écrite dans les composants.
 */

const brute = import.meta.env.VITE_API_URL as string | undefined;

function normaliser(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export const API_URL = normaliser(brute && brute.trim() !== '' ? brute : 'http://localhost:8080');
