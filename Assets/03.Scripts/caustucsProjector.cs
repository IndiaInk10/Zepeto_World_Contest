using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class caustucsProjector : MonoBehaviour
{
	public Projector pr;
	public int framePerSecond = 30;
	public Texture[] causticsTex;

	void Start()
	{
		pr = GetComponent<Projector>();
	}

	void Update()
	{
		int causticsIndex = (int)(Time.time * framePerSecond) % causticsTex.Length;
		pr.material.SetTexture("_MainTex", causticsTex[causticsIndex]);
	}

}
