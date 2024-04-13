import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {ZepetoWorldMultiplay} from 'ZEPETO.World'
import {Room, RoomData} from 'ZEPETO.Multiplay'
import {Player, State, Vector3} from 'ZEPETO.Multiplay.Schema'
import {CharacterState, SpawnInfo, ZepetoPlayer, ZepetoPlayers} from 'ZEPETO.Character.Controller'
import * as UnityEngine from "UnityEngine";
import PlayerController from './03.Scripts/PlayerController'
// import Footprint from './03.Scripts/Footprint'

export default class ClientStarter extends ZepetoScriptBehaviour {
    // 참고 : https://github.com/naverz/zepeto-studio-kor/discussions/504
    private static instance: ClientStarter;

    public static get Instance(): ClientStarter {
        if (this.instance == null) {
            this.instance = UnityEngine.GameObject.FindObjectOfType<ClientStarter>();
        }

        return this.instance;
    }

    private multiplay: ZepetoWorldMultiplay;
    private room: Room;
    private spawnPos: UnityEngine.Vector3 = new UnityEngine.Vector3(-18, 5.7, -0.68);
    private spawnRot: UnityEngine.Quaternion = new UnityEngine.Quaternion(0, -0.7, 0, 0.7);
    private waitTick: UnityEngine.WaitForSeconds = new UnityEngine.WaitForSeconds(0.03);

    // private gaohriCoroutine: UnityEngine.Coroutine;
    private isRiding: boolean;

    public set IsRiding(value: boolean)
    {
        this.isRiding = value;
    }

    @SerializeField()
    private gaohri: UnityEngine.GameObject;

    private Start() {
        this.multiplay = this.gameObject.GetComponent<ZepetoWorldMultiplay>();

        this.multiplay.RoomCreated += (room: Room) => {
            this.room = room;
        };

        this.multiplay.RoomJoined += (room: Room) => {
            room.OnStateChange += this.OnStateChange;
        };

        this.StartCoroutine(this.SendMessageLoop());
        // this.StartCoroutine(this.SendGaOhRiTransform());
    }

