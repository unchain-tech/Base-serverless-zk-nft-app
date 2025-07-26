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
