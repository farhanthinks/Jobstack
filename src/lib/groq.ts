import Groq from "groq-sdk";

let client: Groq | null = null;

function getClient() {
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

export async function generateJson<T>({
  system,
  prompt,
  temperature = 0.4,
  maxTokens = 4096,
}: {
  system: string;
  prompt: string;
  temperature?: number;
  /** Raise this for generations with large output (e.g. a full LaTeX resume) — the default is too low for those and causes the model's JSON to be cut off mid-string. */
  maxTokens?: number;
}): Promise<{ data: T | null; error: string | null; raw: string | null }> {
  if (!process.env.GROQ_API_KEY) {
    return { data: null, error: "GROQ_API_KEY is not configured.", raw: null };
  }

  try {
    const completion = await getClient().chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature,
      max_completion_tokens: maxTokens,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    if (!raw) {
      return { data: null, error: "The model returned an empty response.", raw: null };
    }

    try {
      const data = JSON.parse(extractJson(raw)) as T;
      return { data, error: null, raw };
    } catch {
      return { data: null, error: "Couldn't parse the model's response.", raw };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Groq request failed.";
    return { data: null, error: message, raw: null };
  }
}
