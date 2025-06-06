import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import TopNavbar from '../Nav/TopNavbar';
import Footer from '../Sections/Footer';
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../Pages/firebase';
import { signOut, onAuthStateChanged  } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const sampleQuestions = [
  {
    id: 1,
    question: "In Excel what is the SUM formula of two different ranges from A1 to A10?",
    options: ["SUM(A1,A10)", "SUM(A1.A10)", "=SUM(A1:A10)", "SUM(A1;A10)"],
    correct: "=SUM(A1:A10)",
  },
  {
    id: 2,
    question: "In Excel what is the PRODUCT formula of two cells with Names C1 and D1?",
    options: ["=PRODUCT (C1,D1)", "=C1 * D1", "= PRODUCT (C1;D1)", "PRODUCT (C1:D1)"],
    correct: "=C1 * D1",
  },
  {
    id: 3,
    question: "In Excel what is the SUBTRACT formula of two cells with Names D8 and D9?",
    options: ["= SUBTRACT (D8-D9)", "=SUBTRACT(D8:D9)", "= SUBTRACT (D8,D9)", "=-D8-D9"],
    correct: "=-D8-D9",
  },
  {
    id: 4,
    question: "What is the Basic term used in Agile Project Methodology?",
    options: ["Milestone", "Steps", "Process", "Work"],
    correct: "Milestone",
  },
  {
    id: 5,
    question: "In Agile Project Methodology, what is the expansion of WIP in Task Status means?",
    options: ["Work In Process", "Work In Progress", "Work In Pressure", "Work In PowerPoint"],
    correct: "Work In Progress",
  },
  {
    id: 6,
    question: "PowerBi tool is developed by which company?",
    options: ["Microsoft", "Meta", "Windows", "Google"],
    correct: "Microsoft",
  },
  {
    id: 7,
    question: "Which is the free version of PowerBi Package?",
    options: ["PowerBi Meta", "PowerBi Desktop", "PowerBi Pro", "PowerBi Premium"],
    correct: "PowerBi Desktop",
  },
  {
    id: 8,
    question: "What is the basic Get Data option in PowerBi Package?",
    options: ["MySQL", "Oracle", "Text file", "Excel workbook"],
    correct: "Excel workbook",
  },
  {
    id: 9,
    question: "In Database Relationship Model an Candidate name with Passport Id falls under which category?",
    options: ["Many-to-One", "One-to-One", "One-to-Many", "Self Referencing"],
    correct: "One-to-Many",
  },
  {
    id: 10,
    question: "What is the basic extension of PowerBi Desktop Package?",
    options: [".pptx", ".pbix", ".pbit", ".pbip"],
    correct: ".pbix",
  },
  {
    id: 11,
    question: "What is an JIRA software used for?",
    options: ["Project Management tool", "To create ppt", "Data sheet", "Google analytics tool"],
    correct: "Project Management tool",
  },
  {
    id: 12,
    question: "PowerBi is mainly used for what purpose?",
    options: ["Write SQL query", "To create text file", "Create XML", "Creating Report and Dashboard"],
    correct: "Creating Report and Dashboard",
  },
  {
    id: 13,
    question: "Which visualization is best for showing trends over time in Power BI?",
    options: ["Pie Chart", "Bar Chart", "Line Chart", "Scatter Plot"],
    correct: "Line Chart",
  },
  {
    id: 14,
    question: "Which is the Basic view for PowerBi Desktop?",
    options: ["Report", "Model", "DAX", "TreeMap"],
    correct: "Report",
  },
  {
    id: 15,
    question: "Which language is primarily used for writing custom calculations in Power BI?",
    options: ["SQL", "DAX", "Python", "JavaScript"],
    correct: "DAX",
  },
];

const shuffleArray = (arr) => {
  const arrayCopy = [...arr];
  for (let i = arrayCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
  }
  return arrayCopy;
};

