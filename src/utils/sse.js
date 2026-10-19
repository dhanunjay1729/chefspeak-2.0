// Network chunks can split anywhere, including inside JSON or a UTF-8 character.
export async function readRecipeStream(body, onContent, onReset = () => {}) {
  if (!body) throw new Error('Recipe response has no stream');
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let completed = false;
  const consume = (line) => {
    if (!line.startsWith('data:')) return;
    const data = line.slice(5).trim();
    if (!data) return;
    if (data === '[DONE]') { completed = true; return; }
    const parsed = JSON.parse(data);
    if (parsed.error) throw new Error(parsed.error);
    if (parsed.reset === true) { onReset(); return; }
    if (typeof parsed.content === 'string') onContent(parsed.content);
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let newline;
      while ((newline = buffer.indexOf('\n')) !== -1) {
        consume(buffer.slice(0, newline).replace(/\r$/, ''));
        buffer = buffer.slice(newline + 1);
      }
      if (done) break;
    }
    if (buffer.trim()) consume(buffer);
    if (!completed) throw new Error("Recipe generation was interrupted. Please try again.");
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
