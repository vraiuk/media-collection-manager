export const previewCache = {
  async get(_name: string, _size: number): Promise<string | null> { return null },
  async set(_name: string, _size: number, _blob: Blob): Promise<void> {},
}
