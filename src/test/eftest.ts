import * as THREE from 'three';
import { gui } from "../ui/helper"
import GUI from 'lil-gui';

export class EfTester {
    processFlag = false
    obj = new THREE.Group()
    param = { start: false }
    gui: GUI

    texture = new THREE.TextureLoader().load("assets/texture/fxtexture/32x16_FX_0.png")
    mesh: THREE.Mesh
    material: THREE.ShaderMaterial

    constructor(private scene: THREE.Scene, private nonglowfn: Function) {
        this.gui = gui.addFolder("fireTest")
        this.gui.close()
        this.gui.add(this.param, "start").onChange((value: boolean) => {
            if (value) {
                this.Start()
            } else {
                this.Complete()
            }
        })
        this.texture.wrapS = THREE.RepeatWrapping
        this.texture.wrapT = THREE.RepeatWrapping
        // 땅에서 빛이 솟구치는 쉐이더 코드
        this.texture.repeat.set(1/3, 1/3)
        //this.texture.center.set(.5, .5)
        //this.texture.rotation = Math.PI / 2

        // 빛이 솟구치는 Material 생성
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: this.texture },
                uTime: { value: 0.0 },
                uSpeed: { value: 0.1 },  // 텍스처 이동 속도
                uColor: { value: new THREE.Color(0xff0000) }
            },
            vertexShader: vertShader,
            fragmentShader: fragShader,
            transparent: true,
        })
        //const geometry = new THREE.PlaneGeometry(5, 5);
        const geometry = new THREE.RingGeometry(1, 10, 16, 4, 0)
        // UV 좌표 재설정
        const uvAttribute = geometry.attributes.uv;
        for (let i = 0; i < uvAttribute.count; i++) {
            const u = uvAttribute.getX(i);
            const v = uvAttribute.getY(i);

            const angle = Math.atan2(v - 0.5, u - 0.5);
            const radius = Math.sqrt(Math.pow(u - 0.5, 2) + Math.pow(v - 0.5, 2));

            //uvAttribute.setXY(i, (angle / (2.0 * Math.PI)) + 0.5, radius);
            uvAttribute.setXY(i, radius, 1.0 - ((angle / (2.0 * Math.PI)) + 0.5));
        }
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.obj.add(this.mesh)
    }
    Complete() {
        this.processFlag = false
        this.scene.remove(this.obj)
    }

    Start() {
        this.processFlag = true
        this.scene.add(this.obj)
    }
    Update(delta: number) {
        if (!this.processFlag) return
        this.material.uniforms.uTime.value += delta * 10
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
        uniform float uTime;
        uniform float uSpeed;
        uniform vec3 uColor;
        varying vec2 vUv;

        void main() {
            // 텍스처 좌표를 시간에 따라 이동
            vec2 uv = vUv;
            uv.x -= uTime * uSpeed;  // 수평으로 이동
            //uv.y += uTime * uSpeed;  // 수직으로 이동 (필요시)

            // 텍스처 샘플링
            vec4 texColor = texture2D(uTexture, uv);

            // 텍스처와 uniform으로 전달된 색상을 혼합
            vec4 finalColor = vec4(mix(texColor.rgb, uColor, 0.5), texColor.a);

            gl_FragColor = finalColor;
        }`
