const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server');

test('CAPSTONE 53 NATIVE INTEGRATION TEST SUITE', async (t) => {
  let server;
  let baseUrl;

  // Setup ephemeral test server
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  t.after(() => {
    if (server) server.close();
  });

  await t.test('1. GET /api/health should return UP status and SQLite WAL info', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'UP');
    assert.match(data.database, /SQLite/i);
    assert.ok(data.activeBrand);
  });

  await t.test('2. GET /api/stats should return high-level capstone metrics', async () => {
    const res = await fetch(`${baseUrl}/api/stats`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.totalConcepts >= 4);
    assert.ok(body.data.totalPrompts >= 4);
    assert.equal(body.data.rubricScore, 100);
  });

  await t.test('3. Brand Management: Create, Activate & Fetch', async () => {
    // Create new brand
    const createRes = await fetch(`${baseUrl}/api/brands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'EcoNexus AI',
        tagline: 'Sustainable Intelligence for Planetary Systems',
        industry: 'Climate Tech & AI',
        primary_color: '#10b981',
        secondary_color: '#3b82f6'
      })
    });
    assert.equal(createRes.status, 201);
    const createData = await createRes.json();
    assert.equal(createData.success, true);
    const newBrandId = createData.data.id;
    assert.ok(newBrandId);

    // Activate brand
    const actRes = await fetch(`${baseUrl}/api/brands/${newBrandId}/activate`, { method: 'PUT' });
    assert.equal(actRes.status, 200);
    const actData = await actRes.json();
    assert.equal(actData.data.is_active, 1);

    // Verify in stats
    const statsRes = await fetch(`${baseUrl}/api/stats`);
    const statsData = await statsRes.json();
    assert.equal(statsData.data.activeBrand.name, 'EcoNexus AI');
  });

  await t.test('4. AI Concepts: Multi-Stream Generation & Selection', async () => {
    const genRes = await fetch(`${baseUrl}/api/concepts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme_prompt: 'Planetary neural network icon' })
    });
    assert.equal(genRes.status, 201);
    const genData = await genRes.json();
    assert.equal(genData.success, true);
    assert.equal(genData.data.length, 4);

    const winnerId = genData.data[0].id;
    const winRes = await fetch(`${baseUrl}/api/concepts/${winnerId}/winner`, { method: 'PUT' });
    assert.equal(winRes.status, 200);
    const winData = await winRes.json();
    assert.equal(winData.data.status, 'winner');
  });

  await t.test('5. Originality & Trademark Clearance Engine', async () => {
    const res = await fetch(`${baseUrl}/api/originality/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_name: 'Spotify Audio Labs' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.distinctiveness_score);
    assert.ok(body.data.trademark_verdict);
    assert.ok(body.data.uspto_classes);
  });

  await t.test('6. Prompt Library CRUD & Star Persistence', async () => {
    // Create prompt
    const pRes = await fetch(`${baseUrl}/api/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Minimalist Vector Test Mark',
        tool: 'Leonardo.ai',
        prompt_text: 'A clean monoline geometric mark of an eco neural leaf',
        model_name: 'Diffusion XL'
      })
    });
    assert.equal(pRes.status, 201);
    const pData = await pRes.json();
    const pId = pData.data.id;

    // Star prompt
    const starRes = await fetch(`${baseUrl}/api/prompts/${pId}/favorite`, { method: 'PATCH' });
    assert.equal(starRes.status, 200);
    const starData = await starRes.json();
    assert.equal(starData.data.is_favorite, 1);

    // Delete prompt
    const delRes = await fetch(`${baseUrl}/api/prompts/${pId}`, { method: 'DELETE' });
    assert.equal(delRes.status, 200);
  });

  await t.test('7. Style Guide & Mockup Configurations', async () => {
    const sgRes = await fetch(`${baseUrl}/api/styleguide`);
    assert.equal(sgRes.status, 200);
    const sgData = await sgRes.json();
    assert.ok(sgData.data.tokens_json);

    const mockRes = await fetch(`${baseUrl}/api/mockups`);
    assert.equal(mockRes.status, 200);
    const mockData = await mockRes.json();
    assert.ok(mockData.data.length >= 6);
  });

  await t.test('8. Export Dossier JSON and Full Submission ZIP Bundle', async () => {
    const jsonRes = await fetch(`${baseUrl}/api/export/dossier`);
    assert.equal(jsonRes.status, 200);
    assert.match(jsonRes.headers.get('content-type'), /application\/json/);
    const dossier = await jsonRes.json();
    assert.equal(dossier.academicProject, 'CAPSTONE 53: AI LOGO CONCEPT & VISUAL STYLE GUIDE');

    const zipRes = await fetch(`${baseUrl}/api/export/zip`);
    assert.equal(zipRes.status, 200);
    assert.equal(zipRes.headers.get('content-type'), 'application/zip');
    const zipBlob = await zipRes.arrayBuffer();
    assert.ok(zipBlob.byteLength > 500); // Binary ZIP file has content
  });
});
