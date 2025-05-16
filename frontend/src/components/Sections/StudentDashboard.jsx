// src/components/StudentDashboard.jsx
import React, { useEffect, useState, useContext } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../Pages/firebase';
import TopNavbar from '../Nav/TopNavbar';
import Footer from './Footer';
import { AuthContext } from '../../contexts/AuthContext';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { userId: studentId } = useContext(AuthContext);
  const [profile, setProfile]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [attendance, setAttendance]     = useState([]);
  const [docs, setDocs]                 = useState({ syllabus: '', schedule: '' });
  const [assignments, setAssignments]   = useState([]);
  const [codeInput, setCodeInput]       = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [activeTab, setActiveTab]       = useState('Profile');

  useEffect(() => {
    if (!studentId) return navigate('/s-loginPage');

    Promise.all([
      fetch(`/api/students/${studentId}/profile`).then(r=>r.json()),
      fetch(`/api/students/${studentId}/attendance`).then(r=>r.json()),
      fetch(`/api/courses/COURSE1/docs`).then(r=>r.json()),
      fetch(`/api/assignments/${studentId}`).then(r=>r.json())
    ])
    .then(([prof, att, docsData, assigns]) => {
      setProfile(prof);
      setAttendance(att);
      setDocs(docsData);
      setAssignments(assigns);
    })
    .catch(err => {
      console.error('Dashboard data fetch error:', err);
      // you could set an error state here to show to user
    })
    .finally(() => setLoading(false));
  }, [studentId, navigate]);

  const submitCode = async unit => {
    await fetch(`/api/assignments/${studentId}/submit`, {
      method: 'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ unit, code: codeInput })
    });
    setCodeInput('');
    setAssignments(a => a.map(x => x.unit===unit ? { ...x, submissionCode: codeInput } : x));
    setActiveTab(unit);
  };

  const requestUnlock = async unit => {
    await fetch(`/api/assignments/${studentId}/unlock`, {
      method: 'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ unit })
    });
    setAssignments(a => a.map(x => x.unit===unit ? { ...x, unlocked:true } : x));
  };

  const submitFeedback = async unit => {
    await fetch(`/api/assignments/${studentId}/feedback`, {
      method: 'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ unit, feedback: feedbackInput })
    });
    setFeedbackInput('');
    setAssignments(a => a.map(x => x.unit===unit ? { ...x, feedback: feedbackInput } : x));
    setActiveTab(unit);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/s-loginPage');
  };

  if (loading) return <Loading>Loading...</Loading>;

  const renderContent = () => {
    switch(activeTab) {
      case 'Profile':
        return (
          <Card>
            <h3>Profile</h3>
            <Field><Label>Name:</Label> {profile.candidateName}</Field>
            <Field><Label>Email:</Label> {profile.email}</Field>
            <Field><Label>Mobile:</Label> {profile.mobile}</Field>
            <Note>To edit, please email admin@example.com</Note>
          </Card>
        );
      case 'Attendance':
        return (
          <Card>
            <h3>Attendance</h3>
            <Table>
              <thead><tr><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {attendance.map((r,i) => (
                  <tr key={i}><td>{r.date}</td><td>{r.status}</td></tr>
                ))}
              </tbody>
            </Table>
            <Note>To correct, please email admin@example.com</Note>
          </Card>
        );
      case 'Syllabus':
        return (
          <Card>
            <h3>Course Syllabus</h3>
            <Pdf src={docs.syllabus} />
          </Card>
        );
      case 'Schedule':
        return (
          <Card>
            <h3>Course Schedule</h3>
            <Pdf src={docs.schedule} />
          </Card>
        );
      default:
        // unit-wise assignment
        const a = assignments.find(x => x.unit === activeTab);
        if (!a) return null;
        return (
          <Card>
            <h3>Unit: {a.unit}</h3>

            <SectionSmall>Study Material</SectionSmall>
            <Pdf src={a.studyMaterialUrl} />

            <SectionSmall>Submit Code</SectionSmall>
            <TextArea
              rows={6}
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              disabled={a.closed}
            />
            <Button disabled={a.closed} onClick={() => submitCode(a.unit)}>
              {a.closed ? 'Closed' : 'Submit'}
            </Button>

            {!a.unlocked && (
              <>
                <SectionSmall>Request Unlock</SectionSmall>
                <UnlockForm onSubmit={e => { e.preventDefault(); requestUnlock(a.unit); }}>
                  <Button type="submit">Request Re-open (2 days)</Button>
                </UnlockForm>
              </>
            )}

            {a.results && (
              <>
                <SectionSmall>Result</SectionSmall>
                <Table>
                  <thead><tr><th>Score</th><th>Passed</th></tr></thead>
                  <tbody>
                    <tr>
                      <td>{a.results.score}</td>
                      <td>{a.results.passed ? 'Yes' : 'No'}</td>
                    </tr>
                  </tbody>
                </Table>
              </>
            )}

            <SectionSmall>Feedback</SectionSmall>
            <TextArea
              rows={4}
              value={feedbackInput}
              onChange={e => setFeedbackInput(e.target.value)}
            />
            <Button onClick={() => submitFeedback(a.unit)}>Send Feedback</Button>
          </Card>
        );
    }
  };

  return (
    <Page>
      <TopNavbar onLogout={handleLogout}/>
      <Layout>
        <Sidebar>
          <Section>Student Details</Section>
          <NavItem active={activeTab==='Profile'} onClick={()=>setActiveTab('Profile')}>Profile</NavItem>
          <NavItem active={activeTab==='Attendance'} onClick={()=>setActiveTab('Attendance')}>Attendance</NavItem>
          <Section>Course Details</Section>
          <NavItem active={activeTab==='Syllabus'} onClick={()=>setActiveTab('Syllabus')}>Syllabus</NavItem>
          <NavItem active={activeTab==='Schedule'} onClick={()=>setActiveTab('Schedule')}>Schedule</NavItem>
          <Section>Assignments</Section>
          {assignments.map(a => (
            <NavItem
              key={a.unit}
              active={activeTab===a.unit}
              onClick={()=>setActiveTab(a.unit)}
            >
              {a.unit}
            </NavItem>
          ))}
        </Sidebar>
        <Main>
          {renderContent()}
        </Main>
      </Layout>
      <Footer />
    </Page>
  );
}

