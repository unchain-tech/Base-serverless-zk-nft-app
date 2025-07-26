import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import path from "node:path";
// @ts-ignore
const snarkjs = require("snarkjs");

/**
 * ZK Proofを生成するAPIエンドポイント
 */
export async function GET() {
  return NextResponse.json({
    message: "ZK Proof Generation API is running",
    endpoints: {
      POST: "/api/generate-proof",
      description: "Generate ZK proof from password",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { passwordNumber } = await request.json();

    if (!passwordNumber || typeof passwordNumber !== "string") {
      return NextResponse.json(
        { error: "パスワードが無効です" },
        { status: 400 },
      );
    }

    // 回路の入力データを作成
    const input = {
      password: passwordNumber,
      passwordHash: process.env.PASSWORD_HASH,
    };

    console.log("Input for proof generation:", input);

    // WAsmファイルとzkeyファイルのパスを設定
    const wasmPath = path.join(process.cwd(), "zk", "PasswordHash.wasm");
    const zkeyPath = path.join(process.cwd(), "zk", "PasswordHash_final.zkey");

    console.log("wasmPath:", wasmPath);

    // プルーフを生成
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath,
    );

    console.log("Proof generated successfully:", proof);

    // プルーフをフォーマット（コントラクト用）
    const solidityProof = {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]],
      ],
      c: [proof.pi_c[0], proof.pi_c[1]],
    };

    return NextResponse.json({
      success: true,
      data: {
        proof: solidityProof,
        publicSignals: publicSignals,
      },
    });
  } catch (error) {
    console.error("プルーフ生成エラー:", error);
    return NextResponse.json(
      { error: "プルーフの生成に失敗しました" },
      { status: 500 },
    );
  }
}
