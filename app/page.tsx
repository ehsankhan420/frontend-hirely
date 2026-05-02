"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, Variants } from "framer-motion";
import {
  BadgeCheck,
  Zap,
  ArrowRight,
  ShieldCheck,
  LineChart,
  CheckCircle2,
  Mail
} from "lucide-react";
import Image from "next/image";

const STAGGER_CHILD_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } }
};

const STAGGER_CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-lg border-b border-slate-200/50">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center group cursor-pointer">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm transition-transform group-hover:scale-105">
              <Image 
                src="/hirely_wordmark_white.png" 
                alt="Hirely" 
                width={100}
                height={20}
                className="h-5 w-auto object-contain"
                priority
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
               <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
               Sign in
               </Link>
            <Link href="/register">
              <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-5 shadow-sm">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 px-6 overflow-hidden">
         {/* Abstract background gradient elements matching Stripe/Notion's soft mesh */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-tr from-indigo-100/40 via-purple-50/40 to-cyan-50/40 blur-3xl -z-10 rounded-full" />
         
        <motion.div 
         variants={STAGGER_CONTAINER_VARIANTS}
         initial="hidden"
         animate="show"
         className="container mx-auto max-w-4xl text-center z-10 relative"
        >
          <motion.div variants={STAGGER_CHILD_VARIANTS} className="flex justify-center mb-6">
            <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-3 py-1 text-xs font-semibold rounded-full shadow-sm shadow-indigo-100/50">
               <ShieldCheck className="h-3.5 w-3.5 mr-1.5 inline -mt-0.5" />
               100% Verified UK Sponsors
            </Badge>
          </motion.div>
          
          <motion.h1 
            variants={STAGGER_CHILD_VARIANTS}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]"
         >
            Get a job that <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
               actually sponsors your visa.
            </span>
          </motion.h1>
          
          <motion.p 
            variants={STAGGER_CHILD_VARIANTS}
            className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed"
         >
                  Stop wasting applications on companies that can&apos;t hire internationals. 
            Hirely cross-references millions of jobs with the Home Office register to show you exclusively eligible roles.
          </motion.p>
          
          <motion.div variants={STAGGER_CHILD_VARIANTS} className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/register">
              <Button size="lg" className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 text-base shadow-md shadow-indigo-600/20 group">
                Start searching for free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="text-sm text-slate-500 sm:hidden">No credit card required</p>
          </motion.div>

         </motion.div>

         {/* Dashboard Conceptual Mockup */}
         <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 100, damping: 20 }}
            className="mt-20 max-w-5xl mx-auto relative z-10 px-4 sm:px-0 hidden md:block"
         >
            <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200/60 p-2 overflow-hidden flex flex-col items-center">
               <div className="w-full h-8 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2 rounded-t-xl">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
               </div>
               
               {/* Mockup Interface */}
               <div className="w-full bg-white p-8 grid grid-cols-12 gap-8">
                  <div className="col-span-4 space-y-4">
                     <div className="w-full h-10 bg-slate-100 rounded-lg animate-pulse" />
                     <div className="w-full p-4 border border-indigo-100 bg-indigo-50/30 rounded-xl space-y-3">
                        <div className="flex justify-between items-start">
                           <div className="w-24 h-4 bg-indigo-200 rounded animate-pulse" />
                           <Badge className="bg-indigo-100 text-indigo-700">98% Match</Badge>
                        </div>
                        <div className="w-48 h-6 bg-slate-200 rounded animate-pulse" />
                        <div className="flex gap-2">
                           <div className="w-16 h-3 bg-slate-100 rounded" />
                           <div className="w-16 h-3 bg-slate-100 rounded" />
                        </div>
                     </div>
                     <div className="w-full p-4 border border-slate-100 rounded-xl space-y-3 opacity-60">
                        <div className="flex justify-between items-start">
                           <div className="w-20 h-4 bg-slate-200 rounded" />
                           <Badge variant="outline" className="text-slate-400">82% Match</Badge>
                        </div>
                        <div className="w-40 h-6 bg-slate-200 rounded" />
                     </div>
                  </div>
                  <div className="col-span-8 flex flex-col justify-center border border-slate-100 rounded-xl p-8 shadow-sm">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-slate-100 rounded-xl" />
                        <div>
                           <h3 className="text-2xl font-bold text-slate-800">Senior Fullstack Engineer</h3>
                           <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
                              Acme Corp Ltd <BadgeCheck className="w-4 h-4 text-indigo-500" />
                           </p>
                        </div>
                     </div>
                     <div className="flex gap-3 mb-8">
                        <Badge variant="secondary" className="bg-slate-100">London, Hybrid</Badge>
                        <Badge variant="secondary" className="bg-slate-100">£60,000 - £85,000</Badge>
                        <Badge className="bg-emerald-50 text-emerald-700 border-none"><Zap className="w-3 h-3 mr-1" /> Active Sponsor</Badge>
                     </div>
                     <div className="space-y-3 w-3/4">
                        <div className="w-full h-3 bg-slate-100 rounded" />
                        <div className="w-[90%] h-3 bg-slate-100 rounded" />
                        <div className="w-[95%] h-3 bg-slate-100 rounded" />
                        <div className="w-[80%] h-3 bg-slate-100 rounded" />
                     </div>
                  </div>
               </div>
            </div>
         </motion.div>
      </section>

      {/* Trust & Stats Section */}
      <section className="py-12 border-y border-slate-200/60 bg-white">
         <div className="container mx-auto max-w-5xl px-6">
            <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">
               Empowering International Talent Worldwide
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100">
               {[
               { value: "50k+", label: "Verified UK Sponsors" },
               { value: "100%", label: "Eligibility Guaranteed" },
               { value: "10k+", label: "Daily New Postings" },
               { value: "AI", label: "Semantic CV Matching" },
               ].map((stat, idx) => (
               <div key={stat.label} className={idx === 0 ? "" : "pl-6 md:pl-0"}>
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{stat.value}</div>
                  <div className="text-sm font-medium text-slate-500 mt-1">{stat.label}</div>
               </div>
               ))}
            </div>
         </div>
      </section>

      {/* Modern Features Layout - Z Pattern */}
      <section className="py-24 px-6 bg-slate-50 overflow-hidden">
         <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-20">
               <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
                  Everything you need to land the visa.
               </h2>
               <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                  We stripped away the noise. Just raw, verified data and powerful algorithms to connect your skills directly with employers who have the legal right to hire you.
               </p>
            </div>

            <div className="space-y-32">
               {/* Feature 1 */}
               <div className="flex flex-col md:flex-row items-center gap-12">
                  <div className="flex-1 space-y-6">
                     <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <ShieldCheck className="w-6 h-6" />
                     </div>
                     <h3 className="text-2xl font-bold text-slate-900">Zero guesswork. Just sponsors.</h3>
                     <p className="text-slate-500 leading-relaxed text-lg">
                        Traditional job boards are flooded with companies that refuse to sponsor visas. Our engine individually validates every single listing against the live UK Home Office database.
                     </p>
                     <ul className="space-y-3">
                        {["Real-time synchronization with gov.uk", "Filters out inactive & suspended licences", "Validates Tier 2 & Skilled Worker registers"].map(point => (
                           <li key={point} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                              <CheckCircle2 className="w-5 h-5 text-indigo-500" /> {point}
                           </li>
                        ))}
                     </ul>
                  </div>
                  <div className="flex-1 w-full bg-white border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/40 p-8 transition-transform duration-500 hover:-translate-y-1">
                     <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                           <span className="font-semibold text-slate-700">Data Source</span>
                           <Badge variant="outline" className="text-slate-500">Connecting...</Badge>
                        </div>
                        <div className="flex items-center gap-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100/50">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="font-semibold text-indigo-900">HomeOfficeRegistry.csv</span>
                           <span className="ml-auto text-xs text-indigo-400 font-mono">200 OK</span>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                           <div className="w-2 h-2 rounded-full bg-emerald-500" />
                           <span className="font-semibold text-slate-700">LinkedIn Scraper Node</span>
                           <span className="ml-auto text-xs text-slate-400 font-mono">14ms</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Feature 2 */}
               <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                  <div className="flex-1 space-y-6">
                     <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600">
                        <LineChart className="w-6 h-6" />
                     </div>
                     <h3 className="text-2xl font-bold text-slate-900">Resume Matching Engine.</h3>
                     <p className="text-slate-500 leading-relaxed text-lg">
                        Upload your CV once. Our semantic matching algorithm extracts your specific tech stack and automatically grades every sponsor job against your exact qualifications.
                     </p>
                  </div>
                  <div className="flex-1 w-full bg-white border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/40 p-8 transition-transform duration-500 hover:-translate-y-1">
                     <div className="flex flex-col gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-500 flex items-center justify-center">
                              <span className="font-bold text-slate-700 text-sm">98%</span>
                           </div>
                           <div>
                              <p className="font-bold text-slate-800">Perfect Match found</p>
                              <p className="text-xs text-slate-500">4 requirements met exactly (React, Node, SQL)</p>
                           </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4 opacity-50">
                           <div className="w-12 h-12 rounded-full border-4 border-amber-100 border-t-amber-500 flex items-center justify-center">
                              <span className="font-bold text-slate-700 text-sm">65%</span>
                           </div>
                           <div>
                              <p className="font-bold text-slate-800">Partial Match</p>
                              <p className="text-xs text-slate-500">Missing AWS experience requirement</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Pricing Section - Minimalist */}
      <section className="py-24 bg-white px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4">Start simple, upgrade when you&apos;re ready.</h2>
          <p className="text-slate-500 mb-16">Always 100% verified sponsors. Pick the tier that matches your dedication.</p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
            {/* Free */}
            <div className="border border-slate-200 rounded-3xl p-8 hover:border-slate-300 transition-colors">
               <h3 className="text-xl font-bold text-slate-900 mb-2">Freemium</h3>
               <p className="text-slate-500 text-sm mb-6">For casual searching and validation.</p>
               <div className="mb-8">
                  <span className="text-4xl font-extrabold text-slate-900">£0</span>
               </div>
               <ul className="space-y-4 mb-8">
                  {[
                     "Automated CV Parsing",
                     "3 full match jobs per search",
                     "Save up to 3 jobs",
                     "Access to verified sponsor database"
                  ].map(f => (
                     <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                        <CheckCircle2 className="w-5 h-5 text-slate-300 shrink-0" />
                        {f}
                     </li>
                  ))}
               </ul>
               <Link href="/register">
                  <Button className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold" variant="secondary" size="lg">Start Free</Button>
               </Link>
            </div>

            {/* Premium */}
            <div className="border border-indigo-600 rounded-3xl p-8 bg-indigo-600 text-white relative shadow-2xl shadow-indigo-600/20 transform md:-translate-y-4">
               <div className="absolute top-0 right-8 -translate-y-1/2">
                  <span className="bg-gradient-to-r from-teal-400 to-cyan-400 text-indigo-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</span>
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Hirely Premium</h3>
               <p className="text-indigo-200 text-sm mb-6">Unrestricted access for serious applicants.</p>
               <div className="mb-8">
                  <span className="text-4xl font-extrabold text-white">£6.99</span>
                  <span className="text-indigo-200 font-medium tracking-wide"> /month</span>
               </div>
               <ul className="space-y-4 mb-8">
                  {[
                     "Unlimited matched job results",
                     "Full semantic requirement breakdowns",
                     "Unlimited saved & tracked jobs",
                     "Priority application support",
                     "No feature limits"
                  ].map(f => (
                     <li key={f} className="flex items-start gap-3 text-sm text-white">
                        <CheckCircle2 className="w-5 h-5 text-indigo-300 shrink-0" />
                        {f}
                     </li>
                  ))}
               </ul>
               <Link href="/register">
                  <Button className="w-full rounded-xl bg-white hover:bg-white/90 text-indigo-900 font-bold" size="lg">Get Premium</Button>
               </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-24 bg-slate-900 px-6 text-center">
         <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
               Stop guessing. Start applying.
            </h2>
            <p className="text-slate-400 text-lg mb-10">
               Join thousands of international candidates utilizing highly specific data matching to find secure sponsorship roles within completely verified companies.
            </p>
            <Link href="/register">
               <Button size="lg" className="rounded-full bg-white text-slate-900 hover:bg-slate-100 px-10 h-14 text-lg font-bold shadow-xl shadow-white/10">
                  Create your profile now
               </Button>
            </Link>
         </div>
      </section>

      {/* Modern, Comprehensive Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 pt-20 pb-10 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
            
            {/* Branding Column */}
            <div className="md:col-span-4 space-y-6">
              <div className="flex items-center">
                <div className="bg-blue-600/10 border border-blue-500/20 p-2 rounded-xl shadow-sm backdrop-blur-sm">
                  <Image 
                    src="/hirely_wordmark_white.png" 
                    alt="Hirely" 
                    width={100}
                    height={20}
                    className="h-5 w-auto object-contain"
                    priority
                  />
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Empowering global talent by connecting them directly with verified UK Tier 2 visa sponsors. Your pathway to the UK, simplified.
              </p>
              <div className="flex gap-4 pt-2">
                <Link href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-sm border border-slate-800">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-sm border border-slate-800">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-sm border border-slate-800">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
              <div className="space-y-5">
                <h4 className="text-white font-semibold text-sm tracking-wide">Platform</h4>
                <ul className="space-y-3">
                  <li><Link href="/jobs" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Find Jobs</Link></li>
                  <li><Link href="/register" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Create Profile</Link></li>
                  <li><Link href="/login" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Sign In</Link></li>
                  <li><Link href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Pricing</Link></li>
                </ul>
              </div>
              
              <div className="space-y-5">
                <h4 className="text-white font-semibold text-sm tracking-wide">Company</h4>
                <ul className="space-y-3">
                  <li><Link href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">About Us</Link></li>
                  <li><Link href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Our Mission</Link></li>
                  <li><Link href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Careers</Link></li>
                  <li><Link href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors flex items-center gap-2">Contact <Mail className="w-3 h-3" /></Link></li>
                </ul>
              </div>

              <div className="space-y-5">
                <h4 className="text-white font-semibold text-sm tracking-wide">Legal</h4>
                <ul className="space-y-3">
                  <li><Link href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Privacy Policy</Link></li>
                  <li><Link href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Terms of Service</Link></li>
                  <li><Link href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Cookie Policy</Link></li>
                  <li><Link href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Sponsorship Disclaimer</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-900/50">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Hirely UK. All rights reserved.
            </p>
            <div className="flex items-center gap-2 mt-4 md:mt-0 text-slate-500 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
