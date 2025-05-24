import React, { useEffect, useState, useContext } from "react";
import styled, { ThemeProvider, keyframes } from "styled-components";  // <-- ThemeProvider here
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../Pages/firebase";
import TopNavbar from "../Nav/TopNavbar";
import Footer from "./Footer";
import { AuthContext } from "../../contexts/AuthContext";
import {
  FiUser,
  FiCalendar,
  FiFileText,
  FiClock,
  FiCheckSquare,
  FiUnlock,
  FiSun,
  FiMoon
} from "react-icons/fi";


// Define light and dark themes
const lightTheme = {
  background: '#f4f7fa',
  sidebarBg: 'linear-gradient(160deg, #6a11cb 0%, #2575fc 100%)',
  sidebarColor: '#fff',
  sidebarHover: 'rgba(255,255,255,0.2)',
  mainBg: '#ffffff',
  cardBg: '#fff',
  text: '#2f3e4e',
  subText: '#555',
  border: '#ddd',
  buttonBg: '#7620ff',
  buttonColor: '#fff',
};
const darkTheme = {
  background: '#1e1e2f',
  sidebarBg: 'linear-gradient(160deg, #232526 0%, #414345 100%)',
  sidebarColor: '#ddd',
  sidebarHover: 'rgba(255,255,255,0.1)',
  mainBg: ' #2a2a3d',
  cardBg: ' #33334d',
  text: '#fff',
  subText: '#aaa',
  border: '#444',
  buttonBg: '#ffa500',
  buttonColor: '#2f3e4e',
};

