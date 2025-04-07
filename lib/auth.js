export const isAuthenticated = () => {
  return typeof window !== 'undefined' && 
    localStorage.getItem('sunflower_token') !== null;
};

export const login = (token) => {
  localStorage.setItem('sunflower_token', token);
};

export const logout = () => {
  localStorage.removeItem('sunflower_token');
};
