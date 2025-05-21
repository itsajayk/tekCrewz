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
  const [userOptions, setUserOptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [courseDocs, setCourseDocs] = useState({ syllabus: '', schedule: '' });
  const [docType, setDocType] = useState('syllabus');
  const [assignments, setAssignments] = useState([]);
  const [results, setResults] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [newAssignment, setNewAssignment] = useState({ unit: '', studyMaterialUrl: '' });
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({});

  // fetch referrers
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where(documentId(), '>=', 'REFSD'),
          where(documentId(), '<', 'REFSE')
        );
        const snapshot = await getDocs(q);
        const refs = snapshot.docs.map(doc => ({ id: doc.id, label: doc.data().referrerName || doc.id }));
        setUserOptions([{ id: 'admin', label: 'Admin' }, ...refs]);
      } catch (err) { console.error(err); }
    };
    fetchUsers();
  }, []);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const { data } = await axios.put(`/api/candidates/${selectedStudent._id}`, profileData);
      setStudents(prev => prev.map(s => s._id === data._id ? data : s));
      setSelectedStudent(data);
      setEditMode(false);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // load modal data
  useEffect(() => {
    if (!showModal) return;
    setLoading(true);
    const loadData = async () => {
      try {
        if (modalType === 'StudentDetails') {
          const snap = await getDocs(collection(db, 'users'));
          const creds = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          const { data: cands } = await axios.get('/api/candidates');
          setStudents(creds.map(c => ({ ...c, ...cands.find(x => x.studentId === c.id) })));   
        }
        if (modalType === 'CourseDocs') {
          const { data } = await axios.get('/api/courses/COURSE1/docs');
          setCourseDocs(data);
        }
        if (modalType === 'ManageAssignments') {
          const { data } = await axios.get('/api/admin/assignments');
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
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadData();
  }, [showModal, modalType]);

  const openModal = type => { setModalType(type); setShowModal(true); setEditMode(false); };
  const closeModal = () => { setShowModal(false); setSelectedStudent(null); setEditMode(false); };
  const selectStudent = s => { setSelectedStudent(s); setProfileData(s); setEditMode(false); };

  const createAssignment = async () => {
    setLoading(true);
    try {
      await axios.post('/api/admin/assignments', newAssignment);
      const { data } = await axios.get('/api/admin/assignments');
      setAssignments(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const submitFeedback = async () => {
    setLoading(true);
    try {
      await axios.post('/api/admin/feedback', { studentId: selectedStudent.id, feedback: feedbackText });
      const { data } = await axios.get('/api/admin/feedback');
      setFeedbackList(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const uploadDocs = async e => {
    const form = new FormData();
    if (e.target.files[0]) form.append('syllabus', e.target.files[0]);
    if (e.target.files[1]) form.append('schedule', e.target.files[1]);
    setLoading(true);
    try {
      const { data } = await axios.post('/api/admin/course-docs/upload', form);
      setCourseDocs(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
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
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={e=>e.stopPropagation()}>
            <ModalHeader>
              <h2>{modalType.replace(/([A-Z])/g,' $1').trim()}</h2>
              <CloseButton onClick={closeModal}>&times;</CloseButton>
            </ModalHeader>
            <ModalBody>
              {loading ? 
              <SpinnerOverlay>
                <Spinner/>
              </SpinnerOverlay>
                : (
                <> 
                  {modalType==='StudentDetails' && (
                    <ModalGrid>
                      <StudentList>
                        {students.map(s=>(
                          <StudentItem key={s._id} onClick={()=>selectStudent(s)}>
                            {s.candidateName}
                          </StudentItem>
                        ))}
                      </StudentList>
                      {selectedStudent && (
                        <DetailSection>
                          {!editMode ? (
                            <>
                              <ProfileGrid>
                                <Field><strong>Name:</strong> {selectedStudent.candidateName}</Field>
                                <Field><strong>Email:</strong> {selectedStudent.email}</Field>
                                <Field><strong>Mobile:</strong> {selectedStudent.mobile}</Field>
                              </ProfileGrid>
                              <Button onClick={()=>setEditMode(true)}>Edit</Button>
                            </>
                          ) : (
                            <>
                              <ProfileGrid>
                                {['candidateName','email','mobile'].map(key=>(
                                  <Field key={key}>
                                    <strong>{key.replace('candidateName','Name').replace('mobile','Mobile')}:</strong>
                                    <input
                                      value={profileData[key]||''}
                                      onChange={e=>setProfileData(prev=>({...prev,[key]:e.target.value}))}
                                    />
                                  </Field>
                                ))}
                              </ProfileGrid>
                              <Button onClick={saveProfile}>Save</Button>
                            </>
                          )}
                        </DetailSection>
                      )}
                    </ModalGrid>
                  )}

                  {modalType==='CourseDocs' && (
                    <DocSection>
                      <Select value={docType} onChange={e=>setDocType(e.target.value)}>
                        <option value="syllabus">Syllabus</option>
                        <option value="schedule">Schedule</option>
                      </Select>
                      <DocLink href={courseDocs[docType]} target="_blank">
                        View {docType.charAt(0).toUpperCase()+docType.slice(1)}
                      </DocLink>
                      <FileInput type="file" accept="application/pdf" onChange={uploadDocs} />
                    </DocSection>
                  )}

                  {modalType==='ManageAssignments' && (
                    <FormSection>
                      <input placeholder="Unit" value={newAssignment.unit} onChange={e=>setNewAssignment(prev=>({...prev,unit:e.target.value}))} />
                      <input placeholder="Study Material URL" value={newAssignment.studyMaterialUrl} onChange={e=>setNewAssignment(prev=>({...prev,studyMaterialUrl:e.target.value}))} />
                      <Button onClick={createAssignment}>Create Assignment</Button>
                      <AssignList>
                        {assignments.map(a=><AssignItem key={a._id}>{a.unit}</AssignItem>)}
                      </AssignList>
                    </FormSection>
                  )}

                  {modalType==='AssignmentResults' && (
                    <ResultsTable>
                      <thead><tr><th>Student</th><th>Unit</th><th>Score</th></tr></thead>
                      <tbody>{results.map(r=><tr key={r._id}><td>{r.studentName}</td><td>{r.unit}</td><td>{r.results?.score}</td></tr>)}</tbody>
                    </ResultsTable>
                  )}

                  {modalType==='ReviewFeedback' && (
                    <>
                      <StudentList>
                        {students.map(s=><StudentItem key={s._id||s.id} onClick={()=>selectStudent(s)}>{s.candidateName}</StudentItem>)}
                      </StudentList>
                      {selectedStudent && (
                        <FeedbackSection>
                          <h3>Feedback for {selectedStudent.candidateName}</h3>
                          <textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} />
                          <Button onClick={submitFeedback}>Submit</Button>
                        </FeedbackSection>
                      )}
                      <FeedbackList>{feedbackList.map(f=><FeedbackItem key={f._id}>{f.studentId}: {f.feedback}</FeedbackItem>)}</FeedbackList>
                    </>
                  )}
                </>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
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
