import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '.././components/Pages/firebase';
import TopNavbar from '.././components/Nav/TopNavbar';
import Footer from '.././components/Sections/Footer';

const StudentSignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    studentRegID: '',
    name: '',
    course: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    let errs = {};
    if (!/^\d{12}$/.test(formData.studentRegID))
      errs.studentRegID = "Student RegID must be exactly 12 digits.";
    if (!formData.name.trim())
      errs.name = "Name is required.";
    if (!formData.course.trim())
      errs.course = "Course is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email))
      errs.email = "A valid email is required.";
    if (!/^\d{10}$/.test(formData.mobile))
      errs.mobile = "Mobile number must be exactly 10 digits.";
    if (!formData.password)
      errs.password = "Password is required.";
    if (!formData.confirmPassword)
      errs.confirmPassword = "Please confirm your password.";
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword)
      errs.confirmPassword = "Passwords do not match.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      // Create user with Firebase Authentication (this automatically logs in the user)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      // Save student details in Firestore (using studentRegID as the document ID)
      await setDoc(doc(db, "students", formData.studentRegID), {
        studentRegID: formData.studentRegID,
        name: formData.name,
        course: formData.course,
        email: formData.email,
        mobile: formData.mobile,
        uid: userCredential.user.uid,
        quizCompleted: false,
        score: 0
      });
      // Store studentRegID in localStorage for later use in the quiz
      localStorage.setItem('studentRegID', formData.studentRegID);

      // Sign out the user so they are not automatically logged in
      await signOut(auth);

      setSuccessModal(true);
      setTimeout(() => {
        setSuccessModal(false);
        navigate("/s-loginPage");
      }, 2000);
    } catch (error) {
      console.error("Error during sign up:", error);
      setErrorModal(error.message);
      setTimeout(() => setErrorModal(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <TopNavbar />
      <FormWrapper>
        <h1>Sign Up</h1>
        {errors.general && <ErrorText>{errors.general}</ErrorText>}
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>Student RegID</Label>
            <Input
              type="text"
              name="studentRegID"
              value={formData.studentRegID}
              onChange={handleChange}
              placeholder="Enter 12-digit Student RegID"
            />
            {errors.studentRegID && <ErrorText>{errors.studentRegID}</ErrorText>}
          </InputGroup>
          <InputGroup>
            <Label>Name</Label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
            {errors.name && <ErrorText>{errors.name}</ErrorText>}
          </InputGroup>
          <InputGroup>
            <Label>Course</Label>
            <Input
              type="text"
              name="course"
              value={formData.course}
              onChange={handleChange}
              placeholder="Enter your course"
            />
            {errors.course && <ErrorText>{errors.course}</ErrorText>}
          </InputGroup>
          <InputGroup>
            <Label>Email</Label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
            {errors.email && <ErrorText>{errors.email}</ErrorText>}
          </InputGroup>
          <InputGroup>
            <Label>Mobile No</Label>
            <Input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Enter 10-digit mobile number"
            />
            {errors.mobile && <ErrorText>{errors.mobile}</ErrorText>}
          </InputGroup>
          <InputGroup>
            <Label>Password</Label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
            />
            {errors.password && <ErrorText>{errors.password}</ErrorText>}
          </InputGroup>
          <InputGroup>
            <Label>Confirm Password</Label>
            <Input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && <ErrorText>{errors.confirmPassword}</ErrorText>}
          </InputGroup>
          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? "Registering..." : "Sign Up"}
          </SubmitButton>
          <SignupLink onClick={() => navigate("/s-loginPage")}>
            Have an account?
          </SignupLink>
        </Form>
      </FormWrapper>
      {successModal && (
        <ModalOverlay>
          <ModalContent>
            <SuccessTitle>
              Registration Successful!{" "}
              <i className="fa-solid fa-circle-check fa-bounce" style={{ color: "#14a800" }}></i>
            </SuccessTitle>
            <ModalCloseButton onClick={() => setSuccessModal(false)}>Close</ModalCloseButton>
          </ModalContent>
        </ModalOverlay>
      )}
      {errorModal && (
        <ModalOverlay>
          <ModalContent>
            <ErrorTitle>Error</ErrorTitle>
            <p>{errorModal}</p>
            <ModalCloseButton onClick={() => setErrorModal('')}>Close</ModalCloseButton>
          </ModalContent>
        </ModalOverlay>
      )}
      <Footer />
    </Container>
  );
};

export default StudentSignUp;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  align-items: center;
  background: #f2f2f2;
`;

const FormWrapper = styled.div`
  background: #fff;
  padding: 40px 30px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  width: 400px;
  text-align: center;
  margin: 100px 0 50px;
  @media (max-width: 480px) {
    width: 90%;
    padding: 30px 20px;
  }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  textarea:-webkit-autofill,
  textarea:-webkit-autofill:hover,
  textarea:-webkit-autofill:focus {
      -webkit-text-fill-color: black !important;
      transition: background-color 5000s ease-in-out 0s;
  }
`;

const SignupLink = styled.div`
  color: #580cd2;
  text-decoration: none;
  text-align: center;
  cursor: pointer;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const InputGroup = styled.div`
  margin-bottom: 15px;
  text-align: left;
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: bold;
`;

const Input = styled.input`
  padding: 10px;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
`;

const SubmitButton = styled.button`
  padding: 12px;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
  margin-bottom: 10px;
  &:hover {
    background: #580cd2;
  }
`;

const ErrorText = styled.span`
  color: red;
  font-size: 13px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const ModalContent = styled.div`
  background: #fff;
  padding: 30px 20px;
  border-radius: 8px;
  text-align: center;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
`;

const SuccessTitle = styled.h2`
  color: green;
  margin-bottom: 15px;
  font-size: 22px;
`;

const ErrorTitle = styled.h2`
  color: red;
  margin-bottom: 15px;
  font-size: 22px;
`;

const ModalCloseButton = styled.button`
  margin-top: 15px;
  padding: 8px 16px;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background: #580cd2;
  }
`;
