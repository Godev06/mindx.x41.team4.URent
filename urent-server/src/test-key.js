const fs = require('fs');
const path = require('path');

// Read the API Key directly from .env file
const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const keyMatch = envContent.match(/^GEMINI_API_KEY\s*=\s*(.+)$/m);
const apiKey = keyMatch ? keyMatch[1].trim() : '';

console.log('Testing with API Key prefix:', apiKey.slice(0, 10) + '...');

const requestBody = {
  contents: [
    {
      parts: [
        { text: 'Hello, what is your name?' }
      ]
    }
  ]
};

const models = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash'
];

async function testModel(modelName) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  console.log(`\n--- Testing model: ${modelName} ---`);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Status code:', response.status);
    const text = await response.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

async function runTests() {
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY not found in .env');
    return;
  }
  for (const model of models) {
    await testModel(model);
  }
}

runTests();
