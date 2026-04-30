import 'dotenv/config';
import { streamText } from 'ai';

async function main() {
    const result = streamText({
        model: 'xai/grok-4.1-fast-non-reasoning',
        prompt: 'hola, ¿como estas?',
    });

    for await (const textPart of result.textStream) {
        process.stdout.write(textPart);
    }

    console.log();
    console.log('Token usage:', await result.usage);
    console.log('Finish reason:', await result.finishReason);
}

main().catch(console.error);