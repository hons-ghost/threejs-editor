import { IAsset } from "@Glibs/interface/iasset";
import IEventController, { ILoop } from "@Glibs/interface/ievent";
import { IPhysicsObject, PhysicsObject } from "@Glibs/interface/iobject";
import { EventTypes } from "@Glibs/types/globaltypes";
import * as THREE from "three";

export class TreeTest extends PhysicsObject implements IPhysicsObject, ILoop {
    LoopId = 0
    shader: any[] = []
    constructor(asset: IAsset, private eventCtrl: IEventController) {
        super(asset)
    }

    async Init() {
    }

    timer = 0
    update(elapsed: number) {
        if (this.shader.length > 0) {
            this.timer += elapsed
            this.shader.forEach((s) => s.uniforms.time.value = this.timer)
        }
    }
    get BoxPos() {
        return this.asset.GetBoxPos(this.meshs)
    }
    async MassLoad(scale: number, pos: THREE.Vector3) {
        this.meshs = await this.asset.CloneModel()
        /*
        if(this.meshs instanceof THREE.Mesh) {
            this.meshs.material = this.meshs.material.clone()
        }
        */
        const box = new THREE.Box3().setFromObject(this.meshs);
        const windStrength = 0.2;
        const windFrequency = 1.0;
        const maxHeight = box.max.y;
        this.meshs.traverse((child: any) => {
            if (child.isMesh && child.material.isMeshStandardMaterial) {
                child.material.onBeforeCompile = (shader: any) => {

                    shader.uniforms.time = { value: 0 };
                    shader.uniforms.windStrength = { value: windStrength };
                    shader.uniforms.windFrequency = { value: windFrequency };

                    shader.vertexShader = shader.vertexShader
                        .replace('void main() {', `
                        uniform float time;
                        uniform float windStrength;
                        uniform float windFrequency;
                        void main() {
                        `)
                                            .replace('#include <begin_vertex>', `
                        vec3 transformed = vec3(position);

                        // 흔들림 세기 (위로 갈수록 강해짐)
                        float strength = pow(clamp(position.y / ${maxHeight.toFixed(1)}, 0.0, 1.0), 2.0);

                        // 흔들림 계산 (위상차 줄이고 방향 통일)
                        float sway = sin(time * windFrequency + position.x * 0.5) * windStrength * strength;

                        transformed.x += sway;
                        `);

                    // render loop에서 shader.uniforms.time 업데이트 필요
                    child.material.userData.shader = shader;
                    this.shader.push(shader)
                };
            }
        });

        this.meshs.scale.set(scale, scale, scale)
        this.meshs.position.copy(pos)
        this.meshs.castShadow = true
        this.meshs.receiveShadow = true
        this.meshs.traverse(child => {
            child.castShadow = true
            child.receiveShadow = true
        })
        this.eventCtrl.SendEventMessage(EventTypes.RegisterLoop, this)
        //this.gphysics.addMeshBuilding(this)
    }
}
