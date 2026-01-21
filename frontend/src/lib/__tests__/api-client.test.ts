import apiClient from '../api-client';

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should be an axios instance', () => {
    expect(apiClient).toBeDefined();
    expect(typeof apiClient.get).toBe('function');
    expect(typeof apiClient.post).toBe('function');
    expect(typeof apiClient.put).toBe('function');
    expect(typeof apiClient.delete).toBe('function');
  });

  it('should have baseURL configured', () => {
    // The apiClient should be configured with a baseURL
    // This is tested indirectly by checking the instance exists
    expect(apiClient.defaults.baseURL).toBeDefined();
  });

  it('should have Content-Type header configured', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });
});
