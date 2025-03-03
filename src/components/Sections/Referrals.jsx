import React, { useState } from 'react'; 
import styled, { keyframes } from 'styled-components';
import TopNavbar from '../Nav/TopNavbar';
import Footer from './Footer';
import emailjs from 'emailjs-com';

const Referrals = () => {
    const [showModal, setShowModal] = useState(false);
    const [successModal, setSuccessModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // New loading state
    const [formData, setFormData] = useState({
        // Referrer details
        referrerName: '',
        referrerPosition: '',
        referrerCollege: '',
        // Candidate details
        candidateName: '',
        candidateDegree: '',
        candidateCourseName: '',
        marksType: '', // "CGPA" or "Percentage"
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
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setFormData(prev => ({
        ...prev,
        [e.target.name]: e.target.value
        }));
    };

    const handleInput = (event) => {
        const value = event.target.value;
        event.target.value = value.charAt(0).toUpperCase() + value.slice(1);
    };

    const validate = () => {
        let tempErrors = {};
        // Referrer validations
        if (!formData.referrerName) tempErrors.referrerName = "Referrer's Name is required.";
        if (!formData.referrerPosition) tempErrors.referrerPosition = "Position is required.";
        if (!formData.referrerCollege) tempErrors.referrerCollege = "College is required.";
        
        // Candidate validations
        if (!formData.candidateName) tempErrors.candidateName = "Candidate Name is required.";
        if (!formData.candidateDegree) tempErrors.candidateDegree = "Degree is required.";
        if (!formData.candidateCourseName) tempErrors.candidateCourseName = "Course Name is required.";
        
        // Marks & Score validation
        if (!formData.marksType) {
            tempErrors.marksType = "Marks type is required.";
            }
            
            if (!formData.score) {
            tempErrors.score = "Score is required.";
            } else {
            const scoreValue = parseFloat(formData.score);
            if (formData.marksType === "CGPA") {
                // Ensure CGPA is between 0 and 10 (you can adjust the range as needed)
                if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 10) {
                tempErrors.score = "Please enter a valid CGPA between 0 and 10.";
                }
            } else if (formData.marksType === "Percentage") {
                // Ensure percentage is between 0 and 100
                if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
                tempErrors.score = "Please enter a valid percentage between 0 and 100.";
                }
            }
            }
            
            // Mobile number validations
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
            
            // Email validation
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
        

    const closeSuccessModal = () => {
        setSuccessModal(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
        setIsLoading(true); // Start loading
        emailjs.send(
            "service_hyxy9rv", 
            "template_tyht7d6", 
            formData, 
            "t3fbhvx8myxJiqSOC"
        )
        .then((response) => {
            // console.log("Email sent successfully:", response.status, response.text);
            setIsLoading(false); // Stop loading
            // Reset form and close referral modal
            setFormData({
            referrerName: '',
            referrerPosition: '',
            referrerCollege: '',
            candidateName: '',
            candidateDegree: '',
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
            remarks: ''
            });
            setShowModal(false);
            setSuccessModal(true);
        })
        .catch((err) => {
            setIsLoading(false); // Stop loading on error as well
            console.error("Failed to send email:", err);
            alert("There was an error sending the referral. Please try again.");
        });
        }
    };

    return (
        <>
        <Wrapper>
            <TopNavbar />
            <HeaderInfo className="container">
            <h1 className="font40 extraBold">Referrals</h1>
            <div>
                <ModalButton onClick={() => setShowModal(true)}>
                Refer a Candidate
                </ModalButton>
            </div>
            </HeaderInfo>
            <Footer openReferralModal={() => setShowModal(true)} />
        </Wrapper>

        {showModal && (
            <ModalOverlay>
            <ModalContent>
                <ModalHeader>
                <SectionTitle>Referrer Details</SectionTitle>
                <CloseButton onClick={() => setShowModal(false)}>×</CloseButton>
                </ModalHeader>
                <ModalBody>
                <Form onSubmit={handleSubmit}>
                    <Label>Referrer's Name</Label>
                    <InputGroup>
                    <Input
                        type="text"
                        name="referrerName"
                        value={formData.referrerName}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        onInput={handleInput}
                    />
                    {errors.referrerName && <ErrorText>{errors.referrerName}</ErrorText>}
                    </InputGroup>
                    <InputGroup>
                    <Label>Position</Label>
                    <Input
                        type="text"
                        name="referrerPosition"
                        value={formData.referrerPosition}
                        onChange={handleChange}
                        placeholder="Enter your position"
                        onInput={handleInput}
                    />
                    {errors.referrerPosition && <ErrorText>{errors.referrerPosition}</ErrorText>}
                    </InputGroup>
                    <InputGroup>
                    <Label>College</Label>
                    <Input
                        type="text"
                        name="referrerCollege"
                        value={formData.referrerCollege}
                        onChange={handleChange}
                        placeholder="Enter your college"
                        onInput={handleInput}
                    />
                    {errors.referrerCollege && <ErrorText>{errors.referrerCollege}</ErrorText>}
                    </InputGroup>

                    <SectionTitle>Candidate Details</SectionTitle>
                    <InputGroup>
                    <Label>Candidate Name</Label>
                    <Input
                        type="text"
                        name="candidateName"
                        value={formData.candidateName}
                        onChange={handleChange}
                        placeholder="Enter candidate's name"
                        onInput={handleInput}
                    />
                    {errors.candidateName && <ErrorText>{errors.candidateName}</ErrorText>}
                    </InputGroup>
                    <InputGroup>
                    <Label>Degree</Label>
                    <Select name="candidateDegree" value={formData.candidateDegree} onChange={handleChange}>
                        <option value="">Select Degree</option>
                        <option value="UG">UG</option>
                        <option value="PG">PG</option>
                        <option value="Integrated">Integrated Course</option>
                    </Select>
                    {errors.candidateDegree && <ErrorText>{errors.candidateDegree}</ErrorText>}
                    </InputGroup>
                    <InputGroup>
                    <Label>Course Name</Label>
                    <Input
                        type="text"
                        name="candidateCourseName"
                        value={formData.candidateCourseName}
                        onChange={handleChange}
                        placeholder="Enter course name"
                        onInput={handleInput}
                    />
                    {errors.candidateCourseName && <ErrorText>{errors.candidateCourseName}</ErrorText>}
                    </InputGroup>
                    <InputGroup>
                    <Label>Marks Secured</Label>
                    <RadioGroup>
                        <label>
                        <input
                            type="radio"
                            name="marksType"
                            value="CGPA"
                            checked={formData.marksType === "CGPA"}
                            onChange={handleChange}
                        />{' '}
                        CGPA
                        </label>
                        <label>
                        <input
                            type="radio"
                            name="marksType"
                            value="Percentage"
                            checked={formData.marksType === "Percentage"}
                            onChange={handleChange}
                        />{' '}
                        Percentage
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
                        onInput={handleInput}
                    />
                    </InputGroup>
                    <InputGroup>
                    <Label>Self Mobile Number</Label>
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
                    <Label>Email-ID</Label>
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
                    <SubmitButton type="submit">Submit Referral</SubmitButton>
                </Form>
                </ModalBody>
            </ModalContent>
            </ModalOverlay>
        )}

        {successModal && (
            <ModalOverlay>
            <SuccessModalContent>
                <SuccessTitle>Registration Successful! <i class="fa-solid fa-circle-check fa-bounce" style={{color:" #14a800"}}></i></SuccessTitle>
                <SuccessMessage>Our team will contact you shortly.</SuccessMessage>
                <SuccessButton onClick={closeSuccessModal}>OK</SuccessButton>
            </SuccessModalContent>
            </ModalOverlay>
        )}

        {isLoading && (
            <ModalOverlay>
            <LoaderContainer>
                <Loader />
            </LoaderContainer>
            </ModalOverlay>
        )}
        </>
    );
};

export default Referrals;


    // Styled Components

    const Wrapper = styled.section`
    padding-top: 80px;
    width: 100%;
    background: linear-gradient(90deg, #f7f7f7, #eaeaea);
    display: flex;
    flex-direction: column;
    `;

    const HeaderInfo = styled.div`
    text-align: center;
    padding: 50px 20px;
    h1 {
        font-size: 3.5rem;
        font-weight: 800;
        margin-bottom: 20px;
        color: #333;
    }
    @media (max-width: 860px) {
        h1 {
        font-size: 2.5rem;
        }
    }
    `;

    const ModalButton = styled.button`
    padding: 12px 25px;
    background: #ff9900;
    color: #fff;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 16px;
    transition: background 0.3s ease;
    &:hover {
        background: #e68a00;
    }
    `;

    const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.65);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1100;
    padding: 15px;
    `;

    const ModalContent = styled.div`
    background: #fff;
    width: 100%;
    max-width: 600px;
    max-height: 80vh;
    border-radius: 10px;
    box-shadow: 0px 4px 12px rgba(0,0,0,0.1);
    position: relative;
    display: flex;
    flex-direction: column;

    input:-webkit-autofill,
    input:-webkit-autofill:hover,
    input:-webkit-autofill:focus,
    textarea:-webkit-autofill,
    textarea:-webkit-autofill:hover,
    textarea:-webkit-autofill:focus {
    -webkit-text-fill-color: black !important;
    transition: background-color 5000s ease-in-out 0s;
    }

    input::first-letter {
    text-transform: uppercase;
    }

    `;

    const ModalHeader = styled.div`
    position: sticky;
    top: 0;
    background: #fff;
    padding: 10px 15px;
    display: flex;
    justify-content: space-between;
    z-index: 2;
    border-bottom: 1px solid #eee;
    flex-shrink: 0;
    height: 50px;
    border-radius: 12px;
    `;

    const CloseButton = styled.button`
    background: transparent;
    border: none;
    font-size: 28px;
    color: #333;
    cursor: pointer;
    `;

    const ModalBody = styled.div`
    padding: 20px;
    overflow-y: auto;
    max-height: calc(80vh - 50px);
    `;

    const Form = styled.form`
    display: flex;
    flex-direction: column;
    text-align: left;
    `;

    const SectionTitle = styled.h2`
    margin-bottom: 15px;
    color: #222;
    border-bottom: 2px solid #ddd;
    padding-bottom: 8px;
    `;

    const InputGroup = styled.div`
    margin-bottom: 15px;
    display: flex;
    flex-direction: column;
    `;

    const Label = styled.label`
    margin-bottom: 5px;
    font-weight: 600;
    color: #555;
    `;

    const Input = styled.input`
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 15px;
    &:focus {
        outline: none;
        border-color: #ff9900;
        box-shadow: 0 0 5px rgba(255, 153, 0, 0.3);
    }
    `;

    const Select = styled.select`
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 15px;
    &:focus {
        outline: none;
        border-color: #ff9900;
        box-shadow: 0 0 5px rgba(255, 153, 0, 0.3);
    }
    `;

    const RadioGroup = styled.div`
    display: flex;
    gap: 20px;
    label {
        font-size: 15px;
        color: #555;
    }
    `;

    const TextArea = styled.textarea`
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 15px;
    resize: vertical;
    &:focus {
        outline: none;
        border-color: #ff9900;
        box-shadow: 0 0 5px (255, 153, 0, 0.3);
    }
    `;

    const SubmitButton = styled.button`
    padding: 14px;
    background: #7620ff;
    color: #fff;
    border: none;
    border-radius: 15px;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.3s ease;
    &:hover {
        background:  #580cd2;
    }
    `;

    const ErrorText = styled.span`
    color: red;
    font-size: 14px;
    margin-top: 5px;
    `;

    const SuccessModalContent = styled(ModalContent)`
    background-color:  white;
    color: black;
    text-align: center;
    padding: 40px 20px;
    box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.2);
    border: none;
    `;

    const SuccessTitle = styled.h2`
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 20px;
    color: black;
    `;

    const SuccessMessage = styled.p`
    font-size: 1.2rem;
    margin-bottom: 30px;
    color: #555;
    `;

    const SuccessButton = styled.button`
    padding: 12px 30px;
    background: #fff;
    color: #ff9900;
    border: 2px solid #e68a00;
    border-radius: 3px;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.5s ease, color 0.7s ease;
    &:hover {
        background: #e68a00;
        color: white;
    }
    @media (max-width: 760px) {
        width: 100%;
    }
    `;

    // Spinner animation keyframes
    const spin = keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
    `;

    // Loader spinner
    const Loader = styled.div`
    border: 8px solid #f3f3f3;
    border-top: 8px solid #7620ff;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: ${spin} 1.5s linear infinite;
    `;

    // Container to center the Loader
    const LoaderContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    `;

