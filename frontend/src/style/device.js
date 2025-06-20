// src/styles/breakpoints.js

// Base breakpoint widths
const sizes = {
  mobile: '600px',    // up to 600px
  tablet: '1024px',   // 601px to 1024px
  desktop: '1440px',  // 1025px to 1440px
  large: '1920px'     // 1441px to 1920px
  // Ultra-wide / 4K: >1920px (no specific upper limit)
};

export const device = {
  mobile: `(max-width: ${sizes.mobile})`,
  tablet: `(max-width: ${sizes.tablet})`,
  // For ranges, you can combine min and max:
  tabletOnly: `(min-width: ${parseInt(sizes.mobile,10) + 1}px) and (max-width: ${sizes.tablet})`,
  desktop: `(max-width: ${sizes.desktop})`,
  desktopOnly: `(min-width: ${parseInt(sizes.tablet,10) + 1}px) and (max-width: ${sizes.desktop})`,
  large: `(max-width: ${sizes.large})`,
  largeOnly: `(min-width: ${parseInt(sizes.desktop,10) + 1}px) and (max-width: ${sizes.large})`,
  ultra: `(min-width: ${parseInt(sizes.large,10) + 1}px)`
};
