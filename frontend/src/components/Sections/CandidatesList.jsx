// CandidatesList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TopNavbar from '../Nav/TopNavbar';
import Footer from '../Sections/Footer';

const CandidatesList = () => {
  const [candidates, setCandidates] = useState([]);
  const [filters, setFilters] = useState({ date: null, status: '', sortOrder: 'desc', userId: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [editedCandidates, setEditedCandidates] = useState({});

  const API_BASE_URL = 'https://tekcrewz.onrender.com';

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      let params = { status: filters.status, sortOrder: filters.sortOrder };
      if (filters.date) {
        const year = filters.date.getFullYear();
        const month = String(filters.date.getMonth() + 1).padStart(2, '0');
        params.date = `${year}-${month}`;
      }
      if (filters.userId) {
        params.userId = filters.userId;
      }
      const response = await axios.get(`${API_BASE_URL}/api/candidates`, { params });
      setCandidates(response.data);
      const initialEdits = {};
      response.data.forEach(candidate => {
        initialEdits[candidate._id] = {
          paidAmount: candidate.paidAmount || 0,
          paidDate: candidate.paidDate ? candidate.paidDate.split('T')[0] : '',
          paymentTerm: candidate.paymentTerm || '',
          status: candidate.status || 'Registered',
          remarks: candidate.remarks || '',
          courseRegistered: candidate.courseRegistered || ''
        };
      });
      setEditedCandidates(initialEdits);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleDateChange = (date) => {
    setFilters({ ...filters, date });
  };

  const toggleSortOrder = () => {
    setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
  };

  const handleFieldChange = (id, field, value) => {
    setEditedCandidates(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSave = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/api/candidates/${id}`, editedCandidates[id]);
      fetchCandidates();
    } catch (error) {
      console.error('Error updating candidate:', error);
    }
  };

  const handleRemove = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/candidates/${id}`);
      fetchCandidates();
    } catch (error) {
      console.error('Error removing candidate:', error);
    }
  };

  return (
    <Wrapper>
      <TopNavbar />
      <Content>
        <Filters>
          <FilterGroup>
            <FilterLabel>Date of Visit (Month):</FilterLabel>
            <DatePicker
              selected={filters.date}
              onChange={handleDateChange}
              dateFormat="yyyy-MM"
              placeholderText="Select Month"
              showMonthYearPicker
              customInput={<DateButton />}
              isClearable
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
              <option value="Full term fee paid">Full term fee paid</option>
              <option value="Term 1 Paid">Term 1 Paid</option>
              <option value="Term 2 Paid">Term 2 Paid</option>
            </SelectFilter>
          </FilterGroup>
          {/* Uncomment the block below to enable filtering by user ID */}
          {/* <FilterGroup>
            <FilterLabel>User ID:</FilterLabel>
            <InputFilter
              type="text"
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              placeholder="Enter User ID"
            />
          </FilterGroup> */}
          <SortButton onClick={toggleSortOrder}>
            Sort Date: {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </SortButton>
        </Filters>
        {isLoading ? (
          <LoadingMessage>Loading...</LoadingMessage>
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Degree – Course Name</th>
                  <th>College Name</th>
                  <th>Courses Enquired</th>
                  <th>Date of Visit</th>
                  <th>Paid Amount</th>
                  <th>Paid Date</th>
                  <th>Payment Term</th>
                  <th>Status</th>
                  <th>Course Registered</th>
                  <th>Remarks</th>
                  <th>Marksheet</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate, index) => (
                  <tr key={candidate._id}>
                    <td>{index + 1}</td>
                    <td>{candidate.userId}</td>
                    <td>{candidate.candidateName}</td>
                    <td>{candidate.candidateDegree} – {candidate.candidateCourseName}</td>
                    <td>{candidate.college}</td>
                    <td>{candidate.coursesEnquired}</td>
                    <td>{new Date(candidate.dateOfVisit).toLocaleDateString()}</td>
                    <td>
                      <InputField
                        type="number"
                        value={editedCandidates[candidate._id]?.paidAmount || ''}
                        onChange={(e) =>
                          handleFieldChange(candidate._id, 'paidAmount', Number(e.target.value))
                        }
                      />
                    </td>
                    <td>
                      <InputField
                        type="date"
                        value={editedCandidates[candidate._id]?.paidDate || ''}
                        onChange={(e) =>
                          handleFieldChange(candidate._id, 'paidDate', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <SelectField
                        value={editedCandidates[candidate._id]?.paymentTerm || ''}
                        onChange={(e) =>
                          handleFieldChange(candidate._id, 'paymentTerm', e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        <option value="Full term fee">Full term fee</option>
                        <option value="Term 1 Fee">Term 1 Fee</option>
                        <option value="Term 2 Fee">Term 2 Fee</option>
                      </SelectField>
                    </td>
                    <td>
                      <SelectField
                        value={editedCandidates[candidate._id]?.status || 'Registered'}
                        onChange={(e) =>
                          handleFieldChange(candidate._id, 'status', e.target.value)
                        }
                      >
                        <option value="Registered">Registered</option>
                        <option value="Enrolled">Enrolled</option>
                        <option value="Full term fee paid">Full term fee paid</option>
                        <option value="Term 1 Paid">Term 1 Paid</option>
                        <option value="Term 2 Paid">Term 2 Paid</option>
                      </SelectField>
                    </td>
                    <td>
                      <SelectField
                        value={editedCandidates[candidate._id]?.courseRegistered || ''}
                        onChange={(e) =>
                          handleFieldChange(candidate._id, 'courseRegistered', e.target.value)
                        }
                      >
                        <option value="">Select Course</option>
                        <option value="Full Stack">Full Stack</option>
                        <option value="Python">Python</option>
                        <option value="Digital Marketing">Digital Marketing</option>
                      </SelectField>
                    </td>
                    <td>
                      <TextAreaField
                        value={editedCandidates[candidate._id]?.remarks || ''}
                        onChange={(e) =>
                          handleFieldChange(candidate._id, 'remarks', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      {candidate.markStatement ? (
                        <DownloadButton
                          href={`${API_BASE_URL}/${candidate.markStatement}`}
                          download
                        >
                          Download
                        </DownloadButton>
                      ) : (
                        'No file'
                      )}
                    </td>
                    <td>
                      <ActionButtons>
                        <SaveButton onClick={() => handleSave(candidate._id)}>
                          Save
                        </SaveButton>
                        <RemoveButton onClick={() => handleRemove(candidate._id)}>
                          Remove
                        </RemoveButton>
                      </ActionButtons>
                    </td>
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

export default CandidatesList;

/* Styled Components */
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Content = styled.main`
  flex: 1;
  max-width: 1300px;
  margin: 100px auto 20px;
  padding: 10px;
  background: #fff;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
  border-radius: 8px;
  @media (max-width: 768px) {
    margin: 60px auto 20px;
    padding: 20px 8px;
  }
  @media (max-width: 480px) {
    margin: 40px 10px;
    padding: 20px 5px;
  }
`;

const Filters = styled.div`
  display: flex;
  gap: 20px;
  margin: 20px auto;
  align-items: center;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    flex-direction: column;
  }
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

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  margin-top: 20px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  table-layout: auto;
  th, td {
    padding: 12px;
    border: 1px solid #ddd;
    vertical-align: middle;
    text-align: left;
  }
  th {
    background-color: #f3f3f3;
    font-size: 16px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: center;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  tr:hover {
    background-color: #e0e0e0;
    transition: background-color 0.3s ease;
  }
  @media (max-width: 1024px) {
    th, td {
      padding: 10px;
      font-size: 13px;
    }
  }
  @media (max-width: 768px) {
    th, td {
      padding: 8px;
      font-size: 12px;
    }
  }
  @media (max-width: 480px) {
    th, td {
      padding: 6px;
      font-size: 11px;
    }
  }
`;

const InputFilter = styled.input`
  margin-left: 10px;
  padding: 6px 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const SelectFilter = styled.select`
  margin-left: 10px;
  padding: 5px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const SortButton = styled.button`
  padding: 6px 12px;
  font-size: 16px;
  border: 1px solid #7620ff;
  background: #7620ff;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
  &:hover {
    background: #580cd2;
  }
  @media (max-width: 480px) {
    padding: 4px 10px;
    font-size: 14px;
  }
`;

const LoadingMessage = styled.p`
  text-align: center;
  font-size: 18px;
  color: #555;
`;

const InputField = styled.input`
  width: 90%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  &:focus {
    border-color: #7620ff;
    outline: none;
  }
`;

const SelectField = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  &:focus {
    border-color: #7620ff;
    outline: none;
  }
`;

const TextAreaField = styled.textarea`
  width: 100%;
  padding: 3px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  resize: vertical;
  min-height: 40px;
  &:focus {
    border-color: #7620ff;
    outline: none;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SaveButton = styled.button`
  padding: 8px 16px;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s ease;
  &:hover {
    background: #580cd2;
  }
`;

const RemoveButton = styled.button`
  padding: 8px 16px;
  background: #d32f2f;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s ease;
  &:hover {
    background: #b71c1c;
  }
`;

const DownloadButton = styled.a`
  display: inline-block;
  padding: 6px 12px;
  background: #28a745;
  color: #fff;
  border-radius: 4px;
  text-decoration: none;
  font-size: 14px;
  &:hover {
    background: #218838;
  }
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const Loader = styled.div`
  border: 8px solid #f3f3f3;
  border-top: 8px solid #7620ff;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: ${spin} 1.5s linear infinite;
`;
