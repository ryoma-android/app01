"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, Label } from "recharts";

type ChartData = {
  month: string;
  income: number;
  expense: number;
  profit: number;
};

interface PropertyChartProps {
  data: ChartData[];
}

export default function PropertyChart({ data }: PropertyChartProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 32, left: 0, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month">
            <Label value="月" offset={-8} position="insideBottom" />
          </XAxis>
          <YAxis />
          <Tooltip formatter={(value: number) => `${value.toLocaleString()}円`} />
          <Legend />
          <Bar dataKey="income" name="収入" fill="#34d399" />
          <Bar dataKey="expense" name="支出" fill="#f87171" />
          <Line type="monotone" dataKey="profit" name="利益" stroke="#6366f1" strokeWidth={2} dot />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 