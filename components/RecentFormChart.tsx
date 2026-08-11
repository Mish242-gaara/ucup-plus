"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function RecentFormChart({ data }: { data: { label: string; goals: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-400">Pas encore de matchs joués.</p>;
  }

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#f3f4f6" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "#fdf1f1" }}
            contentStyle={{ borderRadius: 8, border: "1px solid #f5b9bb", fontSize: 12 }}
            formatter={(value: number) => [`${value} but(s)`, ""]}
          />
          <Bar dataKey="goals" fill="#d51f2a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
