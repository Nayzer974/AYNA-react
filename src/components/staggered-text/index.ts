/**
 * StaggeredText Component
 * 
 * Animated text component with staggered character animations.
 * Inspired by "Everybody Can Cook" from Reactiive.
 * 
 * Usage:
 * ```tsx
 * import { useRef } from 'react';
 * import {
 *   StaggeredText,
 *   type StaggeredTextRef,
 * } from './components/staggered-text';
 * 
 * const MyComponent = () => {
 *   const textRef = useRef<StaggeredTextRef>(null);
 * 
 *   return (
 *     <StaggeredText
 *       text="Hello World"
 *       ref={textRef}
 *       fontSize={50}
 *       delay={300}
 *       // Optional: Enable reverse animation
 *       // enableReverse={true}
 *     />
 *   );
 * };
 * ```
 * 
 * Controlling the Animation:
 * The component exposes three methods through its ref:
 * 
 * // Start the animation
 * textRef.current?.animate();
 * 
 * // Reset to initial state
 * textRef.current?.reset();
 * 
 * // Toggle animation (requires enableReverse prop)
 * textRef.current?.toggleAnimate();
 */

export { StaggeredText } from '../StaggeredText';
export type { StaggeredTextRef } from '../StaggeredText';