// Styled Components (palette & layout adjusted to match design)
const Page = styled.div`
  display: flex; flex-direction: column; min-height:100vh;
`;
const Layout = styled.div`
  display:flex; flex:1;
`;
const Sidebar = styled.nav`
  width:220px; background:#2f3e4e; color:#fff; padding:20px;
`;
const Section = styled.h4`
  margin-top:20px; color:#bbb; font-size:1rem;
`;
const NavItem = styled.div`
  padding:10px; margin-top:4px; border-radius:4px; cursor:pointer;
  background: ${({ active })=> active ? '#fff' : 'transparent'};
  color: ${({ active })=> active ? '#2f3e4e' : '#fff'};
  &:hover { background:#fff; color:#2f3e4e; }
`;
const Main = styled.main`
  flex:1; padding:20px; background:#f7f7f7;
`;
const Card = styled.div`
  background:#fff; padding:20px; border-radius:8px;
  box-shadow:0 2px 6px rgba(0,0,0,0.1); margin-bottom:20px;
`;
const Field = styled.div` margin-bottom:10px; `;
const Label = styled.span` font-weight:bold; margin-right:5px; `;
const Note = styled.p` font-size:0.9rem; color:#555; margin-top:10px; `;
const Table = styled.table`
  width:100%; border-collapse:collapse;
  th,td{ border:1px solid #ddd; padding:8px; text-align:left; }
  th{ background:#f0f0f0; }
  margin-bottom:10px;
`;
const Pdf = styled.iframe`
  width:100%; height:300px; border:none; margin-bottom:10px;
`;
const TextArea = styled.textarea`
  width:100%; padding:8px; border-radius:4px; border:1px solid #ccc;
  margin-bottom:8px;
`;
const Button = styled.button`
  padding:8px 16px; background:#7620ff; color:#fff; border:none;
  border-radius:4px; cursor:pointer; margin-right:8px;
  &:hover{ background:#580cd2; }
  &:disabled{ background:#ccc; cursor:not-allowed; }
`;
const SectionSmall = styled.h4`
  margin-top:16px; margin-bottom:8px; font-size:1rem; color:#333;
`;
const UnlockForm = styled.form`
  margin-bottom:16px;
`;
const Loading = styled.div`
  padding:50px; text-align:center; font-size:1.2rem; color:#666;
`;
