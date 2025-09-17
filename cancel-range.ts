// cancel-range.ts
import 'dotenv/config';
import { createPublicClient, createWalletClient, http, parseGwei } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getNetworkConfig } from './config';

const conf = getNetworkConfig();
const PK = process.env.PRIVATE_KEY as `0x${string}`;
const account = privateKeyToAccount(PK);
const pub = createPublicClient({ transport: http(conf.facetRpcUrl) });
const wal = createWalletClient({ account, transport: http(conf.facetRpcUrl) });

const FROM = Number(process.env.CANCEL_FROM_NONCE);
const TO   = Number(process.env.CANCEL_TO_NONCE);
let TIP    = Number(process.env.BASE_TIP_GWEI || 30);
let MAX    = Number(process.env.BASE_MAX_GWEI || Math.max(TIP*2, 60));
const BUMP = Number(process.env.BUMP_MULTIPLIER || 1.25);
const DELAY= Number(process.env.DELAY_MS || 1500);
const TIMEOUT = Number(process.env.TIMEOUT_MS || 180000);

function sleep(ms:number){ return new Promise(r=>setTimeout(r, ms)); }

async function cancelNonce(nonce:number) {
  for (let i=1;i<=8;i++) {
    try {
      const hash = await wal.sendTransaction({
        to: account.address,
        value: 0n,
        nonce,
        gas: 21000n,
        maxPriorityFeePerGas: parseGwei(TIP),
        maxFeePerGas: parseGwei(Math.max(MAX, TIP)),
      });
      console.log(`nonce=${nonce} try#${i} sent:`, hash, `tip=${TIP} max=${MAX}`);
      const rec = await pub.waitForTransactionReceipt({ hash, timeout: TIMEOUT });
      console.log(`nonce=${nonce} result:`, rec.status);
      return;
    } catch (e:any) {
      const msg = (e?.shortMessage || e?.message || '').toLowerCase();
      if (msg.includes('nonce too low') || msg.includes('already known')) { console.log(`nonce=${nonce} 已确认/占用`); return; }
      if (msg.includes('underpriced') || msg.includes('tip too low') || msg.includes('base fee')) {
        TIP = Number((TIP * BUMP).toFixed(6));
        MAX = Number((Math.max(MAX, TIP) * BUMP).toFixed(6));
        console.log(`nonce=${nonce} 加价重试 -> tip=${TIP} max=${MAX}`);
        await sleep(500);
        continue;
      }
      console.log(`nonce=${nonce} 失败:`, e?.shortMessage || e?.message);
      return;
    }
  }
  console.log(`nonce=${nonce} 达最大重试次数`);
}

async function main() {
  if (!Number.isFinite(FROM) || !Number.isFinite(TO)) {
    throw new Error('请在 .env 设置 CANCEL_FROM_NONCE / CANCEL_TO_NONCE');
  }
  const latest = await pub.getTransactionCount({ address: account.address, blockTag: 'latest' });
  const pending= await pub.getTransactionCount({ address: account.address, blockTag: 'pending' });
  console.log(`地址: ${account.address}, latest=${latest}, pendingTop=${pending}, 区间=[${FROM}..${TO}]`);

  for (let n=FROM; n<=TO; n++) {
    if (n < latest) { console.log(`nonce=${n} 已确认，跳过`); continue; }
    await cancelNonce(n);
    await sleep(DELAY);
  }
}

if (import.meta.main) {
  main().catch((e)=>{ console.error(e); process.exit(1); });
}
