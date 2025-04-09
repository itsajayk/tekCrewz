// CandidatesList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TopNavbar from '../Nav/TopNavbar';
import Footer from '../Sections/Footer';

function getDownloadUrl(fileUrl) {
  try {
    // Check if URL already has query parameters.
    const separator = fileUrl.includes('?') ? '&' : '?';
    return `${fileUrl}${separator}fl_attachment=true`;
  } catch (err) {
    return fileUrl;
  }
}

// Extract original filename from Cloudinary URL
function extractOriginalFileName(fileUrl) {
  try {
    const url = new URL(fileUrl);
    const segments = url.pathname.split('/');
    const fileWithPrefix = segments[segments.length - 1];
    const dashIndex = fileWithPrefix.indexOf('-');
    return dashIndex === -1 ? fileWithPrefix : fileWithPrefix.substring(dashIndex + 1);
  } catch (err) {
    return fileUrl;
  }
}

const CandidatesList = () => {
  const [candidates, setCandidates] = useState([]);
  const [filters, setFilters] = useState({ date: null, status: '', sortOrder: 'desc', userId: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [editedCandidates, setEditedCandidates] = useState({});

  // Use env var for API base URL
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
      if (filters.userId) params.userId = filters.userId;

      const response = await axios.get(`${API_BASE_URL}/api/candidates`, { params });
      setCandidates(response.data);

      // Initialize inline edit state
      const initialEdits = {};
      response.data.forEach(c => {
        initialEdits[c._id] = {
          paidAmount: c.paidAmount || 0,
          paidDate: c.paidDate ? c.paidDate.split('T')[0] : '',
          paymentTerm: c.paymentTerm || '',
          status: c.status || 'Registered',
          remarks: c.remarks || '',
          courseRegistered: c.courseRegistered || ''
        };
      });
      setEditedCandidates(initialEdits);
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCandidates(); /* eslint-disable-next-line */ }, [filters]);

  const handleFilterChange = e => setFilters({ ...filters, [e.target.name]: e.target.value });
  const handleDateChange = date => setFilters({ ...filters, date });
  const toggleSortOrder = () => setFilters({ ...filters, sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });

  const handleFieldChange = (id, field, value) => {
    setEditedCandidates(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleSave = async id => {
    try {
      await axios.put(`${API_BASE_URL}/api/candidates/${id}`, editedCandidates[id]);
      fetchCandidates();
    } catch (err) {
      console.error('Error updating candidate:', err);
    }
  };

  const handleRemove = async id => {
    try {
      await axios.delete(`${API_BASE_URL}/api/candidates/${id}`);
      fetchCandidates();
    } catch (err) {
      console.error('Error removing candidate:', err);
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
            <SelectFilter name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All</option>
              <option value="Registered">Registered</option>
              <option value="Enrolled">Enrolled</option>
              <option value="Full term fee paid">Full term fee paid</option>
              <option value="Term 1 Paid">Term 1 Paid</option>
              <option value="Term 2 Paid">Term 2 Paid</option>
            </SelectFilter>
          </FilterGroup>
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
                  <th>S.No</th><th>User ID</th><th>Name</th>
                  <th>Degree – Course</th><th>College</th><th>Enquired</th>
                  <th>Date of Visit</th><th>Paid Amount</th><th>Paid Date</th>
                  <th>Payment Term</th><th>Status</th><th>Course Registered</th>
                  <th>Remarks</th><th>Marksheet</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => (
                  <tr key={c._id}>
                    <td>{i+1}</td>
                    <td>{c.userId}</td>
                    <td>{c.candidateName}</td>
                    <td>{c.candidateDegree} – {c.candidateCourseName}</td>
                    <td>{c.college}</td>
                    <td>{c.coursesEnquired}</td>
                    <td>{new Date(c.dateOfVisit).toLocaleDateString()}</td>
                    <td>
                      <InputField
                        type="number"
                        value={editedCandidates[c._id]?.paidAmount || ''}
                        onChange={e => handleFieldChange(c._id, 'paidAmount', Number(e.target.value))}
                      />
                    </td>
                    <td>
                      <InputField
                        type="date"
                        value={editedCandidates[c._id]?.paidDate || ''}
                        onChange={e => handleFieldChange(c._id, 'paidDate', e.target.value)}
                      />
                    </td>
                    <td>
                      <SelectField
                        value={editedCandidates[c._id]?.paymentTerm || ''}
                        onChange={e => handleFieldChange(c._id, 'paymentTerm', e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="Full term fee paid">Full term fee paid</option>
                        <option value="Term 1 Paid">Term 1 Paid</option>
                        <option value="Term 2 Paid">Term 2 Paid</option>
                      </SelectField>
                    </td>
                    <td>
                      <SelectField
                        value={editedCandidates[c._id]?.status || 'Registered'}
                        onChange={e => handleFieldChange(c._id, 'status', e.target.value)}
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
                        value={editedCandidates[c._id]?.courseRegistered || ''}
                        onChange={e => handleFieldChange(c._id, 'courseRegistered', e.target.value)}
                      >
                        <option value="">Select Course</option>
                        <option value="Full Stack">Full Stack</option>
                        <option value="Python">Python</option>
                        <option value="Digital Marketing">Digital Marketing</option>
                      </SelectField>
                    </td>
                    <td>
                      <TextAreaField
                        value={editedCandidates[c._id]?.remarks || ''}
                        onChange={e => handleFieldChange(c._id, 'remarks', e.target.value)}
                      />
                    </td>
                    <td>
                      {c.markStatement ? (
                        <PDFCard>
                          <PDFIcon className="fa-solid fa-file-pdf" />
                          <FileInfo>
                            <FileName>{extractOriginalFileName(c.markStatement)}</FileName>
                          </FileInfo>
                          <DownloadLink href={getDownloadUrl(c.markStatement)} download>
                            <i className="fa-solid fa-download"></i>
                          </DownloadLink>
                        </PDFCard>
                      ) : 'No file'}
                    </td>
                    <td>
                      <ActionButtons>
                        <SaveButton onClick={() => handleSave(c._id)}>Save</SaveButton>
                        <RemoveButton onClick={() => handleRemove(c._id)}>Remove</RemoveButton>
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

// (Styled components remain unchanged from your original file)


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

  /* 
  * NEW STYLED COMPONENTS FOR PDF CARD
  * 
  * This "PDFCard" layout displays:
  * - A PDF icon
  * - File name
  * - (Optional) file size
  * - Download icon
  */
  const PDFCard = styled.div`
    display: flex;
    align-items: center;
    background-color: #f9f9f9;
    border: 1px solid #eee;
    padding: 8px;
    border-radius: 6px;
    width: 220px;
    gap: 8px;
  `;

  const PDFIcon = styled.i`
    color: #d9534f; /* typical PDF red color */
    font-size: 24px;
  `;

  const FileInfo = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
  `;

  const FileName = styled.span`
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
    word-break: break-all;
  `;

  const FileSize = styled.span`
    font-size: 12px;
    color: #777;
  `;

  const DownloadLink = styled.a`
    color: #28a745;
    font-size: 18px;
    text-decoration: none;
    &:hover {
      color: #218838;
    }
  `;
