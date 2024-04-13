import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Transform, GameObject, Time, Vector3, Quaternion } from 'UnityEngine'
import * as vop from './Vector3Operators'

export default class MoveWayPoints extends ZepetoScriptBehaviour {
    public wayPointsGroup: GameObject = null;
    private wayPoints: Transform[] = [];

    private speed: float = 2.0;
    private index: int = 0;
    private speedPerTime: float = 0.0;
    
    private relativePos: Vector3 = Vector3.zero;
    private targetRot: Quaternion = Quaternion.identity;
    private rotateWeight: float = 2;

    private Start(): void {
        if (this.wayPointsGroup != null) {
            this.wayPoints = this.wayPointsGroup.GetComponentsInChildren<Transform>();
            // Parent's Transform
            this.wayPoints.splice(0, 1);
        }
    }

    private FixedUpdate(): void {
        if (this.wayPointsGroup != null) {
            if (vop.Sub(this.transform.position, this.wayPoints[this.index].position).sqrMagnitude < 0.25) {
                this.index++;
                if (this.index >= this.wayPoints.length) {
                    this.index = 0;
                }
            }
            this.relativePos = vop.Sub(this.wayPoints[this.index].position, this.transform.position);
            this.targetRot = Quaternion.LookRotation(this.relativePos);
            this.transform.rotation = Quaternion.Lerp(this.transform.rotation, this.targetRot, this.rotateWeight * Time.fixedDeltaTime);
            
            this.speedPerTime = Time.fixedDeltaTime * this.speed;
            this.transform.Translate(vop.Multi(Vector3.forward, this.speedPerTime));
        }
    }
}