import React, { useEffect, useState, useContext } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../Pages/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
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
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substr(0,7));
  const [payrollData, setPayrollData] = useState([]);
  const [projectsData, setProjectsData] = useState({ completed: [], inProgress: [] });

  // Project editing state
  const [editProjIdx, setEditProjIdx] = useState(null);
  const [editProjData, setEditProjData] = useState({ status: '', timeConsumed: '', percentage: '' });

  const userId = auth.currentUser?.displayName;

  // Ensure arrays
  const projects = Array.isArray(profile?.projects) ? profile.projects : [];
  const tasks = Array.isArray(profile?.tasks) ? profile.tasks : [];

  // Fetch profile & split projects
  useEffect(() => {
    if (!userId) return navigate('/login');
    const ref = doc(db, 'users', userId);
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        const projs = Array.isArray(data.projects) ? data.projects : [];
        setProjectsData({
          completed: projs.filter(p => p.status === 'Completed'),
          inProgress: projs.filter(p => p.status !== 'Completed'),
        });
      }
    });
    return unsub;
  }, [userId, navigate]);

  // Filter payrolls by month
  useEffect(() => {
    if (!profile) return;
    const allPayrolls = profile.payrolls || [];
    const [year, month] = selectedMonth.split('-').map(Number);
    setPayrollData(
      allPayrolls.filter(p => {
        const dt = p.periodStart.toDate ? p.periodStart.toDate() : new Date(p.periodStart);
        return dt.getFullYear() === year && dt.getMonth() + 1 === month;
      })
    );
  }, [selectedMonth, profile]);

  // Open project edit modal
  const openEditModal = (idx) => {
    const proj = projects[idx];
    setEditProjIdx(idx);
    setEditProjData({
      status: proj.status,
      timeConsumed: proj.timeConsumed || '',
      percentage: proj.percentage || '',
    });
  };

  // Save project update
  const saveProjectUpdate = async () => {
    const updated = [...profile.projects];
    updated[editProjIdx] = {
      ...updated[editProjIdx],
      status: editProjData.status,
      timeConsumed: Number(editProjData.timeConsumed),
      percentage: Number(editProjData.percentage),
    };
    const ref = doc(db, 'users', userId);
    await updateDoc(ref, { projects: updated });
    setEditProjIdx(null);
  };

  // Handle individual task status change
  const handleTaskStatusChange = async (taskIdx, newStatus) => {
    if (!profile) return;
    const updatedTasks = [...tasks];
    updatedTasks[taskIdx] = {
      ...updatedTasks[taskIdx],
      status: newStatus,
      completedAt: newStatus === 'Completed' ? new Date() : null,
    };
    const ref = doc(db, 'users', userId);
    await updateDoc(ref, { tasks: updatedTasks });
  };

  // AI insights
  const callAi = async () => {
    setAiLoading(true);
    try {
      const payload = { projects: projectsData, role, month: selectedMonth };
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const { text } = await res.json();
      setAiResult(text);
    } catch {
      setAiResult('Error generating insights.');
    }
    setAiLoading(false);
  };

  // Export payroll
  const exportToExcel = () => {
    if (!payrollData.length) return;
    const wsData = payrollData.map((p, idx) => {
      const start = p.periodStart.toDate ? p.periodStart.toDate() : new Date(p.periodStart);
      const end   = p.periodEnd.toDate   ? p.periodEnd.toDate()   : new Date(p.periodEnd);
      return {
        '#': idx + 1,
        'Period Start': start.toLocaleDateString(),
        'Period End':   end.toLocaleDateString(),
        'Basic Salary': p.basicSalary,
        'Allowances':   p.allowances,
        'Gross Pay':    p.grossPay,
        'Tax Amount':   p.taxAmount,
        'Net Pay':      p.netPay,
      };
    });
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
    XLSX.writeFile(wb, `Payroll_${userId}_${selectedMonth}.xlsx`);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (!profile) return <Loading>Loading...</Loading>;

  const totalProjects = projectsData.completed.length + projectsData.inProgress.length;

  return (
    <Container>
      <TopNavbar />
      <Content>
        <Header>Welcome, {profile.name}</Header>

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
                <PayrollTable>
                  <thead>
                    <tr>
                      <th>#</th><th>Period Start</th><th>Period End</th>
                      <th>Basic Salary</th><th>Allowances</th><th>Gross Pay</th>
                      <th>Tax Amount</th><th>Net Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollData.map((p, idx) => {
                      const start = p.periodStart.toDate ? p.periodStart.toDate() : new Date(p.periodStart);
                      const end   = p.periodEnd.toDate   ? p.periodEnd.toDate()   : new Date(p.periodEnd);
                      return (
                        <tr key={idx}>
                          <td>{idx+1}</td>
                          <td>{start.toLocaleDateString()}</td>
                          <td>{end.toLocaleDateString()}</td>
                          <td>{p.basicSalary}</td>
                          <td>{p.allowances}</td>
                          <td>{p.grossPay}</td>
                          <td>{p.taxAmount}</td>
                          <td>{p.netPay}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </PayrollTable>
              ) : (
                <NoData>No payroll data for {formatMonth(selectedMonth)}</NoData>
              )}
              <ModalActions>
                <Button onClick={exportToExcel} disabled={!payrollData.length}>
                  Download Excel
                </Button>
                <Button variant="secondary" onClick={() => setShowPayrollModal(false)}>
                  Close
                </Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Performance Modal */}
        {showPerformanceModal && (
          <>
            <ModalOverlay>
              <ModalContent>
                <ModalHeader>Performance & Projects for {formatMonth(selectedMonth)}</ModalHeader>
                <MetricsGrid>
                  <MetricCard>
                    <MetricValue>{projectsData.completed.length}</MetricValue>
                    <MetricLabel>Completed</MetricLabel>
                  </MetricCard>
                  <MetricCard>
                    <MetricValue>
                      {totalProjects ? Math.round(projectsData.completed.length / totalProjects * 100) : 0}%
                    </MetricValue>
                    <MetricLabel>Completion Rate</MetricLabel>
                  </MetricCard>
                  <MetricCard>
                    <MetricValue>{projectsData.inProgress.length}</MetricValue>
                    <MetricLabel>In Progress</MetricLabel>
                  </MetricCard>
                </MetricsGrid>

                <ProjectDetailsTable>
                  <thead>
                    <tr>
                      <th>#</th><th>Project</th><th>Status</th><th>Tasks</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((proj, idx) => (
                      <tr key={idx}>
                        <td>{idx+1}</td>
                        <td>{proj.name}</td>
                        <td>{proj.status}</td>
                        <td>{(proj.tasks||[]).length}</td>
                        <td>
                          <ActionBtn onClick={() => openEditModal(idx)}>Edit</ActionBtn>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <thead>
                    <tr>
                      <th>#</th><th>Tasks</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task, idx) => (
                      <tr key={idx}>
                        <td>{idx+1}</td>
                        <td>{task.chapter}</td>
                        <td>
                          <FormRow>
                            <Select
                              value={task.status}
                              onChange={e => handleTaskStatusChange(idx, e.target.value)}
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </Select>
                          </FormRow>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </ProjectDetailsTable>

                <ModalActions>
                  <Button variant="secondary" onClick={() => setShowPerformanceModal(false)}>
                    Close
                  </Button>
                </ModalActions>
              </ModalContent>
            </ModalOverlay>

            {editProjIdx !== null && (
              <ModalOverlay>
                <ModalContent>
                  <ModalHeader>Edit Project</ModalHeader>
                  <FormRow>
                    <label>Status</label>
                    <Select
                      value={editProjData.status}
                      onChange={e => setEditProjData(d => ({ ...d, status: e.target.value }))}
                    >
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </Select>
                  </FormRow>
                  <FormRow>
                    <label>Time Consumed</label>
                    <Input
                      type="number"
                      value={editProjData.timeConsumed}
                      onChange={e => setEditProjData(d => ({ ...d, timeConsumed: e.target.value }))}
                    />
                  </FormRow>
                  <FormRow>
                    <label>Completion %</label>
                    <Input
                      type="number"
                      value={editProjData.percentage}
                      onChange={e => setEditProjData(d => ({ ...d, percentage: e.target.value }))}
                    />
                  </FormRow>
                  <ModalActions>
                    <Button onClick={saveProjectUpdate}>Save</Button>
                    <Button variant="secondary" onClick={() => setEditProjIdx(null)}>
                      Cancel
                    </Button>
                  </ModalActions>
                </ModalContent>
              </ModalOverlay>
            )}
          </>
        )}

        {/* AI Modal */}
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
                {aiLoading ? (
                  <p>Generating insights…</p>
                ) : !aiResult ? (
                  <Button onClick={callAi}>Run AI</Button>
                ) : (
                  <AiResultBox>{aiResult}</AiResultBox>
                )}
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

// Styled Components (unchanged)
const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
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
const ModalContent = styled.div`
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
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
const NoData = styled.div`
  padding: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
  margin-bottom: 20px;
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
const ActionBtn = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #7620ff;
  color: #fff;
  cursor: pointer;
`;
const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;
const Button = styled.button`
  padding: 10px 20px;
  background: ${(p) => (p.variant === "secondary" ? "#ccc" : "#7620ff")};
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;
const FormRow = styled.div`
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
`;
const Select = styled.select`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;
const Input = styled.input`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;
const Loading = styled.div`
  padding: 50px;
  text-align: center;
  font-size: 1.2rem;
  color: #666;
`;
