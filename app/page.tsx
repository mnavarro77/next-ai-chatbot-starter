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