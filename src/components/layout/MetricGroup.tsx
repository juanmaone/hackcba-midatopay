interface MetricGroupProps { title: string; tone: string; items: Array<{ label: string; value: string; badge?: string }> }

export function MetricGroup({ title, tone, items }: MetricGroupProps) {
  return <div className="metric-group"><div className={`metric-group-title ${tone}`}><span />{title}</div>{items.map((item) => <div className="metric-row" key={item.label}><span>{item.label}</span><strong>{item.value}{item.badge && <em className={`badge badge-${item.badge === 'Medio' ? 'amber' : 'green'}`}>{item.badge}</em>}</strong></div>)}</div>;
}
