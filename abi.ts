// abi.ts
export const ERC20_ABI = [
  { type:'function', name:'decimals',  stateMutability:'view', inputs:[], outputs:[{type:'uint8'}] },
  { type:'function', name:'symbol',    stateMutability:'view', inputs:[], outputs:[{type:'string'}] },
  { type:'function', name:'balanceOf', stateMutability:'view', inputs:[{name:'o', type:'address'}], outputs:[{type:'uint256'}] },
  { type:'function', name:'allowance', stateMutability:'view', inputs:[{name:'o', type:'address'},{name:'s', type:'address'}], outputs:[{type:'uint256'}] },
  { type:'function', name:'approve',   stateMutability:'nonpayable', inputs:[{name:'s', type:'address'},{name:'a', type:'uint256'}], outputs:[{type:'bool'}] },
] as const;

export const UNIV2_ROUTER_ABI = [
  { type:'function', name:'getAmountsOut', stateMutability:'view',
    inputs:[{name:'amountIn', type:'uint256'},{name:'path', type:'address[]'}],
    outputs:[{name:'amounts', type:'uint256[]'}]
  },
  { type:'function', name:'swapExactTokensForTokens', stateMutability:'nonpayable',
    inputs:[
      {name:'amountIn', type:'uint256'},
      {name:'amountOutMin', type:'uint256'},
      {name:'path', type:'address[]'},
      {name:'to', type:'address'},
      {name:'deadline', type:'uint256'}
    ],
    outputs:[{type:'uint256[]'}]
  },
] as const;

export const WRAPPED_WITHDRAW_ABI = [
  { type:'function', name:'withdraw', stateMutability:'nonpayable', inputs:[{name:'wad', type:'uint256'}], outputs:[] }
] as const;
