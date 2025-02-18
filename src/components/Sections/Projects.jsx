import React, { useState } from "react";
import styled from "styled-components";
import ProjectBox from "../Elements/ProjectBox";
import FullButton from "../Buttons/FullButton";
import { motion } from "framer-motion";
import ProjectImg1 from "../../assets/img/projects/1.webp";
import ProjectImg2 from "../../assets/img/projects/2.webp";
import ProjectImg3 from "../../assets/img/projects/3.webp";
import ProjectImg4 from "../../assets/img/projects/4.webp";
import ProjectImg5 from "../../assets/img/projects/5.webp";
import ProjectImg6 from "../../assets/img/projects/6.webp";
import { Modal, Button, Select, Input } from "antd";
import { CloseOutlined } from "@ant-design/icons"; // Import the CloseOutlined icon

export default function Projects() {
  const [showMore, setShowMore] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

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
  };

  const handleSubmit = () => {
    console.log("Form Data Submitted:", formData);
    closeModal();
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
          <motion.div className="row w-full p-10 bg-blue-500 text-white text-center rounded-lg">
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
                text="Develop efficient applications, automate tasks, and explore data science concepts using Python’s powerful and versatile ecosystem."
                action={() => openModal("Python")}
              />
            </div>
            <div className="col-xs-12 col-sm-4 col-md-4 col-lg-4">
              <ProjectBox
                img={ProjectImg3}
                title="PHP"
                text="Learn to build scalable web applications using PHP, handling databases, security, and backend development with best coding practices."
                action={() => openModal("PHP")}
              />
            </div>
          </motion.div>
          {showMore && (
            <motion.div className="row w-full p-10 bg-blue-500 text-white text-center rounded-lg">
              <div className="col-xs-12 col-sm-4 col-md-4 col-lg-4">
                <ProjectBox
                  img={ProjectImg4}
                  title="Business Analyst"
                  text="Analyze business trends, interpret data, and optimize processes to drive strategic decision-making and organizational success."
                  action={() => openModal("Business Analyst")}
                />
              </div>
              <div className="col-xs-12 col-sm-4 col-md-4 col-lg-4">
                <ProjectBox
                  img={ProjectImg2}
                  title="Digital Marketing"
                  text="Explore SEO, social media, and content strategies to enhance online presence, drive engagement, and grow business visibility effectively."
                  action={() => openModal("Digital Marketing")}
                />
              </div>
              <div className="col-xs-12 col-sm-4 col-md-4 col-lg-4">
                <ProjectBox
                  img={ProjectImg5}
                  title="Graphic Designing"
                  text="Create visually compelling designs, master typography, and enhance branding with creative tools for impactful digital experiences."
                  action={() => openModal("Graphic Designing")}
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
      {modalOpen && (
        <ModalOverlay>
          <ModalContent>
            <h2>Register for {selectedCourse}</h2>
            <CloseIcon onClick={closeModal} /> {/* Add Close Icon */}
            <p>Fill in your details to register.</p>
            <div className="row flex-col gap-4">
              <Input placeholder="Name" onChange={(e) => handleChange("name", e.target.value)} />
              <Input placeholder="Email Id" onChange={(e) => handleChange("email", e.target.value)} />
              <Input placeholder="Mobile No" onChange={(e) => handleChange("mobile", e.target.value)} />
              
              <Select 
                placeholder="Select Course" 
                onChange={(value) => handleChange("course", value)}
                dropdownStyle={{ maxHeight: 300, overflowY: 'auto' }} // ensures dropdown goes top-to-bottom
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
      
              <Select placeholder="Training Mode" onChange={(value) => handleChange("mode", value)}>
                <Select.Option value="On-Campus @ Thanjavur">On-Campus @ Thanjavur</Select.Option>
                <Select.Option value="Online">Online</Select.Option>
              </Select>
      
              <Button type="primary" onClick={handleSubmit}>
                Submit
              </Button>
            </div>
          </ModalContent>
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

  .ant-input, .ant-select {
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
  }

  .ant-select{
    margin-right: 5px;
  }

  .ant-btn {
    background-color: #7620ff;
    border-color: #7620ff;
    color: #fff;
    width: 100%;
    padding: 12px;
    border-radius: 5px;
    :hover {
      background-color: #580cd2;
      border: #580cd2;
    }
  }


  .ant-select-selector{
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
