import { describe, test, expect } from 'vitest'
import { cn, formatMessageTime, truncateWords } from '../utils'

describe('Frontend Utility Tests (Equivalente Jest)', () => {
  // Teste 1: cn utility for Tailwind CSS
  test('cn deve mesclar classes do Tailwind corretamente', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4') // twMerge mescla px-2 py-1 em p-4
    expect(cn('flex', false && 'hidden', 'items-center')).toBe('flex items-center')
  })

  // Teste 2: formatMessageTime formatting
  test('formatMessageTime deve formatar data no padrão HH:MM', () => {
    const d = new Date(2026, 4, 20, 14, 30, 0) // 14:30
    expect(formatMessageTime(d)).toBe('14:30')
    expect(formatMessageTime('2026-05-20T15:05:00')).toBe('15:05')
    expect(formatMessageTime('data-invalida')).toBe('')
  })

  // Teste 3: truncateWords text previewing
  test('truncateWords deve limitar a quantidade de palavras e adicionar reticências', () => {
    const text = 'Elana é a melhor assistente pessoal local e criptografada'
    expect(truncateWords(text, 3)).toBe('Elana é a...')
    expect(truncateWords('Olá mundo', 5)).toBe('Olá mundo')
    expect(truncateWords('   ', 2)).toBe('')
  })
})
