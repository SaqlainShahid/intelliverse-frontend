// src/styles/theme.js

export const themes = {
  admin: {
    primary: 'rose-600',
    primaryLight: 'rose-50',
    primaryDark: 'rose-700',
    primaryRgb: '225, 29, 72',
    accent: 'rose-500',
    accentLight: 'rose-100',
    bg: 'white',
    bgLight: 'rose-50/50',
    text: 'gray-900',
    textMuted: 'gray-500',
    gradient: 'from-rose-600 via-red-600 to-rose-700',
    gradientSoft: 'from-rose-600/15 via-red-500/10 to-rose-700/15',
    border: 'rose-100',
    ring: 'focus:ring-rose-500/20',
    shadow: 'rgba(225, 29, 72, 0.20)',
    button: 'bg-rose-600 hover:bg-rose-500 text-white',
    buttonGhost: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
    scrollbar: 'scrollbar-thumb-rose-200',
    glass: {
      bg: 'bg-white/60',
      blur: 'backdrop-blur-[40px]',
      border: 'border-rose-100/60',
      shadow: 'shadow-[0_8px_32px_0_rgba(225,29,72,0.08)]'
    }
  },
  faculty: {
    primary: 'iv-indigo',
    primaryLight: 'indigo-50',
    primaryDark: 'indigo-700',
    primaryRgb: '79, 70, 229', // indigo-600
    accent: 'blue-500',
    accentLight: 'blue-100',
    bg: 'white',
    bgLight: 'blue-50/50',
    text: 'gray-900',
    textMuted: 'gray-500',
    gradient: 'from-blue-600 via-iv-indigo to-indigo-700',
    gradientSoft: 'from-blue-600/20 via-indigo-500/20 to-blue-700/20',
    border: 'blue-100',
    ring: 'focus:ring-blue-500/20',
    shadow: 'rgba(59, 130, 246, 0.15)',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonGhost: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    scrollbar: 'scrollbar-thumb-blue-200',
    glass: {
      bg: 'bg-white/40',
      blur: 'backdrop-blur-[40px]',
      border: 'border-white/40',
      shadow: 'shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]'
    }
  },
  student: {
    primary: 'iv-indigo',
    primaryLight: 'indigo-50',
    primaryDark: 'indigo-700',
    primaryRgb: '79, 70, 229', // indigo-600
    accent: 'indigo-500',
    accentLight: 'indigo-100',
    bg: 'white',
    bgLight: 'indigo-50/50',
    text: 'gray-900',
    textMuted: 'gray-500',
    gradient: 'from-iv-text via-iv-indigo to-iv-text',
    gradientSoft: 'from-iv-indigo/20 via-blue-500/20 to-iv-indigo/20',
    border: 'indigo-100',
    ring: 'focus:ring-indigo-500/20',
    shadow: 'rgba(79, 70, 229, 0.15)',
    button: 'bg-iv-indigo hover:bg-indigo-700 text-white',
    buttonGhost: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
    scrollbar: 'scrollbar-thumb-indigo-200',
    glass: {
      bg: 'bg-white/40',
      blur: 'backdrop-blur-[40px]',
      border: 'border-white/40',
      shadow: 'shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]'
    }
  }
};

export const getTheme = (role) => {
  if (role === 'admin') return themes.admin;
  if (role === 'faculty') return themes.faculty;
  return themes.student;
};
