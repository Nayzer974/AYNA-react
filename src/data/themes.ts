export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundSecondary: string;
    text: string;
    textSecondary: string;
  };
}

export const themes: Record<string, Theme> = {
  default: {
    id: 'default',
    name: 'Nuit Mystique',
    colors: {
      primary: '#FFD369',
      secondary: '#5A2D82',
      accent: '#FFA500',
      background: '#0A0F2C',
      backgroundSecondary: '#1E1E2F',
      text: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.8)'
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Océan Serein',
    colors: {
      primary: '#4ECDC4',
      secondary: '#1A535C',
      accent: '#FF6B6B',
      background: '#0B1F2E',
      backgroundSecondary: '#1A3A4A',
      text: '#F7FFF7',
      textSecondary: 'rgba(247, 255, 247, 0.8)'
    }
  },
  sunset: {
    id: 'sunset',
    name: 'Coucher de Soleil',
    colors: {
      primary: '#FF6B9D',
      secondary: '#C44569',
      accent: '#FFA07A',
      background: '#2C0735',
      backgroundSecondary: '#3D1F4A',
      text: '#FFF5E1',
      textSecondary: 'rgba(255, 245, 225, 0.8)'
    }
  },
  forest: {
    id: 'forest',
    name: 'Forêt Émeraude',
    colors: {
      primary: '#95E1D3',
      secondary: '#38Ada9',
      accent: '#F8B500',
      background: '#1B3A2F',
      backgroundSecondary: '#2D5244',
      text: '#EAFAF1',
      textSecondary: 'rgba(234, 250, 241, 0.8)'
    }
  },
  royal: {
    id: 'royal',
    name: 'Royal Doré',
    colors: {
      primary: '#F4C430',
      secondary: '#4A148C',
      accent: '#FF6F00',
      background: '#1A0033',
      backgroundSecondary: '#2D1B4E',
      text: '#FFF8DC',
      textSecondary: 'rgba(255, 248, 220, 0.8)'
    }
  },
};

export function getTheme(themeId: string): Theme {
  return themes[themeId] || themes.default;
}

