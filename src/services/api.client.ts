import { Capacitor, CapacitorHttp } from '@capacitor/core';

export interface ApiRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  data?: any;
  isUrlEncoded?: boolean;
}

export async function apiClient<T = any>(options: ApiRequestOptions): Promise<T> {
  const isNative = Capacitor.isNativePlatform();
  const method = options.method || 'GET';
  const headers = options.headers || {};
  
  if (method !== 'GET') {
    if (options.isUrlEncoded) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  if (isNative) {
    // Native path using CapacitorHttp
    try {
      const response = await CapacitorHttp.request({
        method,
        url: options.url,
        headers,
        data: method !== 'GET' ? options.data : undefined,
        params: method === 'GET' ? options.data : undefined,
      });

      if (response.status >= 400) {
        throw new Error(`Server Error (${response.status})`);
      }

      if (!response.data) {
        throw new Error('Empty response from server');
      }

      return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    } catch (nativeErr: any) {
      console.error('Native Request Failed:', nativeErr);
      throw new Error(nativeErr.message || 'Network request failed');
    }
  } else {
    // Web path using fetch
    let body: BodyInit | undefined = undefined;
    let url = options.url;

    if (method !== 'GET' && options.data) {
      if (options.isUrlEncoded) {
        const params = new URLSearchParams();
        Object.entries(options.data).forEach(([key, val]) => {
          if (Array.isArray(val)) {
            params.append(key, val.join(', '));
          } else {
            params.append(key, String(val));
          }
        });
        body = params.toString();
      } else {
        body = JSON.stringify(options.data);
      }
    } else if (method === 'GET' && options.data) {
      const params = new URLSearchParams();
      Object.entries(options.data).forEach(([key, val]) => params.append(key, String(val)));
      url = `${url}?${params.toString()}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`Server Error (${response.status})`);
    }

    const text = await response.text();
    if (!text) return {} as T;

    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn('Failed to parse JSON response:', text);
      return text as unknown as T;
    }
  }
}
