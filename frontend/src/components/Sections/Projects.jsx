import React, { useRef, useState } from "react"; 
import styled, { keyframes } from 'styled-components';
import ProjectBox from "../Elements/ProjectBox";
import FullButton from "../Buttons/FullButton";
import { motion } from "framer-motion";
import ProjectImg1 from "../../assets/img/projects/1.webp";
import ProjectImg2 from "../../assets/img/projects/2.webp";
import ProjectImg3 from "../../assets/img/projects/3.webp";
import ProjectImg4 from "../../assets/img/projects/4.webp";
import ProjectImg5 from "../../assets/img/projects/5.jpg";
import ProjectImg6 from "../../assets/img/projects/6.webp";
import { Modal, Button, Select, Input } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import AddImage2 from "../../assets/img/add/add2.webp";
import emailjs from "emailjs-com";

export default function Projects() {
  const [showMore, setShowMore] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [successModal, setSuccessModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false); // New loading state
  
  const scrollToContactForm = () => {
    const element = document.getElementById("contact-form");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleCourses = () => {
    setShowMore(!showMore);
  };

  const openModal = (course) => {
    setSelectedCourse(course);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCourse(null);
    setErrors({});
  };

  const closeSuccessModal = () => {
    setSuccessModal(false);
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    course: "",
    mode: "",
  });

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
    // Clear error for this field if exists
    if (errors[key]) {
      setErrors({ ...errors, [key]: "" });
    }
  };

  const handleSubmit = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^[0-9]{10}$/;
    let errorsObj = {};

    if (!formData.name.trim()) {
      errorsObj.name = "Name is required.";
    }
    if (!formData.email.trim()) {
      errorsObj.email = "Email is required.";
    } else if (!emailRegex.test(formData.email)) {
      errorsObj.email = "Please enter a valid email address.";
    }
    if (!formData.mobile.trim()) {
      errorsObj.mobile = "Mobile number is required.";
    } else if (!mobileRegex.test(formData.mobile)) {
      errorsObj.mobile = "Mobile number must be exactly 10 digits.";
    }
    if (!formData.course.trim()) {
      errorsObj.course = "Please select a course.";
    }
    if (!formData.mode.trim()) {
      errorsObj.mode = "Please select a training mode.";
    }

    // If there are errors, update state and do not submit
    if (Object.keys(errorsObj).length > 0) {
      setErrors(errorsObj);
      return;
    }

    // Clear any previous errors before sending
    setErrors({});

    setIsLoading(true); 


    // Replace these with your EmailJS credentials
    const serviceID = "service_hyxy9rv";
    const templateID = "template_tyht7d6";
    const userID = "t3fbhvx8myxJiqSOC";

    emailjs
      .send(serviceID, templateID, formData, userID)
      .then((response) => {
        setIsLoading(false);
        // console.log("SUCCESS!", response.status, response.text);
        // Optionally, you could reset the formData here
        setFormData({
          name: "",
          email: "",
          mobile: "",
          course: "",
          mode: "",
        });
        closeModal();
        setSuccessModal(true);
      })
      .catch((err) => {
        setIsLoading(false);
        console.error("FAILED...", err);
        // Optionally, handle error feedback here
      });
  };

  return (
    <Wrapper id="projects">
      <div className="whiteBg">
        <div className="container">
          <HeaderInfo>
            <h1 className="font40 extraBold">Courses Listing</h1>
            <p className="font15">
              "Unlock your potential with expert-led courses, designed to elevate your skills and career."
            </p>
          </HeaderInfo>
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: false, amount: 0.2 }}
            className="row w-full p-10 bg-blue-500 text-white text-center rounded-lg"
          >
            <div className="col-xs-12 col-sm-4 col-md-4 col-lg-4">
              <ProjectBox
                img={ProjectImg1}
                title="Full-Stack Development"
                text="Develop modern web applications using the latest technologies, mastering both front-end & back-end skills for real-world applications."
                action={() => openModal("Full-Stack Development")}
              />
            </div>
            <div className="col-xs-12 col-sm-4 col-md-4 col-lg-4">
              <ProjectBox
                img={ProjectImg6}
                title="Python"
                text="develop efficient applications, automate tasks, and explore data science concepts using python’s powerful and versatile ecosystem."
                action={() => openModal("Python")}
              />
            </div>
            <div className="col-xs-12 col-sm-4 col-md-4 col-lg-4">
              <ProjectBox
                img={ProjectImg3}
                title="PHP"
                text="learn to build scalable web applications using php, handling databases, security, and backend development with best coding practices."
                action={() => openModal("PHP")}
              />
            </div>
          </motion.div>
          {showMore && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              viewport={{ once: false, amount: 0.2 }}
              className="row w-full p-10 bg-blue-500 text-white text-center rounded-lg"
            >
              <div className="col-xs-12 col-sm-4 col-md-4 col-lg-4">
                <ProjectBox
                  img={ProjectImg4}
                  title="Business Analyst"
                  text="analyze business trends, interpret data, and optimize processes to drive strategic decision-making and organizational success."
                  action={() => openModal("Business Analyst")}
                />
              </div>
              <div className="col-xs-12 col-sm-4 col-md-4 col-lg-4">
                <ProjectBox
                  img={ProjectImg2}
                  title="SEO - Digital Marketing"
                  text="explore seo, social media, and content strategies to enhance online presence, drive engagement, and grow business visibility effectively."
                  action={() => openModal("SEO - Digital Marketing")}
                />
              </div>
              <div className="col-xs-12 col-sm-4 col-md-4 col-lg-4">
                <ProjectBox
                  img={ProjectImg5}
                  title="Software Testing"
                  text="Ensure software quality, master testing strategies, & enhance reliability with cutting-edge tools for flawless digital experiences."
                  action={() => openModal("Software Testing")}
                />
              </div>
            </motion.div>
          )}
          <div className="row flexCenter">
            <div style={{ margin: "50px 0", width: "200px" }}>
              <FullButton title={showMore ? "View Less" : "Load More"} action={toggleCourses} />
            </div>
          </div>
        </div>
      </div>

      <div className="lightBg">
        <div className="container">
          <Advertising className="flexSpaceCenter">
            <AddLeft>
              <AddLeftInner>
                <ImgWrapper className="flexCenter">
                  <img className="radius8" src={AddImage2} alt="add" />
                </ImgWrapper>
              </AddLeftInner>
            </AddLeft>
            <AddRight>
              <h4 className="font15 semiBold">A few words about company</h4>
              <h2 className="font40 extraBold">“Market-Ready Leads”</h2>
              <p className="font12">
                Unlock high-impact lead growth with our innovative strategies and data-driven approach.
              </p>
              <ButtonsRow className="flexNullCenter" style={{ margin: "30px 0" }}>
                <div style={{ width: "190px" }}>
                  <FullButton title="Reach to Us" action={scrollToContactForm} />
                </div>
                <div style={{ width: "190px", marginLeft: "15px" }}>
                  <FullButton title="Contact Us" action={() => alert("clicked")} border />
                </div>
              </ButtonsRow>
            </AddRight>
          </Advertising>
        </div>
      </div>

      {modalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2>Register for {selectedCourse}</h2>
            <CloseIcon onClick={closeModal} />
            <p>Fill in your details to register.</p>
            {/* Wrap form fields in a container with a fixed max-height */}
            <FormContainer className="row flex-col gap-4">
              {errors.name && <ErrorText>{errors.name}</ErrorText>}
              <Input
                placeholder="Name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />

              {errors.email && <ErrorText>{errors.email}</ErrorText>}
              <Input
                placeholder="Email Id"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />

              {errors.mobile && <ErrorText>{errors.mobile}</ErrorText>}
              <Input
                placeholder="Mobile No"
                value={formData.mobile}
                onChange={(e) => handleChange("mobile", e.target.value)}
              />

              {errors.course && <ErrorText>{errors.course}</ErrorText>}
              <Select 
                placeholder="Select Course" 
                value={formData.course || undefined}
                onChange={(value) => handleChange("course", value)}
                dropdownStyle={{ maxHeight: 300, overflowY: "auto" }}
                style={{ width: "80%", minHeight: "10px", display: "flex", alignItems: "center" }}
              >
                {[
                  "Full Stack",
                  "Python",
                  "PHP with Framework",
                  "Dot Net",
                  "Software Testing",
                  "Business Analyst",
                  "Digital Marketing",
                  "Graphic Designing",
                ].map((course) => (
                  <Select.Option key={course} value={course}>
                    {course}
                  </Select.Option>
                ))}
              </Select>

              {errors.mode && <ErrorText>{errors.mode}</ErrorText>}
              <Select 
                placeholder="Training Mode" 
                value={formData.mode || undefined}
                onChange={(value) => handleChange("mode", value)}
                style={{ width: "80%", minHeight: "10px", display: "flex", alignItems: "center" }}
              >
                <Select.Option value="On-Campus @ Thanjavur">
                  On-Campus @ Thanjavur
                </Select.Option>
                <Select.Option value="Online">Online</Select.Option>
              </Select>

              <Button type="primary" onClick={handleSubmit}>
                Submit
              </Button>
            </FormContainer>
          </ModalContent>
        </ModalOverlay>
      )}

      {successModal && (
        <ModalOverlay>
          <ModalContent>
            <h2>Registration Successful ! <i class="fa-solid fa-circle-check fa-bounce" style={{color:" #14a800"}}></i></h2>
            <p>Our team will contact you shortly.</p>
            <Button type="primary" onClick={closeSuccessModal}>
              OK
            </Button>
          </ModalContent>
        </ModalOverlay>
      )}

      {isLoading && (
                  <ModalOverlay>
                  <LoaderContainer>
                      <Loader />
                  </LoaderContainer>
                  </ModalOverlay>
              )}
    </Wrapper>
  );
}

