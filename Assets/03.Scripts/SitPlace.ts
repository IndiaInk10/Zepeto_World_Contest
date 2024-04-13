import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { AnimationClip, Collider, GameObject, Camera, Transform, Vector3, Canvas } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import PlayerController from './PlayerController';

export default class SitPlace extends ZepetoScriptBehaviour {
    @SerializeField()
    private sitPos: Transform = null;
    @SerializeField()
    private sitAnim: AnimationClip = null;
    @SerializeField()
    private sitCanvas: Canvas = null;
    @SerializeField()
    private buttons: Button[] = null;
    private camera: Camera = null;
    private isSit: bool = false;
    private standPos: Vector3 = null;


    private Start(): void {
        this.camera = GameObject.FindObjectOfType<Camera>();
        this.sitCanvas.worldCamera = this.camera;
        this.buttons[0].onClick.AddListener(() => { this.OnClickSit(); });
        this.buttons[1].onClick.AddListener(() => { this.OnClickStand(); });
        this.buttons[0].gameObject.SetActive(false);
        this.buttons[1].gameObject.SetActive(false);
        this.standPos = this.sitPos.TransformPoint(Vector3.forward);
    }


    private Update(): void {
        if (!this.buttons[0].gameObject.activeSelf)
            return;
        if (PlayerController.InstanceMap.get(ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject).PlayerState == PlayerController.PLAYERSTATE.SIT) {
            this.buttons[0].gameObject.SetActive(false);
            return;
        }
        
        this.buttons[0].transform.rotation = this.camera.transform.rotation;
    }


    private OnClickSit(): void {
        this.buttons[0].gameObject.SetActive(false);
        this.buttons[1].gameObject.SetActive(true);
        let localPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        PlayerController.InstanceMap.get(localPlayer.gameObject).PlayerState = PlayerController.PLAYERSTATE.SIT;
        for (let i = 0; i < 6; i++) {
            localPlayer.transform.position = this.sitPos.position;
            localPlayer.transform.rotation = this.sitPos.rotation;
        }
        localPlayer.SetGesture(this.sitAnim);
    }
    private OnClickStand(): void {
        this.buttons[1].gameObject.SetActive(false);
        this.buttons[0].gameObject.SetActive(true);
        let localPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        localPlayer.CancelGesture();
        for (let i = 0; i < 6; i++) {
            localPlayer.transform.position = this.standPos;
        }
        PlayerController.InstanceMap.get(localPlayer.gameObject).PlayerState = PlayerController.PLAYERSTATE.WALK;
    }


    private OnTriggerStay(other: Collider): void {
        if (PlayerController.InstanceMap.get(ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject).PlayerState == PlayerController.PLAYERSTATE.SIT || other.name != ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.name || this.buttons[0].gameObject.activeSelf)
            return;
        
        this.buttons[0].gameObject.SetActive(true);
    }
    private OnTriggerExit(other: Collider): void {
        if (other.name != ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.name || !this.buttons[0].gameObject.activeSelf)
            return;
        
        this.buttons[0].gameObject.SetActive(false);
    }
}