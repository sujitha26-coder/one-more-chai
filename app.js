/**
 * CAPSTONE 53: AI Logo Concept and Visual Style Guide
 * Full-Stack Frontend Client Application
 * Communicates with Express REST API & SQLite Database
 */

const API_BASE = '/api';

// Application State
let appState = {
  stats: null,
  activeBrand: null,
  brands: [],
  concepts: [],
  benchmarks: [],
  checksHistory: [],
  prompts: [],
  tokens: []
};

// Vector Editor State & History
let editorState = {
  brandText: 'ONE MORE CHAI',
  subtitleText: 'ONE MORE CUP. ONE MORE MEMORY.',
  fontFamily: "'Space Grotesk', sans-serif",
  symbolShape: 'chai_kulhad',
  strokeWidth: 12,
  colorPrimary: '#102A63',
  colorSecondary: '#12D9E8',
  accentColor: '#E91EAB',
  chaiBrown: '#B96A32',
  isLightMode: false
};

const editorHistory = {
  undoStack: [],
  redoStack: []
};

document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initBrandCreation();
  initVectorLogoEditor();
  initBeforeAfterSlider();
  initMockupTabs();
  initPromptBuilder();
  initColorCopy();
  initPresentationMode();
  initSvgExport();
  setupApiEventHandlers();

  // Load initial dynamic data from SQLite Backend
  await refreshBackendData();
});

/* ==========================================================================
   1. Data Fetching from SQLite REST API
   ========================================================================== */
async function refreshBackendData() {
  try {
    const [statsRes, brandsRes, conceptsRes, benchmarksRes, checksRes, promptsRes, tokensRes] = await Promise.all([
      fetch(`${API_BASE}/stats`).then(r => r.json()),
      fetch(`${API_BASE}/brands`).then(r => r.json()),
      fetch(`${API_BASE}/concepts`).then(r => r.json()),
      fetch(`${API_BASE}/originality/benchmarks`).then(r => r.json()),
      fetch(`${API_BASE}/originality/history`).then(r => r.json()),
      fetch(`${API_BASE}/prompts`).then(r => r.json()),
      fetch(`${API_BASE}/styleguide`).then(r => r.json())
    ]);

    if (statsRes.success) appState.stats = statsRes.data;
    if (brandsRes.success) appState.brands = brandsRes.data;
    if (conceptsRes.success) appState.concepts = conceptsRes.data;
    if (benchmarksRes.success) appState.benchmarks = benchmarksRes.data;
    if (checksRes.success) appState.checksHistory = checksRes.data;
    if (promptsRes.success) appState.prompts = promptsRes.data;
    if (tokensRes.success) appState.tokens = tokensRes.data;

    if (appState.stats && appState.stats.activeBrand) {
      appState.activeBrand = appState.stats.activeBrand;
      applyBrandToUI(appState.activeBrand);
      syncEditorWithBrand(appState.activeBrand);
    }

    renderBackendStatus(true);
    renderConcepts();
    renderBenchmarksTable();
    renderChecksHistory();
    renderPromptsList();
    renderBrandsModal();
    updateStatsDisplay();
  } catch (err) {
    console.warn('Backend API connection issue, running in resilient fallback mode:', err);
    renderBackendStatus(false);
  }
}

function renderBackendStatus(isOnline) {
  const statusContainer = document.getElementById('backendStatusContainer');
  if (!statusContainer) return;

  if (isOnline) {
    const totalRecords = (appState.concepts.length + appState.prompts.length + appState.checksHistory.length + appState.brands.length);
    statusContainer.innerHTML = `
      <div class="backend-status-pill">
        <span class="status-dot-pulse"></span>
        <span>SQLite DB Online • ${totalRecords} Records Synced</span>
      </div>
    `;
  } else {
    statusContainer.innerHTML = `
      <div class="backend-status-pill" style="border-color: #f59e0b; color: #fbbf24; background: rgba(245,158,11,0.15);">
        <span>● Local Cache Mode</span>
      </div>
    `;
  }
}

function updateStatsDisplay() {
  if (!appState.stats) return;
  const countEl = document.getElementById('statTotalConcepts');
  if (countEl) countEl.innerText = `${appState.concepts.length} Concept Streams`;

  const distinctivenessEl = document.getElementById('statDistinctiveness');
  if (distinctivenessEl) distinctivenessEl.innerText = `${appState.stats.overallDistinctivenessRating}% Safe Clearance`;
}

/* ==========================================================================
   2. Brand Management (Create & Switch in SQLite)
   ========================================================================== */
function applyBrandToUI(brand) {
  document.querySelectorAll('.brand-dynamic-name').forEach(el => el.innerText = brand.name);
  document.querySelectorAll('.brand-dynamic-tagline').forEach(el => el.innerText = brand.tagline || 'One More Cup. One More Memory.');
  document.querySelectorAll('.brand-dynamic-industry').forEach(el => el.innerText = brand.industry || 'Youth Cafe Culture');

  const pNavy = brand.primary_color || '#102A63';
  const sTurquoise = brand.secondary_color || '#12D9E8';
  const aMagenta = brand.accent_color || '#E91EAB';
  const nChai = brand.neutral_color || '#B96A32';

  document.documentElement.style.setProperty('--brand-navy', pNavy);
  document.documentElement.style.setProperty('--brand-turquoise', sTurquoise);
  document.documentElement.style.setProperty('--brand-magenta', aMagenta);
  document.documentElement.style.setProperty('--brand-chai-brown', nChai);

  // Aliases for component consistency
  document.documentElement.style.setProperty('--brand-emerald', pNavy);
  document.documentElement.style.setProperty('--brand-cyan', sTurquoise);
  document.documentElement.style.setProperty('--brand-accent', aMagenta);
  document.documentElement.style.setProperty('--brand-gradient', `linear-gradient(135deg, ${sTurquoise} 0%, ${aMagenta} 100%)`);
  document.documentElement.style.setProperty('--brand-gradient-hover', `linear-gradient(135deg, #0ec2cf 0%, #d8159b 100%)`);
}

