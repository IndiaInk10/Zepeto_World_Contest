import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { CharacterController, Quaternion, Mathf, GameObject, Transform, WaitForSeconds, WaitForFixedUpdate, Time, Animator, Coroutine, Collider } from 'UnityEngine';
import PlatePool from './PlatePool';
import { ZepetoPlayers, ZepetoPlayer } from 'ZEPETO.Character.Controller';

export default class PlayerSwimming extends ZepetoScriptBehaviour {
    public static InstanceMap: Map<GameObject, PlayerSwimming> = new Map();
    
    private isWater: boolean = false;
    private isSwimming: boolean = false;

    private cc: CharacterController = null;
    
    private myAnim: Animator = null;
    private swimmingRatio: float = 0.0;
    
    public get SwimmingRatio(): float {
        return this.swimmingRatio;
    }
    
    public set SwimmingRatio(value: float) {
        this.swimmingRatio = value;
    }
    
    private animRotate: Transform = null;
    private swimUpRotation: Quaternion = Quaternion.Euler(-100, 0, 0);

    private remainTime: float = 0.0001;
    private remainSec: WaitForSeconds = new WaitForSeconds(this.remainTime);
    private fixedSec: WaitForFixedUpdate = new WaitForFixedUpdate();

    private swimCoroutine: Coroutine = null;

    public GetWater(): boolean{
        return this.isWater;
    }

    public SetWater(water: boolean): void{
        this.isWater = water;
    }

    private Awake(): void {
        PlayerSwimming.InstanceMap.set(this.gameObject, this);
    }
    
    private Start(): void {
        this.cc = this.gameObject.GetComponent<CharacterController>();
        this.isSwimming = false;
        this.myAnim = ZepetoPlayers.instance.GetPlayer(this.name).character.ZepetoAnimator;
        this.animRotate = this.gameObject.GetComponentsInChildren<Transform>()[1];
    }
    
    private FixedUpdate(): void{
        // outside of swimming pool
        if (this.isWater == false && this.isSwimming == true) {
            this.isSwimming = false;
            this.SetSwimmingAnim();
        }
        // inside of swimming pool
        else if (this.isWater == true && this.isSwimming == false) {
            this.isSwimming = true;
            this.SetSwimmingAnim();

            if (this.swimCoroutine != null)
            {
                this.StopCoroutine(this.swimCoroutine);
            }
            
            this.swimCoroutine = this.StartCoroutine(this.InvisiblePlate());
        }

        if (this.isSwimming == true) {
            this.PlaySwimmingAnim();
        }
    }
    
    private PlaySwimmingAnim(): void{
        // 위 움직임 임계치 설정
        if (this.cc.velocity.y > 2.5) {
            this.animRotate.localRotation = Quaternion.Lerp(Quaternion.identity, this.swimUpRotation, Time.fixedDeltaTime * 30);
        }
        else {
            this.animRotate.localRotation = Quaternion.Lerp(this.animRotate.localRotation, Quaternion.identity, Time.fixedDeltaTime * 2);
        }

        // 앞뒤좌우 움직임 임계치 설정
        if (this.cc.velocity.magnitude > 2) {
            this.swimmingRatio = Mathf.Lerp(this.swimmingRatio, 1, 10 * Time.fixedDeltaTime);
        }
        else {
            this.swimmingRatio = Mathf.Lerp(this.swimmingRatio, 0, 10 * Time.fixedDeltaTime);
        }

        this.myAnim.SetFloat("swimmingRatio", this.swimmingRatio);
    }

    private SetSwimmingAnim(): void{
        if (this.isSwimming) {
            this.myAnim.SetLayerWeight(1, 1);
        }
        else {
            this.myAnim.SetLayerWeight(1, 0);
            this.animRotate.localRotation = Quaternion.identity;
        }
    }

    private *InvisiblePlate() {
        while (this.isSwimming) {
            if (this.cc.velocity.y < 0) {
                let go: GameObject = PlatePool.Instance.GetPlate();
                go.transform.position = this.transform.position;

                yield this.remainSec;

                PlatePool.Instance.ReturnPlate(go);
            }

            yield this.fixedSec;
        }
    }

    private defaultGravity: number = 50;
    private waterGravity: number = 3;
    private waterJumpower: number = -10;

    private OnTriggerStay(other: Collider): void {
        if (this.isWater == true)
            return;
            
        if (other.tag == "SwimmingArea") {
            this.isWater = true;

            let player: ZepetoPlayer = ZepetoPlayers.instance.GetPlayer(this.name);
            player.character.additionalJumpPower = this.waterJumpower;
            player.character.MotionV2.Gravity = this.waterGravity;
        }
    }

    private OnTriggerExit(other: Collider): void {
        if (this.isWater == false)
            return;

        if (other.tag == "SwimmingArea") {
            this.isWater = false;

            let player: ZepetoPlayer = ZepetoPlayers.instance.GetPlayer(this.name);
            player.character.additionalJumpPower = 0;
            player.character.MotionV2.Gravity = this.defaultGravity;
        }
    }
}