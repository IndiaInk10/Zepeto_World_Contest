import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Projector, Texture, Time } from 'UnityEngine';

export default class caustucsProjector extends ZepetoScriptBehaviour {
    public pr : Projector;
    public framePerSecond : int = 30;
    public causticsTex : Texture[] = [];

    private index: int = 0;
    private cycle: int = -1;    
    private timeCount: float = 0.05;
    private Start(): void {    
        this.pr = this.GetComponent<Projector>();
    }

    private Update(): void {
        this.timeCount += Time.deltaTime;

        if (this.timeCount < 0.05) {
            return;
        }
        this.timeCount = 0.0;

        if (this.index >= this.causticsTex.length - 1 || this.index <= 0) {
            this.cycle *= -1;
        }
        this.index += this.cycle * 1;
        this.pr.material.SetTexture("_MainTex", this.causticsTex[this.index]);
    }
}