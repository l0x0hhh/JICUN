// 暨存产品页：沿用参考页的产品展示节奏，突出真实使用场景与下载入口。
// 视差滚动统一交给 motion 动效库（useScroll + useTransform + useSpring），背景与内容分层位移。
// 文案全部来自 src/i18n.ts 的中英字典，头部「中 / EN」切换语言，选择记忆在 localStorage。
import { Archive, ArrowRight, Check, Download, Image, LockKeyhole, Menu, ShieldCheck, X } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { dict, type Copy, type Lang } from './i18n'

// DOWNLOAD_URL 指向落地页自己托管的 APK（同源，不跳任何外站）。
// 为什么不用 Gitee 直链：Gitee 附件 CDN 返回 Content-Type: application/zip，
// 安卓浏览器会据此把文件存成 .zip；且手机端还会多一个中转页。
// 自托管 + netlify.toml 里声明 application/vnd.android.package-archive 才能保证下载到 .apk。
// 发新版只需用新包覆盖 public/downloads/jicun.apk，这个常量不用改。
const DOWNLOAD_URL = '/downloads/jicun.apk'
const REPO_URL = 'https://github.com/l0x0hhh/zongce'
const README_URL = 'https://github.com/l0x0hhh/zongce/blob/main/README.md'
const LICENSE_URL = 'https://github.com/l0x0hhh/zongce/blob/main/LICENSE'

const LANG_KEY = 'jicun-lang'

type PhoneVariant = 'home' | 'entry' | 'export'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const SPRING = { stiffness: 80, damping: 22, mass: 0.7 }

// 通用的滚动进入动画：淡入 + 上移，只触发一次。
const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.8, ease: EASE, delay },
})

