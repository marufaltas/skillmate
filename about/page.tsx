"use client";

import styles from './page.module.css';

export default function AboutPage() {
  return (
    <main className={styles.page}>

 
       {/* ─── Hero ─── */}
       <section className={styles.hero}>
         <div className={styles.heroGlow} />
         <div className={styles.heroInner}>
          <span className={styles.badge}>عن المنصة</span>
          <h1 className={styles.heroTitle}>
            ما هي منصة <span className={styles.brand}>SkillMate</span>؟
          </h1>
          <p className={styles.heroSub}>
            هي "سوق إلكتروني" وسيط للخدمات المصغرة والعمل الحر، مصمم خصيصاً لربط الشباب الموهوبين
            في مصر بأصحاب الأعمال والمشاريع.
          </p>
         </div>
       </section>

      <section className="mx-auto max-w-5xl p-6 space-y-8">
          <div className="mt-6 space-y-4">
            <h2 className="text-2xl font-bold">الفكرة في 3 نقاط:</h2>
            <div className="space-y-3">
              <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                <h3 className="font-bold">مكان آمن للعمل</h3>
                <p className="text-sm text-slate-200 leading-7">
                  المنصة بتضمن حق البائع (إنه يستلم فلوسه) وحق المشتري (إنه يستلم شغل بجودة عالية)، لأن الفلوس بتفضل محجوزة في المنصة لحد ما الشغل يخلص.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                <h3 className="font-bold">ثقة متبادلة</h3>
                <p className="text-sm text-slate-200 leading-7">
                  أي حد على الموقع (سواء بائع أو مشتري) يقدر يوثق حسابه ببطاقته وشهاداته، وعليها بياخد علامة الـ "Verified" الزرقاء، عشان الكل يتعامل وهو مطمن.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                <h3 className="font-bold">تنظيم واحترافية</h3>
                <p className="text-sm text-slate-200 leading-7">
                  المنصة متقسمة لتبويبات سهلة، بتبدأ من "حسابي" وتوثيق البيانات، لحد "لوحة تحكم" كاملة للأدمن بيراقب فيها الأرباح، الشكاوى، وعمليات الدفع.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h2 className="text-2xl font-bold">مين بيستخدم المنصة؟</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                <h3 className="font-bold">المشتري</h3>
                <p className="text-sm text-slate-200 leading-7">
                  شخص عنده مشروع وعاوز حد محترف يخلصهوله (تصميم، برمجة، كتابة، إلخ).
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                <h3 className="font-bold">البائع</h3>
                <p className="text-sm text-slate-200 leading-7">
                  شخص عنده مهارة وعاوز يشتغل حر (Freelancer) ويزود دخله.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
                <h3 className="font-bold">الأدمن</h3>
                <p className="text-sm text-slate-200 leading-7">
                  هو "القاضي" والمنظم اللي بيتأكد إن كل الأطراف ماشية صح وبيرد على الاستفسارات.
                </p>
              </div>
            </div>
          </div>
      </section>

      {/* فاصل */}
      <div className="my-12 flex items-center justify-center">
        <div className="h-0.5 w-1/3 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
      </div>

      {/* قسم التصميم والتطوير */}
      <section className="mx-auto max-w-5xl p-6">
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-3xl font-extrabold mb-4 text-center">التصميم والتطوير</h2>

          <div className="bg-white/5 border border-white/20 rounded-2xl p-6 mb-8 text-center">
            <p className="text-slate-300 mb-4">
              تم تصميم هذا الموقع الإلكتروني ليكون بمثابة <span className="font-bold">مشروع تخرج</span> مقدم لتحقيق جزء من المتطلبات للحصول على <span className="font-bold">بكالوريوس التسويق والتجارة الإلكترونية</span>
            </p>

            <div className="space-y-2 text-sm">
              <p className="font-semibold text-blue-300">معهد طيبة العالي للحاسب والعلوم الإدارية</p>
              <p>تحت إشراف: <span className="font-bold">د / محمد حامد</span></p>
              <p>دفعة: <span className="font-bold">2025 / 2026</span></p>
            </div>
          </div>

          {/* الفريق */}
          <h3 className="text-2xl font-bold text-center mb-8">فريق المشروع</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Aya Samir", role: "مدير المشروع", img: "team-member-1.png" },
              { name: "Youssef Mahmoud", role: "المطور الرئيسي", img: "team-member-2.jpg" },
              { name: "Omar Abdullah", role: "مهندس قواعد البيانات", img: "team-member-3.jpg" },
              { name: "Amany ", role: "مصممة الواجهات", img: "team-member-4.jpg" },
            ].map((member, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500 mb-4 bg-white/10 flex items-center justify-center">
                  <img
                    src={`/images/${member.img}`}
                    alt={member.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${member.name}&background=random`;
                    }}
                  />
                </div>
                <p className="font-bold text-lg">{member.name}</p>
                <p className="text-sm text-slate-400">{member.role}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[2rem] border border-cyan-400/20 bg-slate-950/70 p-6 text-center shadow-[0_0_40px_rgba(56,189,248,0.25)]">
            <div className="inline-flex items-center justify-center gap-3 rounded-full border border-cyan-400/30 bg-slate-900/90 px-5 py-4 text-white shadow-[0_0_18px_rgba(56,189,248,0.15)]">
              <span className="text-xs uppercase tracking-[0.35em] text-cyan-300">Developer</span>
              <span className="text-lg font-semibold text-white">Maru-Faltas</span>
              <img src="/images/verify.gif" alt="verified" className="h-7 w-7 rounded-full border border-cyan-300/30 bg-white/10" />
            </div>
            <p className="mt-3 text-sm text-slate-400">تم توثيق المطور رسمياً مع تأثير ضوء نيوني خفيف لتمييز هذا السطر الحاسم.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
