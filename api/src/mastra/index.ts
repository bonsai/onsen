import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";

export const wildSpringAgent = new Agent({
  id: "wild-spring-agent",
  name: "Wild Spring Agent",
  description: "Researches Japanese wild hot springs using sourced observations and explicit uncertainty.",
  instructions: `
You are the bonsai/onsen wild-spring research agent.
Never invent coordinates, access routes, safety facts, or drinking eligibility.
Separate source facts from inference and preserve uncertainty.
When information is missing, say unknown.
Prefer official/public/research sources and return source IDs or URLs when available.
`,
  model: openai("gpt-5-mini"),
});

export const mastra = new Mastra({
  agents: { wildSpringAgent },
});
