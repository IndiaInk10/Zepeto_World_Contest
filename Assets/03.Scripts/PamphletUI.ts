import { TMP_Text } from 'TMPro';
import { Texture2D, Object, Vector3 } from 'UnityEngine';
import { Button, RawImage } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class PamphletUI extends ZepetoScriptBehaviour {
    public contents: Texture2D[] = null;
    public content: RawImage = null;
    @Tooltip("[ Index ] Left: 0 / Right: 1 / Close: 2")
    public buttons: Button[] = null;
    public lenText: TMP_Text = null;

    @SerializeField()
    private scaling: Vector3 = Vector3.zero;
    private contentLen: int = 0;
    private index: int = 0;

    Start() {    
        this.contentLen = this.contents.length;
        if (this.contentLen == 1) {
            this.lenText.gameObject.SetActive(false);
            this.buttons[0].gameObject.SetActive(false);
            this.buttons[1].gameObject.SetActive(false);

            this.content.rectTransform.localPosition = Vector3.zero;
            this.content.rectTransform.localScale = this.scaling;
        }
        else{
            this.lenText.text = `1/${this.contentLen}`;
            // Left Button
            this.buttons[0].onClick.AddListener(() => this.ChangeImage(true));
            // Right Button
            this.buttons[1].onClick.AddListener(() => this.ChangeImage(false));
        }

        this.content.texture = this.contents[0];
        // Close Button
        this.buttons[2].onClick.AddListener(() => this.DestoryUI());
    }

    private ChangeImage(isLeft: boolean): void {
        if (isLeft)
            this.index--;
        else
            this.index++;
        
        this.index %= this.contentLen;
        if (this.index <= -1)
            this.index = this.contentLen - 1;
        
        this.content.texture = this.contents[this.index];
        this.lenText.text = `${this.index + 1}/${this.contentLen}`;
    }

    private DestoryUI(): void {
        Object.Destroy(this.gameObject);
    }
}