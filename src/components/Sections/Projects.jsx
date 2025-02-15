import React from "react";
import styled from "styled-components";
// Components
import ProjectBox from "../Elements/ProjectBox";
import FullButton from "../Buttons/FullButton";
import { motion } from "framer-motion";
// Assets
import ProjectImg1 from "../../assets/img/projects/1.webp";
import ProjectImg2 from "../../assets/img/projects/2.webp";
import ProjectImg3 from "../../assets/img/projects/3.webp";
import ProjectImg4 from "../../assets/img/projects/4.webp";
import ProjectImg5 from "../../assets/img/projects/5.webp";
import ProjectImg6 from "../../assets/img/projects/6.webp";
import AddImage2 from "../../assets/img/add/add2.jpg";

export default function Projects() {
  return (
    <Wrapper id="projects">
      <div className="whiteBg">
        <div className="container">
          <HeaderInfo>
            <h1 className="font40 extraBold">Courses listing</h1>
            <p className="font13">
            "Unlock your potential with expert-led courses, designed to elevate your skills and career.
              <br />
              Learn, grow, and achieve success in the ever-evolving world of technology and innovation."
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
                action={() => alert("clicked")}
              />
            </div>
            <div className="col-xs-12 col-sm-4 col-md-4 col-lg-4">
              <ProjectBox
                img={ProjectImg2}
                title="Digital Marketing"
                text="Explore SEO, social media, and content strategies to enhance online presence, drive engagement, and grow business visibility effectively."
                action={() => alert("clicked")}
              />
            </div>
            <div className="col-xs-12 col-sm-4 col-md-4 col-lg-4">
              <ProjectBox
                img={ProjectImg3}
                title="PHP"
                text="Learn to build scalable web applications using PHP, handling databases, security, and backend development with best coding practices."
                action={() => alert("clicked")}
              />
            </div>
          </motion.div>
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
                text="Analyze business trends, interpret data, and optimize processes to drive strategic decision-making and organizational success."
                action={() => alert("clicked")}
              />
            </div>
            <div className="col-xs-12 col-sm-4 col-md-4 col-lg-4">
              <ProjectBox
                img={ProjectImg5}
                title="Graphic Designing"
                text="Create visually compelling designs, master typography, and enhance branding with creative tools for impactful digital experiences."
                action={() => alert("clicked")}
              />
            </div>
            <div className="col-xs-12 col-sm-4 col-md-4 col-lg-4">
              <ProjectBox
                img={ProjectImg6}
                title="Python"
                text="Develop efficient applications, automate tasks, and explore data science concepts using Python’s powerful and versatile ecosystem."
                action={() => alert("clicked")}
              />
            </div>
          </motion.div>
          <div className="row flexCenter">
            <div style={{ margin: "50px 0", width: "200px" }}>
              <FullButton title="Load More" action={() => alert("clicked")} />
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
                  <FullButton title="Get Started" action={() => alert("clicked")} />
                </div>
                <div style={{ width: "190px", marginLeft: "15px" }}>
                  <FullButton title="Contact Us" action={() => alert("clicked")} border />
                </div>
              </ButtonsRow>
            </AddRight>
          </Advertising>
        </div>
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.section`
  width: 100%;
`;
const HeaderInfo = styled.div`
    text-align: center;
  @media (max-width: 860px) {
    text-align: center;
  }
`;
const Advertising = styled.div`
  padding: 100px 0;
  margin: 100px 0;
  position: relative;
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
