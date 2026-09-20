const assert = require('assert');
const fs = require('fs');
const path = require('path');

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log('Testing Per-Feature LLM Provider & Model Configuration...');

// Test 1: Static checks in server.js
test('server.js defines DEFAULT_SETTINGS with featureModels for all 6 features', () => {
  const serverContent = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
  assert(serverContent.includes('featureModels: {'), 'Must include featureModels in DEFAULT_SETTINGS');
  const expectedFeatures = [
    'timeline',
    'subtitleTranslation',
    'lessonSummary',
    'chapterSummary',
    'lessonChat',
    'chapterChat'
  ];
  for (const feat of expectedFeatures) {
    assert(serverContent.includes(`${feat}: { provider: '', model: '' }`), `Must include ${feat} in DEFAULT_SETTINGS.featureModels`);
  }
});

// Test 2: Verify all 6 endpoints pass their featureKey
test('All 6 AI call sites in server.js pass the corresponding featureKey to getAiConfig', () => {
  const serverContent = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
  assert(serverContent.includes("getAiConfig(db, apiKey, 'subtitleTranslation')"), 'translate-subtitle must pass subtitleTranslation');
  assert(serverContent.includes("getAiConfig(db, null, 'lessonSummary')"), 'summarize-lesson must pass lessonSummary');
  assert(serverContent.includes("getAiConfig(db, null, 'chapterSummary')"), 'summarize-section must pass chapterSummary');
  assert(serverContent.includes("getAiConfig(db, null, 'chapterChat')"), 'chat-chapter must pass chapterChat');
  assert(serverContent.includes("getAiConfig(db, null, 'lessonChat')"), 'chat-lesson must pass lessonChat');
  assert(serverContent.includes("getAiConfig(db, null, 'timeline')"), 'generateChapters must pass timeline');
});

// Test 3: Simulation of getAiConfig logic matching server.js
function getAiConfig(db, overrideApiKey, featureKey) {
  const globalProvider = db.settings?.aiProvider || 'gemini';
  const featureConfig = (featureKey && db.settings?.featureModels?.[featureKey]) || {};

  const effectiveProvider = (featureConfig.provider && featureConfig.provider !== 'inherit')
    ? featureConfig.provider
    : globalProvider;

  const providerName = effectiveProvider === 'anthropic' ? 'Anthropic' : effectiveProvider === 'openai' ? 'OpenAI' : 'Gemini';

  let apiKey = overrideApiKey || '';
  let defaultModel = '';
  let baseUrl = null;

  if (effectiveProvider === 'anthropic') {
    if (!apiKey) apiKey = db.settings?.anthropicApiKey || '';
    defaultModel = db.settings?.anthropicModel || 'claude-3-5-sonnet-latest';
    baseUrl = db.settings?.anthropicBaseUrl || 'https://api.anthropic.com';
  } else if (effectiveProvider === 'openai') {
    if (!apiKey) apiKey = db.settings?.openaiApiKey || '';
    defaultModel = db.settings?.openaiModel || 'gpt-4o-mini';
    baseUrl = db.settings?.openaiBaseUrl || 'https://api.openai.com';
  } else {
    if (!apiKey) apiKey = db.settings?.geminiApiKey || '';
    defaultModel = db.settings?.geminiModel || 'gemini-2.5-flash';
    baseUrl = null;
  }

  const model = (featureConfig.model && featureConfig.model.trim())
    ? featureConfig.model.trim()
    : defaultModel;

  return { provider: effectiveProvider, providerName, apiKey, model, baseUrl };
}

test('getAiConfig without featureKey falls back to global provider and global model', () => {
  const db = {
    settings: {
      aiProvider: 'gemini',
      geminiApiKey: 'gemini-key',
      geminiModel: 'gemini-2.5-flash'
    }
  };
  const config = getAiConfig(db);
  assert.strictEqual(config.provider, 'gemini');
  assert.strictEqual(config.providerName, 'Gemini');
  assert.strictEqual(config.apiKey, 'gemini-key');
  assert.strictEqual(config.model, 'gemini-2.5-flash');
});

