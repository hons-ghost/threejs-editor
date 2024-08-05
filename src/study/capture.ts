import * as THREE from 'three'
import { IAsset } from '../loader/assetmodel'

export const capture = (model: THREE.Group, asset: IAsset, name: string) => {
    const scene = new THREE.Scene()
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    renderer.setSize(100, 100)
    renderer.setClearColor(0x000000, 0)

        // 모델 위치와 크기 계산
    const box = asset.GetBox(model)
    const center = box.getCenter(new THREE.Vector3());
    const size = asset.GetSize(model)

    // 모델을 화면 가운데에 위치시키기
    scene.add(model);

    // 2. Calculate the distance the camera needs to be at to fit the entire model in view
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180); // Convert vertical FOV to radians
    const aspect = 1

    // Calculate distance for vertical and horizontal FOV
    const distance = maxDim / (2 * Math.tan(fov / 2));
    const horizontalFov = 2 * Math.atan(Math.tan(fov / 2) * aspect);
    const distanceHorizontally = maxDim / (2 * Math.tan(horizontalFov / 2));

    // Choose the larger distance to ensure the model fits in both dimensions
    const cameraZ = Math.max(distance, distanceHorizontally);

    camera.position.set(cameraZ + center.x, center.y, cameraZ + center.z);
    camera.lookAt(center);

    // 조명 추가
    const hemispherelight = new THREE.HemisphereLight(0xffffff, 0x333333)
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(hemispherelight, light);

    // 렌더링
    renderer.render(scene, camera);

    // 캡쳐된 이미지 데이터를 데이터 URL로 변환
    const imageDataURL = renderer.domElement.toDataURL('image/png');

    // 데이터 URL을 이미지로 변환하여 다운로드
    const link = document.createElement('a');
    link.href = imageDataURL;
    link.download = `${name}_thumb.png`;
    link.click();
}
