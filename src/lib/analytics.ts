export function track(event: string, data?: Record<string, unknown>) {
  console.log('[analytics]', event, data)
}
