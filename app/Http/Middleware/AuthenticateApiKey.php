<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = config('services.integration.key');

        if (blank($expected)) {
            return response()->json([
                'message' => 'API access is not configured. Set INTEGRATION_API_KEY in the server environment.',
            ], 503);
        }

        $provided = $request->header('X-API-Key') ?? $request->bearerToken();

        if (! is_string($provided) || ! hash_equals($expected, $provided)) {
            return response()->json(['message' => 'Invalid API key.'], 401);
        }

        return $next($request);
    }
}
