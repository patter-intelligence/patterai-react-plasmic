// import React, { useRef, useEffect } from 'react';
// import { useThree, useFrame } from '@react-three/fiber';
// import * as THREE from 'three';
// import { Html } from '@react-three/drei';

// interface CompassProps {
//   size?: number;
//   position?: [number, number, number];
//   onRotate: (angle: number) => void;
// }

// const Compass: React.FC<CompassProps> = ({ size = 100, position = [0, 0, 0], onRotate }) => {
//   const { camera } = useThree();
//   const compassRef = useRef<HTMLDivElement>(null);
//   const isDragging = useRef(false);
//   const lastAngle = useRef(0);

//   useEffect(() => {
//     const compass = compassRef.current;
//     if (!compass) return;

//     const handleMouseDown = (e: MouseEvent) => {
//       isDragging.current = true;
//       e.preventDefault();
//     };

//     const handleMouseUp = () => {
//       isDragging.current = false;
//     };

//     const handleMouseMove = (e: MouseEvent) => {
//       if (!isDragging.current) return;

//       const rect = compass.getBoundingClientRect();
//       const centerX = rect.left + rect.width / 2;
//       const centerY = rect.top + rect.height / 2;
//       const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      
//       const rotationAngle = angle - lastAngle.current;
//       onRotate(rotationAngle);
      
//       lastAngle.current = angle;
//     };

//     compass.addEventListener('mousedown', handleMouseDown);
//     window.addEventListener('mouseup', handleMouseUp);
//     window.addEventListener('mousemove', handleMouseMove);

//     return () => {
//       compass.removeEventListener('mousedown', handleMouseDown);
//       window.removeEventListener('mouseup', handleMouseUp);
//       window.removeEventListener('mousemove', handleMouseMove);
//     };
//   }, [onRotate]);

//   useFrame(() => {
//     if (compassRef.current) {
//       const rotation = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
//       compassRef.current.style.transform = `rotate(${-rotation.y}rad)`;
//     }
//   });

//   return (
//     <Html position={position}>
//       <div
//         ref={compassRef}
//         style={{
//           width: `${size}px`,
//           height: `${size}px`,
//           borderRadius: '50%',
//           border: '2px solid #333',
//           position: 'relative',
//           cursor: 'grab',
//           backgroundColor: 'rgba(255, 255, 255, 0.8)',
//         }}
//       >
//         <div style={{
//           position: 'absolute',
//           top: '5px',
//           left: '50%',
//           transform: 'translateX(-50%)',
//           fontSize: '14px',
//           fontWeight: 'bold',
//         }}>N</div>
//         <div style={{
//           position: 'absolute',
//           bottom: '5px',
//           left: '50%',
//           transform: 'translateX(-50%)',
//           fontSize: '14px',
//           fontWeight: 'bold',
//         }}>S</div>
//         <div style={{
//           position: 'absolute',
//           left: '5px',
//           top: '50%',
//           transform: 'translateY(-50%)',
//           fontSize: '14px',
//           fontWeight: 'bold',
//         }}>W</div>
//         <div style={{
//           position: 'absolute',
//           right: '5px',
//           top: '50%',
//           transform: 'translateY(-50%)',
//           fontSize: '14px',
//           fontWeight: 'bold',
//         }}>E</div>
//         <div style={{
//           position: 'absolute',
//           top: '50%',
//           left: '50%',
//           width: '2px',
//           height: '50%',
//           background: 'red',
//           transformOrigin: 'bottom',
//           transform: 'translateX(-50%) translateY(-100%)',
//         }}></div>
//       </div>
//     </Html>
//   );
// };

// export default Compass;
// import React, { useRef, useEffect } from 'react';
// import { useThree, useFrame } from '@react-three/fiber';
// import * as THREE from 'three';
// import { Html } from '@react-three/drei';

// interface CompassProps {
//   size?: number;
//   position?: [number, number, number];
//   onRotate: (angle: number) => void;
// }

// const Compass: React.FC<CompassProps> = ({ size = 100, position = [0, 0, 0], onRotate }) => {
//   const { camera } = useThree();
//   const compassRef = useRef<HTMLDivElement>(null);
//   const isDragging = useRef(false);
//   const lastAngle = useRef(0);

//   useEffect(() => {
//     const compass = compassRef.current;
//     if (!compass) return;

//     const handleMouseDown = (e: MouseEvent) => {
//       isDragging.current = true;
//       e.preventDefault();
//     };

//     const handleMouseUp = () => {
//       isDragging.current = false;
//     };

//     const handleMouseMove = (e: MouseEvent) => {
//       if (!isDragging.current) return;

//       const rect = compass.getBoundingClientRect();
//       const centerX = rect.left + rect.width / 2;
//       const centerY = rect.top + rect.height / 2;
//       const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      
//       const rotationAngle = angle - lastAngle.current;
//       onRotate(rotationAngle);
      
