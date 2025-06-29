import React, { useEffect, useState, useContext, useCallback  } from "react";
import styled, { ThemeProvider, keyframes } from "styled-components";  // <-- ThemeProvider here
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../Pages/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
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
  FiMail,
  FiPhone,
  FiBookOpen,
  FiHelpCircle,
  FiCoffee,
  FiLoader, 
} from "react-icons/fi";
import axios from "axios";

// ── KEYFRAMES & ANIMATIONS ─────────────────────────────────────────────────────────
const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-30px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const fadeInQuick = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const slideUpFade = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(30px); }
  to   { opacity: 1; transform: translateX(0); }
`;

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
  border: ' #ddd',
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

// NEW: calculate how many days until Term II is due, returns null if invalid date
function calculateDaysUntilTermIIDue(paidDate) {
  if (!paidDate) return null;
  const start = new Date(paidDate);
  if (isNaN(start.getTime())) return null; // invalid date
  // assume Term II is due 30 days after paidDate (adjust if needed)
  const due = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = due - now;
  return diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
}


// Utility functions
function getDownloadUrl(fileUrl) {
  try {
    const separator = fileUrl.includes('?') ? '&' : '?';
    return `${fileUrl}${separator}fl_attachment=true`;
  } catch (err) {
    return fileUrl;
  }
}

function extractOriginalFileName(fileUrl) {
  try {
    const url = new URL(fileUrl);
    const segments = url.pathname.split('/');
    const fileWithPrefix = segments[segments.length - 1];
    const dashIndex = fileWithPrefix.indexOf('-');
    return dashIndex === -1
      ? fileWithPrefix
      : fileWithPrefix.substring(dashIndex + 1);
  } catch (err) {
    return fileUrl;
  }
}

// Replace or expand this according to your quiz-rendering logic.



export default function StudentDashboard() {
  const API_BASE_URL = "https://tekcrewz.onrender.com";
  const navigate = useNavigate();
  const { userId: authUid } = useContext(AuthContext);

  const [data, setData] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);       // ← New
  const [codeInput, setCodeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [activeTab, setActiveTab] = useState("Profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');
  const [quizzes, setQuizzes] = useState([]);
  const [modalMsg, setModalMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
    // Track uploaded files per unit
  const [uploadedFiles, setUploadedFiles] = useState({});

    // ─── StudentDashboard.jsx ─── inside component, with other useState ─────────
  const [unlockLoading, setUnlockLoading] = useState(false);    // new: loading spinner for unlock requests
  const [toastMsg, setToastMsg] = useState('');                 // new: message for toast
  const [showToast, setShowToast] = useState(false);            // new: control toast visibility

  const [toasts, setToasts] = useState([]);
  

  // new states for quiz fetching
  const [quizLoading, setQuizLoading] = useState(false);        // loading state for quiz fetch
  const [quizError, setQuizError] = useState(null);             // error fetching quiz

  const [unitQuiz, setUnitQuiz] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const [feeSetting, setFeeSetting] = useState(null);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
const [leaveDate, setLeaveDate] = useState(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().substr(0,10);
});
const [leaveReason, setLeaveReason] = useState('');
const [leaveRequests, setLeaveRequests] = useState([]);

const [showReasonModal, setShowReasonModal] = useState(false);
const [selectedAbsentDate, setSelectedAbsentDate] = useState(null);
const [absenceReasonInput, setAbsenceReasonInput] = useState('');
const [absenceReasonsMap, setAbsenceReasonsMap] = useState({}); // { 'YYYY-MM-DD': true }


  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  const closeModal = () => setShowModal(false);

  const pushToast = (message, type='success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

    function QuizComponent({ quizData, studentId, unit }) {
      const [answers, setAnswers] = useState(() =>
        quizData.questions.map(() => null)
      );
      const [submitStatus, setSubmitStatus] = useState(null);
      const [quizResult, setQuizResult] = useState(null);


   // NEW: load prior result
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/students/${studentId}/quizzes/${quizData._id}/result`)
      .then(res => {
        if (!res.ok) throw new Error('No result yet');
        return res.json();
      })
      .then(json => {
        setSubmitStatus('submitted');
        setQuizResult({ score: json.score, total: json.total, breakdown: json.breakdown });
      })
      .catch(() => {
        // no prior submission — OK
      });
  }, [quizData._id, studentId]);

  const handleAnswerChange = (qIndex, optionIndex) => {
    setAnswers(ans => {
      const copy = [...ans];
      copy[qIndex] = optionIndex;
      return copy;
    });
  };

  const submitQuiz = async () => {
    // Prevent re-submit
    if (submitStatus === 'submitted') return;
    try {
      setSubmitStatus('submitting');
      // Call student-specific endpoint:
      const res = await fetch(
        `${API_BASE_URL}/api/students/${studentId}/quizzes/${quizData._id}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers })
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Submission failed');
      // Expect backend returns { score: <number>, total: <number> } plus we will extend breakdown
      // Compute breakdown client-side? But quizData from GET strips correctIndex, so we need backend to return breakdown.
      setSubmitStatus('submitted');
      setQuizResult(json); // { score, total, breakdown: [{ question, correct: boolean }] }
    } catch (err) {
      console.error("Quiz submission error:", err);
      setSubmitStatus('error');
    }
  };

  return (
    <QuizContainer>
      <h4>{quizData.title || `Quiz for Unit ${unit}`}</h4>
      {quizData.questions.map((q, qi) => (
        <QuestionBlock key={qi}>
          <p>{q.question}</p>
          {q.options.map((opt, oi) => (
            <OptionRow key={oi}>
              <input
                type="radio"
                name={`quiz-${unit}-q${qi}`}
                checked={answers[qi] === oi}
                onChange={() => handleAnswerChange(qi, oi)}
              />
              <OptionLabel>{opt}</OptionLabel>
            </OptionRow>
          ))}
        </QuestionBlock>
      ))}
      <SubmitQuizButton
        onClick={submitQuiz}
        disabled={submitStatus === 'submitted' || submitStatus === 'submitting'}
      >
        {submitStatus === 'submitted'
          ? 'Submitted'
          : submitStatus === 'submitting'
          ? 'Submitting...'
          : 'Submit Quiz'}
      </SubmitQuizButton>
      {submitStatus === 'error' && (
        <ErrorText>Submission failed. Try again.</ErrorText>
      )}
      {submitStatus === 'submitted' && quizResult && (
        <QuizResultWrapper>
          <p>Your Score: {quizResult.total} / {quizResult.score}</p>
          {quizResult.breakdown && quizResult.breakdown.map((item, idx) => (
            <p key={idx}>
              {item.correct ? '✅' : '❌'} {item.idx}
            </p>
          ))}
        </QuizResultWrapper>
      )}
    </QuizContainer>
  );
}

    const fetchAll = useCallback(async () => {
  setLoading(true);
  try {
    const myEmail = auth.currentUser?.email?.toLowerCase();

    // 1️⃣ Fetch candidates and find current user's profile
    const candRes = await fetch(`${API_BASE_URL}/api/candidates`);
    const candidates = candRes.ok ? await candRes.json() : [];
    const prof = candidates.find(c => c.email?.toLowerCase() === myEmail) || {};
    const dbId = prof.studentId;

    if (!dbId) {
      setError("Unable to find your student record.");
      return;
    }

    // 2️⃣ Fetch attendance
    const [attRes, asnRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/students/${dbId}/attendance`),
      fetch(`${API_BASE_URL}/api/assignments/${dbId}`)
    ]);

    const attendance = attRes.ok ? await attRes.json() : [];
    let assignments = asnRes.ok ? await asnRes.json() : [];

    // 3️⃣ Fetch course documents in parallel
    const registeredCourses = Array.isArray(prof.courseRegistered)
      ? prof.courseRegistered
      : (typeof prof.courseRegistered === 'string' && prof.courseRegistered.trim()
          ? [prof.courseRegistered]
          : []);

    const docsArray = await Promise.all(registeredCourses.map(async courseId => {
      const res = await fetch(`${API_BASE_URL}/api/courses/${encodeURIComponent(courseId)}/docs`);
      if (!res.ok) return null;
      const obj = await res.json();
      const docEntries = Object.entries(obj).map(([type, url]) => ({ type, url }));
      return { courseId, docs: docEntries };
    }));

    // Filter out nulls in case of failed fetches
    const courseDocs = docsArray.filter(Boolean);

    // 4️⃣ Process assignments: add `closed` and `unlocked` flags
    const now = new Date();
    assignments = assignments.map(a => {
      const closedByTime = a.closedAt ? now > new Date(a.closedAt) : false;
      const unlockedUntil = a.unlockedUntil ? new Date(a.unlockedUntil) : null;
      const isUnlocked = unlockedUntil && unlockedUntil > now;
      return {
        ...a,
        closed: closedByTime && !isUnlocked,
        unlocked: Boolean(isUnlocked)
      };
    });

    // ✅ Set all profile & fetched data
    setData({
      dbId,
      candidateName: prof.candidateName || "New Student",
      email: prof.email || "",
      mobile: prof.mobile || "",
      programme: prof.programme || "",
      candidateCourseName: prof.candidateCourseName || "",
      paymentTerm: prof.paymentTerm || "",
      studentId: prof.studentId || "",
      paidAmount: prof.paidAmount || "Not Paid",
      candidatePic: prof.candidatePic || prof.photoUrl || "",
      trainingMode: prof.trainingMode || "",
      courseRegistered: prof.courseRegistered || [],
      paidDate: prof.paidDate || "",
      attendance,
      assignments,
      courseDocs
    });

    // 5️⃣ Real-time Firestore attendance listener
    const q = query(
      collection(db, 'attendance'),
      where('studentId', '==', dbId)
    );
    return onSnapshot(q, snap => {
      const recs = snap.docs.map(d => ({
        date: d.data().date.toDate ? d.data().date.toDate() : new Date(d.data().date),
        status: d.data().status
      }));
      setAttendanceRecords(recs.sort((a, b) => b.date - a.date));
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
    const unsubAttendance = fetchAll();
      return () => {
      if (typeof unsubAttendance === 'function') unsubAttendance();
    };
  }, [authUid, navigate, fetchAll]);

  useEffect(() => {
  if (!data?.dbId) return;
  // GET leave status/history
  fetch(`${API_BASE_URL}/api/student/leave-status?studentId=${encodeURIComponent(data.dbId)}`)
    .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch leave history'))
    .then(list => {
      setLeaveRequests(list);
    })
    .catch(err => console.error('Error fetching leave history:', err));
  // Also fetch existing absence reasons to disable duplicate submissions:
  // Optionally: GET all absence reasons for this student
  fetch(`${API_BASE_URL}/api/admin/absence-reasons?studentId=${encodeURIComponent(data.dbId)}`)
    .then(res => {
      if (!res.ok) return [];
      return res.json();
    })
    .then(arr => {
      // arr: array of { date, ... }
      const map = {};
      arr.forEach(item => {
        const key = new Date(item.date).toISOString().substr(0,10);
        map[key] = true;
      });
      setAbsenceReasonsMap(map);
    })
    .catch(err => {
      // If no such endpoint, skip
      console.warn('No absence reasons endpoint or error:', err);
    });
}, [data?.dbId]);


    useEffect(() => {
  if (!data) {
    setFeeSetting(null);
    return;
  }
  const dbId = data.dbId;
  // Extract batch from studentId (e.g., BT07FS -> 7)
  let batch = null;
  const m = String(dbId).match(/BT0*(\d+)FS/);
  if (m) batch = String(parseInt(m[1], 10));

  const trainingMode = data.trainingMode ? String(data.trainingMode).trim() : '';
  console.log('[FeeFetch] batch:', batch, 'trainingMode:', trainingMode);

  if (!batch || !trainingMode) {
    console.warn('[FeeFetch] missing batch or trainingMode, skipping fee fetch');
    setFeeSetting(null);
    return;
  }

  // Build list of unique, trimmed course names to try
  const coursesToTry = [];
  if (Array.isArray(data.courseRegistered)) {
    for (let cr of data.courseRegistered) {
      if (cr && typeof cr === 'string') {
        const trimmed = cr.trim();
        if (trimmed && !coursesToTry.includes(trimmed)) {
          coursesToTry.push(trimmed);
        }
      }
    }
  }
  if (data.candidateCourseName && typeof data.candidateCourseName === 'string') {
    const cc = data.candidateCourseName.trim();
    if (cc && !coursesToTry.includes(cc)) {
      coursesToTry.push(cc);
    }
  }

  if (coursesToTry.length === 0) {
    console.warn('[FeeFetch] no courses to try, skipping fee fetch');
    setFeeSetting(null);
    return;
  }

  let didSet = false;

  (async () => {
    for (const courseRaw of coursesToTry) {
      const course = String(courseRaw).trim();
      console.log('[FeeFetch] trying course:', course);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/admin/fee-settings`, {
          params: { batch, course, trainingMode }
        });
        console.log('[FeeFetch] success for course:', course, res.data);
        setFeeSetting(res.data);
        didSet = true;
        break;
      } catch (err) {
        if (err.response?.status === 404) {
          console.log(`[FeeFetch] 404 for course: ${course}`);
        } else {
          console.error('[FeeFetch] error fetching fee setting for course:', course, err);
        }
      }
    }

    if (!didSet) {
      console.warn('[FeeFetch] no fee setting found for any course in list:', coursesToTry);
      setFeeSetting(null);
    }
  })();
}, [data]);


    // new: effect to fetch quiz data when activeTab unit changes and assignment is submitted
  useEffect(() => {
  if (!data) return;
  // If activeTab is not a unit tab, clear quiz state
  if (["Profile","Attendance","Syllabus","Schedule","Quiz"].includes(activeTab)) {
    console.log("[QuizEffect] Non-unit tab selected:", activeTab);
    setUnitQuiz(null);
    setQuizError(null);
    setQuizLoading(false);
    return;
  }
  const assignment = data.assignments.find(a => a.unit === activeTab);
  console.log("[QuizEffect] activeTab:", activeTab, "assignment found:", assignment);
  if (assignment && (assignment.submissionCode || assignment.submissionFileUrl)) {
    console.log("[QuizEffect] Fetching quiz for assignmentId:", assignment._id);
    setQuizLoading(true);
    setQuizError(null);
    setUnitQuiz(null);
    axios.get(`${API_BASE_URL}/api/quizzes/${assignment._id}`)
      .then(res => {
        console.log("[QuizEffect] Quiz GET success:", res.data);
        setUnitQuiz(res.data);
        setQuizError(null);
      })
      .catch(err => {
        if (err.response) {
          console.error("[QuizEffect] GET error status:", err.response.status, err.response.data);
          if (err.response.status === 404) {
            // No quiz exists yet
            setUnitQuiz(null);
            setQuizError(null);
          } else {
            setQuizError('Error loading quiz');
          }
        } else {
          console.error("[QuizEffect] GET error:", err);
          setQuizError('Error loading quiz');
        }
      })
      .finally(() => {
        setQuizLoading(false);
      });
  } else {
    console.log("[QuizEffect] Assignment not submitted or not found, clearing quiz");
    setUnitQuiz(null);
    setQuizError(null);
    setQuizLoading(false);
  }
}, [data, activeTab]);




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

        const handleUnifiedSubmit = async (unit) => {
        if (!data) return;
        const { dbId } = data;
        if (!codeInput.trim() && !selectedFile) {
          setSubmitError('Please provide code or select a file.');
          return;
        }
        setSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(null);
        try {
          // Build FormData for unified endpoint
          const formData = new FormData();
          formData.append('unit', unit);
          if (codeInput.trim()) {
            formData.append('code', codeInput.trim());
          }
          if (selectedFile) {
            formData.append('file', selectedFile);
          }
          const res = await fetch(
            `${API_BASE_URL}/api/assignments/${dbId}/submit-combined`,
            {
              method: 'POST',
              body: formData
            }
          );
          const json = await res.json();
          if (!res.ok) {
            throw new Error(json.error || 'Submission failed');
          }
          // Update local state: assignment submissionCode & submissionFileUrl
          setData(d => ({
            ...d,
            assignments: d.assignments.map(a =>
              a.unit === unit
                ? {
                    ...a,
                    submissionCode: codeInput.trim() ? codeInput.trim() : a.submissionCode,
                    submissionFileUrl: json.assignment.submissionFileUrl || a.submissionFileUrl
                  }
                : a
            )
          }));
          setSubmitSuccess('Submitted successfully.');
          // Clear local inputs
          setCodeInput('');
          if (filePreviewUrl) {
            URL.revokeObjectURL(filePreviewUrl);
            setFilePreviewUrl(null);
          }
          setSelectedFile(null);
        } catch (err) {
          console.error('Unified submit error:', err);
          setSubmitError(err.message);
        } finally {
          setSubmitting(false);
        }
      };


    const requestUnlock = async (unit) => {
    if (!data) return;
    const { dbId } = data; // ensure dbId is defined                        // change
    setUnlockLoading(true);                                                 // new
    try {
      const res = await fetch(`${API_BASE_URL}/api/assignments/${dbId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit })
      });
      const resBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Likely 400 because assignment still open or already requested/extended
        const errMsg = resBody.error || 'Unlock request failed';
        // Show toast/modal with error message
        setToastMsg(errMsg);                                                 // new
        setShowToast(true);                                                  // new
      } else {
        // Success: unlock request recorded. Fetch updated assignments to reflect unlockRequested flag
        const fresh = await fetch(`${API_BASE_URL}/api/assignments/${dbId}`);
        if (fresh.ok) {
          const updated = await fresh.json();
          setData(d => ({ ...d, assignments: updated }));
        } else {
          // fallback: mark locally
          setData(d => ({
            ...d,
            assignments: d.assignments.map(a =>
              a.unit === unit ? { ...a, unlockRequested: true } : a
            )
          }));
        }
        // Show success toast/modal
        setToastMsg('Unlock request sent! Await admin approval.');            // new
        setShowToast(true);                                                  // new
      }
    } catch (err) {
      console.error('Unlock request error:', err);
      setToastMsg(`Error sending unlock request: ${err.message}`);           // new
      setShowToast(true);                                                    // new
    } finally {
      setUnlockLoading(false);                                               // new
    }
  };

    const handleRefresh = () => { fetchAll(); };
    

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

    // ▶ NEW: call the server endpoint to upload file
  const uploadFile = async (unit, file) => {
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('unit', unit);

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/assignments/${data.dbId}/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    const json = await res.json();
    // json.fileUrl is the Cloudinary‐returned URL
    // Update the assignment’s submissionFileUrl in state
    setData(d => ({
      ...d,
      assignments: d.assignments.map(a =>
        a.unit === unit ? { ...a, submissionFileUrl: json.fileUrl } : a
      )
    }));
    // ALSO: store it in uploadedFiles so we can display fileName/link
    setUploadedFiles(ufs => ({
      ...ufs,
      [unit]: {
        url: json.fileUrl,
        fileName: file.name
      }
    }));
  } catch (e) {
    console.error('Upload failed', e);
  }
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

