import {
  apiErrorResponseSchema,
  greetingResponseSchema,
  type GreetingInput,
  type GreetingResponse,
} from '@honvelte/contracts'

export async function sendGreeting(
  input: GreetingInput,
): Promise<GreetingResponse> {
  const response = await fetch('/api/greet', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error('API returned invalid JSON.')
  }

  if (!response.ok) {
    const apiError = apiErrorResponseSchema.safeParse(payload)
    throw new Error(
      apiError.success ? apiError.data.error.message : 'Request failed.',
    )
  }

  const greeting = greetingResponseSchema.safeParse(payload)
  if (!greeting.success) {
    throw new Error('API returned an invalid response.')
  }

  return greeting.data
}
