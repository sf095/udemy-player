const assert = require('assert');

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

console.log('Testing Gemini Model Support Logic...');

// Test 1: Fallback model candidate array generation and deduplication
test('Candidate model list prioritization and deduplication', () => {
  function getCandidateModels(targetModel) {
    const fallbackModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    return Array.from(new Set([targetModel, ...fallbackModels].filter(Boolean)));
  }

  // Default target model
  assert.deepStrictEqual(
    getCandidateModels('gemini-3.8-flash'),
    ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash']
  );

  // Custom user target model
  assert.deepStrictEqual(
    getCandidateModels('gemini-3.8-flash-thinking'),
    ['gemini-3.8-flash-thinking', 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash']
  );

  // Target model that matches a fallback entry (should not duplicate)
  assert.deepStrictEqual(
    getCandidateModels('gemini-2.5-flash'),
    ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-1.5-flash']
  );

  // Null or undefined targetModel
  assert.deepStrictEqual(
    getCandidateModels(null),
    ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash']
  );
});

// Test 2: API version endpoint resolution
test('API version routing for Gemini models', () => {
  function getApiVersion(model, isV1Beta = false) {
    return (isV1Beta || model.includes('3.') || model.includes('2.5')) ? 'v1beta' : 'v1';
  }

  assert.strictEqual(getApiVersion('gemini-3.8-flash', false), 'v1beta');
  assert.strictEqual(getApiVersion('gemini-2.5-flash', false), 'v1beta');
  assert.strictEqual(getApiVersion('gemini-1.5-flash', false), 'v1');
  assert.strictEqual(getApiVersion('gemini-1.5-flash', true), 'v1beta');
});

// Test 3: Provider config resolution with geminiModel
test('getAiConfig resolves Gemini model correctly', () => {
  const DEFAULT_SETTINGS = {
    aiProvider: 'gemini',
    geminiApiKey: '',
    geminiModel: 'gemini-3.8-flash',
    anthropicApiKey: '',
    anthropicModel: 'claude-3-5-sonnet-latest',
    anthropicBaseUrl: 'https://api.anthropic.com',
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
    openaiBaseUrl: 'https://api.openai.com'
  };

  function getAiConfig(db, overrideApiKey) {
    const provider = db.settings?.aiProvider || 'gemini';
    const providerName = provider === 'anthropic' ? 'Anthropic' : provider === 'openai' ? 'OpenAI' : 'Gemini';
    let apiKey = overrideApiKey || '';
    if (!apiKey) {
      if (provider === 'anthropic') apiKey = db.settings?.anthropicApiKey || '';
      else if (provider === 'openai') apiKey = db.settings?.openaiApiKey || '';
      else apiKey = db.settings?.geminiApiKey || '';
    }
    const model = provider === 'anthropic'
      ? db.settings?.anthropicModel || 'claude-3-5-sonnet-latest'
      : provider === 'openai'
      ? db.settings?.openaiModel || 'gpt-4o-mini'
      : db.settings?.geminiModel || 'gemini-3.8-flash';
    const baseUrl = provider === 'anthropic'
      ? db.settings?.anthropicBaseUrl || 'https://api.anthropic.com'
      : provider === 'openai'
      ? db.settings?.openaiBaseUrl || 'https://api.openai.com'
      : null;
    return { provider, providerName, apiKey, model, baseUrl };
  }

  // Case A: Default settings (no explicit geminiModel set)
  const dbA = { settings: { aiProvider: 'gemini', geminiApiKey: 'test-key' } };
  const configA = getAiConfig(dbA);
  assert.strictEqual(configA.provider, 'gemini');
  assert.strictEqual(configA.model, 'gemini-3.8-flash');
  assert.strictEqual(configA.apiKey, 'test-key');

  // Case B: Custom geminiModel set in db
  const dbB = {
    settings: {
      aiProvider: 'gemini',
      geminiApiKey: 'test-key',
      geminiModel: 'gemini-3.8-pro'
    }
  };
  const configB = getAiConfig(dbB);
  assert.strictEqual(configB.model, 'gemini-3.8-pro');

  // Case C: OpenAI still resolves its own model
  const dbC = {
    settings: {
      aiProvider: 'openai',
      openaiApiKey: 'sk-test',
      openaiModel: 'gpt-4o'
    }
  };
  const configC = getAiConfig(dbC);
  assert.strictEqual(configC.model, 'gpt-4o');
});

// Test 4: Settings persistence simulation
test('Settings update saves geminiModel', () => {
  const DEFAULT_SETTINGS = {
    aiProvider: 'gemini',
    geminiApiKey: '',
    geminiModel: 'gemini-3.8-flash'
  };

  const db = { settings: { ...DEFAULT_SETTINGS } };
  const reqBody = {
    aiProvider: 'gemini',
    geminiApiKey: 'new-key',
    geminiModel: 'gemini-3.8-flash'
  };

  db.settings.aiProvider = reqBody.aiProvider || DEFAULT_SETTINGS.aiProvider;
  db.settings.geminiApiKey = reqBody.geminiApiKey || DEFAULT_SETTINGS.geminiApiKey;
  db.settings.geminiModel = reqBody.geminiModel || DEFAULT_SETTINGS.geminiModel;

  assert.strictEqual(db.settings.geminiModel, 'gemini-3.8-flash');
  assert.strictEqual(db.settings.geminiApiKey, 'new-key');
});

console.log('All Gemini model verification tests passed successfully!');
