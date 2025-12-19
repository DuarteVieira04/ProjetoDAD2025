<?php

namespace App\Http\Middleware;

use App\Enums\UserEnum;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Closure;

class EnsureUser
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('sanctum');  // automatically uses the current guard (sanctum in your route)

        if (!$user || $user->type !== UserEnum::PLAYER) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
