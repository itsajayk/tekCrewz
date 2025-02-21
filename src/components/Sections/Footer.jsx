import React from "react";
import styled from "styled-components";
import { Link } from "react-scroll";
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaWhatsapp } from "react-icons/fa";
// Assets
import LogoImg from "../../assets/svg/Logo";

export default function Contact() {
  const getCurrentYear = () => new Date().getFullYear();

  return (
    <Wrapper>
      <div className="darkBg">
        <div className="container">
          <InnerWrapper style={{ padding: "30px 0" }}>
            <LogoSection>
              <Link className="flexCenter animate pointer" to="home" smooth={true} offset={-80}>
                <LogoImg />
                <h1 className="font15 extraBold whiteColor" style={{ marginLeft: "15px" }}>
                  TEKCREWZ
                </h1>
              </Link>
            </LogoSection>

            <NewsletterSection>
              <NewsletterTitle className="whiteColor font15 extraBold">
                Subscribe to our Newsletter
              </NewsletterTitle>
              <NewsletterForm onSubmit={(e) => e.preventDefault()}>
                <NewsletterInput type="email" placeholder="Enter your email" />
                <NewsletterButton type="submit">Subscribe</NewsletterButton>
              </NewsletterForm>
            </NewsletterSection>

            <SocialSection>
              <SocialIcon href="https://www.facebook.com" target="_blank">
                <FaFacebookF />
              </SocialIcon>
              <SocialIcon href="https://www.twitter.com" target="_blank">
                <FaTwitter />
              </SocialIcon>
              <SocialIcon href="https://www.instagram.com" target="_blank">
                <FaInstagram />
              </SocialIcon>
              <SocialIcon href="https://www.linkedin.com" target="_blank">
                <FaLinkedinIn />
              </SocialIcon>
            </SocialSection>
          </InnerWrapper>

          <LinksSection>
            <StyledLink href="/about">About</StyledLink>
            <StyledLink href="/terms">Terms &amp; Conditions</StyledLink>
            <StyledLink href="/privacy">Privacy Policy</StyledLink>
            <StyledLink href="#contact-form">Contact</StyledLink>
            <StyledLink href="mailto:info.tekcrewz@gmail.com">
              <strong>info.tekcrewz@gmail.com</strong>
            </StyledLink>
          </LinksSection>

          <BottomWrapper style={{ padding: "20px 0" }}>
            <StyleP className="whiteColor font13">
              © {getCurrentYear()} - <span className="purpleColor font13">TekCrewz</span> All Rights Reserved
            </StyleP>
            <Link className="whiteColor animate pointer font13" to="home" smooth={true} offset={-80}>
              Back to top
            </Link>
          </BottomWrapper>
        </div>
      </div>

      {/* NEW: Fixed-position WhatsApp Icon */}
      <FixedWhatsapp href="https://wa.me/+919655466339" target="_blank">
        <FaWhatsapp size={38} />
      </FixedWhatsapp>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
  position: relative;
`;
const InnerWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 0 10px;
  }
`;
const LogoSection = styled.div`
  display: flex;
  align-items: center;
`;
const LinksSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  margin: 20px;
  @media (max-width: 768px) {
    // margin: 10px 0;
    padding: 10px;
    // gap: 10px;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
  }
`;
const StyledLink = styled.a`
  color: #fff;
  text-decoration: none;
  font-size: 15px;
  &:hover {
    color: #ff9900;
  }
`;
const SocialSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 20px;
  @media (max-width: 768px) {
    margin: 20px 0;
    align-items: center;
    justify-content: center;
    flex-direction: row;
  }
`;
const SocialIcon = styled.a`
  color: #fff;
  font-size: 20px;
  &:hover {
    color: #ff9900;
  }
`;
const NewsletterSection = styled.div`
  text-align: center;
  margin: 40px 0;
`;
const NewsletterTitle = styled.h2`
  margin-bottom: 15px;
  font-size: 18px;
`;
const NewsletterForm = styled.form`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
`;
const NewsletterInput = styled.input`
  padding: 10px;
  border: none;
  border-radius: 3px;
  font-size: 14px;
`;
const NewsletterButton = styled.button`
  padding: 10px 20px;
  background-color: #ff9900;
  color: #fff;
  border: none;
  border-radius: 3px;
  font-size: 14px;
  cursor: pointer;
  &:hover {
    background-color: #e68a00;
  }
`;
const BottomWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #444;
  padding-top: 20px;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;
const StyleP = styled.p`
  margin: 0;
`;

// NEW: Fixed-position WhatsApp Icon styled component
const FixedWhatsapp = styled.a`
  position: fixed;
  bottom: 50px;
  right: 35px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(
    45deg,
    rgba(53, 173, 97, 0.1),
    #22c55e,
    #00d757,
    rgb(0, 255, 42)
  );
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  cursor: pointer;
  z-index: 1000;
  animation: pulse 1.5s infinite;

  &:hover {
    color: #0a1014;
  }

  @media (max-width: 860px) {
    bottom: 28px;
    right: 28px;
    width: 55px;
    height: 55px;

    /* Adjust the icon size inside the container */
    svg {
      font-size: 24px;
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0.8;
    }
  }
`;

