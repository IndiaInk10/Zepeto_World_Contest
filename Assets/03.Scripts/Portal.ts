import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Transform, Collider, GameObject, Object, Resources } from 'UnityEngine'
import * as vop from './Vector3Operators';
import PlayerController from './PlayerController';

export default class Portal extends ZepetoScriptBehaviour {
    private teleportEffect: GameObject;
    public destination: Transform;

    private Start(): void {
        this.teleportEffect = Resources.Load<GameObject>("PortalEffect");
    }

    private OnTriggerStay(other: Collider): void{
        if (other.tag != "Player")
            return;
        
        let playerController = PlayerController.InstanceMap.get(other.gameObject);
        if (playerController.PlayerState == PlayerController.PLAYERSTATE.TELEPORT)
            return;
        
        playerController.PlayerState = PlayerController.PLAYERSTATE.TELEPORT;
        playerController.dest = this.destination.position;
        
        let go = Object.Instantiate(this.teleportEffect) as GameObject;
            
        go.transform.position = vop.Add(this.destination.position, go.transform.position);
        Object.Destroy(go, 2);
    }
}