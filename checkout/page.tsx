'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, Shield, Clock, Users,
  ChevronLeft, Lock, Sparkles, AlertCircle
} from 'lucide-react';

/* ══════════════════════════════════════
   SVG Payment Brand Logos (inline)
══════════════════════════════════════ */
const VodafoneLogo = () => (
  <svg viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
    <rect width="60" height="40" rx="6" fill="#E60000"/>
    <path d="M30 8C22.268 8 16 14.268 16 22C16 29.732 22.268 36 30 36C37.732 36 44 29.732 44 22C44 14.268 37.732 8 30 8ZM30 13C35.523 13 40 17.477 40 23C40 28.523 35.523 33 30 33C24.477 33 20 28.523 20 23C20 17.477 24.477 13 30 13Z" fill="white" opacity="0.9"/>
    <path d="M27 17L34 22L27 27V17Z" fill="white"/>
  </svg>
);

const OrangeLogo = () => (
  <svg viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
    <rect width="60" height="40" rx="6" fill="#FF6600"/>
    <rect x="10" y="13" width="40" height="14" rx="3" fill="white"/>
    <text x="30" y="24" textAnchor="middle" fill="#FF6600" fontSize="10" fontWeight="bold" fontFamily="Arial">orange</text>
  </svg>
);

const EtisalatLogo = () => (
  <svg viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
    <rect width="60" height="40" rx="6" fill="#009A44"/>
    <circle cx="30" cy="20" r="9" fill="white" opacity="0.15"/>
    <circle cx="30" cy="20" r="6" fill="white" opacity="0.25"/>
    <circle cx="30" cy="20" r="3" fill="white"/>
    <text x="30" y="35" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">etisalat</text>
  </svg>
);

const InstaPayLogo = () => (
  <svg viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
    <rect width="60" height="40" rx="6" fill="#1B2CC1"/>
    <path d="M12 20H48M30 10L42 20L30 30" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="30" y="36" textAnchor="middle" fill="white" fontSize="6.5" fontWeight="bold" fontFamily="Arial">InstaPay</text>
  </svg>
);

const FawryLogo = () => (
  <svg viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
    <rect width="60" height="40" rx="6" fill="#F5A623"/>
    <circle cx="30" cy="18" r="8" fill="white"/>
    <text x="30" y="22" textAnchor="middle" fill="#F5A623" fontSize="9" fontWeight="900" fontFamily="Arial">F</text>
    <text x="30" y="34" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">FAWRY</text>
  </svg>
);

const BankLogo = () => (
  <svg viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
    <rect width="60" height="40" rx="6" fill="#1A3A5C"/>
    <rect x="10" y="24" width="40" height="3" rx="1" fill="white" opacity="0.7"/>
    <rect x="10" y="11" width="40" height="3" rx="1" fill="white" opacity="0.9"/>
    <rect x="14" y="14" width="4" height="10" rx="1" fill="white" opacity="0.7"/>
    <rect x="22" y="14" width="4" height="10" rx="1" fill="white" opacity="0.7"/>
    <rect x="30" y="14" width="4" height="10" rx="1" fill="white" opacity="0.7"/>
    <rect x="38" y="14" width="4" height="10" rx="1" fill="white" opacity="0.7"/>
  </svg>
);

