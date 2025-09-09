# Axiosly

AI-Powered Axios Interceptor for monitoring API requests and responses. Makes tracking endpoints simple, secure, and scalable.

## Installation

```bash
npm install axiosly
```

## Usage

```ts
import axios from 'axios';
import axiosly from 'axiosly';

const api = axios.create({ baseURL: 'https://api.example.com' });
axiosly.monitor(api, { 
  apiKey: 'your-key', 
  backendUrl: 'https://api.axiosly.com/metrics',
  aiEnabled: true,
  logLevel: 'verbose'
});

// All requests now monitored automatically
api.get('/users').then(res => console.log(res.data));
```

## Features

- Automatic request/response interception
- Secure data sanitization
- Backend hooks for AI analysis (e.g., anomaly detection)
- Customizable logging

## Tests (`test/index.test.ts`)
Basic Jest test to verify functionality. Run with `npm test`.

```typescript
import axios from 'axios';
import axiosly from '../src/index';

describe('Axiosly', () => {
  let instance: any;

  beforeEach(() => {
    instance = axios.create();
    axiosly.monitor(instance, { logLevel: 'none' });  // Silent for tests
  });

  test('should attach interceptors', () => {
    expect(instance.interceptors.request.handlers.length).toBeGreaterThan(0);
    expect(instance.interceptors.response.handlers.length).toBeGreaterThan(0);
  });

  // Mock a request to test (requires mocking axios in full setup)
});
```
