import { Hono } from "hono";
import { cors } from "hono/cors";
import { MastraServer } from "@mastra/hono";
import { mastra } from "./mastra/index";

const app = new Hono();

app.use("/api/*", cors());

app.get("/api/health", (c) => c.json({
  ok: true,
  service: "bonsai/onsen",
  component: "wild-spring-api"
}));

const demo = [
  {id:"wild:demo-001",name:"野湯サンプルA",prefecture:"北海道",location_precision:"approximate",lat:43.0642,lng:141.3469,status:"active",water_temperature_c:42,confidence:"demo"},
  {id:"wild:demo-002",name:"野湯サンプルB",prefecture:"群馬県",location_precision:"approximate",lat:36.3912,lng:139.0608,status:"seasonal",water_temperature_c:48,confidence:"demo"},
  {id:"wild:demo-003",name:"野湯サンプルC",prefecture:"鹿児島県",location_precision:"area",lat:31.5966,lng:130.5571,status:"unknown",water_temperature_c:55,confidence:"demo"}
];

app.get("/api/wild-springs", (c) => c.json({data: demo, canonical: "data/wild_springs.jsonl"}));
app.get("/api/wild-springs/:id", (c) => {
  const item = demo.find(x => x.id === c.req.param("id"));
  return item ? c.json(item) : c.json({error:"not_found"},404);
});

const server = new MastraServer({
  app,
  mastra,
  prefix: "/api/mastra",
  mcpOptions: { serverless: true },
});
await server.init();

export default app;
