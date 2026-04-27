'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Check,
  ChevronRight,
  Globe,
  Lock,
  Menu,
  X,
  TrendingUp,
  Users,
  FileText,
  PieChart,
  BarChart3,
  Zap,
  Shield,
  Clock,
  Smartphone
} from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-sans text-slate-900">

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2">
                <img src="/icon.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-md border border-white/50" />
                <span className="text-lg font-extrabold">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">OurSpace</span>
                </span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-slate-700 hover:text-blue-600 font-medium transition">{t('landing.nav.features')}</a>
              <a href="#accounting" className="text-slate-700 hover:text-blue-600 font-medium transition">{t('landing.nav.accounting')}</a>
              <a href="#pricing" className="text-slate-700 hover:text-blue-600 font-medium transition">{t('landing.nav.pricing')}</a>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/auth/login" className="text-slate-900 font-semibold hover:text-blue-600 transition">
                {t('landing.nav.login')}
              </Link>
              <Link href="http://localhost:3001/register?redirect_url=http://localhost:3000/dashboard&app=business" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full font-bold hover:shadow-lg hover:scale-105 transition-all duration-200">
                {t('landing.nav.free_trial')}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-900">
                {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-6 space-y-4 shadow-lg">
            <a href="#features" className="block text-slate-700 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.features')}</a>
            <a href="#accounting" className="block text-slate-700 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.accounting')}</a>
            <a href="#pricing" className="block text-slate-700 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>{t('landing.nav.pricing')}</a>
            <Link href="/auth/login" className="block text-slate-900 font-bold py-2">{t('landing.nav.login')}</Link>
            <Link href="http://localhost:3001/register?redirect_url=http://localhost:3000/dashboard&app=business" className="block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-center">{t('landing.nav.free_trial')}</Link>
          </div>
        )}
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-3xl opacity-40 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-100 to-pink-100 rounded-full blur-3xl opacity-40 animate-pulse"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto mb-16">


            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-8">
              <Trans
                i18nKey="landing.hero.title"
                components={{
                  1: <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent" />,
                  2: <br />
                }}
              />
            </h1>

            <p className="text-xl sm:text-lg text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              <Trans
                i18nKey="landing.hero.subtitle"
                components={{
                  1: <span className="font-bold text-blue-600" />,
                  2: <span className="font-bold text-indigo-600" />
                }}
              />
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link href="http://localhost:3001/register?redirect_url=http://localhost:3000/dashboard&app=business" className="group bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-5 rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center">
                {t('landing.hero.cta_start')}
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={24} />
              </Link>
              <Link href="#accounting" className="bg-white text-slate-900 border-2 border-slate-200 px-10 py-5 rounded-full font-bold text-lg hover:bg-slate-50 hover:border-blue-300 transition-all duration-300 flex items-center justify-center">
                <BarChart3 className="mr-2" size={24} />
                {t('landing.hero.cta_view')}
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-8 text-sm text-slate-600">
              <div className="flex items-center">
                <Check className="text-green-500 mr-2" size={20} />
                <span>
                  <Trans
                    i18nKey="landing.hero.proof.companies"
                    components={{ 1: <strong className="text-slate-900" /> }}
                  />
                </span>
              </div>
              <div className="flex items-center">
                <Check className="text-green-500 mr-2" size={20} />
                <span>
                  <Trans
                    i18nKey="landing.hero.proof.ohada"
                    components={{ 1: <strong className="text-slate-900" /> }}
                  />
                </span>
              </div>
              <div className="flex items-center">
                <Check className="text-green-500 mr-2" size={20} />
                <span>
                  <Trans
                    i18nKey="landing.hero.proof.start"
                    components={{ 1: <strong className="text-slate-900" /> }}
                  />
                </span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-6xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur-3xl opacity-20"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 p-2 sm:p-4">
              <Image
                src="/dashboard-preview.png"
                alt="OurSpace Dashboard Preview"
                width={1200}
                height={800}
                className="w-full h-auto rounded-2xl shadow-lg"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- ACCOUNTING HIGHLIGHT --- */}
      <section id="accounting" className="py-24 bg-gradient-to-br from-slate-900 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              <Trans
                i18nKey="landing.accounting.title"
                components={{ 1: <span className="text-blue-400" /> }}
              />
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              {t('landing.accounting.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <AccountingFeature
              icon={<Zap className="text-yellow-400" size={32} />}
              title={t('landing.accounting.features.auto_entries.title')}
              description={t('landing.accounting.features.auto_entries.desc')}
            />
            <AccountingFeature
              icon={<BarChart3 className="text-green-400" size={32} />}
              title={t('landing.accounting.features.financial_states.title')}
              description={t('landing.accounting.features.financial_states.desc')}
            />
            <AccountingFeature
              icon={<FileText className="text-blue-400" size={32} />}
              title={t('landing.accounting.features.ohada_plan.title')}
              description={t('landing.accounting.features.ohada_plan.desc')}
            />
          </div>

          <div className="mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-lg font-bold mb-4">{t('landing.accounting.how_it_works.title')}</h3>
                <ul className="space-y-3">
                  {(t('landing.accounting.how_it_works.steps', { returnObjects: true }) as string[]).map((step, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="text-green-400 mr-3 flex-shrink-0 mt-1" size={20} />
                      <span className="text-blue-50">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="text-xs text-blue-300 font-mono mb-2">{t('landing.accounting.how_it_works.journal_entry')}</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">411 - Clients (DR)</span>
                    <span className="font-bold text-white">$1,000,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">706 - Services (CR)</span>
                    <span className="font-bold text-white">$1,000,000</span>
                  </div>
                  <div className="pt-2 border-t border-slate-600 text-green-400 text-xs font-semibold">
                    {t('landing.accounting.how_it_works.balanced')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- KEY FEATURES --- */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
              {t('landing.key_features.title')}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {t('landing.key_features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            <Feature
              icon={<FileText className="text-blue-600" size={32} />}
              title={t('landing.key_features.list.billing.title')}
              description={t('landing.key_features.list.billing.desc')}
            />
            <Feature
              icon={<Users className="text-indigo-600" size={32} />}
              title={t('landing.key_features.list.hr.title')}
              description={t('landing.key_features.list.hr.desc')}
            />
            <Feature
              icon={<PieChart className="text-purple-600" size={32} />}
              title={t('landing.key_features.list.budgets.title')}
              description={t('landing.key_features.list.budgets.desc')}
            />
            <Feature
              icon={<TrendingUp className="text-green-600" size={32} />}
              title={t('landing.key_features.list.reports.title')}
              description={t('landing.key_features.list.reports.desc')}
            />
            <Feature
              icon={<Globe className="text-orange-600" size={32} />}
              title={t('landing.key_features.list.crm.title')}
              description={t('landing.key_features.list.crm.desc')}
            />
            <Feature
              icon={<Smartphone className="text-pink-600" size={32} />}
              title={t('landing.key_features.list.mobile.title')}
              description={t('landing.key_features.list.mobile.desc')}
            />
          </div>
        </div>
      </section>

      {/* --- WHY KUMBA --- */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-slate-900 mb-6">
                {t('landing.why.title')}
              </h2>
              <div className="space-y-6">
                <WhyItem
                  icon={<Clock className="text-blue-600" size={24} />}
                  title={t('landing.why.items.time.title')}
                  description={t('landing.why.items.time.desc')}
                />
                <WhyItem
                  icon={<Shield className="text-green-600" size={24} />}
                  title={t('landing.why.items.ohada.title')}
                  description={t('landing.why.items.ohada.desc')}
                />
                <WhyItem
                  icon={<Lock className="text-indigo-600" size={24} />}
                  title={t('landing.why.items.secure.title')}
                  description={t('landing.why.items.secure.desc')}
                />
                <WhyItem
                  icon={<TrendingUp className="text-purple-600" size={24} />}
                  title={t('landing.why.items.vision.title')}
                  description={t('landing.why.items.vision.desc')}
                />
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-lg mb-4 text-slate-900">{t('landing.why.preview.title')}</h3>
                  <div className="space-y-2 text-sm">
                    <BalanceRow code="411" name="Clients" debit="600,000" credit="0" />
                    <BalanceRow code="53" name="Caisse" debit="300,000" credit="0" />
                    <BalanceRow code="401" name="Fournisseurs" debit="0" credit="500,000" />
                    <BalanceRow code="706" name="Services" debit="0" credit="600,000" />
                    <div className="pt-3 border-t-2 border-slate-300 flex justify-between font-bold">
                      <span>{t('landing.why.preview.totals')}</span>
                      <div className="space-x-8">
                        <span className="text-blue-600">900,000</span>
                        <span className="text-green-600">1,100,000</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                  <Check className="text-green-600 mx-auto mb-2" size={32} />
                  <p className="font-bold text-green-900">{t('landing.why.preview.balanced')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-xl text-slate-600">{t('landing.pricing.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <PricingCard
              name={t('landing.pricing.plans.starter.name')}
              price={t('landing.pricing.plans.starter.price')}
              period={t('landing.pricing.plans.starter.period')}
              description={t('landing.pricing.plans.starter.desc')}
              features={t('landing.pricing.plans.starter.features', { returnObjects: true }) as string[]}
              cta={t('landing.pricing.plans.starter.cta')}
              ctaLink="http://localhost:3001/register?redirect_url=http://localhost:3000/dashboard&app=business"
            />

            {/* Pro */}
            <PricingCard
              name={t('landing.pricing.plans.pro.name')}
              price={t('landing.pricing.plans.pro.price')}
              period={t('landing.pricing.plans.pro.period')}
              description={t('landing.pricing.plans.pro.desc')}
              popular
              popularLabel={t('landing.pricing.plans.pro.popular')}
              features={t('landing.pricing.plans.pro.features', { returnObjects: true }) as string[]}
              cta={t('landing.pricing.plans.pro.cta')}
              ctaLink="http://localhost:3001/register?redirect_url=http://localhost:3000/dashboard&app=business&plan=pro"
            />

            {/* Enterprise */}
            <PricingCard
              name={t('landing.pricing.plans.enterprise.name')}
              price={t('landing.pricing.plans.enterprise.price')}
              period={t('landing.pricing.plans.enterprise.period')}
              description={t('landing.pricing.plans.enterprise.desc')}
              features={t('landing.pricing.plans.enterprise.features', { returnObjects: true }) as string[]}
              cta={t('landing.pricing.plans.enterprise.cta')}
              ctaLink="/contact"
            />
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute w-96 h-96 bg-white rounded-full blur-3xl top-0 left-0"></div>
          <div className="absolute w-96 h-96 bg-white rounded-full blur-3xl bottom-0 right-0"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6">
            {t('landing.cta_final.title')}
          </h2>
          <p className="text-xl md:text-lg text-blue-100 mb-10">
            {t('landing.cta_final.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="http://localhost:3001/register?redirect_url=http://localhost:3000/dashboard&app=business" className="bg-white text-blue-600 px-10 py-5 rounded-full font-bold text-lg hover:bg-blue-50 hover:scale-105 transition-all duration-300 shadow-2xl">
              {t('landing.cta_final.cta1')}
            </Link>
            <a href="#accounting" className="bg-transparent border-2 border-white px-10 py-5 rounded-full font-bold text-lg hover:bg-white/10 transition-all duration-300">
              {t('landing.cta_final.cta2')}
            </a>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">O</span>
                </div>
                <span className="text-xl font-bold text-white">OurSpace</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t('landing.footer.desc')}
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">{t('landing.footer.product')}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">{t('landing.nav.features')}</a></li>
                <li><a href="#accounting" className="hover:text-white transition">{t('landing.nav.accounting')}</a></li>
                <li><a href="#pricing" className="hover:text-white transition">{t('landing.nav.pricing')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">{t('landing.footer.company')}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">{t('landing.footer.about')}</a></li>
                <li><a href="#" className="hover:text-white transition">{t('landing.footer.contact')}</a></li>
                <li><a href="#" className="hover:text-white transition">{t('landing.footer.blog')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">{t('landing.footer.legal')}</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">{t('landing.footer.privacy')}</a></li>
                <li><a href="#" className="hover:text-white transition">{t('landing.footer.terms')}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-sm">
            <p>{t('landing.footer.copyright', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper Components

function AccountingFeature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-blue-100 leading-relaxed">{description}</p>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border-2 border-slate-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
        <p className="text-slate-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function WhyItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function BalanceRow({ code, name, debit, credit }: { code: string; name: string; debit: string; credit: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-600">
        <span className="font-mono font-bold">{code}</span> {name}
      </span>
      <div className="space-x-6">
        <span className="text-blue-600 font-semibold">{debit !== "0" ? debit : "-"}</span>
        <span className="text-green-600 font-semibold">{credit !== "0" ? credit : "-"}</span>
      </div>
    </div>
  );
}

function PricingCard({ name, price, period, description, features, cta, ctaLink, popular, popularLabel }: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink: string;
  popular?: boolean;
  popularLabel?: string;
}) {
  return (
    <div className={`relative rounded-3xl p-8 ${popular ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl scale-105 border-4 border-blue-300' : 'bg-white border-2 border-slate-200 hover:shadow-xl'} transition-all duration-300`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-xs font-bold">
          {popularLabel}
        </div>
      )}
      <h3 className={`text-lg font-bold mb-2 ${popular ? 'text-white' : 'text-slate-900'}`}>{name}</h3>
      <div className="mb-4">
        <span className="text-5xl font-extrabold">{price}</span>
        <span className={`text-lg ${popular ? 'text-blue-100' : 'text-slate-500'}`}>{period}</span>
      </div>
      <p className={`mb-6 ${popular ? 'text-blue-100' : 'text-slate-600'}`}>{description}</p>
      <Link href={ctaLink} className={`block w-full py-4 px-6 rounded-full font-bold text-center transition-all duration-300 ${popular ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-105'}`}>
        {cta}
      </Link>
      <ul className="mt-8 space-y-3">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start">
            <Check className={`flex-shrink-0 mr-3 mt-0.5 ${popular ? 'text-blue-200' : 'text-green-500'}`} size={18} />
            <span className={`text-sm ${popular ? 'text-blue-50' : 'text-slate-700'}`}>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
