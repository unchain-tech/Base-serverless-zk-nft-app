// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ZKNFTModule = buildModule("ZKNFTModule", (m) => {
  // First deploy the PasswordHashVerifier contract
  const passwordHashVerifier = m.contract("PasswordHashVerifier", []);

  // Then deploy the ZKNFT contract with the verifier address
  const zknft = m.contract("ZKNFT", [passwordHashVerifier]);

  return {
    passwordHashVerifier,
    zknft,
  };
});

export default ZKNFTModule;
