import { verify } from "@node-rs/argon2";

const DUMMY_HASH = "$argon2id$v=19$m=19456,t=2,p=1$gtcRt3yZ550ibSk+lZCrFg$ZJdFs+J8k3shGF/vJleGqQDLa8ohBJgMw3/VpEZBHh4";
const REAL_HASH = "$argon2id$v=19$m=19456,t=2,p=1$1GO1rWSQwUXhZPA4um1bxQ$0icseKiWLtEp+j121HAUymoL7jaR1dXrk1G1kspyIxU";

async function run() {
  try {
    console.log("Testing DUMMY_HASH...");
    await verify(DUMMY_HASH, "wrongpassword");
    console.log("DUMMY_HASH verify successful (returned false expectedly).");
  } catch (err) {
    console.error("DUMMY_HASH error:", err);
  }

  try {
    console.log("Testing REAL_HASH...");
    await verify(REAL_HASH, "@Andriu3Dex@");
    console.log("REAL_HASH verify successful.");
  } catch (err) {
    console.error("REAL_HASH error:", err);
  }
}

run();
