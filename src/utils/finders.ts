import { Property, Account } from '../types';

export function findPropertyById(properties: Property[], id: string | null | undefined): Property | undefined {
  if (!id) return undefined;
  return properties.find(p => p.id === id);
}

export function findAccountById(accounts: Account[], id: string | null | undefined): Account | undefined {
  if (!id) return undefined;
  return accounts.find(a => a.id === id);
} 