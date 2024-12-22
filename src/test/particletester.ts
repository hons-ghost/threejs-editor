import * as THREE from 'three';
import Nebula, { Gravity, Life, RandomDrift, Rotate, Texture, ease } from 'three-nebula';
import {
    Emitter, Force, Rate, Span, RadialVelocity, Position, SphereZone, Vector3D,
    Color, Alpha, Scale, SpriteRenderer
} from 'three-nebula';
import { gui } from "@Glibs/helper/helper"
import GUI, { Controller } from 'lil-gui';
import { VertexColors } from 'three-nebula/src/core/three';

export class ParticleTester {
    processFlag = false
    nebula = new Nebula();
    emitter = new Emitter();
    obj = new THREE.Group()
    param = {
        alphaS: 1,
        alphaE: 1,
        alphaLife: 1,
        alphaUpdate: () => {
            this.alpha.reset(this.param.alphaS, this.param.alphaE, this.param.alphaLife)
        },
        colorS: 0xffcc00,
        colorE: 0xffa500,
        //colorE: 0x8b4513,
        colorUpdate: () => {
            this.color.reset(new THREE.Color(this.param.colorS), new THREE.Color(this.param.colorE))
        },
        scaleS: .15,
        scaleE: .15,
        scaleLife: 1,
        scaleUpdate: () => {
            this.scale.reset(this.param.scaleS, this.param.scaleE, this.param.scaleLife)
        },
        forceX: 0,
        forceY: -.1,
        forceZ: 0,
        forceUpdate: () => {
            this.force.reset(this.param.forceX, this.param.forceY, this.param.forceZ)
        },
        gravity: .1, 
        gravityLife: 0,
        gravityUpdate: () => { 
            this.gravity.reset(this.param.gravity, this.param.gravityLife)
        },
        randDriftX: 3,
        randDriftY: 3,
        randDriftZ: 3, 
        randDriftDelay: 0,
        randDriftLife:0,
        randDriftUpdate: () => { 
            this.randDrift.reset(this.param.randDriftLife, undefined, this.param.randDriftX, this.param.randDriftY, this.param.randDriftZ, this.param.randDriftDelay)
        },
        emitNumMin: 50,
        emitNumMax: 100,
        emitTime: 1,
        emitUpdate:() => {
            this.emitter.setRate(new Rate(new Span(this.param.emitNumMin, this.param.emitNumMax), new Span(this.param.emitTime)));
        },
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        rotationLife: 0,
        rotationUpdate: () => {
            this.rotaion.reset(this.param.rotationX, this.param.rotationY, this.param.rotationZ, this.param.rotationLife)
        },
        radVelocity: 10,
        radVelocityV: new Vector3D(0, 1, 0),
        radVelocityTheta: 180,
        radVelocityUpdate: () => {
            this.emitVelocity = new RadialVelocity(this.param.radVelocity, this.param.radVelocityV, this.param.radVelocityTheta), // 빠르게 퍼져나가는 스파크 속도
            this.emitter.setInitializers([
                this.emitPosition, this.emitTexture, this.emitLife, this.emitVelocity
            ]);
        },
        start: false,
        infinityEmit: true
    }
    color = new Color(new THREE.Color(this.param.colorS), new THREE.Color(this.param.colorE))
    alpha = new Alpha(this.param.alphaS, this.param.alphaE, this.param.alphaLife) 
    scale = new Scale(this.param.scaleS, this.param.scaleE, this.param.scaleLife) // 크기 변화
    force = new Force(this.param.forceX, this.param.forceY, this.param.forceZ)
    gravity = new Gravity(this.param.gravity, this.param.gravityLife)
    randDrift = new RandomDrift(this.param.randDriftX, this.param.randDriftY, this.param.randDriftZ, this.param.randDriftDelay, this.param.randDriftLife)
    rotaion = new Rotate(this.param.rotationX, this.param.rotationY, this.param.rotationZ, this.param.rotationLife)

    emitPosition = new Position(new SphereZone(0, 0, 0, 5)) // 작은 구 영역에서 스파크 발생
    emitLife = new Life()
    emitVelocity = new RadialVelocity(this.param.radVelocity, this.param.radVelocityV, this.param.radVelocityTheta) // 빠르게 퍼져나가는 스파크 속도

    gui: GUI
    guiItems: Controller[] = []

    //texture = new THREE.TextureLoader().load("assets/texture/fxtexture/32x32_Arcane_3.png")
    texture = new THREE.TextureLoader().load("assets/texture/sparks.png")
    emitTexture: Texture

    constructor(private scene: THREE.Scene, private nonglowfn: Function) {
        this.gui = gui.addFolder("Nebula")
        this.gui.add(this.param, "start").onChange((value: boolean) => {
            if (value) {
                this.Start()
            } else {
                this.Complete()
            }
        })
        this.texture.minFilter = this.texture.magFilter = THREE.LinearFilter
        this.emitTexture = new Texture(THREE, this.texture, {
            depthWrite: false, blending: THREE.NormalBlending,
            depthTest: true, transparent: true, alphaTest: 0,
        })
    }
    Complete() {
        this.processFlag = false
        this.scene.remove(this.obj)
        this.guiItems.forEach(g => g.destroy())
        this.emitter.removeAllParticles()
        this.emitter.removeAllBehaviours()
        this.emitter.removeAllInitializers()
    }

