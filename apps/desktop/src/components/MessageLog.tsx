type MessageLogProps = {
  messages: string[];
};

export function MessageLog({ messages }: MessageLogProps) {
  return (
    <section>
      <h2>Mensajes</h2>

      <pre
        style={{
          background: "#111",
          color: "#0f0",
          padding: 12,
          minHeight: 260,
          whiteSpace: "pre-wrap",
          overflow: "auto"
        }}
      >
        {messages.join("\n")}
      </pre>
    </section>
  );
}