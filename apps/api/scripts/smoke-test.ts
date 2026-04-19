type SmokeMode = 'local' | 'remote';

type JsonRecord = Record<string, any>;

const baseOrigin = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3001').replace(/\/+$/, '');
const apiBase = baseOrigin.endsWith('/api') ? baseOrigin : `${baseOrigin}/api`;
const healthUrl = baseOrigin.endsWith('/api') ? `${baseOrigin.slice(0, -4)}/health` : `${baseOrigin}/health`;
const mode = (process.env.SMOKE_MODE || 'remote') as SmokeMode;
const adminEmail = process.env.SMOKE_ADMIN_EMAIL || 'admin@owlmentor.com';
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || 'Admin@123456';
const allowWrites = process.env.SMOKE_ALLOW_WRITES === 'true' || mode === 'local';

let adminToken: string | null = null;
let createdTopicId: string | null = null;

function logStep(name: string) {
  console.log(`\n[smoke] ${name}`);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function parseJson(response: Response): Promise<JsonRecord> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Expected JSON response from ${response.url}, got: ${text.slice(0, 240)}`);
  }
}

async function request(
  path: string,
  init: RequestInit & {
    expectedStatus?: number;
    expectedSuccess?: boolean;
    auth?: boolean;
  } = {}
): Promise<{ response: Response; json: JsonRecord }> {
  const {
    expectedStatus = 200,
    expectedSuccess = true,
    auth = false,
    headers,
    ...rest
  } = init;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  if (auth) {
    assert(adminToken, 'Admin token is missing for authenticated request');
    finalHeaders.Authorization = `Bearer ${adminToken}`;
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...rest,
    headers: finalHeaders,
  });
  const json = await parseJson(response);

  if (response.status !== expectedStatus) {
    throw new Error(
      `${path} returned ${response.status}, expected ${expectedStatus}. Body: ${JSON.stringify(json)}`
    );
  }

  if (typeof json.success !== 'undefined' && json.success !== expectedSuccess) {
    throw new Error(
      `${path} success=${json.success}, expected ${expectedSuccess}. Body: ${JSON.stringify(json)}`
    );
  }

  return { response, json };
}

async function checkHealth() {
  logStep('GET /health');
  const response = await fetch(healthUrl);
  const json = await parseJson(response);
  assert(response.status === 200, `Health returned ${response.status}`);
  assert(json.status === 'ok', `Unexpected health payload: ${JSON.stringify(json)}`);
  console.log(`[ok] health status=${json.status}`);
}

async function checkPublicEndpoints() {
  logStep('GET /topics and /mentors');

  const topics = await request('/topics?limit=1');
  assert(topics.json.data && typeof topics.json.data.total === 'number', 'Topics payload missing total');

  const mentors = await request('/mentors');
  assert(mentors.json.data && typeof mentors.json.data.total === 'number', 'Mentors payload missing total');

  console.log(`[ok] topics.total=${topics.json.data.total}, mentors.total=${mentors.json.data.total}`);
}

async function checkUnauthorizedAdminRoute() {
  logStep('GET /admin/stats without token');
  const { json } = await request('/admin/stats', {
    expectedStatus: 401,
    expectedSuccess: false,
    auth: false,
    headers: {},
  });
  assert(json.error?.code, 'Expected structured unauthorized error');
  console.log(`[ok] unauthorized admin route blocked with code=${json.error.code}`);
}

async function loginAsAdmin() {
  logStep('POST /auth/login as admin');
  const { json } = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });

  assert(json.data?.token, 'Login response missing token');
  assert(Array.isArray(json.data?.user?.roles), 'Login response missing roles');
  assert(json.data.user.roles.includes('admin'), 'Login user is not admin');
  adminToken = json.data.token;

  console.log(`[ok] logged in as ${json.data.user.email}`);
}

async function checkAuthMe() {
  logStep('GET /auth/me');
  const { json } = await request('/auth/me', { auth: true });
  assert(json.data?.email === adminEmail, `Expected /auth/me email ${adminEmail}, got ${json.data?.email}`);
  assert(json.data?.roles?.includes('admin'), 'Expected admin role from /auth/me');
  console.log('[ok] auth/me returned admin user');
}

async function checkAdminStats() {
  logStep('GET /admin/stats');
  const { json } = await request('/admin/stats', { auth: true });
  assert(typeof json.data?.totalUsers === 'number', 'Admin stats missing totalUsers');
  assert(json.data?.credits, 'Admin stats missing credits payload');
  console.log(`[ok] admin stats totalUsers=${json.data.totalUsers}`);
}

async function checkAdminTopicWriteFlow() {
  if (!allowWrites) {
    console.log('\n[smoke] Skipping write checks in read-only mode');
    return;
  }

  const unique = `smoke-${Date.now()}`;

  logStep('POST /topics');
  const create = await request('/topics', {
    method: 'POST',
    auth: true,
    expectedStatus: 201,
    body: JSON.stringify({
      name: `Smoke Topic ${unique}`,
      category: 'Engineering',
      description: 'Temporary topic created by CI smoke test',
    }),
  });

  createdTopicId = create.json.data?.id;
  assert(createdTopicId, 'Created topic missing id');
  console.log(`[ok] created topic id=${createdTopicId}`);

  logStep('GET /topics/:id');
  const getTopic = await request(`/topics/${createdTopicId}`);
  assert(getTopic.json.data?.id === createdTopicId, 'Fetched topic id mismatch');
  assert(getTopic.json.data?.name.includes('Smoke Topic'), 'Fetched topic name mismatch');
  console.log('[ok] fetched created topic');

  logStep('DELETE /topics/:id');
  const deleteTopic = await request(`/topics/${createdTopicId}`, {
    method: 'DELETE',
    auth: true,
  });
  assert(deleteTopic.json.data?.message, 'Delete topic response missing message');
  console.log('[ok] deactivated created topic');
}

async function cleanup() {
  if (!createdTopicId || !adminToken || !allowWrites) return;

  try {
    await request(`/topics/${createdTopicId}`, {
      method: 'DELETE',
      auth: true,
    });
  } catch {
    // Best-effort cleanup only.
  }
}

async function run() {
  console.log(`[smoke] base=${baseOrigin}`);
  console.log(`[smoke] mode=${mode}`);
  console.log(`[smoke] writes=${allowWrites}`);

  try {
    await checkHealth();
    await checkPublicEndpoints();
    await checkUnauthorizedAdminRoute();
    await loginAsAdmin();
    await checkAuthMe();
    await checkAdminStats();
    await checkAdminTopicWriteFlow();
    console.log('\n[smoke] PASS');
  } catch (error) {
    console.error('\n[smoke] FAIL');
    console.error(error instanceof Error ? error.message : error);
    await cleanup();
    process.exit(1);
  }
}

run();
