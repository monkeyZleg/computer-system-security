export function toResult(res, { successStatus = 200, context, data } = {}) {
  if (res.error) {
    console.error(context ? `Failed to ${context}:` : 'API error:', res.error)
    return { status: 500, error: 'Internal Server Error', details: 'Something went wrong. Please try again later.' }
  }
  return { status: successStatus, data: data !== undefined ? data : res.data }
}

// Ownership/role check failed — caller is authenticated but not authorized for this resource.
export function forbidden(message = 'Access denied.') {
  return { status: 403, error: 'Forbidden', details: message }
}
