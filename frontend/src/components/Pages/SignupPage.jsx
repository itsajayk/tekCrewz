// SignupPage.jsx
import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import TopNavbar from '../Nav/TopNavbar';
import Footer from '../Sections/Footer';
import { generateUniqueIdFromFirestore } from './idGenerator';
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from './firebase'; 

const SignupPage = () => {
  const navigate = useNavigate();

  // Admin can create either Admin or Referrer accounts.
  const [accountType, setAccountType] = useState('Admin');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralId: '', 
    designation: '',
    college: '',
    mobile: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, message: '', type: '' });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Basic email validation regex.
  const validateEmail = (email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()\[\]\\.,;:\s@"]+\.)+[^<>()\[\]\\.,;:\s@"]{2,})$/i;
    return re.test(String(email).toLowerCase());
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    let tempErrors = {};

    // Validate common fields.
    if (!formData.name.trim()) tempErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      tempErrors.email = 'Invalid email format';
    }

    // Additional validations for Referrers.
    if (accountType === 'Referrer') {
      if (!formData.designation.trim()) tempErrors.designation = 'Designation is required';
      if (!formData.college.trim()) tempErrors.college = 'College/Office Name is required';
      if (!formData.mobile.trim()) {
        tempErrors.mobile = 'Mobile Number is required';
      } else if (!/^\d{10}$/.test(formData.mobile)) {
        tempErrors.mobile = 'Mobile number must be 10 digits';
      }
    }

    // Validate password fields.
    if (!formData.password) {
      tempErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(tempErrors);

    if (Object.keys(tempErrors).length === 0) {
      try {
        setIsLoading(true);
        // Generate a unique ID based on the account type using Firestore.
        const generatedId = await generateUniqueIdFromFirestore(accountType);

        // Create the user using Firebase Authentication.
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        // Update the user profile with the generated unique ID.
        await updateProfile(userCredential.user, {
          displayName: generatedId
        });
        // Save the mapping in Firestore.
        await setDoc(doc(db, "users", generatedId), {
          username: generatedId,
          email: formData.email
        });
        setModal({
          isOpen: true,
          message: `${accountType} account created successfully with ID ${generatedId}!`,
          type: 'success'
        });
        // Close the modal and navigate after a short delay.
        setTimeout(() => {
          setModal({ isOpen: false, message: '', type: '' });
          navigate('/login');
        }, 5000);
      } catch (error) {
        setModal({
          isOpen: true,
          message: 'Signup failed: ' + error.message,
          type: 'error'
        });
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
          <Title>Sign Up</Title>
          <RoleSelector>
            <ButtonTab
              active={accountType === 'Admin'}
              onClick={() => setAccountType('Admin')}
            >
              Admin
            </ButtonTab>
            <ButtonTab
              active={accountType === 'Referrer'}
              onClick={() => setAccountType('Referrer')}
            >
              Referrer
            </ButtonTab>
          </RoleSelector>
          <Form onSubmit={handleSignup}>
            <Label>Name</Label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
            />
            {errors.name && <ErrorText>{errors.name}</ErrorText>}
            
            <Label>Email</Label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
            />
            {errors.email && <ErrorText>{errors.email}</ErrorText>}

            {accountType === 'Referrer' && (
              <>
                <Label>Referral ID</Label>
                <Input
                  type="text"
                  name="referralId"
                  value={formData.referralId || 'Will be generated automatically'}
                  readOnly
                />
                <Label>Designation</Label>
                <Input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="Enter designation"
                />
                {errors.designation && <ErrorText>{errors.designation}</ErrorText>}
                <Label>College / Office Name</Label>
                <Input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  placeholder="Enter college/office name"
                />
                {errors.college && <ErrorText>{errors.college}</ErrorText>}
                <Label>Mobile Number</Label>
                <Input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                />
                {errors.mobile && <ErrorText>{errors.mobile}</ErrorText>}
              </>
            )}

            <Label>Password</Label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
            />
            {errors.password && <ErrorText>{errors.password}</ErrorText>}

            <Label>Confirm Password</Label>
            <Input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
            />
            {errors.confirmPassword && <ErrorText>{errors.confirmPassword}</ErrorText>}

            <Button type="submit">Sign Up</Button>
          </Form>
          {isLoading && (
            <SpinnerOverlay>
              <Spinner />
            </SpinnerOverlay>
          )}
          <SwitchLink onClick={() => navigate('/login')}>
            Already have an account? Login
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

export default SignupPage;

// Styled Components

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(90deg, #f7f7f7, #eaeaea);
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f7f7f7;
  padding-top: 80px;
`;

const FormContainer = styled.div`
  background: #fff;
  padding: 40px;
  margin: 40px 0;
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

const RoleSelector = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

const ButtonTab = styled.button`
  flex: 1;
  padding: 10px;
  background: ${({ active }) => (active ? '#7620ff' : '#eee')};
  color: ${({ active }) => (active ? '#fff' : '#333')};
  border: none;
  cursor: pointer;
  &:not(:last-child) {
    margin-right: 10px;
  }
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
