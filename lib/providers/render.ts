export interface RenderBrief {
  room: string;
  camera_angles: string[];
  lighting: string;
  key_materials: string[];
  palette: string[];
  [key: string]: unknown;
}

export interface RenderJob {
  job_id: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  output_url?: string;
}

export interface RenderProvider {
  dispatch(brief: RenderBrief): Promise<RenderJob>;
  poll(jobId: string): Promise<RenderJob>;
}

class GenerativeRenderProvider implements RenderProvider {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    const url = process.env.RENDER_API_URL;
    const key = process.env.RENDER_API_KEY;
    if (!url || !key) throw new Error('RENDER_API_URL and RENDER_API_KEY must be set');
    this.apiUrl = url;
    this.apiKey = key;
  }

  async dispatch(brief: RenderBrief): Promise<RenderJob> {
    const res = await fetch(`${this.apiUrl}/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(brief),
    });
    if (!res.ok) throw new Error(`Render provider error: ${res.status}`);
    const data = (await res.json()) as { job_id: string; status: RenderJob['status'] };
    return { job_id: data.job_id, status: data.status };
  }

  async poll(jobId: string): Promise<RenderJob> {
    const res = await fetch(`${this.apiUrl}/render/${jobId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!res.ok) throw new Error(`Render provider error: ${res.status}`);
    const data = (await res.json()) as RenderJob;
    return data;
  }
}

export function getRenderProvider(): RenderProvider {
  const provider = process.env.RENDER_PROVIDER ?? 'generative';
  if (provider === 'generative') return new GenerativeRenderProvider();
  throw new Error(`Unknown render provider: ${provider}`);
}
