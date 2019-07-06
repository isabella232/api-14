import { APIGatewayProxyResult } from 'aws-lambda';

export function applyUniversalHeaders(result: APIGatewayProxyResult): APIGatewayProxyResult {
  return {
    ...result,
    headers: {
      ...result.headers,
      // We apply cors headers so that this API is available to all domains
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      'Content-Type': 'application/json'
    }
  };
}

export function createErrorResponse(statusCode: number, message: string, info?: any) {
  return applyUniversalHeaders({
    statusCode: statusCode,
    body: JSON.stringify({ message, info })
  });
}