/* ══════════════════════════════════════
   Payment Methods Data
══════════════════════════════════════ */
const paymentMethods = [
  {
    id: 'vodafone',
    name: 'Vodafone Cash',
    nameAr: 'فودافون كاش',
    fee: 'رسوم: 0 جنيه',
    note: 'تحويل فوري على الرقم 01000000000',
    color: 'from-red-600 to-red-800',
    glow: 'rgba(220,38,38,0.35)',
    Logo: VodafoneLogo,
  },
  {
    id: 'orange',
    name: 'Orange Money',
    nameAr: 'أورانج موني',
    fee: 'رسوم: 5 جنيه',
    note: 'تحويل فوري على الرقم 01200000000',
    color: 'from-orange-500 to-orange-700',
    glow: 'rgba(249,115,22,0.35)',
    Logo: OrangeLogo,
  },
  {
    id: 'etisalat',
    name: 'Etisalat Cash',
    nameAr: 'اتصالات كاش',
    fee: 'رسوم: 0 جنيه',
    note: 'تحويل فوري على الرقم 01100000000',
    color: 'from-emerald-600 to-green-800',
    glow: 'rgba(5,150,105,0.35)',
    Logo: EtisalatLogo,
  },
  {
    id: 'instapay',
    name: 'InstaPay',
    nameAr: 'انستاباي',
    fee: 'رسوم: 0 جنيه',
    note: 'تحويل لحظي عبر تطبيق البنوك',
    color: 'from-blue-600 to-indigo-800',
    glow: 'rgba(37,99,235,0.35)',
    Logo: InstaPayLogo,
  },
  {
    id: 'fawry',
    name: 'Fawry',
    nameAr: 'فوري',
    fee: 'رسوم: 3 جنيه',
    note: 'سداد في أقرب منفذ فوري',
    color: 'from-amber-500 to-yellow-700',
    glow: 'rgba(245,158,11,0.35)',
    Logo: FawryLogo,
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    nameAr: 'تحويل بنكي',
    fee: 'رسوم: 10 جنيه',
    note: 'خلال 24 ساعة عمل',
    color: 'from-slate-600 to-slate-800',
    glow: 'rgba(100,116,139,0.35)',
    Logo: BankLogo,
  },
];

/* ══════════════════════════════════════
   Animated Checkmark SVG
══════════════════════════════════════ */
const AnimatedCheck = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24">
    <circle cx="40" cy="40" r="36" stroke="#10b981" strokeWidth="4" className="check-circle" />
    <polyline points="24,42 35,54 58,28" stroke="#10b981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="check-mark" />
    <style>{`
      .check-circle {
        stroke-dasharray: 226;
        stroke-dashoffset: 226;
        animation: draw-circle 0.7s ease forwards;
      }
      .check-mark {
        stroke-dasharray: 60;
        stroke-dashoffset: 60;
        animation: draw-check 0.4s ease 0.65s forwards;
      }
      @keyframes draw-circle {
        to { stroke-dashoffset: 0; }
      }
      @keyframes draw-check {
        to { stroke-dashoffset: 0; }
      }
    `}</style>
  </svg>
);

