import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function MiniChart({ prices, up }) {
  if (!prices || prices.length < 2) return null;
  const data = prices.map((v, i) => ({ v }));
  return (
    <ResponsiveContainer width={72} height={32}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={up ? 'var(--up)' : 'var(--down)'}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
