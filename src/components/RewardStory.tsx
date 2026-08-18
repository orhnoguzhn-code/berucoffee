import React from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Rect, Polygon, G, Text as SvgText } from 'react-native-svg';
import type { SharedValue } from 'react-native-reanimated';

/**
 * "Kara Delik" — a golden-dressed character appears out of a round black
 * hole at the right edge of the reward ring. She slowly steps out, her
 * speech bubble pops above her head, she celebrates, then walks back into
 * the hole and it closes. Plays ONCE. (story: 0 -> 1, ~11s, no repeat)
 *
 * IMPORTANT: SVG elements are always STATIC. Motion is applied only to
 * Animated.View layers (Fabric-safe, no svg-prop animation).
 */

const RA = Animated;
const FILL = { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 } as const;

type StoryProps = { story: SharedValue<number>; message: string };

const clamp = Extrapolation.CLAMP;

/* 5-point star polygon centered at 0,0 with the given outer radius */
const star = (r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    return `${(rad * Math.cos(a)).toFixed(2)},${(rad * Math.sin(a)).toFixed(2)}`;
  }).join(' ');

/* ------------------------------------------------------------------ */
/*  Stage: 90x55 dp, viewBox "0 -8 164 100"                            */
/*  px = unit * 0.5488  /  (unit + 8) * 0.55                            */
/*  One-shot ~11s: hole opens -> she steps out -> bubble -> stars ->   */
/*  jump -> turns around -> walks back in -> hole closes.              */
/* ------------------------------------------------------------------ */
const RX = (u: number): number => {
  'worklet';
  return u * 0.5488;
};
const RY = (u: number): number => {
  'worklet';
  return (u + 8) * 0.55;
};

const HAIR = '#46301F';
const HAIR_HI = '#6B4E1B';
const SKIN = '#F2C9A0';
const SKIN_SH = '#E8B888';
const GOLD = '#C89B3C';
const GOLD_HI = '#E4B94C';
const GOLD_TEXT = '#F0C75E';
const DARK = '#2A1E14';

/* black hole centre on the stage (px): x 66, y 30.5 — her resting spot
   is at px 28.5, so she walks 37.5px out of the hole and back */
const HOLE_X = 66;
const HOLE_Y = 30.5;
const WALK = 38;

