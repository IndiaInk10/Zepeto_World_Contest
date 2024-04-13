import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Vector3, GameObject, Resources, Object, CharacterController, Time } from 'UnityEngine'
import * as vop from './Vector3Operators'

export default class Footprint extends ZepetoScriptBehaviour {
    public static InstanceMap: Map<GameObject, Footprint> = new Map();

    private footprint: GameObject;
    private cc: CharacterController; 
    private isFootprint: bool = false;
    private timeCount: float = 0.1;

    private Awake(): void {
        Footprint.InstanceMap.set(this.gameObject, this);
    }

    private Start(): void {  
        this.footprint = Resources.Load<GameObject>("Footprint");
        this.cc = this.transform.GetComponent<CharacterController>();
    }

    public SetFootprint(isFootprint: bool): void {
        this.isFootprint = isFootprint;
    }
    public GetFootprint(): bool {
        return this.isFootprint;
    }

    private Update(): void{
        if (this.isFootprint == false) {
            return;
        }

        this.timeCount += Time.deltaTime;
        if (this.timeCount < 0.1) {
            return;
        }
        
        this.timeCount = 0.0;
        if (this.cc.velocity.magnitude > 2) {
            let go = Object.Instantiate(this.footprint) as GameObject;
            go.transform.position = vop.Add(go.transform.position, this.SetFootprintPos());
            Object.Destroy(go, 2);
        }
    }

    private SetFootprintPos(): Vector3 {
        let pos = new Vector3(0, 0, 0);

        pos.x = this.transform.position.x;
        pos.z = this.transform.position.z;

        return pos;
    }
}