// 初始语言：优先读上次的选择，否则跟随浏览器语言（非 zh 开头默认英文）。
function initialLang(): Lang {
  if (typeof window === 'undefined') return 'zh'
  // URL 参数优先：?lang=en / ?lang=zh，便于测试和分享指定语言的链接。
  const fromUrl = new URLSearchParams(window.location.search).get('lang')
  if (fromUrl === 'zh' || fromUrl === 'en') return fromUrl
  const saved = window.localStorage.getItem(LANG_KEY)
  if (saved === 'zh' || saved === 'en') return saved
  return (window.navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <a className={`brand ${compact ? 'brand-compact' : ''}`} href="#top" aria-label="暨存首页">
    <img src="/logo.png" alt="" />
    <span>暨存</span>
  </a>
}

// 头部语言切换：与参考样式一致，「中 / EN」当前语言高亮为品牌蓝。
function LangToggle({ lang, onChange, label }: { lang: Lang; onChange: (l: Lang) => void; label: string }) {
  return <div className="lang-toggle" role="group" aria-label={label}>
    <button className={lang === 'zh' ? 'is-active' : ''} onClick={() => onChange('zh')} aria-pressed={lang === 'zh'}>中</button>
    <span className="lang-sep" aria-hidden="true">/</span>
    <button className={lang === 'en' ? 'is-active' : ''} onClick={() => onChange('en')} aria-pressed={lang === 'en'}>EN</button>
  </div>
}

function PhoneMockup({ variant, parallaxY, rotate = 0, t }: { variant: PhoneVariant; parallaxY?: MotionValue<number>; rotate?: number; t: Copy['phone'] }) {
  const style = { y: parallaxY, rotate: rotate || undefined }

  if (variant === 'entry') {
    return <motion.div className="phone phone-entry" style={style} aria-label={t.entry.toolbar}>
      <div className="phone-status"><span>9:41</span><span>▮▮▮　⌁</span></div>
      <div className="phone-toolbar"><b>{t.entry.toolbar}</b><span>{t.entry.save}</span></div>
      <div className="upload-card"><div className="upload-icon"><Image size={22} /></div><b>{t.entry.uploadTitle}</b><small>{t.entry.uploadHint}</small></div>
      <div className="field-list"><div><small>{t.entry.fName}</small><b>{t.entry.fValue}</b></div><div><small>{t.entry.fDate}</small><b>{t.entry.fDateValue}</b></div><div><small>{t.entry.fCat}</small><b>{t.entry.fCatValue}</b></div></div>
    </motion.div>
  }

  if (variant === 'export') {
    return <motion.div className="phone phone-export" style={style} aria-label={t.export.toolbar}>
      <div className="phone-status"><span>9:41</span><span>▮▮▮　⌁</span></div>
      <div className="phone-toolbar"><span>‹</span><b>{t.export.toolbar}</b><span /></div>
      <div className="export-title"><small>{t.export.yearLabel}</small><strong>{t.export.year}</strong><span>{t.export.yearSwitch}</span></div>
      <div className="check-card"><div className="check-badge"><Check size={18} /></div><div><b>{t.export.checkTitle}</b><small>{t.export.checkMeta}</small></div></div>
      <div className="folder-row"><Archive size={18} /><span>{t.export.folder}</span><b>ZIP</b></div>
      <button className="mock-button">{t.export.button}</button>
    </motion.div>
  }

  return <motion.div className="phone phone-home" style={style} aria-label={t.home.greeting}>
    <div className="phone-status"><span>9:41</span><span>▮▮▮　⌁</span></div>
    <div className="home-greeting"><small>{t.home.year}</small><b>{t.home.greeting}</b><span>◌</span></div>
    <div className="home-summary"><div><strong>08</strong><small>{t.home.recorded}</small></div><div><strong>03</strong><small>{t.home.categories}</small></div></div>
    <div className="home-heading"><b>{t.home.recent}</b><span>{t.home.viewAll}</span></div>
    <div className="award-card"><span className="award-dot dot-blue" /><div><b>{t.home.award1}</b><small>{t.home.award1Meta}</small></div><span>›</span></div>
    <div className="award-card"><span className="award-dot dot-yellow" /><div><b>{t.home.award2}</b><small>{t.home.award2Meta}</small></div><span>›</span></div>
    <div className="award-card"><span className="award-dot dot-pink" /><div><b>{t.home.award3}</b><small>{t.home.award3Meta}</small></div><span>›</span></div>
    <div className="phone-tab"><span>⌂<small>{t.home.tab1}</small></span><span>＋<small>{t.home.tab2}</small></span><span>□<small>{t.home.tab3}</small></span></div>
  </motion.div>
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [lang, setLang] = useState<Lang>(initialLang)
  const t = dict[lang]
  const reduceMotion = useReducedMotion()

  // 切语言时同步 <html lang>、标签页标题，并记住选择。
  useEffect(() => {
    document.documentElement.lang = t.meta.htmlLang
    document.title = t.meta.title
    window.localStorage.setItem(LANG_KEY, lang)
  }, [lang, t])

  const switchLang = (next: Lang) => {
    setLang(next)
    setMenuOpen(false)
  }

  // 各区块的滚动进度，驱动不同速度的视差层。
  const heroRef = useRef<HTMLElement | null>(null)
  const screensRef = useRef<HTMLElement | null>(null)
  const featuresRef = useRef<HTMLElement | null>(null)
  const downloadRef = useRef<HTMLElement | null>(null)

  const { scrollYProgress: pageProgress } = useScroll()
  const railProgress = useSpring(pageProgress, { stiffness: 120, damping: 26 })

  // Hero：光斑最慢、手机中速、悬浮图标最快，背景字横向漂移，形成前后层次。
  const { scrollYProgress: heroP } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const orbY = useSpring(useTransform(heroP, [0, 1], [0, 150]), SPRING)
  const labelY = useSpring(useTransform(heroP, [0, 1], [0, -90]), SPRING)
  const glowY = useSpring(useTransform(heroP, [0, 1], [0, 210]), SPRING)
  const heroPhoneY = useSpring(useTransform(heroP, [0, 1], [0, 70]), SPRING)
  const ghostX = useSpring(useTransform(heroP, [0, 1], [0, -180]), SPRING)

  // 界面区：三台手机速度各异，背景色块反向慢移。
  const { scrollYProgress: screensP } = useScroll({ target: screensRef, offset: ['start end', 'end start'] })
  const phoneY1 = useSpring(useTransform(screensP, [0, 1], [-36, 36]), SPRING)
  const phoneY2 = useSpring(useTransform(screensP, [0, 1], [-64, 64]), SPRING)
  const phoneY3 = useSpring(useTransform(screensP, [0, 1], [-50, 50]), SPRING)
  const blobY1 = useSpring(useTransform(screensP, [0, 1], [-110, 110]), SPRING)
  const blobY2 = useSpring(useTransform(screensP, [0, 1], [90, -90]), SPRING)

  // 功能区：背景大号序号随滚动浮动。
  const { scrollYProgress: featuresP } = useScroll({ target: featuresRef, offset: ['start end', 'end start'] })
  const ghostNumY = useSpring(useTransform(featuresP, [0, 1], [-90, 90]), SPRING)

  // 下载区：双圆环反向缩放，营造纵深。
  const { scrollYProgress: downloadP } = useScroll({ target: downloadRef, offset: ['start end', 'end start'] })
  const ringScaleOuter = useSpring(useTransform(downloadP, [0, 1], [0.92, 1.06]), SPRING)
  const ringScaleInner = useSpring(useTransform(downloadP, [0, 1], [1.05, 0.95]), SPRING)

  // 用户开启「减弱动态效果」时关闭视差，保留静态排版。
  const pv = (value: MotionValue<number>) => (reduceMotion ? undefined : value)

  return <main>
    <a className="skip-link" href="#main">{t.a11y.skip}</a>

    {/* 宽屏两侧的装饰轨：左侧品牌竖排文字 + 阅读进度，右侧章节锚点。 */}
    <div className="side-rail side-rail-left" aria-hidden="true">
      <span className="rail-text">{t.rail}</span>
      <span className="rail-progress"><motion.span style={{ scaleY: railProgress }} /></span>
    </div>
    <nav className="side-rail side-rail-right" aria-label={lang === 'zh' ? '页面章节导航' : 'Section navigation'}>
      <a href="#top" aria-label={t.a11y.railTop} />
      <a href="#screenshots" aria-label={t.a11y.railScreens} />
      <a href="#features" aria-label={t.a11y.railFeatures} />
      <a href="#privacy" aria-label={t.a11y.railPrivacy} />
      <a href="#download" aria-label={t.a11y.railDownload} />
    </nav>

    <header className="site-header shell">
      <Brand compact />
      <nav className={menuOpen ? 'is-open' : ''}>
        <a href="#screenshots" onClick={() => setMenuOpen(false)}>{t.nav.screens}</a>
        <a href="#features" onClick={() => setMenuOpen(false)}>{t.nav.features}</a>
        <a href="#privacy" onClick={() => setMenuOpen(false)}>{t.nav.privacy}</a>
        <a href="#download" onClick={() => setMenuOpen(false)}>{t.nav.download}</a>
      </nav>
      <div className="header-actions">
        <LangToggle lang={lang} onChange={switchLang} label={t.a11y.langToggle} />
        <a className="header-download" href={DOWNLOAD_URL} target="_blank" rel="noreferrer"><Download size={15} /> {t.headerCta}</a>
      </div>
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? t.a11y.menuClose : t.a11y.menuOpen}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
    </header>

    <div id="main">
      <section className="hero shell" id="top" ref={heroRef}>
        <div className="hero-ghost-layer" aria-hidden="true">
          <motion.div className="hero-ghost" style={{ x: pv(ghostX), rotate: 90 }}>JICUN</motion.div>
        </div>
        <motion.div className="hero-copy" initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: EASE }}>
          <h1>{t.hero.h1a}<br /><span>{t.hero.h1b}</span></h1>
          <p>{t.hero.p1}<br />{t.hero.p2}</p>
          <div className="hero-actions"><a className="button button-primary" href={DOWNLOAD_URL} target="_blank" rel="noreferrer"><Download size={16} /> {t.hero.cta}</a><a className="text-link" href="#features">{t.hero.more} <ArrowRight size={15} /></a></div>
          <small className="platform-note">{t.hero.note}</small>
        </motion.div>
        <motion.div className="hero-visual" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 1, ease: EASE }}>
          <motion.div className="hero-orb" style={{ y: pv(orbY) }} />
          <motion.div className="hero-label" style={{ y: pv(labelY), rotate: -90 }}>{t.hero.labelTop}<br /><span>{t.hero.labelSub}</span></motion.div>
          <motion.div className="hero-logo-glow" style={{ y: pv(glowY), rotate: 9 }}><img src="/logo.png" alt="" /></motion.div>
          <PhoneMockup variant="home" parallaxY={pv(heroPhoneY)} rotate={4} t={t.phone} />
        </motion.div>
      </section>

      <section className="section screenshots" id="screenshots" ref={screensRef}>
        <motion.div className="screenshots-blob blob-left" style={{ y: pv(blobY1) }} aria-hidden="true" />
        <motion.div className="screenshots-blob blob-right" style={{ y: pv(blobY2) }} aria-hidden="true" />
        <div className="shell">
          <motion.div className="section-intro" {...reveal()}>
            <div><h2>{t.screens.h2a}<br /><em>{t.screens.h2b}</em></h2></div>
            <p>{t.screens.p1}<br />{t.screens.p2}</p>
          </motion.div>
          <div className="screen-grid">
            <motion.article className="screen-card screen-card-main" initial={{ opacity: 0, y: 38 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.8, ease: [0.2, 0.75, 0.25, 1], delay: 0.2 }} whileHover={{ y: -10 }}>
              <PhoneMockup variant="home" parallaxY={pv(phoneY1)} t={t.phone} />
              <div><span>{t.screens.homeTag}</span><h3>{t.screens.homeTitle}</h3><p>{t.screens.homeDesc}</p></div>
            </motion.article>
            <motion.article className="screen-card" initial={{ opacity: 0, y: 38 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.8, ease: [0.2, 0.75, 0.25, 1], delay: 0.1 }} whileHover={{ y: -10 }}>
              <PhoneMockup variant="entry" parallaxY={pv(phoneY2)} t={t.phone} />
              <div><span>{t.screens.entryTag}</span><h3>{t.screens.entryTitle}</h3><p>{t.screens.entryDesc}</p></div>
            </motion.article>
            <motion.article className="screen-card" initial={{ opacity: 0, y: 38 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.8, ease: [0.2, 0.75, 0.25, 1], delay: 0.2 }} whileHover={{ y: -10 }}>
              <PhoneMockup variant="export" parallaxY={pv(phoneY3)} t={t.phone} />
              <div><span>{t.screens.exportTag}</span><h3>{t.screens.exportTitle}</h3><p>{t.screens.exportDesc}</p></div>
            </motion.article>
          </div>
        </div>
      </section>

      <section className="section features" id="features" ref={featuresRef}>
        <motion.div className="features-ghost" style={{ y: pv(ghostNumY) }} aria-hidden="true">02</motion.div>
        <div className="shell">
          <motion.div className="section-intro compact-intro" {...reveal()}>
            <div><h2>{t.features.h2a}<br /><em>{t.features.h2b}</em></h2></div>
            <p>{t.features.p1}<br />{t.features.p2}</p>
          </motion.div>
          <div className="feature-grid">
            <motion.article initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease: EASE }} whileHover={{ y: -8 }}><span className="feature-icon"><Image size={20} /></span><b>{t.features.photoTitle}</b><p>{t.features.photoDesc}</p></motion.article>
            <motion.article initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease: EASE, delay: 0.08 }} whileHover={{ y: -8 }}><span className="feature-icon"><Archive size={20} /></span><b>{t.features.yearTitle}</b><p>{t.features.yearDesc}</p></motion.article>
            <motion.article initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease: EASE, delay: 0.16 }} whileHover={{ y: -8 }}><span className="feature-icon"><Check size={20} /></span><b>{t.features.checkTitle}</b><p>{t.features.checkDesc}</p></motion.article>
            <motion.article initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, ease: EASE, delay: 0.24 }} whileHover={{ y: -8 }}><span className="feature-icon"><ArrowRight size={20} /></span><b>{t.features.packTitle}</b><p>{t.features.packDesc}</p></motion.article>
          </div>
        </div>
      </section>

      <section className="section trust" id="privacy">
        <motion.div className="shell trust-grid" {...reveal()}>
          <div><h2>{t.privacy.h2a}<br /><em>{t.privacy.h2b}</em></h2></div>
          <div className="trust-copy">
            <ShieldCheck size={28} />
            <p>{t.privacy.body}</p>
            <a className="text-link" href="#download">{t.privacy.link} <ArrowRight size={15} /></a>
            <div className="trust-points"><span><LockKeyhole size={15} /> {t.privacy.point1}</span><span><Check size={15} /> {t.privacy.point2}</span></div>
          </div>
        </motion.div>
      </section>

      <section className="download-section section" id="download" ref={downloadRef}>
        <motion.div className="download-ring ring-outer" style={{ scale: pv(ringScaleOuter) }} aria-hidden="true" />
        <motion.div className="download-ring ring-inner" style={{ scale: pv(ringScaleInner) }} aria-hidden="true" />
        <motion.div className="shell download-inner" {...reveal()}>
          <h2>{t.download.h2a}<br /><em>{t.download.h2b}</em></h2>
          <p>{t.download.p}</p>
          <a className="button button-dark" href={DOWNLOAD_URL} target="_blank" rel="noreferrer"><Download size={16} /> {t.download.cta}</a>
          <small>{t.download.note}</small>
        </motion.div>
      </section>
    </div>

    <footer className="site-footer">
      <div className="shell footer-inner">
        <div className="footer-top">
          <a className="footer-brand" href="#top" aria-label={t.a11y.railTop}>
            <img src="/logo.png" alt="" />
            <span>暨存 JICUN</span>
          </a>
          <nav className="footer-links" aria-label="Links">
            <a href={REPO_URL} target="_blank" rel="noreferrer">{t.footer.repo}</a>
            <a href={README_URL} target="_blank" rel="noreferrer">{t.footer.readme}</a>
            <a href="#privacy">{t.footer.privacy}</a>
            <a href={LICENSE_URL} target="_blank" rel="noreferrer">{t.footer.license}</a>
            <a href={DOWNLOAD_URL} target="_blank" rel="noreferrer">{t.footer.download}</a>
          </nav>
        </div>
        <p className="footer-note">{t.footer.note}</p>
      </div>
    </footer>
  </main>
}

export default App
