// config.ts
import 'dotenv/config';

export type NetworkConfig = {
  facetRpcUrl: string;
  facetChainId: number;
  router: `0x${string}`;
  weth: `0x${string}`;
  wfct: `0x${string}`;
};

function assertHex20(name: string, v?: string): asserts v is `0x${string}` {
  if (!v || !/^0x[0-9a-fA-F]{40}$/.test(v)) throw new Error(`环境变量 ${name} 无效: ${v}`);
}

export function getNetworkConfig(): NetworkConfig {
  const facetRpcUrl = process.env.FACET_RPC_URL || 'https://mainnet.facet.org';
  const facetChainId = Number(process.env.FACET_CHAIN_ID);
  if (!Number.isFinite(facetChainId)) throw new Error('请在 .env 设置 FACET_CHAIN_ID');

  const router = process.env.ROUTER as `0x${string}`;
  const weth   = process.env.WETH   as `0x${string}`;
  const wfct   = process.env.WFCT   as `0x${string}`;
  for (const [k, v] of Object.entries({ ROUTER: router, WETH: weth, WFCT: wfct })) assertHex20(k, v);

  return { facetRpcUrl, facetChainId, router, weth, wfct };
}

export function getCurrentNetwork() {
  return 'facet-mainnet';
}
export function isMainnet() {
  return true;
}
