// check-status.ts
import 'dotenv/config';
import { createPublicClient, http, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getNetworkConfig } from './config';
import { checkNetwork } from './check-network';
import { ERC20_ABI } from './abi';

async function main() {
  await checkNetwork();
  const conf = getNetworkConfig();
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const pub = createPublicClient({ transport: http(conf.facetRpcUrl) });

  const [eth, w, f, dw, df, sw, sf, allowW, allowF] = await Promise.all([
    pub.getBalance({ address: account.address }),
    pub.readContract({ address: conf.weth, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] }),
    pub.readContract({ address: conf.wfct, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address] }),
    pub.readContract({ address: conf.weth, abi: ERC20_ABI, functionName: 'decimals' }),
    pub.readContract({ address: conf.wfct, abi: ERC20_ABI, functionName: 'decimals' }),
    pub.readContract({ address: conf.weth, abi: ERC20_ABI, functionName: 'symbol' }),
    pub.readContract({ address: conf.wfct, abi: ERC20_ABI, functionName: 'symbol' }),
    pub.readContract({ address: conf.weth, abi: ERC20_ABI, functionName: 'allowance', args: [account.address, conf.router] }),
    pub.readContract({ address: conf.wfct, abi: ERC20_ABI, functionName: 'allowance', args: [account.address, conf.router] }),
  ]);

  console.log('地址:', account.address);
  console.log('L2 ETH :', formatUnits(eth, 18));
  console.log(`${sw}  :`, formatUnits(w, dw), '(allowance→router:', allowW.toString(), ')');
  console.log(`${sf}  :`, formatUnits(f, df), '(allowance→router:', allowF.toString(), ')');
}

if (import.meta.main) {
  main().catch((e)=>{ console.error(e); process.exit(1); });
}