    // 일정 Interval Time으로 내(local)캐릭터 transform을 server로 전송합니다.
    private* SendMessageLoop() {
        while (true) {
            yield this.waitTick;

            if (this.room != null && this.room.IsConnected) {
                const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.room.SessionId);

                if (hasPlayer) {
                    const character = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character;
                    this.SendTransform(character.transform);
                    this.SendState(character.CurrentState, PlayerController.InstanceMap.get(character.gameObject).SwimmingRatio);
                }
            }
        }
    }

    private OnStateChange(state: State, isFirst: boolean) {
        // 첫 OnStateChange 이벤트 수신 시, State 전체 스냅샷을 수신합니다.
        if (isFirst) {
            // [RoomState] 현재 Room에 존재하는 player 인스턴스 생성
            state.players.ForEach((sessionId: string, player: Player) => this.OnJoinPlayer(sessionId, player));

            // [RoomState] 이후 Room에 입장하는 player 인스턴스 생성
            state.players.OnAdd += (player: Player, sessionId: string) => this.OnJoinPlayer(sessionId, player);

            // [RoomState] 이후 Room에서 퇴장하는 player 인스턴스 제거
            state.players.OnRemove += (player: Player, sessionId: string) => this.OnRemovePlayer(sessionId, player);

            // [CharacterController] 내 (Local)player 인스턴스 생성이 완료된 후, 초기화
            ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
                const myPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;

                let player: ZepetoPlayer = ZepetoPlayers.instance.GetPlayer(myPlayer.id);
                let playerObject = player.character.gameObject;

                playerObject.name = myPlayer.id;
                playerObject.tag = "Player";

                if (PlayerController.InstanceMap.get(playerObject) == null)
                {
                    playerObject.AddComponent<PlayerController>();
                }
                
                // if(Footprint.InstanceMap.get(playerObject) == null)
                //     playerObject.AddComponent<Footprint>();

                myPlayer.character.OnChangedState.AddListener((cur, next) => {
                    this.SendState(next, PlayerController.InstanceMap.get(playerObject).SwimmingRatio);
                });
            });

            // [CharacterController] 다른 player 인스턴스 생성이 완료된 후, 초기화
            ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId: string) => {
                const playerState: Player = this.room.State.players.get_Item(sessionId);

                let player: ZepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);
                let playerObject = player.character.gameObject;

                playerObject.name = sessionId;
                playerObject.tag = "Player";
                if(PlayerController.InstanceMap.get(playerObject) == null)
                    playerObject.AddComponent<PlayerController>();
                // if(Footprint.InstanceMap.get(playerObject) == null)
                //     playerObject.AddComponent<Footprint>();

                // [RoomState] player 인스턴스의 state가 갱신될 때마다 호출됩니다.
                playerState.OnChange += (changedValues) => {
                    const zepetoPlayer = ZepetoPlayers.instance.GetPlayer(sessionId);
                    let zepetoPlayerObject = zepetoPlayer.character.gameObject;

                    if (zepetoPlayer.isLocalPlayer === false) {
                        const position = this.ParseVector3(playerState.transform.position);

                        // 일정거리 이상 떨어지면 강제 위치이동
                        if (UnityEngine.Vector3.Distance(position, zepetoPlayer.character.transform.position) > 3) {
                            zepetoPlayer.character.transform.position = position;
                        }

                        zepetoPlayer.character.MoveToPosition(position);

                        if (playerState.state === CharacterState.JumpIdle || playerState.state === CharacterState.JumpMove) {
                            zepetoPlayer.character.Jump();
                        }
                        
                        let player = PlayerController.InstanceMap.get(zepetoPlayerObject);
                        
                        player.SwimmingRatio = playerState.swimmingRatio;
                        // this.gaohri.transform.SetPositionAndRotation(this.ParseVector3(playerState.gaohriTransform.position), UnityEngine.Quaternion.Euler(this.ParseVector3(playerState.gaohriTransform.rotation)));

                        // player.IsSeated = playerState.isSeated;

                        // TODO: <장경원> 앉기 작업 끝나면 지워주세요! - Hyeonwoo, 2022.06.30
                        // this.DebugPacket(player.IsSeated);
                    }
                };
            });
        }
    }

    private OnJoinPlayer(sessionId: string, player: Player) {
        const spawnInfo = new SpawnInfo();
        // const position = this.ParseVector3(player.transform.position);
        spawnInfo.position = this.spawnPos;
        spawnInfo.rotation = this.spawnRot;

        const isLocal = this.room.SessionId === player.sessionId;
        ZepetoPlayers.instance.CreatePlayerWithUserId(sessionId, player.zepetoUserId, spawnInfo, isLocal);
    }

    private OnRemovePlayer(sessionId: string, player: Player) {
        ZepetoPlayers.instance.RemovePlayer(sessionId);
    }

    private SendTransform(transform: UnityEngine.Transform) {
        const pos = new RoomData();

        pos.Add("x", transform.localPosition.x);
        pos.Add("y", transform.localPosition.y);
        pos.Add("z", transform.localPosition.z);

        const rot = new RoomData();

        rot.Add("x", transform.localEulerAngles.x);
        rot.Add("y", transform.localEulerAngles.y);
        rot.Add("z", transform.localEulerAngles.z);

        const data = new RoomData();

        data.Add("position", pos.GetObject());
        data.Add("rotation", rot.GetObject());

        this.room.Send("onChangedTransform", data.GetObject());
    }

    private SendState(state: CharacterState, swimmingRatio: float) {
        const data = new RoomData();
        data.Add("state", state);
        data.Add("swimmingRatio", swimmingRatio);

        this.room.Send("onChangedState", data.GetObject());
    }

    // private* SendGaOhRiTransform() {
    //     while (true)
    //     {
    //         yield this.waitTick;

    //         if (this.isRiding && this.room != null && this.room.IsConnected) {
    //             const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.room.SessionId);

    //             if (hasPlayer) {
    //                 const pos = new RoomData();

    //                 pos.Add("x", this.gaohri.transform.localPosition.x);
    //                 pos.Add("y", this.gaohri.transform.localPosition.y);
    //                 pos.Add("z", this.gaohri.transform.localPosition.z);

    //                 const rot = new RoomData();

    //                 rot.Add("x", this.gaohri.transform.localEulerAngles.x);
    //                 rot.Add("y", this.gaohri.transform.localEulerAngles.y);
    //                 rot.Add("z", this.gaohri.transform.localEulerAngles.z);

    //                 const data = new RoomData();

    //                 data.Add("position", pos.GetObject());
    //                 data.Add("rotation", rot.GetObject());

    //                 // this.DebugPacket(player.IsSeated);

    //                 this.room.Send("onChangedGaOhRiTransform", data.GetObject());;
    //             }
    //         }
    //     }
    // }

    // private SendIsSeat(isSeat: bool) {
    //     const data = new RoomData();
    //     data.Add("isSeat", isSeat);

    //     this.room.Send("onSeatChanged", data.GetObject());
    // }

    private ParseVector3(vector3: Vector3): UnityEngine.Vector3 {
        return new UnityEngine.Vector3
        (
            vector3.x,
            vector3.y,
            vector3.z
        );
    }

    // private DebugPacket(value): void {
    //     const data = new RoomData();
    //     data.Add("debugValue", value);

    //     this.room.Send("Debug", data.GetObject());
    // }
}