import { useWindowDimensions } from 'react-native';

/**
 * Breakpoints for responsive design
 */
const BREAKPOINTS = {
  PHONE: 0,
  TABLET: 700,
  LARGE_TABLET: 1024,
};

/**
 * Hook for responsive design that detects screen size and orientation
 * @returns Object with responsive properties and utilities
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isPhone = width < BREAKPOINTS.TABLET;
  const isTablet = width >= BREAKPOINTS.TABLET && width < BREAKPOINTS.LARGE_TABLET;
  const isLargeTablet = width >= BREAKPOINTS.LARGE_TABLET;
  const isLandscape = width > height;
  const isPortrait = !isLandscape;

  // Determine number of columns for grid layouts
  const getColumns = (defaultPhone = 1, defaultTablet = 2, defaultLarge = 3) => {
    if (isLargeTablet) return defaultLarge;
    if (isTablet) return defaultTablet;
    return defaultPhone;
  };

  // Get responsive spacing
  const getSpacing = (phoneSize: number, tabletSize: number = phoneSize * 1.5) => {
    return isPhone ? phoneSize : tabletSize;
  };

  // Get responsive font size
  const getFontSize = (phoneSize: number, tabletSize: number = phoneSize * 1.2) => {
    return isPhone ? phoneSize : tabletSize;
  };

  // Get responsive dimension (for things like avatar size, button size, etc.)
  const getDimension = (phoneSize: number, tabletSize: number = phoneSize * 1.5) => {
    return isPhone ? phoneSize : tabletSize;
  };

  // Check if we should use side navigation instead of bottom tabs
  const useSideNavigation = isTablet || isLargeTablet;

  // Get modal width for centered modals on tablets
  const getModalWidth = () => {
    if (isLargeTablet) return Math.min(600, width * 0.6);
    if (isTablet) return Math.min(500, width * 0.7);
    return width * 0.9;
  };

  return {
    // Screen type
    isPhone,
    isTablet,
    isLargeTablet,
    isAnyTablet: isTablet || isLargeTablet,

    // Orientation
    isLandscape,
    isPortrait,

    // Dimensions
    width,
    height,

    // Utilities
    getColumns,
    getSpacing,
    getFontSize,
    getDimension,
    useSideNavigation,
    getModalWidth,

    // Breakpoints
    breakpoints: BREAKPOINTS,
  };
};

/**
 * Get responsive style value based on screen size
 */
export const responsive = {
  spacing: (phoneValue: number, tabletValue?: number) => {
    const { width } = useWindowDimensions();
    const isTablet = width >= BREAKPOINTS.TABLET;
    return isTablet ? (tabletValue ?? phoneValue * 1.5) : phoneValue;
  },

  fontSize: (phoneValue: number, tabletValue?: number) => {
    const { width } = useWindowDimensions();
    const isTablet = width >= BREAKPOINTS.TABLET;
    return isTablet ? (tabletValue ?? phoneValue * 1.2) : phoneValue;
  },
};