function initBrandCreation() {
  const form = document.getElementById('brandCreationForm');
  const presetOneMoreChai = document.getElementById('presetOneMoreChaiBtn');
  const presetAura = document.getElementById('presetAuraFlowBtn');
  const presetQuantum = document.getElementById('presetQuantumBioBtn');
  const presetSolara = document.getElementById('presetSolaraBtn');

  const pColorInput = document.getElementById('bcPrimaryColor');
  const sColorInput = document.getElementById('bcSecondaryColor');
  const pHex = document.getElementById('bcPrimaryColorHex');
  const sHex = document.getElementById('bcSecondaryColorHex');

  if (pColorInput && pHex) {
    pColorInput.addEventListener('input', (e) => pHex.innerText = e.target.value.toUpperCase());
  }
  if (sColorInput && sHex) {
    sColorInput.addEventListener('input', (e) => sHex.innerText = e.target.value.toUpperCase());
  }

  // Presets
  if (presetOneMoreChai) {
    presetOneMoreChai.addEventListener('click', () => {
      document.getElementById('bcName').value = 'One More Chai';
      document.getElementById('bcIndustry').value = 'Indian Street Chai, Momos & Youth Cafe Culture';
      document.getElementById('bcTagline').value = 'One More Cup. One More Memory.';
      document.getElementById('bcMission').value = 'To unite urban youth through authentic cutting chai, artisanal momos, vibrant conversations, and electric cafe aesthetics.';
      document.getElementById('bcAudience').value = 'College students, young tech professionals, evening hangout circles, street food connoisseurs';
      document.getElementById('bcPersonality').value = 'Youthful, Energetic, Welcoming, Vibrant, Authentic';
      document.getElementById('bcPrimaryColor').value = '#102A63';
      document.getElementById('bcSecondaryColor').value = '#12D9E8';
      if (pHex) pHex.innerText = '#102A63';
      if (sHex) sHex.innerText = '#12D9E8';
      showToast('Loaded One More Chai Brand Preset');
    });
  }

  if (presetAura) {
    presetAura.addEventListener('click', () => {
      document.getElementById('bcName').value = 'AuraFlow Technologies';
      document.getElementById('bcIndustry').value = 'AI & Clean Tech / Bio-Compute';
      document.getElementById('bcTagline').value = 'Harmonizing Biological Intelligence with Clean Computing';
      document.getElementById('bcMission').value = 'To build neural computational systems inspired by natural ecological networks.';
      document.getElementById('bcAudience').value = 'Enterprise research labs, climate tech founders, academic institutions';
      document.getElementById('bcPersonality').value = 'Visionary, Organic, Precise, Ethical';
      document.getElementById('bcPrimaryColor').value = '#059669';
      document.getElementById('bcSecondaryColor').value = '#06b6d4';
      if (pHex) pHex.innerText = '#059669';
      if (sHex) sHex.innerText = '#06b6d4';
      showToast('Loaded AuraFlow Technologies Preset');
    });
  }

  if (presetQuantum) {
    presetQuantum.addEventListener('click', () => {
      document.getElementById('bcName').value = 'QuantumBio Compute';
      document.getElementById('bcIndustry').value = 'Quantum Computing & Genomics';
      document.getElementById('bcTagline').value = 'Ultra-High Density Quantum Synthetics';
      document.getElementById('bcMission').value = 'Accelerating molecular simulations using sub-atomic photonics.';
      document.getElementById('bcAudience').value = 'Pharmaceutical labs and national supercomputing centers';
      document.getElementById('bcPersonality').value = 'Hyper-advanced, Analytical, Groundbreaking';
      document.getElementById('bcPrimaryColor').value = '#0284c7';
      document.getElementById('bcSecondaryColor').value = '#8b5cf6';
      if (pHex) pHex.innerText = '#0284C7';
      if (sHex) sHex.innerText = '#8B5CF6';
      showToast('Loaded QuantumBio Compute Preset');
    });
  }

  if (presetSolara) {
    presetSolara.addEventListener('click', () => {
      document.getElementById('bcName').value = 'Solara Clean Systems';
      document.getElementById('bcIndustry').value = 'Solar Grid Automation & Micro-Storage';
      document.getElementById('bcTagline').value = 'Sunlight Transformed into Infinite Power';
      document.getElementById('bcMission').value = 'Autonomous distributed solar micro-grids for urban centers.';
      document.getElementById('bcAudience').value = 'Municipalities, commercial real estate developers';
      document.getElementById('bcPersonality').value = 'Radiant, Reliable, Sustainable, Warm';
      document.getElementById('bcPrimaryColor').value = '#f59e0b';
      document.getElementById('bcSecondaryColor').value = '#10b981';
      if (pHex) pHex.innerText = '#F59E0B';
      if (sHex) sHex.innerText = '#10B981';
      showToast('Loaded Solara Clean Systems Preset');
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btnSaveBrandProject');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Persisting to SQLite...';
      }

      const brandPayload = {
        name: document.getElementById('bcName').value.trim(),
        industry: document.getElementById('bcIndustry').value.trim(),
        tagline: document.getElementById('bcTagline').value.trim(),
        mission: document.getElementById('bcMission').value.trim(),
        target_audience: document.getElementById('bcAudience').value.trim(),
        personality: document.getElementById('bcPersonality').value.trim(),
        visual_style: document.getElementById('bcStyle').value,
        logo_type: document.getElementById('bcLogoType').value,
        primary_color: document.getElementById('bcPrimaryColor').value,
        secondary_color: document.getElementById('bcSecondaryColor').value,
        competitor_refs: document.getElementById('bcCompetitors').value.trim()
      };

      try {
        const res = await fetch(`${API_BASE}/brands`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(brandPayload)
        });
        const json = await res.json();
        if (json.success) {
          showToast(`Created & Initialized Project "${json.data.name}" in SQLite!`);
          await activateBrand(json.data.id);
        } else {
          showToast('Failed to create brand: ' + (json.error || 'Server error'));
        }
      } catch (err) {
        showToast('Error saving brand: ' + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = '💾 Save & Activate Project in SQLite';
        }
      }
    });
  }
}

