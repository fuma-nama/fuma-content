import { generateText } from "ai";
import { Route } from "./+types/route";

export async function action({ request }: Route.ActionArgs) {
  const { apiKey: key, model = "gpt-4o-mini", prompt, system } = await request.json();

  const apiKey = key || process.env.AI_GATEWAY_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "Missing ai gateway API key." }, { status: 401 });
  }

  try {
    const result = await generateText({
      abortSignal: request.signal,
      maxOutputTokens: 50,
      model: `openai/${model}`,
      prompt,
      system,
      temperature: 0.7,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return Response.json(null, { status: 408 });
    }

    return Response.json({ error: "Failed to process AI request" }, { status: 500 });
  }
}
