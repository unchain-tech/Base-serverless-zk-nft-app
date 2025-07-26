import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * クラス名をマージするユーティリティ関数
 *
 * @param inputs マージするクラス名の配列
 * @returns マージされたクラス名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ZKNFTコントラクトのアドレス
export const ZKNFT_CONTRACT_ADDRESS =
  "0xa9Bf293B85E46079665019BE17a67B8D925572f7";
