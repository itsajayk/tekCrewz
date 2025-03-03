import React from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";

export default function NavbarLink({ to, children, offset, style }) {
    const location = useLocation();

    if (location.pathname === "/") {
        return (
        <ScrollLink to={to} smooth={true} offset={offset} duration={500} style={style}>
            {children}
        </ScrollLink>
        );
    }

    return (
        <RouterLink to="/" state={{ scrollTo: to }} style={style}>
        {children}
        </RouterLink>
    );
}
