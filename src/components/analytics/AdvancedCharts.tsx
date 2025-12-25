/**
 * Composants pour graphiques avancés (courbes, heatmaps)
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Rect, G, Text as SvgText, Line, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 200;
const PADDING = 20;

interface LineChartData {
  x: string;
  y: number;
  date: Date;
}

interface LineChartProps {
  data: LineChartData[];
  color?: string;
  label?: string;
}

/**
 * Graphique en courbe
 */
export function LineChart({ data, color = '#6366F1', label }: LineChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>Aucune donnée disponible</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.y), 1);
  const minValue = Math.min(...data.map(d => d.y), 0);
  const range = maxValue - minValue || 1;
  
  const chartWidth = CHART_WIDTH - PADDING * 2;
  const chartHeight = CHART_HEIGHT - PADDING * 2;
  const stepX = chartWidth / (data.length - 1 || 1);
  
  // Générer les points
  const points = data.map((item, index) => {
    const x = PADDING + index * stepX;
    const y = PADDING + chartHeight - ((item.y - minValue) / range) * chartHeight;
    return { x, y, value: item.y, label: item.x };
  });
  
  // Créer le chemin SVG
  let path = '';
  points.forEach((point, index) => {
    if (index === 0) {
      path += `M ${point.x} ${point.y}`;
    } else {
      // Utiliser une courbe de Bézier pour une ligne lisse
      const prevPoint = points[index - 1];
      const cp1x = prevPoint.x + (point.x - prevPoint.x) / 2;
      const cp1y = prevPoint.y;
      const cp2x = prevPoint.x + (point.x - prevPoint.x) / 2;
      const cp2y = point.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
    }
  });
  
  // Ligne de base
  const baselineY = PADDING + chartHeight;
  
  // Grille horizontale
  const gridLines = 5;
  const gridLinesArray = Array.from({ length: gridLines }, (_, i) => {
    const y = PADDING + (chartHeight / (gridLines - 1)) * i;
    const value = maxValue - (range / (gridLines - 1)) * i;
    return { y, value: Math.round(value) };
  });
  
  return (
    <View style={styles.chartContainer}>
      {label && (
        <Text style={styles.chartLabel}>{label}</Text>
      )}
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Grille */}
        <G>
          {gridLinesArray.map((grid, index) => (
            <Line
              key={index}
              x1={PADDING}
              y1={grid.y}
              x2={CHART_WIDTH - PADDING}
              y2={grid.y}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}
        </G>
        
        {/* Zone sous la courbe */}
        <Path
          d={`${path} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`}
          fill={color + '20'}
        />
        
        {/* Ligne de la courbe */}
        <Path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Points */}
        {points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={color}
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
        
        {/* Labels des axes */}
        <G>
          {points.map((point, index) => {
            if (index % Math.ceil(points.length / 5) === 0 || index === points.length - 1) {
              return (
                <SvgText
                  key={index}
                  x={point.x}
                  y={CHART_HEIGHT - 5}
                  fontSize="10"
                  fill="rgba(255, 255, 255, 0.6)"
                  textAnchor="middle"
                >
                  {point.label}
                </SvgText>
              );
            }
            return null;
          })}
        </G>
        
        {/* Valeurs sur l'axe Y */}
        <G>
          {gridLinesArray.map((grid, index) => (
            <SvgText
              key={index}
              x={PADDING - 5}
              y={grid.y + 4}
              fontSize="10"
              fill="rgba(255, 255, 255, 0.6)"
              textAnchor="end"
            >
              {grid.value}
            </SvgText>
          ))}
        </G>
      </Svg>
    </View>
  );
}

interface HeatmapData {
  date: Date;
  value: number;
}

interface HeatmapProps {
  data: HeatmapData[];
  startDate: Date;
  endDate: Date;
  color?: string;
}

/**
 * Heatmap (carte de chaleur) pour visualiser l'activité quotidienne
 */
export function Heatmap({ data, startDate, endDate, color = '#6366F1' }: HeatmapProps) {
  // Calculer le nombre de jours
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeks = Math.ceil(daysDiff / 7);
  
  // Créer un map des données par date
  const dataMap = new Map<string, number>();
  data.forEach(item => {
    const dateKey = item.date.toISOString().split('T')[0];
    dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + item.value);
  });
  
  // Trouver la valeur max pour la normalisation
  const maxValue = Math.max(...Array.from(dataMap.values()), 1);
  
  // Générer les carrés pour chaque jour
  const squares: Array<{ x: number; y: number; value: number; date: Date }> = [];
  const squareSize = 12;
  const gap = 3;
  
  for (let week = 0; week < weeks; week++) {
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + week * 7 + day);
      
      if (currentDate > endDate) break;
      
      const dateKey = currentDate.toISOString().split('T')[0];
      const value = dataMap.get(dateKey) || 0;
      const intensity = value / maxValue;
      
      squares.push({
        x: day * (squareSize + gap),
        y: week * (squareSize + gap),
        value,
        date: currentDate,
      });
    }
  }
  
  const heatmapWidth = 7 * (squareSize + gap) - gap;
  const heatmapHeight = weeks * (squareSize + gap) - gap;
  
  // Générer les couleurs en fonction de l'intensité
  const getColor = (intensity: number) => {
    if (intensity === 0) return 'rgba(255, 255, 255, 0.1)';
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const alpha = 0.2 + intensity * 0.8;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  return (
    <View style={styles.chartContainer}>
      <Svg width={heatmapWidth + PADDING * 2} height={heatmapHeight + PADDING * 2}>
        <G x={PADDING} y={PADDING}>
          {squares.map((square, index) => {
            const dateKey = square.date.toISOString().split('T')[0];
            const value = dataMap.get(dateKey) || 0;
            const intensity = value / maxValue;
            
            return (
              <Rect
                key={index}
                x={square.x}
                y={square.y}
                width={squareSize}
                height={squareSize}
                fill={getColor(intensity)}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
                rx="2"
              />
            );
          })}
        </G>
      </Svg>
      
      {/* Légende */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Moins</Text>
        <View style={styles.legendColors}>
          {[0, 0.25, 0.5, 0.75, 1].map((intensity, index) => (
            <View
              key={index}
              style={[
                styles.legendColor,
                { backgroundColor: getColor(intensity) },
              ]}
            />
          ))}
        </View>
        <Text style={styles.legendLabel}>Plus</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    marginVertical: 16,
  },
  chartLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#fff',
  },
  emptyChart: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  legendLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  legendColors: {
    flexDirection: 'row',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});




