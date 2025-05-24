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
  const [courseDocs, setCourseDocs] = useState({ syllabus: '', schedule: '' });
  const [docType, setDocType] = useState('syllabus');
  const [assignments, setAssignments] = useState([]);
  const [results, setResults] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [newAssignment, setNewAssignment] = useState({ unit: '', studyMaterialUrl: '', closeDays: 3 });
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackUnit, setFeedbackUnit] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [unlockRequests, setUnlockRequests] = useState([]);
  const [loading, setLoading] = useState(false);

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
          const { data: cands } = await axios.get('/api/candidates');
          setStudents(batch.map(u => ({ ...u, ...(cands.find(c => c.studentId === u.id) || {}) })));        
        }
        if (modalType === 'ViewAttendance') {
          // student list loaded above
        }
        if (modalType === 'CourseDocs') {
          const { data } = await axios.get('/api/courses/COURSE1/docs');
          setCourseDocs(data);
        }
        if (modalType === 'ManageAssignments' && selectedStudent) {
          const { data } = await axios.get(`/api/assignments/${selectedStudent.id}`);
          setAssignments(data);
        }
        if (modalType === 'AssignmentResults') {
          const { data } = await axios.get('/api/admin/assignments/results');
          setResults(data);
        }
        if (modalType === 'ReviewFeedback') {
          const { data } = await axios.get('/api/admin/feedback');
          setFeedbackList(data);
        }
        if (modalType === 'UnlockRequests' && selectedStudent) {
          const { data } = await axios.get(`/api/assignments/${selectedStudent.id}`);
          setUnlockRequests(data.filter(a => a.closed && !a.unlocked));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
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
    setFeedbackUnit('');
    setFeedbackText('');
  };
  const closeModal = () => setShowModal(false);

  const saveProfile = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const { data } = await axios.put(`/api/candidates/${selectedStudent._id}`, profileData);
      setSelectedStudent(data);
      setStudents(students.map(s => s._id === data._id ? data : s));
      setEditMode(false);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const uploadDocs = async e => {
    const form = new FormData();
    if (e.target.files[0]) form.append('syllabus', e.target.files[0]);
    if (e.target.files[1]) form.append('schedule', e.target.files[1]);
    setLoading(true);
    try {
      const { data } = await axios.post('/api/admin/course-docs/upload', form);
      setCourseDocs(data);
      alert('Upload success');
    } catch {
      alert('Upload failed');
    } finally { setLoading(false); }
  };

  const createAssignment = async () => {
    if (!selectedStudent) return alert('Select student');
    setLoading(true);
    try {
      await axios.post(
        `/api/admin/students/${selectedStudent.id}/manageAssignments`,
        newAssignment
      );
      const { data } = await axios.get(`/api/assignments/${selectedStudent.id}`);
      setAssignments(data);
      alert('Assignment created');
    } catch {
      alert('Failed');
    } finally { setLoading(false); }
  };

  const requestUnlock = async unit => {
    if (!selectedStudent) return;
    await axios.post(`/api/assignments/${selectedStudent.id}/unlock`, { unit });
    alert('Unlock requested');
  };

  const approveUnlock = async unit => {
    if (!selectedStudent) return;
    await axios.post(`/api/admin/students/${selectedStudent.id}/approveUnlock`, { unit });
    alert('Unlock approved');
    setUnlockRequests(unlockRequests.filter(a => a.unit !== unit));
  };

  const enterResults = async (unit, score, passed) => {
    await axios.post(`/api/admin/students/${selectedStudent.id}/enterResults`, { unit, results: { score, passed } });
    alert('Results entered');
    const { data } = await axios.get('/api/admin/assignments/results'); setResults(data);
  };

  const submitFeedback = async () => {
    if (!selectedStudent || !feedbackUnit) return alert('Select unit');
    setLoading(true);
    try {
      await axios.post(`/api/admin/students/${selectedStudent.id}/reviewFeedback`, { unit: feedbackUnit, feedback: feedbackText });
      const { data } = await axios.get('/api/admin/feedback'); setFeedbackList(data);
      setFeedbackText(''); setFeedbackUnit('');
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const modalTypes = ['StudentDetails','ViewAttendance','CourseDocs','ManageAssignments','UnlockRequests','AssignmentResults','ReviewFeedback'];

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
                  <Select value={selectedStudent?.id || ''} onChange={e => {
                    const s = students.find(x => x.id === e.target.value);
                    setSelectedStudent(s);
                    if (s) axios.get(`/api/students/${s.id}/attendance`).then(r => setAttendance(r.data));
                  }}>
                    <option value="">Select Student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.candidateName || s.id}</option>)}
                  </Select>
                  {attendance.length > 0 && (
                    <Table>
                      <thead><tr><Th>Date</Th><Th>Status</Th></tr></thead>
                      <tbody>{attendance.map(a => <tr key={a.date}><Td>{new Date(a.date).toLocaleDateString()}</Td><Td>{a.status}</Td></tr>)}</tbody>
                    </Table>
                  )}
                  {selectedStudent && <Btn onClick={() => window.location.href = `mailto:admin@example.com?subject=Attendance Change Request for ${selectedStudent.id}&body=Please update my attendance.`}>Request Change</Btn>}
                </Section>
              )}

              {/* Course Docs */}
              {modalType === 'CourseDocs' && !loading && (
                <Section>
                  <Select value={docType} onChange={e => setDocType(e.target.value)}><option value="syllabus">Syllabus</option><option value="schedule">Schedule</option></Select>
                  <List>
                    <Li>Syllabus: {courseDocs.syllabus ? <a href={courseDocs.syllabus} target="_blank">{courseDocs.syllabus.split('/').pop()}</a> : 'None'}</Li>
                    <Li>Schedule: {courseDocs.schedule ? <a href={courseDocs.schedule} target="_blank">{courseDocs.schedule.split('/').pop()}</a> : 'None'}</Li>
                  </List>
                  <File type="file" accept="application/pdf" multiple onChange={uploadDocs}/>
                </Section>
              )}

              {/* Manage Assignments */}
              {modalType === 'ManageAssignments' && !loading && (
                <Section>
                  <Select value={selectedStudent?.id || ''} onChange={e => setSelectedStudent(students.find(x => x.id===e.target.value) || null)}>
                    <option value="">Select Student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.candidateName||s.id}</option>)}
                  </Select>
                  {selectedStudent && (
                    <>
                      <Input placeholder="Unit" value={newAssignment.unit} onChange={e => setNewAssignment(p => ({ ...p, unit: e.target.value }))} />
                      <Input placeholder="Study Material URL" value={newAssignment.studyMaterialUrl} onChange={e => setNewAssignment(p => ({ ...p, studyMaterialUrl: e.target.value }))} />
                      <Input placeholder="Close after days" type="number" value={newAssignment.closeDays} onChange={e => setNewAssignment(p => ({ ...p, closeDays: e.target.value }))} />
                      <Btn onClick={createAssignment}>Create</Btn>
                      <AssignList>
                        {assignments.map(a => (
                          <AssignItem key={a.unit}>
                            <strong>{a.unit}</strong> - {a.closed ? 'Closed' : 'Open'} {' '}
                            <ActionBtn onClick={() => window.open(`/student/quiz/${a.unit}`, '_blank')}>Preview Quiz</ActionBtn>
                            {a.closed && !a.unlocked && <ActionBtn onClick={() => requestUnlock(a.unit)}>Student Request Unlock</ActionBtn>}
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
                  <Select value={selectedStudent?.id||''} onChange={e => setSelectedStudent(students.find(x=>x.id===e.target.value)||null)}>
                    <option value="">Select Student</option>
                    {students.map(s=><option key={s.id} value={s.id}>{s.candidateName||s.id}</option>)}
                  </Select>
                  {unlockRequests.map(a=>(
                    <AssignItem key={a.unit}>
                      {a.unit} <ActionBtn onClick={() => approveUnlock(a.unit)}>Approve Unlock</ActionBtn>
                    </AssignItem>
                  ))}
                </Section>
              )}

              {/* Assignment Results */}
              {modalType==='AssignmentResults' && !loading && (
                <ResultsTable>
                  <thead><tr><Th>Student</Th><Th>Unit</Th><Th>Score</Th><Th>Passed</Th><Th>Action</Th></tr></thead>
                  <tbody>{results.map(r=><tr key={r._id}>
                    <Td>{r.studentName}</Td>
                    <Td>{r.unit}</Td>
                    <Td><Input type="number" defaultValue={r.results.score} onBlur={e => enterResults(r.unit, e.target.value, r.results.passed)} /></Td>
                    <Td>
                      <select defaultValue={r.results.passed ? 'true':'false'} onChange={e => enterResults(r.unit, r.results.score, e.target.value==='true')}>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </Td>
                    <Td><ActionBtn onClick={() => enterResults(r.unit, r.results.score, r.results.passed)}>Save</ActionBtn></Td>
                  </tr>)}
                  </tbody>
                </ResultsTable>
              )}

              {/* Review Feedback */}
              {modalType==='ReviewFeedback' && !loading && (
                <Section>
                  <Select value={selectedStudent?.id||''} onChange={e=>{
                    const s=students.find(x=>x.id===e.target.value);
                    setSelectedStudent(s);
                  }}>
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
                  <FeedbackList>
                    {feedbackList.map(f=><FeedbackItem key={f._id}>{f.studentId} ({f.unit}): {f.feedback}</FeedbackItem>)}
                  </FeedbackList>
                </Section>
              )}

            </Body>
          </Dialog>
        </Overlay>
      )}
    </PageWrapper>
  );
};

export default AdminPanel;

/* Styled Components */
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
const Table = styled.table`width:100%;border-collapse:collapse;`;
const ResultsTable = `styled(Table);`;
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

