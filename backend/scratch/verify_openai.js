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

console.log('Testing OpenAI Integration Logic...');

// Test 1: URL normalization logic
test('URL normalization logic for OpenAI endpoints', () => {
  function getOpenAiUrl(baseUrl) {
    const rawBaseUrl = (baseUrl || 'https://api.openai.com').trim().replace(/\/+$/, '');
    return rawBaseUrl.endsWith('/v1')
      ? `${rawBaseUrl}/chat/completions`
      : `${rawBaseUrl}/v1/chat/completions`;
  }

  assert.strictEqual(getOpenAiUrl('https://api.openai.com'), 'https://api.openai.com/v1/chat/completions');
  assert.strictEqual(getOpenAiUrl('https://api.openai.com/'), 'https://api.openai.com/v1/chat/completions');
  assert.strictEqual(getOpenAiUrl('https://api.openai.com/v1'), 'https://api.openai.com/v1/chat/completions');
  assert.strictEqual(getOpenAiUrl('https://api.openai.com/v1/'), 'https://api.openai.com/v1/chat/completions');
  assert.strictEqual(getOpenAiUrl('http://localhost:11434/v1'), 'http://localhost:11434/v1/chat/completions');
  assert.strictEqual(getOpenAiUrl('https://openrouter.ai/api/v1'), 'https://openrouter.ai/api/v1/chat/completions');
  assert.strictEqual(getOpenAiUrl('https://api.deepseek.com'), 'https://api.deepseek.com/v1/chat/completions');
});

// Test 2: OpenAI Response Content Parsing
test('Response content extraction logic', () => {
  function parseContent(responseData) {
    if (responseData.choices && Array.isArray(responseData.choices) && responseData.choices.length > 0) {
      const choice = responseData.choices[0];
      if (choice?.message?.content && typeof choice.message.content === 'string') {
        return choice.message.content;
      }
      if (typeof choice?.text === 'string') {
        return choice.text;
      }
    }
    if (typeof responseData.content === 'string') {
      return responseData.content;
    }
    if (typeof responseData.text === 'string') {
      return responseData.text;
    }
    throw new Error('No content found');
  }

  const standardResponse = {
    id: 'chatcmpl-123',
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: 'Hello from OpenAI!' },
        finish_reason: 'stop'
      }
    ]
  };
  assert.strictEqual(parseContent(standardResponse), 'Hello from OpenAI!');
  assert.strictEqual(parseContent({ content: 'Direct text content' }), 'Direct text content');
});

// Test 3: OpenAI Payload construction
test('OpenAI Payload formatting for prompts and chat', () => {
  function buildOpenAiMessages(prompt, options = {}) {
    const { isChat = false, messages = [], systemInstruction } = options;
    const openaiMessages = [];
    if (systemInstruction) {
      openaiMessages.push({ role: 'system', content: systemInstruction });
    }
    if (isChat) {
      messages.forEach(m => {
        openaiMessages.push({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        });
      });
    } else {
      openaiMessages.push({ role: 'user', content: prompt });
    }
    return openaiMessages;
  }

  // Non-chat prompt call
  const promptMessages = buildOpenAiMessages('Summarize this lesson', { systemInstruction: 'You are an AI assistant' });
  assert.deepStrictEqual(promptMessages, [
    { role: 'system', content: 'You are an AI assistant' },
    { role: 'user', content: 'Summarize this lesson' }
  ]);

  // Chat call
  const chatMessages = buildOpenAiMessages('', {
    isChat: true,
    systemInstruction: 'Chat bot system',
    messages: [
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello!' },
      { role: 'user', content: 'Explain React' }
    ]
  });
  assert.deepStrictEqual(chatMessages, [
    { role: 'system', content: 'Chat bot system' },
    { role: 'user', content: 'Hi' },
    { role: 'assistant', content: 'Hello!' },
    { role: 'user', content: 'Explain React' }
  ]);
});

// Test 4: Provider Config resolution
test('getAiConfig resolution for OpenAI', () => {
  const mockDb = {
    settings: {
      aiProvider: 'openai',
      openaiApiKey: 'sk-proj-test123456',
      openaiModel: 'gpt-4o',
      openaiBaseUrl: 'https://api.openai.com/v1'
    }
  };

  const DEFAULT_SETTINGS = {
    aiProvider: 'gemini',
    geminiApiKey: '',
    anthropicApiKey: '',
    anthropicModel: 'claude-3-5-sonnet-latest',
    anthropicBaseUrl: 'https://api.anthropic.com',
    openaiApiKey: '',
    openaiModel: 'gpt-5-mini',
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
      ? db.settings?.openaiModel || 'gpt-5-mini'
      : null;
    const baseUrl = provider === 'anthropic'
      ? db.settings?.anthropicBaseUrl || 'https://api.anthropic.com'
      : provider === 'openai'
      ? db.settings?.openaiBaseUrl || 'https://api.openai.com'
      : null;
    return { provider, providerName, apiKey, model, baseUrl };
  }

  const config = getAiConfig(mockDb);
  assert.strictEqual(config.provider, 'openai');
  assert.strictEqual(config.providerName, 'OpenAI');
  assert.strictEqual(config.apiKey, 'sk-proj-test123456');
  assert.strictEqual(config.model, 'gpt-4o');
  assert.strictEqual(config.baseUrl, 'https://api.openai.com/v1');
});

// Test 5: OpenAI Payload max_completion_tokens parameter
test('OpenAI request body formatting with max_completion_tokens', () => {
  function buildOpenAiRequestBody(model, messages, maxTokens = 4096, useMaxTokens = false) {
    const bodyObj = {
      model,
      messages
    };
    if (useMaxTokens) {
      bodyObj.max_tokens = maxTokens;
    } else {
      bodyObj.max_completion_tokens = maxTokens;
    }
    return bodyObj;
  }

  const defaultBody = buildOpenAiRequestBody('gpt-5-nano', [{ role: 'user', content: 'Hello' }], 4096, false);
  assert.strictEqual(defaultBody.model, 'gpt-5-nano');
  assert.strictEqual(defaultBody.max_completion_tokens, 4096);
  assert.strictEqual(defaultBody.max_tokens, undefined);

  const fallbackBody = buildOpenAiRequestBody('legacy-model', [{ role: 'user', content: 'Hello' }], 2048, true);
  assert.strictEqual(fallbackBody.max_tokens, 2048);
  assert.strictEqual(fallbackBody.max_completion_tokens, undefined);
});

// Test 6: Fallback condition detection for legacy endpoints
test('OpenAI fallback detection when max_completion_tokens is unsupported', () => {
  function shouldFallbackToMaxTokens(status, responseText) {
    return status === 400 && typeof responseText === 'string' && responseText.includes('max_completion_tokens');
  }

  const legacyErrorResponse = JSON.stringify({
    error: {
      message: "Unsupported parameter: 'max_completion_tokens' is not supported. Use 'max_tokens' instead.",
      param: 'max_completion_tokens',
      code: 'unsupported_parameter'
    }
  });

  const unrelatedErrorResponse = JSON.stringify({
    error: {
      message: "Invalid API key provided",
      type: "invalid_request_error"
    }
  });

  assert.strictEqual(shouldFallbackToMaxTokens(400, legacyErrorResponse), true);
  assert.strictEqual(shouldFallbackToMaxTokens(400, unrelatedErrorResponse), false);
  assert.strictEqual(shouldFallbackToMaxTokens(500, legacyErrorResponse), false);
  assert.strictEqual(shouldFallbackToMaxTokens(200, ''), false);
});

console.log('All verification tests passed successfully!');