const Wrapper = styled.section`
  width: 100%;
`;

const HeaderInfo = styled.div`
  text-align: center;
    p {
      color: orange;
    }
  @media (max-width: 860px) {
    text-align: center;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 40px;
  border-radius: 10px;
  text-align: center;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;

  @media (max-width: 860px) {
    max-width: 320px;
  }

  h2 {
    font-size: 24px;
    margin-bottom: 15px;
    color: #333;
  }

  p {
    font-size: 14px;
    color: #555;
    margin-bottom: 20px;
  }

  .ant-input,
  .ant-select {
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
  }

  .ant-select {
    margin-right: 5px;
  }

  .ant-btn {
    background-color: #7620ff;
    border-color: #7620ff;
    color: #fff;
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    :hover {
      background-color: #580cd2 !important;
      border: #580cd2 !important;
    }
  }

  .ant-select-selector {
    border-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }

  .ant-select:focus,
  .ant-select:active {
    outline: none;
  }

  .ant-select-focused:not(.ant-select-disabled).ant-select-single .ant-select-selector,
  .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
  .ant-select:not(.ant-select-disabled):focus .ant-select-selector {
    border-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
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

  .ant-select-selector:focus {
    outline: none !important;
    box-shadow: none !important;
  }

  button {
    margin-top: 15px;
    padding: 8px 16px;
    border: 1px solid #ccc;
    background-color: transparent;
    color: #333;
    cursor: pointer;
    border-radius: 5px;
    font-weight: bold;
    :hover {
      background-color: #f0f0f0;
    }
  }
`;

