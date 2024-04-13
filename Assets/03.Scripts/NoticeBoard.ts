import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Object, GameObject, Collider, Camera, Canvas } from 'UnityEngine'
import { Button } from 'UnityEngine.UI'

export default class NoticeBoard extends ZepetoScriptBehaviour {
    public pamphlet: GameObject = null;

    @SerializeField()
    private detailCanvas: Canvas = null;

    @SerializeField()
    private button: Button = null;
    private camera: Camera = null;
    private isDetail: bool = false;

    private go: GameObject = null;

    private Start(): void {
        this.camera = GameObject.FindObjectOfType<Camera>();
        this.detailCanvas.worldCamera = this.camera;
        this.button.onClick.AddListener(() => { this.OnClickDetail(); });
        this.button.gameObject.SetActive(false);
    }

    private Update(): void {
        if (this.IsRealNull(this.go) == false)
            return;
        
        this.button.transform.rotation = this.camera.transform.rotation;
        this.isDetail = false;
    }

    private OnClickDetail(): void {
        this.isDetail = true;
        this.button.gameObject.SetActive(false);
        
        if (this.IsRealNull(this.go) == false) {
            return;
        }

        this.go = Object.Instantiate(this.pamphlet) as GameObject;
    }
    
    private OnTriggerStay(other: Collider): void {
        if (this.isDetail || ZepetoPlayers.instance.LocalPlayer == null || other.name != ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.name || this.button.gameObject.activeSelf)
            return;
        
        this.button.gameObject.SetActive(true);
    }

    private OnTriggerExit(other: Collider): void {
        if (ZepetoPlayers.instance.LocalPlayer == null || other.name != ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.name || !this.button.gameObject.activeSelf)
            return;
        
        this.button.gameObject.SetActive(false);
    }

    // GameObject가 진짜 null인지를 검사한다...
    private IsRealNull(value: GameObject): bool {
        if(!value) return true;

        const valueString = value.ToString();
        return valueString === "null" || valueString === "undefined";
    }
    //(출처: https://github.com/naverz/zepeto-studio-kor/discussions/814#discussioncomment-2832580)
}