import { describe, it, expect } from 'vitest'
import { formatSize } from './formatSize'

describe('formatSize', () => {
  it('formats bytes', () => expect(formatSize(500)).toBe('500 B'))
  it('formats KB', () => expect(formatSize(1536)).toBe('1.5 KB'))
  it('formats MB', () => expect(formatSize(2_097_152)).toBe('2.0 MB'))
  it('formats GB', () => expect(formatSize(1_073_741_824)).toBe('1.0 GB'))
  it('rounds to 1 decimal', () => expect(formatSize(1_100_000)).toBe('1.0 MB'))
})
