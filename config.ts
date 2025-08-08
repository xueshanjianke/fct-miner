import { mainnet, sepolia } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

export type NetworkConfig = {
  l1Chain: typeof mainnet | typeof sepolia;
  l1RpcUrl: string;
  facetChain: {
    id: number;
    name: string;
    nativeCurrency: {
      decimals: number;
      name: string;
      symbol: string;
    };
    rpcUrls: {
      default: { http: string[] };
      public: { http: string[] };
    };
    blockExplorers: {
      default: {
        name: string;
        url: string;
      };
    };
  };
  facetRpcUrl: string;
  fctWethPair?: string; // For swapping (if available)
};

const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  mainnet: {
    l1Chain: mainnet,
    l1RpcUrl: "https://ethereum-rpc.publicnode.com",
    facetChain: {
      id: 0xface7,
      name: "Facet",
      nativeCurrency: {
        decimals: 18,
        name: "Facet Compute Token",
        symbol: "FCT",
      },
      rpcUrls: {
        default: { http: ["https://mainnet.facet.org"] },
        public: { http: ["https://mainnet.facet.org"] },
      },
      blockExplorers: {
        default: {
          name: "Facet Explorer",
          url: "https://explorer.facet.org",
        },
      },
    },
    facetRpcUrl: "https://mainnet.facet.org",
    fctWethPair: "0x180eF813f5C3C00e37b002Dfe90035A8143CE233",
  },
  sepolia: {
    l1Chain: sepolia,
    l1RpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    facetChain: {
      id: 0xface71a, // Facet Sepolia chain ID (hypothetical - may need to be updated)
      name: "Facet Sepolia",
      nativeCurrency: {
        decimals: 18,
        name: "Facet Compute Token",
        symbol: "FCT",
      },
      rpcUrls: {
        default: { http: ["https://sepolia.facet.org"] },
        public: { http: ["https://sepolia.facet.org"] },
      },
      blockExplorers: {
        default: {
          name: "Facet Sepolia Explorer",
          url: "https://sepolia.explorer.facet.org",
        },
      },
    },
    facetRpcUrl: "https://sepolia.facet.org",
    // No trading pairs on testnet
  },
};

export function getNetworkConfig(): NetworkConfig {
  const network = process.env.NETWORK || "mainnet";

  if (!NETWORK_CONFIGS[network]) {
    throw new Error(
      `Unsupported network: ${network}. Supported networks: ${Object.keys(
        NETWORK_CONFIGS
      ).join(", ")}`
    );
  }

  const config = NETWORK_CONFIGS[network];

  // Allow RPC URL overrides from environment variables
  return {
    ...config,
    l1RpcUrl: process.env.L1_RPC_URL || config.l1RpcUrl,
    facetRpcUrl: process.env.FACET_RPC_URL || config.facetRpcUrl,
  };
}

export function getCurrentNetwork(): string {
  return process.env.NETWORK || "mainnet";
}

export function isMainnet(): boolean {
  return getCurrentNetwork() === "mainnet";
}

export function isSepolia(): boolean {
  return getCurrentNetwork() === "sepolia";
}
