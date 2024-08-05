import * as THREE from 'three'

export class Lightning {
    va = new THREE.Vector3(50, 2, -60)
    vb = new THREE.Vector3(40, 40, 2)
    axis = new THREE.Vector3().subVectors(this.vb, this.va).normalize()

    rightAngledVector = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), this.axis)
    vd = new THREE.Vector3().lerpVectors(this.va, this.vb, Math.random())
    dist = Math.random() * 50 + 50
    vc = new THREE.Vector3().copy(this.rightAngledVector).setLength(this.dist).add(this.vd)
    vCD = new THREE.Vector3().subVectors(this.vc, this.vd)
    pts: THREE.Vector3[] = []

    constructor(scene: THREE.Scene) {
        for (let i = 0; i < 6; i++) {
            this.pts.push(
                new THREE.Vector3()
                    .copy(this.vCD)
                    .applyAxisAngle(this.axis, (Math.PI / 3) * i)
                    .add(this.vd)
            )
        }
        const lineAB = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([this.va, this.vb]),
            new THREE.LineBasicMaterial({ color: "pink" })
        )
        const lineCD = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([this.vc, this.vd]),
            new THREE.LineBasicMaterial({ color: 0x00ff88 })
        )
        scene.add(lineAB, lineCD);
        [
            [0xff0000, this.va],
            [0x00ff00, this.vb],
            [0x00ffff, this.vc],
            [0xffffff, this.vd],
        ].forEach((p) => {
            const m = new THREE.Mesh(
                new THREE.SphereGeometry(2),
                new THREE.MeshLambertMaterial({ color: p[0] as number })
            )
            m.position.copy(p[1] as THREE.Vector3);
            scene.add(m)
        })
        const pointHelper = new THREE.Points(
            new THREE.BufferGeometry().setFromPoints(this.pts),
            new THREE.PointsMaterial({ size: 8, color: "yellow" })
        )
        scene.add(pointHelper)
    }
}