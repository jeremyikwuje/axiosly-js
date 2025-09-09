export interface AxioslyOptions {
  apiKey?: string;           // For backend auth
  backendUrl?: string;       // e.g., 'https://api.axiosly.com/metrics'
  aiEnabled?: boolean;       // Toggle AI features (e.g., anomaly detection)
  logLevel?: 'none' | 'basic' | 'verbose';  // Control logging
  sanitize?: (data: any) => any;  // Custom sanitization for security
}

export interface AxioslyMetrics {
  request: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    timestamp: number;
  };
  response?: {
    status: number;
    data?: any;
    headers?: Record<string, string>;
    duration: number;
    timestamp: number;
  };
  error?: {
    message: string;
    code?: string;
    timestamp: number;
  };
}