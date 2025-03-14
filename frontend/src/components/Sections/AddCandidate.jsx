import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';
import TopNavbar from '../Nav/TopNavbar';
import Footer from '../Sections/Footer';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../Helper/cropImage';
import SignaturePad from "react-signature-canvas";

const API_BASE_URL = 'https://tekcrewz.onrender.com';

const AddCandidate = () => {
  const navigate = useNavigate();

  // Form fields state
  const [formData, setFormData] = useState({
    userId: '',
    candidateName: '',
    college: '',
    candidateDegree: '',
    candidateCourseName: '',
    programme: '',
    marksType: '',
    score: '',
    scholarshipSecured: '',
    mobile: '',
    parentMobile: '',
    email: '',
    coursesEnquired: '',
    dateOfVisit: '',
    paymentTerm: '',
    communicationScore: '',
    remarks: ''
  });

  // File inputs state
  const [candidatePic, setCandidatePic] = useState(null);
  const [croppedCandidatePic, setCroppedCandidatePic] = useState(null);
  const [markStatement, setMarkStatement] = useState(null);
  
  // Signature state (upload and type modes only)
  const [signatureMode, setSignatureMode] = useState('upload');
  const [signatureFile, setSignatureFile] = useState(null);
  const [signatureText, setSignatureText] = useState('');
  
  // Cropper states for candidate picture
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  // Dependent dropdown for Programme
  const [programmeOptions, setProgrammeOptions] = useState([]);

  // Other states
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Refs for file inputs and signature pad
  const candidatePicInputRef = useRef();
  const markStatementInputRef = useRef();
  const signatureInputRef = useRef();
  const signaturePadRef = useRef();

  // Update programme options based on candidateDegree
  useEffect(() => {
    const degree = formData.candidateDegree;
    if (degree === 'UG') {
      setProgrammeOptions([
        'BE',
        'B.Sc.',
        'B. Com',
        'BBA',
        'BCA',
        'BA',
        'B.Lit.',
        'B.S.W',
        'B.Ed',
        'B.F.A'
      ]);
    } else if (degree === 'PG') {
      setProgrammeOptions([
        'ME',
        'M.Tech',
        'M.Phil',
        'M.A',
        'M.C.A',
        'M.Sc.',
        'M.S.W',
        'M.B.A',
        'M.F.A.'
      ]);
    } else if (degree === 'Integrated') {
      setProgrammeOptions([
        'M.Sc',
        'BBA + MBA',
        'BA + Bed',
        'BA+LLB'
      ]);
    } else {
      setProgrammeOptions([]);
      setFormData(prev => ({ ...prev, programme: '' }));
    }
    setFormData(prev => ({ ...prev, programme: '' }));
  }, [formData.candidateDegree]);

  // Handle text/select inputs
  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Handle candidate picture file input and open cropper
  const handleCandidatePicChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const imageUrl = URL.createObjectURL(e.target.files[0]);
      setCandidatePic(imageUrl);
      setShowCropper(true);
      setCroppedCandidatePic(null);
    }
  };

  // Generic file input handler for mark statement and signature file
  const handleFileChange = (e, setter) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  // Handle signature mode change
  const handleSignatureModeChange = (e) => {
    setSignatureMode(e.target.value);
    setSignatureFile(null);
    setSignatureText('');
  };

  // Cropper onCropComplete callback
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle cropping action
  const handleCropImage = async () => {
    try {
      const { fileUrl } = await getCroppedImg(candidatePic, croppedAreaPixels, 'candidatePic.jpg');
      setCroppedCandidatePic(fileUrl);
      setShowCropper(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Remove functions for file inputs
  const removeCandidatePic = () => {
    setCandidatePic(null);
    setCroppedCandidatePic(null);
    setShowCropper(false);
    if (candidatePicInputRef.current) {
      candidatePicInputRef.current.value = "";
    }
  };

  const removeMarkStatement = () => {
    setMarkStatement(null);
    if (markStatementInputRef.current) {
      markStatementInputRef.current.value = "";
    }
  };

  const removeSignature = () => {
    setSignatureFile(null);
    setSignatureText('');
    if (signatureInputRef.current) {
      signatureInputRef.current.value = "";
    }
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  // Validation function
  const validate = () => {
    let tempErrors = {};
    if (!formData.userId) tempErrors.userId = "User selection is required.";
    if (!formData.candidateName) tempErrors.candidateName = "Candidate Name is required.";
    if (!formData.college) tempErrors.college = "College Name is required.";
    if (!formData.candidateDegree) tempErrors.candidateDegree = "Degree is required.";
    // Only require candidateCourseName if degree and programme are not both filled
    if (!formData.candidateCourseName && (!formData.candidateDegree || !formData.programme)) {
      tempErrors.candidateCourseName = "Course Name is required if Degree and Programme are not provided.";
    }
    if (!formData.programme) tempErrors.programme = "Programme selection is required.";
    if (!formData.marksType) tempErrors.marksType = "Marks type is required.";
    if (!formData.score) {
      tempErrors.score = "Score is required.";
    } else {
      const scoreValue = parseFloat(formData.score);
      if (formData.marksType === "CGPA" && (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 10)) {
        tempErrors.score = "Please enter a valid CGPA between 0 and 10.";
      }
      if (formData.marksType === "Percentage" && (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100)) {
        tempErrors.score = "Please enter a valid percentage between 0 and 100.";
      }
    }
    if (!formData.mobile) {
      tempErrors.mobile = "Mobile Number is required.";
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      tempErrors.mobile = "Mobile number must be exactly 10 digits.";
    }
    if (!formData.parentMobile) {
      tempErrors.parentMobile = "Parent Mobile Number is required.";
    } else if (!/^\d{10}$/.test(formData.parentMobile)) {
      tempErrors.parentMobile = "Mobile number must be exactly 10 digits.";
    }
    if (!formData.email) {
      tempErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Invalid email address.";
    }
    if (!formData.coursesEnquired) tempErrors.coursesEnquired = "Courses Enquired is required.";
    if (!formData.dateOfVisit) tempErrors.dateOfVisit = "Date of Visit is required.";
    if (!formData.paymentTerm) tempErrors.paymentTerm = "Payment Term is required.";
    if (!formData.communicationScore) tempErrors.communicationScore = "Communication Score is required.";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle form submission with FormData for file uploads
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      // Append candidatePic – use cropped version if available
      if (croppedCandidatePic) {
        const response = await fetch(croppedCandidatePic);
        const blob = await response.blob();
        data.append('candidatePic', blob, 'candidatePic.jpg');
      }
      if (markStatement) data.append('markStatement', markStatement);
      // For signature, use based on selected mode (only upload or type)
      if (signatureMode === 'upload' && signatureFile) {
        data.append('signature', signatureFile);
      } else {
        data.append('signature', signatureText);
      }
      console.log("Submitting candidate with data:");
      const response = await axios.post(`${API_BASE_URL}/api/referrals`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log("Response from server:", response.data);
      setSuccessMessage(response.data.message);
      // Reset form and file states
      setFormData({
        userId: '',
        candidateName: '',
        college: '',
        candidateDegree: '',
        candidateCourseName: '',
        programme: '',
        marksType: '',
        score: '',
        scholarshipSecured: '',
        mobile: '',
        parentMobile: '',
        email: '',
        coursesEnquired: '',
        dateOfVisit: '',
        paymentTerm: '',
        communicationScore: '',
        remarks: ''
      });
      removeCandidatePic();
      removeMarkStatement();
      removeSignature();
    } catch (err) {
      console.error("Failed to submit candidate:", err);
      alert("There was an error submitting the candidate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Wrapper>
        <TopNavbar />
        <Content>
          <FormTitle>Add Candidate</FormTitle>
          <Form onSubmit={handleSubmit}>
            {/* User selection */}
            <InputGroup>
              <Label>Select User (Admin/Referrer)</Label>
              <Select name="userId" value={formData.userId} onChange={handleChange}>
                <option value="">Select User</option>
                <option value="admin">Admin</option>
                <option value="REFSD001">REFSD001</option>
                <option value="REFSD002">REFSD002</option>
              </Select>
              {errors.userId && <ErrorText>{errors.userId}</ErrorText>}
            </InputGroup>
            {/* Candidate details */}
            <InputGroup>
              <Label>Candidate Name</Label>
              <Input
                type="text"
                name="candidateName"
                value={formData.candidateName}
                onChange={handleChange}
                placeholder="Enter candidate's name"
              />
              {errors.candidateName && <ErrorText>{errors.candidateName}</ErrorText>}
            </InputGroup>
            <InputGroup>
              <Label>College Name</Label>
              <Input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                placeholder="Enter college name"
              />
              {errors.college && <ErrorText>{errors.college}</ErrorText>}
            </InputGroup>
            <InputGroup>
              <Label>Degree</Label>
              <Select name="candidateDegree" value={formData.candidateDegree} onChange={handleChange}>
                <option value="">Select Degree</option>
                <option value="UG">UG</option>
                <option value="PG">PG</option>
                <option value="Integrated">Integrated</option>
              </Select>
              {errors.candidateDegree && <ErrorText>{errors.candidateDegree}</ErrorText>}
            </InputGroup>
            <InputGroup>
              <Label>Programme</Label>
              <Select name="programme" value={formData.programme} onChange={handleChange}>
                <option value="">Select Programme</option>
                {programmeOptions.map((prog, index) => (
                  <option key={index} value={prog}>{prog}</option>
                ))}
              </Select>
              {errors.programme && <ErrorText>{errors.programme}</ErrorText>}
            </InputGroup>
            <InputGroup>
              <Label>Course Name (optional if Degree & Programme are filled)</Label>
              <Input
                type="text"
                name="candidateCourseName"
                value={formData.candidateCourseName}
                onChange={handleChange}
                placeholder="Enter course name"
              />
              {/* No error message if left empty and degree/programme are provided */}
            </InputGroup>
            {/* Marks & Score */}
            <InputGroup>
              <Label>Marks Secured (Type)</Label>
              <RadioGroup>
                <label>
                  <input
                    type="radio"
                    name="marksType"
                    value="CGPA"
                    checked={formData.marksType === "CGPA"}
                    onChange={handleChange}
                  /> CGPA
                </label>
                <label>
                  <input
                    type="radio"
                    name="marksType"
                    value="Percentage"
                    checked={formData.marksType === "Percentage"}
                    onChange={handleChange}
                  /> Percentage
                </label>
              </RadioGroup>
              {errors.marksType && <ErrorText>{errors.marksType}</ErrorText>}
            </InputGroup>
            <InputGroup>
              <Label>Score</Label>
              <Input
                type="text"
                name="score"
                value={formData.score}
                onChange={handleChange}
                placeholder="Enter score"
              />
              {errors.score && <ErrorText>{errors.score}</ErrorText>}
            </InputGroup>
            <InputGroup>
              <Label>Scholarship Secured</Label>
              <Input
                type="text"
                name="scholarshipSecured"
                value={formData.scholarshipSecured}
                onChange={handleChange}
                placeholder="Enter scholarship details (if any)"
              />
            </InputGroup>
            {/* Contact details */}
            <InputGroup>
              <Label>Mobile Number</Label>
              <Input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter mobile number"
              />
              {errors.mobile && <ErrorText>{errors.mobile}</ErrorText>}
            </InputGroup>
            <InputGroup>
              <Label>Parent Mobile Number</Label>
              <Input
                type="text"
                name="parentMobile"
                value={formData.parentMobile}
                onChange={handleChange}
                placeholder="Enter parent's mobile number"
              />
              {errors.parentMobile && <ErrorText>{errors.parentMobile}</ErrorText>}
            </InputGroup>
            <InputGroup>
              <Label>Email</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
              />
              {errors.email && <ErrorText>{errors.email}</ErrorText>}
            </InputGroup>
            <InputGroup>
              <Label>Courses Enquired</Label>
              <Input
                type="text"
                name="coursesEnquired"
                value={formData.coursesEnquired}
                onChange={handleChange}
                placeholder="Enter courses enquired"
              />
              {errors.coursesEnquired && <ErrorText>{errors.coursesEnquired}</ErrorText>}
            </InputGroup>
            <InputGroup>
              <Label>Date of Visit</Label>
              <Input
                type="date"
                name="dateOfVisit"
                value={formData.dateOfVisit}
                onChange={handleChange}
              />
              {errors.dateOfVisit && <ErrorText>{errors.dateOfVisit}</ErrorText>}
            </InputGroup>
            <InputGroup>
              <Label>Payment Term</Label>
              <Select name="paymentTerm" value={formData.paymentTerm} onChange={handleChange}>
                <option value="">Select Payment Term</option>
                <option value="Full Term">Full Term</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
              </Select>
              {errors.paymentTerm && <ErrorText>{errors.paymentTerm}</ErrorText>}
            </InputGroup>
            <InputGroup>
              <Label>Communication Score (out of 5)</Label>
              <Input
                type="number"
                name="communicationScore"
                value={formData.communicationScore}
                onChange={handleChange}
                min="1"
                max="5"
                placeholder="Enter score"
              />
              {errors.communicationScore && <ErrorText>{errors.communicationScore}</ErrorText>}
            </InputGroup>
            <InputGroup>
              <Label>Remarks</Label>
              <TextArea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Enter remarks"
              />
            </InputGroup>
            {/* File uploads */}
            <InputGroup>
              <Label>Candidate Picture (Passport Size)</Label>
              <InputFile 
                type="file" 
                accept="image/*" 
                onChange={handleCandidatePicChange} 
                ref={candidatePicInputRef}
              />
              {candidatePic && showCropper && (
                <>
                  <CropperWrapper>
                    <Cropper
                      image={candidatePic}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                      restrictPosition={false}
                    />
                    <RemoveIcon onClick={removeCandidatePic}>×</RemoveIcon>
                  </CropperWrapper>
                  <CropControls>
                    <CropButton onClick={handleCropImage}>Crop</CropButton>
                    <SliderContainer>
                      <SliderLabel>Zoom:</SliderLabel>
                      <SliderInput
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                      />
                    </SliderContainer>
                  </CropControls>
                </>
              )}
              {croppedCandidatePic && !showCropper && (
                <ImagePreviewWrapper>
                  <ImagePreview src={croppedCandidatePic} alt="Cropped Candidate" />
                  <RemoveIcon onClick={removeCandidatePic}>×</RemoveIcon>
                </ImagePreviewWrapper>
              )}
            </InputGroup>
            <InputGroup>
              <Label>Cumulative Mark Statement (PDF only)</Label>
              <InputFile 
                type="file" 
                accept="application/pdf" 
                onChange={(e) => handleFileChange(e, setMarkStatement)} 
                ref={markStatementInputRef}
              />
              {markStatement && (
                <ImagePreviewWrapper>
                  <PDFPreview>
                    <PDFIcon className="fa-solid fa-file-pdf" />
                    <PDFName>{markStatement.name}</PDFName>
                  </PDFPreview>
                  <RemoveIcon onClick={removeMarkStatement}>×</RemoveIcon>
                </ImagePreviewWrapper>
              )}
            </InputGroup>
            {/* Signature Section (upload or type only) */}
            <InputGroup>
              <Label>Signature</Label>
              <SignatureToggleContainer>
                <SignatureToggleLabel>Mode:</SignatureToggleLabel>
                <SignatureModeSelector>
                  <SignatureModeOption
                    type="radio"
                    name="signatureMode"
                    value="upload"
                    checked={signatureMode === 'upload'}
                    onChange={handleSignatureModeChange}
                  /> Upload
                  <SignatureModeOption
                    type="radio"
                    name="signatureMode"
                    value="type"
                    checked={signatureMode === 'type'}
                    onChange={handleSignatureModeChange}
                  /> Type
                </SignatureModeSelector>
              </SignatureToggleContainer>
              {signatureMode === 'upload' ? (
                <>
                  <InputFile 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleFileChange(e, setSignatureFile)} 
                    ref={signatureInputRef}
                  />
                  {signatureFile && (
                    <ImagePreviewWrapper>
                      <ImagePreview src={URL.createObjectURL(signatureFile)} alt="Signature Upload Preview" />
                      <RemoveIcon onClick={removeSignature}>×</RemoveIcon>
                    </ImagePreviewWrapper>
                  )}
                </>
              ) : (
                <TextArea
                  name="signatureText"
                  value={signatureText}
                  onChange={(e) => setSignatureText(e.target.value)}
                  placeholder="Type your signature here..."
                />
              )}
            </InputGroup>
            <SubmitButton type="submit">Submit Candidate</SubmitButton>
          </Form>
          {isLoading && (
            <LoadingOverlay>
              <Spinner />
            </LoadingOverlay>
          )}
          {successMessage && (
            <SuccessModalOverlay>
              <SuccessModalContent>
                <SuccessTitle>{successMessage} <i className="fa-solid fa-circle-check fa-bounce" style={{ color: "#14a800" }}></i></SuccessTitle>
                <ModalCloseButton onClick={() => setSuccessMessage('')}>Close</ModalCloseButton>
              </SuccessModalContent>
            </SuccessModalOverlay>
          )}
        </Content>
        <Footer />
      </Wrapper>
    </>
  );
};

export default AddCandidate;

/* Styled Components */

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Wrapper = styled.div`
  padding-top: 80px;
  width: 100%;
  background: linear-gradient(270deg, #f7f7f7, #eaeaea, #f7f7f7);
  display: flex;
  flex-direction: column;
`;

const Content = styled.main`
  flex: 1;
  max-width: 500px;
  width: 100%;
  margin: 80px auto;
  padding: 20px;
  background: #fff;
  box-shadow: 0 0 8px rgba(0,0,0,0.1);
  border-radius: 8px;
  @media (max-width: 760px) {
    width: 80%;
    max-width: 300px;
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

const FormTitle = styled.h1`
  text-align: center;
  margin-bottom: 30px;
  font-size: 2rem;
  color: #333;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  width: 100%;
  box-sizing: border-box;
  &:focus {
    border-color: #ff9900;
    outline: none;
  }
`;

const InputFile = styled.input`
  padding: 5px;
  font-size: 16px;
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  width: 100%;
  box-sizing: border-box;
  &:focus {
    border-color: #ff9900;
    outline: none;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 20px;
  label {
    font-size: 16px;
    color: #555;
  }
`;

const TextArea = styled.textarea`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  resize: vertical;
  width: 100%;
  box-sizing: border-box;
  &:focus {
    border-color: #ff9900;
    outline: none;
  }
`;

const ErrorText = styled.span`
  color: red;
  font-size: 14px;
  margin-top: 5px;
`;

const SubmitButton = styled.button`
  padding: 14px;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  margin-top: 10px;
  transition: background 0.3s ease, transform 0.2s ease;
  &:hover {
    background: #580cd2;
    transform: scale(1.02);
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const Spinner = styled.div`
  border: 8px solid #f3f3f3;
  border-top: 8px solid #7620ff;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: ${spin} 1.5s linear infinite;
`;

const SuccessModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const SuccessModalContent = styled.div`
  background: #fff;
  padding: 20px 30px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
  text-align: center;
`;

const SuccessTitle = styled.h2`
  font-size: 2rem;
  color: #333;
  margin-bottom: 10px;
`;

const ModalCloseButton = styled.button`
  margin-top: 20px;
  padding: 8px 16px;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background: #580cd2;
  }
`;

// Cropper styling
const CropperWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 300px;
  background: #333;
  margin-top: 10px;
`;

const CropControls = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 10px;
`;

const CropButton = styled.button`
  padding: 8px 16px;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  margin-right: 10px;
  transition: background 0.3s ease;
  &:hover {
    background: #580cd2;
  }
`;

const RemoveIcon = styled.span`
  position: absolute;
  top: 5px;
  left: 5px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
`;

const ImagePreviewWrapper = styled.div`
  position: relative;
  display: inline-block;
  margin-top: 10px;
`;

const ImagePreview = styled.img`
  border: 1px solid #ccc;
  border-radius: 4px;
  max-width: 200px;
  max-height: 200px;
`;

const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 5px;
`;

const SliderLabel = styled.span`
  font-size: 14px;
  margin-right: 10px;
  color: #333;
`;

const SliderInput = styled.input`
  width: 100%;
`;

const SignatureToggleContainer = styled.div`
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SignatureToggleLabel = styled.span`
  font-size: 16px;
  color: #555;
`;

const SignatureModeSelector = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const SignatureModeOption = styled.input`
  accent-color: #ff9900;
`;

 const PDFPreview = styled.div`
 display: flex;
 align-items: center;
 padding: 5px;
 border: 1px solid #ccc;
 border-radius: 4px;
 background: #f9f9f9;
 max-width: 200px;
 max-height: 200px;
 `;

 const PDFIcon = styled.i`
 color: #d9534f;
 font-size: 24px;
 margin-right: 5px;
 `;

 const PDFName = styled.span`
 font-size: 14px;
 word-break: break-all;
 `;