/* ══════════════════════════════════════
   Main Page Component
══════════════════════════════════════ */
export default function CheckoutPage() {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [payStep, setPayStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const paySteps = [
    'جاري الاتصال بالبوابة...',
    'التحقق من بياناتك...',
    'تأمين المعاملة...',
    'حجز المبلغ في Escrow...',
    'إتمام العملية...',
  ];

  const handlePay = () => {
    if (!selectedMethod || isPaying) return;
    setIsPaying(true);
    setProgress(0);
    setPayStep(0);

    let elapsed = 0;
    const total = 6000;
    const tick = 80;

    intervalRef.current = setInterval(() => {
      elapsed += tick;
      const pct = Math.min((elapsed / total) * 100, 100);
      setProgress(pct);
      setPayStep(Math.floor((elapsed / total) * (paySteps.length - 1)));

      if (elapsed >= total) {
        clearInterval(intervalRef.current!);
        setIsPaying(false);
        setShowSuccess(true);
      }
    }, tick);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const selected = paymentMethods.find(m => m.id === selectedMethod);

  return (
    <div className="checkout-root">
      <style>{`
        .checkout-root {
          min-height: 100vh;
          background: #0a0e1a;
          color: #e2e8f0;
          font-family: var(--font-cairo, 'Cairo', sans-serif);
          direction: rtl;
        }
        /* ── ambient glow bg ── */
        .checkout-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 55% 40% at 20% 10%, rgba(16,185,129,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 80% 80%, rgba(37,99,235,0.06) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }
        .checkout-inner {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 5rem 1.5rem 4rem;
        }
        /* ── glass card ── */
        .glass {
          background: rgba(255,255,255,0.032);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 1.4rem;
          backdrop-filter: blur(12px);
        }
        /* ── section title ── */
        .sec-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #f1f5f9;
          display: flex;
          align-items: center;
          gap: 0.7rem;
          margin-bottom: 1.4rem;
        }
        .sec-title-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        /* ── order details ── */
        .order-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        @media(max-width:560px){ .order-grid { grid-template-columns: 1fr; } }
        .order-cell {
          border-radius: 1rem;
          padding: 1.2rem 1.4rem;
        }
        .order-cell-label { font-size: 0.78rem; color: #64748b; font-weight: 500; margin-bottom: 0.4rem; }
        .order-cell-value { font-size: 1.1rem; font-weight: 800; color: #f1f5f9; }
        .order-cell-sub { font-size: 0.8rem; color: #94a3b8; margin-top: 0.4rem; display:flex; align-items:center; gap:0.35rem; }
        /* ── payment methods grid ── */
        .methods-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: 1rem;
        }
        .method-card {
          border-radius: 1.1rem;
          border: 2px solid rgba(255,255,255,0.07);
          padding: 1rem;
          cursor: pointer;
          transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.65rem;
          position: relative;
          overflow: hidden;
          background: rgba(255,255,255,0.025);
        }
        .method-card:hover {
          transform: translateY(-3px);
        }
        .method-card.selected {
          transform: translateY(-4px);
        }
        .method-card .check-dot {
          position: absolute;
          top: 8px; left: 8px;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: #10b981;
          display: flex; align-items: center; justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .method-card.selected .check-dot { opacity: 1; }
        .method-name { font-size: 0.85rem; font-weight: 700; color: #f1f5f9; text-align: center; }
        .method-fee { font-size: 0.75rem; color: #10b981; font-weight: 600; }
        .method-note { font-size: 0.72rem; color: #64748b; text-align: center; line-height: 1.5; }
        /* ── pay button ── */
        .pay-btn {
          width: 100%;
          padding: 1.1rem 1.5rem;
          border-radius: 1rem;
          border: none;
          font-family: var(--font-cairo, 'Cairo', sans-serif);
          font-size: 1.05rem;
          font-weight: 800;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          position: relative;
          overflow: hidden;
          color: white;
        }
        .pay-btn:disabled { cursor: not-allowed; opacity: 0.6; }
        .pay-btn:not(:disabled):hover { transform: scale(1.02); }
        .pay-btn:not(:disabled):active { transform: scale(0.98); }
        /* progress bar inside button */
        .pay-btn .btn-progress {
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.12);
          transform-origin: left;
          transition: transform 0.08s linear;
        }
        /* ── progress bar external ── */
        .progress-wrap {
          margin-top: 1rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          height: 6px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #10b981, #38bdf8);
          transition: width 0.08s linear;
        }
        .pay-step-text {
          text-align: center;
          font-size: 0.82rem;
          color: #38bdf8;
          margin-top: 0.6rem;
          min-height: 1.2rem;
        }
        /* ── summary sidebar ── */
        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: #94a3b8;
          padding: 0.5rem 0;
        }
        .summary-row strong { color: #f1f5f9; font-weight: 700; }
        .summary-divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 0.5rem 0; }
        .summary-total {
          display: flex;
          justify-content: space-between;
          font-size: 1.05rem;
          font-weight: 800;
          color: #10b981;
          padding: 0.5rem 0;
        }
        .escrow-note {
          border-radius: 0.75rem;
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.2);
          padding: 0.85rem 1rem;
          font-size: 0.8rem;
          color: #6ee7b7;
          line-height: 1.7;
          margin-top: 1rem;
        }
        /* ── status badges ── */
        .status-item {
          display: flex; align-items: center; gap: 0.7rem;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          margin-bottom: 0.6rem;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .status-done { background: rgba(16,185,129,0.1); color: #6ee7b7; }
        .status-wait { background: rgba(56,189,248,0.08); color: #7dd3fc; }
        /* ── modal overlay ── */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(6px);
          z-index: 999;
          display: flex; align-items: center; justify-content: center;
          animation: fade-in 0.25s ease;
        }
        @keyframes fade-in { from { opacity:0 } to { opacity:1 } }
        .modal-box {
          background: #0f1629;
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 1.8rem;
          padding: 3rem 2.5rem;
          text-align: center;
          max-width: 420px;
          width: 90%;
          position: relative;
          animation: pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes pop-in {
          from { transform: scale(0.7); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        .modal-glow {
          position: absolute; inset: 0;
          border-radius: 1.8rem;
          background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(16,185,129,0.1), transparent);
          pointer-events: none;
        }
        .modal-title {
          font-size: 1.6rem; font-weight: 800; color: #f1f5f9;
          margin: 1.2rem 0 0.5rem;
        }
        .modal-sub { font-size: 0.9rem; color: #94a3b8; line-height: 1.8; }
        .modal-ref {
          display: inline-block;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 0.6rem;
          padding: 0.4rem 1rem;
          font-size: 0.8rem;
          color: #6ee7b7;
          margin-top: 1rem;
          font-weight: 600;
          letter-spacing: 0.08em;
        }
        .modal-btn {
          margin-top: 2rem;
          width: 100%;
          padding: 0.9rem;
          border-radius: 0.9rem;
          border: none;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          font-family: var(--font-cairo, 'Cairo', sans-serif);
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
        }
        .modal-btn:hover { opacity: 0.9; transform: scale(1.01); }
        /* ── hero ── */
        .page-hero {
          text-align: center;
          margin-bottom: 3rem;
        }
        .page-hero h1 {
          font-size: clamp(1.6rem, 4vw, 2.4rem);
          font-weight: 800;
          color: #f1f5f9;
          margin: 1rem 0 0.5rem;
        }
        .page-hero p { font-size: 0.95rem; color: #64748b; }
        .hero-icon-wrap {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto;
          box-shadow: 0 0 40px rgba(16,185,129,0.3);
        }
        /* ── layout ── */
        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.8rem;
          align-items: start;
        }
        @media(max-width: 900px) { .checkout-grid { grid-template-columns: 1fr; } }
        .section-card { padding: 1.8rem; margin-bottom: 1.5rem; }
        /* ── stepper ── */
        .stepper {
          display: flex; align-items: center; justify-content: center;
          gap: 0; margin-bottom: 3rem;
        }
        .step-item { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
        .step-dot {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; font-weight: 700;
        }
        .step-dot.done { background: linear-gradient(135deg,#10b981,#059669); color: white; }
        .step-dot.active { background: linear-gradient(135deg,#38bdf8,#2563eb); color: white; box-shadow: 0 0 16px rgba(56,189,248,0.4); }
        .step-dot.pending { background: rgba(255,255,255,0.06); color: #475569; border: 1px solid rgba(255,255,255,0.08); }
        .step-label { font-size: 0.72rem; color: #64748b; font-weight: 500; }
        .step-label.active { color: #38bdf8; font-weight: 700; }
        .step-line { width: 60px; height: 2px; background: rgba(255,255,255,0.06); margin-bottom: 1.2rem; }
        .step-line.done { background: linear-gradient(90deg,#10b981,#059669); }
      `}</style>

      <div className="checkout-inner">
        {/* Hero */}
        <div className="page-hero">
          <div className="hero-icon-wrap">
            <Shield size={32} color="white" />
          </div>
          <h1>إتمام عملية الدفع بأمان تام</h1>
          <p>جميع المعاملات محمية بنظام Escrow المتقدم مع ضمان استرداد كامل للأموال</p>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {[
            { label: 'الطلب', state: 'done' },
            { label: 'المراجعة', state: 'done' },
            { label: 'الدفع', state: 'active' },
            { label: 'التنفيذ', state: 'pending' },
            { label: 'الإتمام', state: 'pending' },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center' }}>
              <div className="step-item">
                <div className={`step-dot ${s.state}`}>
                  {s.state === 'done' ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span className={`step-label ${s.state === 'active' ? 'active' : ''}`}>{s.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={`step-line ${s.state === 'done' ? 'done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="checkout-grid">
          {/* ── Left column ── */}
          <div>
            {/* Order Details */}
            <div className="glass section-card">
              <div className="sec-title">
                <div className="sec-title-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                  <CheckCircle2 size={18} color="white" />
                </div>
                تفاصيل الطلب المؤكد
              </div>
              <div className="order-grid">
                <div className="order-cell" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="order-cell-label">الخدمة المطلوبة</div>
                  <div className="order-cell-value">تصميم هوية بصرية احترافية</div>
                  <div className="order-cell-sub"><Users size={13} /> مقدم من: أحمد محمد</div>
                </div>
                <div className="order-cell" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="order-cell-label">السعر المتفق عليه</div>
                  <div className="order-cell-value" style={{ fontSize: '1.5rem' }}>1,500 <span style={{ fontSize: '1rem', fontWeight: 600 }}>جنيه</span></div>
                  <div className="order-cell-sub"><Clock size={13} /> تم التأكيد: 2024/01/15</div>
                </div>
                <div className="order-cell" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <div className="order-cell-label" style={{ color: '#d97706' }}>عمولة المنصة</div>
                  <div className="order-cell-value" style={{ color: '#fbbf24' }}>300 جنيه <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>(20%)</span></div>
                  <div className="order-cell-sub" style={{ color: '#92400e' }}>تغطي تكاليف الحماية والدعم</div>
                </div>
                <div className="order-cell" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <div className="order-cell-label" style={{ color: '#059669' }}>صافي البائع</div>
                  <div className="order-cell-value" style={{ color: '#34d399' }}>1,200 جنيه</div>
                  <div className="order-cell-sub" style={{ color: '#064e3b' }}><Shield size={13} /> يُحول بعد إتمام العمل</div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="glass section-card">
              <div className="sec-title">
                <div className="sec-title-icon" style={{ background: 'linear-gradient(135deg,#2563eb,#4f46e5)' }}>
                  <Lock size={18} color="white" />
                </div>
                اختر وسيلة الدفع الآمنة
              </div>
              {!selectedMethod && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.7rem 1rem', borderRadius: '0.7rem', background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.15)' }}>
                  <AlertCircle size={15} color="#fbbf24" />
                  <span style={{ fontSize: '0.82rem', color: '#fbbf24' }}>الرجاء اختيار وسيلة دفع للمتابعة</span>
                </div>
              )}
              <div className="methods-grid">
                {paymentMethods.map((m) => {
                  const isSelected = selectedMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      className={`method-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedMethod(m.id)}
                      style={{
                        borderColor: isSelected ? 'rgba(16,185,129,0.6)' : 'rgba(255,255,255,0.07)',
                        boxShadow: isSelected ? `0 0 20px ${m.glow}` : 'none',
                        background: isSelected ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.025)',
                      }}
                    >
                      {/* check dot */}
                      <span className="check-dot">
                        <CheckCircle2 size={12} color="white" />
                      </span>
                      <m.Logo />
                      <span className="method-name">{m.nameAr}</span>
                      <span className="method-fee">{m.fee}</span>
                      <span className="method-note">{m.note}</span>
                    </button>
                  );
                })}
              </div>

              {/* Pay Button */}
              <div style={{ marginTop: '1.8rem' }}>
                <button
                  className="pay-btn"
                  disabled={!selectedMethod || isPaying}
                  onClick={handlePay}
                  style={{
                    background: selectedMethod
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'rgba(255,255,255,0.05)',
                    boxShadow: selectedMethod ? '0 8px 30px rgba(16,185,129,0.35)' : 'none',
                  }}
                >
                  {isPaying && (
                    <span
                      className="btn-progress"
                      style={{ transform: `scaleX(${progress / 100})` }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isPaying ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                          </path>
                        </svg>
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        <Shield size={18} />
                        {selectedMethod
                          ? `ادفع الآن عبر ${selected?.nameAr} — 1,500 جنيه`
                          : 'اختر وسيلة دفع أولاً'}
                      </>
                    )}
                  </span>
                </button>

                {isPaying && (
                  <>
                    <div className="progress-wrap">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="pay-step-text">{paySteps[payStep]}</div>
                  </>
                )}

                <div style={{ textAlign: 'center', marginTop: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#475569' }}>
                  <Lock size={12} /> جميع المعاملات مشفرة بـ SSL 256-bit
                </div>
              </div>
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <aside>
            {/* Status */}
            <div className="glass section-card" style={{ marginBottom: '1.2rem' }}>
              <div className="sec-title" style={{ marginBottom: '1rem' }}>
                <div className="sec-title-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                  <Sparkles size={18} color="white" />
                </div>
                حالة الطلب
              </div>
              <div className="status-item status-done"><CheckCircle2 size={16} /> تم مراجعة الطلب من الإدارة</div>
              <div className="status-item status-done"><CheckCircle2 size={16} /> تم تثبيت السعر النهائي</div>
              <div className="status-item status-wait">
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8', flexShrink: 0 }} />
                في انتظار تأكيد الدفع
              </div>
              <Link
                href="/workspace"
                style={{
                  marginTop: '1.2rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.85rem', borderRadius: '0.9rem',
                  background: 'linear-gradient(135deg,#10b981,#059669)',
                  color: 'white', fontWeight: 700, fontSize: '0.9rem',
                  textDecoration: 'none',
                  transition: 'opacity 0.2s',
                }}
              >
                <Shield size={16} /> الانتقال للمحادثة الآمنة
              </Link>
            </div>

            {/* Summary */}
            <div className="glass section-card">
              <div className="sec-title" style={{ marginBottom: '1rem' }}>الملخص النهائي</div>
              <div className="summary-row"><span>إجمالي العملية</span><strong>1,500 جنيه</strong></div>
              <div className="summary-row"><span>عمولة المنصة (20%)</span><strong style={{ color: '#fbbf24' }}>300 جنيه</strong></div>
              <hr className="summary-divider" />
              <div className="summary-total"><span>صافي البائع</span><span>1,200 جنيه</span></div>
              {selectedMethod && (
                <div className="summary-row" style={{ marginTop: '0.25rem' }}>
                  <span>وسيلة الدفع</span>
                  <strong style={{ color: '#38bdf8' }}>{selected?.nameAr}</strong>
                </div>
              )}
              <div className="escrow-note">
                💰 المبلغ محجوز في Escrow ويُحول للبائع فور تأكيد إتمام العمل بشكل صحيح
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ══ Success Modal ══ */}
      {showSuccess && (
        <div className="modal-overlay" onClick={() => setShowSuccess(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-glow" />
            <AnimatedCheck />
            <div className="modal-title">تمت العملية بنجاح! 🎉</div>
            <p className="modal-sub">
              تم تحويل المبلغ إلى حساب Escrow بنجاح.<br />
              سيتلقى البائع أمواله فور إتمام وتأكيد العمل.
            </p>
            <div className="modal-ref">REF# SKM-{Math.random().toString(36).substring(2,10).toUpperCase()}</div>
            <Link href="/workspace">
              <button
                className="modal-btn"
                onClick={() => setShowSuccess(false)}
              >
                الانتقال لمساحة العمل ←
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
