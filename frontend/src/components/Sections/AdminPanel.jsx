import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import TopNavbar from '../Nav/TopNavbar';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../Pages/firebase';
import axios from 'axios';
import { device } from '../../style/device'; // adjust path as needed

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

  // 🔧 CHANGED: make courseDocs an object whose keys are course IDs
const [courseDocs, setCourseDocs] = useState({});


  const [docType, setDocType] = useState('syllabus');
  const [assignments, setAssignments] = useState([]);
  const [results, setResults] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
// replace your existing newAssignment hook with:
const [newAssignment, setNewAssignment] = useState({
  unit: '',
  studyMaterialUrl: '',
  studyMaterialFile: null,
  closeDays: 3
});
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackUnit, setFeedbackUnit] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [unlockRequests, setUnlockRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [syllabusFile,   setSyllabusFile]   = useState(null);
  const [scheduleFile,   setScheduleFile]   = useState(null);

  // toasts: { id, message, type: 'success' | 'error' }
  const [toasts, setToasts] = useState([]);

  // Add:
  const [batches, setBatches] = useState([]);              // list of batch identifiers
  const [courses, setCourses] = useState([]);              // list of course names
  const [trainingModes, setTrainingModes] = useState([]);  // e.g., ['Online','On-campus@ Thanjavur']
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedTrainingMode, setSelectedTrainingMode] = useState('');
  const [filteredCandidates, setFilteredCandidates] = useState([]); // after filter applied
  const [attendanceMap, setAttendanceMap] = useState({});  // map studentId → attendance records

  const [selectedBatchRes, setSelectedBatchRes] = useState('');
  const [selectedCourseRes, setSelectedCourseRes] = useState('');
  const [selectedTrainingModeRes, setSelectedTrainingModeRes] = useState('');
  const [filteredAssignCandidates, setFilteredAssignCandidates] = useState([]); // same structure as filteredCandidates
  const [filteredResults, setFilteredResults] = useState([]); // assignment results after filtering
  // For quiz results mapping: key `${studentId}_${unit}` → { score, total, breakdown }
  const [quizResultsMap, setQuizResultsMap] = useState({});

  // ── Fee Settings state ─────────────────────────
  const [selectedBatchFee, setSelectedBatchFee] = useState('');
  const [selectedCourseFee, setSelectedCourseFee] = useState('');
  const [selectedTrainingModeFee, setSelectedTrainingModeFee] = useState('');
  const [termIIAmount, setTermIIAmount] = useState('');
  const [startDateFee, setStartDateFee] = useState('');
  const [endDateFee, setEndDateFee] = useState('');
  const [filteredFeeCandidates, setFilteredFeeCandidates] = useState([]);

  // helper to push a toast
  const pushToast = (message, type='success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

  const fetchBatchStudents = async () => {
    const q = query(
      collection(db, 'users'),
      where(documentId(), '>=', 'BT'),
      where(documentId(), '<=', 'BT\uf8ff')
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  useEffect(() => {
    if (!showModal) return;
    setLoading(true);
    (async () => {
      try {
        const batch = await fetchBatchStudents();
        if (['StudentDetails','ViewAttendance','ManageAssignments','UnlockRequests','ReviewFeedback'].includes(modalType)) {
          setStudents(batch);
        }
        if (modalType === 'StudentDetails') {
          const { data: cands } = await axios.get(`${API_BASE_URL}/api/candidates`);
          setStudents(batch.map(u => ({ ...u, ...(cands.find(c => c.studentId === u.id) || {}) })));
        }
        if (modalType === 'ViewAttendance') {
          // nothing else to do
        }

        if (modalType === 'CourseDocs') {
        if (!selectedCourse) {
          pushToast('Please select a course first', 'error');
        } else {
          const { data } = await axios.get(
            `${API_BASE_URL}/api/admin/course-docs/upload/${encodeURIComponent(selectedCourse)}`
          );
          // 🔧 CHANGED: store under courseDocs[selectedCourse]
          setCourseDocs(prev => ({
            ...prev,
            [selectedCourse]: {
              syllabus: data.syllabus || '',
              syllabusOriginalName: data.syllabusOriginalName || '',
              schedule: data.schedule || '',
              scheduleOriginalName: data.scheduleOriginalName || ''
            }
          }));
        }
      }
        if (modalType === 'ManageAssignments' && selectedStudent) {
          const { data } = await axios.get(`${API_BASE_URL}/api/assignments/${selectedStudent.id}`);
          setAssignments(data);
        }
        if (modalType === 'AssignmentResults') {
          const { data } = await axios.get(`${API_BASE_URL}/api/admin/assignments/results`);
          setResults(data);
        }
        if (modalType === 'ReviewFeedback') {
          const { data } = await axios.get(`${API_BASE_URL}/api/admin/feedback`);
          setFeedbackList(data);
        }
      } catch (e) {
        console.error(e);
        pushToast('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [showModal, modalType, selectedStudent, selectedCourse]);
  
      // Whenever I'm in the UnlockRequests modal and a student is selected,
      // fetch only their closed-but-not-unlocked assignments:
      useEffect(() => {
      if (!showModal || modalType !== 'UnlockRequests' || !selectedStudent) return;
      setLoading(true);
      axios.get(`${API_BASE_URL}/api/assignments/${selectedStudent.id}`)
      .then(({ data }) => {
        // Show assignments that have been unlocked (i.e. requested for unlock)
        const pending = data.filter(a => a.closed && a.unlocked);
        setUnlockRequests(pending);
      })
      .catch(e => {
        console.error(e);
        pushToast('Failed to load unlock requests', 'error');
      })
      .finally(() => setLoading(false));
  }, [showModal, modalType, selectedStudent]);

  // ── Filter candidates for Fee Settings ─────────────────────────────────
useEffect(() => {
  if (!selectedBatchFee || !selectedCourseFee || !selectedTrainingModeFee) {
    setFilteredFeeCandidates([]);
    return;
  }
  axios.get(`${API_BASE_URL}/api/candidates`)
    .then(res => {
      const list = res.data.filter(c =>
        // match batch: studentId includes “BT{selectedBatchFee}FS”
        typeof c.studentId === 'string'
          && c.studentId.includes(`BT${selectedBatchFee}FS`)
        // courseRegistered may be array
        && Array.isArray(c.courseRegistered)
        && c.courseRegistered.includes(selectedCourseFee)
        && c.trainingMode === selectedTrainingModeFee
        // exclude full-term paid
        && !(typeof c.paymentTerm === 'string' && c.paymentTerm.trim().toLowerCase() === 'full term')
      );
      setFilteredFeeCandidates(list);
    })
    .catch(err => {
      console.error('Error filtering candidates for fee settings:', err);
      pushToast('Failed to filter candidates for fee settings', 'error');
    });
}, [selectedBatchFee, selectedCourseFee, selectedTrainingModeFee]);

      const submitFeeSettings = async () => {
      // Validate all fields
      if (!selectedBatchFee || !selectedCourseFee || !selectedTrainingModeFee
          || !termIIAmount || !startDateFee || !endDateFee) {
        return pushToast('Complete all fields correctly', 'error');
      }
      const amount = Number(termIIAmount);
      if (isNaN(amount) || amount <= 0) {
        return pushToast('Term II Payment Amount must be positive', 'error');
      }
      const sDate = new Date(startDateFee);
      const eDate = new Date(endDateFee);
      if (isNaN(sDate.getTime()) || isNaN(eDate.getTime()) || sDate > eDate) {
        return pushToast('Invalid date range', 'error');
      }
      try {
        const payload = {
          batch: selectedBatchFee,
          course: selectedCourseFee,
          trainingMode: selectedTrainingModeFee,
          termIIAmount: amount,
          startDate: startDateFee,
          endDate: endDateFee
        };
        const res = await axios.post(`${API_BASE_URL}/api/admin/fee-settings`, payload);
        pushToast(`Fee settings saved for ${filteredFeeCandidates.length} candidates`);
        // Optionally keep selections or clear:
        // setSelectedBatchFee(''); etc.
      } catch (err) {
        console.error('Failed to save fee settings:', err);
        const msg = err.response?.data?.error || 'Failed to save fee settings';
        pushToast(msg, 'error');
      }
    };



  const openModal = type => {
    setModalType(type);
    setShowModal(true);
    setEditMode(false);
    setSelectedStudent(null);
    setProfileData({});
    setAttendance([]);
    setAssignments([]);
    setResults([]);
    setFeedbackList([]);
    setUnlockRequests([]);
    setFeedbackText('');
    setFeedbackUnit('');
    if (type === 'FeeSettings') {
    setSelectedBatchFee('');
    setSelectedCourseFee('');
    setSelectedTrainingModeFee('');
    setTermIIAmount('');
    setStartDateFee('');
    setEndDateFee('');
    setFilteredFeeCandidates([]);
  }
  setModalType(type);
  setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  const saveProfile = async () => {
    if (!selectedStudent) { pushToast('Select a student first', 'error'); return; }
    setLoading(true);
    try {
      const { data } = await axios.put(`${API_BASE_URL}/api/candidates/${selectedStudent._id}`, profileData);
      setSelectedStudent(data);
      setStudents(students.map(s => s._id === data._id ? data : s));
      setEditMode(false);
      pushToast('Profile updated');
    } catch (e) {
      console.error(e);
      pushToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceForCandidate = async (candidate) => {
  const sid = candidate.studentId;
  if (attendanceMap[sid]) {
    // Already fetched: hide
    setAttendanceMap(prev => {
      const next = { ...prev };
      delete next[sid];
      return next;
    });
    return;
  }
  // Fetch from Firestore as before
  try {
    // Show loading indicator if desired
    const q = query(collection(db, 'attendance'), where('studentId', '==', sid));
    const snap = await getDocs(q);
    const recs = snap.docs.map(d => ({
      date: d.data().date.toDate ? d.data().date.toDate() : new Date(d.data().date),
      status: d.data().status
    }));
    recs.sort((a, b) => b.date - a.date);
    setAttendanceMap(prev => ({ ...prev, [sid]: recs }));
  } catch (err) {
    console.error('Failed to fetch attendance for', sid, err);
    pushToast(`Failed to fetch attendance for ${sid}`, 'error');
  }
};

    useEffect(() => {
  if (!selectedBatchRes || !selectedCourseRes || !selectedTrainingModeRes) {
    setFilteredAssignCandidates([]);
    setFilteredResults([]);
    return;
  }
  axios.get(`${API_BASE_URL}/api/candidates`)
    .then(res => {
      const list = res.data.filter(c =>
        c.studentId.includes(`BT${selectedBatchRes}FS`) &&
        Array.isArray(c.courseRegistered) &&
        c.courseRegistered.includes(selectedCourseRes) &&
        c.trainingMode === selectedTrainingModeRes
      );
      setFilteredAssignCandidates(list);
      setFilteredResults([]); // clear previous
    })
    .catch(err => console.error('Error filtering assignment candidates:', err));
}, [selectedBatchRes, selectedCourseRes, selectedTrainingModeRes]);

    useEffect(() => {
  if (filteredAssignCandidates.length === 0) {
    setFilteredResults([]);
    return;
  }
  setLoading(true);
  axios.get(`${API_BASE_URL}/api/admin/assignments/results`)
    .then(res => {
      // res.data is array of assignment docs with studentId, unit, results
      const validIds = new Set(filteredAssignCandidates.map(c => c.studentId));
      const matched = res.data.filter(r => validIds.has(r.studentId));
      setFilteredResults(matched);
    })
    .catch(err => {
      console.error('Failed to fetch assignment results:', err);
      pushToast('Failed to load assignment results', 'error');
      setFilteredResults([]);
    })
    .finally(() => setLoading(false));
}, [filteredAssignCandidates]);



  const uploadCourseDocs = async () => {
  if (!selectedCourse) {
    return pushToast('Please select a course', 'error');
  }
  if (!syllabusFile && !scheduleFile) {
    return pushToast('Please choose at least one PDF', 'error');
  }

  const form = new FormData();
  form.append('courseId', selectedCourse);
  if (syllabusFile) form.append('syllabus', syllabusFile, syllabusFile.name);
  if (scheduleFile) form.append('schedule', scheduleFile, scheduleFile.name);

  setLoading(true);
  try {
    // 🔧 CHANGED: POST to upload endpoint
    await axios.post(
      `${API_BASE_URL}/api/admin/course-docs/upload/${encodeURIComponent(selectedCourse)}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    pushToast('Course documents uploaded');

    // 🔧 CHANGED: re‐fetch so we know exactly what’s saved in the DB/cloud
    const { data: newData } = await axios.get(
      `${API_BASE_URL}/api/admin/course-docs/upload/${encodeURIComponent(selectedCourse)}`
    );
    // 🔧 CHANGED: replace only the object at courseDocs[selectedCourse]
    setCourseDocs(prev => ({
      ...prev,
      [selectedCourse]: {
        syllabus: newData.syllabus || '',
        syllabusOriginalName: syllabusFile?.name || '',
        schedule: newData.schedule || '',
        scheduleOriginalName: scheduleFile?.name || ''
      }
    }));

    // 🔧 CHANGED: clear file‐input boxes
    setSyllabusFile(null);
    setScheduleFile(null);
  } catch (err) {
    console.error(err);
    pushToast('Upload failed', 'error');
  } finally {
    setLoading(false);
  }
};

    useEffect(() => {
  // Fetch all candidates from backend to build courseRegistered and trainingMode lists
  axios.get(`${API_BASE_URL}/api/candidates`)
    .then(res => {
      const data = res.data;
      // Batches: extract numeric part from studentId matching “BT<number>FS”
      const batchSet = new Set();
      data.forEach(c => {
        const m = c.studentId.match(/BT(\d+)FS/);
        if (m) batchSet.add(m[1]);
      });
      setBatches(Array.from(batchSet).sort((a,b) => Number(a) - Number(b)));
      // Courses: c.courseRegistered is array
      const courseSet = new Set();
      data.forEach(c => {
        if (Array.isArray(c.courseRegistered)) {
          c.courseRegistered.forEach(cr => courseSet.add(cr));
        }
      });
      setCourses(Array.from(courseSet));
      // Training modes
      const modeSet = new Set(data.map(c => c.trainingMode).filter(Boolean));
      setTrainingModes(Array.from(modeSet));
    })
    .catch(err => console.error('Failed to fetch candidates for filters:', err));
}, []);

          useEffect(() => {
      if (!selectedBatch || !selectedCourse || !selectedTrainingMode) {
        setFilteredCandidates([]);
        return;
      }
      axios.get(`${API_BASE_URL}/api/candidates`)
        .then(res => {
          const list = res.data.filter(c =>
            // match batch: studentId includes “BT{selectedBatch}FS”
            c.studentId.includes(`BT${selectedBatch}FS`) &&
            Array.isArray(c.courseRegistered) &&
            c.courseRegistered.includes(selectedCourse) &&
            c.trainingMode === selectedTrainingMode
          );
          setFilteredCandidates(list);
          // Clear previous attendanceMap entries if needed
          setAttendanceMap({});
        })
        .catch(err => {
          console.error('Error filtering candidates:', err);
          pushToast('Failed to filter candidates', 'error');
        });
    }, [selectedBatch, selectedCourse, selectedTrainingMode]);



  const createAssignment = async () => {
  if (!selectedStudent) { pushToast('Select a student', 'error'); return; }
  setLoading(true);
  try {
    // build multipart form
    const form = new FormData();
    form.append('unit', newAssignment.unit);
    form.append('closeDays', newAssignment.closeDays);
    if (newAssignment.studyMaterialFile) {
      form.append('studyMaterial', newAssignment.studyMaterialFile);
    } else {
      form.append('studyMaterialUrl', newAssignment.studyMaterialUrl);
    }

    await axios.post(
      `${API_BASE_URL}/api/admin/students/${selectedStudent.id}/manageAssignments`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    // refresh list
    const { data } = await axios.get(`${API_BASE_URL}/api/assignments/${selectedStudent.id}`);
    setAssignments(data);
    pushToast('Assignment created');
    // reset form
    setNewAssignment({ unit:'', studyMaterialUrl:'', studyMaterialFile:null, closeDays:3 });
  } catch {
    pushToast('Failed to create assignment', 'error');
  } finally {
    setLoading(false);
  }
};


  const requestUnlock = async unit => {
    if (!selectedStudent) { pushToast('Select a student', 'error'); return; }
    try {
      await axios.post(`${API_BASE_URL}/api/assignments/${selectedStudent.id}/unlock`, { unit });
      pushToast('Unlock requested');
    } catch {
      pushToast('Failed to request unlock', 'error');
    }
  };

    const fetchQuizResultForAdmin = async (studentId, unit) => {
  // Need to find the corresponding quizId for this assignment unit.
  // First, fetch the quiz for this assignment: assume an endpoint GET /api/quizzes/:assignmentId or GET /api/quizzes?studentId/unit
  // If your backend stores quizzes by assignmentId, you can call:
  try {
    // First, get the assignment document to retrieve its _id:
    const asnRes = await axios.get(`${API_BASE_URL}/api/assignments/${studentId}`);
    const asns = asnRes.data;
    const asn = asns.find(a => a.unit === unit);
    if (!asn) {
      pushToast(`Assignment record not found for ${unit}`, 'error');
      return;
    }
    // Now fetch quiz by assignmentId:
    let quiz;
    try {
      const qres = await axios.get(`${API_BASE_URL}/api/quizzes/${asn._id}`);
      quiz = qres.data;
    } catch {
      pushToast(`No quiz assigned for unit ${unit}`, 'info');
      return;
    }
    const quizId = quiz._id;
    // Now fetch admin quiz result endpoint:
    const res = await axios.get(
      `${API_BASE_URL}/api/admin/students/${studentId}/quizzes/${quizId}/result`
    );
    // res.data: { score, total, breakdown }
    const keyBase = `${studentId}_${unit}`;
    setQuizResultsMap(prev => ({ ...prev, [keyBase]: res.data }));
  } catch (err) {
    console.error('Failed to fetch quiz result for admin:', err);
    pushToast('Failed to fetch quiz result', 'error');
  }
};


  const approveUnlock = async unit => {
    if (!selectedStudent) { pushToast('Select a student', 'error'); return; }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/students/${selectedStudent.id}/approveUnlock`, { unit });
      setUnlockRequests(u => u.filter(a => a.unit !== unit));
      pushToast('Unlock approved');
    } catch {
      pushToast('Failed to approve unlock', 'error');
    } finally {
      setLoading(false);
    }
  };

  const enterResults = async (unit, score, passed) => {
    if (!selectedStudent) { pushToast('Select a student', 'error'); return; }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/students/${selectedStudent.id}/enterResults`, { unit, results:{score,passed} });
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/assignments/results`);
      setResults(data);
      pushToast('Results saved');
    } catch {
      pushToast('Failed to save results', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!selectedStudent) { pushToast('Select a student', 'error'); return; }
    if (!feedbackUnit) { pushToast('Select a unit', 'error'); return; }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/admin/students/${selectedStudent.id}/reviewFeedback`, { unit:feedbackUnit, feedback:feedbackText });
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/feedback`);
      setFeedbackList(data);
      setFeedbackText('');
      setFeedbackUnit('');
      pushToast('Feedback submitted');
    } catch {
      pushToast('Failed to submit feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  const modalTypes = [
    'StudentDetails','ViewAttendance','CourseDocs',
    'ManageAssignments','UnlockRequests',
    'AssignmentResults','ReviewFeedback'
  ];

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
            { label: 'View Attendance', icon: '🕒', modal: 'ViewAttendance' },
            { label: 'Course Documents', icon: '📚', modal: 'CourseDocs' },
            { label: 'Manage Assignments', icon: '📝', modal: 'ManageAssignments' },
            { label: 'Unlock Requests', icon: '🔓', modal: 'UnlockRequests' },
            { label: 'Assignment Results', icon: '📈', modal: 'AssignmentResults' },
            { label: 'Review Feedback', icon: '💬', modal: 'ReviewFeedback' },
            { label: 'Fee Settings', icon: '💰', modal: 'FeeSettings' },

          ].map(({ label, icon, route, modal }, idx) => (
            <MenuCard key={idx} onClick={() => route ? navigate(route) : openModal(modal)}>
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
            <Header>
              <h2>{modalType.replace(/([A-Z])/g,' $1')}</h2>
              <Close onClick={closeModal}>×</Close>
            </Header>
            <Body>
              {loading && <SpinnerOverlay><Spinner /></SpinnerOverlay>}

              {/* Student Details */}
              {modalType === 'StudentDetails' && !loading && (
                <Grid>
                  <List>
                    {students.map(s => (
                      <Item key={s.id} selected={selectedStudent?.id === s.id} onClick={() => { setSelectedStudent(s); setProfileData(s); setEditMode(false); }}>
                        {s.candidateName || s.id}
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
                          <Btn onClick={() => setEditMode(true)}>Edit</Btn>
                        </>
                      ) : (
                        <>
                          <Row><Label>Name:</Label><Input value={profileData.candidateName || ''} onChange={e => setProfileData(p => ({ ...p, candidateName: e.target.value }))}/></Row>
                          <Row><Label>Email:</Label><Input value={profileData.email || ''} onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))}/></Row>
                          <Row><Label>Mobile:</Label><Input value={profileData.mobile || ''} onChange={e => setProfileData(p => ({ ...p, mobile: e.target.value }))}/></Row>
                          <Btn onClick={saveProfile}>Save</Btn>
                        </>
                      )}
                    </Detail>
                  )}
                </Grid>
              )}

              {/* View Attendance */}
              {modalType === 'ViewAttendance' && !loading && (
                      <Section>
                        {/* Filter controls */}
                        <FormRow>
                          <Label>Batch</Label>
                          <Select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                            <option value="">Select Batch</option>
                            {batches.map(b => (
                              <option key={b} value={b}>{`Batch ${b}`}</option>
                            ))}
                          </Select>
                        </FormRow>
                        <FormRow>
                          <Label>Course</Label>
                          <Select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                            <option value="">Select Course</option>
                            {courses.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </Select>
                        </FormRow>
                        <FormRow>
                          <Label>Training Mode</Label>
                          {/* Render radio buttons */}
                          {trainingModes.map(mode => (
                            <label key={mode} style={{ marginRight: '12px' }}>
                              <input
                                type="radio"
                                name="attendanceMode"
                                value={mode}
                                checked={selectedTrainingMode === mode}
                                onChange={e => setSelectedTrainingMode(e.target.value)}
                              />
                              {mode}
                            </label>
                          ))}
                        </FormRow>

                        {/* If filters incomplete, prompt */}
                        {(!selectedBatch || !selectedCourse || !selectedTrainingMode) && (
                          <p style={{ color: '#888', marginTop: '8px' }}>
                            Please select Batch, Course, and Training Mode.
                          </p>
                        )}

                        {/* Show filtered candidates */}
                        {selectedBatch && selectedCourse && selectedTrainingMode && (
                          <>
                            {filteredCandidates.length === 0 ? (
                              <p>No candidates found for selected filters.</p>
                            ) : (
                              <Table style={{ marginTop: '12px' }}>
                                <thead>
                                  <tr>
                                    <Th>Student ID</Th>
                                    <Th>Name</Th>
                                    <Th>Action</Th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredCandidates.map(c => {
                                    const sid = c.studentId;
                                    const recs = attendanceMap[sid] || null;
                                    return (
                                      <React.Fragment key={sid}>
                                        <tr>
                                          <Td>{sid}</Td>
                                          <Td>{c.candidateName || sid}</Td>
                                          <Td>
                                            <ActionBtn onClick={() => fetchAttendanceForCandidate(c)}>
                                              {attendanceMap[sid] ? 'Hide' : 'View Attendance'}
                                            </ActionBtn>
                                          </Td>
                                        </tr>
                                        {/* If fetched, show attendance below */}
                                        {attendanceMap[sid] && (
                                          <tr>
                                            <Td colSpan={3} style={{ padding: 0 }}>
                                              <Table style={{ margin: '8px', width: '100%' }}>
                                                <thead>
                                                  <tr>
                                                    <Th>Date</Th>
                                                    <Th>Status</Th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {attendanceMap[sid].map(rec => (
                                                    <tr key={rec.date.toISOString()}>
                                                      <Td>{new Date(rec.date).toLocaleDateString()}</Td>
                                                      <Td>{rec.status}</Td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </Table>
                                            </Td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </Table>
                            )}
                          </>
                        )}
                      </Section>
                    )}


                    {/* Course Docs */}
                    {modalType === 'CourseDocs' && !loading && (
                      <Section>
                        <Label>Select Course:</Label>
                        <Select
                          value={selectedCourse}
                          onChange={e => setSelectedCourse(e.target.value)}
                        >
                          <option value="">-- Select Course --</option>
                          <option value="Full Stack">Full Stack</option>
                          <option value="Python">Python</option>
                          <option value="SEO & Digital Marketing">SEO & Digital Marketing</option>
                          <option value="Graphic Designing">Graphic Designing</option>
                          <option value="Software Testing">Software Testing</option>
                          <option value="Business Analyst">Business Analyst</option>
                          <option value="PHP with Laravel">PHP with Laravel</option>
                          <option value="Dot Net">Dot Net</option>
                        </Select>

                        {selectedCourse && (
                          <>
                            <FileInputWrapper>
                              <Label>Syllabus PDF:</Label>
                              <File
                                type="file"
                                accept="application/pdf"
                                onChange={e => setSyllabusFile(e.target.files[0])}
                              />
                            </FileInputWrapper>

                            <FileInputWrapper>
                              <Label>Schedule PDF:</Label>
                              <File
                                type="file"
                                accept="application/pdf"
                                onChange={e => setScheduleFile(e.target.files[0])}
                              />
                            </FileInputWrapper>

                            <Btn onClick={uploadCourseDocs}>Upload Documents</Btn>

                            <List>
                              <Li>
                                Syllabus:&nbsp;
                                {courseDocs[selectedCourse]?.syllabus
                                  ? courseDocs[selectedCourse].syllabusOriginalName
                                  : 'None'}
                              </Li>
                              <Li>
                                Schedule:&nbsp;
                                {courseDocs[selectedCourse]?.schedule
                                  ? courseDocs[selectedCourse].scheduleOriginalName
                                  : 'None'}
                              </Li>
                            </List>
                          </>
                        )}
                      </Section>
                    )}


              {/* Manage Assignments */}
              {modalType === 'ManageAssignments' && !loading && (
                      <Section>
                        <Select
                          value={selectedStudent?.id || ''}
                          onChange={e => setSelectedStudent(students.find(x => x.id===e.target.value) || null)}
                        >
                          <option value="">Select Student</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.candidateName || s.id}
                            </option>
                          ))}
                        </Select>

                        {selectedStudent && (
                          <>
                            <Input
                              placeholder="Unit"
                              value={newAssignment.unit}
                              onChange={e => setNewAssignment(p => ({ ...p, unit: e.target.value }))}
                            />

                            {/* PDF upload */}
                            <FileInputWrapper>
                              <Label>Study Material (PDF only)</Label>
                              <File
                                type="file"
                                accept="application/pdf"
                                onChange={e => {
                                  const file = e.target.files[0];
                                  setNewAssignment(p => ({
                                    ...p,
                                    studyMaterialFile: file,
                                    studyMaterialUrl: file ? file.name : ''
                                  }));
                                }}
                              />
                            </FileInputWrapper>
                            {newAssignment.studyMaterialFile && (
                              <PDFPreview>
                                📄 {newAssignment.studyMaterialFile.name}
                                <RemoveIcon
                                  onClick={() => setNewAssignment(p => ({
                                    ...p,
                                    studyMaterialFile: null,
                                    studyMaterialUrl: ''
                                  }))}
                                >
                                  ×
                                </RemoveIcon>
                              </PDFPreview>
                            )}

                            <Input
                              placeholder="Close after days"
                              type="number"
                              value={newAssignment.closeDays}
                              onChange={e => setNewAssignment(p => ({ ...p, closeDays: e.target.value }))}
                            />

                            <Btn onClick={createAssignment}>Create</Btn>

                            <AssignList>
                              {assignments.map(a => (
                                <AssignItem key={a.unit}>
                                  <strong>{a.unit}</strong> – {a.closed ? 'Closed' : 'Open'}
                                </AssignItem>
                              ))}
                            </AssignList>
                          </>
                        )}
                      </Section>
                    )}

                    {/* Unlock Requests */}
                {modalType === 'UnlockRequests' && !loading && (
                <Section>
                  <Select
                    value={selectedStudent?.id || ''}
                    onChange={e => setSelectedStudent(
                      students.find(x => x.id === e.target.value) || null
                    )}
                  >
                    <option value="">Select Student</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.candidateName || s.id}
                      </option>
                    ))}
                  </Select>

                  {unlockRequests.length === 0 ? (
                    <p>No pending unlocks.</p>
                  ) : (
                    unlockRequests.map(a => (
                      <AssignItem key={a.unit}>
                        {a.unit}
                        <ActionBtn onClick={() => approveUnlock(a.unit)}>
                          Approve Unlock
                        </ActionBtn>
                      </AssignItem>
                    ))
                  )}
                </Section>
              )}


              {/* Assignment Results */}
              {/* Assignment Results */}
{modalType === 'AssignmentResults' && (
  <Section>
    {/* Filter controls */}
    <FormRow>
      <Label>Batch</Label>
      <Select value={selectedBatchRes} onChange={e => setSelectedBatchRes(e.target.value)}>
        <option value="">Select Batch</option>
        {batches.map(b => <option key={b} value={b}>{`Batch ${b}`}</option>)}
      </Select>
    </FormRow>
    <FormRow>
      <Label>Course</Label>
      <Select value={selectedCourseRes} onChange={e => setSelectedCourseRes(e.target.value)}>
        <option value="">Select Course</option>
        {courses.map(c => <option key={c} value={c}>{c}</option>)}
      </Select>
    </FormRow>
    <FormRow>
      <Label>Training Mode</Label>
      {trainingModes.map(mode => (
        <label key={mode} style={{ marginRight: '12px' }}>
          <input
            type="radio"
            name="resTrainingMode"
            value={mode}
            checked={selectedTrainingModeRes === mode}
            onChange={e => setSelectedTrainingModeRes(e.target.value)}
          />
          {mode}
        </label>
      ))}
    </FormRow>

    {/* Prompt if filters incomplete */}
    {(!selectedBatchRes || !selectedCourseRes || !selectedTrainingModeRes) && (
      <p style={{ color: '#888', marginTop: '8px' }}>
        Select Batch, Course, and Training Mode to view assignment results.
      </p>
    )}

    {/* Results table when filteredResults loaded */}
    {selectedBatchRes && selectedCourseRes && selectedTrainingModeRes && (
      <>
        {loading ? (
          <p>Loading results…</p>
        ) : filteredResults.length === 0 ? (
          <p>No assignment results for selected filters.</p>
        ) : (
          <ResultsTable>
            <thead>
              <tr>
                <Th>Student ID</Th>
                <Th>Name</Th>
                <Th>Unit</Th>
                <Th>Assignment Score</Th>
                <Th>Passed</Th>
                <Th>Quiz Result</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map(r => {
                const sid = r.studentId;
                const student = filteredAssignCandidates.find(c => c.studentId === sid);
                const name = student?.candidateName || sid;
                const keyBase = `${sid}_${r.unit}`;
                const quizRes = quizResultsMap[keyBase];
                return (
                  <tr key={keyBase}>
                    <Td>{sid}</Td>
                    <Td>{name}</Td>
                    <Td>{r.unit}</Td>
                    <Td>
                      <Input
                        type="number"
                        defaultValue={r.results.score}
                        onBlur={e => enterResults(r.unit, e.target.value, r.results.passed)}
                        style={{ width: '60px' }}
                      />
                    </Td>
                    <Td>
                      <select
                        defaultValue={r.results.passed ? 'true' : 'false'}
                        onChange={e =>
                          enterResults(r.unit, r.results.score, e.target.value === 'true')
                        }
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </Td>
                    <Td>
                      {quizRes
                        ? `Score: ${quizRes.score} / ${quizRes.total}`
                        : 'Not Attempted'}
                    </Td>
                    <Td>
                      { /* Save assignment result */ }
                      <ActionBtn onClick={() => enterResults(r.unit, r.results.score, r.results.passed)}>
                        Save
                      </ActionBtn>
                      { /* Refresh quiz result */ }
                      <ActionBtn
                        onClick={() => fetchQuizResultForAdmin(sid, r.unit)}
                        style={{ marginLeft: '8px' }}
                      >
                        {quizRes ? 'Refresh Quiz' : 'Fetch Quiz'}
                      </ActionBtn>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </ResultsTable>
        )}
      </>
    )}
  </Section>
)}


                      {modalType === 'FeeSettings' && !loading && (
                    <Section>
                      {/* Filters */}
                      <FormRow>
                        <Label>Batch</Label>
                        <Select value={selectedBatchFee} onChange={e => setSelectedBatchFee(e.target.value)}>
                          <option value="">Select Batch</option>
                          {batches.map(b => (
                            <option key={b} value={b}>{`Batch ${b}`}</option>
                          ))}
                        </Select>
                      </FormRow>
                      <FormRow>
                        <Label>Course</Label>
                        <Select value={selectedCourseFee} onChange={e => setSelectedCourseFee(e.target.value)}>
                          <option value="">Select Course</option>
                          {courses.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </Select>
                      </FormRow>
                      <FormRow>
                        <Label>Training Mode</Label>
                        {trainingModes.map(mode => (
                          <label key={mode} style={{ marginRight: '12px' }}>
                            <input
                              type="radio"
                              name="feeTrainingMode"
                              value={mode}
                              checked={selectedTrainingModeFee === mode}
                              onChange={e => setSelectedTrainingModeFee(e.target.value)}
                            />
                            {mode}
                          </label>
                        ))}
                      </FormRow>

                      {/* Preview count */}
                      {selectedBatchFee && selectedCourseFee && selectedTrainingModeFee && (
                        <p style={{ margin: '8px 0', color: '#555' }}>
                          {filteredFeeCandidates.length} candidate(s) will be affected.
                        </p>
                      )}
                      {(!selectedBatchFee || !selectedCourseFee || !selectedTrainingModeFee) && (
                        <p style={{ color: '#888' }}>Select Batch, Course, and Training Mode.</p>
                      )}

                      {/* Term II amount and dates */}
                      <FormRow>
                        <Label>Term II Payment Amount (₹)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={termIIAmount}
                          onChange={e => setTermIIAmount(e.target.value)}
                          placeholder="e.g., 5000"
                        />
                      </FormRow>
                      <FormRow>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={startDateFee}
                          onChange={e => setStartDateFee(e.target.value)}
                        />
                      </FormRow>
                      <FormRow>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={endDateFee}
                          onChange={e => setEndDateFee(e.target.value)}
                        />
                      </FormRow>

                      {/* Submit */}
                      <Btn
                        onClick={submitFeeSettings}
                        disabled={
                          !selectedBatchFee || !selectedCourseFee || !selectedTrainingModeFee
                          || !termIIAmount || !startDateFee || !endDateFee
                        }
                        style={{ marginTop: '12px' }}
                      >
                        Save Fee Settings
                      </Btn>
                    </Section>
                  )}




              {/* Review Feedback */}
              {modalType==='ReviewFeedback' && !loading && (
                <Section>
                  <Select value={selectedStudent?.id||''} onChange={e=>setSelectedStudent(students.find(x=>x.id===e.target.value))}>
                    <option value="">Select Student</option>
                    {students.map(s=><option key={s.id} value={s.id}>{s.candidateName||s.id}</option>)}
                  </Select>
                  {selectedStudent && (
                    <>
                      <Select value={feedbackUnit} onChange={e => setFeedbackUnit(e.target.value)}>
                        <option value="">Select Unit</option>
                        {assignments.map(a=><option key={a.unit} value={a.unit}>{a.unit}</option>)}
                      </Select>
                      <Textarea placeholder="Feedback..." value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
                      <Btn onClick={submitFeedback}>Submit</Btn>
                    </>
                  )}
                  <FeedbackList>{feedbackList.map(f=><FeedbackItem key={f._id}>{f.studentId} ({f.unit}): {f.feedback}</FeedbackItem>)}</FeedbackList>
                </Section>
              )}


            </Body>
          </Dialog>
        </Overlay>
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
    </PageWrapper>
  );
};

export default AdminPanel;

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
const kf = keyframes`
  0%{background-position:0 50%}
  50%{background-position:100% 50%}
  100%{background-position:0 50%}
`;

const gradientBG = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
`;
const Dialog = styled.div`
  background: #fff;
  border-radius: 12px;
  max-width: 90%;
  width: 600px;
  max-height: 75%;
  overflow: auto;
   @media ${device.desktop} {
    width: 80%;
    max-width: 600px;
  }
  @media ${device.tablet} {
    width: 90%;
    max-width: 500px;
  }
  @media ${device.mobile} {
    width: 100%;
    height: 100%;
    border-radius: 0;
    max-width: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
  }
`;
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
`;
const Close = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;
const Body = styled.div`
  padding: 16px;
  position: relative;
`;
const SpinnerOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
`;
const spin = keyframes`0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}`;
const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #7620ff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: ${spin} 1s linear infinite;
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

  @media ${device.desktopOnly} {
    padding: 60px 16px;
  }
  @media ${device.tablet} {
    padding: 40px 12px;
  }
  @media ${device.mobile} {
    padding: 20px 8px;
  }
`;
const PageTitle = styled.h1`
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-weight: 800;
  margin-bottom: 24px;
  margin-top: 45px;
  background: linear-gradient(90deg, #7620ff, #ff9900);
  -webkit-background-clip: text;
  color: transparent;
  text-align: center;

  @media ${device.mobile} {
    font-size: clamp(1.2rem, 5vw, 2rem);
    margin-bottom: 16px;
  }
`;
const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 1200px;

  @media ${device.tablet} {
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  @media ${device.mobile} {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: 0 8px;
    gap: 8px;
  }
`;

const MenuCard = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-4px);
  }
  @media ${device.desktop} {
    padding: 14px;
  }
  @media ${device.tablet} {
    padding: 12px;
  }
  @media ${device.mobile} {
    flex-direction: row;
    align-items: center;
    padding: 10px;
  }
`;
const CardIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 8px;

  @media ${device.tablet} {
    font-size: 1.8rem;
  }
  @media ${device.mobile} {
    font-size: 1.6rem;
    margin-bottom: 0;
    margin-right: 8px;
  }
`;
const CardLabel = styled.div`
  font-weight: 600;
  text-align: center;

  @media ${device.mobile} {
    flex: 1;
    text-align: left;
  }
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
  @media ${device.mobile} {
    max-height: 150px;
  }
`;
const Item = styled.li`
  padding: 8px;
  border-bottom: 1px solid #ddd;
  background: ${(p) => (p.selected ? "#e6f7ff" : "transparent")};
  cursor: pointer;
  &:hover {
    background: #f0f0f0;
  }
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
  
`;
const Detail = styled.div`
  display: flex;
  flex-direction: column;
`;
const Row = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;
const Label = styled.label`
  font-weight: 600;
`;
const Span = styled.span``;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media ${device.mobile} {
    padding: 12px;
  }
`;
const Select = styled.select`
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #ccc;
  width: 100%;
  max-width: 300px;
  @media ${device.mobile} {
    max-width: 100%;
    padding: 6px;
  }
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
  `;
  const ResultsTable = styled(Table)`
  `;

const Th = styled.th`padding:8px;border:1px solid #ddd;text-align:left;`;
const Td = styled.td`padding:8px;border:1px solid #ddd;`;

const File = styled.input`
  padding: 4px;
`;
const Input = styled.input`
  padding: 8px;
  margin-bottom: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  width: 100%;
  max-width: 300px;

  @media ${device.mobile} {
    max-width: 100%;
    padding: 6px;
  }
`;
const Textarea = styled.textarea`
  width: 100%;
  height: 80px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
`;
const Btn = styled.button`
  padding: 8px 16px;
  background: #4caf50;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  align-self: flex-start;
  &:hover {
    background: #45a047;
  }
`;
const ActionBtn = styled(Btn)`
  margin-left: 8px;
  background: #2196f3;
  &:hover {
    background: #1976d2;
  }
`;
const AssignList = styled.ul`
  list-style: none;
  padding: 0;
`;
const AssignItem = styled.li`
  padding: 8px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const FeedbackList = styled.ul`
  list-style: none;
  padding: 0;
`;
const FeedbackItem = styled.li`
  padding: 8px;
  border-bottom: 1px solid #ddd;
`;
const Li = styled.li`
  padding: 4px 0;
`;
const FileInputWrapper = styled.div`
  margin-bottom: 12px;
`;

const PDFPreview = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 12px;

   @media ${device.mobile} {
    width: 100%;
    justify-content: space-between;
  }
`;
const RemoveIcon = styled.span`
  cursor: pointer;
  margin-left: 8px;
  font-weight: bold;
`;

const FormRow = styled.div`
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;