import { settings } from '../config.js';

interface TraceContext {
  traceId: string;
  name: string;
  input: Record<string, unknown>;
  startTime: number;
}

interface OpikClient {
  trace(params: { name: string; input: Record<string, unknown> }): TraceHandle;
}

interface TraceHandle {
  id: string;
  update(params: { output?: unknown; metadata?: Record<string, unknown> }): void;
  end(): void;
}

let opikClient: OpikClient | null = null;

export async function initTracing(): Promise<void> {
  if (!settings.opikEnabled) {
    console.log('Opik tracing disabled');
    return;
  }

  try {
    const { Opik } = await import('opik');
    opikClient = new Opik({
      apiKey: settings.opikApiKey || undefined,
      projectName: settings.opikProjectName,
    }) as OpikClient;
    console.log(`Opik tracing initialized for project: ${settings.opikProjectName}`);
  } catch (error) {
    console.warn('Failed to initialize Opik:', error);
  }
}

export function createTrace(name: string, input: Record<string, unknown>): TraceHandle | null {
  if (!opikClient) {
    return null;
  }

  try {
    return opikClient.trace({ name, input });
  } catch (error) {
    console.warn('Failed to create trace:', error);
    return null;
  }
}

export function track<T extends (...args: unknown[]) => Promise<unknown>>(
  name: string,
  fn: T
): T {
  return (async (...args: unknown[]) => {
    const trace = createTrace(name, { args });
    const startTime = Date.now();

    try {
      const result = await fn(...args);
      trace?.update({
        output: result,
        metadata: { durationMs: Date.now() - startTime },
      });
      trace?.end();
      return result;
    } catch (error) {
      trace?.update({
        output: { error: String(error) },
        metadata: { durationMs: Date.now() - startTime, success: false },
      });
      trace?.end();
      throw error;
    }
  }) as T;
}
