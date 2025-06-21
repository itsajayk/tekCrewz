import React, {
  useState,
  useRef,
  useCallback,
  useEffect
} from 'react';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';
import TopNavbar from '../Nav/TopNavbar';
import Footer from '../Sections/Footer';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../Helper/cropImage';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  setDoc,
  doc
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, app } from '../Pages/firebase';
import { generateUniqueIdFromFirestore } from '../Pages/idGenerator';

const API_BASE_URL = 'https://tekcrewz.onrender.com';
const COURSE_CODES = {
  'full-stack': 'FS',
  'python': 'PY',
  'php with laravel': 'PL',
  'dot net': 'DT',
  'business analyst': 'BA',
  'graphic designing': 'GD',
  'digital marketing': 'DM',
  'software testing': 'ST'
};

export default function AddCandidate() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    referrerId: '',
    batchNumber: '',
    studentId: '',
    trainingMode: '',
    candidateName: '',
    college: '',
    candidateDegree: '',
    programme: '',
    candidateCourseName: '',
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
  });

  // Files + cropping
  const [candidatePic, setCandidatePic] = useState(null);
  const [croppedCandidatePic, setCroppedCandidatePic] = useState(null);
  const [markStatement, setMarkStatement] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);

  // Cropper state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  // Programme dropdown
  const [programmeOptions, setProgrammeOptions] = useState([]);

  // Validation & loading
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Refs for file inputs
  const candidatePicRef  = useRef();
  const markStatementRef = useRef();
  const signatureRef     = useRef();

  // Fetch existing users for the “User” dropdown
  const [users, setUsers]         = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const db = getFirestore(app);
    const usersCol = collection(db, 'users');
    async function fetchUsers() {
      try {
        const snap = await getDocs(usersCol);
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        setFetchError('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

  // Programme options based on degree
  useEffect(() => {
    const deg = formData.candidateDegree;
    let opts = [];
    if (deg === 'UG') opts = ['BE','B.Sc.','B. Com','BBA','BCA','BA','B.Lit.','B.S.W','B.Ed','B.F.A'];
    else if (deg === 'PG') opts = ['ME','M.Tech','M.Phil','M.A','M.C.A','M.Sc.','M.S.W','M.B.A','M.F.A'];
    else if (deg === 'Integrated') opts = ['M.Sc','BBA + MBA','BA + Bed','BA+LLB'];
    setProgrammeOptions(opts);
    if (!opts.includes(formData.programme)) {
      setFormData(prev => ({ ...prev, programme: '' }));
    }
  }, [formData.candidateDegree]);

  // Auto‑generate studentId from Firestore counter + your batch/course code
  useEffect(() => {
    const { coursesEnquired, batchNumber } = formData;
    if (!coursesEnquired || !batchNumber) return;
    const key = coursesEnquired.toLowerCase();
    const courseCode = COURSE_CODES[key] || 'XX';
    generateUniqueIdFromFirestore('Student')
      .then(prefixed => {
        const roll = prefixed.slice(-3);
        setFormData(prev => ({
          ...prev,
          studentId: `BT${batchNumber}${courseCode}${roll}`
        }));
      })
      .catch(console.error);
  }, [formData.coursesEnquired, formData.batchNumber]);

  // Handlers
  const handleChange = e =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCandidatePicChange = e => {
    const file = e.target.files?.[0];
    if (file) {
      setCandidatePic(URL.createObjectURL(file));
      setShowCropper(true);
      setCroppedCandidatePic(null);
    }
  };

  const handleFileChange = (e, setter) => {
    const file = e.target.files?.[0];
    if (file) setter(file);
  };

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleCropImage = async () => {
    try {
      const { fileUrl } = await getCroppedImg(
        candidatePic,
        croppedAreaPixels,
        'candidatePic.jpg'
      );
      setCroppedCandidatePic(fileUrl);
      setShowCropper(false);
    } catch (err) {
      console.error(err);
    }
  };

  const removeCandidatePic = () => {
    setCandidatePic(null);
    setCroppedCandidatePic(null);
    setShowCropper(false);
    candidatePicRef.current.value = '';
  };
  const removeMarkStatement = () => {
    setMarkStatement(null);
    markStatementRef.current.value = '';
  };
  const removeSignature = () => {
    setSignatureFile(null);
    signatureRef.current.value = '';
  };

  const validate = () => {
    const temp = {};
    [
      'referrerId','batchNumber','candidateName','trainingMode','college','candidateDegree','programme',
      'candidateCourseName','marksType','score','mobile','parentMobile','email','coursesEnquired',
      'dateOfVisit','paymentTerm','communicationScore'
    ].forEach(f => {
      if (!formData[f]) temp[f] = 'Required.';
    });
    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      // 1) Upload to your backend (Mongo + Cloudinary)
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => data.append(k, v));
      if (croppedCandidatePic) {
        const blob = await fetch(croppedCandidatePic).then(r => r.blob());
        data.append('candidatePic', blob, 'candidatePic.jpg');
      }
      if (markStatement) data.append('markStatement', markStatement);
      if (signatureFile) data.append('signature', signatureFile);

      const resp = await axios.post(
        `${API_BASE_URL}/api/candidates`,
        data,
        { withCredentials: true }
      );

      // 2) Create Auth user + Firestore writes
      const namePart   = formData.candidateName.replace(/\s+/g, '').slice(0,3).toLowerCase();
      const mobilePart = formData.mobile.slice(-3);
      const pwd        = `${namePart}@${mobilePart}`;

      const cred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        pwd
      );
      const fs = getFirestore(app);

      // 2a) Batch‑scoped student record (unchanged) :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
      await setDoc(
        doc(fs, `batch/${formData.batchNumber}/students`, formData.studentId),
        { uid: formData.studentId, email: formData.email, role: 'student' }
      );

      // 2b) ── ALSO REGISTER IN TOP‑LEVEL “users” COLLECTION ── CHANGED
      await setDoc(
        doc(fs, 'users', formData.studentId),             // CHANGED
        { email: formData.email, role: 'student',uid: formData.studentId }         // CHANGED
      );

      // Success feedback
      const createdId = resp.data.candidate.studentId;
      setSuccessMessage(`Candidate ${createdId} added successfully`);
      // Reset form + files
      setFormData({
        referrerId:'', batchNumber:'', studentId:'', candidateName:'', college:'',
        candidateDegree:'', programme:'', candidateCourseName:'', marksType:'',
        score:'', scholarshipSecured:'', mobile:'', parentMobile:'', email:'',
        coursesEnquired:'', dateOfVisit:'', paymentTerm:'', communicationScore:''
      });
      removeCandidatePic();
      removeMarkStatement();
      removeSignature();
    } catch (err) {
      alert(err.message || 'Error saving candidate');
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

            {/* User */}
            <InputGroup>
              <Label htmlFor="referrerId">User</Label>
              <Select
                id="referrerId"
                name="referrerId"
                value={formData.referrerId}
                onChange={handleChange}
                disabled={loadingUsers || !!fetchError}
              >
                <option value="">Select User</option>
                {loadingUsers  && <option>Loading…</option>}
                {fetchError && <option disabled>{fetchError}</option>}
                {!loadingUsers  && !fetchError && users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.displayName || user.id}
                  </option>
                ))}
              </Select>
              {errors.userId && <ErrorText>{errors.userId}</ErrorText>}
            </InputGroup>

             {/* Batch Number */}
            <InputGroup>
              <Label>Batch Number</Label>
              <Input
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleChange}
                placeholder="Enter batch number"
              />
            </InputGroup>

            {/* Training Mode */}
            <InputGroup>
              <Label>Training Mode</Label>
              <RadioGroup>
                <label>
                  <input
                    type="radio"
                    name="trainingMode"
                    value="Online"
                    checked={formData.trainingMode === 'Online'}
                    onChange={handleChange}
                  /> Online
                </label>
                <label>
                  <input
                    type="radio"
                    name="trainingMode"
                    value="On-campus@ Thanjavur"
                    checked={formData.trainingMode === 'On-campus@ Thanjavur'}
                    onChange={handleChange}
                  /> On-campus @ Thanjavur
                </label>
              </RadioGroup>
              {errors.trainingMode && <ErrorText>{errors.trainingMode}</ErrorText>}
            </InputGroup>


            {/* Student ID (readonly) */}
            <InputGroup>
              <Label>Student ID</Label>
              <Input name="studentId" value={formData.studentId} readOnly />
            </InputGroup>

            {/* Candidate Name */}
            <InputGroup>
              <Label>Candidate Name</Label>
              <Input
                name="candidateName"
                value={formData.candidateName}
                onChange={handleChange}
                placeholder="Enter candidate's name"
              />
              {errors.candidateName && <ErrorText>{errors.candidateName}</ErrorText>}
            </InputGroup>

            {/* College */}
            <InputGroup>
              <Label>College Name</Label>
              <Input
                name="college"
                value={formData.college}
                onChange={handleChange}
                placeholder="Enter college name"
              />
              {errors.college && <ErrorText>{errors.college}</ErrorText>}
            </InputGroup>

            {/* Degree */}
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

            {/* Programme */}
            <InputGroup>
              <Label>Programme</Label>
              <Select name="programme" value={formData.programme} onChange={handleChange}>
                <option value="">Select Programme</option>
                {programmeOptions.map((prog,i) => (
                  <option key={i} value={prog}>{prog}</option>
                ))}
              </Select>
              {errors.programme && <ErrorText>{errors.programme}</ErrorText>}
            </InputGroup>

            {/* Course Name (opt) */}
            <InputGroup>
              <Label>Course Name</Label>
              <Input
                name="candidateCourseName"
                value={formData.candidateCourseName}
                onChange={handleChange}
                placeholder="Enter course name"
              />
              {errors.candidateCourseName && <ErrorText>{errors.candidateCourseName}</ErrorText>}
            </InputGroup>

            {/* Marks Type */}
            <InputGroup>
              <Label>Marks Secured (Type)</Label>
              <RadioGroup>
                <label>
                  <input
                    type="radio"
                    name="marksType"
                    value="CGPA"
                    checked={formData.marksType==='CGPA'}
                    onChange={handleChange}
                  /> CGPA
                </label>
                <label>
                  <input
                    type="radio"
                    name="marksType"
                    value="Percentage"
                    checked={formData.marksType==='Percentage'}
                    onChange={handleChange}
                  /> Percentage
                </label>
              </RadioGroup>
              {errors.marksType && <ErrorText>{errors.marksType}</ErrorText>}
            </InputGroup>

            {/* Score */}
            <InputGroup>
              <Label>Score</Label>
              <Input
                name="score"
                value={formData.score}
                onChange={handleChange}
                placeholder="Enter score"
              />
              {errors.score && <ErrorText>{errors.score}</ErrorText>}
            </InputGroup>

            {/* Scholarship */}
            <InputGroup>
              <Label>Scholarship Secured</Label>
              <Input
                name="scholarshipSecured"
                value={formData.scholarshipSecured}
                onChange={handleChange}
                placeholder="Enter scholarship details"
              />
            </InputGroup>

            {/* Mobile */}
            <InputGroup>
              <Label>Mobile Number</Label>
              <Input
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter mobile number"
              />
              {errors.mobile && <ErrorText>{errors.mobile}</ErrorText>}
            </InputGroup>

            {/* Parent Mobile */}
            <InputGroup>
              <Label>Parent Mobile Number</Label>
              <Input
                name="parentMobile"
                value={formData.parentMobile}
                onChange={handleChange}
                placeholder="Enter parent's mobile number"
              />
              {errors.parentMobile && <ErrorText>{errors.parentMobile}</ErrorText>}
            </InputGroup>

            {/* Email */}
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

            {/* Courses Enquired */}
            <InputGroup>
              <Label>Courses Enquired</Label>
              <Select
                name="coursesEnquired"
                value={formData.coursesEnquired}
                onChange={handleChange}
              >
                <option value="">Select Course</option>
                {Object.entries(COURSE_CODES).map(([name, code]) => (
                  <option key={code} value={name}>
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </option>
                ))}
              </Select>
              {errors.coursesEnquired && <ErrorText>{errors.coursesEnquired}</ErrorText>}
            </InputGroup>

            {/* Date of Visit */}
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

            {/* Payment Term */}
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

            {/* Communication Score */}
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

            {/* Candidate Picture */}
            <InputGroup>
              <Label>Candidate Picture</Label>
              <InputFile
                type="file"
                accept="image/*"
                onChange={handleCandidatePicChange}
                ref={candidatePicRef}
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
                    />
                    <RemoveIcon onClick={removeCandidatePic}>×</RemoveIcon>
                  </CropperWrapper>
                  <CropControls>
                    <CropButton type="button" onClick={handleCropImage}>Crop</CropButton>
                    <SliderContainer>
                      <SliderLabel>Zoom:</SliderLabel>
                      <SliderInput
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={zoom}
                        onChange={e => setZoom(Number(e.target.value))}
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

            {/* Mark Statement (PDF only) */}
            <InputGroup>
              <Label>Mark Statement (PDF only)</Label>
              <InputFile
                type="file"
                accept="application/pdf, .pdf"
                onChange={e => handleFileChange(e, setMarkStatement)}
                ref={markStatementRef}
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

            {/* Signature (optional) */}
            <InputGroup>
              <Label>Signature (optional)</Label>
              <InputFile
                type="file"
                accept="image/*"
                onChange={e => handleFileChange(e, setSignatureFile)}
                ref={signatureRef}
              />
              {signatureFile && (
                <ImagePreviewWrapper>
                  <ImagePreview src={URL.createObjectURL(signatureFile)} alt="Signature" />
                  <RemoveIcon onClick={removeSignature}>×</RemoveIcon>
                </ImagePreviewWrapper>
              )}
            </InputGroup>

            <SubmitButton type="submit">Submit Candidate</SubmitButton>
          </Form>

          {isLoading && (
            <LoadingOverlay><Spinner /></LoadingOverlay>
          )}

          {successMessage && (
            <SuccessModalOverlay>
              <SuccessModalContent>
                <SuccessTitle>{successMessage} <i className="fa-solid fa-circle-check fa-bounce" style={{ color: "#14a800" }}></i> </SuccessTitle>
                <ModalCloseButton onClick={() => setSuccessMessage('')}>Close</ModalCloseButton>
              </SuccessModalContent>
            </SuccessModalOverlay>
          )}
        </Content>
        <Footer />
      </Wrapper>
    </>
  );
}


/* Styled Components below unchanged */

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
  padding: 20px 15px;
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

/* Cropper Styling */
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
