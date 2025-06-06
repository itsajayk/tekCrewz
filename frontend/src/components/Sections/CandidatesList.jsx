// CandidatesList.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TopNavbar from '../Nav/TopNavbar';
import Footer from '../Sections/Footer';
import { jsPDF } from "jspdf";

/* ── ANIMATION KEYFRAMES ──────────────────────────────────────────────────────────── */
const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-40px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const slideDownFade = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const slideUpFade = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ── NEW: List of available courses ─────────────────────────────────────────────   
const COURSE_OPTIONS = [                                                         
  "Full Stack",                                                                  
  "Python",                                                                      
  "SEO & Digital Marketing",                                                     
  "Graphic Designing",                                                           
  "Software Testing",                                                             
  "Business Analyst",                                                             
  "PHP with Laravel",                                                             
  "Dot Net"                                                                       
];                                                                                
// ─

// Utility functions (unchanged)
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
  // ── State Hooks ─────────────────────────────────────────────────────────────────
  const [candidates, setCandidates] = useState([]);
  const [filters, setFilters] = useState({
    date: null,
    status: '',
    sortOrder: 'desc',
    referrerId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  // track edits per candidate ID
  const [editedCandidates, setEditedCandidates] = useState({});
  // toggle between Card View / Table View
  const [isTableView, setIsTableView] = useState(false);
  // track which card is expanded
  const [expandedCard, setExpandedCard] = useState(null);

    // ── NEW: dropdown open state per row in Table View ────────────────────────────── // NEW
  const [courseDropdownOpen, setCourseDropdownOpen] = useState({});                     // NEW
  const dropdownRefs = useRef({});   

  const API_BASE_URL = 'https://tekcrewz.onrender.com';

   // ── FETCH CANDIDATES ───────────────────────────────────────────────────────────────
  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      let params = {
        status: filters.status,
        sortOrder: filters.sortOrder
      };
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
        // ── NORMALIZE courseRegistered TO ARRAY ───────────────────────────────────
        let coursesArray = [];
        if (Array.isArray(c.courseRegistered)) {
          coursesArray = c.courseRegistered;
        } else if (typeof c.courseRegistered === 'string' && c.courseRegistered.trim()) {
          coursesArray = [c.courseRegistered];
        }
        // ── ──────────────────────────────────────────────────────────────────────

        initialEdits[c._id] = {
          paidAmount: c.paidAmount || 0,
          paidDate: c.paidDate ? c.paidDate.split('T')[0] : '',
          paymentTerm: c.paymentTerm || '',
          status: c.status || 'Registered',
          remarks: c.remarks || '',
          courseRegistered: coursesArray  // CHANGED: now an array
        };
      });
      setEditedCandidates(initialEdits);
    } catch (err) {
      console.error('Error fetching candidates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [filters]);

  // ── HANDLERS ───────────────────────────────────────────────────────────────────────
  const handleFilterChange = e => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleDateChange = date => {
    setFilters(prev => ({ ...prev, date }));
  };
  const toggleSortOrder = () => {
    setFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };
  const handleFieldChange = (id, field, value) => {
    setEditedCandidates(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
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

  // Generate PDF report (unchanged logic, just kept here)
  const handleReport = async (candidate) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 10;
    const rightMargin = 10;

    // --- Header Section: Candidate Photo & Report Title ---
    if (candidate.candidatePic) {
      try {
        const photoData = await loadImageAsDataURL(candidate.candidatePic);
        const photoWidth = 28,
          photoHeight = 28;
        doc.addImage(photoData, 'PNG', pageWidth - photoWidth - rightMargin, y, photoWidth, photoHeight);
      } catch (e) {
        console.error('Error loading candidate photo', e);
      }
    }
    doc.setFontSize(14);
    doc.text('TEKCREWZ CANDIDATE – APPLICATION REPORT', pageWidth / 2, y + 20, { align: 'center' });
    y += 40;
    doc.setFontSize(12);

    // --- Candidate Details ---
    doc.text(`Candidate student Id: ${candidate.studentId || '…………………………………………………'}`, 10, y);
    y += 8;
    doc.text(`Candidate Name: ${candidate.candidateName || '……………………………………………'}`, 10, y);
    y += 8;

    const degreeText = `Degree: ${candidate.candidateDegree || '…………………'}`;
    const progText = `Programme: ${candidate.programme || '…………………'}`;
    const courseText = `Course Name: ${candidate.candidateCourseName || '…………………'}`;
    doc.text(degreeText, 10, y);
    doc.text(progText, pageWidth / 2 - 20, y);
    doc.text(courseText, pageWidth - rightMargin, y, { align: 'right' });
    y += 8;

    doc.text(`College Name: ${candidate.college || '……………………………………………'}`, 10, y);
    y += 8;
    doc.text(`Score Type: (${candidate.marksType || 'CGPA / Percentage'})`, 10, y);
    doc.text(
      `Scholarship attained: ${candidate.scholarshipSecured || '……………………………………'}`,
      pageWidth - rightMargin,
      y,
      { align: 'right' }
    );
    y += 8;
    doc.text(`Self-Mobile No: ${candidate.mobile || '………………………………………………………'}`, 10, y);
    doc.text(
      `Parent Mobile No: ${candidate.parentMobile || '………………………………………………………………'}`,
      pageWidth - rightMargin,
      y,
      { align: 'right' }
    );
    y += 8;
    doc.text(
      `Email-Id: ${candidate.email || '……………………………………………………………………'}`,
      10,
      y
    );
    doc.text(
      `Date-of-Visit: ${
        candidate.dateOfVisit
          ? new Date(candidate.dateOfVisit).toLocaleDateString()
          : '…………………………………'
      }`,
      pageWidth - rightMargin,
      y,
      { align: 'right' }
    );
    y += 8;
    doc.text(
      `Courses Enrolled: (1) ${candidate.coursesEnquired || '(1) ………………………………  (2) ………………………………'}`,
      10,
      y
    );
    y += 15;

    // --- Counselor Section ---
    doc.text('TO BE FILLED BY STUDENT COUNSELLOR', pageWidth / 2, y, { align: 'center' });
    y += 12;

    doc.text('Payment Term:', 10, y);
    const checkboxSize = 5;
    let startX = 10 + doc.getTextWidth('Payment Term: ') + 5;
    doc.rect(startX, y - 5, checkboxSize, checkboxSize);
    if (candidate.paymentTerm === 'Full term') doc.text('X', startX + 1, y);
    doc.text('FULL-TERM PAID', startX + checkboxSize + 2, y);

    startX += checkboxSize + 2 + doc.getTextWidth('FULL-TERM PAID') + 10;
    doc.rect(startX, y - 5, checkboxSize, checkboxSize);
    if (candidate.paymentTerm === 'Term 1') doc.text('X', startX + 1, y);
    doc.text('TERM-1 FEE PAID', startX + checkboxSize + 2, y);

    startX += checkboxSize + 2 + doc.getTextWidth('Term 2 PAID') + 20;
    doc.rect(startX, y - 5, checkboxSize, checkboxSize);
    if (candidate.paymentTerm === 'Term 2') doc.text('X', startX + 1, y);
    doc.text('TERM-2 FEE PAID', startX + checkboxSize + 2, y);
    y += 8;

    doc.text(
      `Term 2 Payment Date: ………………………………       Communication Score:   ${
        candidate.communicationScore || 'Communication Score: ………………'
      }`,
      10,
      y
    );
    y += 8;

    doc.text('Remarks:', 10, y);
    y += 8;
    const remarksBoxHeight = 20;
    doc.rect(10, y, pageWidth - 20, remarksBoxHeight);
    if (candidate.remarks) {
      doc.text(candidate.remarks, 12, y + 10, { maxWidth: pageWidth - 24 });
    }
    y += remarksBoxHeight + 12;

    doc.text('COURSE UNDERTAKING - CRITERIA', pageWidth / 2, y, { align: 'center' });
    y += 10;
    const undertakingText =
      'I ……………………………………… hereby enroll myself in the selected course ……………………………………………………… Whole-heartedly after knowing the Terms and Condition of the TEKCREWZ INFOTECH. I agree to follow all rules of the Company, attend classes regularly, and complete assignments as per the schedule. I understand that fees paid are non-refundable under any circumstances.';
    doc.text(undertakingText, 10, y, { maxWidth: pageWidth - 20 });
    y += 30;
    doc.text('Date: ………………………………………    Place: ………………………………………', 10, y);
    y += 8;
    doc.text('Candidate Signature', pageWidth - rightMargin, y + 10, { align: 'right' });
    y += 35;
    if (candidate.signature) {
      try {
        const signatureData = await loadImageAsDataURL(candidate.signature);
        const sigWidth = 40,
          sigHeight = 20;
        doc.addImage(signatureData, 'PNG', pageWidth - sigWidth - rightMargin, y - 20, sigWidth, sigHeight);
      } catch (e) {
        console.error('Error loading candidate signature', e);
      }
    }

    const filename = `Candidate Report - ${candidate.candidateName || 'Candidate'}.pdf`;
    doc.save(filename);
  };


  useEffect(() => {                                                                    // NEW
    const handleClickOutside = event => {                                             // NEW
      Object.keys(dropdownRefs.current).forEach(id => {                               // NEW
        const ref = dropdownRefs.current[id];                                         // NEW
        if (ref && !ref.contains(event.target)) {                                      // NEW
          setCourseDropdownOpen(prev => ({ ...prev, [id]: false }));                  // NEW
        }                                                                              // NEW
      });                                                                             // NEW
    };                                                                                 // NEW
    document.addEventListener('mousedown', handleClickOutside);                        // NEW
    return () => document.removeEventListener('mousedown', handleClickOutside);       // NEW
  }, []);                                                                              // NEW
  // ─────────────────────────────────────────────────────────────────────────────────


  // ── RENDER ─────────────────────────────────────────────────────────────────────────
  return (
    <Wrapper>
      <TopNavbar />
      <FiltersWrapper>
        {/* Animated heading */}
        <PageHeaderAnimated>Manage Candidates</PageHeaderAnimated>

        {/* Subheading */}
        <SubHeaderAnimated delay={0.3}>
          View, Edit, or Remove any candidate below.
        </SubHeaderAnimated>

        {/* Filter Panel (slides down) */}
        <FilterPanelAnimated>
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
          <FilterGroup>
            <FilterLabel>Referrer ID:</FilterLabel>
            <ReferrerInput
              type="text"
              name="referrerId"
              value={filters.referrerId}
              onChange={handleFilterChange}
              placeholder="Enter Admin/Referrer ID"
            />
          </FilterGroup>
          <SortButton onClick={toggleSortOrder}>
            Sort Date: {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </SortButton>
          <ViewToggle onClick={() => setIsTableView(prev => !prev)}>
            {isTableView ? "Switch to Card View" : "Switch to Table View"}
          </ViewToggle>
        </FilterPanelAnimated>

        {isLoading ? (
          <LoadingMessage>Loading candidates…</LoadingMessage>
        ) : isTableView ? (
          /* ── TABLE VIEW ─────────────────────────────────────────────────────────── */
          <TableWrapperAnimated delay={0.6}>
            <ResponsiveTable>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Referrer ID</th>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Degree – Course</th>
                  <th>College</th>
                  <th>Date of Visit</th>
                  <th>Paid Amount</th>
                  <th>Paid Date</th>
                  <th>Term</th>
                  <th>Status</th>
                  <th>Course Registered</th>
                  <th>Marksheet</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => (
                  <tr key={c._id}>
                    <td>{i + 1}</td>
                    <td>{c.referrerId}</td>
                    <td>{c.studentId}</td>
                    <td>{c.candidateName}</td>
                    <td>{c.candidateDegree} – {c.programme}</td>
                    <td>{c.college}</td>
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
                      {/* ── CHANGED: Dropdown wrapper for multi-checkbox courses ─────────────── */}
                      <DropdownWrapper ref={el => (dropdownRefs.current[c._id] = el)}>           
                        <DropdownHeader                                                      
                          onClick={() =>                                                      
                            setCourseDropdownOpen(prev => ({                                  
                              ...prev,                                                        
                              [c._id]: !prev[c._id]                                          
                            }))                                                                
                          }                                                                    
                        >                                                                      
                          {editedCandidates[c._id]?.courseRegistered &&                          
                          editedCandidates[c._id].courseRegistered.length > 0                                 
                            ? editedCandidates[c._id].courseRegistered.join(', ')           
                            : "Select Courses"}                                            
                          <ArrowIcon>&#9662;</ArrowIcon>                                   
                        </DropdownHeader>                                                       
                        {courseDropdownOpen[c._id] && (                                         
                          <DropdownList>                                                    
                            {COURSE_OPTIONS.map(course => (                                  
                              <CheckboxLabel key={course}>                                
                                <CheckboxInput                                      
                                  type="checkbox"                                       
                                  checked={editedCandidates[c._id]?.courseRegistered?.includes(course) || false}   
                                  onChange={e => {                                    
                                    const prevArr = editedCandidates[c._id]?.courseRegistered || [];   
                                    if (e.target.checked) {                             
                                      // add course
                                      handleFieldChange(c._id, 'courseRegistered', [...prevArr, course]);  
                                    } else {
                                      // remove course
                                      handleFieldChange(c._id, 'courseRegistered', prevArr.filter(cname => cname !== course));  
                                    }
                                  }}                                                       
                                />                                                          
                                {course}                                                  
                              </CheckboxLabel>                                              
                            ))}                                                              
                          </DropdownList>                                                      
                        )}                                                                    
                      </DropdownWrapper>                                                        
                    </td>
                    <td>
                      {c.markStatement ? (
                        <PDFCard>
                          <PDFIcon className="fa-solid fa-file-pdf" />
                          <FileInfo>
                            <FileName>{extractOriginalFileName(c.markStatement)}</FileName>
                          </FileInfo>
                          <DownloadLinkAnimated
                            href={getDownloadUrl(c.markStatement)}
                            download
                            delay={0.9}
                          >
                            <i className="fa-solid fa-download" />
                          </DownloadLinkAnimated>
                        </PDFCard>
                      ) : 'No file'}
                    </td>
                    <td>
                      <ActionButtons>
                        <ReportButtonAnimated onClick={() => handleReport(c)} delay={1.0}>
                          Report
                        </ReportButtonAnimated>
                        <SaveButtonAnimated onClick={() => handleSave(c._id)} delay={1.1}>
                          Save
                        </SaveButtonAnimated>
                        <RemoveButtonAnimated onClick={() => handleRemove(c._id)} delay={1.2}>
                          Remove
                        </RemoveButtonAnimated>
                      </ActionButtons>
                    </td>
                  </tr>
                ))}
              </tbody>
            </ResponsiveTable>
          </TableWrapperAnimated>
        ) : (
          /* ── CARD VIEW ─────────────────────────────────────────────────────────── */
          <CardGridAnimated delay={0.6}>
            {candidates.map((c, i) => (
              <CandidateCardAnimated
                key={c._id}
                delay={0.7 + i * 0.05}          /* Staggered fade-in of cards */
                onClick={() => setExpandedCard(expandedCard === c._id ? null : c._id)}
              >
                {/* TOP ROW: Name + ID */}
                <CardHeader>
                  <CandidateName>{c.candidateName}</CandidateName>
                  <StudentId>ID: {c.studentId}</StudentId>
                </CardHeader>

                {/* SUBROW: Referrer, Date */}
                <CardSubHeader>
                  <SmallText>Referrer: {c.referrerId}</SmallText>
                  <SmallText>
                    Visit: {new Date(c.dateOfVisit).toLocaleDateString()}
                  </SmallText>
                </CardSubHeader>

                {/* MINI ROW: Degree   College */}
                <CardInfoRow>
                  <InfoLabel>Degree:</InfoLabel>
                  <InfoValue>{c.candidateDegree}</InfoValue>
                  <InfoLabel>College:</InfoLabel>
                  <InfoValue>{c.college}</InfoValue>
                </CardInfoRow>

                {/* MARKS PDF (fade-in icon) */}
                <CardInfoRow>
                  <InfoLabel>Marksheet:</InfoLabel>
                  {c.markStatement ? (
                    <PDFCard>
                      <PDFIcon className="fa-solid fa-file-pdf" />
                      <FileName>{extractOriginalFileName(c.markStatement)}</FileName>
                      <DownloadLinkAnimated
                        href={getDownloadUrl(c.markStatement)}
                        download
                        delay={0.9}
                      >
                        <i className="fa-solid fa-download" />
                      </DownloadLinkAnimated>
                    </PDFCard>
                  ) : (
                    <SmallText>No file</SmallText>
                  )}
                </CardInfoRow>

                {/* EXPANDABLE SECTION: only if this card is expanded */}
                {expandedCard === c._id && (
                  <ExpandedSectionAnimated delay={1.0}>
                    {/* Inline edit fields */}
                    <FieldRow>
                      <FieldLabel>Paid Amount:</FieldLabel>
                      <InputField
                        type="number"
                        value={editedCandidates[c._id]?.paidAmount || ''}
                        onChange={e => handleFieldChange(c._id, 'paidAmount', Number(e.target.value))}
                      />
                    </FieldRow>
                    <FieldRow>
                      <FieldLabel>Paid Date:</FieldLabel>
                      <InputField
                        type="date"
                        value={editedCandidates[c._id]?.paidDate || ''}
                        onChange={e => handleFieldChange(c._id, 'paidDate', e.target.value)}
                      />
                    </FieldRow>
                    <FieldRow>
                      <FieldLabel>Payment Term:</FieldLabel>
                      <SelectField
                        value={editedCandidates[c._id]?.paymentTerm || ''}
                        onChange={e => handleFieldChange(c._id, 'paymentTerm', e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="Full term">Full term fee paid</option>
                        <option value="Term 1">Term 1 Paid</option>
                        <option value="Term 2">Term 2 Paid</option>
                      </SelectField>
                    </FieldRow>
                    <FieldRow>
                      <FieldLabel>Status:</FieldLabel>
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
                    </FieldRow>
                    <FieldRow>
                      <FieldLabel>Status:</FieldLabel>
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
                    </FieldRow>
                    <FieldRow>
                      <FieldLabel>Courses:</FieldLabel>
                      {/* ── MULTI-CHECKBOXES FOR COURSES ────────────────────────────────── */}   
                      <CourseCheckboxGroup>                                           
                        {COURSE_OPTIONS.map(course => (                             
                          <CheckboxLabel key={course}>                              
                            <CheckboxInput                                           
                              type="checkbox"                                         
                              checked={editedCandidates[c._id]?.courseRegistered?.includes(course) || false}   
                              onChange={e => {                                       
                                const prevArr = editedCandidates[c._id]?.courseRegistered || [];   
                                if (e.target.checked) {                               
                                  // add course
                                  handleFieldChange(c._id, 'courseRegistered', [...prevArr, course]);   
                                } else {
                                  // remove course
                                  handleFieldChange(c._id, 'courseRegistered', prevArr.filter(cname => cname !== course));   
                                }
                              }}                                                      
                            />                                                        
                            {course}                                                  
                          </CheckboxLabel>                                           
                        ))}                                                            
                      </CourseCheckboxGroup>                                          
                    </FieldRow>

                    {/* Action Buttons (slide up) */}
                    <CardActions>
                      <SaveButtonAnimated onClick={() => handleSave(c._id)} delay={1.2}>
                        Save
                      </SaveButtonAnimated>
                      <RemoveButtonAnimated onClick={() => handleRemove(c._id)} delay={1.3}>
                        Remove
                      </RemoveButtonAnimated>
                      <ReportButtonAnimated onClick={() => handleReport(c)} delay={1.4}>
                        Report
                      </ReportButtonAnimated>
                    </CardActions>
                  </ExpandedSectionAnimated>
                )}
              </CandidateCardAnimated>
            ))}
          </CardGridAnimated>
        )}
      </FiltersWrapper>
      <Footer />
    </Wrapper>
  );
};

export default CandidatesList;



/* ── GLOBAL STYLE OVERRIDES FOR DATEPICKER ──────────────────────────────────────── */
const DatepickerOverrides = createGlobalStyle`
  .react-datepicker-popper {
    z-index: 9999 !important;
  }
`;

/* ── WRAPPER & HEADER ─────────────────────────────────────────────────────────────── */
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${(p) => p.theme.background};
`;

const FiltersWrapper = styled.div`
  flex: 1;
  max-width: 1200px;
  margin: 100px auto 20px;
  padding: 20px;
  background: ${(p) => p.theme.cardBg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 12px;

  @media (max-width: 768px) {
    margin: 60px auto 20px;
    padding: 16px;
  }
  @media (max-width: 480px) {
    margin: 40px 10px;
    padding: 12px;
  }
`;

// Animated Page Header (slides in from left)
const PageHeaderAnimated = styled.h1`
  margin: 0;
  font-size: 2.2rem;
  color: ${(p) => p.theme.text};
  opacity: 0;
  transform: translateX(-40px);
  animation: ${slideInLeft} 0.8s ease-out forwards;
  @media (max-width: 480px) {
    font-size: 1.8rem;
  }
`;

// Animated Subheader (fades in after header)
const SubHeaderAnimated = styled.p`
  margin: 8px 0 20px;
  font-size: 1.1rem;
  color: ${(p) => p.theme.subText};
  opacity: 0;
  animation: ${fadeIn} 0.7s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;
  @media (max-width: 480px) {
    font-size: 1rem;
    text-align: center;
  }
`;

/* ── FILTER PANEL (slides down) ─────────────────────────────────────────────────── */
const FilterPanelAnimated = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
  opacity: 0;
  transform: translateY(-20px);
  animation: ${slideDownFade} 0.8s ease-out forwards;
  animation-delay: 0.3s;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FilterLabel = styled.span`
  font-size: 1rem;
  font-weight: 500;
  color: ${(p) => p.theme.text};
`;

const DateButton = styled.button`
  padding: 10px 14px;
  border: 1px solid #e68a00;
  background: #fff;
  border-radius: 4px;
  font-size: 1rem;
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
  @media (max-width: 480px) {
    padding: 8px 12px;
    font-size: 0.95rem;
  }
`;

const SelectFilter = styled.select`
  padding: 8px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  &:focus {
    outline: none;
    border-color: #7620ff;
  }
  @media (max-width: 480px) {
    font-size: 0.95rem;
    padding: 6px;
  }
`;

const ReferrerInput = styled.input`
  padding: 8px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  &:focus {
    outline: none;
    border-color: #7620ff;
  }
  @media (max-width: 480px) {
    font-size: 0.95rem;
    padding: 6px;
  }
`;

const SortButton = styled.button`
  padding: 8px 16px;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
  &:hover {
    background: #580cd2;
  }
  @media (max-width: 480px) {
    padding: 6px 12px;
    font-size: 0.95rem;
  }
`;

const ViewToggle = styled.button`
  padding: 8px 16px;
  background: #28a745;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
  &:hover {
    background: #218838;
  }
  @media (max-width: 480px) {
    padding: 6px 12px;
    font-size: 0.95rem;
  }
`;

/* ── LOADING MESSAGE ─────────────────────────────────────────────────────────────── */
const LoadingMessage = styled.p`
  text-align: center;
  font-size: 1.2rem;
  color: ${(p) => p.theme.subText};
  margin: 40px 0;
`;

/* ── CARD GRID (fade in) ───────────────────────────────────────────────────────── */
const CardGridAnimated = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
  opacity: 0;
  animation: ${fadeIn} 0.8s ease-out forwards;        /* ← fade in entire grid */
  animation-delay: ${(p) => p.delay || 0}s;
  @media (max-width: 768px) {
    gap: 16px;
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;                       /* One‑column on phone */
    gap: 12px;
    margin-top: 16px;
  }
`;

/* ── INDIVIDUAL CANDIDATE CARD (fades in) ──────────────────────────────────────── */
const CandidateCardAnimated = styled.div`
  background: ${(p) => p.theme.mainBg};
  border: 1px solid ${(p) => p.theme.border};
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  opacity: 0;
  animation: ${fadeIn} 0.6s ease-out forwards;         /* ← fade in */
  animation-delay: ${(p) => p.delay || 0}s;             /* Controlled via delay prop */
  transition: transform 0.2s ease;
  &:hover {
    transform: translateY(-4px);
  }
  @media (max-width: 480px) {
    padding: 12px;
  }
`;

// Card Header: name + ID
const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

const CandidateName = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  color: ${(p) => p.theme.text};
  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;
const StudentId = styled.span`
  font-size: 0.9rem;
  color: ${(p) => p.theme.subText};
  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

// Card Subheader: referrer + date
const CardSubHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  flex-wrap: wrap;
  gap: 8px;
`;
const SmallText = styled.span`
  font-size: 0.9rem;
  color: ${(p) => p.theme.subText};
  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

// Info Row: degree, college, etc.
const CardInfoRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;
const InfoLabel = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
  color: ${(p) => p.theme.text};
  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;
const InfoValue = styled.span`
  font-size: 0.9rem;
  color: ${(p) => p.theme.subText};
  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

// PDF Card inside each candidate card
const PDFCard = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 6px 8px;
  @media (max-width: 480px) {
    padding: 4px 6px;
  }
`;
const PDFIcon = styled.i`
  color: #d9534f;
  font-size: 18px;
  @media (max-width: 480px) {
    font-size: 16px;
  }
`;
const FileName = styled.span`
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
  word-break: break-all;
  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;
const DownloadLinkAnimated = styled.a`
  color: #28a745;
  font-size: 1rem;
  text-decoration: none;
  opacity: 0;
  animation: ${fadeIn} 0.6s ease-out forwards;         /* ← fade in */
  animation-delay: ${(p) => p.delay || 0}s;             /* Controlled via delay prop */
  &:hover {
    color: #218838;
  }
  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

// Expanded section container (fades in)
const ExpandedSectionAnimated = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${(p) => p.theme.border};
  opacity: 0;
  animation: ${fadeIn} 0.6s ease-out forwards;         /* ← fade in */
  animation-delay: ${(p) => p.delay || 0}s;             /* Controlled via delay prop */
`;

// Inline edit fields
const FieldRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
`;
const FieldLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${(p) => p.theme.text};
  width: 110px;
  @media (max-width: 480px) {
    width: 90px;
    font-size: 0.85rem;
  }
`;

const InputField = styled.input`
  padding: 6px 8px;
  font-size: 0.9rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  flex: 1;
  &:focus {
    outline: none;
    border-color: #7620ff;
  }
  @media (max-width: 480px) {
    font-size: 0.85rem;
    padding: 4px 6px;
  }
`;
const SelectField = styled.select`
  padding: 6px 8px;
  font-size: 0.9rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  flex: 1;
  &:focus {
    outline: none;
    border-color: #7620ff;
  }
  @media (max-width: 480px) {
    font-size: 0.85rem;
    padding: 4px 6px;
  }
`;

// Action buttons inside card (slide up)
const CardActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
`;
const SaveButtonAnimated = styled.button`
  padding: 6px 12px;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  opacity: 0;
  transform: translateY(20px);
  animation: ${slideUpFade} 0.6s ease-out forwards;    /* ← slide up & fade in */
  animation-delay: ${(p) => p.delay || 0}s;           /* Controlled via delay prop */
  &:hover {
    background: #580cd2;
  }
  @media (max-width: 480px) {
    flex: 1 1 100%;
    font-size: 0.85rem;
    padding: 6px;
  }
`;
const RemoveButtonAnimated = styled(SaveButtonAnimated)`
  background: #d32f2f;
  &:hover {
    background: #b71c1c;
  }
`;
const ReportButtonAnimated = styled(SaveButtonAnimated)`
  background: #007bff;
  &:hover {
    background: #0056b3;
  }
`;

/* ── TABLE VIEW STYLES (responsive) ──────────────────────────────────────────────── */
const TableWrapperAnimated = styled.div`
  margin-top: 20px;
  overflow-x: auto;
  opacity: 0;
  animation: ${fadeIn} 0.8s ease-out forwards;        /* ← fade in table wrapper */
  animation-delay: ${(p) => p.delay || 0}s;
`;
const ResponsiveTable = styled.table`
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

/* ── “NO CANDIDATE” MESSAGE (fades in if none) ─────────────────────────────────── */
const NoDataAnimated = styled.p`
  margin: 40px 0;
  text-align: center;
  font-size: 1rem;
  color: ${(p) => p.theme.subText};
  opacity: 0;
  animation: ${fadeIn} 0.6s ease-out forwards;         /* ← fade in */
  animation-delay: ${(p) => p.delay || 0}s;
  @media (max-width: 480px) {
    margin: 24px 0;
    font-size: 0.9rem;
  }
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;
const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;   

/* ── NEW: Checkbox group for multi-course selection ────────────────────────────── */ // NEW
const CourseCheckboxGroup = styled.div`                                              // NEW
  display: flex;                                                                     // NEW
  flex-wrap: wrap;                                                                   // NEW
  gap: 10px;                                                                         // NEW
`;                                                                                   // NEW
const CheckboxLabel = styled.label`                                                  // NEW
  display: flex;                                                                     // NEW
  align-items: center;                                                               // NEW
  gap: 4px;                                                                          // NEW
  font-size: 0.9rem;                                                                 // NEW
`;                                                                                   // NEW
const CheckboxInput = styled.input`                                                  // NEW
  width: 16px;                                                                       // NEW
  height: 16px;                                                                      // NEW
`;                                                                                   // NEW
// ───────────────────────────────────────────────────────────────────────────────────

/* ── NEW: Dropdown styles for Table View ─────────────────────────────────────────── */ // NEW
const DropdownWrapper = styled.div`                                                  // NEW
  position: relative;                                                                // NEW
  display: inline-block;                                                             // NEW
  width: 140px;       /* adjust as needed */                                        // NEW
`;                                                                                   // NEW

const DropdownHeader = styled.div`                                                   // NEW
  padding: 6px 8px;                                                                  // NEW
  border: 1px solid #ccc;                                                            // NEW
  border-radius: 4px;                                                                // NEW
  background: #fff;                                                                  // NEW
  font-size: 0.9rem;                                                                 // NEW
  cursor: pointer;                                                                   // NEW
  display: flex;                                                                     // NEW
  justify-content: space-between;                                                    // NEW
  align-items: center;                                                               // NEW
`;                                                                                   // NEW

const ArrowIcon = styled.span`                                                       // NEW
  margin-left: 6px;                                                                  // NEW
  font-size: 0.8rem;                                                                 // NEW
`;                                                                                   // NEW

const DropdownList = styled.div`                                                     // NEW
  position: absolute;                                                                // NEW
  top: 100%;                                                                          // NEW
  left: 0;                                                                           // NEW
  width: 100%;                                                                       // NEW
  max-height: 160px;     /* limit height */                                        // NEW
  overflow-y: auto;                                                                  // NEW
  background: #fff;                                                                  // NEW
  border: 1px solid #ccc;                                                            // NEW
  border-radius: 4px;                                                                // NEW
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);                                             // NEW
  z-index: 10;                                                                       // NEW
  padding: 8px;                                                                      // NEW
`;                                                                                   // NEW
/* ─────────────────────────────────────────────────────────────────────────────────── */

