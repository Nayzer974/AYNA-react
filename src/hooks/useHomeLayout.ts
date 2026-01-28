import { useMemo, useCallback } from 'react';
import { useDimensions } from '@/hooks/useDimensions';

interface HomeLayout {
    buttonSize: number;
    containerSize: number;
    radius: number;
    getPosition: (angleDeg: number) => { x: number; y: number; xPx: number; yPx: number; radiusPx: number };
}

/**
 * Hook to manage the circular layout logic of the Home screen.
 * Calculates responsive sizes and positions for the orbital menu.
 */
export function useHomeLayout(): HomeLayout {
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useDimensions();

    // Calculate responsive sizes based on screen dimensions
    const { buttonSize, containerSize, radius } = useMemo(() => {
        // Calculer l'espace disponible en tenant compte de tous les éléments
        // SafeArea top: ~44px, Logo: ~80px, Salutation: ~60px, Carte: ~200px, Marges: ~40px
        // Navbar bottom: ~60-80px (pour éviter que l'icône Salat passe en dessous)
        const reservedSpace = 424 + 80; // Ajouter l'espace pour la navbar
        const availableHeight = SCREEN_HEIGHT - reservedSpace;

        // Taille des boutons adaptative selon l'espace disponible
        let newButtonSize = 64;
        if (availableHeight > 400) {
            newButtonSize = 72;
        } else if (availableHeight > 320) {
            newButtonSize = 64;
        } else if (availableHeight > 250) {
            newButtonSize = 56;
        } else {
            newButtonSize = 48;
        }

        // Taille du conteneur adaptée à l'espace disponible
        const maxContainerByHeight = availableHeight * 0.95;
        const maxContainerByWidth = SCREEN_WIDTH * 0.9;
        const maxContainerSize = Math.min(maxContainerByHeight, maxContainerByWidth);
        const minContainerSize = 220;
        const calculatedContainerSize = Math.max(minContainerSize, Math.min(maxContainerSize, 380));

        // Rayon pour les boutons périphériques
        // Réduire légèrement le rayon pour garantir que l'icône Salat reste au-dessus de la navbar
        const calculatedRadius = (calculatedContainerSize / 2) - (newButtonSize / 2) - 8; // Augmenter la marge de 4 à 8

        return {
            buttonSize: newButtonSize,
            containerSize: calculatedContainerSize,
            radius: Math.max(70, calculatedRadius) // Réduire le minimum de 80 à 70 pour plus de flexibilité
        };
    }, [SCREEN_WIDTH, SCREEN_HEIGHT]);

    // Fonction pour calculer la position depuis l'angle (en pixels) - mémorisée
    const getPosition = useCallback((angleDeg: number) => {
        // Convertir angle en radians : 0° = haut, donc soustraire 90° pour aligner avec math standard
        const angleRad = ((angleDeg - 90) * Math.PI) / 180;

        // Centre du conteneur en pixels - exactement au centre
        const centerX = containerSize / 2;
        const centerY = containerSize / 2;

        // Rayon de base en pixels - utilisé pour Bayt An Nûr (0°), Nur & Shifa (120°), Salât (180°), Da'Irat (240°)
        // Ce rayon garantit EXACTEMENT la même distance du centre pour toutes ces icônes
        let radiusPx = radius;

        // Augmenter le rayon pour Sabila'Nûr (300°) et Umm'Ayna (60°) pour les rapprocher des côtés
        if (angleDeg === 300 || angleDeg === 60) {
            radiusPx = radius * 1.35;
            // Limiter pour éviter de sortir du conteneur
            radiusPx = Math.min(radiusPx, (containerSize / 2) * 0.9);
        }

        // Calculer la position en pixels depuis le centre avec le rayon uniforme
        // Pour Bayt An Nûr (0°) et Salât (180°), le rayon est identique, donc la distance est identique
        let xPx = centerX + (radiusPx * Math.cos(angleRad));
        let yPx = centerY + (radiusPx * Math.sin(angleRad));

        // Pour Salât (180°), remonter légèrement l'icône pour qu'elle reste au-dessus de la navbar
        // Au lieu de la baisser, on la remonte pour garantir qu'elle reste visible
        if (angleDeg === 180) {
            const offsetY = radiusPx * -0.15; // 15% du rayon vers le haut (négatif = vers le haut)
            yPx = yPx + offsetY;
        }

        // Convertir en pourcentage pour le positionnement absolu
        const x = (xPx / containerSize) * 100;
        const y = (yPx / containerSize) * 100;

        // Clamp les valeurs pour garantir qu'elles restent dans [0, 100]
        return {
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
            // Retourner aussi les valeurs en pixels pour vérification
            xPx,
            yPx,
            radiusPx
        };
    }, [containerSize, radius]);

    return {
        buttonSize,
        containerSize,
        radius,
        getPosition
    };
}
