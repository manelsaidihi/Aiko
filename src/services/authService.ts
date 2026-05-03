import API_URL from '../config';

export const authService = {
  getToken(): string | null {
    return localStorage.getItem('aiko_token');
  },

  setToken(token: string): void {
    localStorage.setItem('aiko_token', token);
  },

  clearToken(): void {
    localStorage.removeItem('aiko_token');
    localStorage.removeItem('aiko_user');
  },

  async login(email: string, password: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    this.setToken(data.token);
    localStorage.setItem('aiko_user', JSON.stringify(data.user));
    return data;
  },

  async register(data: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const result = await response.json();
    this.setToken(result.token);
    localStorage.setItem('aiko_user', JSON.stringify(result.user));
    return result;
  },

  async getMe(): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error('No token found');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      this.clearToken();
      throw new Error('Session expired');
    }

    const user = await response.json();
    localStorage.setItem('aiko_user', JSON.stringify(user));
    return user;
  },

  async updateProfile(data: any): Promise<any> {
    const token = this.getToken();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Update failed');
    }

    const updatedUser = await response.json();
    const currentUser = this.getCurrentUser();
    localStorage.setItem('aiko_user', JSON.stringify({ ...currentUser, ...updatedUser }));
    return updatedUser;
  },

  logout(): void {
    this.clearToken();
  },

  getCurrentUser(): any {
    const user = localStorage.getItem('aiko_user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
