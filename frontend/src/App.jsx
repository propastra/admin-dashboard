import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PropertyList from './pages/PropertyList';
import PropertyForm from './pages/PropertyForm';
import VisitorList from './pages/VisitorList';
import InquiryList from './pages/InquiryList';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/properties" element={<PropertyList />} />
        <Route path="/properties/add" element={<PropertyForm />} />
        <Route path="/properties/edit/:id" element={<PropertyForm />} />
        <Route path="/visitors" element={<VisitorList />} />
        <Route path="/inquiries" element={<InquiryList />} />
      </Route>
    </Routes>
  );
}

export default App;
