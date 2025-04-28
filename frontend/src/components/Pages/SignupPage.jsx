import React, { useState, useCallback, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import TopNavbar from '../Nav/TopNavbar';
import Footer from '../Sections/Footer';
import { auth, db } from './firebase';
import { generateUniqueIdFromFirestore } from './idGenerator';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../Helper/cropImage';

// Helper: convert a blob-URL to a real File
const urlToFile = async (url, filename, mimeType) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: mimeType });
};

// Upload unsigned to Cloudinary
const uploadToCloudinary = async (fileOrUrl, folder) => {
  let file = fileOrUrl;
  if (typeof fileOrUrl === 'string') {
    file = await urlToFile(
      fileOrUrl,
      fileOrUrl.includes('.jpg') ? 'image.jpg' : 'file.bin',
      'application/octet-stream'
    );
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: 'POST', body: formData }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Cloudinary upload failed');
  return data.secure_url;
};

const SignupPage = () => {
  const navigate = useNavigate();

  // 0) Block non-admins
  const [modal, setModal] = useState({ isOpen: false, message: '', type: '' });
  // useEffect(() => {
  //   onAuthStateChanged(auth, (user) => {
  //     if (!user) {
  //       navigate('/login');
  //     } else if (!user.displayName?.startsWith('EMPAD')) {
  //       setModal({ isOpen: true, type: 'error', message: 'Only Admins may create new accounts.' });
  //       setTimeout(() => navigate('/'), 2000);
  //     }
  //   });
  // }, [navigate]);

  // 1) Form state
  const [accountType, setAccountType] = useState('Admin');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', referralId: '', designation: '', college: '', mobile: '',
    degree: '', courseName: '', collegeName: '', certifications: '', experience: '', proof1: null, proof2: null, address: ''
  });

  // 2) Image states
  const [origPassportFile, setOrigPassportFile] = useState(null);
  const [passportPic, setPassportPic] = useState(null);
  const [croppedPassportPic, setCroppedPassportPic] = useState(null);
  const [croppedPassportFile, setCroppedPassportFile] = useState(null);

  // 3) Signature & misc
  const [signatureFile, setSignatureFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 4) Cropper
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  // 5) Refs
  const EmpPicRef = useRef();
  const signatureRef = useRef();
  const proof1Ref = useRef();
  const proof2Ref = useRef();

  // Generic change
  const handleChange = e => {
    const { name, files, value } = e.target;
    if ((name === 'proof1' || name === 'proof2') && files) {
      setFormData(p => ({ ...p, [name]: files[0] }));
    } else {
      setFormData(p => ({ ...p, [name]: value }));
    }
  };

  // Passport handlers
  const handlePassportImageChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOrigPassportFile(file);
    setPassportPic(URL.createObjectURL(file));
    setCroppedPassportPic(null);
    setCroppedPassportFile(null);
    setShowCropper(true);
  };
  const onCropComplete = useCallback((_, pixels) => setCroppedAreaPixels(pixels), []);
  const handleCropPassportImage = async () => {
    try {
      const { file, fileUrl } = await getCroppedImg(passportPic, croppedAreaPixels, 'passport.jpg');
      setCroppedPassportFile(file);
      setCroppedPassportPic(fileUrl);
      setShowCropper(false);
    } catch (err) {
      console.error(err);
    }
  };
  const removePassportImage = () => {
    setOrigPassportFile(null);
    setPassportPic(null);
    setCroppedPassportPic(null);
    setCroppedPassportFile(null);
    setShowCropper(false);
    EmpPicRef.current.value = '';
  };

  // Signature & proofs
  const handleSignatureChange = e => {
    const file = e.target.files?.[0];
    if (file) setSignatureFile(file);
  };
  const removeSignature = () => { setSignatureFile(null); signatureRef.current.value = ''; };
  const removeProof1    = () => { setFormData(p=>({...p,proof1:null})); proof1Ref.current.value=''; };
  const removeProof2    = () => { setFormData(p=>({...p,proof2:null})); proof2Ref.current.value=''; };

  const validateEmail = email => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()\[\]\\.,;:\s@"]+\.)+[^<>()\[\]\\.,;:\s@"]{2,})$/i;
    return re.test(String(email).toLowerCase());
  };

  // Signup
  const handleSignup = async e => {
    e.preventDefault();
    const errs = {};
    if (!formData.name.trim()) errs.name='Name is required';
    if (!formData.password) errs.password='Password is required';
    else if (formData.password.length<6) errs.password='Min 6 chars';
    if (formData.password!==formData.confirmPassword) errs.confirmPassword='Passwords must match';

    if (['Referrer','DevTutor','Tutor','Developer'].includes(accountType)) {
      if (!formData.email || !validateEmail(formData.email)) errs.email='Valid email required';
      if (!formData.mobile || !/^[0-9]{10}$/.test(formData.mobile)) errs.mobile='10 digit mobile required';
    }
    if (['DevTutor','Tutor','Developer'].includes(accountType)) {
      if (!formData.proof1) errs.proof1='Proof1 is required';
      if (!formData.proof2) errs.proof2='Proof2 is required';
      if (!origPassportFile && !croppedPassportFile) errs.passportPic='Passport photo is required';
      if (!signatureFile) errs.signature='Signature is required';
    }

    setErrors(errs);
    if (Object.keys(errs).length) return;

    try {
      setIsLoading(true);
      // 1) Auth
      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const firebaseUid = cred.user.uid;
      // 2) Generate ID
      const businessId = await generateUniqueIdFromFirestore(accountType);
      await updateProfile(cred.user, { displayName: businessId });
      // 3) Build data
      const dataToSave = { id: businessId, type: accountType, name: formData.name, email: formData.email };
      if (accountType==='Referrer') Object.assign(dataToSave, { referralId: businessId, designation: formData.designation, college: formData.college, mobile: formData.mobile });
      if (['DevTutor','Tutor','Developer'].includes(accountType)) {
        Object.assign(dataToSave, {
          designation: formData.designation,
          mobile: formData.mobile,
          degree: formData.degree,
          courseName: formData.courseName,
          collegeName: formData.collegeName,
          certifications: formData.certifications,
          experience: formData.experience,
          address:formData.address
        });
        const photoSource = croppedPassportFile||origPassportFile;
        dataToSave.photoURL     = await uploadToCloudinary(photoSource,'photos');
        dataToSave.signatureURL = await uploadToCloudinary(signatureFile,'signatures');
        dataToSave.proof1URL    = await uploadToCloudinary(formData.proof1,'proofs');
        dataToSave.proof2URL    = await uploadToCloudinary(formData.proof2,'proofs');
      }
      // 4) Firestore write
      await setDoc(doc(db,'users',businessId), dataToSave);
      setModal({ isOpen:true, message:`${accountType} registered: ${businessId}`, type:'success' });
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setModal({ isOpen:true, message:err.message, type:'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Wrapper>
      <TopNavbar />
      <Content>
        <FormContainer>
          <Title>Sign Up</Title>
          <RoleSelector>
            {["Admin", "Referrer", "DevTutor", "Tutor", "Developer"].map(
              (role) => (
                <ButtonTab
                  key={role}
                  active={accountType === role}
                  onClick={() => setAccountType(role)}
                >
                  {role === "DevTutor"
                    ? "Dev & Tutor"
                    : role === "Tutor"
                    ? "Tutor Only"
                    : role === "Developer"
                    ? "Developer Only"
                    : role}
                </ButtonTab>
              )
            )}
          </RoleSelector>

          <Form onSubmit={handleSignup}>
            {/* Name */}
            <Label>Name</Label>
            <Input name="name" value={formData.name} onChange={handleChange} />
            <ErrorText>{errors.name}</ErrorText>

            {/* Email */}
            <Label>Email</Label>
            <Input
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
            <ErrorText>{errors.email}</ErrorText>

            {/* Referrer fields */}
            {accountType === "Referrer" && (
              <>
                <Label>Referral ID</Label>
                <Input
                  name="referralId"
                  value={formData.referralId || "Auto-generated"}
                  readOnly
                />
                <Label>Designation</Label>
                <Input
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                />
                <ErrorText>{errors.designation}</ErrorText>
                <Label>College / Office</Label>
                <Input
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                />
                <ErrorText>{errors.college}</ErrorText>
                <Label>Mobile Number</Label>
                <Input
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                />
                <ErrorText>{errors.mobile}</ErrorText>
              </>
            )}

            {/* DevTutor, Tutor, Developer */}
            {["DevTutor", "Tutor", "Developer"].includes(accountType) && (
              <>
                <Label>Designation</Label>
                <Input
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                />
                <ErrorText>{errors.designation}</ErrorText>
                <Label>Mobile Number</Label>
                <Input
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                />
                <ErrorText>{errors.mobile}</ErrorText>
                <Label>Degree</Label>
                <Input
                  name="degree"
                  value={formData.degree}
                  onChange={handleChange}
                />
                <ErrorText>{errors.degree}</ErrorText>
                <Label>Course Name</Label>
                <Input
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleChange}
                />
                <ErrorText>{errors.courseName}</ErrorText>
                <Label>College/University</Label>
                <Input
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleChange}
                />
                <ErrorText>{errors.collegeName}</ErrorText>
                <Label>Certifications</Label>
                <Input
                  name="certifications"
                  value={formData.certifications}
                  onChange={handleChange}
                />
                <ErrorText>{errors.certifications}</ErrorText>
                <Label>Experience</Label>
                <Input
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                />
                <ErrorText>{errors.experience}</ErrorText>

                <Label>Govt Proof 1</Label>
                <Input
                  type="file"
                  name="proof1"
                  onChange={handleChange}
                  ref={proof1Ref}
                />
                <ErrorText>{errors.proof1}</ErrorText>
                {formData.proof1 && (
                  <FileWrapper>
                    {formData.proof1.type === "application/pdf" ? (
                      <FilePreviewLink
                        href={URL.createObjectURL(formData.proof1)}
                        target="_blank"
                      >
                        View PDF
                      </FilePreviewLink>
                    ) : (
                      <ImagePreview
                        src={URL.createObjectURL(formData.proof1)}
                        alt="Proof1"
                      />
                    )}
                    <RemoveIcon onClick={removeProof1}>×</RemoveIcon>
                  </FileWrapper>
                )}

                <Label>Govt Proof 2</Label>
                <Input
                  type="file"
                  name="proof2"
                  onChange={handleChange}
                  ref={proof2Ref}
                />
                <ErrorText>{errors.proof2}</ErrorText>
                {formData.proof2 && (
                  <FileWrapper>
                    {formData.proof2.type === "application/pdf" ? (
                      <FilePreviewLink
                        href={URL.createObjectURL(formData.proof2)}
                        target="_blank"
                      >
                        View PDF
                      </FilePreviewLink>
                    ) : (
                      <ImagePreview
                        src={URL.createObjectURL(formData.proof2)}
                        alt="Proof2"
                      />
                    )}
                    <RemoveIcon onClick={removeProof2}>×</RemoveIcon>
                  </FileWrapper>
                )}

                <Label>Address</Label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
                <ErrorText>{errors.address}</ErrorText>

                <Label>Passport Photo</Label>
                <Input
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={handlePassportImageChange}
                  ref={EmpPicRef}
                />
                <ErrorText>{errors.passportPic}</ErrorText>
                {passportPic && showCropper && (
                  <>
                    <CropperWrapper>
                      <Cropper
                        image={passportPic}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                      <RemoveIcon onClick={removePassportImage}>×</RemoveIcon>
                    </CropperWrapper>
                    <CropControls>
                      <CropButton
                        type="button"
                        onClick={handleCropPassportImage}
                      >
                        Crop
                      </CropButton>
                      <ZoomSlider
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                      />
                    </CropControls>
                  </>
                )}
                {croppedPassportPic && !showCropper && (
                  <ImagePreviewWrapper>
                    <ImagePreview src={croppedPassportPic} alt="Passport" />
                    <RemoveIcon onClick={removePassportImage}>×</RemoveIcon>
                  </ImagePreviewWrapper>
                )}

                <Label>Signature</Label>
                <Input
                  type="file"
                  name="signature"
                  accept="image/*"
                  onChange={handleSignatureChange}
                  ref={signatureRef}
                />
                <ErrorText>{errors.signature}</ErrorText>
                {signatureFile && (
                  <ImagePreviewWrapper>
                    <ImagePreview
                      src={URL.createObjectURL(signatureFile)}
                      alt="Signature"
                    />
                    <RemoveIcon onClick={removeSignature}>×</RemoveIcon>
                  </ImagePreviewWrapper>
                )}
              </>
            )}

            {/* Password */}
            <Label>Password</Label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
            />
            <ErrorText>{errors.password}</ErrorText>
            <Label>Confirm Password</Label>
            <Input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <ErrorText>{errors.confirmPassword}</ErrorText>

            <Button type="submit">Sign Up</Button>
          </Form>

          {isLoading && (
            <SpinnerOverlay>
              <Spinner />
            </SpinnerOverlay>
          )}

          <SwitchLink onClick={() => navigate("/login")}>
            Already have an account? Login
          </SwitchLink>
        </FormContainer>
      </Content>
      <Footer />

      {modal.isOpen && (
        <ModalOverlay>
          <ModalContent>
            <ModalMessage type={modal.type}>{modal.message} <i className="fa-solid fa-circle-check fa-bounce" style={{ color: "#14a800" }}></i></ModalMessage>
            <CloseButton
              onClick={() => setModal({ isOpen: false, message: "", type: "" })}
            >
              &times;
            </CloseButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </Wrapper>
  );
};

export default SignupPage;

// Styled Components (unchanged)
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
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
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
  background: ${({ active }) => (active ? "#7620ff" : "#eee")};
  color: ${({ active }) => (active ? "#fff" : "#333")};
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
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
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
    transition: 0.5s;
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
const SpinnerOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
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
  color: ${({ type }) => (type === "success" ? "green" : "red")};
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
  align-items: center;
  margin-top: 10px;
`;
const CropButton = styled.button`
  padding: 8px 16px;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  margin-right: 10px;
  cursor: pointer;
  &:hover {
    background: #580cd2;
  }
`;
const ZoomSlider = styled.input`
  width: 150px;
`;
const RemoveIcon = styled.span`
  position: absolute;
  top: 5px;
  left: 5px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
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
  width: 150px;
  height: auto;
  border: 1px solid #ccc;
  border-radius: 4px;
`;
const FilePreviewLink = styled.a`
  display: block;
  margin: 8px 0;
  color: #7620ff;
  text-decoration: underline;
`;
const FileWrapper = styled.div`
  position: relative;
  display: inline-block;
  margin-top: 10px;
`;
