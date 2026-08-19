import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json({ limit: "2mb" }));

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

// Resolve relative to THIS file's directory, not process.cwd(),
// so it works no matter where you launch `node` from.
const MCP_SERVER_PATH = resolve(
  __dirname,
  process.env.MCP_SERVER_PATH || "../mcp-server/index.js",
);

let mcp = null;
let mcpTools = null;

async function getMcp() {
  if (mcp) return { mcp, mcpTools };
  mcp = new Client(
    { name: "ablespace-ai-bridge", version: "1.0.0" },
    { capabilities: {} },
  );
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [MCP_SERVER_PATH],
    cwd: dirname(MCP_SERVER_PATH),
  });

  transport.stderr?.on("data", (d) => {
    console.error("MCP CHILD STDERR:", d.toString());
  });

  await mcp.connect(transport);
  const { tools } = await mcp.listTools();
  mcpTools = tools;
  return { mcp, mcpTools };
}

// Chat Completions tool format: { type: "function", function: {...} }
function toOpenAiTools(mcpTools) {
  return mcpTools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description || "",
      parameters: stripOwnerFromSchema(t.inputSchema || { type: "object", properties: {} }),
    },
  }));
}

// __ownerId is injected by the bridge — keep it invisible to the model.
function stripOwnerFromSchema(schema) {
  if (!schema || typeof schema !== "object") return schema;
  const props = { ...(schema.properties || {}) };
  delete props.__ownerId;
  const required = Array.isArray(schema.required)
    ? schema.required.filter((k) => k !== "__ownerId")
    : schema.required;
  return { ...schema, properties: props, required };
}

async function runMcpTool(name, args, ownerId) {
  const { mcp } = await getMcp();
  const result = await mcp.callTool({
    name,
    arguments: { ...(args || {}), __ownerId: ownerId },
  });
  const text = (result?.content || [])
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");
  return text;
}

async function runAgent(userId, messages) {
  const { mcpTools } = await getMcp();
  const openAiTools = toOpenAiTools(mcpTools);

  const input = [
    {
      role: "system",
      content:
        "You are the AbleSpace AI assistant, built into the AbleSpace task-management workspace. " +
        "You manage the user's tasks and projects by calling the provided tools. " +
        "Today is " +
        new Date().toISOString().slice(0, 10) +
        ". " +
        "Rules: " +
        "1) When the user asks you to create, update, delete, or list tasks/projects, use the tools - never describe what you would do, actually do it. " +
        "2) Parse due dates into YYYY-MM-DD. Map common status words to one of: todo, doing, completed, onhold. " +
        "3) After performing actions, reply with a concise confirmation summarizing what changed. " +
        "4) If a tool errors, report the error clearly and suggest a fix. " +
        "5) Be friendly and concise, like a helpful assistant. Never expose the __ownerId argument.",
    },
    ...(Array.isArray(messages) ? messages : []).slice(-20),
  ];

  const steps = [];

  for (let turn = 0; turn < 8; turn++) {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: input,
      tools: openAiTools,
      tool_choice: "auto",
    });

    const choice = response.choices?.[0];
    const message = choice?.message;

    if (!message) {
      return { steps, text: "The model returned an empty response." };
    }

    const toolCalls = message.tool_calls || [];

    if (toolCalls.length === 0) {
      return { steps, text: message.content || "" };
    }

    // Push the assistant's tool-call message onto the running conversation
    input.push({
      role: "assistant",
      content: message.content || null,
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
      let output = "";
      let args = {};
      try {
        args = JSON.parse(call.function?.arguments || "{}");
      } catch {
        args = {};
      }
      try {
        output = await runMcpTool(call.function.name, args, userId);
      } catch (err) {
        output = JSON.stringify({ error: err.message });
      }
      steps.push({
        name: call.function.name,
        arguments: args,
        output: output.length > 4000 ? output.slice(0, 4000) + "…" : output,
      });

      input.push({
        role: "tool",
        tool_call_id: call.id,
        content: output,
      });
    }
  }

  return {
    steps,
    text: "I ran into too many back-and-forth tool calls. Please try a more specific request.",
  };
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    model: MODEL,
    mcpConnected: !!mcp,
  });
});

app.post("/api/chat", async (req, res, next) => {
  try {
    const { messages, ownerId } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ message: "messages array is required" });
    }
    const userId = (ownerId || "guest").toString().slice(0, 200);
    const result = await runAgent(userId, messages);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`AbleSpace AI bridge running on http://localhost:${PORT}`);
});