function renderBrandsModal() {
  const listEl = document.getElementById('brandsListContainer');
  if (!listEl) return;

  listEl.innerHTML = '';
  appState.brands.forEach(b => {
    const isCur = b.id === appState.activeBrand?.id;
    const card = document.createElement('div');
    card.className = 'cap-card';
    card.style.cssText = `cursor: pointer; margin-bottom: 12px; border-left: 4px solid ${b.primary_color}; ${isCur ? 'background: rgba(6,182,212,0.15); border-color: #06b6d4;' : ''}`;
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4 style="color: #ffffff; margin-bottom: 4px;">${escapeHtml(b.name)} ${isCur ? '<span style="color: #34d399; font-size: 0.75rem;">(Active)</span>' : ''}</h4>
          <p style="font-size: 0.82rem; color: #94a3b8;">${escapeHtml(b.industry)} • ${escapeHtml(b.tagline)}</p>
        </div>
        <button class="btn btn-sm ${isCur ? 'btn-primary' : 'btn-secondary'} btn-activate-brand" data-id="${b.id}">
          ${isCur ? '✓ Active' : 'Activate in DB'}
        </button>
      </div>
    `;

    card.querySelector('.btn-activate-brand').addEventListener('click', async (e) => {
      e.stopPropagation();
      await activateBrand(b.id);
    });

    listEl.appendChild(card);
  });
}

async function activateBrand(brandId) {
  try {
    const res = await fetch(`${API_BASE}/brands/${brandId}/activate`, { method: 'PUT' });
    const json = await res.json();
    if (json.success) {
      appState.activeBrand = json.data;
      applyBrandToUI(json.data);
      syncEditorWithBrand(json.data);
      await refreshBackendData();
      showToast(`Activated ${json.data.name} in SQLite database!`);
      const modal = document.getElementById('brandSwitcherModal');
      if (modal) modal.classList.remove('open');
    }
  } catch (err) {
    showToast('Failed to switch brand: ' + err.message);
  }
}

/* ==========================================================================
   3. AI Concepts Management (Module B - 4 Diverse Streams)
   ========================================================================== */
function renderConcepts() {
  const container = document.getElementById('conceptsGridContainer');
  if (!container) return;

  container.innerHTML = '';
  appState.concepts.forEach(c => {
    const isWinner = c.status === 'winner';
    const card = document.createElement('div');
    card.className = 'cap-card concept-card';
    card.innerHTML = `
      <div class="concept-header-badge">
        <span class="concept-tool-tag">${escapeHtml(c.tool)}</span>
        <span class="concept-verdict ${isWinner ? 'verdict-selected' : 'verdict-alt'}">
          ${isWinner ? '★ Selected Winner' : 'Alternate Stream'}
        </span>
      </div>
      <div class="concept-art-frame">
        ${c.svg_data || `
          <svg viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.08)" stroke-dasharray="3 3"/>
            <path d="M50 16 C30 16, 20 38, 20 54 C20 74, 34 84, 50 84 C66 84, 80 74, 80 54 C80 38, 70 16, 50 16 Z" 
                  fill="none" stroke="var(--brand-cyan)" stroke-width="5" stroke-linecap="round" />
            <path d="M50 32 C44 44, 42 58, 48 70 C52 70, 56 70, 52 70 C58 58, 56 44, 50 32 Z" fill="var(--brand-emerald)" />
            <circle cx="50" cy="48" r="4" fill="#ffffff" />
          </svg>
        `}
      </div>
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <h4>${escapeHtml(c.name)}</h4>
        <span style="font-size: 0.75rem; color: #34d399; font-weight: 700;">★ ${c.rating || 9.0}/10</span>
      </div>
      <p style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 8px;">
        ${escapeHtml(c.rationale)}
      </p>
      <div class="concept-prompt-box">
        "${escapeHtml(c.prompt)}"
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; gap: 8px;">
        <span style="font-size: 0.72rem; color: var(--text-muted);">${c.symbol_type || 'Vector Geometry'}</span>
        <div style="display: flex; gap: 6px;">
          ${!isWinner ? `
            <button class="btn btn-primary btn-sm btn-select-winner" data-id="${c.id}" style="padding: 3px 8px; font-size: 0.75rem;">
              ★ Select
            </button>
            <button class="btn-delete-item btn-del-concept" data-id="${c.id}">✕</button>
          ` : '<span style="font-size: 0.75rem; color: #34d399; font-weight: 700;">✓ Master Asset</span>'}
        </div>
      </div>
    `;

    const winBtn = card.querySelector('.btn-select-winner');
    if (winBtn) {
      winBtn.addEventListener('click', async () => {
        await selectWinnerConcept(c.id);
      });
    }

    const delBtn = card.querySelector('.btn-del-concept');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        if (confirm(`Delete concept "${c.name}" from database?`)) {
          await deleteConcept(c.id);
        }
      });
    }

    container.appendChild(card);
  });
}

async function selectWinnerConcept(id) {
  try {
    const res = await fetch(`${API_BASE}/concepts/${id}/winner`, { method: 'PUT' });
    const json = await res.json();
    if (json.success) {
      showToast(`Selected "${json.data.name}" as Master Brand Asset!`);
      await refreshBackendData();
    }
  } catch (err) {
    showToast('Failed to select winner: ' + err.message);
  }
}

async function deleteConcept(id) {
  try {
    const res = await fetch(`${API_BASE}/concepts/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast('Concept deleted from SQLite database');
      await refreshBackendData();
    }
  } catch (err) {
    showToast('Failed to delete concept: ' + err.message);
  }
}

/* ==========================================================================
   4. Deterministic Vector Logo Editor (Module D)
   ========================================================================== */
