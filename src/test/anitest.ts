import * as THREE from "three";
import { gui } from "../helper/helper"
import GUI from 'lil-gui';

export class AniVfx {
    processFlag = false
    param = {
        start: false
    }
    // 스프라이트 시트 로드
    textureLoader = new THREE.TextureLoader();
    //spriteSheet = this.textureLoader.load('assets/texture/anitexture/50/atlas_50e_2.png');
    spriteSheet = this.textureLoader.load('assets/texture/anitexture/50/atlas_50j.png');

    // 스프라이트 시트 설정
    columns = 3;  // 텍스처의 열 수 (한 행에 몇 개의 프레임이 있는지)
    rows = 4;     // 텍스처의 행 수 (몇 개의 행이 있는지)
    totalFrames = this.columns * this.rows;
    currentFrame = 0;  // 현재 프레임 인덱스

    // 메쉬 생성 (PlaneGeometry를 사용한 예시)
    material = new THREE.MeshBasicMaterial({ 
        map: this.spriteSheet, transparent: true 
    });
    geometry = new THREE.PlaneGeometry(8, 8);
    mesh = new THREE.Mesh(this.geometry, this.material);
    gui: GUI
    intervalId?: NodeJS.Timeout

    constructor(private scene: THREE.Scene) {
        this.gui = gui.addFolder("aniTest")
        this.gui.close()
        this.gui.add(this.param, "start").onChange((value: boolean) => {
            if (value) {
                this.Start()
            } else {
                this.Complete()
            }
        })
        this.mesh.rotation.x = -Math.PI / 2; // 땅에 평행하게 회전
        this.mesh.position.y = 1.5
        const scale = 2
        this.mesh.scale.set(scale, scale, scale)
        this.spriteSheet.wrapS = this.spriteSheet.wrapT = THREE.RepeatWrapping
        this.spriteSheet.repeat.set(1 / this.columns, 1 / this.rows)
    }
    Start() {
        this.processFlag = true
        this.scene.add(this.mesh)
        this.intervalId = setInterval(() => { this.animateTexture() }, 30);
    }
    Complete() {
        this.processFlag = false
        this.scene.remove(this.mesh)
        clearInterval(this.intervalId)
    }
    Update(_: number) {
        if (!this.processFlag) return
    }
    // UV 좌표 업데이트 함수
    updateUVs() {
        
        const col = this.currentFrame % this.columns;  // 현재 열 계산
        const row = Math.floor(this.currentFrame / this.columns);  // 현재 행 계산
        this.spriteSheet.offset.x = col / this.columns
        this.spriteSheet.offset.y = row / this.rows
        /*
        if (++this.currentFrame == this.totalFrames) {
            this.param.start = false
            this.Complete()
            return
        }
        */
        this.currentFrame++
        this.currentFrame %= this.totalFrames;  // 다음 프레임으로 전환
    }
    // 텍스처 애니메이션 함수
    animateTexture() {
        this.updateUVs();  // UV 좌표 업데이트
    }
}
