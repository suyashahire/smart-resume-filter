'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const html = document.documentElement;
    const check = () => setIsDark(html.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

function EmptyChartState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 dark:text-gray-500 gap-3">
      <Icon className="h-12 w-12 opacity-40" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

interface SkillsChartProps {
  data: { skill: string; count: number }[];
}

export function SkillsDistributionChart({ data }: SkillsChartProps) {
  const isDark = useDarkMode();
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];

  if (!data || data.length === 0) {
    return <EmptyChartState icon={BarChart3} message="No skills data available" />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke={isDark ? '#374151' : '#e5e7eb'} />
        <XAxis dataKey="skill" tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} axisLine={{ stroke: isDark ? '#4b5563' : '#e5e7eb' }} />
        <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }} axisLine={{ stroke: isDark ? '#4b5563' : '#e5e7eb' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
            borderRadius: '12px',
            color: isDark ? '#f3f4f6' : '#111827',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Legend wrapperStyle={{ color: isDark ? '#d1d5db' : '#374151' }} />
        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface ScoreDistributionProps {
  data: { range: string; count: number }[];
}

export function ScoreDistributionChart({ data }: ScoreDistributionProps) {
  const isDark = useDarkMode();
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
        fill={isDark ? '#d1d5db' : (colorMap[range] || '#666')}
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
    return <EmptyChartState icon={PieChartIcon} message="No score data available" />;
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
          contentStyle={{
            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
            borderRadius: '12px',
            color: isDark ? '#f3f4f6' : '#111827',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Legend 
          formatter={(value) => {
            const item = data.find(d => d.range === value);
            const percent = total > 0 && item ? ((item.count / total) * 100).toFixed(0) : 0;
            return `${value}: ${percent}%`;
          }}
          wrapperStyle={{ color: isDark ? '#d1d5db' : '#374151' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface PerformanceTrendProps {
  data: { name: string; score: number }[];
}

export function PerformanceTrendChart({ data }: PerformanceTrendProps) {
  const isDark = useDarkMode();

  if (!data || data.length === 0) {
    return <EmptyChartState icon={TrendingUp} message="No performance data available" />;
  }

  // Gradient colors based on score
  const getBarColor = (score: number) => {
    if (score >= 75) return '#10b981'; // green
    if (score >= 60) return '#3b82f6'; // blue
    if (score >= 45) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke={isDark ? '#374151' : '#e5e7eb'} />
        <XAxis 
          dataKey="name" 
          tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: isDark ? '#4b5563' : '#e5e7eb' }}
        />
        <YAxis 
          domain={[0, 100]}
          tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: isDark ? '#4b5563' : '#e5e7eb' }}
        />
        <Tooltip 
          formatter={(value: number) => [`${value}%`, 'Score']}
          contentStyle={{ 
            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
            border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
            borderRadius: '12px',
            color: isDark ? '#f3f4f6' : '#111827',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend wrapperStyle={{ color: isDark ? '#d1d5db' : '#374151' }} />
        <Bar 
          dataKey="score" 
          name="Match Score"
          radius={[8, 8, 0, 0]}
          fill="#3b82f6"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

