// src/components/StudentLogin.jsx
import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../components/Pages/firebase';
import TopNavbar from '../components/Nav/TopNavbar';
import Footer from '../components/Sections/Footer';
import { AuthContext } from '../contexts/AuthContext';

const StudentLoginPage = () => {
  const navigate = useNavigate();
  const { setRole } = useContext(AuthContext);

  const [identifier, setIdentifier] = useState(''); // User ID or Email
  const [password, setPassword]       = useState('');
  const [errorMsg, setErrorMsg]       = useState('');
  const [isLoading, setIsLoading]     = useState(false);

  // Helper: if identifier is not an email, look up email by userId
  const resolveEmail = async (idOrEmail) => {
    if (idOrEmail.includes('@')) return idOrEmail;
    // fetch profile to get email
    const resp = await fetch(`/api/students/${idOrEmail}/profile`);
    if (!resp.ok) throw new Error('Invalid User ID');
    const data = await resp.json();
    if (!data.email) throw new Error('No email on record');
    return data.email;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      const email = await resolveEmail(identifier.trim());
      await signInWithEmailAndPassword(auth, email, password);
      setRole('student');
      // after login you can redirect to Quiz or Dashboard:
      navigate('/StudentDashboard');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async () => {
    setErrorMsg('');
    if (!identifier) {
      setErrorMsg('Enter your Email and click the reset.');
      return;
    }
    setIsLoading(true);
    try {
      const email = await resolveEmail(identifier.trim());
      await sendPasswordResetEmail(auth, email);
      setErrorMsg('Password reset email sent.');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <TopNavbar />
      <FormWrapper>
        <h1>Student Login</h1>
        {errorMsg && <ErrorText>{errorMsg}</ErrorText>}
        <Form onSubmit={handleLogin}>
          <InputGroup>
            <Label>User ID</Label>
            <Input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="Enter your User ID"
            />
          </InputGroup>

          <InputGroup>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </InputGroup>

          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in…' : 'Login'}
          </SubmitButton>
        </Form>

        <AuxLinks>
          <LinkButton type="button" onClick={handleForgot} disabled={isLoading}>
            Forgot password?
          </LinkButton>
          {/* <LinkButton type="button" onClick={() => navigate('/s-signUpPage')}>
            Create new account
          </LinkButton> */}
        </AuxLinks>
      </FormWrapper>
      <Footer />
    </Container>
  );
};

export default StudentLoginPage;

// Styled Components

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f2f2f2;
  align-items: center;
`;

const FormWrapper = styled.div`
  background: #fff;
  padding: 40px 30px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  width: 400px;
  margin: 120px 0;
  text-align: center;

  @media (max-width: 760px) {
    width: 300px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-text-fill-color: black !important;
    transition: background-color 5000s ease-in-out 0s;
  }
    @media (max-width: 600px) {
    grid-template-columns:1fr !important;
    gap:12px;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 15px;
  text-align: left;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
`;

const Input = styled.input`
  padding: 10px;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 5px;
  &:focus {
    border-color: #ff9900;
    outline: none;
  }
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

  &:hover:not(:disabled) {
    background: #580cd2;
  }
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const AuxLinks = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
`;

const LinkButton = styled.button`
  background: none;
  border: none;
  color: #580cd2;
  text-decoration: underline;
  cursor: pointer;
  margin: 5px 0;
  font-size: 14px;

  &:disabled {
    color: #999;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.div`
  color: red;
  font-size: 13px;
  margin-bottom: 15px;
`;
