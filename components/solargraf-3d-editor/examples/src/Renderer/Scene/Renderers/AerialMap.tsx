import React, { useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
//@ts-ignore
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { useStore } from "../context/SolargrafDesignContext";
import { observer } from "mobx-react-lite";

// Simple cache object to store loaded textures
const textureCache: { [key: string]: { mapTexture: THREE.Texture, gammaCorrection: THREE.Texture } } = {};

export function useMapTexture({
  textureLength = 100,
}: {
  textureLength?: number;
}) {
  const { siteModel, store } = useStore();
  const textureUrl = siteModel.imageUrl;

  return useMemo(() => {
    console.log("####### siteModel", siteModel, store);

    // Check if the texture is already in the cache
    if (textureCache[textureUrl]) {
      return textureCache[textureUrl];
    }

    // Load the textures
    const mapTexturePromise = new Promise<THREE.Texture>((resolve) => {
      new TextureLoader().load(textureUrl, (texture) => {
        setupTexture(texture, textureLength, siteModel.metersPerPixelRatio);
        resolve(texture);
      });
    });

    const gammaCorrectionPromise = new Promise<THREE.Texture>((resolve) => {
      new TextureLoader().load(textureUrl, (texture) => {
        setupGammaCorrection(texture);
        resolve(texture);
      });
    });

    // Wait for both textures to load
    Promise.all([mapTexturePromise, gammaCorrectionPromise]).then(([mapTexture, gammaCorrection]) => {
      // Store the loaded textures in the cache
      textureCache[textureUrl] = { mapTexture, gammaCorrection };
    });

    // Return a loading state initially
    return { mapTexture: null, gammaCorrection: null };
  }, [textureUrl, textureLength, siteModel.metersPerPixelRatio]);
}

function setupTexture(texture: THREE.Texture, textureLength: number, metersPerPx: number) {
  //@ts-ignore
  texture.encoding = THREE.sRGBEncoding;
  //@ts-ignore
  texture.colorSpace = THREE.SRGBColorSpace;

  const scale = (texture.image.width * metersPerPx) / textureLength;
  const newOffset = (textureLength - textureLength / scale) / textureLength / 2;

  texture.repeat.set(1 / scale, 1 / scale);
  texture.offset.set(newOffset, newOffset);
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 16;
}

function setupGammaCorrection(texture: THREE.Texture) {
  //@ts-ignore
  texture.encoding = THREE.sRGBEncoding;
  //@ts-ignore
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 16;
}

function AerialMap({}) {
  const { siteModel } = useStore();
  const textureLength = 51;

  const { mapTexture, gammaCorrection } = useMapTexture({ textureLength });

  // If textures are still loading, render nothing or a loading placeholder
  if (!mapTexture || !gammaCorrection) {
    return null; // or return <LoadingPlaceholder />
  }

  return (
    <mesh receiveShadow position={[0, 0, 0.05]}>
      <planeGeometry
        attach="geometry"
        args={[textureLength, textureLength, 64]}
      />
      <meshBasicMaterial
        attach="material"
        color={0xffffff}
        map={mapTexture}
        transparent={true}
        side={THREE.DoubleSide}
      >
        <primitive attach="map" object={gammaCorrection} />
      </meshBasicMaterial>
    </mesh>
  );
}

export default observer(AerialMap);
