import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GameObject, Object, Vector3 } from 'UnityEngine'

export default class PlatePool extends ZepetoScriptBehaviour {
    // 참고 : https://github.com/naverz/zepeto-studio-kor/discussions/504
    private static instance: PlatePool;

    public static get Instance(): PlatePool {
        if (this.instance == null) {
            this.instance = GameObject.FindObjectOfType<PlatePool>();
        }

        return this.instance;
    }

    public platePrefab: GameObject;
    private platePool: GameObject[] = [];
    private plateNum: int = 16;

    private Awake(): void {
        this.Initialize(this.plateNum);
    }

    private Initialize(initCount: int): void {
        for (let i = 0; i < initCount; i++){
            this.platePool.push(this.CreateNewPlate());
        }
    }

    private CreateNewPlate(): GameObject {
        let go: GameObject = Object.Instantiate(this.platePrefab) as GameObject;
        go.SetActive(false);

        go.transform.position = Vector3.zero;
        go.transform.parent = this.transform;

        return go;
    }

    public GetPlate(): GameObject {
        if (this.platePool.length > 0) {
            let go: GameObject = this.platePool[0];

            go.SetActive(true);
            go.transform.parent = null;

            this.platePool.shift();

            return go;
        }
        else {
            let go: GameObject = this.CreateNewPlate();

            go.SetActive(true);
            go.transform.parent = null;

            return go;
        }
    }

    public ReturnPlate(go: GameObject): void {
        if (go == null)
            return;
        
        go.SetActive(false);
        go.transform.position = Vector3.zero;
        go.transform.parent = this.transform;

        this.platePool.push(go);
    }
}