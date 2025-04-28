import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import TopNavbar from '../Nav/TopNavbar';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';
// Import Firestore functions and db instance
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../Pages/firebase';

const Referrals = () => {
  const navigate = useNavigate();

  // State to hold combined dropdown options for users
  const [userOptions, setUserOptions] = useState([]);

  // Fetch available referrers from Firebase and combine with an Admin option
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where(documentId(), ">=", "REFSD"),
          where(documentId(), "<", "REFSE")
        );
        const querySnapshot = await getDocs(q);
        const referrers = [];
        querySnapshot.forEach((doc) => {
          referrers.push({ id: doc.id, label: doc.data().referrerName || doc.id });
        });
        const combined = [{ id: 'admin', label: 'Admin' }, ...referrers];
        setUserOptions(combined);
      } catch (error) {
        console.error("Error fetching referrers:", error);
      }
    };
    fetchUsers();
  }, []);

  // Navigate to the Add Candidate page
  const openAddCandidate = () => {
    navigate('/add-candidate');
  };

  // Navigate to the Candidate List page
  const openCandidateList = () => {
    navigate('/candidateList');
  };

  const openQuizList = () => {
    navigate('/admin-report');
  };

  return (
    <>
      <Wrapper>
        <TopNavbar />
        <Content className="container">
        <HeaderInfo className="container">
          <h1 className="font40 extraBold">Referrals</h1>
          <div>
            <ModalButton onClick={openAddCandidate}>
              Add a Candidate
            </ModalButton>
            <ModalButton onClick={openCandidateList}>
              View Candidate List
            </ModalButton>
            <ModalButton onClick={openQuizList}>
              View Quiz Report
            </ModalButton>
          </div>
          <SwitchLink onClick={() => navigate('/signup')}>
            Create an account ? Add a new Employee ?
          </SwitchLink>
        </HeaderInfo>
        </Content>
        <Footer />
      </Wrapper>
    </>
  );
};

export default Referrals;

/* Styled Components for Referrals.jsx */
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const Wrapper = styled.section`
  padding-top: 80px;
  width: 100%;
  background: linear-gradient(270deg, #f7f7f7, #eaeaea, #f7f7f7);
  background-size: 600% 600%;
  animation: ${gradientAnimation} 10s ease infinite;
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  @media (max-width: 600px) {
    padding-top: 60px;
  }
`;

const Content = styled.div`
  flex: 1;   /* takes up all remaining space, pushing footer down */
  // padding-top: 40px;

  @media (max-width: 600px) {
    // padding-top: 60px;
  }
`;

const HeaderInfo = styled.div`
  text-align: center;
  padding: 50px 20px;

  h1 {
    font-size: 3.5rem;
    font-weight: 800;
    margin-bottom: 20px;
    color: #333;
  }

  @media (max-width: 860px) {
    h1 {
      font-size: 2.5rem;
    }
  }

  @media (max-width: 480px) {
    h1 {
      font-size: 2rem;
    }
  }
`;

const ModalButton = styled.button`
  padding: 12px 25px;
  background: #ff9900;
  color: #fff;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s ease;
  margin-right: 20px;

  &:hover {
    background: #e68a00;
  }

  @media (max-width: 480px) {
    width: 100%;
    margin: 0 0 10px 0;
  }
`;

const SwitchLink = styled.p`
  margin-top: 15px;
  color: #7620ff;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;