function generateEditorSvg(text, subtitle, fontFamily, shape, strokeWidth, color1, color2, isLightMode) {
  let shapePath = '';
  if (shape === 'chai_kulhad') {
    shapePath = `
      <!-- Circular Navy Badge Fill & Neon Magenta Rim -->
      <circle cx="250" cy="200" r="145" fill="${color1}" stroke="#E91EAB" stroke-width="${Math.max(4, strokeWidth / 2)}"/>
      <circle cx="250" cy="200" r="130" fill="none" stroke="${color2}" stroke-width="2" stroke-dasharray="6 6" opacity="0.8"/>
      <circle cx="250" cy="200" r="118" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
      
      <!-- Steaming Traditional Kulhad Cup (#B96A32) -->
      <path d="M 200 185 L 300 185 L 282 275 C 278 290 222 290 218 275 Z" fill="#B96A32" stroke="#E91EAB" stroke-width="${Math.max(3, strokeWidth / 3)}"/>
      <!-- Top Rim Lip & Chai Liquid -->
      <ellipse cx="250" cy="185" rx="50" ry="12" fill="#d97d43" stroke="${color2}" stroke-width="2.5"/>
      <ellipse cx="250" cy="187" rx="42" ry="8" fill="#8f4a1c"/>
      
      <!-- Ceramic Rib Texture Lines -->
      <line x1="220" y1="212" x2="280" y2="212" stroke="rgba(255,255,255,0.3)" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="226" y1="235" x2="274" y2="235" stroke="rgba(255,255,255,0.3)" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="232" y1="256" x2="268" y2="256" stroke="rgba(255,255,255,0.3)" stroke-width="2.5" stroke-linecap="round"/>
      
      <!-- Rising Steaming Vapor in Neon Turquoise (#12D9E8) -->
      <path d="M 228 165 C 215 140 238 120 225 95" fill="none" stroke="${color2}" stroke-width="${Math.max(4, strokeWidth / 2.5)}" stroke-linecap="round"/>
      <path d="M 250 158 C 262 130 242 110 252 82" fill="none" stroke="${color2}" stroke-width="${Math.max(5, strokeWidth / 2)}" stroke-linecap="round"/>
      <path d="M 272 165 C 285 140 262 120 275 95" fill="none" stroke="${color2}" stroke-width="${Math.max(4, strokeWidth / 2.5)}" stroke-linecap="round"/>
      
      <!-- Cafe Neon Accent Stars -->
      <circle cx="165" cy="200" r="5" fill="${color2}"/>
      <circle cx="335" cy="200" r="5" fill="#E91EAB"/>
      <circle cx="250" cy="318" r="3" fill="#FDF6ED"/>
    `;
  } else if (shape === 'synapse') {
    shapePath = `
      <circle cx="250" cy="210" r="150" fill="none" stroke="rgba(255,255,255,${isLightMode ? '0.1' : '0.05'})" stroke-width="2" stroke-dasharray="4 6"/>
      <path d="M 250 80 C 170 80 120 170 120 240 C 120 320 180 360 250 360 C 320 360 380 320 380 240 C 380 170 330 80 250 80 Z" 
            fill="none" stroke="url(#editorGrad)" stroke-width="${strokeWidth}" stroke-linecap="round"/>
      <path d="M 250 140 C 220 190 210 250 250 300 C 290 250 280 190 250 140 Z" fill="${color1}" opacity="0.85"/>
      <circle cx="250" cy="220" r="16" fill="${isLightMode ? '#0f172a' : '#ffffff'}"/>
    `;
  } else if (shape === 'prism') {
    shapePath = `
      <polygon points="250,70 380,310 120,310" fill="none" stroke="url(#editorGrad)" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
      <polygon points="250,140 330,290 170,290" fill="${color1}" opacity="0.4"/>
      <line x1="250" y1="70" x2="250" y2="310" stroke="${color2}" stroke-width="${Math.max(2, strokeWidth / 3)}"/>
      <circle cx="250" cy="210" r="18" fill="${isLightMode ? '#0f172a' : '#ffffff'}"/>
    `;
  } else if (shape === 'helix') {
    shapePath = `
      <path d="M 160 160 C 210 90, 290 90, 340 160 C 390 230, 390 290, 340 360 C 290 430, 210 430, 160 360 C 110 290, 110 230, 160 160 Z" 
            fill="none" stroke="url(#editorGrad)" stroke-width="${strokeWidth}" stroke-linecap="round"/>
      <path d="M 340 160 C 290 230, 210 230, 160 160" fill="none" stroke="${color1}" stroke-width="${strokeWidth / 2}" stroke-linecap="round"/>
      <circle cx="250" cy="260" r="14" fill="${isLightMode ? '#0f172a' : '#ffffff'}"/>
    `;
  } else if (shape === 'hexagon') {
    shapePath = `
      <polygon points="250,80 370,150 370,290 250,360 130,290 130,150" fill="none" stroke="url(#editorGrad)" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
      <circle cx="250" cy="220" r="60" fill="none" stroke="${color2}" stroke-width="${strokeWidth / 2}" stroke-dasharray="6 6"/>
      <circle cx="250" cy="220" r="16" fill="${color1}"/>
    `;
  } else if (shape === 'circle') {
    shapePath = `
      <circle cx="250" cy="220" r="140" fill="none" stroke="url(#editorGrad)" stroke-width="${strokeWidth}"/>
      <circle cx="250" cy="220" r="90" fill="none" stroke="${color1}" stroke-width="${strokeWidth / 2}" stroke-dasharray="8 8"/>
      <circle cx="250" cy="220" r="30" fill="${color2}"/>
      <circle cx="250" cy="220" r="10" fill="${isLightMode ? '#0f172a' : '#ffffff'}"/>
    `;
  } else {
    // infinity ribbon
    shapePath = `
      <path d="M 180 220 C 130 150, 100 290, 180 290 C 250 290, 250 150, 320 150 C 400 150, 370 290, 320 220 C 250 150, 250 290, 180 220 Z" 
            fill="none" stroke="url(#editorGrad)" stroke-width="${strokeWidth}" stroke-linecap="round"/>
      <circle cx="250" cy="220" r="14" fill="${color1}"/>
    `;
  }

  const textColor = isLightMode ? '#0f172a' : '#ffffff';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    <linearGradient id="editorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color1}"/>
      <stop offset="100%" stop-color="${color2}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="${isLightMode ? '#f8fafc' : '#081636'}" rx="24"/>
  ${shapePath}
  <text x="250" y="420" text-anchor="middle" font-family="${fontFamily}" font-size="32" font-weight="800" fill="${textColor}" letter-spacing="4">
    ${escapeHtml(text.toUpperCase())}
  </text>
  <text x="250" y="450" text-anchor="middle" font-family="${fontFamily}" font-size="12" font-weight="600" fill="${color2}" letter-spacing="5">
    ${escapeHtml(subtitle.toUpperCase())}
  </text>
</svg>`;
}

function syncEditorWithBrand(brand) {
  if (!brand) return;
  editorState.brandText = brand.name || 'ONE MORE CHAI';
  editorState.subtitleText = brand.tagline || 'ONE MORE CUP. ONE MORE MEMORY.';
  editorState.colorPrimary = brand.primary_color || '#102A63';
  editorState.colorSecondary = brand.secondary_color || '#12D9E8';
  if ((brand.name || '').toLowerCase().includes('chai')) {
    editorState.symbolShape = 'chai_kulhad';
  }

  const edText = document.getElementById('edBrandText');
  const edSubtitle = document.getElementById('edSubtitleText');
  const edShape = document.getElementById('edSymbolShape');
  const edPColor = document.getElementById('edColorPrimary');
  const edSColor = document.getElementById('edColorSecondary');
  const edPHex = document.getElementById('edColorPrimaryHex');
  const edSHex = document.getElementById('edColorSecondaryHex');

  if (edText) edText.value = editorState.brandText;
  if (edSubtitle) edSubtitle.value = editorState.subtitleText;
  if (edShape) edShape.value = editorState.symbolShape;
  if (edPColor) edPColor.value = editorState.colorPrimary;
  if (edSColor) edSColor.value = editorState.colorSecondary;
  if (edPHex) edPHex.innerText = editorState.colorPrimary.toUpperCase();
  if (edSHex) edSHex.innerText = editorState.colorSecondary.toUpperCase();

  renderEditorCanvas();
}

function renderEditorCanvas() {
  const container = document.getElementById('editorSvgRenderArea');
  const viewport = document.getElementById('editorCanvasViewport');
  if (!container) return;

  const svg = generateEditorSvg(
    editorState.brandText,
    editorState.subtitleText,
    editorState.fontFamily,
    editorState.symbolShape,
    editorState.strokeWidth,
    editorState.colorPrimary,
    editorState.colorSecondary,
    editorState.isLightMode
  );

  container.innerHTML = svg;
  if (viewport) {
    viewport.classList.toggle('light-mode', editorState.isLightMode);
  }
}

function pushEditorHistory() {
  editorHistory.undoStack.push({ ...editorState });
  editorHistory.redoStack = [];
}

function initVectorLogoEditor() {
  const edText = document.getElementById('edBrandText');
  const edSubtitle = document.getElementById('edSubtitleText');
  const edFont = document.getElementById('edFontFamily');
  const edShape = document.getElementById('edSymbolShape');
  const edStroke = document.getElementById('edStrokeWidth');
  const strokeValLabel = document.getElementById('strokeValLabel');
  const edPColor = document.getElementById('edColorPrimary');
  const edSColor = document.getElementById('edColorSecondary');
  const edPHex = document.getElementById('edColorPrimaryHex');
  const edSHex = document.getElementById('edColorSecondaryHex');

  const btnUndo = document.getElementById('btnEditorUndo');
  const btnRedo = document.getElementById('btnEditorRedo');
  const btnToggleBg = document.getElementById('btnToggleEditorBg');
  const btnDownloadSvg = document.getElementById('btnDownloadEditorSvg');
  const btnDownloadPng = document.getElementById('btnDownloadEditorPng');
  const btnSaveRevision = document.getElementById('btnSaveEditorRevision');
  const btnApplyMaster = document.getElementById('btnApplyEditorToProject');

  // Input Listeners
  if (edText) {
    edText.addEventListener('input', (e) => {
      pushEditorHistory();
      editorState.brandText = e.target.value;
      renderEditorCanvas();
    });
  }
  if (edSubtitle) {
    edSubtitle.addEventListener('input', (e) => {
      pushEditorHistory();
      editorState.subtitleText = e.target.value;
      renderEditorCanvas();
    });
  }
  if (edFont) {
    edFont.addEventListener('change', (e) => {
      pushEditorHistory();
      editorState.fontFamily = e.target.value;
      renderEditorCanvas();
    });
  }
  if (edShape) {
    edShape.addEventListener('change', (e) => {
      pushEditorHistory();
      editorState.symbolShape = e.target.value;
      renderEditorCanvas();
    });
  }
  if (edStroke) {
    edStroke.addEventListener('input', (e) => {
      editorState.strokeWidth = parseInt(e.target.value, 10);
      if (strokeValLabel) strokeValLabel.innerText = `${editorState.strokeWidth}px`;
      renderEditorCanvas();
    });
  }
  if (edPColor) {
    edPColor.addEventListener('input', (e) => {
      editorState.colorPrimary = e.target.value;
      if (edPHex) edPHex.innerText = e.target.value.toUpperCase();
      renderEditorCanvas();
    });
  }
  if (edSColor) {
    edSColor.addEventListener('input', (e) => {
      editorState.colorSecondary = e.target.value;
      if (edSHex) edSHex.innerText = e.target.value.toUpperCase();
      renderEditorCanvas();
    });
  }

  // Toolbar Actions
  if (btnUndo) {
    btnUndo.addEventListener('click', () => {
      if (editorHistory.undoStack.length > 0) {
        editorHistory.redoStack.push({ ...editorState });
        editorState = editorHistory.undoStack.pop();
        syncControlsWithEditorState();
        renderEditorCanvas();
        showToast('Undo change');
      }
    });
  }

  if (btnRedo) {
    btnRedo.addEventListener('click', () => {
      if (editorHistory.redoStack.length > 0) {
        editorHistory.undoStack.push({ ...editorState });
        editorState = editorHistory.redoStack.pop();
        syncControlsWithEditorState();
        renderEditorCanvas();
        showToast('Redo change');
      }
    });
  }

  if (btnToggleBg) {
    btnToggleBg.addEventListener('click', () => {
      editorState.isLightMode = !editorState.isLightMode;
      renderEditorCanvas();
    });
  }

  if (btnDownloadSvg) {
    btnDownloadSvg.addEventListener('click', () => {
      const svg = generateEditorSvg(
        editorState.brandText,
        editorState.subtitleText,
        editorState.fontFamily,
        editorState.symbolShape,
        editorState.strokeWidth,
        editorState.colorPrimary,
        editorState.colorSecondary,
        editorState.isLightMode
      );
      downloadFile(svg, `${editorState.brandText.toLowerCase()}-custom-vector.svg`, 'image/svg+xml;charset=utf-8');
      showToast('Downloaded custom SVG vector logo!');
    });
  }

  if (btnDownloadPng) {
    btnDownloadPng.addEventListener('click', () => {
      const svg = generateEditorSvg(
        editorState.brandText,
        editorState.subtitleText,
        editorState.fontFamily,
        editorState.symbolShape,
        editorState.strokeWidth,
        editorState.colorPrimary,
        editorState.colorSecondary,
        editorState.isLightMode
      );
      exportSvgAsPng(svg, `${editorState.brandText.toLowerCase()}-master.png`);
      showToast('Exported 1000×1000 high-res PNG!');
    });
  }

  if (btnSaveRevision) {
    btnSaveRevision.addEventListener('click', async () => {
      const svg = generateEditorSvg(
        editorState.brandText,
        editorState.subtitleText,
        editorState.fontFamily,
        editorState.symbolShape,
        editorState.strokeWidth,
        editorState.colorPrimary,
        editorState.colorSecondary,
        editorState.isLightMode
      );

      try {
        const winnerConcept = appState.concepts.find(c => c.status === 'winner') || appState.concepts[0];
        const cId = winnerConcept ? winnerConcept.id : 1;
        const res = await fetch(`${API_BASE}/concepts/${cId}/revisions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_id: appState.activeBrand?.id || 1,
            revision_name: `Revision (${editorState.symbolShape}) - ${new Date().toLocaleTimeString()}`,
            svg_data: svg,
            settings_json: editorState
          })
        });
        const json = await res.json();
        if (json.success) {
          const notice = document.getElementById('revisionNoticeDisplay');
          if (notice) {
            notice.style.display = 'block';
            notice.innerText = `✓ Saved revision #${json.data.id} directly into SQLite logo_revisions!`;
            setTimeout(() => { notice.style.display = 'none'; }, 3500);
          }
          showToast('Revision stored in SQLite database!');
        }
      } catch (err) {
        showToast('Error saving revision: ' + err.message);
      }
    });
  }

  if (btnApplyMaster) {
    btnApplyMaster.addEventListener('click', async () => {
      const svg = generateEditorSvg(
        editorState.brandText,
        editorState.subtitleText,
        editorState.fontFamily,
        editorState.symbolShape,
        editorState.strokeWidth,
        editorState.colorPrimary,
        editorState.colorSecondary,
        editorState.isLightMode
      );

      try {
        const winnerConcept = appState.concepts.find(c => c.status === 'winner') || appState.concepts[0];
        if (!winnerConcept) return;

        const res = await fetch(`${API_BASE}/concepts/${winnerConcept.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${editorState.brandText} Master Mark (${editorState.symbolShape.toUpperCase()})`,
            svg_data: svg,
            symbol_type: `Vector ${editorState.symbolShape.toUpperCase()}`
          })
        });
        const json = await res.json();
        if (json.success) {
          showToast('Applied editor design as Master Brand Logo across the application!');
          await refreshBackendData();
        }
      } catch (err) {
        showToast('Error applying master logo: ' + err.message);
      }
    });
  }

  renderEditorCanvas();
}

