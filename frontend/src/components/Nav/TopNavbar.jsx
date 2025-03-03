import React, { useEffect, useState } from "react";
import styled from "styled-components";
import NavbarLink from "./NavbarLink"; // import the helper
import { Link as RouterLink } from "react-router-dom";
// Components
import Sidebar from "../Nav/Sidebar";
import Backdrop from "../Elements/Backdrop";
// Assets
import LogoIcon from "../../assets/svg/Logo";
import BurgerIcon from "../../assets/svg/BurgerIcon";

export default function TopNavbar() {
  const [y, setY] = useState(window.scrollY);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />
      {sidebarOpen && <Backdrop />}
      <Wrapper
        className="flexCenter animate whiteBg"
        style={y > 100 ? { height: "60px" } : { height: "80px" }}
      >
        <NavInner className="container flexSpaceCenter">
          <NavbarLink 
            to="home" 
            offset={0} 
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            <LogoIcon />
            <h1 style={{ marginLeft: "15px" }} className="font20 extraBold">
              TEKCREWZ
            </h1>
          </NavbarLink>
          <BurderWrapper className="pointer" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <BurgerIcon />
          </BurderWrapper>
          <UlWrapper className="flexNullCenter">
            <li className="font18 pointer">
              <NavbarLink to="home" offset={-80} style={{ padding: "10px 15px" }}>
                HOME
              </NavbarLink>
            </li>
            <li className="font18 pointer">
              <NavbarLink to="services" offset={-80} style={{ padding: "10px 15px" }}>
                SERVICES
              </NavbarLink>
            </li>
            <li className="font18 pointer">
              <NavbarLink to="projects" offset={-80} style={{ padding: "10px 15px" }}>
                COURSES
              </NavbarLink>
            </li>
            <li className="font18 pointer">
              <NavbarLink to="blog" offset={-80} style={{ padding: "10px 15px" }}>
                TESTIMONIALS
              </NavbarLink>
            </li>
            {/* <li className="semiBold font15 pointer">
              <NavbarLink 
                activeClass="active" 
                style={{ padding: "10px 15px" }} 
                to="pricing" 
                spy={true} 
                smooth={true} 
                offset={-80}
              >
                Pricing
              </NavbarLink>
            </li> */}
            <li className="font18 pointer">
              <NavbarLink to="contact" offset={-80} style={{ padding: "10px 15px" }}>
                CONTACT
              </NavbarLink>
            </li>
          </UlWrapper>
          <UlWrapperRight className="flexNullCenter">
            {/* <li className="semiBold font18 pointer">
              <a href="/" style={{ padding: "10px 30px 10px 0" }}>
                Log in
              </a>
            </li> */}
            <li className="font15 pointer flexCenter">
              <a href="/" className="radius9 lightBg" style={{ padding: "10px 15px" }}>
                LOG IN
              </a>
            </li>
          </UlWrapperRight>
        </NavInner>
      </Wrapper>
    </>
  );
}

const Wrapper = styled.nav`
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
`;
const NavInner = styled.div`
  position: relative;
  height: 100%;
`;
const BurderWrapper = styled.button`
  outline: none;
  border: 0px;
  background-color: transparent;
  height: 100%;
  padding: 0 15px;
  display: none;
  @media (max-width: 760px) {
    display: block;
  }
`;
const UlWrapper = styled.ul`
  display: flex;
  @media (max-width: 760px) {
    display: none;
  }
`;
const UlWrapperRight = styled.ul`
  @media (max-width: 760px) {
    display: none;
  }
`;
