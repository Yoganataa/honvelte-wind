import { apiClient } from '../../lib/api/client'

export function sendGreeting(
  input: Parameters<typeof apiClient.greet>[0],
): ReturnType<typeof apiClient.greet> {
  return apiClient.greet(input)
}