function syncControlsWithEditorState() {
  const edText = document.getElementById('edBrandText');
  const edSubtitle = document.getElementById('edSubtitleText');
  const edFont = document.getElementById('edFontFamily');
  const edShape = document.getElementById('edSymbolShape');
  const edStroke = document.getElementById('edStrokeWidth');
  const strokeValLabel = document.getElementById('strokeValLabel');
  const edPColor = document.getElementById('edColorPrimary');
  const edSColor = document.getElementById('edColorSecondary');
  const edPHex = document.getElementById('edColorPrimaryHex');
  const edSHex = document.getElementById('edColorSecondaryHex');

  if (edText) edText.value = editorState.brandText;
  if (edSubtitle) edSubtitle.value = editorState.subtitleText;
  if (edFont) edFont.value = editorState.fontFamily;
  if (edShape) edShape.value = editorState.symbolShape;
  if (edStroke) edStroke.value = editorState.strokeWidth;
  if (strokeValLabel) strokeValLabel.innerText = `${editorState.strokeWidth}px`;
  if (edPColor) edPColor.value = editorState.colorPrimary;
  if (edSColor) edSColor.value = editorState.colorSecondary;
  if (edPHex) edPHex.innerText = editorState.colorPrimary.toUpperCase();
  if (edSHex) edSHex.innerText = editorState.colorSecondary.toUpperCase();
}

