import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { MeshRenderer, Vector2, WaitForSeconds } from 'UnityEngine'

export default class MoveWallpaper extends ZepetoScriptBehaviour {
    public sec: float = 0.3;
    
    private wallpaper: MeshRenderer = null;
    private offsetX:float = 0;
    private offsetY:float = 0;
    private currentX: float = 0;
    private currentY: float = 0;
    private Start(): void {    
        this.wallpaper = this.gameObject.GetComponent<MeshRenderer>();
        this.offsetX = this.wallpaper.material.mainTextureScale.x;
        this.offsetY = this.wallpaper.material.mainTextureScale.y;

        this.StartCoroutine(this.ChangingWallpaper());
    }
    private Update(): void {
        this.offsetY = this.wallpaper.material.mainTextureScale.y;
    }

    *ChangingWallpaper() {
        while (true) {
            this.currentY += this.offsetY;
            
            if (this.currentY >= 1) {
                this.currentY = 0;
                this.currentX += this.offsetX;
                if (this.currentX >= 1)
                    this.currentX = 0;
            }

            this.wallpaper.material.mainTextureOffset = new Vector2(this.currentX, this.currentY)
            yield new WaitForSeconds(this.sec);
        }
    }
}