    Start() {
        this.processFlag = true
        // 파티클 방출 속도 설정 (스파크처럼 순간적으로 터짐)
        this.emitter.setRate(new Rate(new Span(this.param.emitNumMin, this.param.emitNumMax), new Span(this.param.emitTime)));
        // 파티클의 초기 위치 설정 (작은 구에서 발생)
        this.emitter.setInitializers([
            this.emitPosition, this.emitTexture, this.emitLife, this.emitVelocity
        ]);

        // 파티클의 색상, 크기, 수명 설정
        this.emitter.setBehaviours([
            this.color, this.alpha, this.scale, this.force,
            this.gravity, this.randDrift, this.rotaion
        ]);
        this.param.colorUpdate()
        this.guiItems = [
            this.gui.add(this.param, "emitNumMin").onChange(() => { this.param.emitUpdate() }),
            this.gui.add(this.param, "emitNumMax").onChange(() => { this.param.emitUpdate() }),
            this.gui.add(this.param, "emitTime").onChange(() => { this.param.emitUpdate() }),
            this.gui.add(this.param, "alphaS").onChange(() => { this.param.alphaUpdate() }),
            this.gui.add(this.param, "alphaE").onChange(() => { this.param.alphaUpdate() }),
            this.gui.add(this.param, "alphaLife").onChange(() => { this.param.alphaUpdate() }),
            this.gui.add(this.param, "scaleS").onChange(() => { this.param.scaleUpdate() }),
            this.gui.add(this.param, "scaleE").onChange(() => { this.param.scaleUpdate() }),
            this.gui.add(this.param, "scaleLife").onChange(() => { this.param.scaleUpdate() }),
            this.gui.add(this.param, "forceX").onChange(() => { this.param.forceUpdate() }),
            this.gui.add(this.param, "forceY").onChange(() => { this.param.forceUpdate() }),
            this.gui.add(this.param, "forceZ").onChange(() => { this.param.forceUpdate() }),
            this.gui.addColor(this.param, "colorS").onChange(() => { this.param.colorUpdate() }),
            this.gui.addColor(this.param, "colorE").onChange(() => { this.param.colorUpdate() }),
            this.gui.add(this.param, "gravity").onChange(() => { this.param.gravityUpdate() }),
            this.gui.add(this.param, "gravityLife").onChange(() => { this.param.gravityUpdate() }),
            this.gui.add(this.param, "randDriftX").onChange(() => { this.param.randDriftUpdate() }),
            this.gui.add(this.param, "randDriftY").onChange(() => { this.param.randDriftUpdate() }),
            this.gui.add(this.param, "randDriftZ").onChange(() => { this.param.randDriftUpdate() }),
            this.gui.add(this.param, "randDriftLife").onChange(() => { this.param.randDriftUpdate() }),
            this.gui.add(this.param, "randDriftDelay").onChange(() => { this.param.randDriftUpdate() }),
            this.gui.add(this.param, "rotationX").onChange(() => { this.param.rotationUpdate() }),
            this.gui.add(this.param, "rotationY").onChange(() => { this.param.rotationUpdate() }),
            this.gui.add(this.param, "rotationZ").onChange(() => { this.param.rotationUpdate() }),
            this.gui.add(this.param, "rotationLife").onChange(() => { this.param.rotationUpdate() }),

            this.gui.add(this.param, "radVelocity").onChange(() => { this.param.radVelocityUpdate() }),
            this.gui.add(this.param.radVelocityV, "x").onChange(() => { this.param.radVelocityUpdate() }),
            this.gui.add(this.param.radVelocityV, "y").onChange(() => { this.param.radVelocityUpdate() }),
            this.gui.add(this.param.radVelocityV, "z").onChange(() => { this.param.radVelocityUpdate() }),
            this.gui.add(this.param, "radVelocityTheta").onChange(() => { this.param.radVelocityUpdate() }),

            this.gui.add(this.param, "infinityEmit").onChange((v: boolean) => {
            })
        ]

        // 시작
        this.emitter.emit()
        this.nebula = this.nebula.addEmitter(this.emitter);
        // 파티클 텍스처를 사용한 렌더러
        const spriteRenderer = new SpriteRenderer(this.obj as unknown as THREE.Scene, THREE);
        this.nebula = this.nebula.addRenderer(spriteRenderer);
        //this.nonglowfn(this.obj)
        //const scale = .1
        //this.obj.scale.set(scale, scale, scale)
        this.scene.add(this.obj)
    }
    Update(delta: number) {
        if (!this.processFlag) return
        this.nebula.update(delta)
    }
}


