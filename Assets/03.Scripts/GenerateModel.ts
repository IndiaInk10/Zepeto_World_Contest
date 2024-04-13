import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoCharacterCreator, ZepetoCharacter, SpawnInfo } from 'ZEPETO.Character.Controller';
import { AnimationClip, WaitForSeconds, Vector3 } from 'UnityEngine';

export default class GenerateModel extends ZepetoScriptBehaviour {
    public id: string;
    public scale: float = 2.5;
    public animClip: AnimationClip;
    private spawnInfo: SpawnInfo = new SpawnInfo();

    private Start(): void {
        this.spawnInfo.position = this.transform.position;
        this.spawnInfo.rotation = this.transform.rotation;
        ZepetoCharacterCreator.CreateByZepetoId(this.id, this.spawnInfo, (character: ZepetoCharacter) => {
            character.transform.SetParent(this.transform);
            character.transform.localScale = new Vector3(this.scale, this.scale, this.scale);
            this.StartCoroutine(this.SetPose(character));
        })
    }

    *SetPose(model: ZepetoCharacter) {
        yield new WaitForSeconds(0.1);
        model.SetGesture(this.animClip);
    }
}