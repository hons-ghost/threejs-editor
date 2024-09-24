import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader'

export interface IPostPro {
  setGlow(target: THREE.Mesh | THREE.Group): void
  setNonGlow(target: THREE.Mesh | THREE.Group): void
  render(delta: number): void
  resize(): void
}

export class Postpro implements IPostPro {
  renderScene = new RenderPass(this.scene, this.camera)
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    .5, .5, 0
  )
  rendertarget1 = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    colorSpace: THREE.NoColorSpace,
    samples: 4
  })
  bloomComposer: EffectComposer
  finalComposer: EffectComposer
  gu = {
    time: { value: 0 },
    globalBloom: { value: 0 }
  }
  constructor(
    private scene: THREE.Scene,
    private camera: THREE.Camera,
    private renderer: THREE.WebGLRenderer
  ) {
    this.bloomComposer = new EffectComposer(this.renderer, this.rendertarget1)
    this.bloomComposer.renderToScreen = false
    this.bloomComposer.addPass(this.renderScene)
    this.bloomComposer.addPass(this.bloomPass)
    //this.bloomComposer.addPass(new ShaderPass(GammaCorrectionShader))
    this.bloomComposer.addPass(new SMAAPass(
      window.innerWidth * this.renderer.getPixelRatio(), 
      window.innerHeight * this.renderer.getPixelRatio()))
    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: this.bloomComposer.renderTarget2.texture }
        },
        vertexShader: `varying vec2 vUv;void main() {vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}`,
        fragmentShader: `uniform sampler2D baseTexture; uniform sampler2D bloomTexture; varying vec2 vUv; void main(){gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );}`,
        defines: {}
      }),
      "baseTexture"
    );
    finalPass.needsSwap = true;
    const target2 = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      colorSpace: THREE.NoColorSpace,
      samples: 4
    })
    this.finalComposer = new EffectComposer(renderer, target2);
    this.finalComposer.addPass(this.renderScene);
    this.finalComposer.addPass(finalPass);
  }
  resize(): void {
    this.bloomComposer.setSize(window.innerWidth, window.innerHeight)
    this.finalComposer.setSize(window.innerWidth, window.innerHeight)
  }
  setGlow(target: THREE.Mesh) {
  }
  setNonGlow(target: THREE.Mesh | THREE.Group) {
    target.traverse((child: any) => {
      if(child.isMesh) {
        child.material.onBeforeCompile = (shader: any) => {
          shader.uniforms.globalBloom = this.gu.globalBloom
          shader.fragmentShader = `
            uniform float globalBloom;
            ${shader.fragmentShader}
            `.replace(
              `#include <dithering_fragment>`,
              `#include <dithering_fragment>
              gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0), globalBloom);
              `
            )
        }
      }
    })
  }
  render(delta: number) {
    this.gu.globalBloom.value = 1
    this.bloomComposer.render()
    this.gu.globalBloom.value = 0.2
    this.finalComposer.render()
  }
}
