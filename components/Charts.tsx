'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface SkillsChartProps {
  data: { skill: string; count: number }[];
}

export function SkillsDistributionChart({ data }: SkillsChartProps) {
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="skill" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface ScoreDistributionProps {
  data: { range: string; count: number }[];
}

export function ScoreDistributionChart({ data }: ScoreDistributionProps) {
  // Define colors for each range (in order: 0-44, 45-59, 60-74, 75-100)
  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'];
  
  // Filter out zero values to avoid overlapping labels
  const filteredData = data.filter(item => item.count > 0);
  
  // Create a color map based on range
  const colorMap: { [key: string]: string } = {
    '0-44': '#ef4444',
    '45-59': '#f59e0b', 
    '60-74': '#10b981',
    '75-100': '#3b82f6'
  };

  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Custom label renderer that positions labels outside the pie
  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, range, count }: {
    cx: number;
    cy: number;
    midAngle: number;
    outerRadius: number;
    range: string;
    count: number;
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const percent = total > 0 ? ((count / total) * 100).toFixed(0) : 0;

    return (
      <text
        x={x}
        y={y}
        fill={colorMap[range] || '#666'}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={14}
        fontWeight={600}
      >
        {`${range}: ${percent}%`}
      </text>
    );
  };

  // If no data has counts, show a message
  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        No score data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          labelLine={true}
          label={renderCustomLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
          nameKey="range"
        >
          {filteredData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colorMap[entry.range] || COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => {
            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return [`${value} candidates (${percent}%)`, 'Count'];
          }}
        />
        <Legend 
          formatter={(value) => {
            const item = data.find(d => d.range === value);
            const percent = total > 0 && item ? ((item.count / total) * 100).toFixed(0) : 0;
            return `${value}: ${percent}%`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface PerformanceTrendProps {
  data: { name: string; score: number }[];
}

export function PerformanceTrendChart({ data }: PerformanceTrendProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}

