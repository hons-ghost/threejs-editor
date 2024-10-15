import * as THREE from 'three'

export class DefaultMap {
    textureLoader = new THREE.TextureLoader()
    constructor(private scene: THREE.Scene, private setNonGlow: Function) {
        const repeat = 32
        const ao = this.textureLoader.load("assets/texture/forrest/1/1_ao.bmp")
        ao.wrapS = THREE.RepeatWrapping
        ao.wrapT = THREE.RepeatWrapping
        ao.repeat.set(repeat, repeat)
        const diffOri = this.textureLoader.load("assets/texture/forrest/1/1_diffuseOriginal.bmp")
        diffOri.wrapS = THREE.RepeatWrapping
        diffOri.wrapT = THREE.RepeatWrapping
        diffOri.repeat.set(repeat, repeat)
        const height = this.textureLoader.load("assets/texture/forrest/1/1_height.bmp")
        height.wrapS = THREE.RepeatWrapping
        height.wrapT = THREE.RepeatWrapping
        height.repeat.set(repeat, repeat)
        const normal = this.textureLoader.load("assets/texture/forrest/1/1_normal.bmp")
        normal.wrapS = THREE.RepeatWrapping
        normal.wrapT = THREE.RepeatWrapping
        normal.repeat.set(repeat, repeat)
        const metal = this.textureLoader.load("assets/texture/forrest/1/1_metallic.bmp")
        metal.wrapS = THREE.RepeatWrapping
        metal.wrapT = THREE.RepeatWrapping
        metal.repeat.set(repeat, repeat)
        const smooth = this.textureLoader.load("assets/texture/forrest/1/1_smoothness.bmp")
        smooth.wrapS = THREE.RepeatWrapping
        smooth.wrapT = THREE.RepeatWrapping
        smooth.repeat.set(repeat, repeat)
        const planeGeometry = new THREE.PlaneGeometry(32, 32);
        const material = new THREE.MeshStandardMaterial({
            map: diffOri,
            aoMap: ao,
            displacementMap: height,
            displacementScale: 0.1,
            normalMap: normal,
            metalnessMap: metal,
            metalness:.5,
            roughnessMap: smooth,
            roughness: .8
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