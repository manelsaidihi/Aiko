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
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

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
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const result = await response.json();
    this.setToken(result.token);
    localStorage.setItem('aiko_user', JSON.stringify(result.user));
    return result;
  },

  logout(): void {
    this.clearToken();
    window.location.href = '/login';
  },

  getCurrentUser(): any {
    const user = localStorage.getItem('aiko_user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
