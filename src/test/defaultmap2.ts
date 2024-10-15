import * as THREE from 'three'

export class DefaultMap2 {
    textureLoader = new THREE.TextureLoader()
    constructor(private scene: THREE.Scene, private setNonGlow: Function) {
        const repeat = 16
        const map = this.textureLoader.load("assets/texture/hand_painted_grass.png")
        map.wrapS = THREE.RepeatWrapping
        map.wrapT = THREE.RepeatWrapping
        map.repeat.set(repeat, repeat)
        const planeGeometry = new THREE.PlaneGeometry(32, 32);
        const material = new THREE.MeshStandardMaterial({
            map: map,
            //transparent: true,
            //color: 0xffcc66,
        })
        const ground = new THREE.Mesh(planeGeometry, material);
        ground.rotation.x = -Math.PI / 2; // 땅에 평행하게 회전
        ground.position.setY(-.01)
        ground.receiveShadow = true
        this.setNonGlow(ground)
        this.scene.add(ground)
    }
}