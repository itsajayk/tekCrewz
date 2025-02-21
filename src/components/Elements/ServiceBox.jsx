import React from "react";
import styled from "styled-components";
// Assets
import RollerIcon from "../../assets/svg/Services/marketing.png";
import MonitorIcon from "../../assets/svg/Services/automation.png";
import BrowserIcon from "../../assets/svg/Services/global.png";
import GraphIcon from "../../assets/svg/Services/graph.png";

export default function ServiceBox({icon, title, subtitle}) {
  let getIcon;

  switch (icon) {
    case "roller":
      getIcon = <img src={RollerIcon} alt="Monitor Icon" width="60" height="60" />;
      break;
    case "monitor":
      getIcon = <img src={MonitorIcon} alt="Monitor Icon" width="60" height="60" />;
      break;
    case "browser":
      getIcon = <img src={BrowserIcon} alt="Browser Icon" width="60" height="60" />;
      break;
    case "graph": // Ensure it's lowercase
      getIcon = <img src={GraphIcon} alt="Graph Icon" width="60" height="60" />;
      break;
      
    default:
      getIcon = <img src={RollerIcon} alt="Monitor Icon" width="60" height="60" />;
      break;
  }
  console.log("Graph Icon Path:", GraphIcon);


  return (
    <Wrapper className="flex flexColumn">
      <IconStyle>{getIcon}</IconStyle>
      <TitleStyle className="font22 extraBold">{title}</TitleStyle>
      <SubtitleStyle className="font14">{subtitle}</SubtitleStyle>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 200px; /* Set a fixed width */
  height: 350px; /* Set a fixed height */
  padding: 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  background: white;
  overflow: hidden;
  text-align: center;
  font-family: cursive;
  box-shadow: linear-gradient(90deg, #5ddcff, #3c67e3, #4e00c2);
  cursor: pointer;


  /* Keyframes for stronger glowing effect */
  @keyframes borderAnimation {
    0% {
      background-position: 0% 50%;
      filter: brightness(1.2);
    }
    50% {
      background-position: 100% 50%;
      filter: brightness(2);
    }
    100% {
      background-position: 0% 50%;
      filter: brightness(1.2);
    }
  }

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    padding: 4px; 
    border-radius: 12px;
    background: linear-gradient(90deg, #5ddcff, #3c67e3, #4e00c2);
    background-size: 300% 300%;
    animation: borderAnimation 2s ease-in-out infinite;

    -webkit-mask: 
      linear-gradient(white 0 0) content-box, 
      linear-gradient(white 0 0);
    mask: 
      linear-gradient(white 0 0) content-box, 
      linear-gradient(white 0 0);
    mask-composite: exclude;
    -webkit-mask-composite: destination-out;
  }
`;



const IconStyle = styled.div`
  @media (max-width: 860px) {
    margin: 0 auto;
  }
`;
const TitleStyle = styled.h2`
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  padding: 40px 0;
  text-transform: uppercase;
  @media (max-width: 860px) {
    padding: 20px 0;
  }
`;
const SubtitleStyle = styled.p`
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
  text-transform: uppercase;

`;