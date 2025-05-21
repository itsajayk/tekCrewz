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
  const [newAssignment, setNewAssignment] = useState({ unit: '', studyMaterialUrl: '' });
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);

  // fetch BT batch students
  const fetchBatchStudents = async () => {
    const q = query(
      collection(db, 'users'),
      where(documentId(), '>=', 'BT'),
      where(documentId(), '<=', 'BT\uf8ff')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  // load modal data
  useEffect(() => {
    if (!showModal) return;
    setLoading(true);
    (async () => {
      try {
        if (modalType === 'StudentDetails') {
          const batch = await fetchBatchStudents();
          const { data: cands } = await axios.get('/api/candidates');
          const merged = batch.map(u => {
            const cand = cands.find(c => c.studentId === u.id) || {};
            return { ...u, ...cand };
          });
          setStudents(merged);
        }
        if (modalType === 'CourseDocs') {
          const { data } = await axios.get('/api/courses/COURSE1/docs');
          setCourseDocs(data);
        }
        if (modalType === 'ManageAssignments') {
          const batch = await fetchBatchStudents(); setStudents(batch);
          if (selectedStudent) {
            const { data } = await axios.get(`/api/assignments/${selectedStudent.id}`);
            setAssignments(data);
          }
        }
        if (modalType === 'AssignmentResults') {
          const { data } = await axios.get('/api/admin/assignments/results');
          setResults(data);
        }
        if (modalType === 'ReviewFeedback') {
          const batch = await fetchBatchStudents(); setStudents(batch);
          const { data } = await axios.get('/api/admin/feedback');
          setFeedbackList(data);
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
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setEditMode(false);
    setAssignments([]);
    setResults([]);
    setFeedbackList([]);
  };

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
    } finally {
      setLoading(false);
    }
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
    if (!newAssignment.closeDays) return alert('Please enter number of days to close');
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

  const submitFeedback = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      await axios.post('/api/admin/feedback', { studentId: selectedStudent.id, feedback: feedbackText });
      const { data } = await axios.get('/api/admin/feedback'); setFeedbackList(data);
    } catch { } finally { setLoading(false); }
  };

  // mapping for modals
  const modalTypes = ['StudentDetails','CourseDocs','ManageAssignments','AssignmentResults','ReviewFeedback'];
  const routes = ['/add-candidate','/candidateList','/admin-report','/EmpDashboard','/signup'];

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
    { label: 'Course Documents', icon: '📚', modal: 'CourseDocs' },
    { label: 'Manage Assignments', icon: '📝', modal: 'ManageAssignments' },
    { label: 'Assignment Results', icon: '📈', modal: 'AssignmentResults' },
    { label: 'Review Feedback', icon: '💬', modal: 'ReviewFeedback' }
  ].map(({ label, icon, route, modal }, idx) => (
    <MenuCard key={idx} onClick={() => {
      if (route) navigate(route);
      else if (modal) openModal(modal);
    }}>
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
            <Header><h2>{modalType.replace(/([A-Z])/g,' $1')}</h2><Close onClick={closeModal}>×</Close></Header>
            <Body>
              {loading && <SpinnerOverlay>
              <Spinner />
            </SpinnerOverlay>}

              {modalType === 'StudentDetails' && !loading && (
                <Grid>
                  <List>
                    {students.map(s => (
                      <Item key={s.id} selected={selectedStudent?.id===s.id} onClick={() => { setSelectedStudent(s); setProfileData(s); setEditMode(false); }}>
                        {s.candidateName||s.id}
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
                          <Btn onClick={()=>setEditMode(true)}>Edit</Btn>
                        </>
                      ) : (
                        <>
                          <Row><Label>Name:</Label><Input value={profileData.candidateName||''} onChange={e=>setProfileData(p=>({...p,candidateName:e.target.value}))}/></Row>
                          <Row><Label>Email:</Label><Input value={profileData.email||''} onChange={e=>setProfileData(p=>({...p,email:e.target.value}))}/></Row>
                          <Row><Label>Mobile:</Label><Input value={profileData.mobile||''} onChange={e=>setProfileData(p=>({...p,mobile:e.target.value}))}/></Row>
                          <Btn onClick={saveProfile}>Save</Btn>
                        </>
                      )}
                    </Detail>
                  )}
                </Grid>
              )}

              {modalType==='CourseDocs' && !loading && (
                <Section>
                  <Select value={docType} onChange={e=>setDocType(e.target.value)}><option value="syllabus">Syllabus</option><option value="schedule">Schedule</option></Select>
                  <List>
                    <Li>Syllabus: {courseDocs.syllabus? <a href={courseDocs.syllabus} target="_blank">{courseDocs.syllabus.split('/').pop()}</a>: 'None'}</Li>
                    <Li>Schedule: {courseDocs.schedule? <a href={courseDocs.schedule} target="_blank">{courseDocs.schedule.split('/').pop()}</a>: 'None'}</Li>
                  </List>
                  <File type="file" accept="application/pdf" multiple onChange={uploadDocs}/>
                </Section>
              )}

              {modalType==='ManageAssignments' && !loading && (
                <Section>
                  <Select
                    value={selectedStudent?.id||''}
                    onChange={e=>setSelectedStudent(students.find(s=>s.id===e.target.value)||null)}
                  >
                    <option value="">Select Student</option>
                    {students.map(s=><option key={s.id} value={s.id}>{s.candidateName||s.id}</option>)}
                  </Select>
                  {selectedStudent && <>
                    <Input
                      placeholder="Unit"
                      value={newAssignment.unit}
                      onChange={e=>setNewAssignment(p=>({...p,unit:e.target.value}))}
                    />
                    <Input
                      placeholder="URL"
                      value={newAssignment.studyMaterialUrl}
                      onChange={e=>setNewAssignment(p=>({...p,studyMaterialUrl:e.target.value}))}
                    />
                    <Input
                      placeholder="Close after days"
                      type="number"
                      value={newAssignment.closeDays}
                      onChange={e=>setNewAssignment(p=>({...p,closeDays:e.target.value}))}
                    />
                    <Btn onClick={createAssignment}>Create</Btn>
                    <List>{assignments.map(a=><Li key={a.unit}>{a.unit}</Li>)}</List>
                  </>}
                </Section>
              )}


              {modalType==='AssignmentResults' && !loading && (
                <Table>
                  <thead><tr><Th>Student</Th><Th>Unit</Th><Th>Score</Th></tr></thead>
                  <tbody>{results.map(r=><tr key={r._id}><Td>{r.studentName}</Td><Td>{r.unit}</Td><Td>{r.results?.score}</Td></tr>)}</tbody>
                </Table>
              )}

              {modalType==='ReviewFeedback' && !loading && (
                <>
                  <List>{students.map(s=><Li key={s.id} onClick={()=>{ setSelectedStudent(s); }} >{s.candidateName||s.id}</Li>)}</List>
                  {selectedStudent && <>
                    <Textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)}/>
                    <Btn onClick={submitFeedback}>Submit</Btn>
                  </>}
                  <List>{feedbackList.map(f=><Li key={f._id}>{f.studentId}: {f.feedback}</Li>)}</List>
                </>
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

const Overlay=styled.div`position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;padding:16px;`;
const Dialog=styled.div`background:#fff;border-radius:12px;max-width:90%;width:600px;max-height:90%;overflow:auto;`;
const Header=styled.div`display:flex;justify-content:space-between;align-items:center;padding:16px;border-bottom:1px solid #eee;`;
const Li=styled.li`padding:4px 0;`;
const Table=styled.table`width:100%;border-collapse:collapse;`;
const Th=styled.th`padding:8px;border:1px solid #ddd;text-align:left;`;
const Td=styled.td`padding:8px;border:1px solid #ddd;`;
const Textarea=styled.textarea`width:100%;height:80px;padding:8px;border:1px solid #ccc;border-radius:6px;`;
const Section=styled.div`display:flex;flex-direction:column;gap:12px;`;
const Btn=styled.button`padding:8px 16px;background:#4caf50;color:#fff;border:none;border-radius:8px;cursor:pointer;margin-top:8px;&:hover{background:#45a047;}`;
const File=styled.input`padding:4px;`;
const Row=styled.div`display:flex;justify-content:space-between;margin-bottom:8px;`;
const Label=styled.label`font-weight:600;`;
const Span=styled.span``;
const Close=styled.button`background:none;border:none;font-size:1.5rem;cursor:pointer;`;
const Body=styled.div`padding:16px;position:relative;`;
const Grid=styled.div`display:grid;grid-template-columns:1fr 2fr;gap:16px;@media(max-width:768px){grid-template-columns:1fr;}`;
const Item=styled.li`padding:8px;border-bottom:1px solid #ddd;background:${p=>p.selected?'#e6f7ff':'transparent'};cursor:pointer;&:hover{background:#f0f0f0;}`;
const Detail=styled.div`display:flex;flex-direction:column;`;
const Loading=styled.div`position:absolute;inset:0;display:flex;justify-content:center;align-items:center;background:rgba(255,255,255,0.7);font-size:1.2rem;`;

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
  padding: 80px 20px;
`;

const PageTitle = styled.h1`
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 800;
  margin-bottom: 24px;
  background: linear-gradient(90deg, #7620ff, #ff9900);
  -webkit-background-clip: text;
  color: transparent;
  text-align: center;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 80px;
  overflow-y: auto;
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 1200px;
`;

const MenuCard = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s;
  &:hover { transform: translateY(-4px); }
`;

const CardIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 8px;
`;

const CardLabel = styled.div`
  font-weight: 600;
  text-align: center;
`;

// Modal Styles
const ModalOverlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; justify-content: center; align-items: center;
  padding: 16px;
`;

const ModalContent = styled.div`
  background: #fff;
  border-radius: 12px;
  width: 100%; max-width: 900px;
  max-height: 90%; overflow-y: auto;
  display: flex; flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px; border-bottom: 1px solid #eee;
`;

const CloseButton = styled.button`
  background: none; border: none; font-size: 1.5rem; cursor: pointer;
`;

const ModalBody = styled.div`
  padding: 16px;
`;

const SpinnerOverlay = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #7620ff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: ${spin} 1s linear infinite;
`;

const ModalGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
  @media(max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StudentList = styled.ul`
  list-style: none; margin: 0; padding: 0; max-height: 300px; overflow-y: auto;
`;

const StudentItem = styled.li`
  padding: 8px; border-bottom: 1px solid #ddd; cursor: pointer;
  &:hover { background: #f9f9f9; }
`;

const DetailSection = styled.div`
  display: flex; flex-direction: column;
`;

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
  @media(max-width: 600px) { grid-template-columns: 1fr; }
`;

const Field = styled.div`
  display: flex; flex-direction: column;
`;

const Button = styled.button`
  align-self: flex-start;
  padding: 8px 16px;
  border: none; border-radius: 8px;
  background: #4caf50; color: #fff; cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #45a047; }
`;

const StudentSelect = styled.select`
  padding: 8px;
  margin-bottom: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  width: 100%;
`;

const Input = styled.input`
  padding: 8px;
  margin-bottom: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  width: 100%;
`;

const ActionBtn = styled.button`
  padding: 8px 16px;
  margin-bottom: 12px;
  background: #4caf50;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover { background: #45a047; }
`;

const CloseBtn = styled.button`
  display: block;
  margin-top: 16px;
  padding: 8px 16px;
  background: #f44336;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  &:hover { background: #e53935; }
`;

const Modal = styled.div`
  position: fixed;
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: #fff;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  max-width: 90%;
  width: 400px;
  max-height: 90%;
  overflow-y: auto;
`;

const DocSection = styled.div`
  display: flex; flex-direction: column; gap: 12px;
`;

const Select = styled.select`
  padding: 8px; border-radius: 8px; border: 1px solid #ccc;
`;

const DocLink = styled.a`
  font-weight: 600; text-decoration: underline;
`;

const FileInput = styled.input``;

const FormSection = styled.div`
  display: flex; flex-direction: column; gap: 12px;
`;

const AssignList = styled.ul`
  list-style: none; padding: 0;
`;

const AssignItem = styled.li`
  padding: 8px; border-bottom: 1px solid #eee;
`;

const ResultsTable = styled.table`
  width: 100%; border-collapse: collapse;
  th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
`;

const FeedbackSection = styled.div`
  margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px;
`;

const FeedbackList = styled.ul`
  list-style: none; padding: 0;
`;

const FeedbackItem = styled.li`
  padding: 8px; border-bottom: 1px solid #ddd;
`;
