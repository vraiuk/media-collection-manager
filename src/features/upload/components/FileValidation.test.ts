import { describe, it, expect } from 'vitest'
import { validateFiles, MAX_FILE_SIZE, MAX_FILE_COUNT } from './FileValidation'

function makeFile(name: string, type: string, size = 1024): File {
  return new File([new ArrayBuffer(size)], name, { type })
}

describe('validateFiles', () => {
  it('accepts valid images', () => {
    const files = [makeFile('photo.jpg', 'image/jpeg')]
    const result = validateFiles(files)
    expect(result.valid).toHaveLength(1)
    expect(result.errors).toHaveLength(0)
  })

  it('accepts image/png, image/webp, video/mp4', () => {
    const files = [
      makeFile('a.png', 'image/png'),
      makeFile('b.webp', 'image/webp'),
      makeFile('c.mp4', 'video/mp4'),
    ]
    expect(validateFiles(files).valid).toHaveLength(3)
  })

  it('rejects invalid type', () => {
    const files = [makeFile('a.gif', 'image/gif')]
    const result = validateFiles(files)
    expect(result.valid).toHaveLength(0)
    expect(result.errors[0]!.reason).toMatch(/type/i)
  })

  it('rejects file over 10MB', () => {
    const file = makeFile('big.jpg', 'image/jpeg', MAX_FILE_SIZE + 1)
    const result = validateFiles([file])
    expect(result.errors[0]!.reason).toMatch(/size/i)
  })

  it('rejects more than 5 files', () => {
    const files = Array.from({ length: 6 }, (_, i) => makeFile(`f${i}.jpg`, 'image/jpeg'))
    const result = validateFiles(files)
    expect(result.errors.some((e) => e.reason.match(/count/i))).toBe(true)
  })

  it('partially validates mixed batch', () => {
    const files = [
      makeFile('ok.jpg', 'image/jpeg'),
      makeFile('bad.gif', 'image/gif'),
    ]
    const result = validateFiles(files)
    expect(result.valid).toHaveLength(1)
    expect(result.errors).toHaveLength(1)
  })
})
