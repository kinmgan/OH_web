'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardStats, RecentOrder, RevenueDataPoint, ReviewSentiment, WordCloudItem } from '@/types/dashboard.type';
import { TrendingUp, Package, Users, ShoppingCart, DollarSign, Clock, CheckCircle, Truck, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';

const COLORS = {
  primary: '#A57322',
  primaryLight: '#C4942A',
  primaryLighter: '#D4B57A',
  primaryDark: '#8B5E1A',
  beige: '#F5F0E8',
  beigeDark: '#E8E0D0',
  brown: '#6B4423',
  brownLight: '#8B6914',
  text: '#333333',
  textLight: '#666666',
  textMuted: '#999999',
  white: '#FFFFFF',
  positive: '#4CAF50',
  neutral: '#FF9800',
  negative: '#F44336',
};

const SENTIMENT_COLORS: Record<string, string> = {
  'Tích cực': COLORS.positive,
  'Trung lập': COLORS.neutral,
  'Tiêu cực': COLORS.negative,
};

const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  PENDING: { color: COLORS.primary, bgColor: '#FFF8E1', label: 'Chờ xác nhận' },
  CONFIRMED: { color: '#6A1B9A', bgColor: '#F3E5F5', label: 'Đã xác nhận' },
  SHIPPING: { color: '#0277BD', bgColor: '#E1F5FE', label: 'Đang giao' },
  DELIVERED: { color: '#2E7D32', bgColor: '#E8F5E9', label: 'Đã giao' },
  CANCELLED: { color: '#C62828', bgColor: '#FFEBEE', label: 'Đã hủy' },
  RETURNED: { color: '#F57F17', bgColor: '#FFF8E1', label: 'Hoàn hàng' },
};

