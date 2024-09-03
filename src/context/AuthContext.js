import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const HOST = "http://192.168.86.66:5000"; // Adresse de votre backend

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get(`${HOST}/api/utils/All-Permision`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const { user, fam_owner } = response.data;
          setUser(user);
          setRole(fam_owner ? 'ADMIN' : 'USER');

          const memberResponse = await axios.get(`${HOST}/api/user/member/tous`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsMember(memberResponse.data.isMember);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur', error);
        // setError('Erreur lors de la récupération de l\'utilisateur.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${HOST}/api/auth/connexion`, credentials);
      const token = response.data?.data?.token;
      const user = response.data?.utilisateur;
      localStorage.setItem('token', token);
      setUser(user);
      setRole(user?.role);

      const memberResponse = await axios.get(`${HOST}/api/user/member/tous`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsMember(memberResponse.data.isMember);
    } catch (error) {
      console.error('Erreur lors de la connexion', error);
      setError('Erreur lors de la connexion. Veuillez vérifier vos informations.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setRole(null);
    setIsMember(false);
  };

  return (
    <AuthContext.Provider value={{ user, role, isMember, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};