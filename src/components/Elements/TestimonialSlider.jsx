import React from "react";
import Slider from "react-slick";
import styled from "styled-components";
// Components
import TestimonialBox from "../Elements/TestimonialBox";

export default function TestimonialSlider() {
  const settings = {
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };
  return (
    <div>
      <Slider {...settings}>
        <LogoWrapper className="flexCenter">
          <TestimonialBox
            text="We partnered with TekCrewz to modernize our systems, and the results have been outstanding. 
            Their OFFICE AUTOMATION TOOL was excellent hub to manage all my works under one portal. 
            They transformed our challenges into opportunities, and their solutions have significantly improved my business. 
            We couldn’t be happier with the collaboration!"
            author="Sathish Kumar [Aruvi Water Plant]"
          />
        </LogoWrapper>
        <LogoWrapper className="flexCenter">
          <TestimonialBox
            text="TekCrewz has been a game-changer for my business. Their innovative LEAD GENERATION IDEA by Their expert team have streamlined our processes and boosted my business growth. 
            They’re not just a service provider; they’re a true partner in our growth. Highly recommend to all others for their Business Promotions!"
            author="R S GopiKrishna [Murugan E-Seva Centre]"
          />
        </LogoWrapper>
        <LogoWrapper className="flexCenter">
          <TestimonialBox
            text="Choosing TekCrewz was the best decision we made for our business. Their expertise, responsiveness, and innovative approach exceeded our expectations. 
            They delivered scalable solutions tailored perfectly to our needs, and their support throughout the project was exceptional. 
            A reliable partner we highly recommend to any business seeking IT excellence!"
            author=" Arumugam [Subha Traders]"
          />
        </LogoWrapper>
        <LogoWrapper className="flexCenter">
          <TestimonialBox
            text="Friends, such as we desire, are dreams and fables. Friendship demands the ability to do without it."
            author="Ralph Waldo Emerson"
          />
        </LogoWrapper>
        <LogoWrapper className="flexCenter">
          <TestimonialBox
            text="Friends, such as we desire, are dreams and fables. Friendship demands the ability to do without it."
            author="Ralph Waldo Emerson"
          />
        </LogoWrapper>
        <LogoWrapper className="flexCenter">
          <TestimonialBox
            text="Friends, such as we desire, are dreams and fables. Friendship demands the ability to do without it."
            author="Ralph Waldo Emerson"
          />
        </LogoWrapper>
      </Slider>
    </div>
  );
}

const LogoWrapper = styled.div`
  width: 90%;
  padding: 0 5%;
  cursor: pointer;
  :focus-visible {
    outline: none;
    border: 0px;
  }
`;
