import { ethers } from "ethers";
import { SiweMessage } from "siwe";
import crypto from "crypto";
import * as dotenv from "dotenv";
dotenv.config();

/**
 * Helper script to generate a valid SIWE token for testing the API via Postman.
 * Run: npx tsx scripts/generate-siwe-token.ts
 */

async function main() {
  const domain = process.env.SIWE_DOMAIN || "localhost:3000";
  const origin = process.env.CORS_ORIGIN || "http://localhost:3000";
  const statement = "Sign in to Presight Backend API for testing.";

  // Create a random wallet for the test user
  const wallet = ethers.Wallet.createRandom();
  console.log("\n=======================================================");
  console.log("🔑  GENERATED TEST WALLET");
  console.log("=======================================================");
  console.log("Address:", wallet.address);
  console.log("Private Key:", wallet.privateKey);

  // Use the deployer wallet if you want to test resolver actions easily
  // const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!);
  
  const nonce = crypto.randomBytes(8).toString('hex');
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

  const siweMessage = new SiweMessage({
    domain,
    address: wallet.address,
    statement,
    uri: origin,
    version: "1",
    chainId: 31611,
    nonce: nonce,
    issuedAt: now.toISOString(),
    expirationTime: nextHour.toISOString(),
  });

  const message = siweMessage.prepareMessage();
  const signature = await wallet.signMessage(message);

  const tokenPayload = {
    message: message,
    signature: signature,
  };

  const token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64");

  console.log("\n=======================================================");
  console.log("🎫  SIWE TOKEN FOR POSTMAN");
  console.log("=======================================================");
  console.log(token);
  console.log("\nCopy and paste this token into your Postman 'siwe_token' variable.");
  console.log("=======================================================\n");
}

main().catch(console.error);