// NEW: added paidDate to destructuring
const { candidateName, email, mobile, paidAmount, paidDate, paymentTerm, studentId, candidateCourseName, programme, candidatePic, attendance, courseDocs: docs, assignments } = data;

// 2. Helper to detect Full Term (case-insensitive)
   // Helper to detect Full Term
  const isFullTermPaid = () => {
    return typeof paymentTerm === 'string' 
          && paymentTerm.trim().toLowerCase() === 'full term';
  };

  // 3️⃣ Build dynamic fee summary:
  const renderDynamicFeeSummary = () => {
  if (isFullTermPaid() || !feeSetting) return null;

  const now = new Date();
  const sDate = new Date(feeSetting.startDate);
  const eDate = new Date(feeSetting.endDate);
  if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) return null;

  if (now < sDate) {
    const days = Math.ceil((sDate - now) / (1000 * 60 * 60 * 24));
    return (
      <FeeTimerWrapper>
        <FiClock />
        Window starts in {days} day{days !== 1 ? 's' : ''}
      </FeeTimerWrapper>
    );
  }

  if (now > eDate) {
    const daysOver = Math.ceil((now - eDate) / (1000 * 60 * 60 * 24));
    return (
      <FeeTimerWrapper style={{ borderLeftColor: '#e74c3c', background: 'linear-gradient(90deg, rgba(255,0,0,0.1), transparent)' }}>
        <FiClock />
        Overdue by {daysOver} day{daysOver !== 1 ? 's' : ''}: ₹{feeSetting.termIIAmount}
      </FeeTimerWrapper>
    );
  }

  const daysLeft = Math.ceil((eDate - now) / (1000 * 60 * 60 * 24));
  return (
    <FeeTimerWrapper>
      <FiClock />
      {daysLeft} day{daysLeft !== 1 ? 's' : ''} left to pay ₹{feeSetting.termIIAmount}
    </FeeTimerWrapper>
  );
};


  const renderProfileCard = () => {
  // Calculate assignment completion
  const total = assignments.length;
  const done = assignments.filter(a => a.results || a.submissionCode).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    // SECTION WRAPPER: constrains to parent <Main> width (no sidebar overlap)
    <SectionWrapper>
      {/* HEADER BANNER: gradient   overlapping avatar */}
      <HeaderBanner>
        {candidatePic ? (
          <AvatarLarge src={candidatePic} alt="Profile" />
        ) : (
          <AvatarPlaceholderLarge>
            <FiUser size={40} />
          </AvatarPlaceholderLarge>
        )}

        {/* NAME   ID: slides down/fades in */}
        <NameIDWrapper>
          <NameAnimated>{candidateName}</NameAnimated> {/* ← text slide‐in animation */}
          <IDAnimated>ID: {studentId}</IDAnimated>       {/* ← subtle fade‐in */}
        </NameIDWrapper>
      </HeaderBanner>

      {/* CONTENT GRID: two‐column on desktop, stacks on tablet/mobile */}
      <ContentGrid>
        {/* LEFT COLUMN: contact   program & tuition status */}
        <LeftInfo>
          <InfoBlock>
            <BlockTitleAnimated>Profile information</BlockTitleAnimated> {/* ← slide‐in */}
            <InfoLine>
              <IconTextAnimated delay={0.3}><FiMail /> {email}</IconTextAnimated> {/* ← fade‐in delay */}
              <IconTextAnimated delay={0.5}><FiPhone /> {mobile}</IconTextAnimated> {/* ← fade‐in */}
              <span delay={0.7}><FiBookOpen /> {programme} ({candidateCourseName})</span> {/* ← fade‐in */}
            </InfoLine>
          </InfoBlock>
          
            <InfoBlock>
              <BlockTitleAnimated>Fee Summary</BlockTitleAnimated>
              <InfoLine>
                <InfoTextAnimated delay={0.3}>
                  Payment Term: {paymentTerm}
                </InfoTextAnimated>
                <InfoTextAnimated delay={0.5}>
                  Paid: {paidAmount}
                </InfoTextAnimated>

                {/* NEW: Timer for Term II payment due */}
                {renderDynamicFeeSummary()}
              </InfoLine>
            </InfoBlock>


        </LeftInfo>

        {/* RIGHT COLUMN: progress   assignments */}
        <RightInfo>
          <ProgressCard>
            <ProgressLabelAnimated>Your Mastery Progress</ProgressLabelAnimated> {/* ← slide‐in */}

            {/* PROGRESS BAR OUTER */}
            <ProgressBarOuter>
              {/* PROGRESS BAR INNER: animates width 0→percent */}
              <ProgressBarInner percent={percent} />
              {/* PROGRESS BADGE: slides/fades from left→percent */}
              <ProgressBadge percent={percent}>{percent}%</ProgressBadge>
            </ProgressBarOuter>

            <ProgressTextAnimated delay={1.2}>
              Completed {done} of {total} assignments
            </ProgressTextAnimated> {/* ← fade‐in after bar */}
          </ProgressCard>

          <AssignmentSection>
            <SectionHeaderAnimated>Course Units Status</SectionHeaderAnimated> {/* ← slide‐in */}

                        {assignments.length > 0 ? (
                          <AssignmentListWide>
                            {data.assignments.map(a => {
              // a.unit, a.closed, a.unlocked, a.unlockRequested, a.wasExtended
              let statusText;
              let actionButton = null;

              if (!a.closed) {
                // still open: either initial window or within unlockedUntil
                statusText = a.unlocked ? 'Open (extension)' : 'Open';
                actionButton = (
                  <Button onClick={() => submitCode(a.unit)}> {/* or submitAssignment */}
                    Submit Assignment
                  </Button>
                );
              } else {
                // fully closed
                if (a.unlockRequested) {
                  statusText = 'Unlock Requested';
                  actionButton = null;
                } else if (!a.wasExtended) {
                  statusText = 'Closed';
                  actionButton = (
                    <Button
                      onClick={() => requestUnlock(a.unit)}
                      disabled={unlockLoading || a.unlockRequested}   // disable while loading or already requested
                    >
                      {unlockLoading
                        ? <SpinnerSmall />                            // new: a small spinner component
                        : 'Request Unlock'}
                    </Button>
                  );
                } else {
                  statusText = 'Closed (no further extension)';
                  actionButton = null;
                }
              }

              return (
                <UnitRow key={a.unit}>
                  <UnitName>{a.unit}</UnitName>
                  <StatusText>{statusText}</StatusText>
                  {actionButton}
                </UnitRow>
              );
            })}

              </AssignmentListWide>
            ) : (
              <NoAssignmentsWideAnimated delay={0.5}>
                No assignments found.
              </NoAssignmentsWideAnimated> 
            )}
          </AssignmentSection>
        </RightInfo>
        {showToast && (
            <ToastContainer onClick={() => setShowToast(false)}>  {/* new */}
              {toastMsg}
            </ToastContainer>
          )}
      </ContentGrid>
    </SectionWrapper>
  );
};



  // ── UPDATED renderAttendance() ────────────────────────────────────────────────────────