//       lastAngle.current = angle;
//     };

//     compass.addEventListener('mousedown', handleMouseDown);
//     window.addEventListener('mouseup', handleMouseUp);
//     window.addEventListener('mousemove', handleMouseMove);

//     return () => {
//       compass.removeEventListener('mousedown', handleMouseDown);
//       window.removeEventListener('mouseup', handleMouseUp);
//       window.removeEventListener('mousemove', handleMouseMove);
//     };
//   }, [onRotate]);

//   useFrame(() => {
//     if (compassRef.current) {
//       const rotation = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
//       compassRef.current.style.transform = `rotate(${-rotation.y}rad)`;
//     }
//   });

//   return (
//     <Html position={position}>
//       <div
//         ref={compassRef}
//         style={{
//           width: `${size}px`,
//           height: `${size}px`,
//           borderRadius: '50%',
//           border: '2px solid #333',
//           position: 'relative',
//           cursor: 'grab',
//           backgroundColor: 'rgba(255, 255, 255, 0.8)',
//         }}
//       >
//         <div style={{
//           position: 'absolute',
//           top: '5px',
//           left: '50%',
//           transform: 'translateX(-50%)',
//           fontSize: '14px',
//           fontWeight: 'bold',
//         }}>N</div>
//         <div style={{
//           position: 'absolute',
//           bottom: '5px',
//           left: '50%',
//           transform: 'translateX(-50%)',
//           fontSize: '14px',
//           fontWeight: 'bold',
//         }}>S</div>
//         <div style={{
//           position: 'absolute',
//           left: '5px',
//           top: '50%',
//           transform: 'translateY(-50%)',
//           fontSize: '14px',
//           fontWeight: 'bold',
//         }}>W</div>
//         <div style={{
//           position: 'absolute',
//           right: '5px',
//           top: '50%',
//           transform: 'translateY(-50%)',
//           fontSize: '14px',
//           fontWeight: 'bold',
//         }}>E</div>
//         <div style={{
//           position: 'absolute',
//           top: '50%',
//           left: '50%',
//           width: '2px',
//           height: '50%',
//           background: 'red',
//           transformOrigin: 'bottom',
//           transform: 'translateX(-50%) translateY(-100%)',
//         }}></div>
//       </div>
//     </Html>
//   );
// };

// export default Compass;
import React, { useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CompassProps {
  size?: number;
  onRotate: (angle: number) => void;
}

const Compass: React.FC<CompassProps> = ({ size = 100, onRotate }) => {
  const { camera } = useThree();
  const compassRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastAngle = useRef(0);

  useEffect(() => {
    const compass = compassRef.current;
    if (!compass) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      e.preventDefault();
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const rect = compass.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      
      const rotationAngle = angle - lastAngle.current;
      onRotate(rotationAngle);
      
      lastAngle.current = angle;
    };

    compass.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      compass.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [onRotate]);

  useFrame(() => {
    if (compassRef.current) {
      const rotation = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
      compassRef.current.style.transform = `rotate(${-rotation.y}rad)`;
    }
  });

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div
        ref={compassRef}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          position: 'absolute',
          top: '40px',
          left: '40px',
          cursor: 'grab',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
          zIndex: 1000,
          pointerEvents: 'auto',
          transition: 'transform 0.3s ease-out',
        }}
      >
        <svg width={size} height={size} viewBox="0 0 200 200">
          <defs>
            <linearGradient id="northGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF3B30" />
              <stop offset="100%" stopColor="#FF9500" />
            </linearGradient>
            <linearGradient id="southGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5AC8FA" />
              <stop offset="100%" stopColor="#007AFF" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <circle cx="100" cy="100" r="98" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <path d="M100,10 L100,30 M100,170 L100,190 M10,100 L30,100 M170,100 L190,100" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
          <path d="M100,10 L108,90 L100,190 L92,90 Z" fill="url(#northGradient)" filter="url(#glow)" />
          <path d="M100,10 L104,90 L100,190 L96,90 Z" fill="url(#southGradient)" filter="url(#glow)" />
          <circle cx="100" cy="100" r="6" fill="#FFFFFF" filter="url(#glow)" />
          <text x="100" y="30" textAnchor="middle" fill="#FFFFFF" fontSize="30" fontWeight="bold" filter="url(#glow)">N</text>
          <text x="100" y="175" textAnchor="middle" fill="#FFFFFF" fontSize="25" fontWeight="bold" filter="url(#glow)">S</text>
          <text x="30" y="105" textAnchor="middle" fill="#FFFFFF" fontSize="25" fontWeight="bold" filter="url(#glow)">W</text>
          <text x="170" y="105" textAnchor="middle" fill="#FFFFFF" fontSize="25" fontWeight="bold" filter="url(#glow)">E</text>
        </svg>
      </div>
    </Html>
  );
};

export default Compass;
