import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Collider } from 'UnityEngine'
import { ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import ClientStarter from '../ClientStarter';


export default class Riding extends ZepetoScriptBehaviour {

    private OnTriggerEnter(other:Collider): void {
        const player: ZepetoPlayer = ZepetoPlayers.instance.GetPlayer(other.gameObject.name);

        if (player != null) {
            other.transform.SetParent(this.transform);

            // if (player.id == ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id)
            // {
            //     ClientStarter.Instance.IsRiding = true;
            // }
        }
    }

    private OnTriggerExit(other: Collider): void{
        const player: ZepetoPlayer = ZepetoPlayers.instance.GetPlayer(other.gameObject.name);

        if (player != null)
        {
            other.transform.SetParent(null);

            // if (player.id == ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.id)
            // {
            //     ClientStarter.Instance.IsRiding = false;
            // }
        }
    }
}