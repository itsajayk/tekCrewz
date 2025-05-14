import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import TopNavbar from '../Nav/TopNavbar';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../Pages/firebase';

const Referrals = () => {
  const navigate = useNavigate();
  const [userOptions, setUserOptions] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where(documentId(), '>=', 'REFSD'),
          where(documentId(), '<', 'REFSE')
        );
        const snapshot = await getDocs(q);
        const refs = snapshot.docs.map(doc => ({ id: doc.id, label: doc.data().referrerName || doc.id }));
        setUserOptions([{ id: 'admin', label: 'Admin' }, ...refs]);
      } catch (err) {
        console.error('Error fetching referrers:', err);
      }
    };
    fetchUsers();
  }, []);

  const handleNavigate = path => () => navigate(path);

  return (
    <PageWrapper>
      <TopNavbar />
      <MainContent>
        <PageTitle>Admin Panel</PageTitle>
        <MenuGrid>
          <MenuCard onClick={handleNavigate('/add-candidate')}>
            <CardIcon>🤝</CardIcon>
            <CardLabel>Add Candidate</CardLabel>
          </MenuCard>
          <MenuCard onClick={handleNavigate('/candidateList')}>
            <CardIcon>📋</CardIcon>
            <CardLabel>Candidate List</CardLabel>
          </MenuCard>
          <MenuCard onClick={handleNavigate('/admin-report')}>
            <CardIcon>📊</CardIcon>
            <CardLabel>Quiz Report</CardLabel>
          </MenuCard>
          <MenuCard onClick={handleNavigate('/AdminDashboard')}>
            <CardIcon>📈</CardIcon>
            <CardLabel>Dashboard</CardLabel>
          </MenuCard>
          <MenuCard onClick={handleNavigate('/signup')}>
            <CardIcon>➕</CardIcon>
            <CardLabel>Create Account</CardLabel>
          </MenuCard>
        </MenuGrid>
      </MainContent>
      <Footer />
    </PageWrapper>
  );
};

export default Referrals;

// Styled Components

const gradientBG = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const PageWrapper = styled.section`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(270deg, #f7f7f7, #eaeaea, #f7f7f7);
  background-size: 600% 600%;
  animation: ${gradientBG} 15s ease infinite;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 90px 30px;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 40px;
  background: linear-gradient(90deg, #7620ff, #ff9900);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  text-align: center;

  @media (max-width: 600px) {
    font-size: 2rem;
    margin-bottom: 20px;
  }
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 30px;
  width: 100%;
  max-width: 800px;

  @media (max-width: 480px) {
    gap: 20px;
  }
`;

const MenuCard = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

const CardIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 15px;
`;

const CardLabel = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
`;
