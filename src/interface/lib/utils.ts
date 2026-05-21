import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// GERA CLASSES TAILWIND DE FORMA SEGURA E CONCISA
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// FORMATA DATA DO CHAT PARA APRESENTAÇÃO (HH:MM)
export function formatMessageTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// RECORTA TEXTO EM LIMITE DE PALAVRAS PARA PREVIEW DE CARDS
export function truncateWords(text: string, maxWords: number): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return trimmed;
  return words.slice(0, maxWords).join(' ') + '...';
}
