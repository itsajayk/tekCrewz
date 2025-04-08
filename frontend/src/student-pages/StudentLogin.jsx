import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '.././components/Pages/firebase';
import TopNavbar from '.././components/Nav/TopNavbar';
import Footer from '.././components/Sections/Footer';
import { AuthContext } from '../contexts/AuthContext'; // Import AuthContext

const StudentLoginPage = () => {
  const navigate = useNavigate();
  const { setRole } = useContext(AuthContext); // Get setRole method
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Set the role as "student"
      setRole('student');
      // On successful login, navigate to the Quiz page.
      navigate("/Quiz");
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <TopNavbar />
      <FormWrapper>
        <h1>Login</h1>
        {errorMsg && <ErrorText>{errorMsg}</ErrorText>}
        <Form onSubmit={handleLogin}>
          <InputGroup>
            <Label>Email</Label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter your email" 
            />
          </InputGroup>
          <InputGroup>
            <Label>Password</Label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter your password" 
            />
          </InputGroup>
          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </SubmitButton>
        </Form>
        <SignupLink onClick={() => navigate("/s-signUpPage")}>
          Create a new account?
        </SignupLink>
      </FormWrapper>
      <Footer />
    </Container>
  );
};

export default StudentLoginPage;

// Styled Components

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  justify-content: center;
  align-items: center;
  background: #f2f2f2;
  flex-direction: column;
`;

const SignupLink = styled.div`
  color: #580cd2;
  text-decoration: none;
  text-align: center;
  cursor: pointer;
`;

const FormWrapper = styled.div`
  background: #fff;
  padding: 40px 30px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  width: 400px;
  text-align: center;
  margin-top: 100px;
  margin-bottom: 50px;
  
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  textarea:-webkit-autofill,
  textarea:-webkit-autofill:hover,
  textarea:-webkit-autofill:focus {
      -webkit-text-fill-color: black !important;
      transition: background-color 5000s ease-in-out 0s;
  }

  @media (max-width: 760px) {
    width: 300px;
  }
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
`;

const SubmitButton = styled.button`
  padding: 12px;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 20px;
  &:hover {
    background: #580cd2;
  }
`;

const ErrorText = styled.span`
  color: red;
  font-size: 13px;
`;
