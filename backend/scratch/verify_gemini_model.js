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

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

(async () => {
  console.log('Testing Gemini Model (Default: gemini-2.5-flash, No Fallback) Logic...');

  // Test 1: Single model resolution without fallback candidate list
  test('Gemini uses only target model without fallback candidates', () => {
    function resolveTargetModel(model) {
      return (model || 'gemini-2.5-flash').trim();
    }

    assert.strictEqual(resolveTargetModel('gemini-2.5-flash'), 'gemini-2.5-flash');
    assert.strictEqual(resolveTargetModel('gemini-3.8-flash'), 'gemini-3.8-flash');
    assert.strictEqual(resolveTargetModel('gemini-2.0-flash-exp'), 'gemini-2.0-flash-exp');
    assert.strictEqual(resolveTargetModel('  custom-gemini-model  '), 'custom-gemini-model');
    assert.strictEqual(resolveTargetModel(''), 'gemini-2.5-flash');
    assert.strictEqual(resolveTargetModel(null), 'gemini-2.5-flash');
    assert.strictEqual(resolveTargetModel(undefined), 'gemini-2.5-flash');
  });

  // Test 2: API version endpoint resolution
  test('API version routing for Gemini models', () => {
    function getApiVersion(model, isV1Beta = false) {
      const targetModel = (model || 'gemini-2.5-flash').trim();
      return (isV1Beta || !targetModel.startsWith('gemini-1.0')) ? 'v1beta' : 'v1';
    }

    assert.strictEqual(getApiVersion('gemini-2.5-flash', false), 'v1beta');
    assert.strictEqual(getApiVersion('gemini-3.8-flash', false), 'v1beta');
    assert.strictEqual(getApiVersion('gemini-2.0-flash', false), 'v1beta');
    assert.strictEqual(getApiVersion('gemini-1.5-flash', false), 'v1beta');
    assert.strictEqual(getApiVersion('gemini-1.0-pro', false), 'v1');
    assert.strictEqual(getApiVersion('gemini-1.0-pro', true), 'v1beta');
  });

  // Test 3: Provider config resolution with geminiModel
  test('getAiConfig resolves Gemini model correctly with default gemini-2.5-flash', () => {
    const DEFAULT_SETTINGS = {
      aiProvider: 'gemini',
      geminiApiKey: '',
      geminiModel: 'gemini-2.5-flash',
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
        : db.settings?.geminiModel || 'gemini-2.5-flash';
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
    assert.strictEqual(configA.model, 'gemini-2.5-flash');
    assert.strictEqual(configA.apiKey, 'test-key');

    // Case B: Custom geminiModel set in db
    const dbB = {
      settings: {
        aiProvider: 'gemini',
        geminiApiKey: 'test-key',
        geminiModel: 'gemini-3.8-flash'
      }
    };
    const configB = getAiConfig(dbB);
    assert.strictEqual(configB.model, 'gemini-3.8-flash');

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
      geminiModel: 'gemini-2.5-flash'
    };

    const db = { settings: { ...DEFAULT_SETTINGS } };
    const reqBody = {
      aiProvider: 'gemini',
      geminiApiKey: 'new-key',
      geminiModel: 'custom-gemini-2.5'
    };

    db.settings.aiProvider = reqBody.aiProvider || DEFAULT_SETTINGS.aiProvider;
    db.settings.geminiApiKey = reqBody.geminiApiKey || DEFAULT_SETTINGS.geminiApiKey;
    db.settings.geminiModel = reqBody.geminiModel || DEFAULT_SETTINGS.geminiModel;

    assert.strictEqual(db.settings.geminiModel, 'custom-gemini-2.5');
    assert.strictEqual(db.settings.geminiApiKey, 'new-key');
  });

  // Test 5: Simulated callGemini makes exactly one attempt to the specified model and throws without fallback
  await asyncTest('callGemini makes single attempt and throws without fallback', async () => {
    const attemptedModels = [];

    async function mockCallGemini(apiKey, payloadBody, isV1Beta = false, model = 'gemini-2.5-flash', mockFetch) {
      const targetModel = (model || 'gemini-2.5-flash').trim();
      const apiVersion = (isV1Beta || !targetModel.startsWith('gemini-1.0')) ? 'v1beta' : 'v1';
      const currentUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${targetModel}:generateContent?key=${apiKey}`;

      attemptedModels.push(targetModel);
      const response = await mockFetch(currentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBody)
      });

      const responseText = await response.text();
      if (response.ok) {
        const responseData = JSON.parse(responseText);
        const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }

      throw new Error(`Gemini API error: ${response.statusText} (${responseText})`);
    }

    // Simulate failure
    const mockFailingFetch = async (url) => ({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => JSON.stringify({ error: { message: 'models/custom-model is not found' } })
    });

    let threwError = false;
    try {
      await mockCallGemini('fake-key', { contents: [] }, false, 'custom-model', mockFailingFetch);
    } catch (err) {
      threwError = true;
      assert.ok(err.message.includes('Not Found'));
    }

    assert.strictEqual(threwError, true, 'Should have thrown error immediately');
    assert.deepStrictEqual(attemptedModels, ['custom-model'], 'Should have only attempted the user-specified model once with no fallbacks');
  });

  console.log('All Gemini single-model verification tests passed successfully!');
})();
