const snarkjs = require("snarkjs");
const fs = require("fs");

/**
 * 検証用のサンプルスクリプト
 */
async function run() {
  // 各ファイルまでのパス
  const WASM_PATH = "./PasswordHash_js/PasswordHash.wasm";
  const ZKEY_PATH = "./zkey/PasswordHash_final.zkey";
  const VKEY_PATH = "./zkey/verification_key.json"
  // input data
  const inputData = JSON.parse(fs.readFileSync("./data/input.json"));
  // generate input data
  // const { hexSecret, hash } = await generateInputData("web3");

  console.log("Input Data: ");
  console.log(inputData)

  const { 
    proof, 
    publicSignals 
  } = await snarkjs.groth16.fullProve(
    inputData, 
    WASM_PATH, 
    ZKEY_PATH
  );

  console.log("Proof: ");
  console.log(JSON.stringify(proof, null, 1));

  const vKey = JSON.parse(fs.readFileSync(VKEY_PATH));
  // 検証
  const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);

  if (res === true) {
    console.log("Verification OK");
  } else {
    console.log("Invalid proof");
  }

  // 失敗パターン
  const wrongInputData = JSON.parse(fs.readFileSync("./data/input_web3.json"));

  // proofの生成で失敗する
  const { 
    wrongProof, 
    wrongPublicSignals 
  } = await snarkjs.groth16.fullProve(
    wrongInputData, 
    WASM_PATH, 
    ZKEY_PATH
  );

  const wrongVKey = JSON.parse(fs.readFileSync(VKEY_PATH));
  // 検証
  const wrongRes = await snarkjs.groth16.verify(wrongVKey, wrongPublicSignals, wrongProof);

  if (wrongRes === true) {
    console.log("Verification OK");
  } else {
    console.log("Invalid proof");
  }
}

run().then(() => {
  process.exit(0);
});