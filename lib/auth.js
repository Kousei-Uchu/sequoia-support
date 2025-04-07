export const isAuthenticated = () => {
  return typeof window !== 'undefined' && 
    localStorage.getItem('sequoia_token') !== null;
};

export const login = (token) => {
  localStorage.setItem('sequoia_token', token);
};

export const logout = () => {
  localStorage.removeItem('sequoia_token');
};
