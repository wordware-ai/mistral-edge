# Mistral AI Edge

A TypeScript module for querying Mistral's API using `fetch` (a standard Web API) instead of `axios`.

This is **not** (at least not currently) a drop in replacement for the official `@mistralai/mistralai` module (which has
`axios` as a dependency). However, it should be simple enough to switch.

As well as reducing the bundle size, removing the dependency means we can query Mistral from edge environments. Edge 
functions such as Next.js Edge API Routes are very fast and allow streaming data to the client.

## Installation
```commandline
yarn add mistral-edge
```
or
```commandline
npm install mistral-edge
```
or 
```commandline
bun install mistral-edge
```

## Usage
```typescript example.ts
import { streamMistralChat } from "mistral-edge";

async function main() {
  const tokenStream = streamMistralChat(
    [{ role: "user", content: "Write a haiku about cheese" }],
    {
      model: "mistral-medium",
      temperature: 0.7,
    },
  );

  let fullResponse = "";
  for await (const token of tokenStream) {
    fullResponse += token;
    process.stdout.write(token);
  }

  console.log("\n\nFull output:")
  console.log(fullResponse)
}

main();
```

Save the above code to a file named `example.ts` and run ith with the following command:
```commandline
export MISTRAL_API_KEY=<your API key> && npx ts-node example.ts
```

### Parameters
For details of all parameters, see the [official Mistral API docs](https://docs.mistral.ai/api/).

## Edge route handler examples
> :warning: TODO