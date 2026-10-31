import { API_BASE_PATH } from '@honvelte/contracts'
import { Hono } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { handleApiError } from './http/error-handler'
import { requestId } from './middleware/request-id'
import greetingRoutes from './routes/greeting'
import healthRoutes from './routes/health'

const app = new Hono()

app.use('*', secureHeaders())
app.use('*', requestId)

app.route(API_BASE_PATH, healthRoutes)
app.route(API_BASE_PATH, greetingRoutes)

app.notFound((c) =>
  c.json({ error: { code: 'NOT_FOUND', message: 'Resource not found' } }, 404),
)

app.onError(handleApiError)

export type AppType = typeof app
export default app
