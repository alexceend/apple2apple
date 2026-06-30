type MessageLogProps = {
  messages: string[];
};

export function MessageLog({ messages }: MessageLogProps) {
  return (
    <section>
      <h2>Mensajes</h2>

      <pre
        style={{
          background: "var(--message-box-bg)",
          color: "var(--message-box-text)",
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