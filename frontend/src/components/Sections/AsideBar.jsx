// src/components/Sidebar.jsx
import React from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaUserPlus,
  FaList,
  FaChartBar,
  FaUsers,
} from 'react-icons/fa';

const Asidebar = () => (
  <Nav>
    
    <Menu>
      <MenuItem>
        <StyledLink to="/AdminDashboard">
          <FaTachometerAlt /> Dashboard
        </StyledLink>
      </MenuItem>
      <MenuItem>
        <StyledLink to="/add-candidate">
          <FaUserPlus /> Add Candidate
        </StyledLink>
      </MenuItem>
      <MenuItem>
        <StyledLink to="/candidateList">
          <FaList /> Candidate List
        </StyledLink>
      </MenuItem>
      <MenuItem>
        <StyledLink to="/admin-report">
          <FaChartBar /> Quiz Report
        </StyledLink>
      </MenuItem>
      {/* add more items here */}
    </Menu>
  </Nav>
);

export default Asidebar;

const Nav = styled.nav`
  width: 250px;
  background: #2f3e4e;
  min-height: 100vh;
  padding: 2rem 1rem;
  position: fixed;
  top: 0;
  left: 0;
`;
const Logo = styled.h1`
  color: #fff;
  font-size: 1.75rem;
  margin-bottom: 2rem;
  text-align: center;
`;
const Menu = styled.ul`
  list-style: none;
  padding: 0;
`;
const MenuItem = styled.li`
  margin: 1rem 0;
`;
const StyledLink = styled(NavLink)`
  display: flex;
  align-items: center;
  color: #bdc3c7;
  font-size: 1rem;
  text-decoration: none;
  transition: color 0.2s;

  &.active, &:hover {
    color: #ecf0f1;
  }

  svg {
    margin-right: 0.75rem;
  }
`;
