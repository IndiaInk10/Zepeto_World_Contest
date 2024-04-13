using System;
using System.Collections;
using System.IO;
using System.Net.Http;
using System.Text;
using UnityEditor;
using UnityEditor.AssetImporters;
using UnityEngine;
using Zepeto;
using ZEPETO.Asset;

public class ZepetoStudioLoader : MonoBehaviour
{
    public const string VERSION = "1.0.0";

    public const string METADATA_URL =
        "https://api-studio.zepeto.me/api/settings/v1/asset_bundle_meta";

    [Serializable]
    public class ZepetoStudioMetadata
    {
        private static ZepetoStudioMetadata _studioMetadata;
        private static bool isInitialized;
        public static ZepetoStudioMetadata Metadata
        {
            get
            {
                if (_studioMetadata == null && isInitialized == false)
                {
                    isInitialized = true;
                    using (var client = new HttpClient())
                    {
                        var response = client.GetAsync(METADATA_URL).Result;
                        if (response.IsSuccessStatusCode)
                        {
                            var responseContent = response.Content;
                            string responseString = responseContent.ReadAsStringAsync().Result;
                            _studioMetadata = JsonUtility.FromJson<ZepetoStudioMetadata>(responseString);
                        }
                    }    
                }

                if (_studioMetadata == null)
                {
                    EditorUtility.DisplayDialog("ERROR", "Invalid studio metadata. please try again", "ok");
                    return null; 
                }

                if (VERSION != _studioMetadata.latestVersion)
                {
                    if (EditorUtility.DisplayDialog("New version", "A new version of zepeto studio has been released.",
                        "Download New version"))
                    {
                        Application.OpenURL(string.IsNullOrEmpty(_studioMetadata.downloadLink)
                            ? "https://studio.zepeto.me"
                            : _studioMetadata.downloadLink);
                    }
                    return null;
                }

                return _studioMetadata;
            }
        }
        [Serializable]
        public class AssetBundleMeta
        {
            public int polygonCount;
            public int textureCount;
            public int textureSize;
            public int vertexCount;
        }
        
        public string latestVersion;
        public string downloadLink;
        public AssetBundleMeta assetBundleMeta;
    }
    
    private ZepetoCharacterCustomLoader _loader;

    /////////////////////////////////////////////
    /// CLOTH
    /////////////////////////////////////////////
    [MenuItem("Assets/Zepeto Studio/Convert to ZEPETO style", false)]
    public static void ConvertCloth()
    {
        if (ZepetoEyeImporter.ConvertEyeValidate()) {
            ZepetoEyeImporter.ConvertEye();
            return;
        }
        
        ZepetoModelImporter.ConvertAsset<ZepetoClothConverter>();
    }

    [MenuItem("Assets/Zepeto Studio/Export as .zepeto", false, 100)]
    public static void Archive()
    {
        if (Selection.activeObject == null)
            return;
        
        var path = AssetDatabase.GetAssetPath(Selection.activeObject);
        var isPrefab = string.IsNullOrEmpty(path) == false && Path.GetExtension(path).Equals(".prefab", StringComparison.OrdinalIgnoreCase);

        var result = new StringBuilder();
        if (isPrefab) {
            var childRenderers = Selection.activeGameObject.GetComponentsInChildren<SkinnedMeshRenderer>();

            if (childRenderers == null || childRenderers.Length == 0) return;

            var statistics = ZepetoAssetBundleInfo.Create(Selection.activeGameObject);

            result.AppendLine("[ZEPETO STUDIO ARCHIVE RESULT]");

            var json = JsonUtility.ToJson(statistics, true);
            result.AppendLine("==============================");
            result.AppendLine(json);
            result.AppendLine("==============================");
        }
        var packResult = ZepetoAssetPackage.Pack(Selection.activeObject, isPrefab);
        result.Append(packResult);

        Debug.Log(result);
    }

    private ZepetoStudioMetadata _metadata;

    public TextAsset[] Deformations;

    private void Start()
    {
        _metadata = ZepetoStudioMetadata.Metadata;
        StartCoroutine(OnLoad());
    }

    private IEnumerator OnLoad()
    {
        _loader = GetComponent<ZepetoCharacterCustomLoader>();
        var internalResource =
            ZepetoStreamingAssets.GetAssetPath(ZepetoInitializer.InternalResourceAssetBundleName);
        var internalResourceRequest = ZepetoAssetBundleRequest.Create(internalResource);
        yield return internalResourceRequest;
        var assetBundle = internalResourceRequest.assetBundleRef.AssetBundle;
        var materials = Resources.LoadAll<Material>(ZepetoInitializer.BASE_MODEL_RESOURCE);
        foreach (var current in materials)
        {
            switch (current.name)
            {
                case "eye":
                    current.shader = assetBundle.LoadAsset<Shader>("assets/zepeto-sdk/resources-internal/eye.shader");
                    break;
                case "body":
                    current.shader = assetBundle.LoadAsset<Shader>("assets/zepeto-sdk/resources-internal/skin.shader");
                    break;
            }
        }

        _loader.enabled = true;
    }

    private GUIStyle guiStyle = new GUIStyle(); //create a new variable

    public void OnGUI()
    {
        if(_loader == null) return;


        if (this._loader.Context != null && this._loader.Context.IsInitialized)
        {
            float guiScale = Screen.width / 512.0f;
            var oldMatrix = GUI.matrix;
            GUI.matrix = Matrix4x4.Scale(new Vector3(guiScale, guiScale, guiScale)) *
                         Matrix4x4.Translate(new Vector3(0, 0, 0));


            GUILayout.BeginArea(new Rect(512 - 100, 0, 100, 512));
            GUILayout.BeginVertical();
            guiStyle.fontSize = 10;
            guiStyle.normal.textColor = Color.black;
            GUILayout.Label("Deformations ", guiStyle);
            if (GUILayout.Button("DEFAULT"))
            {
                _loader.Context.Metadata.SetDeformations(new ZepetoMetadata.DeformationItem[0]);
            }   
            foreach (var deformation in Deformations)
            {
                if(deformation == null) continue;
                if (GUILayout.Button(deformation.name))
                {
                    var deformations = ZepetoMetadata.DeformationItem.Parse(deformation.text);
                    _loader.Context.Metadata.SetDeformations(deformations);

                }    
            }
        
            GUILayout.EndVertical();
            GUILayout.EndArea();

            GUI.matrix = oldMatrix;
        }
        


    }

}

[ScriptedImporter(1, "zepeto")]
public class ZepetoStudioImporter : ScriptedImporter
{
    public override void OnImportAsset(AssetImportContext ctx)
    {
        var texture = Resources.Load<Texture2D>("zepeto-studio-icon");
        if(texture == null) return;
        ctx.AddObjectToAsset("Texture", texture, texture);
    }
}

#if UNITY_EDITOR
public class ZepetoImporter : AssetPostprocessor {
    private void OnPreprocessAsset() {
        if (Directory.Exists(assetPath) == false) return;
        AssetDatabase.ImportAsset(assetPath, ImportAssetOptions.ImportRecursive);
    }
    
    private void OnPreprocessModel() {
        if (assetImporter is ModelImporter modelImporter) {
            modelImporter.avatarSetup = ModelImporterAvatarSetup.CreateFromThisModel;
            modelImporter.meshOptimizationFlags = MeshOptimizationFlags.PolygonOrder;
            modelImporter.isReadable = true;
        }
    }
}
#endif
