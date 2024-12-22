import * as THREE from "three";
import { gui } from "@Glibs/helper/helper"
import GUI from 'lil-gui';

export class NoiseVfx {
    processFlag = false
    param = {
        start: false
    }
    // 스프라이트 시트 로드
    textureLoader = new THREE.TextureLoader();
    spriteSheet = this.textureLoader.load('assets/texture/noise/Abstract_Noise_009-512x512.png');
    gradTexture = this.textureLoader.load("assets/texture/masksforparticles/Radial_04_test.png")

    // 메쉬 생성 (PlaneGeometry를 사용한 예시)
    material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: this.spriteSheet },
                uGradTexture: { value: this.gradTexture },
                uTime: { value: 0.0 },
                uSpeed: { value: 10.0 },  // 텍스처 이동 속도
                uColor: { value: new THREE.Color(0xff0000) }
            },
            vertexShader: vertShader,
            fragmentShader: fragShader,
            transparent: true,
        })
    geometry = new THREE.RingGeometry(1, 10, 16, 4, 0)
    mesh: THREE.Mesh
    gui: GUI
    intervalId?: NodeJS.Timeout

    constructor(private scene: THREE.Scene) {
        this.gui = gui.addFolder("NoiseTest")
        this.gui.close()
        this.gui.add(this.param, "start").onChange((value: boolean) => {
            if (value) {
                this.Start()
            } else {
                this.Complete()
            }
        })
        /*
        const uvAttribute = this.geometry.attributes.uv;
        for (let i = 0; i < uvAttribute.count; i++) {
            const u = uvAttribute.getX(i);
            const v = uvAttribute.getY(i);

            const angle = Math.atan2(v - 0.5, u - 0.5);
            const radius = Math.sqrt(Math.pow(u - 0.5, 2) + Math.pow(v - 0.5, 2));

            //uvAttribute.setXY(i, (angle / (2.0 * Math.PI)) + 0.5, radius);
            uvAttribute.setXY(i, radius, 1.0 - ((angle / (2.0 * Math.PI)) + 0.5));
        }
        */
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.rotation.x = -Math.PI / 2; // 땅에 평행하게 회전
        this.mesh.position.y = 1.5
        const scale = 1
        this.mesh.scale.set(scale, scale, scale)
    }
    Start() {
        this.processFlag = true
        this.scene.add(this.mesh)
    }
    Complete() {
        this.processFlag = false
        this.scene.remove(this.mesh)
    }
    Update(delta: number) {
        if (!this.processFlag) return
        this.material.uniforms.uTime.value += delta * 1
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

	        float preAlpha = smoothstep(0.0, 0.2, length(texColor.rgb));
            // 텍스처와 uniform으로 전달된 색상을 혼합
            vec3 alphaColor = texColor.rgb * preAlpha;
            vec4 finalColor = vec4(mix(alphaColor, uColor, 0.3), preAlpha);
            gl_FragColor = finalColor;

            if (preAlpha > 0.0) {
                gl_FragColor.a = smoothstep(0.0, 0.5, 1.0-length(gradTexColor.rgb));
            }
        }`

