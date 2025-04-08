import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useLocation, Link as RouterLink, useNavigate } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";
// Assets
import CloseIcon from "../../assets/svg/CloseIcon";
import LogoIcon from "../../assets/svg/Logo";
// Firebase Auth
import { auth } from ".././Pages/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Sidebar({ sidebarOpen, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

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

  const handleNavigation = (to) => {
    toggleSidebar();
    if (location.pathname === "/") {
      ScrollLink.scroller.scrollTo(to, { smooth: true, offset: -60, duration: 500 });
    }
  };

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
          <RouterLink to="/" onClick={toggleSidebar} className="whiteColor" style={{ padding: "10px 15px" }}>
            Home
          </RouterLink>
        </li>
        <li className="semiBold font15 pointer">
          {location.pathname === "/" ? (
            <ScrollLink
              onClick={toggleSidebar}
              to="services"
              smooth={true}
              offset={-60}
              duration={500}
              className="whiteColor"
              style={{ padding: "10px 15px" }}
            >
              Services
            </ScrollLink>
          ) : (
            <RouterLink
              to="/"
              state={{ scrollTo: "services" }}
              onClick={toggleSidebar}
              className="whiteColor"
              style={{ padding: "10px 15px" }}
            >
              Services
            </RouterLink>
          )}
        </li>
        <li className="semiBold font15 pointer">
          {location.pathname === "/" ? (
            <ScrollLink
              onClick={toggleSidebar}
              to="projects"
              smooth={true}
              offset={-60}
              duration={500}
              className="whiteColor"
              style={{ padding: "10px 15px" }}
            >
              Courses
            </ScrollLink>
          ) : (
            <RouterLink
              to="/"
              state={{ scrollTo: "projects" }}
              onClick={toggleSidebar}
              className="whiteColor"
              style={{ padding: "10px 15px" }}
            >
              Courses
            </RouterLink>
          )}
        </li>
        <li className="semiBold font15 pointer">
          {location.pathname === "/" ? (
            <ScrollLink
              onClick={toggleSidebar}
              to="blog"
              smooth={true}
              offset={-60}
              duration={500}
              className="whiteColor"
              style={{ padding: "10px 15px" }}
            >
              Testimonials
            </ScrollLink>
          ) : (
            <RouterLink
              to="/"
              state={{ scrollTo: "blog" }}
              onClick={toggleSidebar}
              className="whiteColor"
              style={{ padding: "10px 15px" }}
            >
              Testimonials
            </RouterLink>
          )}
        </li>
        <li className="semiBold font15 pointer">
          {location.pathname === "/" ? (
            <ScrollLink
              onClick={toggleSidebar}
              to="contact"
              smooth={true}
              offset={-60}
              duration={500}
              className="whiteColor"
              style={{ padding: "10px 15px" }}
            >
              Contact
            </ScrollLink>
          ) : (
            <RouterLink
              to="/"
              state={{ scrollTo: "contact" }}
              onClick={toggleSidebar}
              className="whiteColor"
              style={{ padding: "10px 15px" }}
            >
              Contact
            </RouterLink>
          )}
        </li>
      </UlStyle>
      <UlStyle>
        <li className="semiBold font15 pointer flexCenter">
          {currentUser ? (
            <RouterLink
              className="radius8 lightBg"
              style={{ padding: "10px 15px", cursor: "pointer" }}
              onClick={() => {
                toggleSidebar();
                handleLogout();
              }}
            >
              Log Out
            </RouterLink>
          ) : (
            <RouterLink
              className="radius8 lightBg"
              style={{ padding: "10px 15px", cursor: "pointer" }}
              onClick={() => {
                toggleSidebar();
                setTimeout(() => navigate('/s-loginPage'), 300);
              }}
            >
              Log In
            </RouterLink>
          )}
        </li>
      </UlStyle>
    </Wrapper>
  );
}

const Wrapper = styled.nav`
  height: 100vh;
  position: fixed;
  top: 0;
  right: ${({ sidebarOpen }) => (sidebarOpen ? "0px" : "-430px")};
  padding: 0 20px;
  z-index: 9999;
  transition: right 1.3s ease-in-out;

  @media (max-width: 760px) {
    right: ${({ sidebarOpen }) => (sidebarOpen ? "0px" : "-430px")};
  }
`;

const SidebarHeader = styled.div`
  padding: 20px 0;
`;

const CloseBtn = styled.button`
  border: 0;
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
