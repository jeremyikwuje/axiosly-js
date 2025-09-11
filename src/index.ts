import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AxioslyOptions, AxioslyMetrics } from './types';

// Default options
const defaults: AxioslyOptions = {
  logLevel: 'basic',
  aiEnabled: false,
  sanitize: (data: any) => {
    // Basic security: Redact sensitive headers/tokens
    if (typeof data === 'object') {
      const sanitized = { ...data };
      if (sanitized.headers?.Authorization) {
        sanitized.headers.Authorization = '[REDACTED]';
      }
      if (sanitized.data && typeof sanitized.data === 'object') {
        // Optionally redact PII; extend as needed
        sanitized.data = { ...sanitized.data, sensitive: '[REDACTED]' };
      }
      return sanitized;
    }
    return data;
  }
};

// Queue for non-blocking backend sends (use a real queue like Bull in production)
let metricsQueue: AxioslyMetrics[] = [];

export function monitor(instance: AxiosInstance, options: AxioslyOptions = {}) {
  const config = {
    ...defaults,
    ...options,
    sanitize: options.sanitize || ((data: any) => data)  // Ensure sanitize is always a function
  };

  // Request Interceptor: Capture outgoing requests
  instance.interceptors.request.use(
    (reqConfig: InternalAxiosRequestConfig) => {
      const metrics: AxioslyMetrics = {
        request: {
          url: reqConfig.url || '',
          method: reqConfig.method?.toUpperCase() || 'GET',
          headers: reqConfig.headers as Record<string, string>,
          timestamp: Date.now()
        }
      };

      // Sanitize before logging/sending
      const sanitizedMetrics = {
        ...metrics,
        request: {
          ...metrics.request,
          headers: config.sanitize(metrics.request.headers)
        }
      };

      if (config.logLevel !== 'none') {
        console[config.logLevel === 'verbose' ? 'log' : 'info']('AxioslyRequest:', sanitizedMetrics.request);
      }

      // Queue for backend/AI processing
      metricsQueue.push(sanitizedMetrics);
      console['log']('Request captured', metricsQueue);

      if (config.aiEnabled && config.backendUrl && config.apiKey) {
        // Non-blocking send (use setTimeout for async; in prod, use a worker)
        setTimeout(() => sendToBackend(sanitizedMetrics, config), 0);
      }

      return reqConfig;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // Response Interceptor: Capture responses and calculate duration
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      const lastMetrics = metricsQueue[metricsQueue.length - 1];
      if (lastMetrics) {
        lastMetrics.response = {
          status: response.status,
          data: config.sanitize(response.data),
          headers: response.headers as Record<string, string>,
          duration: Date.now() - lastMetrics.request.timestamp,
          timestamp: Date.now()
        };

        console.log('Response captured', metricsQueue);

        if (config.logLevel !== 'none') {
          console[config.logLevel === 'verbose' ? 'log' : 'info']('AxioslyResponse:', lastMetrics.response);
        }

        // AI Hook Example: Simple anomaly check (extend with ML)
        if (config.aiEnabled && lastMetrics.response.duration > 5000) {  // Threshold for alert
          console.warn('Axiosly AI Alert: High latency detected - Potential failure!');
          // Send to backend for advanced AI (e.g., predictive analysis)
        }
      }

      return response;
    },
    (error: AxiosError) => {
      const lastMetrics = metricsQueue[metricsQueue.length - 1];
      if (lastMetrics) {
        lastMetrics.error = {
          message: error.message,
          code: error.code,
          timestamp: Date.now()
        };

        if (config.logLevel !== 'none') {
          console.error('Axiosly Error:', lastMetrics.error);
        }
      }
      return Promise.reject(error);
    }
  );

  // Expose queue for manual flush (e.g., batch sends)
  (instance as any).axiosly = { flushMetrics: () => sendToBackendBatch(metricsQueue, config) };

  console.log('Axiosly monitoring enabled on Axios instance');
}

// Helper: Send single metric to backend (e.g., for AI processing)
async function sendToBackend(metrics: AxioslyMetrics, config: AxioslyOptions) {
  try {
    await axios.post(config.backendUrl!, metrics, {
      headers: { 'Authorization': `Bearer ${config.apiKey}` }
    });
  } catch (err) {
    console.error('Axiosly: Failed to send metrics to backend');
  }
}

// Helper: Batch send
function sendToBackendBatch(queue: AxioslyMetrics[], config: AxioslyOptions) {
  if (queue.length > 0) {
    // Process batch; clear queue after
    queue.forEach(m => sendToBackend(m, config));
    metricsQueue = [];
  }
}

// Export for direct use (e.g., create monitored instance)
export function createMonitoredInstance(baseURL?: string, options?: AxioslyOptions) {
  const instance = axios.create({ baseURL });
  monitor(instance, options);
  return instance;
}