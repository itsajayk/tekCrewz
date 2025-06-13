import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import TopNavbar from '../Nav/TopNavbar';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../Pages/firebase';
import axios from 'axios';

// Base URL for API requests
const API_BASE_URL = 'https://tekcrewz.onrender.com';
axios.defaults.baseURL = API_BASE_URL;

const AdminPanel = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileData, setProfileData] = useState({});
  const [editMode, setEditMode] = useState(false);

  // 🔧 CHANGED: make courseDocs an object whose keys are course IDs
const [courseDocs, setCourseDocs] = useState({});


  const [docType, setDocType] = useState('syllabus');
  const [assignments, setAssignments] = useState([]);
  const [results, setResults] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
// replace your existing newAssignment hook with:
const [newAssignment, setNewAssignment] = useState({
  unit: '',
  studyMaterialUrl: '',
  studyMaterialFile: null,
  closeDays: 3
});
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackUnit, setFeedbackUnit] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [unlockRequests, setUnlockRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
const [syllabusFile,   setSyllabusFile]   = useState(null);
const [scheduleFile,   setScheduleFile]   = useState(null);

  // toasts: { id, message, type: 'success' | 'error' }
  const [toasts, setToasts] = useState([]);

  // helper to push a toast
  const pushToast = (message, type='success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

  const fetchBatchStudents = async () => {
    const q = query(
      collection(db, 'users'),
      where(documentId(), '>=', 'BT'),
      where(documentId(), '<=', 'BT\uf8ff')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  useEffect(() => {
    if (!showModal) return;
    setLoading(true);
    (async () => {
      try {
        const batch = await fetchBatchStudents();
        if (['StudentDetails','ViewAttendance','ManageAssignments','UnlockRequests','ReviewFeedback'].includes(modalType)) {
          setStudents(batch);
        }
        if (modalType === 'StudentDetails') {
          const { data: cands } = await axios.get(`${API_BASE_URL}/api/candidates`);
          setStudents(batch.map(u => ({ ...u, ...(cands.find(c => c.studentId === u.id) || {}) })));
        }
        if (modalType === 'ViewAttendance') {
          // nothing else to do
        }

        if (modalType === 'CourseDocs') {
        if (!selectedCourse) {
          pushToast('Please select a course first', 'error');
        } else {
          const { data } = await axios.get(
            `${API_BASE_URL}/api/admin/course-docs/upload/${encodeURIComponent(selectedCourse)}`
          );
          // 🔧 CHANGED: store under courseDocs[selectedCourse]
          setCourseDocs(prev => ({
            ...prev,
            [selectedCourse]: {
              syllabus: data.syllabus || '',
              syllabusOriginalName: data.syllabusOriginalName || '',
              schedule: data.schedule || '',
              scheduleOriginalName: data.scheduleOriginalName || ''
            }
          }));
        }
      }
        if (modalType === 'ManageAssignments' && selectedStudent) {
          const { data } = await axios.get(`${API_BASE_URL}/api/assignments/${selectedStudent.id}`);
          setAssignments(data);
        }
        if (modalType === 'AssignmentResults') {
          const { data } = await axios.get(`${API_BASE_URL}/api/admin/assignments/results`);
          setResults(data);
        }
        if (modalType === 'ReviewFeedback') {
          const { data } = await axios.get(`${API_BASE_URL}/api/admin/feedback`);
          setFeedbackList(data);
        }
      } catch (e) {
        console.error(e);
        pushToast('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [showModal, modalType, selectedStudent, selectedCourse]);
  
      // Whenever I'm in the UnlockRequests modal and a student is selected,
      // fetch only their closed-but-not-unlocked assignments:
      useEffect(() => {
      if (!showModal || modalType !== 'UnlockRequests' || !selectedStudent) return;
      setLoading(true);
      axios.get(`${API_BASE_URL}/api/assignments/${selectedStudent.id}`)
      .then(({ data }) => {
        // Show assignments that have been unlocked (i.e. requested for unlock)
        const pending = data.filter(a => a.closed && a.unlocked);
        setUnlockRequests(pending);
      })
      .catch(e => {
        console.error(e);
        pushToast('Failed to load unlock requests', 'error');
      })
      .finally(() => setLoading(false));
  }, [showModal, modalType, selectedStudent]);

  const openModal = type => {
    setModalType(type);
    setShowModal(true);
    setEditMode(false);
    setSelectedStudent(null);
    setProfileData({});
    setAttendance([]);
    setAssignments([]);
    setResults([]);
    setFeedbackList([]);
    setUnlockRequests([]);
    setFeedbackText('');
    setFeedbackUnit('');
  };
  const closeModal = () => setShowModal(false);

  const saveProfile = async () => {
    if (!selectedStudent) { pushToast('Select a student first', 'error'); return; }
    setLoading(true);
    try {
      const { data } = await axios.put(`${API_BASE_URL}/api/candidates/${selectedStudent._id}`, profileData);
      setSelectedStudent(data);
      setStudents(students.map(s => s._id === data._id ? data : s));
      setEditMode(false);
      pushToast('Profile updated');
    } catch (e) {
      console.error(e);
      pushToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const uploadCourseDocs = async () => {
  if (!selectedCourse) {
    return pushToast('Please select a course', 'error');
  }
  if (!syllabusFile && !scheduleFile) {
    return pushToast('Please choose at least one PDF', 'error');
  }

  const form = new FormData();
  form.append('courseId', selectedCourse);
  if (syllabusFile) form.append('syllabus', syllabusFile, syllabusFile.name);
  if (scheduleFile) form.append('schedule', scheduleFile, scheduleFile.name);

  setLoading(true);
  try {
    // 🔧 CHANGED: POST to upload endpoint
    await axios.post(
      `${API_BASE_URL}/api/admin/course-docs/upload/${encodeURIComponent(selectedCourse)}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    pushToast('Course documents uploaded');

    // 🔧 CHANGED: re‐fetch so we know exactly what’s saved in the DB/cloud
    const { data: newData } = await axios.get(
      `${API_BASE_URL}/api/admin/course-docs/upload/${encodeURIComponent(selectedCourse)}`
    );
    // 🔧 CHANGED: replace only the object at courseDocs[selectedCourse]
    setCourseDocs(prev => ({
      ...prev,
      [selectedCourse]: {
        syllabus: newData.syllabus || '',
        syllabusOriginalName: syllabusFile?.name || '',
        schedule: newData.schedule || '',
        scheduleOriginalName: scheduleFile?.name || ''
      }
    }));

    // 🔧 CHANGED: clear file‐input boxes
    setSyllabusFile(null);
    setScheduleFile(null);
  } catch (err) {
    console.error(err);
    pushToast('Upload failed', 'error');
  } finally {
    setLoading(false);
  }
};



  const createAssignment = async () => {
  if (!selectedStudent) { pushToast('Select a student', 'error'); return; }
  setLoading(true);
  try {
    // build multipart form
    const form = new FormData();
    form.append('unit', newAssignment.unit);
    form.append('closeDays', newAssignment.closeDays);
    if (newAssignment.studyMaterialFile) {
      form.append('studyMaterial', newAssignment.studyMaterialFile);
    } else {
      form.append('studyMaterialUrl', newAssignment.studyMaterialUrl);
    }

    await axios.post(
      `${API_BASE_URL}/api/admin/students/${selectedStudent.id}/manageAssignments`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    // refresh list
    const { data } = await axios.get(`${API_BASE_URL}/api/assignments/${selectedStudent.id}`);
    setAssignments(data);
    pushToast('Assignment created');
    // reset form
    setNewAssignment({ unit:'', studyMaterialUrl:'', studyMaterialFile:null, closeDays:3 });
  } catch {
    pushToast('Failed to create assignment', 'error');
  } finally {
    setLoading(false);
  }
};


  const requestUnlock = async unit => {
    if (!selectedStudent) { pushToast('Select a student', 'error'); return; }
    try {
      await axios.post(`${API_BASE_URL}/api/assignments/${selectedStudent.id}/unlock`, { unit });
      pushToast('Unlock requested');
    } catch {
      pushToast('Failed to request unlock', 'error');
    }
  };

  const approveUnlock = async unit => {
    if (!selectedStudent) { pushToast('Select a student', 'error'); return; }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/students/${selectedStudent.id}/approveUnlock`, { unit });
      setUnlockRequests(u => u.filter(a => a.unit !== unit));
      pushToast('Unlock approved');
    } catch {
      pushToast('Failed to approve unlock', 'error');
    } finally {
      setLoading(false);
    }
  };

  const enterResults = async (unit, score, passed) => {
    if (!selectedStudent) { pushToast('Select a student', 'error'); return; }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/students/${selectedStudent.id}/enterResults`, { unit, results:{score,passed} });
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/assignments/results`);
      setResults(data);
      pushToast('Results saved');
    } catch {
      pushToast('Failed to save results', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!selectedStudent) { pushToast('Select a student', 'error'); return; }
    if (!feedbackUnit) { pushToast('Select a unit', 'error'); return; }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/students/${selectedStudent.id}/reviewFeedback`, { unit:feedbackUnit, feedback:feedbackText });
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/feedback`);
      setFeedbackList(data);
      setFeedbackText('');
      setFeedbackUnit('');
      pushToast('Feedback submitted');
    } catch {
      pushToast('Failed to submit feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  const modalTypes = [
    'StudentDetails','ViewAttendance','CourseDocs',
    'ManageAssignments','UnlockRequests',
    'AssignmentResults','ReviewFeedback'
  ];

  return (
    <PageWrapper>
      <TopNavbar />
      <MainContent>
        <PageTitle>Admin Panel</PageTitle>
        <MenuGrid>
          {[
            { label: 'Add Candidate', icon: '🤝', route: '/add-candidate' },
            { label: 'Candidate List', icon: '📋', route: '/candidateList' },
            { label: 'Quiz Report', icon: '📊', route: '/admin-report' },
            { label: 'Employee Dashboard', icon: '📈', route: '/EmpDashboard' },
            { label: 'Create Account', icon: '➕', route: '/signup' },
            { label: 'Student Details', icon: '👤', modal: 'StudentDetails' },
            { label: 'View Attendance', icon: '🕒', modal: 'ViewAttendance' },
            { label: 'Course Documents', icon: '📚', modal: 'CourseDocs' },
            { label: 'Manage Assignments', icon: '📝', modal: 'ManageAssignments' },
            { label: 'Unlock Requests', icon: '🔓', modal: 'UnlockRequests' },
            { label: 'Assignment Results', icon: '📈', modal: 'AssignmentResults' },
            { label: 'Review Feedback', icon: '💬', modal: 'ReviewFeedback' }
          ].map(({ label, icon, route, modal }, idx) => (
            <MenuCard key={idx} onClick={() => route ? navigate(route) : openModal(modal)}>
              <CardIcon>{icon}</CardIcon>
              <CardLabel>{label}</CardLabel>
            </MenuCard>
          ))}
        </MenuGrid>
      </MainContent>
      <Footer />

      {showModal && (
        <Overlay onClick={closeModal}>
          <Dialog onClick={e => e.stopPropagation()}>
            <Header>
              <h2>{modalType.replace(/([A-Z])/g,' $1')}</h2>
              <Close onClick={closeModal}>×</Close>
            </Header>
            <Body>
              {loading && <SpinnerOverlay><Spinner /></SpinnerOverlay>}

              {/* Student Details */}
              {modalType === 'StudentDetails' && !loading && (
                <Grid>
                  <List>
                    {students.map(s => (
                      <Item key={s.id} selected={selectedStudent?.id === s.id} onClick={() => { setSelectedStudent(s); setProfileData(s); setEditMode(false); }}>
                        {s.candidateName || s.id}
                      </Item>
                    ))}
                  </List>
                  {selectedStudent && (
                    <Detail>
                      {!editMode ? (
                        <>
                          <Row><Label>Name:</Label><Span>{selectedStudent.candidateName}</Span></Row>
                          <Row><Label>Email:</Label><Span>{selectedStudent.email}</Span></Row>
                          <Row><Label>Mobile:</Label><Span>{selectedStudent.mobile}</Span></Row>
                          <Btn onClick={() => setEditMode(true)}>Edit</Btn>
                        </>
                      ) : (
                        <>
                          <Row><Label>Name:</Label><Input value={profileData.candidateName || ''} onChange={e => setProfileData(p => ({ ...p, candidateName: e.target.value }))}/></Row>
                          <Row><Label>Email:</Label><Input value={profileData.email || ''} onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))}/></Row>
                          <Row><Label>Mobile:</Label><Input value={profileData.mobile || ''} onChange={e => setProfileData(p => ({ ...p, mobile: e.target.value }))}/></Row>
                          <Btn onClick={saveProfile}>Save</Btn>
                        </>
                      )}
                    </Detail>
                  )}
                </Grid>
              )}

              {/* View Attendance */}
              {modalType === 'ViewAttendance' && !loading && (
                <Section>
                  <Select
                    value={selectedStudent?.id || ''}
                    onChange={async e => {
                      const id = e.target.value;
                      const s = students.find(x => x.id === id) || null;
                      setSelectedStudent(s);
                      if (!s) {
                        return setAttendance([]);
                      }

                      // Firestore query to fetch attendance for that student
                      const q = query(
                        collection(db, 'attendance'),
                        where('studentId', '==', s.id)
                      );
                      const snap = await getDocs(q);
                      const recs = snap.docs.map(d => ({
                        date: d.data().date.toDate
                          ? d.data().date.toDate()
                          : new Date(d.data().date),
                        status: d.data().status
                      }));
                      recs.sort((a, b) => b.date - a.date);
                      setAttendance(recs);
                    }}
                  >
                    <option value="">Select Student</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.candidateName || s.id}
                      </option>
                    ))}
                  </Select>

                  {attendance.length > 0 && (
                    <Table>
                      <thead>
                        <tr>
                          <Th>Date</Th>
                          <Th>Status</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map(a => (
                          <tr key={a.date.toISOString()}>
                            <Td>{a.date.toLocaleDateString()}</Td>
                            <Td>{a.status}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Section>
              )}

                    {/* Course Docs */}
                    {modalType === 'CourseDocs' && !loading && (
                      <Section>
                        <Label>Select Course:</Label>
                        <Select
                          value={selectedCourse}
                          onChange={e => setSelectedCourse(e.target.value)}
                        >
                          <option value="">-- Select Course --</option>
                          <option value="Full Stack">Full Stack</option>
                          <option value="Python">Python</option>
                          <option value="SEO & Digital Marketing">SEO & Digital Marketing</option>
                          <option value="Graphic Designing">Graphic Designing</option>
                          <option value="Software Testing">Software Testing</option>
                          <option value="Business Analyst">Business Analyst</option>
                          <option value="PHP with Laravel">PHP with Laravel</option>
                          <option value="Dot Net">Dot Net</option>
                        </Select>

                        {selectedCourse && (
                          <>
                            <FileInputWrapper>
                              <Label>Syllabus PDF:</Label>
                              <File
                                type="file"
                                accept="application/pdf"
                                onChange={e => setSyllabusFile(e.target.files[0])}
                              />
                            </FileInputWrapper>

                            <FileInputWrapper>
                              <Label>Schedule PDF:</Label>
                              <File
                                type="file"
                                accept="application/pdf"
                                onChange={e => setScheduleFile(e.target.files[0])}
                              />
                            </FileInputWrapper>

                            <Btn onClick={uploadCourseDocs}>Upload Documents</Btn>

                            <List>
                              <Li>
                                Syllabus:&nbsp;
                                {courseDocs[selectedCourse]?.syllabus
                                  ? courseDocs[selectedCourse].syllabusOriginalName
                                  : 'None'}
                              </Li>
                              <Li>
                                Schedule:&nbsp;
                                {courseDocs[selectedCourse]?.schedule
                                  ? courseDocs[selectedCourse].scheduleOriginalName
                                  : 'None'}
                              </Li>
                            </List>
                          </>
                        )}
                      </Section>
                    )}


              {/* Manage Assignments */}
              {modalType === 'ManageAssignments' && !loading && (
                      <Section>
                        <Select
                          value={selectedStudent?.id || ''}
                          onChange={e => setSelectedStudent(students.find(x => x.id===e.target.value) || null)}
                        >
                          <option value="">Select Student</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.candidateName || s.id}
                            </option>
                          ))}
                        </Select>

                        {selectedStudent && (
                          <>
                            <Input
                              placeholder="Unit"
                              value={newAssignment.unit}
                              onChange={e => setNewAssignment(p => ({ ...p, unit: e.target.value }))}
                            />

                            {/* PDF upload */}
                            <FileInputWrapper>
                              <Label>Study Material (PDF only)</Label>
                              <File
                                type="file"
                                accept="application/pdf"
                                onChange={e => {
                                  const file = e.target.files[0];
                                  setNewAssignment(p => ({
                                    ...p,
                                    studyMaterialFile: file,
                                    studyMaterialUrl: file ? file.name : ''
                                  }));
                                }}
                              />
                            </FileInputWrapper>
                            {newAssignment.studyMaterialFile && (
                              <PDFPreview>
                                📄 {newAssignment.studyMaterialFile.name}
                                <RemoveIcon
                                  onClick={() => setNewAssignment(p => ({
                                    ...p,
                                    studyMaterialFile: null,
                                    studyMaterialUrl: ''
                                  }))}
                                >
                                  ×
                                </RemoveIcon>
                              </PDFPreview>
                            )}

                            <Input
                              placeholder="Close after days"
                              type="number"
                              value={newAssignment.closeDays}
                              onChange={e => setNewAssignment(p => ({ ...p, closeDays: e.target.value }))}
                            />

                            <Btn onClick={createAssignment}>Create</Btn>

                            <AssignList>
                              {assignments.map(a => (
                                <AssignItem key={a.unit}>
                                  <strong>{a.unit}</strong> – {a.closed ? 'Closed' : 'Open'}
                                </AssignItem>
                              ))}
                            </AssignList>
                          </>
                        )}
                      </Section>
                    )}

                    {/* Unlock Requests */}
                {modalType === 'UnlockRequests' && !loading && (
                <Section>
                  <Select
                    value={selectedStudent?.id || ''}
                    onChange={e => setSelectedStudent(
                      students.find(x => x.id === e.target.value) || null
                    )}
                  >
                    <option value="">Select Student</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.candidateName || s.id}
                      </option>
                    ))}
                  </Select>

                  {unlockRequests.length === 0 ? (
                    <p>No pending unlocks.</p>
                  ) : (
                    unlockRequests.map(a => (
                      <AssignItem key={a.unit}>
                        {a.unit}
                        <ActionBtn onClick={() => approveUnlock(a.unit)}>
                          Approve Unlock
                        </ActionBtn>
                      </AssignItem>
                    ))
                  )}
                </Section>
              )}


              {/* Assignment Results */}
              {modalType === 'AssignmentResults' && !loading && (
                <Section>
                  {results.length === 0 ? (
                    <p>No assignment results have been entered yet.</p>
                  ) : (
                    <ResultsTable>
                      <thead>
                        <tr>
                          <Th>Student</Th>
                          <Th>Unit</Th>
                          <Th>Score</Th>
                          <Th>Passed</Th>
                          <Th>Action</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map(r => {
                          // find the candidateName from your students cache (if you fetched it)
                          const student = students.find(s => s.id === r.studentId);
                          const name    = student?.candidateName || r.studentId;
                          return (
                            <tr key={`${r.studentId}-${r.unit}`}>
                              <Td>{name}</Td>
                              <Td>{r.unit}</Td>
                              <Td>
                                <Input
                                  type="number"
                                  defaultValue={r.results.score}
                                  onBlur={e =>
                                    enterResults(r.unit, e.target.value, r.results.passed)
                                  }
                                />
                              </Td>
                              <Td>
                                <select
                                  defaultValue={r.results.passed ? 'true' : 'false'}
                                  onChange={e =>
                                    enterResults(
                                      r.unit,
                                      r.results.score,
                                      e.target.value === 'true'
                                    )
                                  }
                                >
                                  <option value="true">Yes</option>
                                  <option value="false">No</option>
                                </select>
                              </Td>
                              <Td>
                                <ActionBtn
                                  onClick={() =>
                                    enterResults(r.unit, r.results.score, r.results.passed)
                                  }
                                >
                                  Save
                                </ActionBtn>
                              </Td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </ResultsTable>
                  )}
                </Section>
              )}


              {/* Review Feedback */}
              {modalType==='ReviewFeedback' && !loading && (
                <Section>
                  <Select value={selectedStudent?.id||''} onChange={e=>setSelectedStudent(students.find(x=>x.id===e.target.value))}>
                    <option value="">Select Student</option>
                    {students.map(s=><option key={s.id} value={s.id}>{s.candidateName||s.id}</option>)}
                  </Select>
                  {selectedStudent && (
                    <>
                      <Select value={feedbackUnit} onChange={e => setFeedbackUnit(e.target.value)}>
                        <option value="">Select Unit</option>
                        {assignments.map(a=><option key={a.unit} value={a.unit}>{a.unit}</option>)}
                      </Select>
                      <Textarea placeholder="Feedback..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
                      <Btn onClick={submitFeedback}>Submit</Btn>
                    </>
                  )}
                  <FeedbackList>{feedbackList.map(f=><FeedbackItem key={f._id}>{f.studentId} ({f.unit}): {f.feedback}</FeedbackItem>)}</FeedbackList>
                </Section>
              )}


            </Body>
          </Dialog>
        </Overlay>
      )}

      {/* Toast Container */}
      <ToastContainer>
        {toasts.map(t=>(
          <Toast key={t.id} type={t.type}>
            {t.message}
            <CloseToast onClick={()=>setToasts(ts=>ts.filter(x=>x.id!==t.id))}>✕</CloseToast>
          </Toast>
        ))}
      </ToastContainer>
    </PageWrapper>
  );
};

export default AdminPanel;

/* Styled Components */
const ToastContainer = styled.div`
  position: fixed;
  top: 16px; right: 16px;
  display: flex; flex-direction: column; gap: 8px;
  z-index: 1000;
`;
const Toast = styled.div`
  background: ${p=>p.type==='error'? '#f56260':'#60d394'};
  color: white;
  padding: 12px 16px;
  border-radius: 4px;
  font-weight: 500;
  display: flex; align-items: center; justify-content: space-between;
`;
const CloseToast = styled.span`
  cursor: pointer;
  margin-left: 12px;
  font-size: 14px;
`;
const kf = keyframes`
  0%{background-position:0 50%}
  50%{background-position:100% 50%}
  100%{background-position:0 50%}
`;

const gradientBG = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
const Overlay = styled.div`position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;padding:16px;`;
const Dialog = styled.div`background:#fff;border-radius:12px;max-width:90%;width:600px;max-height:90%;overflow:auto;`;
const Header = styled.div`display:flex;justify-content:space-between;align-items:center;padding:16px;border-bottom:1px solid #eee;`;
const Close = styled.button`background:none;border:none;font-size:1.5rem;cursor:pointer;`;
const Body = styled.div`padding:16px;position:relative;`;
const SpinnerOverlay = styled.div`position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.8);display:flex;justify-content:center;align-items:center;`;
const spin = keyframes`0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}`;
const Spinner = styled.div`border:4px solid #f3f3f3;border-top:4px solid #7620ff;border-radius:50%;width:40px;height:40px;animation:${spin} 1s linear infinite;`;

const PageWrapper = styled.section`display:flex;flex-direction:column;min-height:100vh;background:linear-gradient(270deg,#f7f7f7,#eaeaea,#f7f7f7);background-size:600% 600%;animation:${gradientBG} 15s ease infinite;`;
const MainContent = styled.div`flex:1;display:flex;flex-direction:column;align-items:center;padding:80px 20px;`;
const PageTitle = styled.h1`font-size:clamp(1.5rem,4vw,2.5rem);font-weight:800;margin-bottom:24px;background:linear-gradient(90deg,#7620ff,#ff9900);-webkit-background-clip:text;color:transparent;text-align:center;`;
const MenuGrid = styled.div`display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:16px;width:100%;max-width:1200px;`;
const MenuCard = styled.div`background:#fff;border-radius:16px;padding:16px;display:flex;flex-direction:column;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,0.1);cursor:pointer;transition:transform .2s;&:hover{transform:translateY(-4px);}`;
const CardIcon = styled.div`font-size:2rem;margin-bottom:8px;`;
const CardLabel = styled.div`font-weight:600;text-align:center;`;

const List = styled.ul`list-style:none;padding:0;margin:0;max-height:200px;overflow-y:auto;`;
const Item = styled.li`padding:8px;border-bottom:1px solid #ddd;background:${p=>p.selected?'#e6f7ff':'transparent'};cursor:pointer;&:hover{background:#f0f0f0;}`;
const Grid = styled.div`display:grid;grid-template-columns:1fr 2fr;gap:16px;@media(max-width:768px){grid-template-columns:1fr;}`;
const Detail = styled.div`display:flex;flex-direction:column;`;
const Row = styled.div`display:flex;justify-content:space-between;margin-bottom:8px;`;
const Label = styled.label`font-weight:600;`;
const Span = styled.span``;

const Section = styled.div`display:flex;flex-direction:column;gap:12px;`;
const Select = styled.select`padding:8px;border-radius:8px;border:1px solid #ccc;width:100%;max-width:300px;`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
  `;
  const ResultsTable = styled(Table)`
  `;

const Th = styled.th`padding:8px;border:1px solid #ddd;text-align:left;`;
const Td = styled.td`padding:8px;border:1px solid #ddd;`;

const File = styled.input`padding:4px;`;
const Input = styled.input`padding:8px;margin-bottom:12px;border:1px solid #ccc;border-radius:6px;width:100%;max-width:300px;`;
const Textarea = styled.textarea`width:100%;height:80px;padding:8px;border:1px solid #ccc;border-radius:6px;`;
const Btn = styled.button`padding:8px 16px;background:#4caf50;color:#fff;border:none;border-radius:8px;cursor:pointer;align-self:flex-start;&:hover{background:#45a047;}`;
const ActionBtn = styled(Btn)`margin-left:8px;background:#2196f3;&:hover{background:#1976d2;}`;
const AssignList = styled.ul`list-style:none;padding:0;`;
const AssignItem = styled.li`padding:8px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between;`;
const FeedbackList = styled.ul`list-style:none;padding:0;`;
const FeedbackItem = styled.li`padding:8px;border-bottom:1px solid #ddd;`;
const Li=styled.li`padding:4px 0;`;
const FileInputWrapper = styled.div`
  margin-bottom: 12px;
`;

const PDFPreview = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 12px;
`;
const RemoveIcon = styled.span`
  cursor: pointer;
  margin-left: 8px;
  font-weight: bold;
`;

