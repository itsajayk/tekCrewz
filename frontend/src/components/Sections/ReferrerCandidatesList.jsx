// ReferrerCandidatesList.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TopNavbar from '../Nav/TopNavbar';
import Footer from '../Sections/Footer';
import { AuthContext } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Pages/firebase';         // wherever you init Firestore
import { collection, query, where, getDocs } from 'firebase/firestore';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ReferrerCandidatesList = () => {
  const API_BASE_URL = 'https://tekcrewz.onrender.com';
  const { currentUser } = useContext(AuthContext);
  const currentReferrerId = currentUser ? currentUser.displayName : "REFSD001";

  const [candidates, setCandidates] = useState([]);
  const [filters, setFilters] = useState({ date: null, status: '' });
  const [isLoading, setIsLoading] = useState(false);
  

   const [referrerName, setReferrerName] = useState('');

  useEffect(() => {
    if (!currentReferrerId) return;

    const fetchProfile = async () => {
      try {
        // Look up the user document where referralId matches
        const q = query(
          collection(db, 'users'),
          where('referralId', '==', currentReferrerId)
        );
        const qs = await getDocs(q);

        if (!qs.empty) {
          const data = qs.docs[0].data();
          setReferrerName(data.name || '—');
        } else {
          console.warn('No matching user for referralId', currentReferrerId);
          setReferrerName('Unknown');
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        setReferrerName('Error');
      }
    };

    fetchProfile();
  }, [currentReferrerId]);


  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      let params = { status: filters.status, userId: currentReferrerId };
      if (filters.date) {
        const year = filters.date.getFullYear();
        const month = String(filters.date.getMonth() + 1).padStart(2, '0');
        params.date = `${year}-${month}`;
      }
      const response = await axios.get(`${API_BASE_URL}/api/candidates`, { params });
      setCandidates(response.data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [filters, currentReferrerId]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date) => {
    setFilters({ ...filters, date });
  };

  return (
    <Wrapper>
      <TopNavbar />
      <Content>
        <HeaderSection>
          <h2>Referral Candidates List</h2>
          {referrerName
            ? <RefName>Referrer's Name: {referrerName}</RefName>
            : <RefName>Loading name…</RefName>}
        </HeaderSection>
        <Filters>
          <FilterGroup>
            <FilterLabel>Month of Visit:</FilterLabel>
            <DatePicker
              selected={filters.date}
              onChange={handleDateChange}
              dateFormat="yyyy-MM"
              placeholderText="Select Month"
              showMonthYearPicker
              isClearable
              customInput={<DateButton />}
            />
          </FilterGroup>
          <FilterGroup>
            <FilterLabel>Status:</FilterLabel>
            <SelectFilter
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All</option>
              <option value="Registered">Registered</option>
              <option value="Enrolled">Enrolled</option>
            </SelectFilter>
          </FilterGroup>
        </Filters>
        {isLoading ? (
          <LoadingMessage>Loading...</LoadingMessage>
        ) : candidates.length === 0 ? (
          <EmptyMessage>Your Referral ID does not have any associated data. Please begin the referral process.</EmptyMessage>
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Degree</th>
                  <th>Course Name</th>
                  <th>College Name</th>
                  <th>Courses Enquired</th>
                  <th>Courses Registered</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate._id}>
                    <td>{candidate.candidateName}</td>
                    <td>{candidate.candidateDegree}</td>
                    <td>{candidate.candidateCourseName}</td>
                    <td>{candidate.college}</td>
                    <td>{candidate.coursesEnquired}</td>
                    <td>{candidate.courseRegistered || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Content>
      <Footer />
    </Wrapper>
  );
};

export default ReferrerCandidatesList;

/* Styled Components */
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Content = styled.main`
  flex: 1;
  width: 90%;
  max-width: 1200px;
  margin: 120px auto 20px;
  padding: 20px;
  background: #fff;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
  border-radius: 8px;
  animation: ${fadeIn} 0.5s ease-in-out;

  @media (max-width: 768px) {
    margin: 100px auto 10px;
    padding: 15px;
  }
`;

const HeaderSection = styled.div`
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const RefName = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: #333;
`;


const Filters = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  font-size: 18px;
  color: #555;
  margin: 40px 0;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
`;

const FilterLabel = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: #333;
`;

const DateButton = styled.button`
  padding: 12px 18px;
  margin-left: 10px;
  border: 1px solid #e68a00;
  background: linear-gradient(45deg, #ffeb99, #fff3d9);
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;

  &:after {
    content: '';
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 8px solid #e68a00;
  }

  &:hover {
    border-color: #7620ff;
    background: linear-gradient(45deg, #e0c3fc, #8ec5fc);

    &:after {
      border-top-color: #7620ff;
    }
  }

  @media (max-width: 768px) {
    padding: 10px 14px;
    font-size: 14px;
  }
`;

const SelectFilter = styled.select`
  margin-left: 10px;
  padding: 6px 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;

  @media (max-width: 768px) {
    padding: 5px 8px;
    font-size: 14px;
  }
`;

const LoadingMessage = styled.p`
  text-align: center;
  font-size: 18px;
  color: #555;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

  th, td {
    padding: 12px;
    border: 1px solid #ddd;
    text-align: left;
  }

  th {
    background: #f3f3f3;
    font-size: 16px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  td {
    font-size: 15px;
  }

  tbody tr {
    animation: ${fadeIn} 0.5s ease-in-out;
  }

  @media (max-width: 768px) {
    th, td {
      padding: 10px;
      font-size: 14px;
    }
  }
`;
