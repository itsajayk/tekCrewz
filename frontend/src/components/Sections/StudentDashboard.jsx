import React, { useEffect, useState, useContext, useCallback  } from "react";
import styled, { ThemeProvider, keyframes } from "styled-components";  // <-- ThemeProvider here
import { Link, useNavigate } from "react-router-dom";
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
  FiMoon,
  FiMail
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
  const { userId: authUid } = useContext(AuthContext);

  const [data, setData] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [activeTab, setActiveTab] = useState("Profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');
  const [quizzes, setQuizzes] = useState([]);
  const [modalMsg, setModalMsg] = useState('');
  const [showModal, setShowModal] = useState(false);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  const closeModal = () => setShowModal(false);

    const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // 1️⃣ candidates → prof → dbId
      const candRes = await fetch(`${API_BASE_URL}/api/candidates`);
      const candidates = candRes.ok ? await candRes.json() : [];
      const myEmail = auth.currentUser?.email?.toLowerCase();
      const prof = candidates.find(c => c.email?.toLowerCase() === myEmail) || {};
      const dbId = prof.studentId;
      if (!dbId) {
        setError("Unable to find your student record.");
        return;
      }

      // 2️⃣ attendance
      const attRes = await fetch(`${API_BASE_URL}/api/students/${dbId}/attendance`);
      const attendance = attRes.ok ? await attRes.json() : [];

      // 3️⃣ course docs
      const docsRes = await fetch(`${API_BASE_URL}/api/courses/COURSE1/docs`);
      let docs = [];
      if (docsRes.ok) {
        const obj = await docsRes.json();
        docs = Object.entries(obj).map(([type, url]) => ({ type, url }));
      }

      // 4️⃣ assignments
      const asnRes = await fetch(`${API_BASE_URL}/api/assignments/${dbId}`);
      let assignments = asnRes.ok ? await asnRes.json() : [];

      // closed/unlocked flags
      const now = new Date();
        assignments = assignments.map(a => {
          // closedAt comes from server as `closed: Boolean(a.closedAt && now > a.closedAt)`
          const closedByTime = a.closedAt ? now > new Date(a.closedAt) : false;
          const unlockedUntil = a.unlockedUntil ? new Date(a.unlockedUntil) : null;
          const isUnlocked = unlockedUntil && unlockedUntil > now;
          return {
            ...a,
            // only closed if past closedAt AND NOT currently unlocked
            closed: closedByTime && !isUnlocked,
            unlocked: Boolean(isUnlocked)
          };
        });


      setData({
        dbId,
        candidateName: prof.candidateName || "New Student",
        email: prof.email || "",
        mobile: prof.mobile || "",
        candidatePic: prof.candidatePic || prof.photoUrl || "",
        attendance,
        docs,
        assignments
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, authUid]);

    // ② run once on mount
      useEffect(() => {
    if (!authUid) {
      navigate("/s-loginPage");
      return;
        }
        fetchAll();
      }, [authUid, navigate, fetchAll]);


  const submitCode = async (unit) => {
    const { dbId } = data;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/assignments/${dbId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unit, code: codeInput })
        }
      );
      if (!res.ok) throw new Error("Submission failed");
      setData((d) => ({
        ...d,
        assignments: d.assignments.map((a) =>
          a.unit === unit ? { ...a, submissionCode: codeInput } : a
        )
      }));
      setCodeInput("");
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };


  const requestUnlock = async unit => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/assignments/${data.dbId}/unlock`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit }),
      }
    );
    if (!res.ok) throw new Error(`Server responded ${res.status}`);

    // Re-fetch that student’s assignments:
    const fresh = await fetch(`${API_BASE_URL}/api/assignments/${data.dbId}`);
    if (!fresh.ok) throw new Error(`Assignments reload failed: ${fresh.status}`);
    const updated = await fresh.json();

    // Recompute closed & unlocked flags just like on load:
    const now = new Date();
    const withFlags = updated.map(a => {
      const closedByTime = a.closedAt ? now > new Date(a.closedAt) : false;
      const unlockedUntil = a.unlockedUntil ? new Date(a.unlockedUntil) : null;
      const isUnlocked = unlockedUntil && unlockedUntil > now;

      return {
        ...a,
        closed: closedByTime && !isUnlocked,
        unlocked: Boolean(isUnlocked)
      };
    });

    // Update your dashboard state so the UI refreshes:
    setData(d => ({ ...d, assignments: withFlags }));

    setModalMsg('Unlock request sent! Await admin approval.');
    setShowModal(true);
  } catch (err) {
    console.error(err);
    setModalMsg(`Failed to send unlock request: ${err.message}`);
    setShowModal(true);
  }
};




  const submitFeedback = async (unit) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/assignments/${data.dbId}/feedback`,
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

  const mailRequest = (field) => {
    const subject = encodeURIComponent(`${field} Change Request`);
    const body = encodeURIComponent(`Please update my ${field.toLowerCase()} for Student ID: ${data.studentId}`);
    window.location.href = `mailto:business.tekcrewz@gmail.com?subject=${subject}&body=${body}`;
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
      case 'Quiz': return <FiCheckSquare />;
      default: return <FiUnlock />;
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
                  ? `Unit ${a.unit} Results: ${a.results.passed ? 'Passed' : 'Failed'} (${a.results.score || 'Not Attempted'})`
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
      const renderAttendance = () => (
    <Card>
      <h3>Attendance</h3>
      <Table>
        <thead>
          <tr><th>Date</th><th>Status</th></tr>
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
      <Button small icon onClick={() => mailRequest('Attendance')}>
        <FiMail /> Request Change
      </Button>
    </Card>
  );

  const renderDoc = (type) => {
    const doc = docs.find(d => d.type.toLowerCase() === type.toLowerCase());
    return (
    <Card>
    <h3>Course Syllabus</h3>
    {doc
      ? <EmbedWrapper>
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(doc.url)}&embedded=true`}
            width="100%"
            height="100%"
            frameBorder="0"
          />
        </EmbedWrapper>
      : <p>No document available.</p>}
  </Card>
    );
  };

  const renderQuizList = () => (
    <Card>
      <h3>Available Quizzes</h3>
      <ul>
        {quizzes.map(q => (
          <li key={q._id}>
            <Link to={`/student/quiz/${q._id}`}>{q.title}</Link>
          </li>
        ))}
      </ul>
    </Card>
  );

  const renderUnit = (unit) => {
    const u = assignments.find((a) => a.unit === unit);
    if (!u) return null;
    return (
      <Card>
        <h3>Unit: {unit}</h3>

        <SectionSmall>Study Material</SectionSmall>
        {u.studyMaterialUrl ? (
          <>
            <EmbedWrapper>
              <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(u.studyMaterialUrl)}&embedded=true`} width="100%" height="600px" frameBorder="0"/>
            </EmbedWrapper>
            <Button as="a" href={u.studyMaterialUrl} target="_blank">Download PDF</Button>
          </>
        ) : (
          <p>No study material.</p>
        )}

        <SectionSmall>Submit Code</SectionSmall>
        <TextArea rows={6} disabled={u.closed} value={codeInput} onChange={e=>setCodeInput(e.target.value)}/>
        <Button disabled={u.closed} onClick={()=>submitCode(unit)}>{u.closed?"Closed":"Submit"}</Button>

          {u.closed && !u.unlocked && (
          <UnlockForm onSubmit={e=>{e.preventDefault();requestUnlock(unit);}}>
            <Button type="submit">Request Extension</Button>
          </UnlockForm>
        )}

          {u.results && (
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
                  <td>{u.results.score}</td>
                  <td>{u.results.passed ? "Yes" : "No"}</td>
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
          <Button onClick={() => submitFeedback(unit)}>Send Feedback</Button>
        </Card>
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
      case "Unit": renderUnit();
      case "Course Docs": renderDoc()
      case "Syllabus":
      case "Schedule": {
        const doc = docs.find(
          (d) => d.type.toLowerCase() === activeTab.toLowerCase()
        );
        return (
          <Card>
          <h3>Course {activeTab}</h3>
          {doc
            ? <>
                {renderDoc(doc.url)}
                <Button as="a" href={doc.url} target="_blank" rel="noopener noreferrer">Download {activeTab}</Button>
              </>
            : <p>No document available.</p>
          }
        </Card>
        );
      }
        case "Quiz":
          return <Card>
            <h3>Available Quizzes</h3>
            <ul>
              {quizzes.map(q => (
                <li key={q._id}>
                  <Link to={`/student/quiz/${q._id}`}>{q.title}</Link>
                </li>
              ))}
              <SwitchLink onClick={() => navigate('/Quiz')}>
                  Quiz
              </SwitchLink>
            </ul>
          </Card>
      default: {
        const unitData = assignments.find((a) => a.unit === activeTab);
        if (!unitData) return null;
        const u = assignments.find(a => a.unit === activeTab);
        return (
          <Card>
            <h3>Unit: {unitData.unit}</h3>
            <SectionSmall>Study Material</SectionSmall>
            <Pdf/>
            <a
                href={
                  unitData.studyMaterialUrl.startsWith("http")
                    ? unitData.studyMaterialUrl
                    : `https://${unitData.studyMaterialUrl}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                {unitData.studyMaterialUrl}
                {u.closed && !u.unlocked && (
          <UnlockForm onSubmit={e => { e.preventDefault(); requestUnlock(unitData.unit); }}>
            <Button type="submit">Request Extension</Button>
          </UnlockForm>
        )}
              </a>



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
        {showModal && <ModalOverlay onClick={closeModal}><Modal onClick={e=>e.stopPropagation()}><p>{modalMsg}</p><Button onClick={closeModal}>Close</Button></Modal></ModalOverlay>}
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
              "Quiz",
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
  height: 10px;
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

const SwitchLink = styled.p`
  margin-top: 15px;
  color: #7620ff;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const EmbedWrapper = styled.div`
  width: 100%;
  height: 600px;
  margin-bottom: 16px;
`;
const ModalOverlay = styled.div`position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1000;`;
const Modal = styled.div`background:${p=>p.theme.cardBg};padding:20px;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.2);color:${p=>p.theme.text};`;
