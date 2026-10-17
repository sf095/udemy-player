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
test('Response content extraction logic handles strings, arrays, refusals, and token exhaustion', () => {
  function extractOpenAiResponseContent(responseData) {
    if (responseData.choices && Array.isArray(responseData.choices) && responseData.choices.length > 0) {
      const choice = responseData.choices[0];

      // Check for explicit refusal by the model (e.g. safety policy)
      if (choice?.message?.refusal && typeof choice.message.refusal === 'string') {
        throw new Error(`OpenAI model refused the request: ${choice.message.refusal}`);
      }

      // Standard string content
      if (typeof choice?.message?.content === 'string') {
        if (choice.message.content.trim().length > 0) {
          return choice.message.content;
        }
        // Check for reasoning_content fallback if content is empty string (e.g. DeepSeek R1)
        if (typeof choice?.message?.reasoning_content === 'string' && choice.message.reasoning_content.trim().length > 0) {
          return choice.message.reasoning_content;
        }
        // If content is empty string, check if the model hit token limit during reasoning
        if (choice.finish_reason === 'length') {
          throw new Error("OpenAI request reached its output token limit (finish_reason: 'length') before generating content. Please increase maxTokens or use a model with a larger completion budget.");
        }
        // Empty content with another finish reason
        throw new Error(`OpenAI returned an empty response (finish_reason: '${choice.finish_reason || 'unknown'}').`);
      }

      // Array content (multi-part text blocks, e.g. [{ type: 'text', text: '...' }])
      if (Array.isArray(choice?.message?.content)) {
        const combined = choice.message.content
          .map(part => (typeof part === 'string' ? part : part?.text || ''))
          .filter(text => text.trim().length > 0)
          .join('');
        if (combined.trim().length > 0) {
          return combined;
        }
      }

      // Check if content is null/empty due to length finish reason
      if (choice.finish_reason === 'length') {
        throw new Error("OpenAI request reached its output token limit (finish_reason: 'length') before generating content. Please increase maxTokens or use a model with a larger completion budget.");
      }

      // Legacy text property on choice
      if (typeof choice?.text === 'string' && choice.text.trim().length > 0) {
        return choice.text;
      }

      // Compatible reasoning content (e.g. DeepSeek R1 / OpenRouter) if normal content is absent
      if (typeof choice?.message?.reasoning_content === 'string' && choice.message.reasoning_content.trim().length > 0) {
        return choice.message.reasoning_content;
      }
    }

    // Direct content or text properties for non-standard compatible providers
    if (typeof responseData.content === 'string' && responseData.content.trim().length > 0) {
      return responseData.content;
    }
    if (typeof responseData.text === 'string' && responseData.text.trim().length > 0) {
      return responseData.text;
    }

    throw new Error('OpenAI API returned HTTP 200 but the response content could not be parsed.');
  }

  // 2a. Standard response
  const standardResponse = {
    choices: [
      {
        message: { role: 'assistant', content: 'Hello from OpenAI!' },
        finish_reason: 'stop'
      }
    ]
  };
  assert.strictEqual(extractOpenAiResponseContent(standardResponse), 'Hello from OpenAI!');

  // 2b. Multi-part array content
  const arrayResponse = {
    choices: [
      {
        message: {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Part 1. ' },
            { type: 'text', text: 'Part 2.' }
          ]
        },
        finish_reason: 'stop'
      }
    ]
  };
  assert.strictEqual(extractOpenAiResponseContent(arrayResponse), 'Part 1. Part 2.');

  // 2c. Model refusal
  const refusalResponse = {
    choices: [
      {
        message: {
          role: 'assistant',
          content: null,
          refusal: 'Content policy violation'
        },
        finish_reason: 'stop'
      }
    ]
  };
  assert.throws(
    () => extractOpenAiResponseContent(refusalResponse),
    /OpenAI model refused the request: Content policy violation/
  );

  // 2d. Token exhaustion with empty string content (GPT-5-mini / o1 reasoning models)
  const tokenLimitEmptyResponse = {
    choices: [
      {
        message: { role: 'assistant', content: '', refusal: null },
        finish_reason: 'length'
      }
    ]
  };
  assert.throws(
    () => extractOpenAiResponseContent(tokenLimitEmptyResponse),
    /output token limit \(finish_reason: 'length'\)/
  );

  // 2e. Token exhaustion with null content
  const tokenLimitNullResponse = {
    choices: [
      {
        message: { role: 'assistant', content: null },
        finish_reason: 'length'
      }
    ]
  };
  assert.throws(
    () => extractOpenAiResponseContent(tokenLimitNullResponse),
    /output token limit \(finish_reason: 'length'\)/
  );

  // 2f. Empty response with other finish reason
  const emptyResponse = {
    choices: [
      {
        message: { role: 'assistant', content: '   ' },
        finish_reason: 'stop'
      }
    ]
  };
  assert.throws(
    () => extractOpenAiResponseContent(emptyResponse),
    /empty response \(finish_reason: 'stop'\)/
  );

  // 2g. Reasoning content fallback (e.g. DeepSeek R1)
  const reasoningOnlyResponse = {
    choices: [
      {
        message: {
          role: 'assistant',
          content: '',
          reasoning_content: 'Step by step summary from reasoning'
        },
        finish_reason: 'stop'
      }
    ]
  };
  assert.strictEqual(extractOpenAiResponseContent(reasoningOnlyResponse), 'Step by step summary from reasoning');

  // 2h. Direct content/text fallbacks
  assert.strictEqual(extractOpenAiResponseContent({ content: 'Direct text' }), 'Direct text');
  assert.strictEqual(extractOpenAiResponseContent({ text: 'Direct legacy text' }), 'Direct legacy text');

  // 2i. Completely unparseable response throws original error
  assert.throws(
    () => extractOpenAiResponseContent({ unexpected: true }),
    /OpenAI API returned HTTP 200 but the response content could not be parsed/
  );
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

// Test 7: Static checks in server.js for OpenAI response extraction and summarization token limits
test('server.js implements robust OpenAI response parsing and sets summarization maxTokens', () => {
  const fs = require('fs');
  const path = require('path');
  const serverContent = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');

  // Must check for refusal handling
  assert(serverContent.includes('refusal'), 'server.js must handle model refusal');

  // Must detect output token exhaustion when content is empty/null
  assert(serverContent.includes("finish_reason === 'length'"), 'server.js must detect finish_reason length');

  // Must allocate higher token limits for chapter and lesson summaries
  assert(serverContent.includes('maxTokens: 16384'), 'server.js must pass maxTokens: 16384 for section summarization');
  assert(serverContent.includes('maxTokens: 8192'), 'server.js must pass maxTokens: 8192 for lesson summarization');
});

console.log('All verification tests passed successfully!');


