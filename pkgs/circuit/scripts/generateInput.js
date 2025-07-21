const circomlib = require("circomlibjs");
const crypto = require("crypto");

/*
 * Compute pedersen hash
 */
const pedersenHash = async (data) => {
  const babyJub = await circomlib.buildBabyjub();
  const pedersenHasher = await circomlib.buildPedersenHash();

  // dataをUint8Arrayに変換
  let dataBytes;
  if (typeof data === "bigint") {
    // BigIntを32バイトのUint8Arrayに変換
    const hex = data.toString(16).padStart(64, "0");
    dataBytes = new Uint8Array(
      hex.match(/.{2}/g).map((byte) => parseInt(byte, 16)),
    );
  } else if (typeof data === "string") {
    dataBytes = new TextEncoder().encode(data);
  } else {
    dataBytes = data;
  }

  const hash = await pedersenHasher.hash(dataBytes);
  const point = babyJub.unpackPoint(hash);
  return point[0];
};

/**
 * String to byte
 */
const str2Hex = (data) => {
  var bytes = data.split("").map((char) => char.charCodeAt(0));
  var hexs = bytes.map((byte) => byte.toString(16));
  var hex = hexs.join("");
  return hex;
};

function generateRandomData(length, additionalString) {
  // 文字列を16進数に変換
  const stringBytes = Buffer.from(additionalString, "utf8");
  const stringHex = stringBytes.toString("hex");

  // バイト列を生成
  const randomBytes = crypto.randomBytes(Math.ceil(length / 2));
  // バイト列を16進数文字列に変換
  const hexString = randomBytes.toString("hex");

  // 文字列のhexを先頭に配置
  const combinedString = stringHex + hexString;
  // 16進数文字列をBigIntに変換
  const result = BigInt("0x" + combinedString);

  return result;
}

/**
 * サーキットInput用のデータを生成するスクリプト
 * @returns
 */
async function generateInputData() {
  console.log("-> Creating random secret....");
  const secret = "web3";
  console.log(`secret: ${secret}`);
  // 文字列を16進数に変換
  const hexSectet = generateRandomData(76, secret);
  console.log("hexSectet:", hexSectet.toString());

  const hash = await pedersenHash(hexSectet);
  console.log("Raw hash:", hash);

  // Uint8ArrayをBigIntに変換
  let hashBigInt;
  if (hash instanceof Uint8Array) {
    // Uint8Arrayを16進数文字列に変換してからBigIntに
    const hexString =
      "0x" +
      Array.from(hash)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    hashBigInt = BigInt(hexString);
  } else {
    hashBigInt = BigInt(hash.toString());
  }

  console.log("secretHash:", hashBigInt.toString());

  return {
    secret: hexSectet.toString(),
    hash: hashBigInt.toString(),
  };
}

generateInputData();

/*
 以下、荒巻さんのサンプルスクリプト
 const snarkjs = require('snarkjs');
  const crypto = require('crypto');
  const circomlib = require('circomlib');

  const rbigint = (nbytes) => snarkjs.bigInt.leBuff2int(crypto.randomBytes(nbytes));

  const pedersenHash = (data) => circomlib.babyJub.unpackPoint(circomlib.pedersenHash.hash(data))[0];


  const main = () => {
    const secret = rbigint(31);
    // const secret = snarkjs.bigInt.leBuff2int(Buffer.from("aaa", 'utf8'));;
    const hash = pedersenHash(secret.leInt2Buff(31));

    console.log({secret, hash})
  }

  main();
 */
