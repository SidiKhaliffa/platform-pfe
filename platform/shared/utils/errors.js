// Format d'erreur standard — identique dans tous les services
const errorResponse = (message, details) => ({
  error: { message, ...(details && { details }) },
});

module.exports = {
  errorResponse,
  notFound:     (r = 'Resource') => errorResponse(`${r} not found`),
  unauthorized: ()               => errorResponse('Missing or invalid Authorization header'),
  forbidden:    ()               => errorResponse('Insufficient permissions'),
  badGateway:   ()               => errorResponse('Service temporarily unavailable'),
};
