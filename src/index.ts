const MISTRAL_CHAT_COMPLETIONS_API_URL = "https://api.mistral.ai/v1/chat/completions";

export namespace MistralAIChatTypes {
  export type Message = {
    role: "user" | "system" | "assistant";
    content: string;
  };

  export type Model = "mistral-tiny" | "mistral-small" | "mistral-medium";

  export type Config = {
    model: Model;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    randomSeed?: number;
    safeMode?: boolean;
  };

  export type Response = {
    id: string;
    object: "chat.completion";
    created: number;
    choices: {
      index: number;
      message: Message;
      finish_reason: "stop" | string | null; // TODO: enumerate all finish reasons
    }[];
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };

  export type Chunk = {
    id: string;
    object: "chat.completion.chunk";
    created: number;
    model: Model;
    choices: {
      index: number;
      delta: Message;
      finish_reason: "stop" | string | null; // TODO: enumerate all finish reasons
    }[];
  };
}

/**
 * Run a streaming chat completion against the Mistral AI API. The resulting stream emits only the string tokens.
 *
 * @see https://platform.openai.com/docs/api-reference/chat
 *
 * @param messages The messages that will be sent to the chat completion request.
 * @param config The parameters for the completion. See Mistral AI's documentation for /v1/chat/completions for details.
 * @param options
 * @param options.signal An AbortSignal that can be used to abort the fetch request.
 * @param options.apiKey Mistral AI API key, defaults to `MISTRAL_API_KEY` env var.
 * @param options.apiUrl The url of the Mistral AI (or compatible) API. Defaults to https://api.mistral.ai/v1/chat/completions
 * @returns An AsyncGenerator that streams the string completions from the API.
 */
export async function* streamMistralChat(
  messages: MistralAIChatTypes.Message[],
  config: MistralAIChatTypes.Config,
  options?: { signal?: AbortSignal; apiKey?: string; apiUrl?: string },
): AsyncGenerator<string, void, void> {
  const r = await fetch(options?.apiUrl ?? MISTRAL_CHAT_COMPLETIONS_API_URL, {
    method: "post",
    headers: {
      Authorization: `Bearer ${options?.apiKey ?? process.env.MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      top_p: config.topP,
      random_seed: config.randomSeed,
      stream: true,
      safe_prompt: config.safeMode,
    }),
    signal: options?.signal,
  });

  if (!r.ok || !r.body) {
    console.error(`Error fetching from Mistral API ${r.status}`);
    console.error(await r.text());
    throw new Error(`Mistral API error, status: ${r.status}`);
  }

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buffer: string[] = [];

  while (true) {
    const { done, value: bytes } = await reader.read();
    if (done) {
      break;
    }

    const chunk = decoder.decode(bytes, { stream: true });

    for (let i = 0, len = chunk.length; i < len; ++i) {
      // We've got newline delimited JSON which has a double newline to separate chunks
      const isChunkSeparator = chunk[i] === "\n" && buffer[buffer.length - 1] === "\n";

      // Keep buffering unless we've hit the end of a data chunk
      if (!isChunkSeparator) {
        buffer.push(chunk[i]);
        continue;
      }

      const chunkLine = buffer.join("");
      if (chunkLine.trim() === "data: [DONE]") {
        break;
      }

      if (chunkLine.startsWith("data:")) {
        const chunkData = chunkLine.substring(6).trim();
        if (chunkData !== "[DONE]") {
          const chunkObject: MistralAIChatTypes.Chunk = JSON.parse(chunkData);
          // We just stream the completion text
          yield chunkObject.choices[0].delta.content ?? "";
        }
      } else {
        throw Error(`Invalid chunk line encountered: ${chunkLine}`);
      }

      buffer = [];
    }
  }
}
