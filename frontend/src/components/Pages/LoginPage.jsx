// src/components/Pages/LoginPage.jsx
import React, { useState, useContext } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
import { getUserEmailFromUsername } from './getUserEmailFromUsername';
import TopNavbar from '../Nav/TopNavbar';
import Footer from '../Sections/Footer';
import { AuthContext } from '../../contexts/AuthContext'; // Import AuthContext

const LoginPage = () => {
  const navigate = useNavigate();
  const { setRole } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, message: '', type: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    let tempErrors = {};

    if (!username.trim()) {
      tempErrors.username = 'Username is required';
    } else if (!/^(EMPAD|REFSD)\d{3}$/.test(username)) {
      tempErrors.username = 'Username must be in format EMPAD001 or REFSD001';
    }
    if (!password) {
      tempErrors.password = 'Password is required';
    }

    setErrors(tempErrors);

    if (Object.keys(tempErrors).length === 0) {
      try {
        setIsLoading(true);
        const email = await getUserEmailFromUsername(username);
        if (!email) {
          setModal({ isOpen: true, message: 'Username not found.', type: 'error' });
          setIsLoading(false);
          return;
        }
        await signInWithEmailAndPassword(auth, email, password);
        if (username.startsWith('EMPAD')) {
          setRole('admin');
          setModal({ isOpen: true, message: 'Login successful as Admin!', type: 'success' });
          setTimeout(() => {
            setModal({ isOpen: false, message: '', type: '' });
            navigate('/admin');
          }, 2000);
        } else if (username.startsWith('REFSD')) {
          setRole('referrer');
          setModal({ isOpen: true, message: 'Login successful as Referrer!', type: 'success' });
          setTimeout(() => {
            setModal({ isOpen: false, message: '', type: '' });
            navigate('/refCandidList');
          }, 2000);
        } else {
          setModal({ isOpen: true, message: 'Login successful, but role not identified.', type: 'error' });
          setTimeout(() => {
            setModal({ isOpen: false, message: '', type: '' });
            navigate('/dashboard');
          }, 2000);
        }
      } catch (error) {
        console.error('Login error:', error);
        setModal({ isOpen: true, message: 'Login failed: ' + error.message, type: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Wrapper>
      <TopNavbar />
      <Content>
        <FormContainer>
          <Title>Login</Title>
          <Form onSubmit={handleLogin}>
            <Label>User ID</Label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., EMPAD001 or REFSD001"
            />
            {errors.username && <ErrorText>{errors.username}</ErrorText>}
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
            {errors.password && <ErrorText>{errors.password}</ErrorText>}
            <Button type="submit">Login</Button>
          </Form>
          {isLoading && (
            <SpinnerOverlay>
              <Spinner />
            </SpinnerOverlay>
          )}
          <SwitchLink onClick={() => navigate('/reset-password')}>
            Forgot Password?
          </SwitchLink>
        </FormContainer>
      </Content>
      <Footer />
      {modal.isOpen && (
        <ModalOverlay>
          <ModalContent>
            <ModalMessage type={modal.type}>{modal.message}</ModalMessage>
            <CloseButton onClick={() => setModal({ isOpen: false, message: '', type: '' })}>
              &times;
            </CloseButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </Wrapper>
  );
};

export default LoginPage;

// Styled Components

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 170vh;
  background: linear-gradient(90deg, #f7f7f7, #eaeaea);
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 80px;
  background: #f7f7f7;
`;

const FormContainer = styled.div`
  background: #fff;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0px 4px 12px rgba(0,0,0,0.1);
  width: 400px;
  text-align: center;
  position: relative;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  color: #333;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  text-align: left;
  
  /* Fix autofill text color */
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

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: bold;
`;

const Input = styled.input`
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  &:focus {
    border-color: #ff9900;
    outline: none;
  }
`;

const Button = styled.button`
  padding: 12px;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
  &:hover {
    background: #580cd2;
    transition: .5s;
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

const ErrorText = styled.span`
  color: red;
  font-size: 14px;
  margin-bottom: 10px;
`;

// Spinner styled components
const SpinnerOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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

// Modal styled components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  position: relative;
  width: 300px;
  text-align: center;
`;

const ModalMessage = styled.p`
  color: ${({ type }) => (type === 'success' ? 'green' : 'red')};
  font-weight: bold;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 5px;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
`;
