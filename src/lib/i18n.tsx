import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Locale = 'en' | 'bn';

export const translations = {
  en: {
    nav: {
      features: 'Features',
      pricing: 'Pricing',
      about: 'About',
      login: 'Log in',
      getStarted: 'Get Started',
    },
    hero: {
      badge: 'The #1 Choice for Indian Tutors',
      headline1: 'Manage Your Tuition',
      headline2: 'Like a Professional',
      typewriter: ['Track attendance instantly.', 'Collect fees via UPI.', 'Share study materials.', 'Manage all your batches.'],
      subtitle: 'TutionHut helps you run your teaching business effortlessly — from batches to fees, all in one place.',
      cta: 'Start Free Trial',
      demo: 'Watch Demo',
    },
    stats: [
      { value: '5,000+', label: 'Active Tutors' },
      { value: '50,000+', label: 'Students Enrolled' },
      { value: '28+', label: 'States Covered' },
      { value: '₹10Cr+', label: 'Fees Processed' },
    ],
    features: {
      title: 'Everything You Need to Scale',
      subtitle: 'Key Features',
      items: [
        { title: 'Batch Management', desc: 'Organize students into batches by subject, class, and schedule.' },
        { title: 'Smart Attendance', desc: 'Mark attendance in seconds. Auto-generate monthly reports for parents.' },
        { title: 'Fee Tracking (UPI)', desc: 'Track payments via UPI, Google Pay, and Cash. Automatic overdue reminders.' },
        { title: 'Study Materials', desc: 'Upload PDFs, assignments, and record video lectures for students.' },
        { title: 'Student Dashboard', desc: 'Give students their own portal to track progress and download notes.' },
        { title: 'Auto Notifications', desc: 'Send fee reminders and class updates via Email and App notifications.' },
      ],
    },
    testimonials: {
      title: 'What Our Users Say',
      subtitle: 'Real stories from students and tutors',
      items: [
        { quote: 'TutionHut made managing my 3 batches effortless. Highly recommended!', name: 'Rakesh Sharma', role: 'Math Tutor, Delhi' },
        { quote: 'Collecting fees via UPI and tracking attendance changed my life.', name: 'Priya Iyer', role: 'Science Tutor, Bangalore' },
        { quote: 'The student portal is amazing. I can download notes anytime!', name: 'Ananya Das', role: 'Student, Kolkata' },
      ],
    },
    pricing: {
      title: 'Simple, Transparent Pricing',
      subtitle: 'Choose a plan that scales with your student strength. No hidden costs.',
      plans: [
        { name: 'Starter', price: '₹199', period: '/month', students: 'Up to 30 students', popular: false, features: ['3 Batches', 'Attendance Tracker', 'Fee Management', 'Notes (500MB)'] },
        { name: 'Growth', price: '₹399', period: '/month', students: 'Up to 75 students', popular: true, features: ['10 Batches', 'Advanced Reports', 'UPI Integration', 'Notes (5GB)', 'Video Lectures'] },
        { name: 'Pro', price: '₹699', period: '/month', students: 'Up to 150 students', popular: false, features: ['Unlimited Batches', 'Custom Receipts', 'Priority Support', 'Notes (20GB)', 'Student Progress'] },
      ],
      cta: 'Get Started',
    },
    cta: {
      title: 'Ready to transform your teaching?',
      subtitle: 'Join 5,000+ tutors who trust TutionHut to manage their classes.',
      button: 'Start for Free',
      login: 'Already have an account? Log in',
    },
    footer: {
      tagline: 'The most powerful tuition management platform built for Indian educators.',
      product: 'Product',
      company: 'Company',
      links: {
        features: 'Features',
        pricing: 'Pricing',
        demo: 'Request Demo',
        about: 'About Us',
        contact: 'Contact',
        terms: 'Terms of Service',
        privacy: 'Privacy Policy',
      },
      copyright: '© 2026 TutionHut India. All rights reserved.',
    },
  },

  bn: {
    nav: {
      features: 'বৈশিষ্ট্য',
      pricing: 'মূল্য',
      about: 'আমাদের সম্পর্কে',
      login: 'লগ ইন',
      getStarted: 'শুরু করুন',
    },
    hero: {
      badge: 'ভারতীয় শিক্ষকদের #১ পছন্দ',
      headline1: 'আপনার টিউশন পরিচালনা করুন',
      headline2: 'পেশাদারভাবে',
      typewriter: ['তাৎক্ষণিক উপস্থিতি ট্র্যাক করুন।', 'UPI-তে ফি সংগ্রহ করুন।', 'পড়ার উপকরণ শেয়ার করুন।', 'সব ব্যাচ পরিচালনা করুন।'],
      subtitle: 'TutionHut আপনার শিক্ষাদান ব্যবসা সহজ করে তোলে — ব্যাচ থেকে ফি পর্যন্ত, সব এক জায়গায়।',
      cta: 'বিনামূল্যে শুরু করুন',
      demo: 'ডেমো দেখুন',
    },
    stats: [
      { value: '৫,০০০+', label: 'সক্রিয় শিক্ষক' },
      { value: '৫০,০০০+', label: 'নথিভুক্ত ছাত্র' },
      { value: '২৮+', label: 'রাজ্য কভার' },
      { value: '₹১০কোটি+', label: 'ফি প্রক্রিয়াকৃত' },
    ],
    features: {
      title: 'স্কেল করতে যা দরকার',
      subtitle: 'মূল বৈশিষ্ট্যসমূহ',
      items: [
        { title: 'ব্যাচ ম্যানেজমেন্ট', desc: 'বিষয়, শ্রেণী এবং সময়সূচী অনুযায়ী ছাত্রদের ব্যাচে সংগঠিত করুন।' },
        { title: 'স্মার্ট উপস্থিতি', desc: 'সেকেন্ডে উপস্থিতি চিহ্নিত করুন। অভিভাবকদের জন্য মাসিক রিপোর্ট।' },
        { title: 'ফি ট্র্যাকিং (UPI)', desc: 'UPI, Google Pay ও নগদে পেমেন্ট ট্র্যাক করুন। বকেয়া রিমাইন্ডার।' },
        { title: 'পড়ার উপকরণ', desc: 'PDF, অ্যাসাইনমেন্ট আপলোড করুন এবং ভিডিও লেকচার রেকর্ড করুন।' },
        { title: 'ছাত্র ড্যাশবোর্ড', desc: 'ছাত্রদের নিজস্ব পোর্টাল দিন অগ্রগতি ট্র্যাক করতে ও নোট ডাউনলোড করতে।' },
        { title: 'স্বয়ংক্রিয় বিজ্ঞপ্তি', desc: 'ইমেইল ও অ্যাপের মাধ্যমে ফি রিমাইন্ডার ও ক্লাস আপডেট পাঠান।' },
      ],
    },
    testimonials: {
      title: 'ব্যবহারকারীরা কী বলেন',
      subtitle: 'ছাত্র ও শিক্ষকদের বাস্তব গল্প',
      items: [
        { quote: 'TutionHut আমার ৩টি ব্যাচ পরিচালনা অবিশ্বাস্যভাবে সহজ করে দিয়েছে!', name: 'রাকেশ শর্মা', role: 'গণিত শিক্ষক, দিল্লি' },
        { quote: 'UPI-তে ফি সংগ্রহ এবং উপস্থিতি ট্র্যাকিং আমার জীবন বদলে দিয়েছে।', name: 'প্রিয়া আইয়ার', role: 'বিজ্ঞান শিক্ষক, ব্যাঙ্গালোর' },
        { quote: 'ছাত্র পোর্টাল অসাধারণ। আমি যেকোনো সময় নোট ডাউনলোড করতে পারি!', name: 'অনন্যা দাস', role: 'ছাত্রী, কলকাতা' },
      ],
    },
    pricing: {
      title: 'সহজ, স্বচ্ছ মূল্য',
      subtitle: 'আপনার ছাত্র সংখ্যার সাথে মানানসই পরিকল্পনা বেছে নিন। কোনো লুকানো চার্জ নেই।',
      plans: [
        { name: 'স্টার্টার', price: '₹১৯৯', period: '/মাস', students: '৩০ পর্যন্ত ছাত্র', popular: false, features: ['৩টি ব্যাচ', 'উপস্থিতি ট্র্যাকার', 'ফি ম্যানেজমেন্ট', 'নোটস (৫০০MB)'] },
        { name: 'গ্রোথ', price: '₹৩৯৯', period: '/মাস', students: '৭৫ পর্যন্ত ছাত্র', popular: true, features: ['১০টি ব্যাচ', 'উন্নত রিপোর্ট', 'UPI ইন্টিগ্রেশন', 'নোটস (৫GB)', 'ভিডিও লেকচার'] },
        { name: 'প্রো', price: '₹৬৯৯', period: '/মাস', students: '১৫০ পর্যন্ত ছাত্র', popular: false, features: ['সীমাহীন ব্যাচ', 'কাস্টম রসিদ', 'অগ্রাধিকার সহায়তা', 'নোটস (২০GB)', 'ছাত্র অগ্রগতি'] },
      ],
      cta: 'শুরু করুন',
    },
    cta: {
      title: 'আপনার শিক্ষাদান রূপান্তরিত করতে প্রস্তুত?',
      subtitle: '৫,০০০+ শিক্ষক TutionHut বিশ্বাস করেন তাদের ক্লাস পরিচালনার জন্য।',
      button: 'বিনামূল্যে শুরু করুন',
      login: 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগ ইন করুন',
    },
    footer: {
      tagline: 'ভারতীয় শিক্ষকদের জন্য তৈরি সবচেয়ে শক্তিশালী টিউশন ম্যানেজমেন্ট প্ল্যাটফর্ম।',
      product: 'পণ্য',
      company: 'কোম্পানি',
      links: {
        features: 'বৈশিষ্ট্য',
        pricing: 'মূল্য',
        demo: 'ডেমো অনুরোধ',
        about: 'আমাদের সম্পর্কে',
        contact: 'যোগাযোগ',
        terms: 'সেবার শর্তাবলী',
        privacy: 'গোপনীয়তা নীতি',
      },
      copyright: '© ২০২৬ TutionHut India. সর্বস্বত্ব সংরক্ষিত।',
    },
  },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: typeof translations.en;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: translations.en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
