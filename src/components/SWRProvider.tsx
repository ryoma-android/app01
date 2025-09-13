'use client';

import { SWRConfig } from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    try {
      const errorInfo = await res.json();
      console.error('Fetcher Error Info:', errorInfo);
      (error as any).info = errorInfo;
    } catch (e) {
      // The response might not be JSON.
      console.error('Fetcher Error Response Text:', await res.text());
    }
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
};

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SWRConfig value={{ fetcher }}>
      {children}
    </SWRConfig>
  );
}; 