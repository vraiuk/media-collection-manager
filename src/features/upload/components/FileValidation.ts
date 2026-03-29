export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'] as const
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
export const MAX_FILE_COUNT = 5

export interface ValidationError {
  file: File
  reason: string
}

export interface ValidationResult {
  valid: File[]
  errors: ValidationError[]
}

export function validateFiles(files: File[]): ValidationResult {
  const valid: File[] = []
  const errors: ValidationError[] = []

  if (files.length > MAX_FILE_COUNT) {
    // Report all files beyond the limit as count errors
    files.slice(MAX_FILE_COUNT).forEach((file) =>
      errors.push({ file, reason: `Count limit: max ${MAX_FILE_COUNT} files at once` }),
    )
  }

  const toValidate = files.slice(0, MAX_FILE_COUNT)

  for (const file of toValidate) {
    if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
      errors.push({ file, reason: `Unsupported type: ${file.type}` })
      continue
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push({ file, reason: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds 10MB limit` })
      continue
    }
    valid.push(file)
  }

  return { valid, errors }
}
