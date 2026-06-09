'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from 'recharts';
import { customerAdminService } from '@/services/customer.service';
import { HealthRadarSummary } from '@/types/customer.type';

const COLORS = [
  '#A57322', // Nâu đồng (primary)
  '#4CAF50', // Xanh lá
  '#2196F3', // Xanh dương
  '#FF9800', // Cam
  '#E91E63', // Hồng
  '#9C27B0', // Tím
  '#607D8B', // Xám
];

export default function HealthRadarChart() {
  const [data, setData] = useState<HealthRadarSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await customerAdminService.getHealthRadarSummary();
      setData(result);
    } catch (err) {
      console.error('Error fetching health radar data:', err);
      setError('Không thể tải dữ liệu sức khỏe');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <span style={{ color: '#666', fontSize: '14px' }}>Đang tải biểu đồ...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <span style={{ color: '#d32f2f', fontSize: '14px' }}>{error || 'Không có dữ liệu'}</span>
      </div>
    );
  }

  const chartData = data.categories.map((cat, idx) => ({
    category: cat.category,
    fullMark: 100,
    value: cat.count > 0 ? Math.round((cat.count / data.totalTags) * 100) : 0,
    count: cat.count,
    displayName: cat.categoryDisplayName,
    color: COLORS[idx % COLORS.length],
  }));

  const maxCount = Math.max(...data.categories.map(c => c.count), 1);

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      padding: '24px',
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#333',
          margin: 0,
          marginBottom: '4px',
        }}>
          Biểu đồ Sức khỏe Khách hàng
        </h2>
        <p style={{
          fontSize: '13px',
          color: '#666',
          margin: 0,
        }}>
          Tổng số tag sức khỏe: {data.totalTags}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, height: '380px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#e0e0e0" />
              <PolarAngleAxis
                dataKey="displayName"
                tick={{ fontSize: 11, fill: '#555', fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#999' }}
                tickCount={5}
              />
              <Radar
                name="Số lượng"
                dataKey="value"
                stroke="#A57322"
                fill="#A57322"
                fillOpacity={0.5}
                strokeWidth={2}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const item = payload[0].payload;
                    return (
                      <div style={{
                        background: '#fff',
                        padding: '12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}>
                        <p style={{ fontWeight: 600, color: '#333', margin: 0, marginBottom: '4px' }}>
                          {item.displayName}
                        </p>
                        <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                          Số lượng: <strong style={{ color: '#A57322' }}>{item.count}</strong>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={{
          width: '200px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {data.categories.map((cat, idx) => (
            <div key={cat.category} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              background: '#f9f9f9',
              borderRadius: '6px',
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: COLORS[idx % COLORS.length],
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#333',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {cat.categoryDisplayName}
                </p>
                <p style={{
                  fontSize: '11px',
                  color: '#888',
                  margin: 0,
                }}>
                  {cat.count} tag{cat.count !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#A57322',
                flexShrink: 0,
              }}>
                {data.totalTags > 0 ? Math.round((cat.count / data.totalTags) * 100) : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