export function CoffeeStoryRight({ story, message }: StoryProps) {
  /* the black hole: appears with a pop, closes after she is inside */
  const holeStyle = useAnimatedStyle(() => ({
    ...FILL,
    opacity: interpolate(story.value, [0, 0.04, 0.9, 0.96], [0, 1, 1, 0], clamp),
    transform: [
      { translateX: HOLE_X },
      { translateY: HOLE_Y },
      { scale: interpolate(story.value, [0, 0.1, 0.9, 0.98], [0, 1, 1, 0], clamp) },
      { translateX: -HOLE_X },
      { translateY: -HOLE_Y },
    ],
  }));
  /* the character: hidden inside the hole, then slowly steps out to her
     spot, later walks back in and fades away */
  const wholeStyle = useAnimatedStyle(() => ({
    ...FILL,
    opacity: interpolate(story.value, [0.1, 0.2, 0.84, 0.92], [0, 1, 1, 0], clamp),
    transform: [
      {
        translateX: interpolate(story.value, [0.1, 0.3, 0.78, 0.94], [WALK, 0, 0, WALK], clamp),
      },
    ],
  }));
  /* turns around to face the hole before walking back */
  const flipStyle = useAnimatedStyle(() => ({
    ...FILL,
    transform: [
      { translateX: 28.95 },
      { scaleX: interpolate(story.value, [0.72, 0.8], [1, -1], clamp) },
      { translateX: -28.95 },
    ],
  }));
  const jumpStyle = useAnimatedStyle(() => ({
    ...FILL,
    transform: [
      { translateX: RX(52) },
      { translateY: RY(91) },
      {
        translateY: interpolate(story.value, [0.54, 0.6, 0.68, 0.72, 0.78], [0, -5.7, 0, -3.5, 0], clamp),
      },
      { rotate: `${interpolate(story.value, [0.54, 0.68, 0.78], [0, -8, 0], clamp)}deg` },
      { translateX: -RX(52) },
      { translateY: -RY(91) },
    ],
  }));
  const headTiltStyle = useAnimatedStyle(() => ({
    ...FILL,
    transform: [
      { translateX: RX(52) },
      { translateY: RY(15) },
      { rotate: `${interpolate(story.value, [0.32, 0.42, 0.52], [0, 8, 0], clamp)}deg` },
      { translateX: -RX(52) },
      { translateY: -RY(15) },
    ],
  }));
  const normalOp = useAnimatedStyle(() => ({
    ...FILL,
    opacity: interpolate(story.value, [0.5, 0.56, 0.66, 0.72], [1, 0, 0, 1], clamp),
  }));
  const happyOp = useAnimatedStyle(() => ({
    ...FILL,
    opacity: interpolate(story.value, [0.5, 0.56, 0.66, 0.72], [0, 1, 1, 0], clamp),
  }));
  const starAStyle = useAnimatedStyle(() => ({
    ...FILL,
    opacity: interpolate(story.value, [0.44, 0.52, 0.64], [0, 1, 0], clamp),
    transform: [
      { translateX: RX(30) },
      { translateY: RY(15) },
      { scale: interpolate(story.value, [0.44, 0.52, 0.64], [0, 1.3, 0], clamp) },
    ],
  }));
  const starBStyle = useAnimatedStyle(() => ({
    ...FILL,
    opacity: interpolate(story.value, [0.5, 0.58, 0.7], [0, 1, 0], clamp),
    transform: [
      { translateX: RX(19) },
      { translateY: RY(21) },
      { scale: interpolate(story.value, [0.5, 0.58, 0.7], [0, 1.3, 0], clamp) },
    ],
  }));
  /* speech bubble rides along: steps out with her, lifts with her jump.
     Its bottom edge is pinned just above her head (outer y ≈ 60), so it
     grows upward and never covers the face. */
  const bubbleMoveStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: -56.5,
    top: -6,
    width: 170,
    height: 66,
    transform: [
      { translateX: interpolate(story.value, [0.1, 0.3, 0.78, 0.94], [WALK, 0, 0, WALK], clamp) },
      {
        translateY: interpolate(story.value, [0.54, 0.6, 0.68, 0.72, 0.78], [0, -5.7, 0, -3.5, 0], clamp),
      },
    ],
  }));
  const bubblePopStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    opacity: interpolate(story.value, [0.28, 0.34, 0.58, 0.64], [0, 1, 1, 0], clamp),
    transform: [
      { scale: interpolate(story.value, [0.28, 0.34, 0.58, 0.64], [0.7, 1, 1, 0.85], clamp) },
    ],
  }));

  return (
    <View
      style={{ position: 'absolute', left: '100%', marginLeft: 12, top: 22, width: 90, height: 110, overflow: 'visible' }}
      pointerEvents="none"
    >
      {/* clipped stage: black hole + character (bottom 55dp of the frame) */}
      <View style={{ position: 'absolute', left: 0, top: 55, width: 90, height: 55, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 0, bottom: 0, width: 90, height: 55 }}>
          {/* floor line (static, behind everything) */}
          <Svg width={90} height={55} viewBox="0 -8 164 100">
            <Path d="M 12 91 L 152 91" stroke="#FFFFFF" strokeWidth={1} opacity={0.1} />
          </Svg>
          <RA.View style={wholeStyle}>
            <RA.View style={flipStyle}>
              <RA.View style={jumpStyle}>
                {/* body (static): floor, shadows, legs, dress, arms, phone */}
                <Svg width={90} height={55} viewBox="0 -8 164 100">
                  <Ellipse cx={44.5} cy={89.8} rx={5} ry={1.7} fill="#000000" opacity={0.4} />
                  <Ellipse cx={59.5} cy={89.8} rx={5} ry={1.7} fill="#000000" opacity={0.4} />
                  {/* legs */}
                  <Path d="M 45.5 52 L 44.5 85" stroke={SKIN_SH} strokeWidth={3.4} strokeLinecap="round" />
                  <Path d="M 58.5 52 L 59.5 85" stroke={SKIN_SH} strokeWidth={3.4} strokeLinecap="round" />
                  {/* shoes */}
                  <Rect x={40} y={83.5} width={9} height={7} rx={2.6} fill="#3E4C63" />
                  <Rect x={55} y={83.5} width={9} height={7} rx={2.6} fill="#3E4C63" />
                  {/* dress */}
                  <Path d="M 42 27 C 38.5 34 39 45 39.5 52.5 L 64.5 52.5 C 65 45 65.5 34 62 27 C 57 24 47 24 42 27 Z" fill={GOLD} />
                  <Path d="M 43.2 29 C 41.8 35.5 42.2 44 42.4 49.5" stroke={GOLD_HI} strokeWidth={1.8} opacity={0.5} strokeLinecap="round" />
                  <Rect x={38.2} y={46.5} width={27.6} height={6} rx={2} fill="#A87A2E" />
                  {/* left arm (raised, joyful) */}
                  <Path d="M 60 28 C 62.5 27 65.5 24.5 67.5 21.5" stroke={SKIN} strokeWidth={3.6} strokeLinecap="round" />
                  <Circle cx={68.5} cy={20.5} r={2.7} fill={SKIN} />
                  {/* right arm (holding phone) */}
                  <Path d="M 44 28 C 40 33 36 35.5 32.5 38" stroke={SKIN} strokeWidth={3.6} strokeLinecap="round" />
                  <Circle cx={31.5} cy={38.5} r={2.7} fill={SKIN} />
                  {/* phone */}
                  <Rect x={22} y={29.5} width={11.5} height={17.5} rx={2.5} fill="#222F44" stroke={GOLD} strokeWidth={1} />
                  <Rect x={24} y={31.5} width={7.5} height={13.5} rx={1.4} fill="#0F172A" />
                  <G transform={`translate(27.75 38.25)`}>
                    <Polygon points={star(1.6)} fill={GOLD_TEXT} />
                  </G>
                </Svg>
                {/* head (tilts to check phone) */}
                <RA.View style={headTiltStyle}>
                  <Svg width={90} height={55} viewBox="0 -8 164 100">
                    <Rect x={49} y={23} width={6} height={5} rx={2} fill={SKIN_SH} />
                    <Circle cx={63.8} cy={11.5} r={4} fill={HAIR} />
                    <Ellipse cx={63.8} cy={11.5} rx={1.9} ry={3.2} fill={GOLD} />
                    <Circle cx={52} cy={16.5} r={9.8} fill={SKIN} />
                    <Path d="M 42.5 18 C 41.8 9 44.6 5.4 52 5.8 C 59.4 5.4 62.2 9 61.5 18 C 61 14.2 59 12.4 56.5 12 C 54.5 11.7 49.5 11.7 47.5 12 C 45 12.4 43 14.2 42.5 18 Z" fill={HAIR} />
                    <Path d="M 45.5 8.8 C 47.6 6.6 51.5 6.2 55 6.8 C 52.2 6.9 49 8.2 45.5 8.8 Z" fill={HAIR_HI} />
                  </Svg>
                  {/* happy face */}
                  <RA.View style={happyOp}>
                    <Svg width={90} height={55} viewBox="0 -8 164 100">
                      <Circle cx={45.8} cy={18} r={1.9} fill="#F4A6A6" opacity={0.55} />
                      <Circle cx={58.2} cy={18} r={1.9} fill="#F4A6A6" opacity={0.55} />
                      <Path d="M 46.6 15.6 Q 48 14.1 49.4 15.6" stroke={DARK} strokeWidth={1.2} strokeLinecap="round" fill="none" />
                      <Path d="M 52.2 15.6 Q 53.6 14.1 55 15.6" stroke={DARK} strokeWidth={1.2} strokeLinecap="round" fill="none" />
                      <Path d="M 49.2 19.2 Q 52 22.6 54.8 19.2 Q 52 24.6 49.2 19.2 Z" fill="#7A3B2E" />
                    </Svg>
                  </RA.View>
                  {/* normal face */}
                  <RA.View style={normalOp}>
                    <Svg width={90} height={55} viewBox="0 -8 164 100">
                      <Path d="M 46.4 13.4 Q 48.1 12.4 49.8 13" stroke={HAIR} strokeWidth={1} strokeLinecap="round" fill="none" />
                      <Path d="M 52.4 13 Q 54.1 12.4 55.8 13.4" stroke={HAIR} strokeWidth={1} strokeLinecap="round" fill="none" />
                      <Ellipse cx={48.2} cy={16.2} rx={1.5} ry={1.1} fill={DARK} />
                      <Ellipse cx={53.8} cy={16.2} rx={1.5} ry={1.1} fill={DARK} />
                      <Path d="M 49 20.2 Q 52 22 55 20.2" stroke="#7A3B2E" strokeWidth={1.3} strokeLinecap="round" fill="none" />
                    </Svg>
                  </RA.View>
                </RA.View>
                {/* star pops above the phone */}
                <RA.View style={starAStyle}>
                  <Svg width={90} height={55} viewBox="0 -8 164 100">
                    <Polygon points={star(4.5)} fill={GOLD_TEXT} />
                  </Svg>
                </RA.View>
                <RA.View style={starBStyle}>
                  <Svg width={90} height={55} viewBox="0 -8 164 100">
                    <Polygon points={star(3.5)} fill={GOLD_TEXT} />
                  </Svg>
                </RA.View>
              </RA.View>
            </RA.View>
          </RA.View>
          {/* the black hole (in front of the character — she disappears into it) */}
          <RA.View style={holeStyle}>
            <Svg width={90} height={55} viewBox="0 -8 164 100">
              <Circle cx={120.3} cy={47.5} r={51} fill={GOLD} opacity={0.1} />
              <Circle cx={120.3} cy={47.5} r={40.1} fill={GOLD} opacity={0.2} />
              <Circle cx={120.3} cy={47.5} r={43.7} fill="#05070D" />
              <Circle cx={120.3} cy={47.5} r={43.7} stroke={GOLD} strokeWidth={2.2} fill="none" opacity={0.7} />
              <Circle cx={120.3} cy={47.5} r={32.8} stroke="#FFFFFF" strokeWidth={1.3} fill="none" opacity={0.12} />
              <Circle cx={105.7} cy={35.6} r={2.2} fill={GOLD_TEXT} opacity={0.9} />
              <Circle cx={136.7} cy={61.1} r={1.8} fill="#FFFFFF" opacity={0.55} />
            </Svg>
          </RA.View>
        </View>
      </View>

      {/* speech bubble — exactly above her head (bottom pinned, grows upward), moves with her */}
      <RA.View style={bubbleMoveStyle}>
        <RA.View style={bubblePopStyle}>
          <View
            style={{
              maxWidth: 170,
              alignSelf: 'center',
              backgroundColor: '#101A2C',
              borderWidth: 1,
              borderColor: 'rgba(200,155,60,0.75)',
              borderRadius: 14,
              paddingHorizontal: 8,
              paddingVertical: 5,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                lineHeight: 12.5,
                fontWeight: '600',
                color: 'rgba(255,255,255,0.95)',
                textAlign: 'center',
              }}
            >
              {message}
            </Text>
          </View>
          <View
            style={{
              position: 'absolute',
              left: 80,
              bottom: -1,
              width: 10,
              height: 10,
              backgroundColor: '#101A2C',
              borderRightWidth: 1,
              borderBottomWidth: 1,
              borderColor: 'rgba(200,155,60,0.75)',
              transform: [{ rotate: '45deg' }],
            }}
          />
        </RA.View>
      </RA.View>
    </View>
  );
}