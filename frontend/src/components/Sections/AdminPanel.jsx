import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import TopNavbar from '../Nav/TopNavbar';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { auth, db } from '../Pages/firebase';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [userOptions, setUserOptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [courseDocs, setCourseDocs] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [results, setResults] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [newAssignment, setNewAssignment] = useState({ unit: '', studyMaterialUrl: '' });
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({});

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
      } catch (err) {
        console.error('Error fetching referrers:', err);
      }
    };
    fetchUsers();
  }, []);

    const saveProfile = async () => {
    setLoading(true);
    await fetch(`/api/candidates/${selectedStudent._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    setStudents(students.map(s => s._id === selectedStudent._id ? profileData : s));
    setSelectedStudent(profileData);
    setEditMode(false);
    setLoading(false);
  };

  useEffect(() => {
    if (!showModal) return;
    setLoading(true);
    const loadData = async () => {
      try {
        if (modalType === 'StudentDetails') {
          const snap = await getDocs(collection(db, 'users'));
          const creds = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          const res = await fetch('/api/candidates');
          if (!res.ok) throw new Error(`API error: ${res.status}`);
          const cands = await res.json();
          setStudents(creds.map(c => ({ ...c, ...cands.find(x => x.studentId === c.id) || {} })));        
        } else if (modalType === 'CourseDocs') {
          const res = await fetch('/api/courses/COURSE1/docs');
          if (!res.ok) throw new Error(`API error: ${res.status}`);
          setCourseDocs(await res.json());
        } else if (modalType === 'ManageAssignments') {
          const res = await fetch('/api/assignments/all'); if (!res.ok) throw new Error(`API error: ${res.status}`);
          setAssignments(await res.json());
        } else if (modalType === 'AssignmentResults') {
          const res = await fetch('/api/admin/assignments/results'); if (!res.ok) throw new Error(`API error: ${res.status}`);
          setResults(await res.json());
        } else if (modalType === 'ReviewFeedback') {
          const res = await fetch('/api/admin/feedback'); if (!res.ok) throw new Error(`API error: ${res.status}`);
          setFeedbackList(await res.json());
        }
      } catch (err) {
        console.error('Failed loading data for', modalType, err);
        alert('Error loading data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [showModal, modalType]);

const openModal = type => { setModalType(type); setShowModal(true); setEditMode(false); };
  const closeModal = () => { setShowModal(false); setSelectedStudent(null); setEditMode(false); };
  const selectStudent = s => { setSelectedStudent(s); setProfileData(s); setEditMode(false); };

  const createAssignment = () => {
    setLoading(true);
    fetch('/api/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAssignment) })
      .then(() => fetch('/api/admin/assignments'))
      .then(r => r.json())
      .then(data => { setAssignments(data); setLoading(false); });
  };

  const submitFeedback = () => {
    setLoading(true);
    fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: selectedStudent.id, feedback: feedbackText }) })
      .then(() => fetch('/api/admin/feedback'))
      .then(r => r.json())
      .then(data => { setFeedbackList(data); setLoading(false); });
  };

  const uploadDocs = async e => {
    const form = new FormData();
    if (e.target.files[0]) form.append('syllabus', e.target.files[0]);
    if (e.target.files[1]) form.append('schedule', e.target.files[1]);
    setLoading(true);
    const res = await fetch('/api/admin/course-docs/upload', { method: 'POST', body: form });
    setCourseDocs(await res.json());
    setLoading(false);
  };

  const handleNavigate = path => () => navigate(path);

  return (
    <PageWrapper>
      <TopNavbar />
      <MainContent>
        <PageTitle>Admin Panel</PageTitle>
        <MenuGrid>
          <MenuCard onClick={handleNavigate('/add-candidate')}><CardIcon>🤝</CardIcon><CardLabel>Add Candidate</CardLabel></MenuCard>
          <MenuCard onClick={handleNavigate('/candidateList')}><CardIcon>📋</CardIcon><CardLabel>Candidate List</CardLabel></MenuCard>
          <MenuCard onClick={handleNavigate('/admin-report')}><CardIcon>📊</CardIcon><CardLabel>Quiz Report</CardLabel></MenuCard>
          <MenuCard onClick={handleNavigate('/EmpDashboard')}><CardIcon>📈</CardIcon><CardLabel>Employee Dashboard</CardLabel></MenuCard>
          <MenuCard onClick={handleNavigate('/signup')}><CardIcon>➕</CardIcon><CardLabel>Create Account</CardLabel></MenuCard>
          <MenuCard onClick={() => openModal('StudentDetails')}><CardIcon>👤</CardIcon><CardLabel>Student Details</CardLabel></MenuCard>
          <MenuCard onClick={() => openModal('CourseDocs')}><CardIcon>📚</CardIcon><CardLabel>Course Documents</CardLabel></MenuCard>
          <MenuCard onClick={() => openModal('ManageAssignments')}><CardIcon>📝</CardIcon><CardLabel>Manage Assignments</CardLabel></MenuCard>
          <MenuCard onClick={() => openModal('AssignmentResults')}><CardIcon>📈</CardIcon><CardLabel>Assignment Results</CardLabel></MenuCard>
          <MenuCard onClick={() => openModal('ReviewFeedback')}><CardIcon>💬</CardIcon><CardLabel>Review Feedback</CardLabel></MenuCard>
        </MenuGrid>
      </MainContent>
      <Footer />

      {showModal && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader><h2>{modalType.replace(/([A-Z])/g,' $1').trim()}</h2><CloseButton onClick={closeModal}>&times;</CloseButton></ModalHeader>
            <ModalBody>
              {loading ? <Spinner>Loading...</Spinner> : (
                <>
                  {modalType === 'StudentDetails' && (
                    <ModalInner>
                      <StudentList>{students.map(s => <StudentItem key={s._id} onClick={() => selectStudent(s)}>{s.candidateName}</StudentItem>)}</StudentList>
                      {selected && (
                        <DetailSection>
                          {!editMode ? (
                            <> <ProfileGrid>
                              <Field><strong>Name:</strong> {selected.candidateName}</Field>
                              <Field><strong>Email:</strong> {selected.email}</Field>
                              <Field><strong>Mobile:</strong> {selected.mobile}</Field>
                              {/* add more fields as needed */}
                            </ProfileGrid>
                              <button onClick={() => setEditMode(true)}>Edit</button>
                            </>
                          ) : (
                            <> <ProfileGrid>
                              <Field><strong>Name:</strong> <input value={profileData.candidateName} onChange={e => setProfileData({ ...profileData, candidateName: e.target.value })} /></Field>
                              <Field><strong>Email:</strong> <input value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} /></Field>
                              <Field><strong>Mobile:</strong> <input value={profileData.mobile} onChange={e => setProfileData({ ...profileData, mobile: e.target.value })} /></Field>
                            </ProfileGrid>
                              <ActionButton onClick={saveProfile}>Save</ActionButton>
                            </>
                          )}
                        </DetailSection>
                      )}
                    </ModalInner>
                  )}
                  {modalType === 'CourseDocs' && (
                    <DocSection>
                      <DocLink href={courseDocs.syllabus} target="_blank">Syllabus</DocLink>
                      <DocLink href={courseDocs.schedule} target="_blank">Schedule</DocLink>
                      <FileInput type="file" multiple accept="application/pdf" onChange={uploadDocs} />
                    </DocSection>
                  )}
                  {modalType === 'ManageAssignments' && (
                    <>
                      <FormSection>
                        <input placeholder="Unit" value={newAssignment.unit} onChange={e => setNewAssignment({ ...newAssignment, unit: e.target.value })} />
                        <input placeholder="Study Material URL" value={newAssignment.studyMaterialUrl} onChange={e => setNewAssignment({ ...newAssignment, studyMaterialUrl: e.target.value })} />
                        <button onClick={createAssignment}>Create Assignment</button>
                      </FormSection>
                      <AssignList>{assignments.map(a => <AssignItem key={a._id}>{a.unit}</AssignItem>)}</AssignList>
                    </>
                  )}
                  {modalType === 'AssignmentResults' && (
                    <ResultsTable>
                      <thead><tr><th>Student</th><th>Unit</th><th>Score</th></tr></thead>
                      <tbody>{results.map(r => <tr key={r._id}><td>{r.studentName}</td><td>{r.unit}</td><td>{r.score}</td></tr>)}</tbody>
                    </ResultsTable>
                  )}
                  {modalType === 'ReviewFeedback' && (
                    <>
                      <StudentList>{students.map(s => <StudentItem key={s._id || s.id} onClick={() => selectStudent(s)}>{s.candidateName}</StudentItem>)}</StudentList>
                      {selectedStudent && (
                        <FeedbackSection>
                          <h3>Feedback for {selectedStudent.candidateName}</h3>
                          <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
                          <button onClick={submitFeedback}>Submit</button>
                        </FeedbackSection>
                      )}
                      <FeedbackList>{feedbackList.map(f => <FeedbackItem key={f._id}>{f.studentName}: {f.feedback}</FeedbackItem>)}</FeedbackList>
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
const ModalInner = styled.div`
  display: flex; gap: 16px;
`;
const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 90px 30px;
`;
const Field = styled.div`display:flex;flex-direction:column;`;
const ActionButton = styled.button`padding:8px 16px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-top:8px;`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 40px;
  background: linear-gradient(90deg, #7620ff, #ff9900);
  -webkit-background-clip: text;
  color: transparent;
  text-align: center;
`;
const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 30px;
  width: 100%;
  max-width: 800px;
`;
const MenuCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.3s;
  &:hover { transform: translateY(-5px); }
`;
const DocSection = styled.div`display:flex;flex-direction:column;gap:12px;`;
const DocLink = styled.a`color:#007acc;text-decoration:underline;`;
const FileInput = styled.input`margin-top:12px;`;
const CardIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 8px;
`;
const CardLabel = styled.div`
  font-weight: 600;
`;
const ModalOverlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; justify-content: center; align-items: center;
`;
const ModalContent = styled.div`
  background: #fff;
  border-radius: 8px;
  width: 90%; max-width: 800px;
  max-height: 90%; overflow-y: auto;
`;
const ModalHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px; border-bottom: 1px solid #eee;
`;
const CloseButton = styled.button`
  background: none; border: none; font-size: 1.2rem; cursor: pointer;
`;
const ModalBody = styled.div`
  padding: 16px;
`;
const Spinner = styled.div`
  text-align: center; padding: 20px; font-size: 1.2rem;
`;
const StudentList = styled.ul`
  list-style: none; padding: 0; max-height: 200px; overflow-y: auto;
`;
const StudentItem = styled.li`
  padding: 8px; border-bottom: 1px solid #ddd; cursor: pointer;
`;
const DetailSection = styled.div`
  margin-top: 16px;
`;
const ProfileGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
`;
const ProfileRow = styled.div``;
const DocList = styled.ul`list-style: none; padding: 0;`;
const DocItem = styled.li`margin: 4px 0;`;
const FormSection = styled.div`margin-bottom: 16px; display: flex; gap: 8px;`;
const AssignList = styled.ul`list-style: none; padding: 0;`;
const AssignItem = styled.li`margin: 4px 0;`;
const ResultsTable = styled.table`
  width: 100%; border-collapse: collapse;
  th,td { border: 1px solid #ddd; padding: 8px; }
  th { background: #f0f0f0; }
`;
const FeedbackSection = styled.div`margin: 16px 0;`;
const FeedbackList = styled.ul`list-style: none; padding: 0;`;
const FeedbackItem = styled.li`margin: 4px 0;`;
