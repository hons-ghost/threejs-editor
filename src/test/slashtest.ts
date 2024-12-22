import * as THREE from "three";
import { gui } from "@Glibs/helper/helper"
import GUI from 'lil-gui';

export class SlashTest {
    processFlag = false
    obj = new THREE.Group()
    param = { start: false }
    gui: GUI

    texture = new THREE.TextureLoader().load("assets/texture/masksforparticles/4.png")
    gradTexture = new THREE.TextureLoader().load("assets/texture/masksforparticles/Radial_04_test.png")
    mesh: THREE.Mesh
    material: THREE.ShaderMaterial

    constructor(private scene: THREE.Scene, private nonglowfn: Function) {
        this.gui = gui.addFolder("SlashTest")
        this.gui.close()
        this.gui.add(this.param, "start").onChange((value: boolean) => {
            if (value) {
                this.Start()
            } else {
                this.Complete()
            }
        })
        // 빛이 솟구치는 Material 생성
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: this.texture },
                uGradTexture: { value: this.gradTexture },
                uTime: { value: 0.0 },
                uSpeed: { value: 10.0 },  // 텍스처 이동 속도
                uColor: { value: new THREE.Color(0xff0000) }
            },
            vertexShader: vertShader,
            fragmentShader: fragShader,
            transparent: true,
        })
        const geometry = new THREE.PlaneGeometry(5, 5);
        
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.rotation.x = -Math.PI / 2; // 땅에 평행하게 회전
        this.mesh.position.y = 1.5
        const scale = 2
        this.mesh.scale.set(scale, scale, scale)

        this.obj.add(this.mesh)
    }
    Start() {
        this.processFlag = true
        this.nonglowfn(this.obj)
        this.scene.add(this.obj)
    }
    Complete() {
        this.processFlag = false
        this.scene.remove(this.obj)
    }
    Update(delta: number) {
        if (!this.processFlag) return
        this.material.uniforms.uTime.value += delta 
    }
}

const vertShader = `
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
`
const fragShader = `
        uniform sampler2D uTexture;
        uniform sampler2D uGradTexture;
        uniform float uTime;
        uniform float uSpeed;
        uniform vec3 uColor;
        varying vec2 vUv;

        mat2 getRotationMatrix(float angle) {
            float cosAngle = cos(angle);
            float sinAngle = sin(angle);
            return mat2(cosAngle, -sinAngle, sinAngle, cosAngle);
        }

        void main() {
            // 텍스처 좌표를 시간에 따라 이동
            vec2 uv = vUv;
            mat2 rotationMatrix = getRotationMatrix(uTime * uSpeed);
            vec2 rotatedUv = rotationMatrix * (uv - 0.5) + 0.5;

            // 텍스처 샘플링
            vec4 texColor = texture2D(uTexture, rotatedUv);
            vec4 gradTexColor = texture2D(uGradTexture, uv);

	        float preAlpha = 1.0 - smoothstep(0.0, 0.2, 1.0 - length(texColor.rgb));
            // 텍스처와 uniform으로 전달된 색상을 혼합
            vec3 alphaColor = texColor.rgb * preAlpha;
            vec4 finalColor = vec4(mix(alphaColor, uColor, 0.3), preAlpha);
            gl_FragColor = finalColor;

            if (preAlpha > 0.0) {
                gl_FragColor.a = smoothstep(0.0, 0.5, 1.0-length(gradTexColor.rgb));
            }
        }`

        /*

    vec4 color = texture2D(texture, vUv);
    float glow = 1.0 - smoothstep(0.8, 1.0, length(color.rgb));
    gl_FragColor = vec4(color.rgb + glow * 0.5, color.a);
         */
