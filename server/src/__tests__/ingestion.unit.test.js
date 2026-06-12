import { describe, it, expect } from 'vitest'
import { parseDurationSeconds, extractYouTubeId } from '../services/ingestion.service.js'

describe('parseDurationSeconds', () => {
  it('convertit PT3M1S en 181 secondes (au-dessus du seuil 3 min)', () => {
    expect(parseDurationSeconds('PT3M1S')).toBe(181)
  })

  it('convertit PT3M0S en 180 secondes (exactement le seuil — écarté par le filtre)', () => {
    expect(parseDurationSeconds('PT3M0S')).toBe(180)
  })

  it('convertit PT1H2M3S en 3723 secondes', () => {
    expect(parseDurationSeconds('PT1H2M3S')).toBe(3723)
  })

  it('retourne 0 pour une valeur nulle ou vide', () => {
    expect(parseDurationSeconds(null)).toBe(0)
    expect(parseDurationSeconds('')).toBe(0)
  })

  it('filtre > 180 s — confirme que PT2M59S est écarté', () => {
    const duration = parseDurationSeconds('PT2M59S')
    expect(duration > 180).toBe(false)
  })
})

describe('extractYouTubeId', () => {
  it('extrait l\'id depuis une URL longue', () => {
    expect(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extrait l\'id depuis une URL courte youtu.be', () => {
    expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('retourne null pour une URL non-YouTube', () => {
    expect(extractYouTubeId('https://vimeo.com/123456789')).toBeNull()
  })

  it('extrait l\'id depuis une URL embed', () => {
    expect(extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
})
