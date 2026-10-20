// The MCP result shape every tool returns for plain data.

export const json = (value) => ({ content: [{ type: "text", text: JSON.stringify(value, null, 2) }] });
