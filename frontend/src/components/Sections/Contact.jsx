import React, { useState, useRef } from "react";
import styled from "styled-components";
// Assets
import ContactImg1 from "../../assets/img/contact-1.jpg";
import ContactImg2 from "../../assets/img/contact-2.jpg";
import ContactImg3 from "../../assets/img/contact-3.jpg";
import emailjs from "emailjs-com";
import { motion } from "framer-motion";

const initialState = {
  name: "",
  phone: "",
  subject: "",
  message: "",
};

export default function Contact() {
  const [{ name, phone, subject, message }, setState] = useState(initialState);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState((prevState) => ({ ...prevState, [name]: value }));
  };

  const clearState = () => setState({ ...initialState });

  const validateForm = () => {
    const newErrors = {};
    const mobileRegex = /^[0-9]{10}$/;
    if (!name.trim()) newErrors.name = "Name is required";
    if (!phone.trim()) newErrors.phone = "Phone is required";
    if (!phone.trim()) {
      newErrors.phone = "Mobile number is required.";
    } else if (!mobileRegex.test(phone)) {
      newErrors.phone = "Mobile number must be exactly 10 digits.";
    }
    if (!subject.trim()) newErrors.subject = "Subject is required";
    if (!message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    console.log(name, phone, subject, message);

    // Replace with your own Service ID, Template ID, and Public Key from your EmailJS account
    emailjs
      .sendForm("service_hyxy9rv", "template_tfo8h74", formRef.current, "t3fbhvx8myxJiqSOC")
      .then(
        (result) => {
          alert("Message Sent ✔️");
          clearState();
          setErrors({});
        },
        (error) => {
          console.log(error.text);
        }
      );
  };

  return (
    <Wrapper id="contact">
      <div className="lightBg" id="contact-form">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: false, amount: 0.2 }}
          className="container w-full p-10 bg-blue-500 text-white text-center rounded-lg"
        >
          <HeaderInfo>
            <h1 className="font40 extraBold">Let's get in touch</h1>
            <p className="font13">
              {/* Your text here */}
            </p>
          </HeaderInfo>
          <div className="row" style={{ paddingBottom: "30px" }}>
            <div className="col-xs-12 col-sm-12 col-md-6 col-lg-6">
              <Form ref={formRef} onSubmit={handleSubmit}>
                {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
                <label className="font13">First name:</label>
                <input
                  type="text"
                  name="name"
                  className="font20 extraBold"
                  onChange={handleChange}
                  value={name}
                />

                {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
                <label className="font13">Phone:</label>
                <input
                  type="tel"
                  name="phone"
                  className="font20 extraBold"
                  onChange={handleChange}
                  value={phone}
                />

                {errors.subject && <ErrorMessage>{errors.subject}</ErrorMessage>}
                <label className="font13">Subject:</label>
                <input
                  type="text"
                  name="subject"
                  className="font20 extraBold"
                  onChange={handleChange}
                  value={subject}
                />

                {errors.message && <ErrorMessage>{errors.message}</ErrorMessage>}
                <label className="font13">Message:</label>
                <textarea
                  rows="4"
                  name="message"
                  className="font20 extraBold"
                  onChange={handleChange}
                  value={message}
                />

                <SubmitWrapper className="flex">
                  <ButtonInput
                    type="submit"
                    value="SEND MESSAGE"
                    className="pointer animate radius8"
                    style={{ maxWidth: "220px" }}
                  />
                </SubmitWrapper>
              </Form>
            </div>
            <div className="col-xs-12 col-sm-12 col-md-6 col-lg-6 flex">
              <div style={{ width: "40%" }} className="flexNullCenter flexColumn">
                <ContactImgBox>
                  <Img src={ContactImg1} alt="office" className="radius6" />
                </ContactImgBox>
                <ContactImgBox>
                  <Img src={ContactImg2} alt="office" className="radius6" />
                </ContactImgBox>
              </div>
              <div style={{ width: "50%" }}>
                <div style={{ marginTop: "100px" }}>
                  <Img src={ContactImg3} alt="office" className="radius6" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  width: 100%;
`;

const HeaderInfo = styled.div`
  padding: 70px 0 30px 0;
  @media (max-width: 860px) {
    text-align: center;
  }
`;

const Form = styled.form`
  padding: 70px 0 30px 0;

  input:not([type="submit"]),
  textarea {
    width: 100%;
    background-color: transparent;
    border: 0;
    outline: none;
    box-shadow: none;
    border-bottom: 1px solid #707070;
    height: 30px;
    margin-bottom: 30px;
    color: black;
  }

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

  textarea {
    min-height: 100px;
  }

  @media (max-width: 860px) {
    padding: 30px 0;
  }
`;

const ErrorMessage = styled.label`
  color: red;
  font-size: 12px;
  margin-bottom: 5px;
  display: block;
`;

const ButtonInput = styled.input`
  border: 1px solid #7620ff;
  background-color: #7620ff;
  width: 100%;
  padding: 15px;
  outline: none;
  color: #fff;
  :hover {
    background-color: #580cd2;
    border: 1px solid #7620ff;
    color: #fff;
  }
  @media (max-width: 991px) {
    margin: 0 auto;
  }
`;

const ContactImgBox = styled.div`
  max-width: 180px;
  align-self: flex-end;
  margin: 10px 30px 10px 0;
`;

const Img = styled.img`
  width: 100%;
  @media (max-width: 760px) {
    display: none;
  }
`;

const SubmitWrapper = styled.div`
  @media (max-width: 991px) {
    width: 100%;
    margin-bottom: 50px;
    display: flex;
  }
`;
