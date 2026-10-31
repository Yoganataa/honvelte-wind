import { HTTPException } from 'hono/http-exception'

const MAX_REQUEST_BODY_BYTES = 1024

export async function readJsonBody(request: Request): Promise<unknown> {
  const contentLength = request.headers.get('content-length')
  if (
    contentLength !== null &&
    Number.isFinite(Number(contentLength)) &&
    Number(contentLength) > MAX_REQUEST_BODY_BYTES
  ) {
    throw new HTTPException(413, { message: 'Request body too large' })
  }

  if (!request.body) {
    throw new HTTPException(400, { message: 'Malformed JSON body' })
  }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      totalBytes += value.byteLength
      if (totalBytes > MAX_REQUEST_BODY_BYTES) {
        await reader.cancel()
        throw new HTTPException(413, { message: 'Request body too large' })
      }

      chunks.push(value)
    }
  } catch (error) {
    if (error instanceof HTTPException) throw error
    throw new HTTPException(400, { message: 'Malformed JSON body' })
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown
  } catch {
    throw new HTTPException(400, { message: 'Malformed JSON body' })
  }
}
