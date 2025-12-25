// components/Bead.tsx
import React from 'react';
import Svg, { Circle, Defs, RadialGradient, Stop, Filter, FeDropShadow } from 'react-native-svg';

interface BeadProps {
  color?: string;
  size?: number;
  isActive?: boolean;
}

const Bead: React.FC<BeadProps> = ({ color = "#4A90E2", size = 50, isActive = false }) => {
  const gradientId = `grad-${color.replace('#', '')}`; // ID unique pour le dégradé

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        {/* Dégradé pour donner l'effet 3D sphérique */}
        <RadialGradient id={gradientId} cx="30%" cy="30%" r="70%">
          <Stop offset="0%" stopColor="#fff" stopOpacity="0.6" />
          <Stop offset="100%" stopColor={color} />
        </RadialGradient>
        
        {/* Ombre portée pour le réalisme */}
        <Filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <FeDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.3"/>
        </Filter>
      </Defs>

      {/* La perle principale */}
      <Circle 
        cx="50" 
        cy="50" 
        r="45" 
        fill={`url(#${gradientId})`} 
        filter="url(#shadow)"
      />

      {/* Contour doré si la perle est active */}
      {isActive && (
        <Circle
          cx="50"
          cy="50"
          r="47" // légèrement plus grand que la perle pour le contour
          fill="none"
          stroke="#FFD700" // Couleur or
          strokeWidth="3"
        />
      )}
    </Svg>
  );
};

export default React.memo(Bead);
