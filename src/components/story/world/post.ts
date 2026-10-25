import { BloomEffect, EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect } from "postprocessing";
import { HalfFloatType, type Camera, type Scene, type WebGLRenderer } from "three";

/**
 * Post-processing (tier high/medium): MSAA, bloom halus untuk benda bercahaya (warna > 1:
 * matahari, bulan, lampion, jendela malam), vignette lembut, dan tone mapping "neutral"
 * yang menjaga warna palet tetap hidup. Semua efek digabung dalam satu EffectPass.
 */
export function createPost(renderer: WebGLRenderer, scene: Scene, camera: Camera, msaa: number) {
  const composer = new EffectComposer(renderer, { frameBufferType: HalfFloatType, multisampling: msaa });
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new BloomEffect({ mipmapBlur: true, luminanceThreshold: 0.92, luminanceSmoothing: 0.25, intensity: 0.75, radius: 0.7 });
  composer.addPass(new EffectPass(camera, bloom, new VignetteEffect({ offset: 0.32, darkness: 0.38 }), new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL })));
  return {
    render: () => composer.render(),
    setSize: (w: number, h: number) => composer.setSize(w, h, false),
    dispose: () => composer.dispose(),
  };
}

export type Post = ReturnType<typeof createPost>;
