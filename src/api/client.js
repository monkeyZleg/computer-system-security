export function toResult(res, { successStatus = 200, context, data } = {}) {
  if (res.error) {
    console.error(context ? `Failed to ${context}:` : 'API error:', res.error)
    return { status: 500, error: 'Internal Server Error', details: res.error.message }
  }
  return { status: successStatus, data: data !== undefined ? data : res.data }
}
