
// import { OrbitControls } from 'drei'

// const Controls = (props) => {
//   return (
//     <OrbitControls
//       enableDamping
//       enableKeys
//       enableRotate
//       screenSpacePanning
//       dampingFactor={0.05}
//       minDistance={10}
//       maxDistance={500}
//       minPolarAngle={Math.PI / 4}
//       maxPolarAngle={Math.PI / 2}
//       {...props}
//     />
//   );
// };

// export default Controls;


// import React, { useRef } from "react";
// import { extend, useFrame, useThree } from "@react-three/fiber";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// extend({ OrbitControls });

// const Controls = (props) => {
//   const ref = useRef();
//   const {
//     camera,
//     gl: { domElement },
//   } = useThree();
//   useFrame(() => ref.current && ref.current.update());
//   return (
//     <orbitControls
//       ref={ref}
//       args={[camera, domElement]}
//       enableDamping
//       enableKeys
//       enableRotate
//       screenSpacePanning
//       dampingFactor={0.05}
//       minDistance={10}
//       maxDistance={500}
//       minPolarAngle={Math.PI / 4}
//       maxPolarAngle={Math.PI / 2}
//       {...props}
//     />
//   );
// };

// export default Controls;
