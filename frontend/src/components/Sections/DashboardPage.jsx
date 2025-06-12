import React, { useEffect, useState, useContext } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../Pages/firebase';
import {
  doc,
  getDocs,
  onSnapshot,
  collectionGroup,
  query,
  where,
  updateDoc,
  serverTimestamp,
  addDoc,
  writeBatch,
  doc as fbDoc,
  collection as fbCol,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import axios from 'axios';
import * as XLSX from 'xlsx';
import TopNavbar from '../Nav/TopNavbar';
import Footer from './Footer';
import { AuthContext } from '../../contexts/AuthContext';
import QuizEditor from './QuizEditor'; // NEW

// Helper to format YYYY-MM to "Month YYYY"
const formatMonth = (ym) => {
  const [year, month] = ym.split('-');
  const date = new Date(year, month - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const DashboardPage = () => {
  const API_BASE_URL = "https://tekcrewz.onrender.com";
  const navigate = useNavigate();
  const { role } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);

  // Payroll / Performance / AI state
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const [loading, setLoading] = useState(false);     // NEW
  const [quizState, setQuizState] = useState({ title: '', questions: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substr(0,7));
  const [payrollData, setPayrollData] = useState([]);
  const [projectsData, setProjectsData] = useState({ completed: [], inProgress: [] });

  // Project editing state
  const [editProjIdx, setEditProjIdx] = useState(null);
  const [editProjData, setEditProjData] = useState({ status: '', timeConsumed: '', percentage: '' });

  const userId = auth.currentUser?.displayName;

const [showAttendanceModal, setShowAttendanceModal] = useState(false);
const [batches, setBatches] = useState([]);
const [courses, setCourses] = useState([]);
const [selectedBatch, setSelectedBatch] = useState('');
const [selectedCourse, setSelectedCourse] = useState('');
const [selectedTrainingMode, setSelectedTrainingMode] = useState('');
const [filteredCandidates, setFilteredCandidates] = useState([]);
const [absentCandidates, setAbsentCandidates] = useState([]);
const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().substr(0, 10));
const [savingAttendance, setSavingAttendance] = useState(false);
const [showSuccessModal, setShowSuccessModal] = useState(false);
const [showWarningModal, setShowWarningModal] = useState(false);

  // ONLY tutors: IDs starting EMPDT or EMPTR
  const isTutor = userId?.startsWith('EMPDT') || userId?.startsWith('EMPTR');

  // Assignments state for tutors
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [selectedStudentForAssign, setSelectedStudentForAssign] = useState('');
  const [resultsInputs, setResultsInputs] = useState({}); 
  const [assignLoading, setAssignLoading] = useState(false);
  // ── For Assignments dropdown ─────────────────────────────────────────
  const [studentsList, setStudentsList] = useState([]); // new
  const [trainingModes, setTrainingModes] = useState([]);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [unlockRequests, setUnlockRequests] = useState([]);
  const [approveLoading, setApproveLoading] = useState(false);    // new: loading state
  const [approveToast, setApproveToast] = useState('');           // new: toast message
  const [showApproveToast, setShowApproveToast] = useState(false);// new

  const [selectedBatchForAssign, setSelectedBatchForAssign] = useState('');               // new
  const [selectedCourseForAssign, setSelectedCourseForAssign] = useState('');             // new
  const [selectedTrainingModeForAssign, setSelectedTrainingModeForAssign] = useState(''); // new
  const [filteredAssignCandidates, setFilteredAssignCandidates] = useState([]);           // new

  const [toasts, setToasts] = useState([]);
  

  const [newAssignment, setNewAssignment] = useState({
    unit: '',
    studyMaterialUrl: '',
    studyMaterialFile: null,
    closeDays: 3
  });

  // Ensure arrays exist
  const projects = Array.isArray(profile?.projects) ? profile.projects : [];
  const tasks = Array.isArray(profile?.tasks) ? profile.tasks : [];

  const pushToast = (message, type='success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

useEffect(() => {
    axios.get(`${API_BASE_URL}/api/candidates`)
      .then(res => {
        const unique = [...new Set(res.data
          .map(c => {
            const m = c.studentId.match(/BT(\d+)FS/);
            return m ? m[1] : null;
          })
          .filter(b => b))];
        setBatches(unique.sort((a, b) => a - b));
      })
      .catch(console.error);
  }, []); // new


// Fetch all courses from Mongo (using the correct field name)
useEffect(() => {
  axios.get(`${API_BASE_URL}/api/candidates`)
    .then(res => {
      // use c.courseRegistered, not candidateCourseName
      const uniques = [...new Set(res.data.flatMap(c => c.courseRegistered))];
      setCourses(uniques);
    })
    .catch(console.error);
}, []);

    useEffect(() => {
      axios.get(`${API_BASE_URL}/api/candidates`)
        .then(res => {
          const modes = [...new Set(res.data.map(c => c.trainingMode))];
          setTrainingModes(modes);
        })
        .catch(console.error);
    }, []);

  // Reload candidates when filters change
  useEffect(() => {
    if (!selectedBatch || !selectedCourse || !selectedTrainingMode) {
      setFilteredCandidates([]);
      return;
    }
    axios.get('/api/candidates')
      .then(res => {
        const list = res.data.filter(c =>
          c.studentId.includes(`BT${selectedBatch}FS`) &&          // filter by batch
          Array.isArray(c.courseRegistered) &&                      // ensure array
          c.courseRegistered.includes(selectedCourse) &&           // change: use includes for array
          c.trainingMode === selectedTrainingMode                  // filter by mode
        );
        setFilteredCandidates(list);
        setAbsentCandidates([]);
      })
      .catch(console.error);
  }, [selectedBatch, selectedCourse, selectedTrainingMode]); // new

// CHANGED: Reset quiz when student changes
useEffect(() => {
  setQuizState({ title: '', questions: [] });
  setAssignmentsList([]);
  setResultsInputs({});
  setUnlockRequests([]); // NEW
}, [selectedStudentForAssign]);

    // Fetch all candidates for the “Mark Assignments” dropdown
      useEffect(() => {
        if (!isTutor) return; 
        axios.get(`${API_BASE_URL}/api/candidates`)
          .then(res => setStudentsList(res.data))
          .catch(console.error);
      }, [isTutor]);

      useEffect(() => {
      axios.get(`${API_BASE_URL}/api/candidates`)
        .then(res => {
          setBatches([...new Set(res.data.map(c => {
            const m = c.studentId.match(/BT(\d+)FS/);
            return m?.[1];
          }).filter(Boolean))].sort((a,b)=>a-b));
          setCourses([...new Set(res.data.flatMap(c => c.courseRegistered))]);
          setTrainingModes([...new Set(res.data.map(c => c.trainingMode))]);
        })
        .catch(console.error);
    }, []);

    const handleAssignmentChange = async (e) => {
  const aid = e.target.value;
  const asn = assignmentsList.find(a => a._id === aid) || {};
  
  // Reset quiz state initially
  setQuizState({ assignmentId: aid, unit: asn.unit || '', title: '', questions: [] });

  if (!aid) return;

  try {
    const res = await axios.get(`${API_BASE_URL}/api/quizzes/${aid}`);
    setQuizState({
      assignmentId: res.data.assignmentId,
      unit: res.data.unit || asn.unit || '',
      title: res.data.title || '',
      questions: res.data.questions || []
    });
  } catch (err) {
    // No quiz found — keep title/questions empty
    setQuizState(prev => ({
      ...prev,
      // title and questions remain empty
    }));
  }
};


    // ── Filter candidates on dropdown/radio change ────────────────────────────────────
useEffect(() => {                                                                        // new
  if (!selectedBatchForAssign || !selectedCourseForAssign || !selectedTrainingModeForAssign) {
    setFilteredAssignCandidates([]);
    return;
  }
  axios.get(`${API_BASE_URL}/api/candidates`)
    .then(res => {
      setFilteredAssignCandidates(res.data.filter(c =>
        c.studentId.includes(`BT${selectedBatchForAssign}FS`) &&
        Array.isArray(c.courseRegistered) &&
        c.courseRegistered.includes(selectedCourseForAssign) &&
        c.trainingMode === selectedTrainingModeForAssign
      ));
    })
    .catch(console.error);
}, [selectedBatchForAssign, selectedCourseForAssign, selectedTrainingModeForAssign]);


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

// Example: approving unlock for a particular assignment unit for a student
const approveUnlock = async (studentId, unit) => {
  setApproveLoading(true); // new
  try {
    // studentId here must be something like "BT7FS001"
    const res = await axios.post(
      `${API_BASE_URL}/api/admin/students/${studentId}/approveUnlock`,
      { unit }
    );
    // if backend returns 204 or OK:
    pushToast('Unlock approved'); // or use your toast system
    // Refetch assignments and pending unlocks:
    const { data: assignments } = await axios.get(`${API_BASE_URL}/api/assignments/${studentId}`);
    setAssignmentsList(assignments);
    // update unlockRequests list:
    const pending = assignments.filter(a => a.unlockRequested);
    setUnlockRequests(pending);
  } catch (err) {
    console.error('Failed to approve unlock:', err.response?.data || err);
    const msg = err.response?.data?.error || 'Error approving unlock';
    pushToast(msg, 'error');
  } finally {
    setApproveLoading(false); // new
  }
};


      const submitBatchAttendance = async () => {
      setSavingAttendance(true);
      try {
        const batch = writeBatch(db);
        filteredCandidates.forEach(c => {
          const ref = fbDoc(fbCol(db, 'attendance'));
          const status = absentCandidates.includes(c._id) ? 'Absent' : 'Present'; // new
          batch.set(ref, {
            studentId: c.studentId,
            candidateName: c.candidateName,
            batchNumber: selectedBatch,
            courseRegistered: selectedCourse,
            trainingMode: selectedTrainingMode,
            status,                                                  // new
            date: attendanceDate,
            createdAt: serverTimestamp(),
          });
        });
        await batch.commit();
        setShowSuccessModal(true);
      } catch (err) {
        console.error('Attendance save error:', err);
        setShowWarningModal(true);
      } finally {
        setSavingAttendance(false);
      }
    };

    // CHANGED: hit the admin‐quiz upsert endpoint
    const saveQuiz = async () => {
  if (!quizState.title || quizState.questions.length === 0) {
    return alert('Quiz must have a title and at least one question.');
  }
  if (!quizState.assignmentId) {
    return alert('No assignment selected for this quiz.');
  }
  try {
    const payload = {
      assignmentId: quizState.assignmentId,
      unit: quizState.unit,
      title: quizState.title,
      questions: quizState.questions,
    };
    const res = await axios.post(
      `${API_BASE_URL}/api/admin/quizzes`,
      payload
    );
    setQuizState(res.data);
    setIsEditingQuiz(false);
    pushToast('Quiz saved successfully');
  } catch (err) {
    console.error(err);
    alert('Failed to save quiz');
  }
};
      
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

  // Assignments (Tutor) – Fetch whenever a student is selected
  useEffect(() => {
    if (!selectedStudentForAssign) return;
    setAssignLoading(true);
    axios.get(`${API_BASE_URL}/api/assignments/${selectedStudentForAssign}`)
      .then(res => {
        // res.data is array of assignments for that student
        setAssignmentsList(res.data);
        // Initialize resultsInputs: { unit1: {score:'', passed:false}, ...}
        const initial = {};
        res.data.forEach(a => {
          initial[a.unit] = {
            score: a.results?.score || '',
            passed: a.results?.passed || false
          };
        });
        setResultsInputs(initial);
      })
      .catch(err => {
        console.error("Failed to fetch assignments:", err);
        setAssignmentsList([]);
        setResultsInputs({});
      })
      .finally(() => setAssignLoading(false));
  }, [selectedStudentForAssign]);

  // After student requests unlock, tutor should see it:
useEffect(() => {
  if (!isTutor) return;
  // Periodically or on opening “Assignment Settings” modal, fetch assignments:
  if (selectedStudentForAssign) {
    axios.get(`${API_BASE_URL}/api/assignments/${selectedStudentForAssign}`)
      .then(res => {
        // find those with unlockRequested === true
        const pending = res.data.filter(a => a.unlockRequested);
        setUnlockRequests(pending);  // new: store pending unlock requests
      });
  }
}, [showAssignmentsModal, selectedStudentForAssign]);


  const createAssignment = async () => {
  if (!selectedStudentForAssign) { pushToast('Select a student', 'error'); return; } // CHANGED
  setAssignLoading(true);
  try {
    const form = new FormData();
    form.append('unit', newAssignment.unit);
    form.append('closeDays', newAssignment.closeDays);
    if (newAssignment.studyMaterialFile) {
      form.append('studyMaterial', newAssignment.studyMaterialFile);
    } else {
      form.append('studyMaterialUrl', newAssignment.studyMaterialUrl);
    }

    await axios.post(
      `/api/admin/students/${selectedStudentForAssign}/manageAssignments`, // CHANGED: use selectedStudentForAssign directly
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    // refresh list
    const { data } = await axios.get(`/api/assignments/${selectedStudentForAssign}`); // CHANGED
    setAssignmentsList(data);
    pushToast('Assignment created');
    setNewAssignment({ unit:'', studyMaterialUrl:'', studyMaterialFile:null, closeDays:3 });
  } catch (err) {
    console.error(err);
    pushToast('Failed to create assignment', 'error');
  } finally {
    setAssignLoading(false); // CHANGED: use assignLoading state
  }
};



  // Save a single assignment result
  const saveAssignmentResult = async (unit) => {
    if (!selectedStudentForAssign) return;
    const { score, passed } = resultsInputs[unit];
    try {
      await axios.post(
        `${API_BASE_URL}/api/admin/students/${selectedStudentForAssign}/enterResults`,
        { unit, results: { score: Number(score), passed } }
      );
      // Optionally, show a small “saved” indicator or reload assignmentsList
      // For now, just reload that student’s assignments:
      const res = await axios.get(`${API_BASE_URL}/api/assignments/${selectedStudentForAssign}`);
      setAssignmentsList(res.data);
      // Ensure resultsInputs updated from new data
      const updatedInputs = { ...resultsInputs };
      res.data.forEach(a => {
        updatedInputs[a.unit] = {
          score: a.results?.score || '',
          passed: a.results?.passed || false
        };
      });
      setResultsInputs(updatedInputs);
    } catch (err) {
      console.error("Failed to save assignment result:", err);
      alert("Unable to save result.");
    }
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
          {isTutor && (
            <>
              <Card onClick={() => setShowAttendanceModal(true)}>
                <CardIcon>📝</CardIcon>
                <CardTitle>Mark Attendance</CardTitle>
              </Card>
              <Card onClick={() => setShowAssignmentsModal(true)}>
                <CardIcon>📚</CardIcon>
                <CardTitle>Assignment Settings</CardTitle>
              </Card>
            </>
          )}
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

                    {/* Attendance Modal */}
              {showAttendanceModal && (
          <ModalOverlay onClick={() => setShowAttendanceModal(false)}>
            <ModalContent onClick={e => e.stopPropagation()}>
              <ModalHeader>Mark Attendance</ModalHeader> {/* change */}

              {/* Batch Selector */}
              <FormRow>
                <label>Batch</label>
                <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                  <option value="">Select Batch</option>
                  {batches.map(b => <option key={b} value={b}>{`Batch ${b}`}</option>)}
                </select>
              </FormRow>

              {/* Course Selector */}
              <FormRow>
                <label>Course</label>
                <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormRow>

              {/* Training Mode Selector */}
              <FormRow>
                <label>Training Mode</label> {/* new */}
                <div>
                  <label>
                    <input
                      type="radio"
                      name="trainingMode"
                      value="Online"
                      checked={selectedTrainingMode === 'Online'}
                      onChange={e => setSelectedTrainingMode(e.target.value)}
                    /> Online
                  </label>
                  <label style={{ marginLeft: '1rem' }}>
                    <input
                      type="radio"
                      name="trainingMode"
                      value="On-campus@ Thanjavur"
                      checked={selectedTrainingMode === 'On-campus@ Thanjavur'}
                      onChange={e => setSelectedTrainingMode(e.target.value)}
                    /> On-campus @ Thanjavur
                  </label>
                </div>
              </FormRow>

              {/* Candidates List */}
              <AttendanceList>
                <thead>
                  <tr>
                    <th>Absent?</th>
                    <th>Candidate ID</th>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map(c => (
                    <tr key={c._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={absentCandidates.includes(c._id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setAbsentCandidates([...absentCandidates, c._id]);
                            } else {
                              setAbsentCandidates(absentCandidates.filter(id => id !== c._id));
                            }
                          }}
                        />
                      </td>
                      <td>{c.studentId}</td>
                      <td>{c.candidateName}</td>
                    </tr>
                  ))}
                </tbody>
              </AttendanceList>

              <ModalActions>
                <Button
                  onClick={submitBatchAttendance}
                  disabled={savingAttendance || !filteredCandidates.length}
                >
                  {savingAttendance ? 'Saving…' : 'Submit'}
                </Button>
                <Button variant="secondary" onClick={() => setShowAttendanceModal(false)}>
                  Close
                </Button>
              </ModalActions>

              {/* Success & Warning Modals */}
              {showSuccessModal && (
                <ModalOverlay onClick={() => setShowSuccessModal(false)}>
                  <ModalContent>
                    <ModalHeader>Success</ModalHeader>
                    <p>Attendance marked successfully!</p>
                    <ModalActions>
                      <Button onClick={() => setShowSuccessModal(false)}>OK</Button>
                    </ModalActions>
                  </ModalContent>
                </ModalOverlay>
              )}
              {showWarningModal && (
                <ModalOverlay onClick={() => setShowWarningModal(false)}>
                  <ModalContent>
                    <ModalHeader>Warning</ModalHeader>
                    <p>Attendance for this date has already been recorded.</p>
                    <ModalActions>
                      <Button onClick={() => setShowWarningModal(false)}>OK</Button>
                    </ModalActions>
                  </ModalContent>
                </ModalOverlay>
              )}

            </ModalContent>
          </ModalOverlay>
        )}

              {/* Assignments Modal (Tutor only) */}
              {showAssignmentsModal && (
              <ModalOverlay onClick={() => setShowAssignmentsModal(false)}>
                <ModalContent onClick={e => e.stopPropagation()}>
                  <ModalHeader>Assignment Settings</ModalHeader>

                  {/* Steps 1–4: filters & candidates */}
                  <FormRow>
                    <Label>Batch</Label>
                    <Select value={selectedBatchForAssign} onChange={e=>setSelectedBatchForAssign(e.target.value)}>
                      <option value="">Select Batch</option>
                      {batches.map(b=><option key={b} value={b}>{`Batch ${b}`}</option>)}
                    </Select>
                  </FormRow>
                  <FormRow>
                    <Label>Course</Label>
                    <Select value={selectedCourseForAssign} onChange={e=>setSelectedCourseForAssign(e.target.value)}>
                      <option value="">Select Course</option>
                      {courses.map(c=><option key={c} value={c}>{c}</option>)}
                    </Select>
                  </FormRow>
                  <FormRow>
                    <Label>Training Mode</Label>
                    <div>{trainingModes.map(m=>(<label key={m}><input type="radio" name="mode" value={m} checked={selectedTrainingModeForAssign===m} onChange={e=>setSelectedTrainingModeForAssign(e.target.value)}/> {m}</label>))}</div>
                  </FormRow>
                  <Section>
              <Label>Candidates</Label>
              {filteredAssignCandidates.length ? (
                filteredAssignCandidates.map(c => (
                  <Item
                      key={c._id}
                      selected={selectedStudentForAssign === c.studentId}             // change: compare to studentId
                      onClick={() => setSelectedStudentForAssign(c.studentId)}        // change: store studentId
                    >
                      {c.studentId} — {c.candidateName}
                    </Item>
                ))
              ) : (
                <NoData>No candidates match those filters.</NoData>
              )}
            </Section>

                  {selectedStudentForAssign && <>
                    {/* 3.1 Code Work */}
                    <Section>
                      <Label>Assign Code Work</Label>
                      <Input placeholder="Unit" value={newAssignment.unit} onChange={e=>setNewAssignment(p=>({...p,unit:e.target.value}))}/>
                      <Input type="url" placeholder="Material URL" value={newAssignment.studyMaterialUrl} onChange={e=>setNewAssignment(p=>({...p,studyMaterialUrl:e.target.value}))}/> {/* NEW */}
                      <Input type="file" accept="application/pdf" onChange={e=>setNewAssignment(p=>({...p,studyMaterialFile:e.target.files[0]}))}/> {/* NEW */}
                      <Btn onClick={createAssignment}>Create</Btn>
                    </Section>

                    {/* 3.2 Quiz */}
                    <Section>
                            <Label>Assign Quiz</Label>
                            {assignLoading ? (
                              <p>Loading assignments…</p>
                            ) : (
                              <Select
                                value={quizState.assignmentId}
                                onChange={handleAssignmentChange}
                              >
                                <option value="">Select Assignment</option>
                                {assignmentsList.map(a => (
                                  <option key={a._id} value={a._id}>{a.unit}</option>
                                ))}
                              </Select>
                            )}

                            <Button onClick={() => setIsEditingQuiz(true)} disabled={!quizState.assignmentId}>
                              Edit Quiz
                            </Button>

                            {isEditingQuiz && (
                              <QuizEditor
                                quiz={quizState}
                                onChange={setQuizState}
                                onSave={saveQuiz}
                              />
                            )}
                          </Section>


                    {/* 3.3 Results */}
                    <Section>
                      <Label>Assignment Results</Label>
                      {assignLoading ? <p>Loading…</p> : assignmentsList.length ? (
                        <ProjectDetailsTable>…</ProjectDetailsTable>
                      ) : <NoData>No assignments.</NoData>}
                    </Section>

                    {/* 3.4 Unlock Requests */} {/* NEW */}
                    <Section>
                      <Label>Unlock Requests</Label>
                      {unlockRequests.length ? unlockRequests.map(r=>(
                        <div key={r._id} style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                          <span>{r.unit} — {r.reason}</span>
                          <span>
                            <ActionBtn onClick={() => approveUnlock(selectedStudentForAssign, r.unit)}>Approve</ActionBtn>
                            {/* <ActionBtn onClick={()=>approveUnlock(r._id,false)}>Reject</ActionBtn> */}
                          </span>
                        </div>
                      )) : <NoData>No unlock requests.</NoData>}
                    </Section>
                  </>}

                  <ModalActions>
                    <Button variant="secondary" onClick={()=>setShowAssignmentsModal(false)}>Close</Button>
                  </ModalActions>
                </ModalContent>
              </ModalOverlay>
            )}



            {/* Toast Container */}
            <ToastContainer>
              {toasts.map(t=>(
                <Toast key={t.id} type={t.type}>
                  {t.message}
                  <CloseToast onClick={()=>setToasts(ts=>ts.filter(x=>x.id!==t.id))}>✕</CloseToast>
                </Toast>
              ))}
            </ToastContainer>

      </Content>
      <Footer />
    </Container>
  );
};
export default DashboardPage;



/* Styled Components */
const ToastContainer = styled.div`
  position: fixed;
  top: 16px; right: 16px;
  display: flex; flex-direction: column; gap: 8px;
  z-index: 1000;
`;
const Toast = styled.div`
  background: ${p=>p.type==='error'? '#f56260':'#60d394'};
  color: white;
  padding: 12px 16px;
  border-radius: 4px;
  font-weight: 500;
  display: flex; align-items: center; justify-content: space-between;
`;
const CloseToast = styled.span`
  cursor: pointer;
  margin-left: 12px;
  font-size: 14px;
`;

// Styled Components
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
  padding: 50px;
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
const AttendanceList = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
  }
  thead {
    background: #f0f0f0;
  }
`;

// Spinner styling
const SpinnerOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.8);
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

const Label = styled.label`font-weight:600;`;

const Section = styled.div`display:flex;flex-direction:column;gap:12px;`;

const Item = styled.li`padding:8px;border-bottom:1px solid #ddd;background:${p=>p.selected?'#e6f7ff':'transparent'};cursor:pointer;&:hover{background:#f0f0f0;}`;

const Btn = styled.button`padding:8px 16px;background:#4caf50;color:#fff;border:none;border-radius:8px;cursor:pointer;align-self:flex-start;&:hover{background:#45a047;}`;
