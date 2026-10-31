import {
  API_BASE_PATH,
  apiErrorResponseSchema,
  apiPaths,
  greetingSchema,
  greetingResponseSchema,
  healthResponseSchema,
  type ApiErrorCode,
  type GreetingInput,
  type GreetingResponse,
  type HealthResponse,
} from '@honvelte/contracts'

type SafeParseResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error?: unknown
    }

type ResponseSchema<T> = {
  safeParse(value: unknown): SafeParseResult<T>
}

export type ApiClientErrorOptions = {
  status?: number | undefined
  code?: ApiErrorCode | undefined
  requestId?: string | undefined
  cause?: unknown
}

export type ApiFetcher = (input: string, init: RequestInit) => Promise<Response>

const defaultFetcher: ApiFetcher = (input, init) => fetch(input, init)

export class ApiClientError extends Error {
  readonly status: number | undefined
  readonly code: ApiErrorCode | undefined
  readonly requestId: string | undefined
  readonly cause: unknown

  constructor(message: string, options: ApiClientErrorOptions = {}) {
    super(message)
    this.name = 'ApiClientError'
    this.status = options.status
    this.code = options.code
    this.requestId = options.requestId
    this.cause = options.cause
  }
}

export type ApiRequestOptions = {
  signal?: AbortSignal
}

async function readJson<T>(
  response: Response,
  schema: ResponseSchema<T>,
): Promise<T> {
  const requestId = response.headers.get('x-request-id') ?? undefined
  let payload: unknown

  try {
    payload = await response.json()
  } catch (cause) {
    throw new ApiClientError('API returned invalid JSON.', {
      status: response.status,
      requestId,
      cause,
    })
  }

  if (!response.ok) {
    const apiError = apiErrorResponseSchema.safeParse(payload)

    if (apiError.success) {
      throw new ApiClientError(apiError.data.error.message, {
        status: response.status,
        code: apiError.data.error.code,
        requestId,
      })
    }

    throw new ApiClientError(
      'API request failed with status ' + response.status + '.',
      {
        status: response.status,
        requestId,
      },
    )
  }

  const parsed = schema.safeParse(payload)
  if (!parsed.success) {
    throw new ApiClientError('API returned an invalid response.', {
      status: response.status,
      requestId,
      cause: parsed.error,
    })
  }

  return parsed.data
}

export function createApiClient(fetcher: ApiFetcher = defaultFetcher) {
  async function request<T>(
    path: string,
    init: RequestInit,
    schema: ResponseSchema<T>,
  ): Promise<T> {
    let response: Response

    try {
      response = await fetcher(path, {
        ...init,
        credentials: 'same-origin',
        headers: (() => {
          const headers = new Headers(init.headers)
          if (!headers.has('accept')) {
            headers.set('accept', 'application/json')
          }
          return headers
        })(),
      })
    } catch (cause) {
      if (
        cause instanceof Error &&
        (cause.name === 'AbortError' || cause.name === 'TimeoutError')
      ) {
        throw cause
      }

      throw new ApiClientError('Unable to reach the API.', { cause })
    }

    return readJson(response, schema)
  }

  return {
    health(options: ApiRequestOptions = {}): Promise<HealthResponse> {
      return request(
        API_BASE_PATH + apiPaths.health,
        {
          method: 'GET',
          ...(options.signal ? { signal: options.signal } : {}),
        },
        healthResponseSchema,
      )
    },

    greet(
      input: GreetingInput,
      options: ApiRequestOptions = {},
    ): Promise<GreetingResponse> {
      const parsedInput = greetingSchema.safeParse(input)
      if (!parsedInput.success) {
        throw new ApiClientError(
          parsedInput.error.issues[0]?.message ?? 'Invalid greeting input.',
        )
      }

      return request(
        API_BASE_PATH + apiPaths.greet,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(parsedInput.data),
          ...(options.signal ? { signal: options.signal } : {}),
        },
        greetingResponseSchema,
      )
    },
  }
}

export const apiClient = createApiClient()