function exportSvgAsPng(svgString, fileName = 'brand-logo.png') {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 1000, 1000);
    URL.revokeObjectURL(url);
    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  img.src = url;
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ==========================================================================
   5. Originality Checker & Trademark Collision History (Module C)
   ========================================================================== */
function renderBenchmarksTable(filter = '') {
  const tableBody = document.getElementById('similarityTableBody');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  const filtered = appState.benchmarks.filter(b =>
    b.benchmark_brand.toLowerCase().includes(filter.toLowerCase()) ||
    b.industry.toLowerCase().includes(filter.toLowerCase())
  );

  filtered.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${escapeHtml(item.benchmark_brand)}</strong></td>
      <td>${escapeHtml(item.industry)}</td>
      <td>${escapeHtml(item.geometric_shape)}</td>
      <td>${escapeHtml(item.color_signature)}</td>
      <td><code>${item.visual_overlap_pct}%</code></td>
      <td><span class="risk-badge risk-low">✓ ${escapeHtml(item.trademark_risk)}</span></td>
    `;
    tableBody.appendChild(row);
  });
}

function renderChecksHistory() {
  const historyContainer = document.getElementById('checksHistoryContainer');
  if (!historyContainer) return;

  if (appState.checksHistory.length === 0) {
    historyContainer.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted);">No custom trademark searches recorded yet.</p>';
    return;
  }

  historyContainer.innerHTML = '';
  appState.checksHistory.slice(0, 5).forEach(chk => {
    const item = document.createElement('div');
    item.style.cssText = 'background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); padding: 10px 14px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;';
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(chk.query_brand)}</strong> 
        <span style="font-size: 0.78rem; color: #94a3b8; margin-left: 8px;">${escapeHtml(chk.uspto_classes || 'Class 09/42')}</span>
      </div>
      <div style="display: flex; gap: 12px; align-items: center;">
        <span style="font-size: 0.85rem; color: #34d399; font-weight: 700;">${chk.overlap_score}% Overlap</span>
        <span class="risk-badge risk-low">${escapeHtml(chk.trademark_verdict || 'Low Risk')}</span>
      </div>
    `;
    historyContainer.appendChild(item);
  });
}

/* ==========================================================================
   6. Prompt Library (Module G - CRUD & SQLite Favorites)
   ========================================================================== */
function renderPromptsList(filterTool = 'all') {
  const container = document.getElementById('promptCardsContainer');
  if (!container) return;

  container.innerHTML = '';
  const filtered = appState.prompts.filter(p => {
    if (filterTool === 'all') return true;
    return p.tool.toLowerCase().includes(filterTool.toLowerCase());
  });

  filtered.forEach(p => {
    const isFav = p.is_favorite === 1;
    const card = document.createElement('div');
    card.className = 'prompt-item-card';
    card.innerHTML = `
      <div class="prompt-top-row">
        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="btn-star-prompt ${isFav ? 'starred' : ''}" data-id="${p.id}" title="Star this prompt in SQLite">
            ★
          </button>
          <strong>${escapeHtml(p.title)}</strong>
          <span class="concept-tool-tag">${escapeHtml(p.tool)}</span>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn btn-secondary btn-sm btn-copy-prompt">📋 Copy</button>
          <button class="btn-delete-item btn-del-prompt" data-id="${p.id}" title="Delete prompt from database">✕</button>
        </div>
      </div>
      <div class="prompt-code-block">${escapeHtml(p.prompt_text)}</div>
      <div class="prompt-params-row">
        <span><strong>Engine:</strong> ${escapeHtml(p.model_name)}</span>
        <span><strong>Guidance Scale:</strong> ${p.guidance_scale}</span>
        <span><strong>Aspect Ratio:</strong> ${escapeHtml(p.aspect_ratio)}</span>
        ${p.negative_prompt ? `<span><strong>Neg:</strong> ${escapeHtml(p.negative_prompt.substring(0, 35))}...</span>` : ''}
      </div>
    `;

    card.querySelector('.btn-copy-prompt').addEventListener('click', () => {
      navigator.clipboard.writeText(p.prompt_text).then(() => {
        showToast('Prompt copied to clipboard!');
      });
    });

    card.querySelector('.btn-star-prompt').addEventListener('click', async () => {
      await toggleStarPrompt(p.id);
    });

    card.querySelector('.btn-del-prompt').addEventListener('click', async () => {
      if (confirm(`Delete prompt "${p.title}" from database?`)) {
        await deletePrompt(p.id);
      }
    });

    container.appendChild(card);
  });
}

