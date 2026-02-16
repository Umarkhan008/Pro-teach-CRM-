import React from 'react';
import Svg, { Path, LinearGradient, Stop, Defs, G, Text as SvgText } from 'react-native-svg';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// 3D Podium constants
const PODIUM_WIDTH_PCT = 0.3; // 30% of screen width per column
const COLUMN_WIDTH = width * PODIUM_WIDTH_PCT;

// Colors matching the yellow theme
const COLORS = {
    first: {
        frontStart: '#FFD700', // Gold
        frontEnd: '#FFC107',
        top: '#FFF59D',       // Lighter top
        side: '#FFA000',      // Darker side
    },
    second: {
        frontStart: '#FFEB3B',
        frontEnd: '#FBC02D',
        top: '#FFF9C4',
        side: '#F57F17',
    },
    third: {
        frontStart: '#FFCA28',
        frontEnd: '#FFB300',
        top: '#FFE082',
        side: '#FF6F00',
    }
};

const PodiumColumn3D = ({ rank, height }) => {
    // Dimensions
    const w = COLUMN_WIDTH;
    const h = height;
    const depth = 20; // 3D depth offset

    // Choose colors based on rank
    const colorSet = rank === 1 ? COLORS.first : (rank === 2 ? COLORS.second : COLORS.third);

    // SVG Paths for 3D Box look
    // Coordinates mapping:
    // tl (top-left), tr (top-right), bl (bottom-left), br (bottom-right)

    // Front Face (Trapezoid slightly usually, but let's do straight box for cleaner look + perspective top)
    // Actually user image has Trapezoid front. Let's do Trapezoid Front.

    const inset = 10; // how much it slants in

    // Front Face Points
    const f_tl = { x: inset, y: depth };
    const f_tr = { x: w - inset, y: depth };
    const f_bl = { x: 0, y: h };
    const f_br = { x: w, y: h };

    // Top Face Points (connecting to back)
    // We simulate top face simply by drawing a polygon above f_tl and f_tr
    const t_tl = { x: 0, y: 0 };
    const t_tr = { x: w, y: 0 };

    // Construct Paths
    const pathFront = `M ${f_tl.x} ${f_tl.y} L ${f_tr.x} ${f_tr.y} L ${f_br.x} ${f_br.y} L ${f_bl.x} ${f_bl.y} Z`;
    const pathTop = `M ${t_tl.x} ${t_tl.y} L ${t_tr.x} ${t_tr.y} L ${f_tr.x} ${f_tr.y} L ${f_tl.x} ${f_tl.y} Z`;

    // Side Face (Right side for 3D effect) - Optional, simpler is generally better for flat design
    // Let's stick to Front + Top for that clean "Paper 3D" look in the reference.

    return (
        <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            <Defs>
                <LinearGradient id={`grad_${rank}`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={colorSet.frontStart} stopOpacity="1" />
                    <Stop offset="1" stopColor={colorSet.frontEnd} stopOpacity="1" />
                </LinearGradient>
            </Defs>

            {/* Top Face (Lightest) */}
            <Path d={pathTop} fill={colorSet.top} />

            {/* Front Face (Gradient) */}
            <Path d={pathFront} fill={`url(#grad_${rank})`} />

            {/* Rank Number (Perspectived) */}
            <SvgText
                fill="#FFFFFF"
                stroke="none"
                fontSize="64"
                fontWeight="bold"
                x={w / 2}
                y={h / 2 + 20}
                textAnchor="middle"
                opacity="0.9"
            >
                {rank}
            </SvgText>
        </Svg>
    );
};

export default PodiumColumn3D;
