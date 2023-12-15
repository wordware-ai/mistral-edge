# Mistral Edge

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
> :warning: TODO

For details of all parameters, see the [official Mistral API docs](https://docs.mistral.ai/api/).

## Edge route handler examples
> :warning: TODO