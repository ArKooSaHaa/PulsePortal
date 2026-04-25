<?php

namespace App\Http\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class LlmService
{
    private const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';
    private const MODEL = 'llama-3.1-8b-instant';
    private const FALLBACK_MODELS = [
        'llama-3.1-8b-instant',
        'llama-3.3-70b-versatile',
    ];

    public function askLlm(string $prompt): string
    {
        $apiKey = (string) config('services.groq.key', env('GROQ_API_KEY', ''));
        $preferredModel = (string) config('services.groq.model', self::MODEL);

        if (trim($apiKey) === '') {
            throw new RuntimeException('GROQ_API_KEY is not configured.');
        }

        $modelsToTry = array_values(array_unique(array_filter([
            $preferredModel,
            ...self::FALLBACK_MODELS,
        ])));

        $lastStatus = null;
        $lastBody = null;

        foreach ($modelsToTry as $model) {
            $response = Http::withToken($apiKey)
                ->acceptJson()
                ->asJson()
                ->timeout(45)
                ->retry(1, 300)
                ->post(self::GROQ_CHAT_COMPLETIONS_URL, [
                    'model' => $model,
                    'messages' => [
                        [
                            'role' => 'user',
                            'content' => $prompt,
                        ],
                    ],
                    'temperature' => 0.3,
                    'max_tokens' => 280,
                ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content');

                if (is_string($content) && trim($content) !== '') {
                    return trim($content);
                }

                Log::warning('Groq chat completion returned empty response', [
                    'model' => $model,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                continue;
            }

            $lastStatus = (int) $response->status();
            $lastBody = (string) $response->body();

            Log::warning('Groq chat completion failed', [
                'model' => $model,
                'status' => $lastStatus,
                'body' => $lastBody,
            ]);

            if ($this->isModelDecommissionedError($lastStatus, $lastBody)) {
                continue;
            }

            throw new RuntimeException('Groq API request failed.');
        }

        if ($lastBody !== null) {
            throw new RuntimeException('Groq API request failed.');
        }

        throw new RuntimeException('Groq API returned an empty response.');
    }

    private function isModelDecommissionedError(int $status, string $body): bool
    {
        if ($status !== 400) {
            return false;
        }

        $normalizedBody = strtolower($body);

        return str_contains($normalizedBody, 'model_decommissioned')
            || str_contains($normalizedBody, 'decommissioned');
    }
}
