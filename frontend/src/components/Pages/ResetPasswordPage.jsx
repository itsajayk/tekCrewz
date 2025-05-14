// src/components/Pages/ResetPasswordPage.jsx

import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { auth, db } from './firebase'         // make sure `app`, `auth`, `db` are all exported
import {
  sendPasswordResetEmail,
  confirmPasswordReset,
} from 'firebase/auth'
import { collection, getDocs } from 'firebase/firestore'
import TopNavbar from '../Nav/TopNavbar'
import Footer from '../Sections/Footer'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const oobCode = searchParams.get('oobCode')

  // --- state for "request reset link" view ---
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [requestMessage, setRequestMessage] = useState('')
  const [requestError, setRequestError] = useState('')

  // --- state for "confirm new password" view ---
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmErrors, setConfirmErrors] = useState({})

  // Fetch all users so you can reset for any category
  useEffect(() => {
    async function loadUsers() {
      try {
        const snap = await getDocs(collection(db, 'users'))
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error('failed loading users', err)
      }
    }
    loadUsers()
  }, [])

  // Handler for sending the reset-email link
  const handleRequestReset = async e => {
    e.preventDefault()
    setRequestMessage('')
    setRequestError('')

    if (!selectedUserId) {
      setRequestError('Please select a user.')
      return
    }

    // assume your user docs have an `email` field
    const user = users.find(u => u.id === selectedUserId)
    if (!user?.email) {
      setRequestError('Selected user has no email on file.')
      return
    }

    try {
      await sendPasswordResetEmail(auth, user.email)
      setRequestMessage(`Reset link sent to ${user.email}. Check your inbox!`)
    } catch (err) {
      console.error(err)
      setRequestError(`Error sending reset email: ${err.message}`)
    }
  }

  // Handler for confirming the new password
  const handleConfirmReset = async e => {
    e.preventDefault()
    const errs = {}
    if (!newPassword) errs.newPassword = 'Enter a new password'
    if (newPassword !== confirmPassword)
      errs.confirmPassword = 'Passwords do not match'
    setConfirmErrors(errs)

    if (Object.keys(errs).length === 0 && oobCode) {
      try {
        await confirmPasswordReset(auth, oobCode, newPassword)
        setConfirmMessage('Password reset! Redirecting to login…')
        setTimeout(() => navigate('/login'), 3000)
      } catch (err) {
        console.error(err)
        setConfirmMessage(`Reset failed: ${err.message}`)
      }
    }
  }

  return (
    <Wrapper>
      <TopNavbar />
      <Content>
        <FormContainer>
          {!oobCode ? (
            <>
              <Title>Request Password Reset</Title>
              {requestMessage && <SuccessText>{requestMessage}</SuccessText>}
              {requestError && <ErrorText>{requestError}</ErrorText>}
              <Form onSubmit={handleRequestReset}>
                <Label htmlFor="userId">Select Employee</Label>
                <Select
                  id="userId"
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                >
                  <option value="">-- choose user --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.displayName || u.id}  {/* ({u.type || '—'}) */}
                    </option>
                  ))}
                </Select>
                <Button type="submit">Send Reset Link</Button>
              </Form>
            </>
          ) : (
            <>
              <Title>Enter New Password</Title>
              {confirmMessage && <SuccessText>{confirmMessage}</SuccessText>}
              <Form onSubmit={handleConfirmReset}>
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
                {confirmErrors.newPassword && (
                  <ErrorText>{confirmErrors.newPassword}</ErrorText>
                )}
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
                {confirmErrors.confirmPassword && (
                  <ErrorText>{confirmErrors.confirmPassword}</ErrorText>
                )}
                <Button type="submit">Reset Password</Button>
              </Form>
            </>
          )}
        </FormContainer>
      </Content>
      <Footer />
    </Wrapper>
  )
}


const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 140vh;
  background: linear-gradient(90deg, #f7f7f7, #eaeaea);
`
const Content = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 80px;
  background: #f7f7f7;
`
const FormContainer = styled.div`
  background: #fff;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  width: 400px;
  text-align: center;
`
const Title = styled.h2`
  margin-bottom: 20px;
  color: #333;
`
const SuccessText = styled.p`
  color: green;
  margin-bottom: 15px;
`
const Form = styled.form`
  display: flex;
  flex-direction: column;
  text-align: left;
`
const Label = styled.label`
  margin-bottom: 5px;
  font-weight: bold;
`
const Select = styled.select`
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 4px;
  border: 1px solid #ccc;
  &:focus {
    border-color: #ff9900;
    outline: none;
  }
`
const Input = styled.input`
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  &:focus {
    border-color: #ff9900;
    outline: none;
  }
`
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
`
const ErrorText = styled.span`
  color: red;
  font-size: 14px;
  margin-bottom: 10px;
`