const renderAttendance = () => {
  if (!attendanceRecords) {
    return (
      <AttendanceWrapper>
        <AttendanceHeaderAnimated>Attendance Records</AttendanceHeaderAnimated>
        <NoDataAnimated delay={0.4}>No attendance data available.</NoDataAnimated>
      </AttendanceWrapper>
    );
  }

  // Format leaveRequests for display
  const leavePreview = leaveRequests.map(lr => ({
    date: new Date(lr.date).toLocaleDateString(),
    status: lr.status,
    reason: lr.reason
  }));

  return (
    <AttendanceWrapper>
      {/* Header + Request Leave button */}
      <AttendanceHeaderAnimated>
        Attendance Records
        <Button style={{ float: 'right' }} onClick={() => {
          // reset inputs
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          setLeaveDate(tomorrow.toISOString().substr(0,10));
          setLeaveReason('');
          setShowLeaveModal(true);
        }}>
          Request Leave
        </Button>
      </AttendanceHeaderAnimated>

      {/* Summary */}
      <AttendanceSummaryAnimated delay={0.3}>
        {(() => {
          const totalDays = attendanceRecords.length;
          const presentCount = attendanceRecords.filter(r => r.status.toLowerCase() === "present").length;
          const absentCount = totalDays - presentCount;
          return `Present: ${presentCount} of ${totalDays} days (Absent: ${absentCount})`;
        })()}
      </AttendanceSummaryAnimated>

      {/* Leave Requests Preview */}
      {leavePreview.length > 0 && (
        <LeavePreviewWrapperAnimated delay={0.5}>
          <h4>Your Leave Requests</h4>
          <table>
            <thead>
              <tr><th>Date</th><th>Status</th><th>Reason</th></tr>
            </thead>
            <tbody>
              {leavePreview.map((lr, idx) => (
                <tr key={idx}>
                  <td>{lr.date}</td>
                  <td>{lr.status}</td>
                  <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>{lr.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </LeavePreviewWrapperAnimated>
      )}

      {/* Attendance List: date, status, and maybe Submit Reason button */}
      <AttendanceListAnimated delay={0.6}>
        {attendanceRecords.map((r, i) => {
          const dateKey = r.date.toISOString().substr(0,10);
          const isAbsent = r.status.toLowerCase() === 'absent';
          const alreadySubmitted = Boolean(absenceReasonsMap[dateKey]);
          return (
            <AttendanceCardAnimated key={i} delay={0.7 + i * 0.05}>
              <DateDisplay>{r.date.toLocaleDateString()}</DateDisplay>
              <StatusBadge status={r.status}>{r.status}</StatusBadge>
              {isAbsent && (
                alreadySubmitted ? (
                  <SmallBadge style={{ marginLeft: '8px' }}>Submitted</SmallBadge>
                ) : (
                  <SmallButton 
                    style={{ marginLeft: '8px' }} 
                    onClick={() => {
                      setSelectedAbsentDate(dateKey);
                      setAbsenceReasonInput('');
                      setShowReasonModal(true);
                    }}
                  >
                    Submit a Reason ?
                  </SmallButton>
                )
              )}
            </AttendanceCardAnimated>
          );
        })}
      </AttendanceListAnimated>

      {/* Optionally keep the mailRequest fallback */}
      {/* <RequestButtonAnimated onClick={() => mailRequest('Attendance')} ...>Request Change</RequestButtonAnimated> */}

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <ModalOverlay>
          <ModalContent>
            <h3>Request Leave</h3>
            <label>
              Date:
              <input 
                type="date" 
                value={leaveDate} 
                onChange={e => setLeaveDate(e.target.value)} 
                min={new Date().toISOString().substr(0,10)} 
              />
            </label>
            <label>
              Reason:
              <textarea
                rows={4}
                value={leaveReason}
                onChange={e => setLeaveReason(e.target.value)}
                placeholder="Enter reason (10–300 characters)"
              />
            </label>
            <CharacterCount>
              {leaveReason.length} / 300
            </CharacterCount>
            <Button
              disabled={
                leaveReason.trim().length < 10 ||
                leaveReason.trim().length > 300 ||
                !leaveDate
              }
              onClick={async () => {
                // Submit leave request
                try {
                  const body = {
                    studentId: data.dbId,
                    date: leaveDate,
                    reason: leaveReason.trim()
                  };
                  const res = await fetch(`${API_BASE_URL}/api/leave-request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                  });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error || 'Error');
                  // Update local state: prepend new request
                  setLeaveRequests(prev => [json.leaveRequest, ...prev]);
                  setShowLeaveModal(false);
                  pushToast('Leave request sent for approval.');
                } catch (err) {
                  console.error('Leave request failed:', err);
                  pushToast(err.message || 'Failed to send leave request', 'error');
                }
              }}
            >
              Submit
            </Button>
            <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>
              Cancel
            </Button>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Absence Reason Modal */}
      {showReasonModal && (
        <ModalOverlay>
          <ModalContent>
            <h3>Submit Absence Reason</h3>
            <p>Date: {new Date(selectedAbsentDate).toLocaleDateString()}</p>
            <Textarea
              rows={4}
              value={absenceReasonInput}
              onChange={e => setAbsenceReasonInput(e.target.value)}
              placeholder="Why were you absent? (10–300 characters)"
            />
            <CharacterCount>
              {absenceReasonInput.length} / 300
            </CharacterCount>
            <Button
              disabled={
                absenceReasonInput.trim().length < 10 ||
                absenceReasonInput.trim().length > 300
              }
              onClick={async () => {
                try {
                  const body = {
                    studentId: data.dbId,
                    date: selectedAbsentDate,
                    reason: absenceReasonInput.trim()
                  };
                  const res = await fetch(`${API_BASE_URL}/api/absence-reason`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                  });
                  const json = await res.json();
                  if (!res.ok) throw new Error(json.error || 'Error');
                  // Mark as submitted
                  setAbsenceReasonsMap(prev => ({ ...prev, [selectedAbsentDate]: true }));
                  setShowReasonModal(false);
                  pushToast('Absence reason submitted.');
                } catch (err) {
                  console.error('Submit absence reason failed:', err);
                  pushToast(err.message || 'Failed to submit reason', 'error');
                }
              }}
            >
              Submit
            </Button>
            <Button variant="secondary" onClick={() => setShowReasonModal(false)}>
              Cancel
            </Button>
          </ModalContent>
        </ModalOverlay>
      )}
    </AttendanceWrapper>
  );
};


 // at top of component, after `const { docs } = data;`
const renderDoc = (type) => {
    if (!Array.isArray(docs) || !type) return null;
    const match = docs.find(d =>
      typeof d.type === 'string'
      && typeof type === 'string'
      && d.type.toLowerCase() === type.toLowerCase()
    );
    return (
      <Card>
        <h3>{match ? match.type : `Document: ${type}`}</h3>
        {match && (
          <EmbedWrapper>
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(match.url)}&embedded=true`}
              width="100%"
              height="600px"
              frameBorder="0"
            />
          </EmbedWrapper>
        )}
        {!match && <p>No document available.</p>}
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

    // ── renderUnit ─────────────────────────────────────────────────────────
  // ── UPDATED renderUnit() ────────────────────────────────────────────────────────────────
const renderUnit = (unit) => {
  const u = assignments.find(a => a.unit === unit);
  if (!u) return null;

  return (
    <UnitSectionWrapper>
      {/* UNIT HEADER: slides in from left */}
      <UnitHeader>
        <UnitTitleAnimated>Unit {unit}: {u.title || "Study Module"}</UnitTitleAnimated>
        {u.closed && !u.unlocked && (
          <LockedBadgeAnimated>Locked</LockedBadgeAnimated>
        )}
      </UnitHeader>

      <Divider />

      {/* TWO‑COLUMN LAYOUT on desktop, single‑column on mobile */}
      <UnitContentGrid>

        {/* LEFT SIDE: Study Material   Download */}
        <LeftColumn>
          <SectionContainerAnimated delay={0.2}>
            <SectionHeading>Study Material</SectionHeading>
            {u.studyMaterialUrl ? (
              <StudyCard>
                <PDFIcon className="fa-solid fa-file-pdf" />
                <FileInfo>
                  <FileNameAnimated delay={0.4}>
                    {extractOriginalFileName(u.studyMaterialUrl)}
                  </FileNameAnimated>
                  <DownloadLinkAnimated
                    href={getDownloadUrl(u.studyMaterialUrl)}
                    download
                    delay={0.6}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download PDF
                  </DownloadLinkAnimated>
                </FileInfo>
              </StudyCard>
            ) : (
              <NoContentAnimated delay={0.4}>No study material available.</NoContentAnimated>
            )}
          </SectionContainerAnimated>
        </LeftColumn>

        {/* RIGHT SIDE: Code Submission, Upload, Results, Feedback */}
        <RightColumn>
          {/* Submit Code Section */}
          <SectionContainerAnimated delay={0.8}>
            <SectionHeading>Submit Code</SectionHeading>
            <CodeTextArea
                rows={6}
                disabled={u.closed || submitting}
                placeholder={u.closed ? "Submissions closed" : "Paste your code here…"}
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
              />

            {u.closed && !u.unlocked && (
              <UnlockFormAnimated onSubmit={e => { e.preventDefault(); requestUnlock(unit); }}>
                <UnlockButton>Request Extension</UnlockButton>
              </UnlockFormAnimated>
            )}
          </SectionContainerAnimated>

          {/* Upload File Section */}
          <SectionContainerAnimated delay={1.4}>
            <SectionHeading>Upload File (Optional)</SectionHeading>
            <FileInputWrapper>
                <FileInput
                        type="file"
                        accept="*/*"
                        disabled={u.closed || submitting}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setSelectedFile(file);
                            setFilePreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                      />

              <UploadLabel animate={!u.closed && !submitting}>
                Choose File
              </UploadLabel>
            </FileInputWrapper>
            {uploadedFiles[unit] && (
              <UploadedInfoAnimated delay={1.6}>
                Uploaded:{" "}
                <UploadedLink href={uploadedFiles[unit].url} target="_blank" rel="noopener noreferrer">
                  {uploadedFiles[unit].fileName}
                </UploadedLink>
              </UploadedInfoAnimated>
            )}
            {selectedFile && (
                <div className="file-preview" style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '8px' }}>{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (filePreviewUrl) {
                        URL.revokeObjectURL(filePreviewUrl);
                        setFilePreviewUrl(null);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#888'
                    }}
                  >
                    X
                  </button>
                </div>
              )}

              <SubmitButton
                  disabled={u.closed || submitting || (!codeInput.trim() && !selectedFile)}
                  onClick={() => handleUnifiedSubmit(unit)}
                  style={{ marginTop: '12px' }}
                >
                  {u.closed ? "Closed" : submitting ? "Submitting..." : "Submit"}
                </SubmitButton>
                {submitError && <p style={{ color: 'red', marginTop: '6px' }}>{submitError}</p>}
                {submitSuccess && <p style={{ color: 'green', marginTop: '6px' }}>{submitSuccess}</p>}
          </SectionContainerAnimated>

          {/* Results Section (only if results exist) */}
          {u.results && (
            <SectionContainerAnimated delay={2.0}>
              <SectionHeading>Result</SectionHeading>
              <ResultTable>
                <thead>
                  <tr>
                    <ResultTh>Score</ResultTh>
                    <ResultTh>Passed</ResultTh>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <ResultTd>{u.results.score}</ResultTd>
                    <ResultTd>
                      <ResultStatus passed={u.results.passed}>
                        {u.results.passed ? "Yes" : "No"}
                      </ResultStatus>
                    </ResultTd>
                  </tr>
                </tbody>
              </ResultTable>
            </SectionContainerAnimated>
          )}

          {/* Feedback Section */}
          <SectionContainerAnimated delay={2.6}>
            <SectionHeading>Feedback</SectionHeading>
            <FeedbackTextArea
              rows={4}
              placeholder="Enter your feedback…"
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              animate={true}
            />
            <FeedbackButton onClick={() => submitFeedback(unit)}>
              Send Feedback
            </FeedbackButton>
          </SectionContainerAnimated>

          {/* ── Quiz Section: only if assignment submitted ────────────────────── */}
            <SectionContainerAnimated delay={3.2}>
                  <SectionHeading>Quiz</SectionHeading>
                  {(u.submissionCode || u.submissionFileUrl) ? (
                    quizLoading ? (
                      <p>Loading quiz...</p>
                    ) : quizError ? (
                      <p style={{ color: 'red' }}>{quizError}</p>
                    ) : unitQuiz ? (
                      <QuizWrapperAnimated>
                        <QuizComponent
                          quizData={unitQuiz}
                          studentId={data.dbId}
                          unit={unit}
                        />
                      </QuizWrapperAnimated>
                    ) : (
                      <p>No quiz assigned yet.</p>
                    )
                  ) : (
                    <DisabledQuiz title="Complete assignment to unlock quiz!">
                      <FiHelpCircle style={{ marginRight: '6px' }} /> Complete assignment to unlock quiz!
                    </DisabledQuiz>
                  )}
                </SectionContainerAnimated> 

        </RightColumn>
      </UnitContentGrid>
    </UnitSectionWrapper>
  );
};


  const renderContent = () => {
    switch (activeTab) {
      case "Profile":
        return renderProfileCard();
      case "Attendance": return renderAttendance();
      case "Unit": return renderUnit();
      case "Course Docs": return renderDoc()
      case "Unit":
      return renderUnit();
     // ── SYLLABUS TAB ─────────────────────────────────────────────────────────
      case "Syllabus": {
        return (
          <DocSectionWrapper>
            <DocHeaderAnimated>Syllabus</DocHeaderAnimated>
            <DividerAnimated />

            {docs && docs.length > 0 ? (
              docs.map(cd => {
                const item = cd.docs.find(d => d.type.toLowerCase() === 'syllabus');
                return (
                  <React.Fragment key={cd.courseId}>
                    <CourseTitle>{cd.courseId} – Syllabus</CourseTitle>
                    {item ? (
                      <DocContentGrid>
                        <DocViewerWrapperAnimated delay={0.4}>
                          <iframe
                            src={`https://docs.google.com/gview?url=${encodeURIComponent(item.url)}&embedded=true`}
                            frameBorder="0"
                            title={`${cd.courseId} Syllabus`}
                          />
                        </DocViewerWrapperAnimated>
                        <DocInfoPaneAnimated delay={0.6}>
                          <InfoBadge>Type: {item.type}</InfoBadge>
                          <InfoTextAnimate delay={0.8}>
                            View or download the {cd.courseId} syllabus here.
                          </InfoTextAnimate>
                          <DownloadButtonAnimated
                            as="a"
                            href={getDownloadUrl(item.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            delay={1.0}
                          >
                            Download Syllabus
                          </DownloadButtonAnimated>
                        </DocInfoPaneAnimated>
                      </DocContentGrid>
                    ) : (
                      <NoDocAnimated delay={0.4}>
                        No syllabus available for {cd.courseId}.
                      </NoDocAnimated>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <NoDocAnimated delay={0.4}>No registered courses found.</NoDocAnimated>
            )}
          </DocSectionWrapper>
        );
      }

      // ── SCHEDULE TAB ─────────────────────────────────────────────────────────
      case "Schedule": {
        return (
          <DocSectionWrapper>
            <DocHeaderAnimated>Schedule</DocHeaderAnimated>
            <DividerAnimated />

            {docs && docs.length > 0 ? (
              docs.map(cd => {
                const item = cd.docs.find(d => d.type.toLowerCase() === 'schedule');
                return (
                  <React.Fragment key={cd.courseId}>
                    <CourseTitle>{cd.courseId} – Schedule</CourseTitle>
                    {item ? (
                      <DocContentGrid>
                        <DocViewerWrapperAnimated delay={0.4}>
                          <iframe
                            src={`https://docs.google.com/gview?url=${encodeURIComponent(item.url)}&embedded=true`}
                            frameBorder="0"
                            title={`${cd.courseId} Schedule`}
                          />
                        </DocViewerWrapperAnimated>
                        <DocInfoPaneAnimated delay={0.6}>
                          <InfoBadge>Type: {item.type}</InfoBadge>
                          <InfoTextAnimate delay={0.8}>
                            View or download the {cd.courseId} schedule here.
                          </InfoTextAnimate>
                          <DownloadButtonAnimated
                            as="a"
                            href={getDownloadUrl(item.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            delay={1.0}
                          >
                            Download Schedule
                          </DownloadButtonAnimated>
                        </DocInfoPaneAnimated>
                      </DocContentGrid>
                    ) : (
                      <NoDocAnimated delay={0.4}>
                        No schedule available for {cd.courseId}.
                      </NoDocAnimated>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <NoDocAnimated delay={0.4}>No registered courses found.</NoDocAnimated>
            )}
          </DocSectionWrapper>
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
      default:   // default means activeTab matches a real unit name
        const unitData = assignments.find(a => a.unit === activeTab);
        if (!unitData) return null;
        return renderUnit(activeTab);
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
            <Section>Dashboard</Section>
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
// Styled Components (only those used in the component)

// ── THEME & LAYOUT ────────────────────────────────────────────────────────────────
const Page = styled.div`
  display: flex;
  flex-direction: column;
  background: ${p => p.theme.background};
  color: ${p => p.theme.text};
  min-height: 120vh;
  padding-top: 40px;
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
    width: 100%;
    display:flex;
    flex-wrap:wrap;
    justify-content:center;
    gap:10px;
  }
`;

const Main = styled.main`
  flex: 1;
  background: ${p => p.theme.mainBg};
  padding: 40px 0 0;
  @media (max-width: 768px) { padding: 20px; }
`;

// ── SIDEBAR & NAVIGATION ─────────────────────────────────────────────────────────
const ToggleWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 20px 0;
  background: transparent;
  @media (max-width: 768px) {
    padding: 0;
    border-radius: 30px;
  }
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
  &:checked   span {
    background-color: ${p => p.theme.mainBg};
  }
  &:checked   span:before {
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

const Section = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: ${p => p.theme.sidebarColor};
  margin-bottom: 10px;
  @media (max-width: 768px) { width: 100%; text-align: center; }
  text-align: center;
`;

const NavItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  margin: 6px 0;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  background: ${p => p.active ? p.theme.mainBg : p.theme.sidebarHover};
  color: ${p => p.active ? p.theme.text : p.theme.sidebarColor};
  transition: background 0.3s;
  &:hover {
    background: ${p => p.theme.mainBg};
    color: ${p => p.theme.text};
  }
  @media (max-width: 768px) {
    flex: 1 0 45%;
    max-width: 140px;
  }
`;

const IconWrapper = styled.span`
  font-size: 1.1rem;
`;

// ── MODAL ──────────────────────────────────────────────────────────────────────────
const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: ${p => p.theme.cardBg};
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  color: ${p => p.theme.text};
`;

// ── CARDS & BUTTONS ────────────────────────────────────────────────────────────────
const Card = styled.div`
  background: ${p => p.theme.cardBg};
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  color: ${p => p.theme.text};
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
const SmallButton = styled.button`
  padding: 6px 12px;
  background: transparent;
  color: #dc3545;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  font-size: .8rem;
  &:hover {
    color: #ff3d43;
    border: none;
  }
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const SwitchLink = styled.p`
  margin-top: 15px;
  color: #7620ff;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

// ── LOADING & ERROR STATES ────────────────────────────────────────────────────────
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

const ErrorMsg = styled.div`
  padding: 50px;
  text-align: center;
  font-size: 1.2rem;
  color: red;
`;

// ── PROFILE CARD ──────────────────────────────────────────────────────────────────
const SectionWrapper = styled.div`
  width: 100%;
  background: ${p => p.theme.background};
  color: ${p => p.theme.text};
  border-radius: 5px;
  overflow: hidden;
`;

const HeaderBanner = styled.div`
  position: relative;
  background: ${p => p.theme.sidebarBg};
  padding: 40px 20px 80px;
  text-align: center;
  color: #fff;
  @media (max-width: 768px) {
    padding: 32px 16px 64px;
  }
`;

const AvatarLarge = styled.img`
  width: 120px;
  height: 120px;
  border: 4px solid #fff;
  border-radius: 50%;
  object-fit: cover;
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  background: #ddd;
  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
    bottom: -50px;
  }
`;

const AvatarPlaceholderLarge = styled.div`
  width: 120px;
  height: 120px;
  border: 4px solid #fff;
  border-radius: 50%;
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  background: #aaa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
    bottom: -50px;
  }
`;

const NameIDWrapper = styled.div`
  position: relative;
  padding-top: 80px;
  @media (max-width: 768px) { padding-top: 64px; }
`;

const NameAnimated = styled.h1`
  margin: 0;
  font-size: 2rem;
  letter-spacing: 1px;
  animation: ${slideDown} 0.8s ease-out forwards;
  @media (max-width: 768px) { font-size: 1.5rem; }
`;

const IDAnimated = styled.span`
  display: block;
  margin-top: 4px;
  font-size: 1rem;
  opacity: 0;
  animation: ${fadeIn} 0.8s ease-out forwards;
  animation-delay: 0.4s;
  @media (max-width: 768px) { font-size: 0.9rem; }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
  padding: 100px 60px 40px;
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    padding: 80px 32px 20px;
  }
  @media (max-width: 480px) {
    padding: 64px 16px 16px;
  }
`;

const LeftInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  @media (max-width: 1024px) { gap: 16px; }
`;

const InfoBlock = styled.div`
  background: ${(p) => p.theme.cardBg};
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  @media (max-width: 480px) { padding: 16px; }
`;

const BlockTitleAnimated = styled.h3`
  margin: 0 0 12px;
  font-size: 1.2rem;
  border-bottom: 2px solid ${(p) => p.theme.buttonBg};
  display: inline-block;
  opacity: 0;
  transform: translateX(-20px);
  animation: ${slideDown} 0.6s ease-out forwards;
  @media (max-width: 480px) { font-size: 1rem; margin-bottom: 8px; }
`;

const InfoLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.95rem;
  color: ${(p) => p.theme.subText};
  @media (max-width: 768px) { gap: 8px; font-size: 0.9rem; }
  align-items: center;
`;

const IconTextAnimated = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0;
  animation: ${fadeIn} 0.6s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;
  svg { font-size: 1rem; }
  @media (max-width: 480px) { svg { font-size: 0.9rem; } gap: 4px; }
`;

const InfoTextAnimated = styled.span`
  opacity: 0;
  animation: ${fadeIn} 0.6s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;
`;

// ── PROGRESS & ASSIGNMENTS ─────────────────────────────────────────────────────────
const RightInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  @media (max-width: 1024px) { gap: 16px; }
`;

const ProgressCard = styled.div`
  background: ${(p) => p.theme.cardBg};
  padding: 24px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  @media (max-width: 480px) { padding: 16px; border-radius: 8px; }
`;

const ProgressLabelAnimated = styled.h3`
  margin: 0 0 12px;
  font-size: 1.3rem;
  color: ${(p) => p.theme.text};
  opacity: 0;
  transform: translateY(-10px);
  animation: ${slideDown} 0.6s ease-out forwards;
  @media (max-width: 480px) { font-size: 1.1rem; margin-bottom: 8px; }
`;

const ProgressBarOuter = styled.div`
  background: ${(p) => p.theme.border};
  border-radius: 8px;
  height: 20px;
  position: relative;
  overflow: hidden;
  margin-bottom: 12px;
  @media (max-width: 480px) { height: 16px; margin-bottom: 8px; }
`;

const ProgressBarInner = styled.div`
  background: ${(p) => p.theme.buttonBg};
  height: 100%;
  width: 0%;
  animation: ${(props) => keyframes`
    from { width: 0%; }
    to   { width: ${props.percent}%; }
  `} 1s ease-out forwards;
`;

const ProgressBadge = styled.div`
  position: absolute;
  top: 50%;
  right: 0%;
  transform: translate(-50%, -50%);
  background: ${(p) => p.theme.cardBg};
  color: ${(p) => p.theme.buttonBg};
  border: 2px solid ${(p) => p.theme.border};
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: left;
  font-weight: bold;
  font-size: 0.7rem;
  opacity: 0;
  animation: ${(props) => keyframes`
    from { left: 0%; opacity: 0; }
    to   { left: ${props.percent}%; opacity: 1; }
  `} 1s ease-out forwards;
  @media (max-width: 480px) { width: 28px; height: 28px; font-size: 0.8rem; }
`;

const ProgressTextAnimated = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: ${(p) => p.theme.subText};
  text-align: center;
  opacity: 0;
  animation: ${fadeIn} 0.6s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;
  @media (max-width: 480px) { font-size: 0.85rem; }
`;

const AssignmentSection = styled.div`
  background: ${(p) => p.theme.cardBg};
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  @media (max-width: 480px) { padding: 16px; border-radius: 8px; }
`;

const SectionHeaderAnimated = styled.h3`
  margin: 0 0 16px;
  font-size: 1.3rem;
  border-left: 4px solid ${(p) => p.theme.buttonBg};
  padding-left: 8px;
  opacity: 0;
  transform: translateX(-20px);
  animation: ${slideDown} 0.6s ease-out forwards;
  @media (max-width: 480px) { font-size: 1.1rem; margin-bottom: 12px; }
`;

const AssignmentListWide = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid ${p => p.theme.border};
  max-height: 260px;
  overflow-y: auto;
  @media (max-width: 768px) { max-height: 200px; }
  @media (max-width: 480px) { max-height: 160px; }
`;

const AssignmentItemWideAnimated = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid ${(p) => p.theme.border};
  opacity: 0;
  animation: ${fadeIn} 0.6s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;
  &:last-child { border-bottom: none; }
  @media (max-width: 480px) {
    padding: 8px 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
`;

const UnitLabel = styled.span`
  font-weight: 600;
  font-size: 1rem;
  color: ${p => p.theme.text};
  @media (max-width: 480px) { font-size: 0.95rem; }
`;

const ResultText = styled.span`
  font-size: 0.9rem;
  color: ${(props) => (props.passed ? '#28a745' : '#dc3545')};
  font-weight: 500;
  @media (max-width: 480px) { font-size: 0.85rem; }
`;

const PendingText = styled.span`
  font-size: 0.9rem;
  color: ${p => p.theme.subText};
  font-style: italic;
  @media (max-width: 480px) { font-size: 0.85rem; }
`;

const NoAssignmentsWideAnimated = styled.p`
  font-size: 0.9rem;
  color: ${(p) => p.theme.subText};
  text-align: center;
  padding: 12px 0;
  opacity: 0;
  animation: ${fadeIn} 0.6s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;
  @media (max-width: 480px) { font-size: 0.85rem; }
`;


 const AttendanceWrapper = styled.div`
  background: ${(p) => p.theme.cardBg};
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);

  /* Make absolutely sure it never overflows horizontally */
  width: 100%;
  
  @media (max-width: 480px) {
    padding: 16px;
    margin: 16px 0;
  }
`;

 const AttendanceHeaderAnimated = styled.h2`
  margin: 0;
  font-size: 1.8rem;
  color: ${(p) => p.theme.text};
  opacity: 0;
  transform: translateX(-30px);
  animation: ${slideInLeft} 0.7s ease-out forwards;

  @media (max-width: 480px) {
    font-size: 1.5rem;
    /* ensure it wraps inside the container */
    width: 100%;
  }
`;

const AttendanceSummaryAnimated = styled.p`
  margin-top: 8px;
  font-size: 1rem;
  color: ${(p) => p.theme.subText};
  opacity: 0;
  animation: ${fadeIn} 0.6s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;

  @media (max-width: 480px) {
    font-size: 0.95rem;
    text-align: center;
    width: 100%;
  }
`;

const AttendanceListAnimated = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  margin-top: 20px;
  opacity: 0;
  animation: ${fadeIn} 0.6s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }

  @media (max-width: 480px) {
    /* One full-width column on very small screens */
    grid-template-columns: 1fr;
    gap: 10px;
    margin-top: 16px;
    /* make sure grid itself doesn’t overflow */
    width: 100%;
  }
`;

const AttendanceCardAnimated = styled.div`
  background: ${(p) => p.theme.mainBg};
  border: 1px solid ${(p) => p.theme.border};
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  opacity: 0;
  animation: ${fadeIn} 0.5s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;

  @media (max-width: 480px) {
    padding: 10px;
    /* force the card to fit into its grid cell */
    width: 100%;
  }
`;

const DateDisplay = styled.div`
  font-size: 0.95rem;
  font-weight: 500;
  color: ${(p) => p.theme.text};
  margin-bottom: 8px;

  @media (max-width: 480px) {
    font-size: 0.9rem;
    width: 100%;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  background: ${(p) =>
    p.status.toLowerCase() === "present"
      ? "#28a745"
      : p.status.toLowerCase() === "absent"
      ? "#dc3545"
      : "#ffc107"};

  @media (max-width: 480px) {
    font-size: 0.8rem;
    padding: 3px 8px;
    /* ensure it can wrap if needed */
    width: 100%;
    text-align: center;
  }
`;

const NoDataAnimated = styled.p`
  margin: 40px 0;
  text-align: center;
  font-size: 1rem;
  color: ${(p) => p.theme.subText};
  opacity: 0;
  animation: ${fadeIn} 0.6s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;

  @media (max-width: 480px) {
    margin: 24px 0;
    font-size: 0.9rem;
    width: 100%;
  }
`;

const RequestButtonAnimated = styled.button`
  margin-top: 24px;
  background: ${(p) => p.theme.buttonBg};
  color: #fff;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0;
  transform: translateY(20px);
  animation: ${slideUpFade} 0.7s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;
  display: inline-flex;
  align-items: center;

  @media (max-width: 480px) {
    /* make the button full-width and not overflow */
    width: 100%;
    justify-content: center;
    font-size: 0.95rem;
    margin-top: 16px;
  }
`;

// ── DOCUMENT VIEWER ────────────────────────────────────────────────────────────────
const DocSectionWrapper = styled.div`
  background: ${(p) => p.theme.cardBg};
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  @media (max-width: 480px) { padding: 16px; margin: 16px 0; }
`;

const DocHeaderAnimated = styled.h2`
  margin: 0;
  font-size: 1.8rem;
  color: ${(p) => p.theme.text};
  opacity: 0;
  transform: translateX(-30px);
  animation: ${slideInLeft} 0.7s ease-out forwards;
  @media (max-width: 480px) { font-size: 1.5rem; }
`;

const DividerAnimated = styled.div`
  height: 2px;
  background: ${(p) => p.theme.border};
  margin: 12px 0 20px;
  opacity: 0;
  animation: ${fadeIn} 0.6s ease-out forwards;
  animation-delay: 0.3s;
  @media (max-width: 480px) { margin: 8px 0 16px; }
`;

const DocContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  @media (max-width: 768px) { grid-template-columns: 1fr; gap: 16px; }
`;

const CourseTitle = styled.h3`             
  margin-top: 24px;                         
  color: ${p => p.theme.text};              
`;

const DocViewerWrapperAnimated = styled.div`
  width: 100%;
  height: 0;
  padding-bottom: 60%;
  position: relative;
  opacity: 0;
  animation: ${fadeIn} 0.6s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;

  iframe {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    border: none;
    border-radius: 8px;
    background: #fff;
  }
  @media (max-width: 480px) { padding-bottom: 56%; }
`;

const DocInfoPaneAnimated = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  opacity: 0;
  transform: translateX(30px);
  animation: ${slideInRight} 0.7s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;
  @media (max-width: 480px) {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }
`;

const InfoBadge = styled.span`
  background: ${(p) => p.theme.buttonBg};
  color: #fff;
  font-size: 0.9rem;
  padding: 6px 12px;
  border-radius: 20px;
  align-self: flex-start;
  @media (max-width: 480px) { flex: 1 1 100%; text-align: center; }
`;

const InfoTextAnimate = styled.p`
  margin: 0;
  font-size: 0.95rem;
  color: ${(p) => p.theme.subText};
  opacity: 0;
  animation: ${fadeIn} 0.6s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;
  @media (max-width: 480px) {
    flex: 1 1 100%;
    font-size: 0.9rem;
    text-align: center;
  }
`;

const DownloadButtonAnimated = styled.a`
  display: inline-block;
  background: ${(p) => p.theme.buttonBg};
  color: #fff;
  padding: 10px 18px;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.95rem;
  opacity: 0;
  transform: translateY(20px);
  animation: ${keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  `} 0.7s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;
  align-self: flex-start;
  &:hover { background: darken(${(p) => p.theme.buttonBg}, 10%); }
  @media (max-width: 480px) {
    flex: 1 1 100%;
    text-align: center;
    font-size: 0.9rem;
  }
`;

const NoDocAnimated = styled.p`
  margin: 40px 0;
  text-align: center;
  font-size: 1rem;
  color: ${(p) => p.theme.subText};
  opacity: 0;
  animation: ${fadeIn} 0.6s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;
  @media (max-width: 480px) { margin: 24px 0; font-size: 0.9rem; }
`;

// ── UNITS & STUDY MATERIAL ─────────────────────────────────────────────────────────
const UnitSectionWrapper = styled.div`
  background: ${(p) => p.theme.cardBg};
  border-radius: 12px;
  padding: 34px;
  margin: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  @media (max-width: 480px) { padding: 16px; margin: 16px 0; }
`;

const UnitHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-bottom: 12px;
  @media (max-width: 480px) { margin-bottom: 8px; }
`;

const UnitTitleAnimated = styled.h2`
  margin: 0;
  font-size: 1.7rem;
  color: ${(p) => p.theme.text};
  opacity: 0;
  transform: translateX(-30px);
  animation: ${slideInLeft} 0.7s ease-out forwards;
  @media (max-width: 480px) { font-size: 1.4rem; }
`;

const LockedBadgeAnimated = styled.span`
  background: #dc3545;
  color: #fff;
  font-size: 0.9rem;
  padding: 4px 10px;
  border-radius: 20px;
  opacity: 0;
  animation: ${fadeInQuick} 0.8s ease-out forwards;
  animation-delay: 0.5s;
  @media (max-width: 480px) {
    margin-top: 5px;
      padding: 0px;
    }
`;

const Divider = styled.div`
  height: 2px;
  background: ${(p) => p.theme.border};
  margin: 12px 0 20px;
  @media (max-width: 480px) { margin: 8px 0 16px; }
`;

const UnitContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;
  @media (max-width: 768px) { grid-template-columns: 1fr; gap: 16px; }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SectionContainerAnimated = styled.div`
  opacity: 0;
  animation: ${fadeInQuick} 0.6s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;
  @media (max-width: 480px) { margin-top: 8px; }
`;

const SectionHeading = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: ${(p) => p.theme.text};
  border-left: 4px solid ${(p) => p.theme.buttonBg};
  padding-left: 8px;
  @media (max-width: 480px) { font-size: 1.1rem; margin-bottom: 8px; }
`;

const StudyCard = styled.div`
  display: flex;
  align-items: center;
  background: ${(p) => p.theme.background};
  border: 1px solid ${(p) => p.theme.border};
  border-radius: 8px;
  padding: 12px;
  gap: 12px;
  @media (max-width: 480px) 
  { 
  
  }
`;

const PDFIcon = styled.i`
  color: #d9534f;
  font-size: 24px;
  @media (max-width: 480px) {  }
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const FileNameAnimated = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: ${(p) => p.theme.text};
  margin-bottom: 4px;
  opacity: 0;
  animation: ${fadeInQuick} 0.6s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;
  @media (max-width: 480px) { font-size: 0.8rem; text-align: center; }
`;

const DownloadLinkAnimated = styled.a`
  color: ${(p) => p.theme.buttonBg};
  font-size: 0.95rem;
  text-decoration: none;
  opacity: 0;
  animation: ${fadeInQuick} 0.6s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;
  &:hover { text-decoration: underline; }
  @media (max-width: 480px) { font-size: 0.9rem;}
`;

const NoContentAnimated = styled.p`
  font-size: 0.95rem;
  color: ${(p) => p.theme.subText};
  opacity: 0;
  animation: ${fadeInQuick} 0.6s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;
  @media (max-width: 480px) { font-size: 0.9rem; }
`;

// ── SUBMISSION & FEEDBACK ─────────────────────────────────────────────────────────
const CodeTextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid ${(p) => p.theme.border};
  margin-bottom: 10px;
  font-family: monospace;
  font-size: 0.95rem;
  resize: vertical;
  opacity: ${(p) => (p.animate ? 1 : 0.5)};
  transition: opacity 0.3s ease;
  &:disabled { background: #f0f0f0; cursor: not-allowed; }
  @media (max-width: 480px) { 
  padding: 1px;
  width: 95%;
  font-size: 0.9rem; 
  }
`;

const SubmitButton = styled.button`
  background: ${(p) => p.theme.buttonBg};
  color: #fff;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  margin-bottom: 8px;
  &:hover { background: darken(${(p) => p.theme.buttonBg}, 10%); }
  &:disabled { background: #ccc; cursor: not-allowed; }
  @media (max-width: 480px) { width: 95%; font-size: 0.9rem; }
`;

const UnlockFormAnimated = styled.form`
  margin-top: 8px;
  opacity: 0;
  animation: ${fadeInQuick} 0.6s ease-out forwards;
  animation-delay: 0.9s;
`;

const UnlockButton = styled.button`
  background: #ffa500;
  color: #2f3e4e;
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  &:hover { background: darken(#ffa500, 10%); }
  @media (max-width: 480px) { font-size: 0.85rem; }
`;

const FileInputWrapper = styled.div`
  position: relative;
  display: inline-block;
  margin-bottom: 8px;
`;

const FileInput = styled.input`
  opacity: 0;
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
`;


const UploadLabel = styled.label`
  display: inline-block;
  background: ${(p) => p.theme.buttonBg};
  color: #fff;
  padding: 4px 7px;
  border-radius: 6px;
  cursor: pointer;
  opacity: ${(p) => (p.animate ? 1 : 0.6)};
  transition: opacity 0.3s ease;
  font-size: 0.7rem;
  &:hover { background: darken(${(p) => p.theme.buttonBg}, 10%); }
  @media (max-width: 480px) { font-size: 0.9rem; }
`;


const UploadedInfoAnimated = styled.div`
  margin-top: 6px;
  font-size: 0.9rem;
  color: ${(p) => p.theme.subText};
  opacity: 0;
  animation: ${fadeInQuick} 0.6s ease-out forwards;
  animation-delay: ${(p) => p.delay || 0}s;
  @media (max-width: 480px) { font-size: 0.85rem; }
`;

const UploadedLink = styled.a`
  color: ${(p) => p.theme.buttonBg};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const ResultTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
  th, td {
    border: 1px solid ${(p) => p.theme.border};
    padding: 8px;
    text-align: center;
  }
  th {
    background: ${(p) => p.theme.mainBg};
    font-weight: 600;
    font-size: 0.95rem;
  }
  td {
    font-size: 0.9rem;
    color: ${(p) => p.theme.text};
  }
  @media (max-width: 480px) {
    th, td { padding: 6px; font-size: 0.85rem; }
  }
`;

const ResultTh = styled.th`
  padding: 8px;
  text-align: left;
  background-color: #f5f5f5;
  font-weight: bold;
`;

const ResultTd = styled.td`
  padding: 8px;
  border-bottom: 1px solid #ddd;
`;

const ResultStatus = styled.span`
  color: ${(props) => (props.passed ? "#28a745" : "#dc3545")};
  font-weight: 500;
`;

const FeedbackTextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid ${(p) => p.theme.border};
  margin-bottom: 10px;
  font-size: 0.95rem;
  resize: vertical;
  opacity: ${(p) => (p.animate ? 1 : 0)};
  animation: ${fadeInQuick} 0.6s ease-out forwards;
  animation-delay: 2.6s;
  &:focus { outline: 2px solid ${(p) => p.theme.buttonBg}; }
  @media (max-width: 480px) {
    font-size: 0.9rem; 
    padding: 1px;
    width: 95%;
    }
`;

const FeedbackButton = styled.button`
  background: ${(p) => p.theme.buttonBg};
  color: #fff;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  opacity: 0;
  animation: ${fadeInQuick} 0.6s ease-out forwards;
  animation-delay: 3.2s;
  &:hover { background: darken(${(p) => p.theme.buttonBg}, 10%); }
  @media (max-width: 480px) 
  { 
  width: 95%; 
  font-size: 0.9rem;
  padding: 8px 16px; 
  }
`;

const EmbedWrapper = styled.div`
  width: 100%;
  height: 600px;
  margin-bottom: 16px;
`;

const UnitRow = styled.div` /* new */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #ddd;
`;
const UnitName = styled.div` /* new */
  font-weight: 600;
`;
const StatusText = styled.div` /* new */
  font-style: italic;
  margin-left: 1rem;
`;

const SpinnerSmall = styled.div` /* new */
  border: 2px solid #f3f3f3;
  border-top: 2px solid #7620ff;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 16px; right: 16px;
  display: flex; flex-direction: column; gap: 8px;
  z-index: 1000;
`;

const QuizWrapperAnimated = styled.div` /* new */
  animation: ${fadeInQuick} 0.5s ease-in;
  margin-top: 12px;
  /* add any styling needed for quiz container */
`;
const DisabledQuiz = styled.div` // new
  color: #888;
  display: flex;
  align-items: center;
  font-style: italic;
  margin-top: 8px;
`;

const QuizContainer = styled.div` // new
  background: ${({ theme }) => theme.cardBg};
  padding: 16px;
  border-radius: 8px;
  animation: ${fadeInQuick} 0.4s ease-in;
  margin-top: 8px;
`;
const QuestionBlock = styled.div` // new inside QuizComponent
  margin-bottom: 12px;
`;
const OptionRow = styled.div` // new inside QuizComponent
  display: flex;
  align-items: center;
  margin-bottom: 6px;
`;
const OptionLabel = styled.label` // new inside QuizComponent
  margin-left: 6px;
`;
const SubmitQuizButton = styled.button` // new inside QuizComponent
  padding: 8px 16px;
  background: #4caf50;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 8px;
  &:disabled {
    background: #aaa;
    cursor: not-allowed;
  }
`;
const ErrorText = styled.p` // new
  color: red;
  margin-top: 6px;
`;
const SuccessText = styled.p` // new
  color: green;
  margin-top: 6px;
`;
const LoadingText = styled.p` // new
  display: flex;
  align-items: center;
  & .spin {
    margin-right: 6px;
    animation: ${spin} 1s linear infinite;
  }
`;
const InfoText = styled.p` // new
  color: #555;
  margin-top: 6px;
`;

const QuizResultWrapper = styled.div`
  margin-top: 16px;
  background: #f6f6f6;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
`;

const FeeTimerWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  color: ${p => p.theme.text};
  animation: ${slideInRight} 0.6s ease-out forwards;
  background: linear-gradient(90deg, rgba(255,229,100,0.1), rgba(255,229,100,0));
  padding: 8px 12px;
  border-left: 4px solid #ffc107;
  border-radius: 6px;
  margin-top: 6px;

  svg {
    color: #ff9800;
    animation: ${spin} 1.2s linear infinite;
    font-size: 1.1rem;
  }
`;

const ModalContent = styled.div`
  background: #fff;
  padding: 50px;
  border-radius: 10px;
  // width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
`;

const Textarea = styled.textarea`
  width: 100%;
  height: 80px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
`;

const LeavePreviewWrapperAnimated = styled.div`
  animation: ${fadeIn} 0.5s ease;
  margin-top: 1rem;
  table {
    width: 100%;
    border-collapse: collapse;
    th, td {
      padding: 0.5rem;
      border: 1px solid #ccc;
      text-align: left;
    }
    th {
      background: #f8f8f8;
    }
  }
`;

const SmallBadge = styled.span`
  display: inline-block;
  background: #d4edda;
  color: #155724;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const CharacterCount = styled.div`
  text-align: right;
  font-size: 12px;
  color: #888;
  margin-top: 4px;
`;