import React, { useEffect, useState, useContext } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../Pages/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import * as XLSX from 'xlsx';
import TopNavbar from '../Nav/TopNavbar';
import Footer from './Footer';
import { AuthContext } from '../../contexts/AuthContext';

// Helper to format YYYY-MM to "Month YYYY"
const formatMonth = (ym) => {
  const [year, month] = ym.split('-');
  const date = new Date(year, month - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { role } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substr(0,7));
  const [payrollData, setPayrollData] = useState([]);
  const [performanceData, setPerformanceData] = useState({});
  const [projectsData, setProjectsData] = useState({ completed: [], inProgress: [] });
    //  AI MODAL HOOKS 
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiLoading,   setAiLoading]   = useState(false);
    const [aiResult,    setAiResult]    = useState(null);
  
  const userId = auth.currentUser?.displayName;

  useEffect(() => {
    if (!userId) return navigate('/login');
    const fetchProfile = async () => {
      const ref = doc(db, 'users', userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setProjectsData(data.projects || { completed: [], inProgress: [] });
      }
    };
    fetchProfile();
  }, [userId, navigate]);

  useEffect(() => {
    if (!profile) return;
    const allPayroll = profile.payroll || {};
    setPayrollData(allPayroll[selectedMonth] || []);

    const allPerf = profile.performance || {};
    setPerformanceData(allPerf[selectedMonth] || {});
  }, [selectedMonth, profile]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

    // AI Insights call
    const callAi = async () => {
      setAiLoading(true);
      try {
        const payload = { performance: performanceData, projects: projectsData, role, month: selectedMonth };
        const res = await fetch('/api/ai/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const { text } = await res.json();
        setAiResult(text);
      } catch (err) {
        setAiResult('Error generating insights.');
      }
      setAiLoading(false);
    };

  const exportToExcel = () => {
    if (!payrollData.length) return;
    const ws = XLSX.utils.json_to_sheet(
      payrollData.map((item, idx) => ({ '#': idx + 1, Description: item.description, Amount: item.amount }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
    XLSX.writeFile(wb, `Payroll_${userId}_${selectedMonth}.xlsx`);
  };

  if (!profile) return <Loading>Loading...</Loading>;

  // calculate project metrics
  const totalProjects = projectsData.completed.length + projectsData.inProgress.length;
  const completionPercent = totalProjects
    ? Math.round((projectsData.completed.length / totalProjects) * 100)
    : 0;

  return (
    <Container>
      <TopNavbar />
      <Content>
        <Header>Welcome, {profile.name}</Header>

        <ProfileSection>
          <Avatar src={profile.photoURL} alt="Profile" />
          <InfoGrid>
            {/* existing profile fields */}
          </InfoGrid>
        </ProfileSection>

        <FeatureSection>
          <Card onClick={() => setShowPayrollModal(true)}>
            <CardIcon>💰</CardIcon>
            <CardTitle>Payroll</CardTitle>
          </Card>
          <Card onClick={() => setShowAiModal(true)}>
          <CardIcon>🤖</CardIcon>
          <CardTitle>Check Insights</CardTitle>
        </Card>
          <Card onClick={() => setShowPerformanceModal(true)}>
            <CardIcon>🎯</CardIcon>
            <CardTitle>Performance</CardTitle>
          </Card>
          <Card onClick={handleLogout}>
            <CardIcon>🚪</CardIcon>
            <CardTitle>Logout</CardTitle>
          </Card>
        </FeatureSection>

        {/* Payroll Modal */}
        {showPayrollModal && (
          <ModalOverlay>
            <ModalContent>
              <ModalHeader>Payroll for {formatMonth(selectedMonth)}</ModalHeader>
              <MonthPickerWrapper>
                <MonthLabel>Select Month:</MonthLabel>
                <MonthInput
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                />
              </MonthPickerWrapper>
              {payrollData.length ? (
                <PayrollTable>...</PayrollTable>
              ) : (
                <NoData>No payroll data available for {formatMonth(selectedMonth)}</NoData>
              )}
              <ModalActions>
                <Button onClick={exportToExcel} disabled={!payrollData.length}>Download Excel</Button>
                <Button variant="secondary" onClick={() => setShowPayrollModal(false)}>Close</Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Performance Modal */}
        {showPerformanceModal && (
          <ModalOverlay>
            <ModalContent>
              <ModalHeader>Performance for {formatMonth(selectedMonth)}</ModalHeader>
              <MonthPickerWrapper>
                <MonthLabel>Select Month:</MonthLabel>
                <MonthInput
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                />
              </MonthPickerWrapper>
              <PerformanceContent>
                {/* Tutor metrics */}
                {(role === 'Tutor' || role === 'Dev & Tutor') && (
                  <MetricsGrid>...</MetricsGrid>
                )}
                {/* Developer metrics */}
                {(role === 'Developer Only' || role === 'Dev & Tutor') && (
                  <>
                    <MetricsGrid>...</MetricsGrid>
                    <ProjectSection>
                      <SectionHeader>Projects</SectionHeader>
                      <MetricsGrid>
                        <MetricCard>
                          <MetricValue>{projectsData.completed.length}</MetricValue>
                          <MetricLabel>Completed</MetricLabel>
                        </MetricCard>
                        <MetricCard>
                          <MetricValue>{completionPercent}%</MetricValue>
                          <MetricLabel>Completion Rate</MetricLabel>
                        </MetricCard>
                        <MetricCard>
                          <MetricValue>{projectsData.inProgress.length}</MetricValue>
                          <MetricLabel>In Progress</MetricLabel>
                        </MetricCard>
                      </MetricsGrid>
                      {totalProjects ? (
                        <ProjectDetailsTable>
                          <thead>
                            <tr><th>#</th><th>Project</th><th>Status</th><th>Description</th></tr>
                          </thead>
                          <tbody>
                            {projectsData.completed.concat(projectsData.inProgress).map((proj, idx) => (
                              <tr key={idx}>...
                              </tr>
                            ))}
                          </tbody>
                        </ProjectDetailsTable>
                      ) : (
                        <NoData>No project data available</NoData>
                      )}
                    </ProjectSection>
                  </>
                )}
              </PerformanceContent>
              <ModalActions>
                <Button variant="secondary" onClick={() => setShowPerformanceModal(false)}>Close</Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}

{showAiModal && (
          <ModalOverlay>
            <ModalContent>
              <ModalHeader>AI Insights for {formatMonth(selectedMonth)}</ModalHeader>

              <MonthPickerWrapper>
                <MonthLabel>Select Month:</MonthLabel>
                <MonthInput
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                />
              </MonthPickerWrapper>

              <AiContent>
                {aiLoading && <p>Generating insights…</p>}
                {!aiLoading && !aiResult && (
                  <Button onClick={callAi}>Run AI</Button>
                )}
                {aiResult && <AiResultBox>{aiResult}</AiResultBox>}
              </AiContent>

              <ModalActions>
                <Button variant="secondary" onClick={() => setShowAiModal(false)}>
                  Close
                </Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </Content>
      <Footer />
    </Container>
  );
};

export default DashboardPage;

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 150vh;
  background: #f7f7f7;
`;
const Content = styled.div`
  flex: 1;
  padding: 140px;
  max-width: 800px;
  margin: 0 auto;
`;
const Header = styled.h1`
  font-size: 2rem;
  margin-bottom: 20px;
  color: #333;
`;
const ProfileSection = styled.div`
  display: flex;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
`;
const Avatar = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 30px;
`;
const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  row-gap: 10px;
  column-gap: 15px;
`;
const FeatureSection = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 30px;
`;
const Card = styled.div`
  flex: 1 1 150px;
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-5px);
  }
`;
const CardIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 10px;
`;
const CardTitle = styled.h2`
  font-size: 1.2rem;
  color: #333;
`;
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;
const AiContent = styled.div`
  margin-bottom: 20px;
`;
const AiResultBox = styled.pre`
  background: #f4f4f4;
  padding: 15px;
  border-radius: 5px;
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
`;
const ModalContent = styled.div`
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  width: 100%;
  max-width: 600px;
`;
const ModalHeader = styled.h3`
  margin-bottom: 15px;
`;
const MonthPickerWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;
const MonthLabel = styled.span`
  margin-right: 10px;
  font-weight: bold;
`;
const MonthInput = styled.input`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
`;
const PayrollTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  th,
  td {
    padding: 8px;
    border: 1px solid #ddd;
    text-align: left;
  }
  th {
    background: #f0f0f0;
  }
`;
const NoData = styled.div`
  padding: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
  margin-bottom: 20px;
`;
const PerformanceContent = styled.div`
  margin-bottom: 20px;
`;
const ProjectSection = styled.div`
  margin-top: 20px;
`;
const SectionHeader = styled.h4`
  margin-bottom: 10px;
  font-size: 1.2rem;
  color: #333;
`;
const ProjectDetailsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  th,
  td {
    padding: 8px;
    border: 1px solid #ddd;
    text-align: left;
  }
  th {
    background: #f0f0f0;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;
const MetricCard = styled.div`
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
`;
const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 5px;
`;
const MetricLabel = styled.div`
  color: #555;
`;
const Separator = styled.hr`
  border: none;
  border-top: 1px solid #eee;
  margin: 20px 0;
`;
const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;
const Button = styled.button`
  padding: 10px 20px;
  background: ${({ variant }) =>
    variant === "secondary" ? "#ccc" : "#7620ff"};
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
const Loading = styled.div`
  padding: 50px;
  text-align: center;
  font-size: 1.2rem;
  color: #666;
`;
