import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: Array<{
    date: string;
    gain: number;
  }>;
  title: string;
}

const InvestmentGainsChart: React.FC<Props> = ({ data, title }) => {
  return (
    <div className="w-full bg-white shadow-md rounded-xl p-4 border">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">{title}</h2>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="gain"
            stroke="#4f46e5"
            strokeWidth={3}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default InvestmentGainsChart;
