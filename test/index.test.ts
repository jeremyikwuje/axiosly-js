import axios from 'axios';
import * as axiosly from '../src/index';

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