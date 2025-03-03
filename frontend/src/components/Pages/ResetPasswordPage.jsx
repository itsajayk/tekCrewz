// ResetPasswordPage.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import TopNavbar from '../Nav/TopNavbar';
import Footer from '../Sections/Footer';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const oobCode = searchParams.get('oobCode'); // Firebase sends this in the reset link
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!oobCode) {
        setMessage('Invalid or missing reset code.');
        }
    }, [oobCode]);

    const handleReset = async (e) => {
        e.preventDefault();
        let tempErrors = {};
        if (!newPassword) tempErrors.newPassword = 'New password is required';
        if (newPassword !== confirmPassword) tempErrors.confirmPassword = 'Passwords do not match';
        setErrors(tempErrors);

        if (Object.keys(tempErrors).length === 0 && oobCode) {
        try {
            // Confirm the password reset using Firebase.
            await auth.confirmPasswordReset(oobCode, newPassword);
            setMessage('Password has been reset successfully. You may now log in.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (error) {
            console.error('Reset password error:', error);
            setMessage('Reset password failed: ' + error.message);
        }
        }
    };

    return (
        <Wrapper>
        <TopNavbar />
        <Content>
            <FormContainer>
            <Title>Reset Password</Title>
            {message && <Message>{message}</Message>}
            <Form onSubmit={handleReset}>
                <Label>New Password</Label>
                <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                />
                {errors.newPassword && <ErrorText>{errors.newPassword}</ErrorText>}
                
                <Label>Confirm New Password</Label>
                <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                />
                {errors.confirmPassword && <ErrorText>{errors.confirmPassword}</ErrorText>}
                
                <Button type="submit">Reset Password</Button>
            </Form>
            </FormContainer>
        </Content>
        <Footer />
        </Wrapper>
    );
    };

    export default ResetPasswordPage;

    // Styled Components for ResetPasswordPage

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
    `;

    const Title = styled.h2`
    margin-bottom: 20px;
    color: #333;
    `;

    const Message = styled.p`
    margin-bottom: 20px;
    color: green;
    `;

    const Form = styled.form`
    display: flex;
    flex-direction: column;
    text-align: left;
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
    &:hover {
        background: #580cd2;
    }
    `;

    const ErrorText = styled.span`
    color: red;
    font-size: 14px;
    margin-bottom: 10px;
    `;