async function toggleStarPrompt(id) {
  try {
    const res = await fetch(`${API_BASE}/prompts/${id}/favorite`, { method: 'PATCH' });
    const json = await res.json();
    if (json.success) {
      await refreshBackendData();
    }
  } catch (err) {
    showToast('Failed to star prompt: ' + err.message);
  }
}

async function deletePrompt(id) {
  try {
    const res = await fetch(`${API_BASE}/prompts/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast('Prompt deleted from SQLite');
      await refreshBackendData();
    }
  } catch (err) {
    showToast('Failed to delete prompt: ' + err.message);
  }
}

/* ==========================================================================
   7. Event Handlers Setup for Forms & Modals
   ========================================================================== */
function setupApiEventHandlers() {
  // 1. 4-Stream AI Generator Trigger
  const btnGen4 = document.getElementById('btnGenerate4Streams');
  if (btnGen4) {
    btnGen4.addEventListener('click', async () => {
      btnGen4.disabled = true;
      btnGen4.innerText = '⚡ Synthesizing 4 Streams...';
      try {
        const res = await fetch(`${API_BASE}/concepts/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_id: appState.activeBrand?.id || 1,
            theme_prompt: `${appState.activeBrand?.industry || 'tech'} logo`
          })
        });
        const json = await res.json();
        if (json.success) {
          showToast('Generated 4 distinct AI concept streams in SQLite!');
          await refreshBackendData();
        }
      } catch (err) {
        showToast('Error generating concepts: ' + err.message);
      } finally {
        btnGen4.disabled = false;
        btnGen4.innerText = '⚡ Generate 4 Distinct AI Streams';
      }
    });
  }

  // 2. Trademark Analyzer API trigger
  const runBtn = document.getElementById('runAnalysisBtn');
  const testInput = document.getElementById('testBrandInput');
  const resultDisplay = document.getElementById('analysisResultDisplay');

  if (runBtn && testInput) {
    runBtn.addEventListener('click', async () => {
      const brandName = testInput.value.trim();
      if (!brandName) {
        showToast('Please type a brand name to analyze');
        return;
      }

      runBtn.innerText = 'Querying SQLite Engine...';
      runBtn.disabled = true;

      try {
        const res = await fetch(`${API_BASE}/originality/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_name: brandName,
            brand_id: appState.activeBrand?.id || 1
          })
        });
        const json = await res.json();
        if (json.success) {
          const d = json.data;
          resultDisplay.style.display = 'block';
          resultDisplay.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; padding: 16px; border-radius: 8px;">
              <h4 style="color: #34d399; margin-bottom: 6px;">✓ Clearance Assessment for "${escapeHtml(d.query_brand)}"</h4>
              <p style="font-size: 0.88rem; color: #cbd5e1; margin-bottom: 6px;">
                Feature Overlap Index: <strong>${d.overlap_score}</strong> • Distinctiveness Score: <strong>${d.distinctiveness_score}</strong>
              </p>
              <p style="font-size: 0.82rem; color: #94a3b8; margin-bottom: 8px;">
                <strong>USPTO Clearance:</strong> ${escapeHtml(d.uspto_classes)}
              </p>
              <p style="font-size: 0.82rem; color: #34d399;">
                ${escapeHtml(d.notes)}
              </p>
              <div style="margin-top: 10px; font-size: 0.75rem; color: #94a3b8; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px;">
                <em>Notice: Internal heuristic screening metric. Cross-check with <a href="https://www.uspto.gov" target="_blank" style="color: #38bdf8;">USPTO TESS</a> and <a href="https://www.wipo.int" target="_blank" style="color: #38bdf8;">WIPO Global Brand DB</a>.</em>
              </div>
            </div>
          `;
          showToast(`Analysis complete & saved to SQLite!`);
          await refreshBackendData();
        }
      } catch (err) {
        showToast('Analysis error: ' + err.message);
      } finally {
        runBtn.innerText = 'Analyze Trademark Risk';
        runBtn.disabled = false;
      }
    });
  }

  // 3. Add New Prompt Modal / Form Submit
  const addPromptForm = document.getElementById('newPromptForm');
  if (addPromptForm) {
    addPromptForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('npTitle').value.trim();
      const tool = document.getElementById('npTool').value;
      const model = document.getElementById('npModel').value.trim() || 'Standard';
      const promptText = document.getElementById('npText').value.trim();
      const negText = document.getElementById('npNeg').value.trim();

      if (!title || !promptText) {
        showToast('Please fill in title and prompt text');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/prompts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            tool,
            model_name: model,
            prompt_text: promptText,
            negative_prompt: negText,
            guidance_scale: 7.5,
            aspect_ratio: '1:1'
          })
        });
        const json = await res.json();
        if (json.success) {
          showToast('New prompt saved into database!');
          addPromptForm.reset();
          const modal = document.getElementById('addPromptModal');
          if (modal) modal.classList.remove('open');
          await refreshBackendData();
        }
      } catch (err) {
        showToast('Error saving prompt: ' + err.message);
      }
    });
  }

  // 4. Add New Concept Form Submit
  const addConceptForm = document.getElementById('newConceptForm');
  if (addConceptForm) {
    addConceptForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('ncName').value.trim();
      const tool = document.getElementById('ncTool').value;
      const rationale = document.getElementById('ncRationale').value.trim();
      const promptText = document.getElementById('ncPrompt').value.trim();
      const rating = parseFloat(document.getElementById('ncRating').value) || 9.0;

      if (!name || !promptText) {
        showToast('Please provide concept name and prompt');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/concepts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_id: appState.activeBrand?.id || 1,
            name,
            tool,
            rationale,
            prompt: promptText,
            rating,
            status: 'alternate',
            symbol_type: 'Geometric Vector'
          })
        });
        const json = await res.json();
        if (json.success) {
          showToast('New concept stream saved into SQLite!');
          addConceptForm.reset();
          const modal = document.getElementById('addConceptModal');
          if (modal) modal.classList.remove('open');
          await refreshBackendData();
        }
      } catch (err) {
        showToast('Error saving concept: ' + err.message);
      }
    });
  }

  // 5. Modal Triggers
  wireModalTrigger('openAddPromptBtn', 'addPromptModal', 'closeAddPromptBtn');
  wireModalTrigger('openAddConceptBtn', 'addConceptModal', 'closeAddConceptBtn');
  wireModalTrigger('openBrandModalBtn', 'brandSwitcherModal', 'closeBrandModalBtn');

  // 6. Prompt Filter buttons
  document.querySelectorAll('.prompt-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.prompt-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPromptsList(btn.getAttribute('data-filter'));
    });
  });

  // 7. Benchmark search input
  const origSearch = document.getElementById('origSearchInput');
  if (origSearch) {
    origSearch.addEventListener('input', (e) => {
      renderBenchmarksTable(e.target.value);
    });
  }
}

