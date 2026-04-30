# Tutorial: Configuración Inicial de un Proyecto Next.js con IA

En esta guía detallaremos los primeros pasos para inicializar un proyecto de Next.js moderno, configurar el entorno de desarrollo e instalar las dependencias necesarias para integrar capacidades de Inteligencia Artificial.

## Paso 1: Creación del Proyecto

El primer paso es generar la estructura base de la aplicación utilizando la herramienta oficial de Next.js.

(si ya creaste la app con V0, puedes saltarte este paso)
```bash
npm create next-app@latest my-app --yes
```

### ¿Qué hace este comando?
- **`npx create-next-app@latest`**: Ejecuta la última versión del generador de proyectos Next.js.
- **`my-app`**: Define el nombre de la carpeta del proyecto.
- **`--yes`**: Utiliza las configuraciones predeterminadas (App Router, TypeScript, Tailwind CSS, ESLint, `src/` directory, e Import Alias `@/*`).

---

## Paso 2: Navegar al Directorio y Probar el Servidor

Una vez creado el proyecto, entramos en la carpeta e iniciamos el servidor de desarrollo para verificar que todo funcione correctamente.

```bash
cd my-app
npm run dev
```

El servidor estará disponible usualmente en `http://localhost:3000`. Verás la página de bienvenida de Next.js.

---

## Paso 3: Instalación de Dependencias para IA y Utilidades

Para preparar el proyecto para el desarrollo avanzado (especialmente si planeas usar el **Vercel AI SDK** o scripts de servidor), instalamos las siguientes librerías:

```bash
npm install ai dotenv @types/node tsx typescript
npm install @ai-sdk/react
```

### Descripción de los paquetes:
- **`ai`**: El SDK de Vercel para construir interfaces de chat y streaming de IA.
- **`dotenv`**: Para gestionar variables de entorno (como tu API Key de Gemini u OpenAI).
- **`tsx`**: Permite ejecutar archivos TypeScript directamente desde la terminal (ideal para scripts de prueba o seeding).
- **`typescript` & `@types/node`**: Aseguran que tengamos el soporte completo de tipos para Node.js y el entorno de desarrollo.

---

## Paso 4: Configurar la clave API

Para que tu aplicación pueda comunicarse con los modelos de IA, necesitas configurar tus credenciales.

1. Ve a la página **AI Gateway** en el panel de Vercel.
   - [AI Gateway](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai-gateway%2Fapi-keys&title=AI+Gateway+API+Keys)
2. Si no lo has hecho, registrate e inicia sesión con tu cuenta de Vercel.
3. Una vez dentro del panel de Vercel, navega a la sección de **AI Gateway**.
4. Navega a la sección de **API Keys**.
5. Haz clic en **Create Key** para generar una nueva clave.

### Crear archivo de entorno
Crea un archivo llamado `.env.local` en la raíz del proyecto (dentro de `my-app/`) y añade tu clave:

```env
AI_GATEWAY_API_KEY=tu_clave_de_api_aquí
```

---

## Paso 5: Crear y Ejecutar su Script

Ahora crearemos un script para probar la conexión con la IA.

### 1. Crear el archivo de prueba
Crea un archivo llamado `index.ts` dentro de la carpeta `app/` (o en la raíz si lo prefieres) con el siguiente contenido:

```typescript
import { streamText } from 'ai';
import 'dotenv/config';
 
async function main() {
  const result = streamText({
    model: 'openai/gpt-5.4',
    prompt: 'Invent a new holiday and describe its traditions.',
  });
 
  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }
 
  console.log();
  console.log('Token usage:', await result.usage);
  console.log('Finish reason:', await result.finishReason);
}
 
main().catch(console.error);
```

### 2. Ejecutar el script
Desde tu terminal, ejecuta el siguiente comando:

```bash
npx tsx app/index.ts
```

Deberías ver la respuesta del modelo fluyendo en tiempo real en tu terminal.

> [!TIP]
> **Si el modelo predeterminado no funciona**, intenta cambiarlo por uno de estos modelos alternativos en el código:
>
> **xAI:**
> ```typescript
> model: 'xai/grok-4.1-fast-non-reasoning',
> ```
>
> **Anthropic:**
> ```typescript
> model: 'anthropic/claude-opus-4.7',
> ```

---

## Paso 6: La Interfaz de Chat (Frontend)

El Vercel AI SDK nos facilita enormemente la creación de la UI gracias al hook `useChat`. Este hook maneja el estado de los mensajes, el input y el streaming automáticamente.

Reemplaza el contenido de `app/page.tsx` por esto:

```tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  const { messages, sendMessage } = useChat();
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    sendMessage({
      id: Date.now().toString(),
      role: 'user',
      parts: [{ type: 'text', text: input }]
    });
    
    setInput('');
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(m => (
        <div key={m.id} className="whitespace-pre-wrap mb-4">
          <strong>{m.role === 'user' ? 'Usuario: ' : 'IA: '}</strong>
          {m.parts?.map((part, i) => (
            part.type === 'text' ? <span key={i}>{part.text}</span> : null
          ))}
        </div>
      ))}

      <form onSubmit={handleSubmit} className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl bg-white text-black">
        <input
          className="w-full p-2"
          value={input}
          placeholder="Escribe tu mensaje aquí..."
          onChange={(e) => setInput(e.target.value)}
        />
      </form>
    </div>
  );
}
```

---

## Paso 7: La API del Chatbot (Backend)

Ahora crearemos la ruta de la API que procesará los mensajes desde el frontend y devolverá la respuesta en tiempo real.

Crea el archivo `app/api/chat/route.ts` con el siguiente contenido:

```typescript
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
    // Adaptamos el formato de la UI (v6) para el modelo (ahora es asíncrono)
    messages: await convertToModelMessages(messages), 
  });

  // Retornamos el data stream al frontend (usando toUIMessageStreamResponse en v6)
  return result.toUIMessageStreamResponse();
}
```

---

## Solución de Problemas (Troubleshooting)

### Error: `GatewayAuthenticationError: Unauthenticated request to AI Gateway`

Si al ejecutar tu script con `npx tsx` obtienes este error, significa que la variable `AI_GATEWAY_API_KEY` no está siendo detectada.

**Causas comunes:**
1. **Ubicación del archivo `.env.local`**: Asegúrate de que el archivo esté en la raíz de la carpeta del proyecto (ej: `my-app/.env.local`). Si lo pusiste en una carpeta superior, `dotenv` no lo encontrará automáticamente.
2. **Nombre del archivo**: Verifica que se llame exactamente `.env.local` o `.env`.
3. **Uso en Scripts**: Si usas `tsx` para ejecutar un archivo individual, asegúrate de tener `import 'dotenv/config';` al inicio del archivo, como en este ejemplo:

```typescript
import { streamText } from 'ai';
import 'dotenv/config'; // <--- Importante para cargar las variables

// ... resto del código
```

---

## Resumen de Comandos Rápidos

Si necesitas replicar esto rápidamente, aquí tienes la secuencia:

1. `npm create next-app@latest my-app --yes`
2. `cd my-app`
3. `npm run dev`
4. `npm install ai dotenv @types/node tsx typescript @ai-sdk/react`
5. Crear `.env.local` con `AI_GATEWAY_API_KEY`.

---

> [!IMPORTANT]
> Nunca subas tu archivo `.env.local` a repositorios públicos como GitHub. Este archivo ya está incluido en el `.gitignore` por defecto en Next.js.

---

✍️ **Tutorial creado por Michael Navarro**  
🌐 *Visita mi web en [mnavarro77dev.vercel.app](https://mnavarro77dev.vercel.app/)*
