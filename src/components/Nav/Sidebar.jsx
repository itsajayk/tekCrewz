import React from "react";
import styled from "styled-components";
import { Link } from "react-scroll";
// Assets
import CloseIcon from "../../assets/svg/CloseIcon";
import LogoIcon from "../../assets/svg/Logo";

export default function Sidebar({ sidebarOpen, toggleSidebar }) {
  return (
    <Wrapper className="animate darkBg" sidebarOpen={sidebarOpen}>
      <SidebarHeader className="flexSpaceCenter">
        <div className="flexNullCenter">
          <LogoIcon />
          <h1 className="whiteColor font20" style={{ marginLeft: "15px" }}>
            TekCrewz
          </h1>
        </div>
        <CloseBtn onClick={toggleSidebar} className="animate pointer">
        <CloseIcon />
        </CloseBtn>
      </SidebarHeader>

      <UlStyle className="flexNullCenter flexColumn">
        <li className="semiBold font15 pointer">
          <Link
            onClick={toggleSidebar}
            activeClass="active"
            className="whiteColor"
            style={{ padding: "10px 15px" }}
            to="home"
            spy={true}
            smooth={true}
            offset={-60}
          >
            Home
          </Link>
        </li>
        <li className="semiBold font15 pointer">
          <Link
            onClick={toggleSidebar}
            activeClass="active"
            className="whiteColor"
            style={{ padding: "10px 15px" }}
            to="services"
            spy={true}
            smooth={true}
            offset={-60}
          >
            Services
          </Link>
        </li>
        <li className="semiBold font15 pointer">
          <Link
            onClick={toggleSidebar}
            activeClass="active"
            className="whiteColor"
            style={{ padding: "10px 15px" }}
            to="projects"
            spy={true}
            smooth={true}
            offset={-60}
          >
            Courses
          </Link>
        </li>
        <li className="semiBold font15 pointer">
          <Link
            onClick={toggleSidebar}
            activeClass="active"
            className="whiteColor"
            style={{ padding: "10px 15px" }}
            to="blog"
            spy={true}
            smooth={true}
            offset={-60}
          >
            Testimonials
          </Link>
        </li>
        {/* <li className="semiBold font15 pointer">
          <Link
            onClick={toggleSidebar}
            activeClass="active"
            className="whiteColor"
            style={{ padding: "10px 15px" }}
            to="pricing"
            spy={true}
            smooth={true}
            offset={-60}
          >
            Pricing
          </Link>
        </li> */}
        <li className="semiBold font15 pointer">
          <Link
            onClick={toggleSidebar}
            activeClass="active"
            className="whiteColor"
            style={{ padding: "10px 15px" }}
            to="contact"
            spy={true}
            smooth={true}
            offset={-60}
          >
            Contact
          </Link>
        </li>
      </UlStyle>
      <UlStyle className="">
        {/* <li className="semiBold font15 pointer">
          <a href="/" style={{ padding: "10px 30px 10px 0" }} className="whiteColor">
            Log in
          </a>
        </li> */}
        <li className="semiBold font15 pointer flexCenter">
          <a href="/" className="radius8 lightBg" style={{ padding: "10px 15px" }}>
          Log in
          </a>
        </li>
      </UlStyle>
    </Wrapper>
  );
}

const Wrapper = styled.nav`
  // width: 400px;
  height: 100vh;
  position: fixed;
  top: 0;
  right: ${({ sidebarOpen }) => (sidebarOpen ? "0px" : "-430px")};
  padding: 0 20px;
  z-index: 9999;
  transition: right 1.3s ease-in-out;

  @media (max-width: 760px) {
    width: 100%;
    right: ${({ sidebarOpen }) => (sidebarOpen ? "0px" : "-430px")};
  }
`;

const SidebarHeader = styled.div`
  padding: 20px 0;
`;
const CloseBtn = styled.button`
  border: 0px;
  outline: none;
  background-color: transparent;
  padding: 10px;
`;
const UlStyle = styled.ul`
  padding: 40px;
  li {
    margin: 20px 0;
  }
`;
