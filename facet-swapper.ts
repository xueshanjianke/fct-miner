#!/usr/bin/env tsx
import 'dotenv/config';
import {
  createWalletClient, createPublicClient, http,
  formatUnits, parseUnits, type Address
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getNetworkConfig } from './config';
import { checkNetwork } from './check-network';
import { ERC20_ABI, UNIV2_ROUTER_ABI, WRAPPED_WITHDRAW_ABI } from './abi';

const conf = getNetworkConfig();
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const pub = createPublicClient({ transport: http(conf.facetRpcUrl) });
const wal = createWalletClient({ account, transport: http(conf.facetRpcUrl) });

async function approveIfNeeded(token: Address, spender: Address, amount: bigint) {
  const allowance: bigint = await pub.readContract({
    address: token, abi: ERC20_ABI, functionName: 'allowance', args: [account.address, spender]
  });
  if (allowance >= amount) return;
  const h = await wal.writeContract({
    address: token, abi: ERC20_ABI, functionName: 'approve', args: [spender, amount]
  });
  console.log('approve tx:', h);
  await pub.waitForTransactionReceipt({ hash: h, timeout: 180_000 });
}

async function quoteWethToWfct(amountIn: bigint) {
  const amounts = await pub.readContract({
    address: conf.router, abi: UNIV2_ROUTER_ABI, functionName: 'getAmountsOut',
    args: [amountIn, [conf.weth, conf.wfct]]
  });
  return amounts[1] as bigint;
}

async function swapWethToWfct(amountWeth: bigint, slippageBps = 50) {
  const [decWETH, decWFCT, symWETH, symWFCT] = await Promise.all([
    pub.readContract({ address: conf.weth, abi: ERC20_ABI, functionName: 'decimals' }),
    pub.readContract({ address: conf.wfct, abi: ERC20_ABI, functionName: 'decimals' }),
    pub.readContract({ address: conf.weth, abi: ERC20_ABI, functionName: 'symbol' }),
    pub.readContract({ address: conf.wfct, abi: ERC20_ABI, functionName: 'symbol' }),
  ]);

  const quoteOut = await quoteWethToWfct(amountWeth);
  const amountOutMin = (quoteOut * BigInt(10_000 - slippageBps)) / 10_000n;

  console.log(`🪙 WETH→wFCT: spend ${formatUnits(amountWeth, decWETH)} ${symWETH}, min receive ${formatUnits(amountOutMin, decWFCT)} ${symWFCT}`);

  await approveIfNeeded(conf.weth, conf.router, amountWeth);

  const deadline = BigInt(Math.floor(Date.now()/1000) + 600);
  const hash = await wal.writeContract({
    address: conf.router, abi: UNIV2_ROUTER_ABI, functionName: 'swapExactTokensForTokens',
    args: [amountWeth, amountOutMin, [conf.weth, conf.wfct] as unknown as Address[], account.address, deadline],
  });
  console.log('swap tx:', hash);
  const rec = await pub.waitForTransactionReceipt({ hash, timeout: 180_000 });
  console.log('✅ confirmed block:', rec.blockNumber);
}

async function swapWethToFct(amountWeth: bigint, slippageBps = 50) {
  // Step1: 先换到 wFCT
  await swapWethToWfct(amountWeth, slippageBps);

  // Step2: unwrap wFCT -> FCT（把钱包里所有 wFCT 都解包）
  const [decWFCT] = await Promise.all([
    pub.readContract({ address: conf.wfct, abi: ERC20_ABI, functionName: 'decimals' }),
  ]);
  const bal: bigint = await pub.readContract({
    address: conf.wfct, abi: ERC20_ABI, functionName: 'balanceOf', args: [account.address]
  });
  if (bal === 0n) {
    console.log('wFCT 余额 0，跳过 unwrap');
    return;
  }
  console.log('🔓 unwrap wFCT -> FCT:', formatUnits(bal, decWFCT));
  const h = await wal.writeContract({
    address: conf.wfct, abi: WRAPPED_WITHDRAW_ABI, functionName: 'withdraw', args: [bal]
  });
  console.log('unwrap tx:', h);
  await pub.waitForTransactionReceipt({ hash: h, timeout: 180_000 });
  console.log('✅ unwrap done');
}

async function main() {
  await checkNetwork();

  const [cmd, amountStr, slippageStr] = process.argv.slice(2);
  if (!cmd || !amountStr) {
    console.log('用法:');
    console.log('  tsx facet-swapper.ts quote <WETH数量>');
    console.log('  tsx facet-swapper.ts swap-wfct <WETH数量> [滑点bps]');
    console.log('  tsx facet-swapper.ts swap-fct  <WETH数量> [滑点bps]');
    process.exit(0);
  }

  const decWETH: number = await pub.readContract({ address: conf.weth, abi: ERC20_ABI, functionName: 'decimals' });
  const amountWeth = parseUnits(amountStr, decWETH);
  const slippage = slippageStr ? Number(slippageStr) : 50;

  if (cmd === 'quote') {
    const out = await quoteWethToWfct(amountWeth);
    console.log('预计获得 wFCT：', formatUnits(out, await pub.readContract({ address: conf.wfct, abi: ERC20_ABI, functionName: 'decimals' })));
    return;
  }

  if (cmd === 'swap-wfct') {
    await swapWethToWfct(amountWeth, slippage);
    return;
  }

  if (cmd === 'swap-fct') {
    await swapWethToFct(amountWeth, slippage);
    return;
  }

  console.log('未知命令:', cmd);
}

if (import.meta.main) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
