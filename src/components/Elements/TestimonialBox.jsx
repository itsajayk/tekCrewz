import React from "react";
import styled from "styled-components";
// Assets
import QuoteIcon from "../../assets/svg/Quotes";

export default function TestimonialBox({ text, author }) {
  return (
    <Wrapper className="darkBg radius8 flexColumn">
      <QuoteWrapper>
        <QuoteIcon />
      </QuoteWrapper>
      <Text>{text}</Text>
      <Author><em>{author}</em></Author>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
  min-height: 310px;  /* Ensures equal height */
  height: 100%;
  padding: 20px 30px;
  margin-top: 30px;
  text-align: justify;
  display: flex;
  flex-direction: column;
  justify-content: space-between;  /* Aligns items */
  align-items: center;
  overflow: hidden; /* Prevents overflow issues */
`;

const QuoteWrapper = styled.div`
  position: relative;
  top: -20px;
`;

const Text = styled.p`
  color: white;
  font-size: 13px;
  flex-grow: 1;  /* Allows content to fill space equally */
  word-wrap: break-word; /* Prevents long words from breaking layout */
  padding-bottom: 10px;
  text-transform: uppercase;
`;

const Author = styled.p`
  color: orange;
  font-size: 13px;
  align-self: flex-end;
`;