const ErrorText = styled.div`
  color: red;
  font-size: 12px;
  margin-bottom: 2px;
  text-align: left;
`;

const FormContainer = styled.div`
  max-height: 450px;
  overflow-y: auto;
`;

const Advertising = styled.div`
  padding: 100px 0;
  margin: 100px 0;
  position: relative;
    h4{
      color: orange;
    }
  @media (max-width: 1160px) {
    padding: 60px 0 40px 0;
  }
  @media (max-width: 860px) {
    flex-direction: column;
    padding: 0 0 30px 0;
    margin: 80px 0 0px 0;
  }
`;

const ButtonsRow = styled.div`
  @media (max-width: 860px) {
    justify-content: space-between;
  }
`;

const AddRight = styled.div`
  width: 50%;
  @media (max-width: 860px) {
    width: 80%;
    order: 2;
  }
`;

const AddLeftInner = styled.div`
  width: 100%;
  position: absolute;
  top: -300px;
  left: 0;
  @media (max-width: 1190px) {
    top: -250px;
  }
  @media (max-width: 920px) {
    top: -200px;
  }
  @media (max-width: 860px) {
    order: 1;
    position: relative;
    top: -60px;
    left: 0;
  }
`;

const AddLeft = styled.div`
  position: relative;
  width: 50%;
  p {
    max-width: 475px;
  }
  @media (max-width: 860px) {
    width: 80%;
    order: 2;
    text-align: center;
    h2 {
      line-height: 3rem;
      margin: 15px 0;
    }
    p {
      margin: 0 auto;
    }
  }
`;

const ImgWrapper = styled.div`
  width: 80%;
  padding: 0 15%;
  img {
    width: 80%;
    height: 50%;
  }
  @media (max-width: 400px) {
    padding: 0;
  }
`;

const CloseIcon = styled(CloseOutlined)`
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  color: #333;
  cursor: pointer;
  &:hover {
    color: #7620ff;
  }
`;

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