const paymentLabels: Record<string, string> = {
  COD: 'COD',
  BANK_TRANSFER: 'Chuyển khoản',
  MOMO: 'MoMo',
  VNPAY: 'VNPay',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function WordCloud({ data }: { data: WordCloudItem[] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textMuted, fontSize: '13px' }}>
        Chưa có dữ liệu từ khóa
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));

  const getFontSize = (value: number) => {
    if (maxValue === minValue) return 14;
    const normalized = (value - minValue) / (maxValue - minValue);
    return 12 + normalized * 20;
  };

  const getColor = (value: number) => {
    if (maxValue === minValue) return COLORS.primary;
    const normalized = (value - minValue) / (maxValue - minValue);
    if (normalized > 0.7) return COLORS.primaryDark;
    if (normalized > 0.4) return COLORS.primary;
    return COLORS.primaryLight;
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px 12px',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px',
      height: '100%',
    }}>
      {data.map((item, idx) => (
        <span
          key={idx}
          style={{
            fontSize: `${getFontSize(item.value)}px`,
            fontWeight: item.value > minValue + (maxValue - minValue) * 0.5 ? 600 : 400,
            color: getColor(item.value),
            cursor: 'default',
            transition: 'transform 0.2s',
            whiteSpace: 'nowrap',
          }}
          title={`${item.text}: ${item.value} lần`}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [revenueChart, setRevenueChart] = useState<RevenueDataPoint[]>([]);
  const [sentimentData, setSentimentData] = useState<ReviewSentiment[]>([]);
  const [wordCloudData, setWordCloudData] = useState<WordCloudItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchDashboard();
  }, [startDate, endDate]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const { dashboardService } = await import('@/services/dashboard.service');
      const [statsData, ordersData, chartData, sentiment, wordcloud] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentOrders(5, startDate, endDate),
        dashboardService.getRevenueChart(startDate, endDate),
        dashboardService.getReviewSentiment(startDate, endDate),
        dashboardService.getReviewWordCloud(startDate, endDate),
      ]);
      setStats(statsData);
      setRecentOrders(ordersData);
      setRevenueChart(chartData);
      setSentimentData(sentiment);
      setWordCloudData(wordcloud);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const chartDataFormatted = useMemo(() => {
    return revenueChart.map(d => ({
      ...d,
      dateLabel: format(new Date(d.date), 'dd/MM', { locale: vi }),
      revenue: d.revenue / 1000000,
    }));
  }, [revenueChart]);

  const totalSentiment = useMemo(() => {
    return sentimentData.reduce((sum, s) => sum + s.value, 0);
  }, [sentimentData]);

  if (loading && !stats) {
    return (
      <div style={{ padding: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px', color: COLORS.text }}>
          Tổng quan
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{
              background: COLORS.white,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: `1px solid ${COLORS.beigeDark}`,
              animation: 'pulse 1.5s infinite',
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: COLORS.beige, marginBottom: '12px' }} />
              <div style={{ width: '100px', height: '14px', background: COLORS.beige, borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ width: '80px', height: '28px', background: COLORS.beige, borderRadius: '4px' }} />
            </div>
          ))}
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '32px', color: COLORS.text }}>
          Tổng quan
        </h1>
        <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: '12px', padding: '16px', color: '#C62828', textAlign: 'center' }}>
          {error}
          <button onClick={fetchDashboard} style={{
            marginLeft: '12px',
            padding: '8px 20px',
            background: '#C62828',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
          }}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Tổng doanh thu',
      value: stats ? formatCurrency(stats.totalRevenue) : '0 đ',
      icon: <TrendingUp size={22} color={COLORS.white} />,
      gradient: 'linear-gradient(135deg, #C59A63 0%, #DDB876 100%)',
    },
    {
      label: 'Đơn hàng hôm nay',
      value: stats ? stats.todayOrders.toLocaleString() : '0',
      subValue: stats ? formatCurrency(stats.todayRevenue) : '0 đ',
      icon: <Package size={22} color={COLORS.white} />,
      gradient: 'linear-gradient(135deg, #D97B95 0%, #E8A5BA 100%)',
    },
    {
      label: 'Khách hàng mới',
      value: stats ? stats.newCustomers.toLocaleString() : '0',
      subLabel: 'hôm nay',
      icon: <Users size={22} color={COLORS.white} />,
      gradient: 'linear-gradient(135deg, #91B87F 0%, #C0D5A8 100%)',
    },
    {
      label: 'Sản phẩm',
      value: stats ? stats.totalProducts.toLocaleString() : '0',
      icon: <ShoppingCart size={22} color={COLORS.white} />,
      gradient: 'linear-gradient(135deg, #FF8B7C 0%, #F6C5B8 100%)',
    },
  ];

  const orderStatusCards = stats ? [
    { label: 'Chờ xác nhận', value: stats.pendingOrders, color: COLORS.primary, bgColor: '#FFF8E1', icon: <Clock size={16} color={COLORS.primary} /> },
    { label: 'Đã xác nhận', value: stats.processingOrders, color: '#6A1B9A', bgColor: '#F3E5F5', icon: <CheckCircle size={16} color="#6A1B9A" /> },
    { label: 'Đang giao', value: stats.shippingOrders, color: '#0277BD', bgColor: '#E1F5FE', icon: <Truck size={16} color="#0277BD" /> },
    { label: 'Doanh thu hôm nay', value: formatCurrency(stats.todayRevenue), color: COLORS.positive, bgColor: '#E8F5E9', icon: <DollarSign size={16} color={COLORS.positive} /> },
  ] : [];

  return (
    <div style={{ padding: '32px', background: COLORS.beige, minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: COLORS.text, margin: 0 }}>
          Tổng quan
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: COLORS.white, padding: '8px 16px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Calendar size={16} color={COLORS.textMuted} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '13px', color: COLORS.text, background: 'transparent', cursor: 'pointer' }}
            />
            <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '13px', color: COLORS.text, background: 'transparent', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

      {/* Row 1: Main Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {statCards.map((card, idx) => (
          <div key={idx} style={{
            background: card.gradient,
            padding: '20px 24px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(165, 115, 34, 0.25)',
            color: COLORS.white,
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(165, 115, 34, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(165, 115, 34, 0.25)';
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>{card.label}</div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700 }}>{card.value}</div>
            {(card.subValue || card.subLabel) && (
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                {card.subLabel && <span>{card.subLabel} — </span>}
                {card.subValue}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Row 2: Order Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {orderStatusCards.map((card, idx) => (
          <div key={idx} style={{
            background: COLORS.white,
            padding: '16px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: `1px solid ${COLORS.beigeDark}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: card.bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '2px' }}>{card.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: card.color }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 3: Charts (3 columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Revenue Chart */}
        <div style={{
          background: COLORS.white,
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          border: `1px solid ${COLORS.beigeDark}`,
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: COLORS.text, margin: '0 0 4px 0' }}>Doanh thu theo ngày</h3>
            <p style={{ fontSize: '12px', color: COLORS.textMuted, margin: 0 }}>Đơn vị: triệu đồng</p>
          </div>
          {loading ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: COLORS.textMuted }}>Đang tải...</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartDataFormatted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.beigeDark} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: COLORS.textMuted }} />
                <YAxis tick={{ fontSize: 10, fill: COLORS.textMuted }} />
                <Tooltip
                  contentStyle={{ background: COLORS.white, border: `1px solid ${COLORS.beigeDark}`, borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number) => [`${value.toFixed(2)} triệu đ`, 'Doanh thu']}
                />
                <Bar dataKey="revenue" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart - Sentiment */}
        <div style={{
          background: COLORS.white,
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          border: `1px solid ${COLORS.beigeDark}`,
        }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: COLORS.text, margin: '0 0 4px 0' }}>Tỷ lệ đánh giá</h3>
            <p style={{ fontSize: '12px', color: COLORS.textMuted, margin: 0 }}>{totalSentiment} đánh giá</p>
          </div>
          {loading ? (
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: COLORS.textMuted }}>Đang tải...</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.name] || COLORS.primary} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: COLORS.white, border: `1px solid ${COLORS.beigeDark}`, borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number, name: string) => [`${value} (${totalSentiment > 0 ? Math.round(value / totalSentiment * 100) : 0}%)`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Word Cloud */}
        <div style={{
          background: COLORS.white,
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          border: `1px solid ${COLORS.beigeDark}`,
        }}>
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: COLORS.text, margin: '0 0 4px 0' }}>Từ khóa nổi bật</h3>
            <p style={{ fontSize: '12px', color: COLORS.textMuted, margin: 0 }}>Từ khóa từ đánh giá</p>
          </div>
          {loading ? (
            <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: COLORS.textMuted }}>Đang tải...</span>
            </div>
          ) : (
            <div style={{ height: '180px', overflow: 'hidden' }}>
              <WordCloud data={wordCloudData} />
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Recent Orders */}
      <div style={{
        background: COLORS.white,
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        border: `1px solid ${COLORS.beigeDark}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: COLORS.text, margin: 0 }}>Đơn hàng gần đây</h3>
          <span style={{ fontSize: '12px', color: COLORS.textMuted }}>Trong khoảng thời gian đã chọn</span>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: COLORS.textMuted, fontSize: '14px' }}>
            Chưa có đơn hàng nào trong khoảng thời gian này
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentOrders.map((order) => {
              const status = statusConfig[order.orderStatus] || statusConfig.PENDING;
              return (
                <div key={order.orderId} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${COLORS.beigeDark}`,
                  gap: '16px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.beige; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: COLORS.text }}>{order.orderCode}</div>
                    <div style={{ fontSize: '12px', color: COLORS.textMuted, marginTop: '2px' }}>
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: COLORS.primary }}>
                      {formatCurrency(order.totalAmount)}
                    </div>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 500,
                      background: status.bgColor,
                      color: status.color,
                      marginTop: '4px',
                    }}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
