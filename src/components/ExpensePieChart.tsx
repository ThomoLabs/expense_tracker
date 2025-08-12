import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { CategoryTotal } from '@/types/expense';
import { getCategoryColor, getChartColor } from '@/lib/expense-utils';
import { useMoney } from '@/contexts/MoneyContext';

interface ExpensePieChartProps {
  categoryTotals: CategoryTotal[];
  monthlyTotal: number;
  selectedMonth: string;
  onCategoryClick?: (category: string) => void;
}

const RADIAN = Math.PI / 180;

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  category: string;
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, category }: CustomLabelProps) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if slice is large enough (>5%)
  if (percent < 0.05) return null;

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="12"
      fontWeight="500"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function ExpensePieChart({ categoryTotals, monthlyTotal, selectedMonth, onCategoryClick }: ExpensePieChartProps) {
  const { format } = useMoney();
  
  const chartData = useMemo(() => {
    if (categoryTotals.length === 0) return [];

    // Limit to 8 categories, merge others
    let processedData = [...categoryTotals];
    
    if (processedData.length > 8) {
      const topCategories = processedData.slice(0, 7);
      const otherCategories = processedData.slice(7);
      const otherTotal = otherCategories.reduce((sum, cat) => sum + cat.totalCents, 0);
      const otherCount = otherCategories.reduce((sum, cat) => sum + cat.expenseCount, 0);
      
      processedData = [
        ...topCategories,
        {
          category: 'Other',
          totalCents: otherTotal,
          expenseCount: otherCount
        }
      ];
    }

    return processedData.map(item => ({
      category: item.category,
      value: item.totalCents / 100, // Convert to actual amount
      totalCents: item.totalCents,
      percentage: ((item.totalCents / monthlyTotal) * 100).toFixed(1),
      expenseCount: item.expenseCount
    }));
  }, [categoryTotals, monthlyTotal]);

  if (categoryTotals.length === 0) {
    return (
      <Card className="bg-card-elevated shadow-elevated border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Spending Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <TrendingUp className="h-8 w-8" />
            </div>
            <p className="text-lg font-medium">No expenses to display</p>
            <p className="text-sm">Add some expenses to see your spending breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card-elevated border border-border rounded-lg p-3 shadow-elevated">
          <p className="font-semibold">{data.category}</p>
          <p className="text-sm text-muted-foreground">
            {format(data.totalCents)} ({data.percentage}%)
          </p>
          <p className="text-xs text-muted-foreground">
            {data.expenseCount} expense{data.expenseCount !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-card-elevated shadow-elevated border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-accent" />
          Spending Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                onClick={onCategoryClick ? (data) => onCategoryClick(data.category) : undefined}
                style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getChartColor(index)}
                    className="hover:opacity-80 transition-opacity"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="text-lg font-bold">{format(monthlyTotal)}</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-6">
          {chartData.map((item, index) => (
            <div 
              key={item.category}
              className={`flex items-center gap-2 text-sm ${onCategoryClick ? 'cursor-pointer hover:bg-muted/50 rounded p-1 transition-colors' : ''}`}
              onClick={onCategoryClick ? () => onCategoryClick(item.category) : undefined}
            >
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getChartColor(index) }}
              />
              <span className="truncate">{item.category}</span>
              <span className="text-muted-foreground ml-auto">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}