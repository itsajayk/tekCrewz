// ReferrerCandidatesList.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TopNavbar from '../Nav/TopNavbar';
import Footer from '../Sections/Footer';
// Example: using an AuthContext to get the current user's referrer id
import { AuthContext } from '../../contexts/AuthContext'; // Updated import path

const ReferrerCandidatesList = () => {
  // Retrieve the current referrer's ID from your authentication context.
  // For example, assume that currentUser.displayName holds the referrer id.
  const { currentUser } = useContext(AuthContext);
  const currentReferrerId = currentUser ? currentUser.displayName : "REFSD001"; 

  const [candidates, setCandidates] = useState([]);
  // Filters: date (as Date object) and candidate status
  const [filters, setFilters] = useState({ date: null, status: '' });
  const [isLoading, setIsLoading] = useState(false);

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      // Build query parameters including the current referrer's id
      let params = { status: filters.status, userId: currentReferrerId };
      if (filters.date) {
        const year = filters.date.getFullYear();
        const month = String(filters.date.getMonth() + 1).padStart(2, '0');
        params.date = `${year}-${month}`;
      }
      const response = await axios.get('http://localhost:5000/api/candidates', { params });
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
        ) : (
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
  width: 100%;
  max-width: 1200px;
  margin: 120px auto 20px;  /* Ensures content is below a fixed navbar */
  padding: 20px;
  background: #fff;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
  border-radius: 8px;
`;

const Filters = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: center;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
`;

const FilterLabel = styled.span`
  font-size: 16px;
  font-weight: 500;
`;

const DateButton = styled.button`
  padding: 12px 18px;
  margin-left: 10px;
  border: 1px solid #e68a00;
  background: #fff;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  position: relative;
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
    &:after {
      border-top-color: #7620ff;
    }
  }
`;

const SelectFilter = styled.select`
  margin-left: 10px;
  padding: 6px 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const LoadingMessage = styled.p`
  text-align: center;
  font-size: 18px;
  color: #555;
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
`;