export default function StudentDashboard() {
  const API_BASE_URL = "https://tekcrewz.onrender.com";
  const navigate = useNavigate();
  const { userId: studentId } = useContext(AuthContext);

  const [data, setData] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [activeTab, setActiveTab] = useState("Profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  useEffect(() => {
    if (!studentId) {
      navigate("/s-loginPage");
      return;
    }
    const fetchAll = async () => {
      setLoading(true);
      try {
        // 1. fetch candidate profile (optional)
        let prof = null;
        try {
          const candRes = await fetch(`${API_BASE_URL}/api/candidates`);
          if (candRes.ok) {
            const candidates = await candRes.json();
            const fbUser = auth.currentUser;
            const myEmail = fbUser?.email?.toLowerCase();
            prof = candidates.find(c => c.email?.toLowerCase() === myEmail);
          }
        } catch (e) {
          console.error('Error fetching candidates:', e);
        }
        // if no candidate record, just fallback to blank
        const candidateName = prof?.candidateName || "New Student";
        const email = prof?.email || "";
        const mobile = prof?.mobile || "";
        // <<< Add this line to define candidatePic before using it >>>
        const candidatePic = prof?.candidatePic || prof?.photoUrl || "";

        // 2. attendance (may be empty)
        let attendance = [];
        try {
          const attRes = await fetch(
            `${API_BASE_URL}/api/students/${studentId}/attendance`
          );
          if (attRes.ok) attendance = await attRes.json();
        } catch {}

        // 3. course docs (may be empty)
        let docs = [];
        try {
          const docsRes = await fetch(
            `${API_BASE_URL}/api/courses/COURSE1/docs`
          );
          if (docsRes.ok) {
            const docsObj = await docsRes.json();
            docs = Object.entries(docsObj).map(([type, url]) => ({
              type,
              url,
            }));
          }
        } catch {}

        // 4. assignments (may be empty)
        let assignments = [];
        try {
          const asnRes = await fetch(
            `${API_BASE_URL}/api/assignments/${studentId}`
          );
          if (asnRes.ok) assignments = await asnRes.json();
        } catch {}

        setData({
          candidateName,
          email,
          mobile,
          candidatePic,
          attendance,
          docs,
          assignments,
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [studentId, navigate]);

  const submitCode = async (unit) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/assignments/${studentId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unit, code: codeInput }),
        }
      );
      if (!res.ok) throw new Error("Submission failed");
      setData((d) => ({
        ...d,
        assignments: d.assignments.map((a) =>
          a.unit === unit ? { ...a, submissionCode: codeInput } : a
        ),
      }));
      setCodeInput("");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const requestUnlock = async (unit) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/assignments/${studentId}/unlock`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unit }),
        }
      );
      if (!res.ok) throw new Error("Unlock request failed");
      setData((d) => ({
        ...d,
        assignments: d.assignments.map((a) =>
          a.unit === unit ? { ...a, unlocked: true } : a
        ),
      }));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const submitFeedback = async (unit) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/assignments/${studentId}/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unit, feedback: feedbackInput }),
        }
      );
      if (!res.ok) throw new Error("Feedback submission failed");
      setData((d) => ({
        ...d,
        assignments: d.assignments.map((a) =>
          a.unit === unit ? { ...a, feedback: feedbackInput } : a
        ),
      }));
      setFeedbackInput("");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/s-loginPage");
  };

  if (loading) return <SpinnerOverlay><Spinner /></SpinnerOverlay>;
  if (error) return <ErrorMsg>{error}</ErrorMsg>;

  const tabIcon = (tab) => {
    switch(tab) {
      case 'Profile': return <FiUser />;
      case 'Attendance': return <FiClock />;
      case 'Syllabus': return <FiFileText />;
      case 'Schedule': return <FiCalendar />;
      default: return <FiCheckSquare />;
    }
  };

  const { candidateName, email, mobile, candidatePic, attendance, docs, assignments } = data;


  const renderProfileCard = () => {
  // Calculate assignment completion
  const total = assignments.length;
  const done = assignments.filter(a => a.results || a.submissionCode).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <ProfileContainer>
      <Card>
        <ProfileHeader>
          {candidatePic
            ? <Avatar src={candidatePic} alt="Profile" />
            : <AvatarPlaceholder><FiUser size={32} /></AvatarPlaceholder>
          }
          <ProfileInfo>
            <h2>{candidateName}</h2>
            <p>{email}</p>
            <p>{mobile}</p>
          </ProfileInfo>
        </ProfileHeader>
        <ProgressSection>
          <p>Assignments Completed: {done} of {total} ({percent}%)</p>
          <ProgressBarContainer>
            <ProgressBarFill style={{ width: `${percent}%` }} />
          </ProgressBarContainer>
        </ProgressSection>
        <SectionSmall>Assignments Overview</SectionSmall>
        {assignments.length > 0 ? (
          <AssignmentList>
            {assignments.map(a => (
              <AssignmentItem key={a.unit}>
                <strong>{a.unit}</strong>: {a.results
                  ? `${a.results.passed ? 'Passed' : 'Failed'} (${a.results.score}%)`
                  : (a.submissionCode ? 'Submitted' : 'Pending')
                }
              </AssignmentItem>
            ))}
          </AssignmentList>
        ) : <p>No assignments available.</p>}
      </Card>
    </ProfileContainer>
  );
};

  const renderContent = () => {
    switch (activeTab) {
      case "Profile":
        return renderProfileCard();
      case "Attendance":
        return (
          <Card>
            <h3>Attendance</h3>
            <Table>
              <thead><tr><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {attendance.map((r, i) => (
                  <tr key={i}>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        );
      case "Attendance":
        return (
          <Card>
            <h3>Attendance</h3>
            <Table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((r, i) => (
                  <tr key={i}>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {/* <Note>To correct, email admin@tekcrewz.com</Note> */}
          </Card>
        );
      case "Syllabus":
      case "Schedule": {
        const doc = docs.find(
          (d) => d.type.toLowerCase() === activeTab.toLowerCase()
        );
        return (
          <Card>
            <h3>Course {activeTab}</h3>
            {doc ? <Pdf src={doc.url} /> : <p>No document available.</p>}
          </Card>
        );
      }
      default: {
        const unitData = assignments.find((a) => a.unit === activeTab);
        if (!unitData) return null;
        return (
          <Card>
            <h3>Unit: {unitData.unit}</h3>
            <SectionSmall>Study Material</SectionSmall>
            <Pdf src={unitData.studyMaterialUrl} />

            <SectionSmall>Submit Code</SectionSmall>
            <TextArea
              rows={6}
              disabled={unitData.closed}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
            />
            <Button
              disabled={unitData.closed}
              onClick={() => submitCode(unitData.unit)}
            >
              {unitData.closed ? "Closed" : "Submit"}
            </Button>

            {unitData.closed && !unitData.unlocked && (
              <UnlockForm
                onSubmit={(e) => {
                  e.preventDefault();
                  requestUnlock(unitData.unit);
                }}
              >
                <Button type="submit">Request Reopen</Button>
              </UnlockForm>
            )}

            {unitData.results && (
              <>
                <SectionSmall>Result</SectionSmall>
                <Table>
                  <thead>
                    <tr>
                      <th>Score</th>
                      <th>Passed</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{unitData.results.score}</td>
                      <td>{unitData.results.passed ? "Yes" : "No"}</td>
                    </tr>
                  </tbody>
                </Table>
              </>
            )}

            <SectionSmall>Feedback</SectionSmall>
            <TextArea
              rows={4}
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
            />
            <Button onClick={() => submitFeedback(unitData.unit)}>
              Send Feedback
            </Button>
          </Card>
        );
      }
    }
  };

  return (
        <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
      <Page>
        <TopNavbar onLogout={async() => { await signOut(auth); navigate('/s-loginPage'); }} />
        
        <Layout>
          <Sidebar>
            <ToggleWrapper>
                  <SwitchLabel>
                    <SwitchInput type="checkbox" checked={theme==='dark'} onChange={toggleTheme} />
                    <Slider isDark={theme === 'dark'}>
                      <FiMoon className="icon moon" />
                      <FiSun className="icon sun" />
                    </Slider>
                  </SwitchLabel>
                </ToggleWrapper>
            <Section>Student Dashboard</Section>
            {[
              "Profile",
              "Attendance",
              "Syllabus",
              "Schedule",
              ...assignments.map(a => a.unit)
            ].map(tab => (
              <NavItem
                key={tab}
                active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                <IconWrapper>{tabIcon(tab)}</IconWrapper>
                {tab}
              </NavItem>
            ))}
          </Sidebar>

          <Main>{renderContent()}</Main>
        </Layout>
        <Footer />
      </Page>
    </ThemeProvider>
  );
}

// Styled Components
const Page = styled.div`
  display: flex;
  flex-direction: column;
  background: ${p => p.theme.background};
  color: ${p => p.theme.text};
  min-height: 120vh;
  padding-top: 40px;

`;
const ToggleWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 20px 0;
  background: ${p => p.theme.sidebarBg};
    @media (max-width: 768px) { padding: 0px; border-radius: 30px;  }

`;
const Layout = styled.div`
  display: flex;
  flex: 1;
  @media (max-width: 768px) { flex-direction: column; }
`;
const Sidebar = styled.nav`
  width: 220px;
  background: ${p => p.theme.sidebarBg};
  padding: 80px 20px;
  color: ${p => p.theme.sidebarColor};
  @media (max-width: 768px) {
    width: 100%; display:flex; flex-wrap:wrap; justify-content:center; gap:10px;
  }
`;
const TopBar = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 10px 20px;
  background: ${p => p.theme.mainBg};
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
`;

const Section = styled.h4`
  font-size:1rem; font-weight:600;
  color:${p => p.theme.sidebarColor}; margin-bottom:10px;
  @media (max-width:768px) { width:100%; text-align:center; }
`;

const SwitchLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
`;
const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  &:checked + span {
    background-color: ${p => p.theme.mainBg};
  }
  &:checked + span:before {
    transform: translateX(26px);
  }
`;
const Slider = styled.span`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  background-color: #fff;
  border: 2px solid #7620ff;
  border-radius: 34px;
  transition: 0.4s ease;
  cursor: pointer;

  .icon {
    font-size: 18px;
    transition: 0.4s;
  }

  .sun {
    color: #f39c12;
    opacity: ${props => (props.isDark ? 1 : 0)};
  }

  .moon {
    color: #3498db;
    opacity: ${props => (props.isDark ? 0 : 1)};
  }
`;


const NavItem = styled.div`
  display:flex; align-items:center; gap:8px;
  padding:10px; margin:6px 0; border-radius:6px;
  cursor:pointer; font-weight:500;
  background: ${p => p.active ? p.theme.mainBg : p.theme.sidebarHover};
  color: ${p => p.active ? p.theme.text : p.theme.sidebarColor};
  transition: background 0.3s;
  &:hover { background: ${p => p.theme.mainBg}; color: ${p => p.theme.text}; }
  @media(max-width:768px) { flex:1 0 45%; max-width:140px; }
`;
const Main = styled.main`
  flex:1; background:${p => p.theme.mainBg}; padding:80px 20px 20px;
  @media (max-width:768px) { padding:20px; }
`;
const IconWrapper = styled.span` font-size:1.1rem; `;
const ThemeToggle = styled.button`
  background:transparent; border:none; cursor:pointer;
  color:${p => p.theme.text}; font-size:1rem;
  display:flex; align-items:center; gap:6px;
`;
const Card = styled.div`
  background: ${p => p.theme.cardBg};
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  color: ${p => p.theme.text};
`;
const Field = styled.div`
  margin-bottom: 10px;
`;
const Label = styled.span`
  font-weight: bold;
  margin-right: 5px;
`;
const Note = styled.p`
  font-size: 0.9rem;
  color: #555;
  margin-top: 10px;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th,
  td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  th {
    background: ${p => p.theme.mainBg};
  }
  margin-bottom: 10px;
`;
const Pdf = styled.iframe`
  width: 100%;
  height: 300px;
  border: none;
  margin-bottom: 10px;
`;
const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  margin-bottom: 8px;
`;
const Button = styled.button`
  padding: 8px 16px;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  &:hover {
    background: #580cd2;
  }
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;
const SectionSmall = styled.h4`
  margin-top: 16px;
  margin-bottom: 8px;
  font-size: 1rem;
  color: ${p => p.theme.text};
`;
const UnlockForm = styled.form`
  margin-bottom: 16px;
`;
const Loading = styled.div`
  padding: 50px;
  text-align: center;
  font-size: 1.2rem;
  color: #666;
`;
const SpinnerOverlay = styled.div`position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.8);display:flex;justify-content:center;align-items:center;`;
const spin = keyframes`0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}`;
const Spinner = styled.div`border:4px solid #f3f3f3;border-top:4px solid #7620ff;border-radius:50%;width:40px;height:40px;animation:${spin} 1s linear infinite;`;

const ErrorMsg = styled.div`
  padding: 50px;
  text-align: center;
  font-size: 1.2rem;
  color: red;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;
const Avatar = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 16px;
`;
const AvatarPlaceholder = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: #fff;
`;
const ProfileInfo = styled.div`
  h2 { margin: 0; font-size: 1.5rem; }
  p { margin: 4px 0; color: ${p => p.theme.subText}; }
`;
const AssignmentList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;
const AssignmentItem = styled.li`
  padding: 8px 0;
  border-bottom: 1px solid ${p => p.theme.border};
  &:last-child { border-bottom: none; }
`;
const ProgressSection = styled.div`
  margin-bottom: 16px;
  p { margin: 0 0 8px; font-size: 0.9rem; font-weight: 500; }
`;
const ProgressBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background: ${p => p.theme.border};
  border-radius: 4px;
  overflow: hidden;
`;
const ProgressBarFill = styled.div`
  height: 100%;
  background: ${p => p.theme.buttonBg};
  transition: width 0.5s ease;
`;
const ProfileContainer = styled.div`
  display: flex;
  justify-content: left;
  padding-top: 40px;
`;