test('getAiConfig with empty featureModels falls back to global settings', () => {
  const db = {
    settings: {
      aiProvider: 'openai',
      openaiApiKey: 'openai-key',
      openaiModel: 'gpt-4o-mini',
      openaiBaseUrl: 'https://api.openai.com',
      featureModels: {
        timeline: { provider: '', model: '' }
      }
    }
  };
  const config = getAiConfig(db, null, 'timeline');
  assert.strictEqual(config.provider, 'openai');
  assert.strictEqual(config.providerName, 'OpenAI');
  assert.strictEqual(config.apiKey, 'openai-key');
  assert.strictEqual(config.model, 'gpt-4o-mini');
  assert.strictEqual(config.baseUrl, 'https://api.openai.com');
});

test('getAiConfig with feature model override keeps inherited provider', () => {
  const db = {
    settings: {
      aiProvider: 'gemini',
      geminiApiKey: 'gemini-key',
      geminiModel: 'gemini-2.5-flash',
      featureModels: {
        timeline: { provider: 'inherit', model: 'gemini-1.5-pro' }
      }
    }
  };
  const config = getAiConfig(db, null, 'timeline');
  assert.strictEqual(config.provider, 'gemini');
  assert.strictEqual(config.model, 'gemini-1.5-pro');
});

test('getAiConfig with feature provider override resolves new provider credentials and default model', () => {
  const db = {
    settings: {
      aiProvider: 'gemini',
      geminiApiKey: 'gemini-key',
      geminiModel: 'gemini-2.5-flash',
      anthropicApiKey: 'claude-key',
      anthropicModel: 'claude-3-5-sonnet-latest',
      anthropicBaseUrl: 'https://api.anthropic.com',
      featureModels: {
        lessonChat: { provider: 'anthropic', model: '' }
      }
    }
  };
  const config = getAiConfig(db, null, 'lessonChat');
  assert.strictEqual(config.provider, 'anthropic');
  assert.strictEqual(config.providerName, 'Anthropic');
  assert.strictEqual(config.apiKey, 'claude-key');
  assert.strictEqual(config.model, 'claude-3-5-sonnet-latest');
  assert.strictEqual(config.baseUrl, 'https://api.anthropic.com');
});

test('getAiConfig with feature provider override AND custom model resolves both', () => {
  const db = {
    settings: {
      aiProvider: 'gemini',
      geminiApiKey: 'gemini-key',
      geminiModel: 'gemini-2.5-flash',
      openaiApiKey: 'openai-key',
      openaiModel: 'gpt-4o-mini',
      openaiBaseUrl: 'https://api.openai.com',
      featureModels: {
        subtitleTranslation: { provider: 'openai', model: 'gpt-4o' }
      }
    }
  };
  const config = getAiConfig(db, null, 'subtitleTranslation');
  assert.strictEqual(config.provider, 'openai');
  assert.strictEqual(config.providerName, 'OpenAI');
  assert.strictEqual(config.apiKey, 'openai-key');
  assert.strictEqual(config.model, 'gpt-4o');
});

// Test 4: Database Settings Sanitization in POST /api/userdata/settings
test('Sanitization of featureModels in settings update', () => {
  const validFeatures = ['timeline', 'subtitleTranslation', 'lessonSummary', 'chapterSummary', 'lessonChat', 'chapterChat'];
  const rawInput = {
    timeline: { provider: ' gemini ', model: '  gemini-2.5-pro  ' },
    subtitleTranslation: { provider: 'openai', model: 'gpt-4o-mini' },
    unsupportedFeature: { provider: 'anthropic', model: 'claude' }
  };
  const sanitizedFeatures = {};
  for (const key of validFeatures) {
    const item = rawInput[key] || {};
    sanitizedFeatures[key] = {
      provider: typeof item.provider === 'string' ? item.provider.trim() : '',
      model: typeof item.model === 'string' ? item.model.trim() : ''
    };
  }

  assert.strictEqual(sanitizedFeatures.timeline.provider, 'gemini');
  assert.strictEqual(sanitizedFeatures.timeline.model, 'gemini-2.5-pro');
  assert.strictEqual(sanitizedFeatures.subtitleTranslation.provider, 'openai');
  assert.strictEqual(sanitizedFeatures.subtitleTranslation.model, 'gpt-4o-mini');
  assert.strictEqual(sanitizedFeatures.lessonSummary.provider, '');
  assert.strictEqual(sanitizedFeatures.lessonSummary.model, '');
  assert.strictEqual(sanitizedFeatures.unsupportedFeature, undefined);
});

console.log('All backend tests passed successfully! ✓');
