import type { CodeLanguage } from "@/contracts/task";

// runInSandbox returns null when RUNNER_URL is not set.

export interface RunRequest {
  language: CodeLanguage;
  files: { path: string; content: string }[];
  entry: string;
  tests: string;
}

export interface RunTest {
  name: string;
  label: string;
  passed: boolean;
  message: string | null;
}

export interface RunResult {
  ok: boolean;
  timedOut: boolean;
  ms: number;
  error: string | null;
  tests: RunTest[];
  stdout: string;
}

export class RunnerUnavailable extends Error {}

export async function runInSandbox(req: RunRequest): Promise<RunResult | null> {
  const url = process.env.RUNNER_URL;
  if (!url) return null;
  let res: Response;
  try {
    res = await fetch(`${url}/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new RunnerUnavailable(error instanceof Error ? error.message : "The runner didn't answer.");
  }
  const body = (await res.json().catch(() => null)) as (RunResult & { error?: string }) | null;
  if (!res.ok || !body) throw new RunnerUnavailable(body?.error ?? `The runner answered ${res.status}.`);
  return { ...body, error: body.error ?? null, tests: body.tests ?? [], stdout: body.stdout ?? "" };
}
