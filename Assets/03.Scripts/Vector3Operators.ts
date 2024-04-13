import {Vector3} from 'UnityEngine'

export function Add(vector1: Vector3, vector2: Vector3): Vector3 {
    return new Vector3(vector1.x + vector2.x, vector1.y + vector2.y, vector1.z + vector2.z);
}

export function Sub(vector1: Vector3, vector2: Vector3): Vector3 {
    return new Vector3(vector1.x - vector2.x, vector1.y - vector2.y, vector1.z - vector2.z);
}

export function Multi(vector: Vector3, multiNum: float): Vector3 {
    return new Vector3(vector.x * multiNum, vector.y * multiNum, vector.z * multiNum);
}