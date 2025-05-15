import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TopNavbar from '../Nav/TopNavbar';
import Footer from '../Sections/Footer';
import { jsPDF } from "jspdf";
import { createGlobalStyle } from 'styled-components';

// Utility functions
function getDownloadUrl(fileUrl) {
  try {
    const separator = fileUrl.includes('?') ? '&' : '?';
    return `${fileUrl}${separator}fl_attachment=true`;
  } catch (err) {
    return fileUrl;
  }
}

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

// Helper to load an image URL and return a base64 data URL.
const loadImageAsDataURL = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
};

const CandidatesList = () => {
  const [candidates, setCandidates] = useState([]);
  const [filters, setFilters] = useState({ date: null, status: '', sortOrder: 'desc', referrerId: '' });
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
      if (filters.referrerId) params.referrerId = filters.referrerId;

      const response = await axios.get(`${API_BASE_URL}/api/candidates`, { params });
      setCandidates(response.data);

      // Initialize inline edit state.
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

  useEffect(() => { fetchCandidates(); }, [filters]);

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

  // Generate PDF report matching the template exactly
  const handleReport = async candidate => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 10;
    const rightMargin = 10; // constant for right margin
  
    // --- Header Section: Candidate Photo & Report Title ---
    if (candidate.candidatePic) {
      try {
        const photoData = await loadImageAsDataURL(candidate.candidatePic);
        const photoWidth = 28, photoHeight = 28;
        // Place candidate photo at top-right.
        doc.addImage(photoData, 'PNG', pageWidth - photoWidth - rightMargin, y, photoWidth, photoHeight);
      } catch (e) {
        console.error("Error loading candidate photo", e);
      }
    }
    doc.setFontSize(14);
    // Center the title text.
    doc.text("TEKCREWZ CANDIDATE – APPLICATION REPORT", pageWidth / 2, y + 20, { align: 'center' });
    y += 40;
  
    doc.setFontSize(12);
    // --- Candidate Details ---
  
    // Candidate Id and Name remain left aligned.
    doc.text(`Candidate Referer Id: ${candidate.userId || "…………………………………………………"}`, 10, y);
    y += 8;
    doc.text(`Candidate Name: ${candidate.candidateName || "……………………………………………"}`, 10, y);
    y += 8;
  
    // Degree, Programme and Course Name on one line.
    const degreeText = `Degree: ${candidate.candidateDegree || "…………………"}`;
    const progText = `Programme: ${candidate.programme || candidate.candidateCourseName || "…………………"}`;    
    const courseText = `Course Name: ${candidate.courseRegistered || "…………………"}`;
    doc.text(degreeText, 10, y);
    doc.text(progText, pageWidth / 2 - 20, y);
    doc.text(courseText, pageWidth - rightMargin, y, { align: 'right' });
    y += 8;
  
    // College Name (left aligned)
    doc.text(`College Name: ${candidate.college || "……………………………………………"}`, 10, y);
    y += 8;
  
    // Score Type on left; Scholarship attained on right.
    doc.text(`Score Type: (${candidate.marksType || "CGPA / Percentage"})`, 10, y);
    doc.text(`Scholarship attained: ${candidate.scholarshipSecured || "……………………………………"}`, pageWidth - rightMargin, y, { align: 'right' });
    y += 8;
  
    // Self-Mobile No on left; Parent Mobile No on right.
    doc.text(`Self-Mobile No: ${candidate.mobile || "………………………………………………………"}`, 10, y);
    doc.text(`Parent Mobile No: ${candidate.parentMobile || "………………………………………………………………"}`, pageWidth - rightMargin, y, { align: 'right' });
    y += 8;
  
    // Email on left; Date-of-Visit on right.
    doc.text(`Email-Id: ${candidate.email || "……………………………………………………………………"}`, 10, y);
    doc.text(`Date-of-Visit: ${candidate.dateOfVisit ? new Date(candidate.dateOfVisit).toLocaleDateString() : "…………………………………"}`, pageWidth - rightMargin, y, { align: 'right' });
    y += 8;
  
    // Courses Enquired. You can adjust the display as needed.
    doc.text(`Courses Enquired: (1) ${candidate.coursesEnquired || "(1) ………………………………  (2) ………………………………  (3) ………………………………"} (2) ………………………………  (3) ………………………………`, 10, y);
    y += 15;
  
    // --- Counselor Section (center align the title) ---
    doc.text("TO BE FILLED BY STUDENT COUNSELLOR", pageWidth / 2, y, { align: 'center' });
    y += 12;
  
    // --- Payment Term with dynamic checkboxes ---
doc.text("Payment Term:", 10, y);
const checkboxSize = 5;
let startX = 10 + doc.getTextWidth("Payment Term: ") + 5;

// FULL-TERM PAID checkbox
  doc.rect(startX, y - 5, checkboxSize, checkboxSize);
  if (candidate.paymentTerm === 'Full term') {
    // draw a checkmark inside the box
    doc.text('X', startX + 1, y);
  }
  doc.text("FULL-TERM PAID", startX + checkboxSize + 2, y);

  // TERM1 FEE PAID checkbox
  startX += checkboxSize + 2 + doc.getTextWidth("FULL-TERM PAID") + 10;
  doc.rect(startX, y - 5, checkboxSize, checkboxSize);
  if (candidate.paymentTerm === 'Term 1') {
    doc.text('X', startX + 1, y);
  }
  doc.text("TERM-1 FEE PAID", startX + checkboxSize + 2, y);

  startX += checkboxSize + 2 + doc.getTextWidth("Term 2 PAID") + 20;
  doc.rect(startX, y - 5, checkboxSize, checkboxSize);
  if (candidate.paymentTerm === 'Term 2') {
    doc.text('X', startX + 1, y);
  }
  doc.text("TERM-2 FEE PAID", startX + checkboxSize + 2, y);

  y += 8;

  
    // Additional counselor details.
    doc.text(`Term 2 Payment Date: ………………………………       Communication Score:   ${candidate.communicationScore ||"Communication Score: ………………"}`, 10, y);
    y += 8;
  
    // --- Remarks Section: Label and Rectangle text area ---
    doc.text("Remarks:", 10, y);
    y += 8;
    // Define a rectangle area for remarks.
    const remarksBoxHeight = 20; // increase or decrease as needed
    doc.rect(10, y, pageWidth - 20, remarksBoxHeight);  
    // Optionally, add existing remarks text (if any) inside the box with some padding.
    if(candidate.remarks) {
      doc.text(candidate.remarks, 12, y + 10, { maxWidth: pageWidth - 24 });
    }
    y += remarksBoxHeight + 12;
  
    // --- Course Undertaking Section (center aligned) ---
    doc.text("COURSE UNDERTAKING - CRITERIA", pageWidth / 2, y, { align: 'center' });
    y += 10;
    const undertakingText = "I ……………………………………… hereby enroll myself in the selected course ……………………………………………………… Whole-heartedly after knowing the Terms and Condition of the TEKCREWZ INFOTECH. I agree to follow all rules of the Company, attend classes regularly, and complete assignments as per the schedule. I understand that fees paid are non-refundable under any circumstances.";
    doc.text(undertakingText, 10, y, { maxWidth: pageWidth - 20 });
    y += 30;
    doc.text("Date: ………………………………………    Place: ………………………………………", 10, y);
    y += 8;
  
    // --- Signature Section ---
    // Align Candidate Signature text to the right.
    doc.text("Candidate Signature", pageWidth - rightMargin, y + 10, { align: 'right' });
    y += 35;
    if (candidate.signature) {
      try {
        const signatureData = await loadImageAsDataURL(candidate.signature);
        const sigWidth = 40, sigHeight = 20;
        doc.addImage(signatureData, 'PNG', pageWidth - sigWidth - rightMargin, y - 20, sigWidth, sigHeight);
      } catch (e) {
        console.error("Error loading candidate signature", e);
      }
    }
    doc.text("", pageWidth - rightMargin, y + 10, { align: 'right' });
  
    const filename = `Candidate Report - ${candidate.candidateName || "Candidate"}.pdf`;
    doc.save(filename);
  };
  
  

  return (
    <Wrapper>
      <TopNavbar />
      <DatepickerOverrides />
      <Content>
        <Filters>
          <FilterGroup>
            <FilterLabel>Date of Visit (Month):</FilterLabel>
            <DatePicker
              selected={filters.date}
              onChange={handleDateChange}
              dateFormat="MM-YYYY"
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
                  <th>S.No</th>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Degree – Course</th>
                  <th>College</th>
                  <th>Enquired</th>
                  <th>Date of Visit</th>
                  <th>Paid Amount</th>
                  <th>Paid Date</th>
                  <th>Payment Term</th>
                  <th>Status</th>
                  <th>Course Registered</th>
                  {/* <th>Remarks</th> */}
                  <th>Marksheet</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => (
                  <tr key={c._id}>
                    <td>{i + 1}</td>
                    <td>{c.referrerId}</td>
                    <td>{c.candidateName}</td>
                    <td>{c.candidateDegree} – {c.programme}</td>
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
                        <option value="Full term">Full term fee paid</option>
                        <option value="Term 1">Term 1 Paid</option>
                        <option value="Term 2">Term 2 Paid</option>
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
                        <option value="SEO & Digital Marketing">SEO & Digital Marketing</option>
                        <option value="Graphic Designing"> Graphic Designing</option>
                        <option value="Software Testing">Software Testing</option>
                        <option value="Business Analyst">Business Analyst</option>
                        <option value="PHP with Laravel">PHP with Laravel</option>
                        <option value="Dot Net">Dot Net</option>
                      </SelectField>
                    </td>
                    {/* <td>
                      <TextAreaField
                        value={editedCandidates[c._id]?.remarks || ''}
                        onChange={e => handleFieldChange(c._id, 'remarks', e.target.value)}
                      />
                    </td> */}
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
                        <ReportButton onClick={() => handleReport(c)}>Report</ReportButton>
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

/* Styled Components (example styling, adjust as needed) */

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
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
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
  overflow-y: visible;       /* ← allow vertical overflow */
  margin-top: 20px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  table-layout: auto;
  th,
  td {
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
    th,
    td {
      padding: 10px;
      font-size: 13px;
    }
  }
  @media (max-width: 768px) {
    th,
    td {
      padding: 8px;
      font-size: 12px;
    }
  }
  @media (max-width: 480px) {
    th,
    td {
      padding: 6px;
      font-size: 11px;
    }
  }
`;

const SelectFilter = styled.select`
  margin-left: 10px;
  padding: 5px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const DatepickerOverrides = createGlobalStyle`
  .react-datepicker-popper {
    z-index: 9999 !important;
  }
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

const ReportButton = styled.button`
  padding: 8px 16px;
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s ease;
  &:hover {
    background: #0056b3;
  }
`;

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
  color: #d9534f;
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

const DownloadLink = styled.a`
  color: #28a745;
  font-size: 18px;
  text-decoration: none;
  &:hover {
    color: #218838;
  }
`;