const QuizPage = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [studentRegID, setStudentRegID] = useState(null);
  const [quizAlreadyTaken, setQuizAlreadyTaken] = useState(false);
  const [loading, setLoading] = useState(true);

  // Feedback modal state. Rating is a number between 0 and 5.
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    useful: '',
    understandable: '',
    project: '',
    comments: '',
    rating: 0,
  });
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const studentsRef = collection(db, "students");
          const q = query(studentsRef, where("uid", "==", user.uid));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            const studentDoc = querySnap.docs[0];
            const regID = studentDoc.id;
            setStudentRegID(regID); // NEW
            if (studentDoc.data().quizCompleted) {
              setQuizAlreadyTaken(true); // NEW
            }
          }
        } catch (error) {
          console.error("Error fetching student data:", error); // NEW
        } finally {
          setQuestions(shuffleArray(sampleQuestions)); // NEW
        }
      } else {
        setQuestions(shuffleArray(sampleQuestions)); // NEW
      }
      setLoading(false); // CHANGED: set loading to false after auth check completes
    });
    return () => unsubscribe();
  }, []);

  const handleOptionSelect = (option) => setSelectedOption(option);

  const handleNextQuestion = async () => {
    setLoading(true);
    let newScore = scoreRef.current;
    if (selectedOption === questions[currentQIndex].correct) {
      newScore += 2; // Award 2 points for a correct answer
      scoreRef.current = newScore;
    }
    setScore(newScore);
    setSelectedOption('');

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      if (studentRegID) {
        try {
          const studentRef = doc(db, "students", studentRegID);
          await updateDoc(studentRef, { score: newScore, quizCompleted: true });
          setQuizAlreadyTaken(true);
        } catch (error) {
          console.error("Error updating quiz score in Firestore:", error);
        }
      }
      setQuizSubmitted(true);
      setShowResultModal(true);
    }
    setLoading(false);
  };

  const handlePreviousQuestion = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
      setSelectedOption('');
    }
  };

  const handleRetakeQuiz = async () => {
    if (studentRegID) {
      try {
        const studentRef = doc(db, "students", studentRegID);
        await updateDoc(studentRef, { quizCompleted: false, score: 0 });
      } catch (error) {
        console.error("Error resetting quiz status in Firestore:", error);
      }
    }
    setQuizAlreadyTaken(false);
    setQuizSubmitted(false);
    setCurrentQIndex(0);
    setScore(0);
    scoreRef.current = 0;
    setQuestions(shuffleArray(sampleQuestions));
  };

  // Close result modal and trigger feedback modal after 2 seconds.
  const closeResultModal = () => {
    setShowResultModal(false);
    setTimeout(() => {
      setShowFeedbackModal(true);
    }, 3000);
  };

  // Handler for radio and text inputs.
  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedbackForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackLoading(true);
    try {
      await addDoc(collection(db, "PMIST-1-feedback"), {
        studentRegID,
        feedback: feedbackForm,
        createdAt: serverTimestamp(),
      });
      // console.log("Feedback submitted successfully.");
      setFeedbackSent(true);
      await signOut(auth);
      localStorage.removeItem('studentRegID');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const openFeedbackModal = () => {
    setShowFeedbackModal(true);
  };

  return (
    <Container>
      <TopNavbar />
      <Content>
        {loading ? (
          <SpinnerWrapper>
            <LoadingSpinner />
          </SpinnerWrapper>
        ) : (
          studentRegID ? (
            quizAlreadyTaken ? (
              <>
                <AlreadyTakenMessage>
                  Your response has been recorded <i className="fa-solid fa-circle-check fa-bounce" style={{ color: "#14a800" }}></i>
                </AlreadyTakenMessage>
                <RetakeButton onClick={handleRetakeQuiz}>Retake Quiz</RetakeButton>
                <FeedbackLink onClick={openFeedbackModal}>Give Feedback</FeedbackLink>
              </>
            ) : (
              !quizSubmitted ? (
                <>
                  <QuestionCard>
                    <QuestionText>
                      Q{currentQIndex + 1}. {questions[currentQIndex]?.question}
                    </QuestionText>
                    <Options>
                      {questions[currentQIndex]?.options.map(option => (
                        <OptionButton
                          key={option}
                          selected={selectedOption === option}
                          onClick={() => handleOptionSelect(option)}
                        >
                          {option}
                        </OptionButton>
                      ))}
                    </Options>
                  </QuestionCard>
                  <NavigationButtons>
                    <NavButton onClick={handlePreviousQuestion} disabled={currentQIndex === 0}>
                      Previous
                    </NavButton>
                    <NavButton onClick={handleNextQuestion} disabled={!selectedOption}>
                      {currentQIndex === questions.length - 1 ? "Submit Quiz" : "Next"}
                    </NavButton>
                  </NavigationButtons>
                </>
              ) : (
                <ResultCard>
                  <ResultText>Your Score: {score} / 30</ResultText>
                  <NavButton onClick={() => window.location.reload()}>
                    Retake Quiz
                  </NavButton>
                  <>
                  <FeedbackLink onClick={openFeedbackModal}>Give Feedback</FeedbackLink>
                  </>
                </ResultCard>
              )
            )
          ) : (
            <NoStudentIDMessage>Please log in to take the quiz.</NoStudentIDMessage>
          )
        )}
      </Content>
      <Footer />

      {/* Result Modal */}
      {showResultModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>Quiz Submitted!</ModalTitle>
            <ModalMessage>Your final score is {score} out of 30.</ModalMessage>
            <ModalButton onClick={closeResultModal}>Close</ModalButton>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <ModalOverlay>
          <ModalContent>
            {feedbackLoading ? (
              <SpinnerWrapper>
                <LoadingSpinner />
              </SpinnerWrapper>
            ) : feedbackSent ? (
              <>
                <ModalTitle>Feedback Sent!</ModalTitle>
                <ModalMessage>
                  Thank you for your feedback. You will be logged out shortly.
                </ModalMessage>
              </>
            ) : (
              <>
                <ModalTitle>Feedback</ModalTitle>
                <FeedbackForm onSubmit={handleFeedbackSubmit}>
                  <FeedbackLabel>
                    1. Was this Hands-On Session useful for you?
                  </FeedbackLabel>
                  <div>
                    <RadioOption>
                      <input
                        type="radio"
                        name="useful"
                        value="Yes, completely useful"
                        checked={feedbackForm.useful === "Yes, completely useful"}
                        onChange={handleFeedbackChange}
                        required
                      />
                      <label>Yes, completely useful</label>
                    </RadioOption>
                    <RadioOption>
                      <input
                        type="radio"
                        name="useful"
                        value="No"
                        checked={feedbackForm.useful === "No"}
                        onChange={handleFeedbackChange}
                      />
                      <label>No</label>
                    </RadioOption>
                  </div>

                  <FeedbackLabel>
                    2. Was PowerBi taught to you understandable for you?
                  </FeedbackLabel>
                  <div>
                    <RadioOption>
                      <input
                        type="radio"
                        name="understandable"
                        value="Yes, it was understandable"
                        checked={feedbackForm.understandable === "Yes, it was understandable"}
                        onChange={handleFeedbackChange}
                        required
                      />
                      <label>Yes, it was understandable</label>
                    </RadioOption>
                    <RadioOption>
                      <input
                        type="radio"
                        name="understandable"
                        value="No"
                        checked={feedbackForm.understandable === "No"}
                        onChange={handleFeedbackChange}
                      />
                      <label>No</label>
                    </RadioOption>
                  </div>

                  <FeedbackLabel>
                    3. Can you work on any new projects in PowerBi?
                  </FeedbackLabel>
                  <div>
                    <RadioOption>
                      <input
                        type="radio"
                        name="project"
                        value="Yes, we can develop it"
                        checked={feedbackForm.project === "Yes, we can develop it"}
                        onChange={handleFeedbackChange}
                        required
                      />
                      <label>Yes, we can develop it</label>
                    </RadioOption>
                    <RadioOption>
                      <input
                        type="radio"
                        name="project"
                        value="No"
                        checked={feedbackForm.project === "No"}
                        onChange={handleFeedbackChange}
                      />
                      <label>No</label>
                    </RadioOption>
                  </div>

                  <FeedbackLabel>
                    4. Add your comments about the session:
                  </FeedbackLabel>
                  <FeedbackTextarea
                    name="comments"
                    value={feedbackForm.comments}
                    onChange={handleFeedbackChange}
                    required
                    placeholder="Enter your comments here..."
                  />

                  <FeedbackLabel>
                    5. Ratings on the work of Resource Person and supporting teams:
                  </FeedbackLabel>
                  <div>
                    {[1, 2, 3, 4, 5].map((val) => (
                      <RatingButton
                        type="button"
                        key={val}
                        filled={feedbackForm.rating >= val}
                        onClick={() =>
                          setFeedbackForm((prev) => ({ ...prev, rating: val }))
                        }
                      >
                        {feedbackForm.rating >= val ? "★" : "☆"}
                      </RatingButton>
                    ))}
                  </div>

                  <ModalButton type="submit">Submit Feedback</ModalButton>
                </FeedbackForm>
              </>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default QuizPage;

// Spinner Component
const LoadingSpinner = () => <Spinner />;

// Styled Components

const Container = styled.div`
  min-height: 100vh;
  background: #f7f7f7;
  display: flex;
  flex-direction: column;
`;

const Content = styled.main`
  flex: 1;
  max-width: 800px;
  margin: 100px auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  text-align: center;
`;

const QuestionCard = styled.div`
  margin-bottom: 20px;
`;

const QuestionText = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 15px;
`;

const Options = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const OptionButton = styled.button`
  padding: 10px 15px;
  font-size: 1rem;
  background: ${(props) => (props.selected ? "#7620ff" : "#fff")};
  color: ${(props) => (props.selected ? "#fff" : "#333")};
  border: 2px solid #7620ff;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
  &:hover {
    background: #580cd2;
    color: #fff;
  }
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
`;

const NavButton = styled.button`
  padding: 12px 20px;
  font-size: 1rem;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const ResultCard = styled.div`
  padding: 20px;
  border: 2px solid #7620ff;
  border-radius: 8px;
  background: #f2f2f2;
`;

const ResultText = styled.h2`
  font-size: 1.5rem;
  color: #333;
`;

const AlreadyTakenMessage = styled.div`
  font-size: 1.2rem;
  color: green;
  text-align: center;
  margin-bottom: 20px;
`;

const RetakeButton = styled.button`
  margin-top: 15px;
  padding: 10px 20px;
  font-size: 1rem;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background: #580cd2;
  }
`;

const NoStudentIDMessage = styled.p`
  font-size: 1.2rem;
  color: red;
  text-align: center;
`;

const FeedbackLink = styled.span`
  display: block;
  margin-top: 20px;
  color: #7620ff;
  cursor: pointer;
  text-decoration: underline;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const ModalContent = styled.div`
  background: #fff;
  padding: 30px 40px;
  border-radius: 10px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
`;

const ModalTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 15px;
  color: #333;
`;

const ModalMessage = styled.p`
  font-size: 1rem;
  margin-bottom: 20px;
  color: #555;
`;

const ModalButton = styled.button`
  padding: 10px 20px;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
`;

const FeedbackForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  text-align: left;
  max-height: 300px;
  overflow-y: scroll;
`;

const FeedbackLabel = styled.label`
  font-size: 0.95rem;
  color: #333;
`;

const FeedbackTextarea = styled.textarea`
  // width: 100%;
  padding: 8px 10px;
  margin-top: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
  min-height: 80px;
`;

const RadioOption = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 5px;
`;

const RatingButton = styled.button`
  background: transparent;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: ${(props) => (props.filled ? "rgb(255, 217, 2)" : " #ccc")};
  transition: .5s;
`;

const SpinnerWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const Spinner = styled.div`
  border: 5px solid #f3f3f3;
  border-top: 5px solid #7620ff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
