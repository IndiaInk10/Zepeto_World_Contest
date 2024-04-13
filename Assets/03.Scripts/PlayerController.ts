import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoPlayers, ZepetoPlayer } from 'ZEPETO.Character.Controller';
import { CharacterController, Quaternion, Mathf, GameObject, Transform, Time, Animator, Coroutine, Collider, Vector3 } from 'UnityEngine';
import PlatePool from './PlatePool';

enum PLAYERSTATE {
    WALK,
    SWIM = 3,
    TELEPORT,
    SIT,
}

export default class PlayerController extends ZepetoScriptBehaviour {
    public static InstanceMap: Map<GameObject, PlayerController> = new Map();
    public static PLAYERSTATE = PLAYERSTATE;

    private playerState: PLAYERSTATE = PLAYERSTATE.WALK;
    public get PlayerState(): PLAYERSTATE {
        return this.playerState;
    }
    public set PlayerState(value: PLAYERSTATE) {
        this.playerState = value;
    }
    private player: ZepetoPlayer = null;


    // Variables for SWIM STATE
    // Swimming Animation
    private cc: CharacterController = null;
    private myAnim: Animator = null;
    private isSwimLayer: bool = false;
    private swimmingRatio: float = 0.0;
    public get SwimmingRatio(): float {
        return this.swimmingRatio;
    }
    public set SwimmingRatio(value: float) {
        this.swimmingRatio = value;
    }
    private animRotate: Transform = null;
    private swimUpRotation: Quaternion = Quaternion.Euler(-100, 0, 0);
    // Invisible Plate Coroutine
    private swimCoroutine: Coroutine = null;
    private recentPlate: GameObject = null;
    // Swimming Gravity
    private defaultGravity: number = 50;
    private waterGravity: number = 1.5;
    private waterJumpower: number = -10.25;


    // Variable for TELEPORT STATE
    private teleportingTime: float = 0.1;
    private timeCount: float = 0.0;
    private wasNotTeleport: bool = false;
    public dest: Vector3 = null;

    private isSeated: bool = false;
    public get IsSeated(): bool {
        return this.isSeated;
    }
    public set IsSeated(value: bool) {
        this.isSeated = value;
    }

    private Awake(): void {
        PlayerController.InstanceMap.set(this.gameObject, this);
    }


    private Start(): void {    
        this.player = ZepetoPlayers.instance.GetPlayer(this.name);
        this.cc = this.gameObject.GetComponent<CharacterController>();
        this.myAnim = ZepetoPlayers.instance.GetPlayer(this.name).character.ZepetoAnimator;
        this.animRotate = this.gameObject.GetComponentsInChildren<Transform>()[1];
    }


    private Update(): void {
        switch (this.playerState) {
            case PLAYERSTATE.WALK:
                this.UpdateWalk();
                break;
            case PLAYERSTATE.SWIM:
                this.UpdateSwim();
                break;
            case PLAYERSTATE.TELEPORT:
                this.UpdateTeleport();
                break;
            case PLAYERSTATE.SIT:
                this.UpdateSit();
                break;
        }
    }

    private UpdateWalk(): void {
        if (this.isSwimLayer == true) {
            if (this.recentPlate != null) {
                PlatePool.Instance.ReturnPlate(this.recentPlate);
                this.recentPlate = null;
            }
            this.myAnim.SetLayerWeight(1, 0);
            this.animRotate.localRotation = Quaternion.identity;
            this.isSwimLayer = false;
        }

        this.player.character.additionalJumpPower = 0;
        this.player.character.MotionV2.Gravity = this.defaultGravity;
    }


    private UpdateSwim(): void {
        if (this.isSwimLayer == true) {
            if (this.wasNotTeleport == true) {
                this.ResetInvisiblePlate();
                this.wasNotTeleport = false;
            }
        }
        else {
            this.myAnim.SetLayerWeight(1, 1);
            this.ResetInvisiblePlate();
            this.isSwimLayer = true;
        }

        this.player.character.additionalJumpPower = this.waterJumpower;
        this.player.character.MotionV2.Gravity = this.waterGravity;

        this.SwimAnimation();
    }
    private ResetInvisiblePlate(): void {
        if (this.recentPlate != null) {
            PlatePool.Instance.ReturnPlate(this.recentPlate);
            this.recentPlate = null;
        }
        if (this.swimCoroutine != null) {
            this.StopCoroutine(this.swimCoroutine);
        }
        this.swimCoroutine = this.StartCoroutine(this.CoInvisiblePlate());
    }
    private *CoInvisiblePlate() {
        while (this.playerState == PLAYERSTATE.SWIM) {
            this.recentPlate = PlatePool.Instance.GetPlate();
            if (this.cc.velocity.y < 0) {
                this.recentPlate.transform.position = this.transform.position;

                yield null;
            }
            PlatePool.Instance.ReturnPlate(this.recentPlate);

            yield null;
        }
    }
    private SwimAnimation(): void {
        // Set rotation about upward movement
        if (this.cc.velocity.y > 2.5) {
            this.animRotate.localRotation = Quaternion.Lerp(Quaternion.identity, this.swimUpRotation, Time.fixedDeltaTime * 30);
        }
        else {
            this.animRotate.localRotation = Quaternion.Lerp(this.animRotate.localRotation, Quaternion.identity, Time.fixedDeltaTime * 2);
        }

        // Set Animation about movement
        if (this.cc.velocity.magnitude > 2) {
            this.swimmingRatio = Mathf.Lerp(this.swimmingRatio, 1, 10 * Time.fixedDeltaTime);
        }
        else {
            this.swimmingRatio = Mathf.Lerp(this.swimmingRatio, 0, 10 * Time.fixedDeltaTime);
        }

        this.myAnim.SetFloat("swimmingRatio", this.swimmingRatio);
    }
    private OnTriggerStay(other: Collider): void {
        if (this.playerState == PLAYERSTATE.TELEPORT || this.playerState == PLAYERSTATE.SWIM || other.tag != "SwimmingArea")
            return;
            
        this.playerState = PLAYERSTATE.SWIM;
    }
    private OnTriggerExit(other: Collider): void {
        if (this.playerState == PLAYERSTATE.TELEPORT || this.playerState == PLAYERSTATE.WALK || other.tag != "SwimmingArea")
            return;

        this.playerState = PLAYERSTATE.WALK;
        this.wasNotTeleport = true;
    }


    private UpdateTeleport(): void {
        if (this.dest != null) {
            for (let i = 0; i < 6; i++){
                this.transform.position = this.dest;
            }
        }

        this.timeCount += Time.fixedDeltaTime;
        if (this.timeCount < this.teleportingTime) {
            return;
        }

        this.timeCount = 0.0;
        this.playerState = PLAYERSTATE.WALK;
    }


    private UpdateSit(): void {
        // Show StandUp UI
    }
}