function wireModalTrigger(openId, modalId, closeId) {
  const openBtn = document.getElementById(openId);
  const modal = document.getElementById(modalId);
  const closeBtn = document.getElementById(closeId);

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => modal.classList.add('open'));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  }
}

/* ==========================================================================
   8. Navigation & Utilities
   ========================================================================== */
function initNavigation() {
  const tabButtons = document.querySelectorAll('.nav-tab-btn');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetId = btn.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        const headerOffset = 130;
        const offsetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    });
  });
}

function initBeforeAfterSlider() {
  const container = document.getElementById('baSliderWrapper');
  const afterLayer = document.getElementById('baImageAfter');
  const handle = document.getElementById('baSliderHandle');
  const rangeInput = document.getElementById('baRangeInput');

  if (!container || !afterLayer || !handle || !rangeInput) return;

  function updateSlider(percent) {
    const clamped = Math.max(0, Math.min(100, percent));
    afterLayer.style.clipPath = `polygon(0 0, ${clamped}% 0, ${clamped}% 100%, 0 100%)`;
    handle.style.left = `${clamped}%`;
    rangeInput.value = clamped;
  }

  rangeInput.addEventListener('input', (e) => updateSlider(e.target.value));

  let isDragging = false;
  const onPointerMove = (e) => {
    if (!isDragging) return;
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const percent = ((clientX - rect.left) / rect.width) * 100;
    updateSlider(percent);
  };

  const stopDragging = () => {
    isDragging = false;
    window.removeEventListener('mousemove', onPointerMove);
    window.removeEventListener('touchmove', onPointerMove);
  };

  handle.addEventListener('mousedown', () => {
    isDragging = true;
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', stopDragging);
  });

  handle.addEventListener('touchstart', () => {
    isDragging = true;
    window.addEventListener('touchmove', onPointerMove);
    window.addEventListener('touchend', stopDragging);
  });
}

function initMockupTabs() {
  const mockupTabs = document.querySelectorAll('.mockup-tab-btn');
  const mockupItems = document.querySelectorAll('.mockup-item');

  mockupTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      mockupTabs.forEach(b => b.classList.remove('active'));
      mockupItems.forEach(item => item.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-mockup');
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.classList.add('active');
    });
  });
}

function initPromptBuilder() {
  const bStyle = document.getElementById('pbStyle');
  const bSubject = document.getElementById('pbSubject');
  const bLighting = document.getElementById('pbLighting');
  const bTool = document.getElementById('pbTool');
  const outputCode = document.getElementById('pbOutput');
  const copyBtn = document.getElementById('pbCopyBtn');

  if (!bStyle || !outputCode) return;

  function update() {
    let p = `Vector logo mark, ${bSubject.value}, ${bStyle.value}, ${bLighting.value}, pure minimalist geometry, clean lines, scalable SVG aesthetic, Behance award winner`;
    if (bTool && bTool.value === 'leonardo') p += ` --negative blurry, noisy, raster, text, gradients`;
    outputCode.innerText = p;
  }

  [bStyle, bSubject, bLighting, bTool].filter(Boolean).forEach(el => el.addEventListener('change', update));
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(outputCode.innerText).then(() => {
        showToast('Prompt copied to clipboard!');
      });
    });
  }
  update();
}

function initColorCopy() {
  document.querySelectorAll('.code-copyable').forEach(codeEl => {
    codeEl.addEventListener('click', () => {
      const text = codeEl.innerText.split(':')[1]?.trim() || codeEl.innerText.trim();
      navigator.clipboard.writeText(text).then(() => {
        showToast(`Copied ${text} to clipboard!`);
      });
    });
  });
}

function initPresentationMode() {
  const openBtn = document.getElementById('startPresentationBtn');
  const closeBtn = document.getElementById('closePresBtn');
  const overlay = document.getElementById('presentationOverlay');
  const nextBtn = document.getElementById('presNextBtn');
  const prevBtn = document.getElementById('presPrevBtn');
  const countLabel = document.getElementById('presSlideCounter');
  const slides = document.querySelectorAll('.pres-slide');

  let current = 0;
  function update() {
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    if (countLabel) countLabel.innerText = `Slide ${current + 1} of ${slides.length}`;
  }

  if (openBtn && overlay) {
    openBtn.addEventListener('click', () => {
      overlay.classList.add('active');
      current = 0;
      update();
    });
  }
  if (closeBtn && overlay) {
    closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (current < slides.length - 1) {
        current++;
        update();
      }
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (current > 0) {
        current--;
        update();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (!overlay || !overlay.classList.contains('active')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
      if (current < slides.length - 1) { current++; update(); }
    } else if (e.key === 'ArrowLeft') {
      if (current > 0) { current--; update(); }
    } else if (e.key === 'Escape') {
      overlay.classList.remove('active');
    }
  });
}

function initSvgExport() {
  const exportBtn = document.getElementById('downloadSvgBtn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => {
    const winner = appState.concepts.find(c => c.status === 'winner');
    const svgCode = winner?.svg_data || generateEditorSvg(
      editorState.brandText,
      editorState.subtitleText,
      editorState.fontFamily,
      'synapse',
      16,
      editorState.colorPrimary,
      editorState.colorSecondary,
      false
    );

    downloadFile(svgCode, `${(appState.activeBrand?.name || 'brand').toLowerCase().replace(/\s+/g, '-')}-vector-logo.svg`, 'image/svg+xml;charset=utf-8');
    showToast('Vector SVG downloaded!');
  });
}

function showToast(msg) {
  let toast = document.getElementById('toastNotice');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toastNotice';
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>✓</span> <span>${escapeHtml(msg)}</span>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
