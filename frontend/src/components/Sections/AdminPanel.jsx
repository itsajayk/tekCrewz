// === AdminPanel.jsx ===
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

  // Fetch Firebase users for some UI options
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where(documentId(), '>=', 'REFSD'),
          where(documentId(), '<', 'REFSE')
        );
        const snapshot = await getDocs(q);
        const refs = snapshot.docs.map(doc => ({
          id: doc.id,
          label: doc.data().referrerName || doc.id
        }));
        setUserOptions([{ id: 'admin', label: 'Admin' }, ...refs]);
      } catch (err) {
        console.error('Error fetching referrers:', err);
      }
    };
    fetchUsers();
  }, []);

  // Fetch data when a modal opens
  useEffect(() => {
    if (!showModal) return;

    const fetchMergedStudents = async () => {
      // Firebase users
      const snap = await getDocs(collection(db, 'users'));
      const creds = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Mongo candidates
      const res = await fetch('/api/admin/candidates');
      const cands = await res.json();
      return creds.map(c => ({
        ...c,
        ...(cands.find(x => x.studentId === c.id) || {})
      }));
    };

    switch (modalType) {
      case 'StudentDetails':
        fetchMergedStudents().then(setStudents);
        break;
      case 'CourseDocs':
        fetch('/api/admin/course-docs')
          .then(r => r.json())
          .then(setCourseDocs);
        break;
      case 'ManageAssignments':
        fetch('/api/admin/assignments')
          .then(r => r.json())
          .then(setAssignments);
        break;
      case 'AssignmentResults':
        fetch('/api/admin/results')
          .then(r => r.json())
          .then(setResults);
        break;
      case 'ReviewFeedback':
        fetch('/api/admin/feedback')
          .then(r => r.json())
          .then(setFeedbackList);
        break;
      default:
        break;
    }
  }, [showModal, modalType]);

  const openModal = type => {
    setModalType(type);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
  };
  const selectStudent = s => setSelectedStudent(s);

  const createAssignment = () => {
    fetch('/api/admin/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAssignment)
    }).then(() =>
      fetch('/api/admin/assignments')
        .then(r => r.json())
        .then(setAssignments)
    );
  };

  const submitFeedback = () => {
    fetch('/api/admin/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: selectedStudent.id, feedback: feedbackText })
    }).then(() =>
      fetch('/api/admin/feedback')
        .then(r => r.json())
        .then(setFeedbackList)
    );
  };

  const handleNavigate = path => () => navigate(path);

  return (
    <PageWrapper>
      <TopNavbar />
      <MainContent>
        <PageTitle>Admin Panel</PageTitle>
        <MenuGrid>
          {/* Existing Operations */}
          <MenuCard onClick={handleNavigate('/add-candidate')}>
            <CardIcon>🤝</CardIcon>
            <CardLabel>Add Candidate</CardLabel>
          </MenuCard>
          <MenuCard onClick={handleNavigate('/candidateList')}>
            <CardIcon>📋</CardIcon>
            <CardLabel>Candidate List</CardLabel>
          </MenuCard>
          <MenuCard onClick={handleNavigate('/admin-report')}>
            <CardIcon>📊</CardIcon>
            <CardLabel>Quiz Report</CardLabel>
          </MenuCard>
          <MenuCard onClick={handleNavigate('/EmpDashboard')}>
            <CardIcon>📈</CardIcon>
            <CardLabel>Employee Dashboard</CardLabel>
          </MenuCard>
          <MenuCard onClick={handleNavigate('/signup')}>
            <CardIcon>➕</CardIcon>
            <CardLabel>Create Account</CardLabel>
          </MenuCard>

          {/* New Admin Student Operations */}
          <MenuCard onClick={() => openModal('StudentDetails')}>
            <CardIcon>👤</CardIcon>
            <CardLabel>Student Details</CardLabel>
          </MenuCard>
          <MenuCard onClick={() => openModal('CourseDocs')}>
            <CardIcon>📚</CardIcon>
            <CardLabel>Course Documents</CardLabel>
          </MenuCard>
          <MenuCard onClick={() => openModal('ManageAssignments')}>
            <CardIcon>📝</CardIcon>
            <CardLabel>Manage Assignments</CardLabel>
          </MenuCard>
          <MenuCard onClick={() => openModal('AssignmentResults')}>
            <CardIcon>📈</CardIcon>
            <CardLabel>Assignment Results</CardLabel>
          </MenuCard>
          <MenuCard onClick={() => openModal('ReviewFeedback')}>
            <CardIcon>💬</CardIcon>
            <CardLabel>Review Feedback</CardLabel>
          </MenuCard>
        </MenuGrid>
      </MainContent>
      <Footer />

      {showModal && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <h2>{modalType.replace(/([A-Z])/g, ' $1').trim()}</h2>
              <CloseButton onClick={closeModal}>&times;</CloseButton>
            </ModalHeader>
            <ModalBody>

              {modalType === 'StudentDetails' && (
                <>
                  <StudentList>
                    {students.map(s => (
                      <StudentItem key={s.id} onClick={() => selectStudent(s)}>
                        {s.name || s.candidateName}
                      </StudentItem>
                    ))}
                  </StudentList>
                  {selectedStudent && (
                    <DetailSection>
                      <h3>Profile</h3>
                      <p><strong>Name:</strong> {selectedStudent.name || selectedStudent.candidateName}</p>
                      <p><strong>Email:</strong> {selectedStudent.email}</p>
                      <button onClick={() => window.location = `mailto:admin@example.com?subject=Edit Request`}>Request Edit</button>
                      <h3>Attendance</h3>
                      <AttendanceTable>
                        <thead>
                          <tr><th>Date</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {selectedStudent.attendance?.map((a, i) => (
                            <tr key={i}>
                              <td>{new Date(a.date).toLocaleDateString()}</td>
                              <td>{a.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </AttendanceTable>
                    </DetailSection>
                  )}
                </>
              )}

              {modalType === 'CourseDocs' && (
                <DocList>
                  {courseDocs.map(d => (
                    <DocItem key={d._id}>
                      <a href={d.url} target="_blank" rel="noopener noreferrer">{d.type}</a>
                    </DocItem>
                  ))}
                </DocList>
              )}

              {modalType === 'ManageAssignments' && (
                <>
                  <FormSection>
                    <input
                      placeholder="Unit"
                      value={newAssignment.unit}
                      onChange={e => setNewAssignment({ ...newAssignment, unit: e.target.value })}
                    />
                    <input
                      placeholder="Study Material URL"
                      value={newAssignment.studyMaterialUrl}
                      onChange={e => setNewAssignment({ ...newAssignment, studyMaterialUrl: e.target.value })}
                    />
                    <button onClick={createAssignment}>Create Assignment</button>
                  </FormSection>
                  <AssignList>
                    {assignments.map(a => (
                      <AssignItem key={a._id}>{a.unit}</AssignItem>
                    ))}
                  </AssignList>
                </>
              )}

              {modalType === 'AssignmentResults' && (
                <ResultsTable>
                  <thead>
                    <tr><th>Student</th><th>Unit</th><th>Score</th></tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r._id}>
                        <td>{r.studentName}</td>
                        <td>{r.unit}</td>
                        <td>{r.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </ResultsTable>
              )}

              {modalType === 'ReviewFeedback' && (
                <>
                  <StudentList>
                    {students.map(s => (
                      <StudentItem key={s.id} onClick={() => selectStudent(s)}>
                        {s.name || s.candidateName}
                      </StudentItem>
                    ))}
                  </StudentList>
                  {selectedStudent && (
                    <FeedbackSection>
                      <h3>Submit Feedback for {selectedStudent.name || selectedStudent.candidateName}</h3>
                      <textarea
                        value={feedbackText}
                        onChange={e => setFeedbackText(e.target.value)}
                      />
                      <button onClick={submitFeedback}>Submit</button>
                    </FeedbackSection>
                  )}
                  <FeedbackList>
                    {feedbackList.map(f => (
                      <FeedbackItem key={f._id}>{f.studentName}: {f.feedback}</FeedbackItem>
                    ))}
                  </FeedbackList>
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

/* === Styled Components === */
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
  padding: 90px 30px;
`;
const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 40px;
  background: linear-gradient(90deg, #7620ff, #ff9900);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  text-align: center;
  @media (max-width: 600px) {
    font-size: 2rem;
    margin-bottom: 20px;
  }
`;
const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 30px;
  width: 100%;
  max-width: 800px;
  @media (max-width: 480px) {
    gap: 20px;
  }
`;
const MenuCard = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  }
`;
const CardIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 15px;
`;
const CardLabel = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
`;
const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;
const ModalContent = styled.div`
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90%;
  overflow-y: auto;
  position: relative;
`;
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
`;
const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;
const ModalBody = styled.div`
  padding: 16px;
`;
const StudentList = styled.ul`
  list-style: none;
  padding: 0;
  max-height: 200px;
  overflow-y: auto;
`;
const StudentItem = styled.li`
  padding: 8px;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
`;
const DetailSection = styled.div`
  margin-top: 16px;
`;
const AttendanceTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background: #f0f0f0; }
`;
const DocList = styled.ul`list-style: none; padding: 0;`;
const DocItem = styled.li`margin: 8px 0;`;
const FormSection = styled.div`margin-bottom: 16px;`;
const AssignList = styled.ul`list-style: none; padding: 0;`;
const AssignItem = styled.li`margin: 4px 0;`;
const ResultsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td { border: 1px solid #ddd; padding: 8px; }
  th { background: #f0f0f0; }
`;
const FeedbackSection = styled.div`margin: 16px 0;`;
const FeedbackList = styled.ul`list-style: none; padding: 0;`;
const FeedbackItem = styled.li`margin: 4px 0;`;
