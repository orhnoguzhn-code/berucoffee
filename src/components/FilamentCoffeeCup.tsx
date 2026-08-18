import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Camera, DefaultLight, FilamentScene, FilamentView, Model } from 'react-native-filament';
import type { Float3 } from 'react-native-filament';
import { useSharedValue } from 'react-native-reanimated';

type Props = {
  size?: number;
};

export default function FilamentCoffeeCup({ size = 120 }: Props) {
  const rotation = useSharedValue<Float3>([0, 0, 0]) as any;

  useEffect(() => {
    const id = setInterval(() => {
      rotation.value = [0, (rotation.value[1] + 0.04) % (Math.PI * 2), 0];
    }, 33);
    return () => clearInterval(id);
  }, [rotation]);

  return (
    <View style={{ position: 'absolute', top: 52, right: 12, width: size, height: size * 1.15, zIndex: 1 }}>
      <FilamentScene>
        <FilamentView style={StyleSheet.absoluteFill} enableTransparentRendering>
          <Camera cameraPosition={[0, 0.05, 2.4]} cameraTarget={[0, 0, 0]} focalLengthInMillimeters={42} />
          <DefaultLight />
          <Model
            source={require('../../assets/beru-cup.glb')}
            rotate={rotation}
            transformToUnitCube
            castShadow
            receiveShadow
          />
        </FilamentView>
      </FilamentScene>
    </View>
  );
}
