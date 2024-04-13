import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Collider } from 'UnityEngine'
import Footprint from './Footprint';

export default class FootprintArea extends ZepetoScriptBehaviour {

    private OnTriggerEnter(other: Collider): void {
        if (other.tag == "Player") {
            Footprint.InstanceMap.get(other.gameObject).SetFootprint(true);
        }
    }
    private OnTriggerExit(other: Collider): void{
        if (other.tag == "Player") {
            Footprint.InstanceMap.get(other.gameObject).SetFootprint(false);
        }
    }

}