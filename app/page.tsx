"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { motion, Variants } from "framer-motion";
import {
  CheckCircle2,
  Mail,
  XCircle,
  Clock,
  ArrowRight,
  UploadCloud,
  Cpu,
  Send,
  ShieldCheck,
  Zap
} from "lucide-react";
import Image from "next/image";

// Enhanced animation variants
const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const CARD_HOVER = {
  hover: { y: -8, transition: { duration: 0.3, ease: "easeOut" } }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden transition-colors duration-300">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center group cursor-pointer">
            <div className="transition-transform group-hover:scale-105">
              <Image 
                src="/hirely_wordmark_transparent_dark.png" 
                alt="Hirely" 
                width={300}
                height={60}
                className="h-[60px] w-auto object-contain object-left -ml-5 dark:hidden"
                priority
              />
              <Image 
                src="/hirely_wordmark_white.png" 
                alt="Hirely" 
                width={300}
                height={60}
                className="h-[60px] w-auto object-contain object-left -ml-5 hidden dark:block"
                priority
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
               <ThemeToggle />
               <Link href="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors hidden sm:block">
               Sign in
               </Link>
            <Link href="/register">
              <Button size="sm" className="bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-full px-5 shadow-sm font-bold">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 1. Hero Section */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
         {/* Dot matrix grid background */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] -z-20" />
         {/* Premium gradient glow */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-blue-500/10 blur-[100px] -z-10 rounded-full" />
         
        <motion.div 
         variants={STAGGER_CONTAINER}
         initial="hidden"
         whileInView="show"
         viewport={{ once: false, amount: 0.1 }}
         className="container mx-auto max-w-5xl text-center z-10 relative"
        >
          <motion.div variants={FADE_UP} className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-slate-600 dark:text-slate-300">
               <ShieldCheck className="h-4 w-4 text-emerald-500" />
               100% Verified UK Sponsors
            </div>
          </motion.div>

          <motion.h1 
            variants={FADE_UP}
            className="text-5xl md:text-7xl font-extrabold font-heading tracking-tighter text-slate-900 dark:text-white mb-8 leading-[1.1] max-w-4xl mx-auto"
         >
            Stop applying to jobs that <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-cyan-400">
               can&apos;t hire you
            </span>
          </motion.h1>
          
          <motion.p 
            variants={FADE_UP}
            className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
         >
            Most jobs don&apos;t sponsor visas — Hirely helps you find the ones that actually do.
          </motion.p>
          
          <motion.div variants={FADE_UP} className="flex justify-center">
            <Link href="/register">
              <Button size="lg" className="rounded-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-8 h-14 text-lg font-semibold shadow-xl shadow-slate-900/20 dark:shadow-white/10 hover:shadow-2xl transition-all group">
                Get Early Access
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
         </motion.div>
      </section>

      {/* 2. Problem Section (Bento Box) */}
      <section className="py-32 px-6 relative bg-slate-50/50 dark:bg-slate-950/50 border-y border-slate-100 dark:border-slate-900 overflow-hidden transition-colors duration-300">
        {/* Abstract blur behind glass cards to make glassmorphism pop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-blue-500/10 dark:from-indigo-500/20 dark:via-purple-500/10 dark:to-blue-500/20 blur-[100px] -z-10 rounded-full pointer-events-none transition-colors duration-300" />
        
        <div className="container mx-auto max-w-5xl relative z-10">
          <motion.div 
            initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1, margin: "-100px" }} variants={FADE_UP}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold font-heading tracking-tight text-slate-900 dark:text-white">
              Most UK jobs can&apos;t sponsor your visa.
            </h2>
          </motion.div>
          
          <motion.div 
            variants={STAGGER_CONTAINER} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-6"
          >
            <motion.div variants={FADE_UP} whileHover="hover" custom={CARD_HOVER} className="col-span-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-8 rounded-[32px] border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:bg-white/50 dark:hover:bg-slate-900/60 transition-all relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border border-white dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                <XCircle className="w-7 h-7 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold font-heading tracking-tight text-slate-900 dark:text-white mb-3 relative z-10">Job boards don&apos;t filter</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed relative z-10">Traditional platforms mix sponsored and non-sponsored roles, leaving you to guess.</p>
            </motion.div>

            <motion.div variants={FADE_UP} whileHover="hover" custom={CARD_HOVER} className="col-span-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-8 rounded-[32px] border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:bg-white/50 dark:hover:bg-slate-900/60 transition-all relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border border-white dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                <Clock className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold font-heading tracking-tight text-slate-900 dark:text-white mb-3 relative z-10">You waste months</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed relative z-10">Applying to companies that legally cannot hire you drains your time and energy.</p>
            </motion.div>

            <motion.div variants={FADE_UP} whileHover="hover" custom={CARD_HOVER} className="col-span-1 md:col-span-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-10 rounded-[32px] border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-white/60 dark:hover:bg-slate-900/70 transition-all flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
               <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-400/10 dark:bg-indigo-500/20 blur-3xl rounded-full group-hover:bg-indigo-400/20 dark:group-hover:bg-indigo-500/30 transition-colors" />
               <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="flex-1 z-10">
                 <div className="w-16 h-16 bg-white/90 dark:bg-indigo-500/10 backdrop-blur-md shadow-sm border border-white dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 transition-colors">
                   <CheckCircle2 className="w-8 h-8" />
                 </div>
                 <h3 className="text-2xl md:text-3xl font-bold font-heading tracking-tight text-slate-900 dark:text-white mb-4">Hirely shows only the jobs that actually match your eligibility</h3>
                 <p className="text-slate-600 dark:text-slate-400 text-lg">We cross-reference every listing with the official Home Office register in real-time.</p>
               </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3. Solution Section */}
      <section className="py-32 px-6 bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
        <div className="container mx-auto max-w-5xl">
          <motion.div 
            initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1, margin: "-100px" }} variants={FADE_UP}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold font-heading tracking-tight text-slate-900 dark:text-white mb-4">
              How Hirely Works
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              We&apos;ve streamlined the international job search into three simple steps.
            </p>
          </motion.div>

          <div className="relative max-w-5xl mx-auto">
            {/* Vertical Line */}
            <div className="hidden md:block absolute left-1/2 top-8 bottom-8 w-[2px] bg-slate-200 dark:bg-slate-800 -translate-x-1/2 z-0 transition-colors duration-300" />

            <div className="space-y-16">
              {/* Step 1 */}
              <motion.div 
                initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1, margin: "-100px" }} variants={FADE_UP}
                className="flex flex-col md:flex-row items-center justify-between w-full relative z-10 gap-8 md:gap-0"
              >
                <div className="w-full md:w-[45%] flex md:justify-end">
                  <div className="bg-white dark:bg-slate-900 p-10 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300 w-full md:max-w-md md:text-right">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 md:ml-auto transition-colors duration-300">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold font-heading tracking-tight text-slate-900 dark:text-white mb-3">1. Upload CV</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">Drop your resume securely into our system. We extract your skills, experience, and tech stack instantly.</p>
                  </div>
                </div>
                
                <div className="hidden md:flex w-12 h-12 bg-white dark:bg-slate-900 rounded-full border-4 border-indigo-100 dark:border-indigo-900/50 shadow-sm items-center justify-center relative z-20 transition-colors duration-300">
                  <div className="w-4 h-4 bg-indigo-500 rounded-full" />
                </div>
                
                <div className="hidden md:block w-[45%]" />
              </motion.div>

              {/* Step 2 */}
              <motion.div 
                initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1, margin: "-100px" }} variants={FADE_UP}
                className="flex flex-col md:flex-row items-center justify-between w-full relative z-10 gap-8 md:gap-0"
              >
                <div className="hidden md:block w-[45%]" />
                
                <div className="hidden md:flex w-12 h-12 bg-white dark:bg-slate-900 rounded-full border-4 border-blue-100 dark:border-blue-900/50 shadow-sm items-center justify-center relative z-20 transition-colors duration-300">
                  <div className="w-4 h-4 bg-blue-500 rounded-full" />
                </div>
                
                <div className="w-full md:w-[45%] flex justify-start">
                  <div className="bg-white dark:bg-slate-900 p-10 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300 w-full md:max-w-md text-left">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 transition-colors duration-300">
                      <Cpu className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold font-heading tracking-tight text-slate-900 dark:text-white mb-3">2. Smart Matching</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">Our engine analyzes visa sponsorship requirements against your unique qualifications, ranking the best fits.</p>
                  </div>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div 
                initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1, margin: "-100px" }} variants={FADE_UP}
                className="flex flex-col md:flex-row items-center justify-between w-full relative z-10 gap-8 md:gap-0"
              >
                <div className="w-full md:w-[45%] flex md:justify-end">
                  <div className="bg-slate-900 dark:bg-slate-800 p-10 rounded-[32px] border border-slate-800 dark:border-slate-700 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 w-full md:max-w-md md:text-right">
                    <div className="w-16 h-16 bg-slate-800 dark:bg-slate-700 border border-slate-700 dark:border-slate-600 rounded-2xl flex items-center justify-center text-white mb-6 md:ml-auto">
                      <Send className="w-7 h-7 ml-1" />
                    </div>
                    <h3 className="text-2xl font-bold font-heading tracking-tight text-white mb-3">3. Apply with clarity</h3>
                    <p className="text-slate-400 dark:text-slate-300 text-lg leading-relaxed">Send applications only to companies verified to sponsor your specific visa type. No more guessing games.</p>
                  </div>
                </div>
                
                <div className="hidden md:flex w-12 h-12 bg-slate-900 dark:bg-slate-800 rounded-full border-4 border-slate-200 dark:border-slate-700 shadow-md items-center justify-center relative z-20 transition-colors duration-300">
                  <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] dark:bg-indigo-400" />
                </div>
                
                <div className="hidden md:block w-[45%]" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Value Proposition */}
      <section className="py-40 px-6 bg-[#0B0F19] text-center flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-[#0B0F19] to-[#0B0F19]" />
        <motion.h2 
          initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1 }} variants={FADE_UP}
          className="text-6xl md:text-8xl font-extrabold font-heading tracking-tighter text-white relative z-10 leading-tight"
        >
          Apply smarter. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Not harder.</span>
        </motion.h2>
      </section>

      {/* 5. Intelligence Section */}
      <section className="py-32 px-6 bg-white dark:bg-slate-950 border-y border-slate-100 dark:border-slate-900 overflow-hidden transition-colors duration-300">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
               initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1, margin: "-100px" }} variants={FADE_UP}
               className="flex-1 space-y-8"
            >
              <h2 className="text-4xl md:text-5xl font-bold font-heading tracking-tight text-slate-900 dark:text-white leading-tight">
                It reads your CV. <br />
                Then ranks every job by how well it fits.
              </h2>
              <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                Skills, title, experience — all scored against the role. Strong matches surface first, saving you from scrolling through irrelevant postings.
              </p>
            </motion.div>
            
            <motion.div 
               initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.1, margin: "-100px" }} transition={{ duration: 0.8, ease: "easeOut" }}
               className="flex-1 w-full relative"
            >
              {/* Premium Glassmorphic Widget */}
              <div className="relative w-full max-w-md mx-auto aspect-square">
                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-blue-500/20 dark:from-indigo-500/30 dark:to-blue-500/30 rounded-full blur-[80px]" />
                 <div className="absolute inset-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white dark:border-slate-700/50 rounded-[40px] shadow-2xl shadow-slate-200/50 dark:shadow-none p-8 flex flex-col justify-center gap-4">
                     {/* Match Card 1 */}
                     <motion.div whileHover={{ scale: 1.02 }} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between cursor-default transition-colors">
                        <div>
                           <div className="font-bold font-heading tracking-tight text-slate-900 dark:text-white text-lg">Senior Frontend Developer</div>
                           <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Visa Sponsor • London
                           </div>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center border-2 border-emerald-100 dark:border-emerald-500/20 text-lg shadow-sm">
                           98%
                        </div>
                     </motion.div>
                     
                     {/* Match Card 2 */}
                     <motion.div whileHover={{ scale: 1.02 }} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between cursor-default opacity-60 transition-colors">
                        <div>
                           <div className="font-bold font-heading tracking-tight text-slate-900 dark:text-white text-lg">React Engineer</div>
                           <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-slate-400" /> Visa Sponsor • Remote
                           </div>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center border-2 border-slate-100 dark:border-slate-600 text-lg">
                           75%
                        </div>
                     </motion.div>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. Pricing Section */}
      <section className="py-32 px-6 bg-slate-50 dark:bg-slate-900/20 transition-colors duration-300">
        <div className="container mx-auto max-w-5xl">
          <motion.div 
            variants={STAGGER_CONTAINER} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1, margin: "-100px" }}
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          >
            {/* Free */}
            <motion.div variants={FADE_UP} whileHover={{ y: -8 }} transition={{ duration: 0.3 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[40px] p-12 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between shadow-sm">
               <div>
                 <h3 className="text-3xl font-bold font-heading tracking-tight text-slate-900 dark:text-white mb-2">Free</h3>
                 <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg">For casual searching.</p>
                 <div className="mb-12">
                    <span className="text-6xl font-extrabold text-slate-900 dark:text-white">£0</span>
                 </div>
                 <ul className="space-y-5 mb-10">
                    <li className="flex items-center gap-4 text-slate-700 dark:text-slate-300 font-medium text-lg">
                       <CheckCircle2 className="w-6 h-6 text-slate-300 dark:text-slate-600 shrink-0" />
                       3 verified matches per search
                    </li>
                 </ul>
               </div>
               <Link href="/register">
                  <Button className="w-full rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold h-14 text-lg" variant="secondary">Start Free</Button>
               </Link>
            </motion.div>

            {/* Premium */}
            <motion.div variants={FADE_UP} whileHover={{ y: -8 }} transition={{ duration: 0.3 }} className="bg-slate-900 border border-slate-800 rounded-[40px] p-12 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
               {/* Subtle background element */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />
               <div className="relative z-10">
                 <h3 className="text-3xl font-bold font-heading tracking-tight text-white mb-2">Premium</h3>
                 <p className="text-slate-400 mb-10 text-lg">Unrestricted access.</p>
                 <div className="mb-12 flex items-baseline">
                    <span className="text-6xl font-extrabold text-white">£6.99</span>
                    <span className="text-slate-400 font-medium ml-2 text-xl">/month</span>
                 </div>
                 <ul className="space-y-5 mb-10">
                    <li className="flex items-center gap-4 text-white font-medium text-lg">
                       <Zap className="w-6 h-6 text-indigo-400 shrink-0" />
                       Unlimited matches
                    </li>
                 </ul>
               </div>
               <Link href="/register" className="relative z-10">
                  <Button className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-14 text-lg border-none shadow-lg shadow-indigo-600/30">Get Premium</Button>
               </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 7. Final CTA Section */}
      <section className="py-40 bg-white dark:bg-slate-950 px-6 text-center border-t border-slate-100 dark:border-slate-900 overflow-hidden relative transition-colors duration-300">
         {/* Subtle background gradient */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-gradient-to-b from-slate-50 to-white dark:from-indigo-900/10 dark:to-slate-950 -z-10" />
         
         <motion.div 
            initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.1 }} variants={STAGGER_CONTAINER}
            className="container mx-auto max-w-4xl relative z-10"
         >
            <motion.h2 variants={FADE_UP} className="text-5xl md:text-7xl font-extrabold font-heading tracking-tighter text-slate-900 dark:text-white mb-12 leading-[1.1]">
               The right job is out there. <br className="hidden md:block" />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-cyan-400">Now you can actually find it.</span>
            </motion.h2>
            <motion.div variants={FADE_UP}>
               <Link href="/register">
                  <Button size="lg" className="rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 px-12 h-16 text-xl font-bold shadow-xl shadow-slate-900/20 dark:shadow-white/10 hover:shadow-2xl hover:-translate-y-1 transition-all">
                     Get Early Access
                  </Button>
               </Link>
            </motion.div>
         </motion.div>
      </section>

      {/* 8. Modern, Comprehensive Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 pt-20 pb-10 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
            
            {/* Branding Column */}
            <div className="md:col-span-4 space-y-6">
            <div className="flex items-center">
              <Image 
                src="/hirely_wordmark_white.png" 
                alt="Hirely" 
                width={300}
                height={60}
                className="h-[60px] w-auto object-contain object-left -ml-5"
                priority
              />
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
