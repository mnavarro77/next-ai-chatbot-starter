import { streamText, convertToModelMessages } from 'ai';

// Configura tu modelo preferido aquí (puedes cambiarlo a anthropic u openai)
const MODEL_NAME = 'xai/grok-4.1-fast-non-reasoning';

export async function POST(req: Request) {
    // Extraemos el historial de mensajes enviado por el frontend
    const { messages } = await req.json();

    // Llamamos al modelo pasándole todo el contexto de la conversación
    const result = streamText({
        model: MODEL_NAME,
        system: "Eres un asistente de IA útil, conciso y amigable.",
        // En SDK v6, convertToModelMessages es asíncrono
        messages: await convertToModelMessages(messages),
    });

    // En SDK v6, usamos toUIMessageStreamResponse() para las UIs basadas en partes
    return result.toUIMessageStreamResponse();
}