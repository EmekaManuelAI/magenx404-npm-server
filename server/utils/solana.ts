import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

// Use environment variable or default to mainnet
const RPC_URL =
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const connection = new Connection(RPC_URL, "confirmed");

/**
 * Get token balance for a specific mint
 */
export async function getTokenBalance(
  walletAddress: string,
  mintAddress: string
): Promise<string> {
  try {
    const walletPubkey = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(mintAddress);

    const ata = await getAssociatedTokenAddress(mintPubkey, walletPubkey);
    const accountInfo = await getAccount(connection, ata);

    return accountInfo.amount.toString();
  } catch (error) {
    // Token account doesn't exist or other error
    return "0";
  }
}

/**
 * Get all token balances for a wallet
 */
export async function getAllTokenBalances(
  walletAddress: string
): Promise<Record<string, string>> {
  try {
    const walletPubkey = new PublicKey(walletAddress);

    // Get all token accounts
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPubkey,
      {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      }
    );

    const balances: Record<string, string> = {};
    for (const account of tokenAccounts.value) {
      const mint = account.account.data.parsed.info.mint;
      const amount = account.account.data.parsed.info.tokenAmount.amount;
      balances[mint] = amount;
    }

    return balances;
  } catch (error) {
    console.error("Error getting token balances:", error);
    return {};
  }
}

/**
 * Get wallet's first transaction timestamp
 */
export async function getFirstTransactionTimestamp(
  walletAddress: string
): Promise<Date | null> {
  try {
    const walletPubkey = new PublicKey(walletAddress);

    // Get signatures (oldest first)
    const signatures = await connection.getSignaturesForAddress(walletPubkey, {
      limit: 1,
      before: undefined,
    });

    if (signatures.length === 0) {
      return null;
    }

    // Get the oldest transaction
    const oldestSignature = signatures[signatures.length - 1];
    const transaction = await connection.getTransaction(
      oldestSignature.signature,
      {
        maxSupportedTransactionVersion: 0,
      }
    );

    if (transaction && transaction.blockTime) {
      return new Date(transaction.blockTime * 1000);
    }

    return null;
  } catch (error) {
    console.error("Error getting first transaction:", error);
    return null;
  }
}

/**
 * Get transaction count within time period
 */
export interface TransactionCountResult {
  count: number;
  volume: number;
}

export async function getTransactionCount(
  walletAddress: string,
  days: number,
  transactionTypes: string[] = []
): Promise<TransactionCountResult> {
  try {
    const walletPubkey = new PublicKey(walletAddress);
    const now = Date.now();
    const timeLimit = now - days * 24 * 60 * 60 * 1000;

    // Get recent signatures
    const signatures = await connection.getSignaturesForAddress(walletPubkey, {
      limit: 1000, // Adjust as needed
    });

    let count = 0;
    let volume = 0;

    for (const sigInfo of signatures) {
      // Check if transaction is within time period
      if (sigInfo.blockTime && sigInfo.blockTime * 1000 < timeLimit) {
        break; // Transactions are ordered newest first
      }

      // Get transaction details
      try {
        const transaction = await connection.getTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (
          transaction &&
          transaction.blockTime &&
          transaction.blockTime * 1000 >= timeLimit
        ) {
          // Check transaction type if specified
          if (
            transactionTypes.length === 0 ||
            matchesTransactionType(transaction, transactionTypes)
          ) {
            count++;
            // Calculate volume (simplified - you may need more sophisticated logic)
            volume += calculateTransactionVolume(transaction);
          }
        }
      } catch (err) {
        // Skip if transaction fetch fails
        continue;
      }
    }

    return { count, volume };
  } catch (error) {
    console.error("Error getting transaction count:", error);
    return { count: 0, volume: 0 };
  }
}

/**
 * Check if transaction matches specified types
 */
function matchesTransactionType(
  transaction: Awaited<ReturnType<typeof connection.getTransaction>>,
  types: string[]
): boolean {
  if (!transaction) return false;

  // Simplified implementation
  // In production, you'd analyze the transaction instructions more carefully
  // Handle both legacy and versioned transactions
  const message = transaction.transaction.message;
  const instructions =
    "instructions" in message
      ? message.instructions
      : "staticAccountKeys" in message
      ? []
      : [];

  for (const type of types) {
    if (type.toLowerCase() === "transfer") {
      // Check for transfer instructions
      if (
        instructions.some(
          (ix: any) =>
            ix.programId &&
            ix.programId.toString() === "11111111111111111111111111111111"
        )
      ) {
        return true;
      }
    }
    if (type.toLowerCase() === "swap") {
      // Check for swap programs (e.g., Jupiter, Raydium)
      const swapPrograms = [
        "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", // Jupiter
        "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // Raydium
      ];
      if (
        instructions.some((ix: any) =>
          swapPrograms.includes(ix.programId?.toString())
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculate transaction volume (simplified)
 */
function calculateTransactionVolume(
  transaction: Awaited<ReturnType<typeof connection.getTransaction>>
): number {
  // Simplified volume calculation
  // In production, you'd need to:
  // 1. Parse token transfers
  // 2. Get token prices
  // 3. Calculate USD value
  // For now, return a placeholder
  return 0;
}

/**
 * Get token holding duration
 */
export async function getTokenHoldingDuration(
  walletAddress: string,
  mintAddress: string
): Promise<Date | null> {
  try {
    const walletPubkey = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(mintAddress);

    const ata = await getAssociatedTokenAddress(mintPubkey, walletPubkey);

    // Get transaction history for this token account
    const signatures = await connection.getSignaturesForAddress(ata, {
      limit: 1000,
    });

    if (signatures.length === 0) {
      return null; // No transactions found
    }

    // Get the oldest transaction (first time token was received)
    const oldestSignature = signatures[signatures.length - 1];
    const transaction = await connection.getTransaction(
      oldestSignature.signature,
      {
        maxSupportedTransactionVersion: 0,
      }
    );

    if (transaction && transaction.blockTime) {
      return new Date(transaction.blockTime * 1000);
    }

    return null;
  } catch (error) {
    console.error("Error getting token holding duration:", error);
    return null;
  }
}

/**
 * Check debt across protocols
 */
export interface DebtInfo {
  totalDebt: string;
  protocolDebts: Record<string, string>;
}

export async function checkDebt(
  walletAddress: string,
  protocols: string[]
): Promise<DebtInfo> {
  // This is a placeholder implementation
  // In production, you would:
  // 1. Query each protocol's API/contract
  // 2. Check for outstanding loans/debts
  // 3. Sum total debt

  // For now, return 0 (no debt)
  return {
    totalDebt: "0",
    protocolDebts: {},
  };
}
