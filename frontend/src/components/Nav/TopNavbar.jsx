import React, { useEffect, useState } from "react";
import styled from "styled-components";
import NavbarLink from "./NavbarLink"; // import the helper
import { useNavigate } from "react-router-dom";
import Sidebar from "../Nav/Sidebar";
import Backdrop from "../Elements/Backdrop";
// Assets
import LogoIcon from "../../assets/svg/Logo";
import BurgerIcon from "../../assets/svg/BurgerIcon";
// Firebase Auth
import { auth } from ".././Pages/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function TopNavbar() {
  const [y, setY] = useState(window.scrollY);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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
            <li className="font18 pointer">
              <NavbarLink to="contact" offset={-80} style={{ padding: "10px 15px" }}>
                CONTACT
              </NavbarLink>
            </li>
          </UlWrapper>
          <UlWrapperRight className="flexNullCenter">
            <li className="font15 pointer flexCenter">
              {currentUser ? (
                <a
                  className="radius9 lightBg"
                  style={{ padding: "10px 15px", cursor: "pointer" }}
                  onClick={handleLogout}
                >
                  LOG OUT
                </a>
              ) : (
                <a
                  className="radius9 lightBg"
                  style={{ padding: "10px 15px", cursor: "pointer" }}
                  onClick={() => navigate('/s-loginPage')}
                >
                  LOG IN
                </a>
              )}
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
  border: 0;
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
