import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

export class MeshLineTester {
	curvePoints: number[] = [
		-6, 0, 10,
		-1, 0, 10,
		3, 0, 4,
		6, 0, 1,
		11, 0, 2,
		13, 0, 6,
		9, 1, 9,
		4, 1, 7,
		1, 1, 1,
		0, 1, -5,
		2, 0, -9,
		8, 0, -10,
		13, 0, -5,
		14, 1, 2,
		10, 3, 7,
		2, 1, 8,
		-4, 3, 7,
		-8, 1, 1,
		-9, 1, -4,
		-6, 1, -9,
		0, 1, -10,
		7, 1, -7,
		5, 2, 0,
		0, 2, 2,
		-5, 1, 0,
		-7, 2, -5,
		-8, 2, -9,
		-11, 2, -10,
		-14, 1, -7,
		-13, 1, -2,
		-14, 0, 3,
		-11, 0, 10,
		-6, 0, 10
	];

	pts: THREE.Vector3[] = [];
	constructor(private scene: THREE.Scene) {

		for (let i = 0; i < this.curvePoints.length; i += 3) {

			this.pts.push(new THREE.Vector3(this.curvePoints[i], this.curvePoints[i + 1], this.curvePoints[i + 2]));

		}

		const ls = 1400; // length segments
		const ws = 5; // width segments 
		const lss = ls + 1;
		const wss = ws + 1;

		const curve = new THREE.CatmullRomCurve3(this.pts);
		const points = curve.getPoints(ls);
		const len = curve.getLength();
		const lenList = curve.getLengths(ls);

		const faceCount = ls * ws * 2;
		const vertexCount = lss * wss;

		const indices = new Uint32Array(faceCount * 3);
		const vertices = new Float32Array(vertexCount * 3);
		const uvs = new Float32Array(vertexCount * 2);

		const g = new THREE.BufferGeometry();
		g.setIndex(new THREE.BufferAttribute(indices, 1));
		g.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
		g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

		let idxCount = 0;
		let a, b1, c1, c2;

		for (let j = 0; j < ls; j++) {
			for (let i = 0; i < ws; i++) {
				// 2 faces / segment,  3 vertex indices
				a = wss * j + i;
				b1 = wss * (j + 1) + i;		// right-bottom
				c1 = wss * (j + 1) + 1 + i;
				//  b2 = c1							// left-top
				c2 = wss * j + 1 + i;

				indices[idxCount] = a; // right-bottom
				indices[idxCount + 1] = b1;
				indices[idxCount + 2] = c1;

				indices[idxCount + 3] = a; // left-top
				indices[idxCount + 4] = c1 // = b2,
				indices[idxCount + 5] = c2;

				g.addGroup(idxCount, 6, i); // write group for multi material

				idxCount += 6;
			}
		}

		let uvIdxCount = 0;

		for (let j = 0; j < lss; j++) {
			for (let i = 0; i < wss; i++) {
				uvs[uvIdxCount] = lenList[j] / len;
				uvs[uvIdxCount + 1] = i / ws;

				uvIdxCount += 2;
			}
		}

		let x, y, z;
		let posIdx = 0; // position index

		let tangent;
		const normal = new THREE.Vector3();
		const binormal = new THREE.Vector3(0, 1, 0);

		const t: THREE.Vector3[] = []; // tangents
		const n: THREE.Vector3[] = []; // normals
		const b: THREE.Vector3[] = []; // binormals

		for (let j = 0; j < lss; j++) {
			// to the points
			tangent = curve.getTangent(j / ls);
			t.push(tangent.clone());

			normal.crossVectors(tangent, binormal);

			normal.y = 0; // to prevent lateral slope of the road

			normal.normalize();
			n.push(normal.clone());

			binormal.crossVectors(normal, tangent); // new binormal
			b.push(binormal.clone());
		}

		const dw = [-0.36, -0.34, -0.01, 0.01, 0.34, 0.36]; // width from the center line

		for (let j = 0; j < lss; j++) {  // length
			for (let i = 0; i < wss; i++) { // width

				x = points[j].x + dw[i] * n[j].x;
				y = points[j].y;
				z = points[j].z + dw[i] * n[j].z;

				vertices[posIdx] = x;
				vertices[posIdx + 1] = y;
				vertices[posIdx + 2] = z;

				posIdx += 3;
			}
		}

		const tex = new THREE.TextureLoader().load('assets2/CentralMarking.png');
		tex.wrapS = THREE.RepeatWrapping;
		tex.repeat.set(ls * 2, 0);

		const material = [
			new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
			new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide }),
			new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
			new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide }),
			new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
		];

		const roadMesh = new THREE.Mesh(g, material);
		scene.add(roadMesh);

		const loader = new GLTFLoader();

		const blueCar = new THREE.Object3D();
		loader.load('asserts2/car_02.gltf', processBlueCar); // (CC-BY) Poly by Googl
		const redCar = new THREE.Object3D();
		loader.load('asserts2/model.gltf', processRedCar); // Jarlan Perez (CC-BY) Poly by Googl

		const M3 = new THREE.Matrix3();
		const M4 = new THREE.Matrix4();
		let iBlue = 0;
		let iRed = ls;


		function driving() {
			if (iBlue === lss) {
				iBlue = 0; // loop
			}

			if (iRed === -1) {
				iRed = ls; // loop
			}

			// transposed arranged
			M3.set(t[iBlue].x, b[iBlue].x, n[iBlue].x, t[iBlue].y, b[iBlue].y, n[iBlue].y, t[iBlue].z, b[iBlue].z, n[iBlue].z);
			M4.setFromMatrix3(M3);

			blueCar.setRotationFromMatrix(M4);
			blueCar.position.set(points[iBlue].x + 0.18 * n[iBlue].x, points[iBlue].y, points[iBlue].z + 0.18 * n[iBlue].z);
			iBlue++;

			M3.set(t[iRed].x, b[iRed].x, n[iRed].x, t[iRed].y, b[iRed].y, n[iRed].y, t[iRed].z, b[iRed].z, n[iRed].z);
			M4.setFromMatrix3(M3);
			redCar.setRotationFromMatrix(M4);

			redCar.position.set(points[iRed].x - 0.18 * n[iRed].x, points[iRed].y, points[iRed].z - 0.18 * n[iRed].z);
			iRed--;

		}

		function processBlueCar(gltf: GLTF) {

			gltf.scene.rotation.y = Math.PI;  // gltf.scene is centered, rotatiom needed
			blueCar.add(gltf.scene);
			blueCar.scale.set(0.0015, 0.0015, 0.0015); // because gltf.scene is very big
			scene.add(blueCar);

		}

		function processRedCar(gltf: GLTF) {
			const box = new THREE.Box3().setFromObject(gltf.scene);
			const c = box.getCenter(new THREE.Vector3());
			const size = box.getSize(new THREE.Vector3());
			gltf.scene.position.set(-c.x - 0.3, size.y / 2 - c.y, -c.z + 2.2); // center the gltf scene
			gltf.scene.rotation.y = Math.PI / 2;  // rotatiom needed
			redCar.add(gltf.scene);
			redCar.scale.set(0.4, 0.4, 0.4); // because gltf.scene is  big
			scene.add(redCar);
		}
	}
}

