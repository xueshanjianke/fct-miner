// check-network.ts
import 'dotenv/config';
import { createPublicClient, http } from 'viem';
import { getNetworkConfig } from './config';

export async function checkNetwork() {
  const conf = getNetworkConfig();
  const client = createPublicClient({ transport: http(conf.facetRpcUrl) });

  const chainId = await client.getChainId();
  if (chainId !== conf.facetChainId) {
    throw new Error(`RPC 链不匹配：期望 chainId=${conf.facetChainId}，实际=${chainId}。请确认使用 Facet 主网 RPC：${conf.facetRpcUrl}`);
  }

  // 关键合约必须是“有码合约”
  for (const [name, addr] of Object.entries({ ROUTER: conf.router, WETH: conf.weth, WFCT: conf.wfct })) {
    const code = await client.getCode({ address: addr });
    if (!code || code === '0x') throw new Error(`${name}=${addr} 在当前链上不是合约（疑似串链或地址填错）`);
  }

  console.log(`✅ 网络校验通过：chainId=${chainId}，RPC=${conf.facetRpcUrl}`);
}

if (import.meta.main) {
  checkNetwork().catch((e) => { console.error(e); process.exit(1); });
}
