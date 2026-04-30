/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from "socket.io-client";
import { 
  Briefcase, 
  Search, 
  MessageCircle, 
  Lock,
  Eye,
  EyeOff,
  User as UserIcon, 
  Bell, 
  Phone,
  Globe, 
  MapPin, 
  Send,
  Plus,
  ArrowRight,
  CheckCircle2,
  Menu,
  Zap,
  Star,
  Calendar,
  Sun,
  X,
  Hammer,
  Sparkles,
  Car,
  Laptop,
  GraduationCap,
  Heart,
  Coffee,
  Leaf,
  Truck,
  ShieldCheck,
  PartyPopper,
  Clock,
  ArrowLeft,
  ChevronRight,
  Palette,
  Grid,
  Trash2,
  LayoutGrid,
  Mail,
  Camera,
  Settings2,
  Image as ImageIcon
} from 'lucide-react';

// --- Types ---

const SERVICE_CATEGORIES = [
  {
    id: "home_repair",
    name_ar: "الإصلاحات المنزلية",
    name_en: "Home & Repairs",
    icon: Hammer,
    color: "bg-aiko-orange",
    subcategories: [
      { id: "hr_0", name_ar: "سباكة", name_en: "Plumbing" },
      { id: "hr_1", name_ar: "كهرباء", name_en: "Electricity" },
      { id: "hr_2", name_ar: "نجارة", name_en: "Carpentry" },
      { id: "hr_3", name_ar: "دهانات وديكور", name_en: "Painting & Decor" },
      { id: "hr_4", name_ar: "تبليط وأرضيات", name_en: "Tiling & Flooring" },
      { id: "hr_5", name_ar: "تكييف وتدفئة", name_en: "AC & Heating" },
      { id: "hr_6", name_ar: "مكافحة الحشرات", name_en: "Pest Control" }
    ]
  },
  {
    id: "cleaning",
    name_ar: "التنظيف والعناية",
    name_en: "Cleaning & Care",
    icon: Sparkles,
    color: "bg-aiko-teal",
    subcategories: [
      { id: "cl_0", name_ar: "تنظيف المنازل", name_en: "House Cleaning" },
      { id: "cl_1", name_ar: "تنظيف المكاتب", name_en: "Office Cleaning" },
      { id: "cl_2", name_ar: "غسيل السيارات", name_en: "Car Wash" },
      { id: "cl_3", name_ar: "تنظيف المسابح", name_en: "Pool Cleaning" },
      { id: "cl_4", name_ar: "تنظيف السجاد والستائر", name_en: "Carpet & Curtain" }
    ]
  },
  {
    id: "automotive",
    name_ar: "السيارات والنقل",
    name_en: "Automotive & Transport",
    icon: Car,
    color: "bg-aiko-navy",
    subcategories: [
      { id: "au_0", name_ar: "ميكانيكي متنقل", name_en: "Mobile Mechanic" },
      { id: "au_1", name_ar: "توصيل ومواصلات", name_en: "Transport & Towing" },
      { id: "au_2", name_ar: "نقل أثاث", name_en: "Furniture Moving" },
      { id: "au_3", name_ar: "سائق مع سيارة", name_en: "Chauffeur Service" }
    ]
  },
  {
    id: "tech",
    name_ar: "التقنية والبرمجة",
    name_en: "Tech & Development",
    icon: Laptop,
    color: "bg-blue-600",
    subcategories: [
      { id: "te_0", name_ar: "إصلاح أجهزة كمبيوتر", name_en: "PC Repair" },
      { id: "te_1", name_ar: "تطوير مواقع وتطبيقات", name_en: "Web & App Dev" },
      { id: "te_2", name_ar: "دعم تقني", name_en: "IT Support" },
      { id: "te_3", name_ar: "شبكات وإنترنت", name_en: "Networking" }
    ]
  },
  {
    id: "education",
    name_ar: "التعليم والتدريب",
    name_en: "Education & Training",
    icon: GraduationCap,
    color: "bg-amber-600",
    subcategories: [
      { id: "ed_0", name_ar: "دروس خصوصية", name_en: "Private Lessons" },
      { id: "ed_1", name_ar: "تعليم لغات", name_en: "Language Teaching" },
      { id: "ed_2", name_ar: "تدريب مهني", name_en: "Professional Training" },
      { id: "ed_3", name_ar: "دورات فنية وحرفية", name_en: "Art & Craft Workshops" }
    ]
  },
  {
    id: "beauty",
    name_ar: "الصحة والجمال",
    name_en: "Health & Beauty",
    icon: Heart,
    color: "bg-pink-500",
    subcategories: [
      { id: "be_0", name_ar: "حلاق / كوافير متنقل", name_en: "Mobile Barber/Hair" },
      { id: "be_1", name_ar: "تدليك ورفاهية", name_en: "Massage & Wellness" },
      { id: "be_2", name_ar: "مدرب رياضي شخصي", name_en: "Personal Trainer" },
      { id: "be_3", name_ar: "تمريض منزلي", name_en: "Home Nursing" }
    ]
  },
  {
    id: "creative",
    name_ar: "الإبداع والفنون",
    name_en: "Creative & Arts",
    icon: Palette,
    color: "bg-purple-600",
    subcategories: [
      { id: "cr_0", name_ar: "تصوير فوتوغرافي", name_en: "Photography" },
      { id: "cr_1", name_ar: "تصميم جرافيك", name_en: "Graphic Design" },
      { id: "cr_2", name_ar: "مونتاج فيديو", name_en: "Video Editing" },
      { id: "cr_3", name_ar: "كتابة محتوى إبداعي", name_en: "Creative Writing" }
    ]
  },
  {
    id: "food",
    name_ar: "الطعام والطبخ",
    name_en: "Food & Cooking",
    icon: Coffee,
    color: "bg-red-500",
    subcategories: [
      { id: "fo_0", name_ar: "طباخ منزلي", name_en: "Home Chef" },
      { id: "fo_1", name_ar: "تحضير وجبات", name_en: "Meal Prep" },
      { id: "fo_2", name_ar: "حلويات وتورت مخصصة", name_en: "Cakes & Sweets" },
      { id: "fo_3", name_ar: "خدمة تقديم الطعام للمناسبات", name_en: "Catering" }
    ]
  },
  {
    id: "garden",
    name_ar: "الحدائق والخارجية",
    name_en: "Garden & Outdoor",
    icon: Sun,
    color: "bg-green-600",
    subcategories: [
      { id: "ga_0", name_ar: "تنسيق حدائق", name_en: "Landscaping" },
      { id: "ga_1", name_ar: "تركيب أنظمة ري", name_en: "Irrigation Systems" },
      { id: "ga_2", name_ar: "قطع أشجار", name_en: "Tree Cutting" },
      { id: "ga_3", name_ar: "تنظيف خارجي", name_en: "Outdoor Cleaning" }
    ]
  },
  {
    id: "misc",
    name_ar: "أعمال متنوعة",
    name_en: "Miscellaneous",
    icon: Grid,
    color: "bg-gray-600",
    subcategories: [
      { id: "mi_0", name_ar: "توصيل وشراء بالنيابة", name_en: "Concierge & Delivery" },
      { id: "mi_1", name_ar: "مساعد شخصي", name_en: "Personal Assistant" },
      { id: "mi_2", name_ar: "تنظيم وترتيب المنزل", name_en: "Home Organization" },
      { id: "mi_3", name_ar: "أعمال إدارية", name_en: "Admin Work" }
    ]
  }
];

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title_ar: 'طلب مؤقت جديد!',
    title_en: 'New Instant Request!',
    desc_ar: 'خالد بن عمر يعرض عليك 3,000 DA لمهمة سباكة - لديك 5 دقائق للرد',
    desc_en: 'Khaled Ben Omar offers you 3,000 DA for a plumbing task - You have 5 mins to respond',
    time_ar: 'منذ دقيقتين',
    time_en: '2m ago',
    type: 'instant',
    read: false
  },
  {
    id: 2,
    title_ar: 'طلب عمل جديد في مجالك',
    title_en: 'New job in your field',
    desc_ar: 'شركة البناء الحديث تبحث عن سباك في باب الزوار - 2500 DA ليوم واحد',
    desc_en: 'Modern Construction is looking for a plumber in Bab Ezzouar - 2500 DA for 1 day',
    time_ar: 'منذ 15 دقيقة',
    time_en: '15m ago',
    type: 'job',
    read: false
  },
  {
    id: 3,
    title_ar: 'تم قبول طلبك!',
    title_en: 'Request Accepted!',
    desc_ar: 'عائلة بن عمر قبلت طلبك لوظيفة مدرس رياضيات - ابدأ غداً الساعة 9:00',
    desc_en: 'Ben Omar family accepted your request for Math tutor - start tomorrow at 9:00',
    time_ar: 'منذ 2 ساعة',
    time_en: '2h ago',
    type: 'accepted',
    read: false
  },
  {
    id: 4,
    title_ar: 'تقييم جديد',
    title_en: 'New Rating',
    desc_ar: 'خالد بلعباس أعطاك 5 نجوم: "عمل ممتاز وجودة عالية"',
    desc_en: 'Khaled Belabbas gave you 5 stars: "Excellent work and high quality"',
    time_ar: 'أمس',
    time_en: 'Yesterday',
    type: 'rating',
    read: true
  }
];

// --- Types ---
type Language = 'en' | 'fr' | 'ar';
type UserRole = 'employer' | 'worker';

const translations = {
  ar: {
    email_label: 'البريد الإلكتروني',
    login_error: 'خطأ في تسجيل الدخول، تحقق من بياناتك',
    register_error: 'حدث خطأ أثناء إنشاء الحساب',
    app_tagline: 'منصة العمل الذكية · الدقة والاحترافية',
    choose_lang: 'اختر لغتك',
    next_btn: 'التالي',
    skip_btn: 'تخطي',
    start_btn: 'ابدأ الآن',
    continue_btn: 'متابعة',
    cancel_btn: 'إلغاء',
    save_btn: 'حفظ',
    close_btn: 'إغلاق',
    confirm_btn: 'تأكيد',
    ob0_title: 'الجيل القادم من الخدمات',
    ob0_desc: 'منصة متكاملة تجمع بين الدقة والاحترافية لربط المهنيين بأصحاب العمل.',
    ob1_title: 'بحث ذكي وسريع',
    ob1_desc: 'اعثر على العامل المناسب في ثوانٍ معدودة باستخدام تقنياتنا المتطورة.',
    ob2_title: 'جودة لا تضاهى',
    ob2_desc: 'نضمن لك الجودة والالتزام في كل مهمة يتم تنفيذها عبر منصتنا.',
    role_question: 'اختر دورك للبدء',
    role_worker: 'عامل محترف',
    role_worker_sub: 'تحول إلى نظام المهنيين',
    role_employer: 'صاحب عمل',
    role_employer_sub: 'تحول إلى نظام أصحاب العمل',
    login_title: 'تسجيل الدخول',
    login_sub: 'أهلاً بك مجدداً في عائلة آيكو',
    register_title: 'إنشاء حساب جديد',
    phone_label: 'رقم الهاتف',
    password_label: 'كلمة المرور',
    fullname_label: 'الاسم الكامل',
    city_label: 'المدينة',
    wilaya_label: 'الولاية',
    commune_label: 'البلدية',
    password_confirm_label: 'تأكيد كلمة المرور',
    password_hint: '8 أحرف على الأقل، رقم واحد، حرف كبير واحد',
    create_account_btn: 'إنشاء حساب',
    login_btn: 'دخول',
    register_btn: 'تسجيل',
    have_account: 'لديك حساب بالفعل؟',
    no_account: 'ليس لديك حساب؟',
    phone_number: 'رقم الهاتف',
    or_divider: 'أو تسجيل الدخول عبر',
    nav_jobs: 'الوظائف',
    nav_requests: 'الطلبات',
    nav_messages: 'الرسائل',
    nav_myapps: 'طلباتي',
    nav_profile: 'حسابي',
    nav_workers: 'العمال',
    nav_myjobs: 'وظائفي',
    nav_notif: 'التنبيهات',
    greeting: 'أهلاً بك في آيكو',
    avail_on: 'متاح الآن',
    avail_off: 'غير متاح حالياً',
    new_requests_title: 'الطلبات الجديدة',
    browse_jobs_title: 'تصفح الوظائف',
    jobs_nearby_title: 'وظائف قريبة منك',
    find_worker_title: 'ابحث عن عمال',
    post_job_btn: 'انشر وظيفة',
    instant_request_btn: 'طلب فوري',
    apply_btn: 'تقديم طلب',
    applied_btn: 'تم التقديم',
    hire_btn: 'توظيف',
    send_offer_btn: 'إرسال عرض',
    part_time: 'دوام جزئي',
    full_time: 'دوام كامل',
    urgent: 'عاجل',
    available_now: 'متاح الآن',
    edit_profile: 'تعديل الملف الشخصي',
    language_setting: 'إعدادات اللغة',
    logout: 'تسجيل الخروج',
    pending: 'قيد الانتظار',
    accepted: 'مقبول',
    rejected: 'مرفوض',
    expired: 'منتهي',
    live_now: 'مباشر الآن',
    kaizen: 'كايزن',
    monozukuri: 'مونو زوكوري',
    omotenashi: 'أوموتيناشي',
    location: 'الجزائر العاصمة، باب الزوار',
    cat_all: 'الكل',
    categories: 'التصنيفات',
    install_app: 'ثبّت التطبيق',
    offline_msg: 'أنت الآن في وضع عدم الاتصال. بعض الميزات قد لا تكون متاحة.',
    offline_error: 'لا يوجد اتصال بالإنترنت. يرجى المحقق من الشبكة وإعادة المحاولة.'
  },
  en: {
    email_label: 'Email Address',
    login_error: 'Login failed, please check your credentials',
    register_error: 'An error occurred during registration',
    app_tagline: 'Smart Work Platform · Precision & Excellence',
    choose_lang: 'Choose Your Language',
    next_btn: 'Next',
    skip_btn: 'Skip',
    start_btn: 'Start Now',
    continue_btn: 'Continue',
    cancel_btn: 'Cancel',
    save_btn: 'Save',
    close_btn: 'Close',
    confirm_btn: 'Confirm',
    ob0_title: 'Next-Gen Service Platform',
    ob0_desc: 'An integrated platform combining precision and professionalism to connect specialists with employers.',
    ob1_title: 'Smart & Fast Search',
    ob1_desc: 'Find the right worker in seconds using our advanced technologies.',
    ob2_title: 'Unmatched Quality',
    ob2_desc: 'We guarantee quality and commitment in every task performed via our platform.',
    role_question: 'Select your role to begin',
    role_worker: 'Professional Worker',
    role_worker_sub: 'Specialist Protocol',
    role_employer: 'Employer',
    role_employer_sub: 'Employer Protocol',
    login_title: 'Login',
    login_sub: 'Welcome back to the Aiko family',
    register_title: 'Create New Account',
    phone_label: 'Phone Number',
    password_label: 'Password',
    fullname_label: 'Full Name',
    city_label: 'City',
    wilaya_label: 'Wilaya',
    commune_label: 'Commune',
    password_confirm_label: 'Confirm Password',
    password_hint: 'At least 8 characters, one number, one uppercase letter',
    create_account_btn: 'Create Account',
    login_btn: 'Login',
    register_btn: 'Register',
    have_account: 'Already have an account?',
    no_account: "Don't have an account?",
    phone_number: 'Phone Number',
    or_divider: 'or sign in with',
    nav_jobs: 'Jobs',
    nav_requests: 'Requests',
    nav_messages: 'Messages',
    nav_myapps: 'My Apps',
    nav_profile: 'Profile',
    nav_workers: 'Workers',
    nav_myjobs: 'My Jobs',
    nav_notif: 'Notifications',
    greeting: 'Welcome to Aiko',
    avail_on: 'Available Now',
    avail_off: 'Offline',
    new_requests_title: 'New Requests',
    browse_jobs_title: 'Browse Jobs',
    jobs_nearby_title: 'Jobs Near You',
    find_worker_title: 'Find Workers',
    post_job_btn: 'Post a Job',
    instant_request_btn: 'Instant Request',
    apply_btn: 'Apply Now',
    applied_btn: 'Applied',
    hire_btn: 'Hire',
    send_offer_btn: 'Send Offer',
    part_time: 'Part Time',
    full_time: 'Full Time',
    urgent: 'Urgent',
    available_now: 'Available Now',
    edit_profile: 'Edit Profile',
    language_setting: 'Language Settings',
    logout: 'Logout',
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    expired: 'Expired',
    live_now: 'Live Now',
    kaizen: 'Kaizen',
    monozukuri: 'Monozukuri',
    omotenashi: 'Omotenashi',
    location: 'Algiers, Bab Ezzouar',
    cat_all: 'All',
    categories: 'Categories',
    install_app: 'Install',
    offline_msg: 'You are currently offline. Some features may be unavailable.',
    offline_error: 'No internet connection. Please check your network and try again.'
  },
  fr: {
    email_label: 'Adresse Email',
    login_error: 'Échec de la connexion, vérifiez vos identifiants',
    register_error: "Une erreur s'est produite lors de l'inscription",
    app_tagline: 'Plateforme de Travail Intelligente · Précision',
    choose_lang: 'Choisissez votre langue',
    next_btn: 'Suivant',
    skip_btn: 'Passer',
    start_btn: 'Commencer',
    continue_btn: 'Continuer',
    cancel_btn: 'Annuler',
    save_btn: 'Enregistrer',
    close_btn: 'Fermer',
    confirm_btn: 'Confirmer',
    ob0_title: 'Plateforme de services de nouvelle génération',
    ob0_desc: 'Une plateforme intégrée alliant précision et professionnalisme pour connecter les spécialistes aux employeurs.',
    ob1_title: 'Recherche intelligente et rapide',
    ob1_desc: 'Trouvez le bon travailleur en quelques secondes grâce à nos technologies avancées.',
    ob2_title: 'Qualité inégalée',
    ob2_desc: "Nous garantissons la qualité et l'engagement dans chaque tâche effectuée via notre plateforme.",
    role_question: 'Sélectionnez votre rôle pour commencer',
    role_worker: 'Prestataire',
    role_worker_sub: 'Protocole Spécialiste',
    role_employer: 'Employeur',
    role_employer_sub: 'Protocole Employeur',
    login_title: 'Connexion',
    login_sub: 'Bienvenue dans la famille Aiko',
    register_title: 'Créer un compte',
    phone_label: 'Numéro de téléphone',
    password_label: 'Mot de passe',
    fullname_label: 'Nom complet',
    city_label: 'Ville',
    wilaya_label: 'Wilaya',
    commune_label: 'Commune',
    password_confirm_label: 'Confirmer le mot de passe',
    password_hint: 'Au moins 8 caractères, un chiffre, une majuscule',
    create_account_btn: 'Créer un compte',
    login_btn: 'Se connecter',
    register_btn: "S'inscrire",
    have_account: 'Vous avez déjà un compte ?',
    no_account: "Vous n'avez pas de compte ?",
    phone_number: 'Numéro de téléphone',
    or_divider: 'ou se connecter avec',
    nav_jobs: 'Emplois',
    nav_requests: 'Demandes',
    nav_messages: 'Messages',
    nav_myapps: 'Mes Candidatures',
    nav_profile: 'Profil',
    nav_workers: 'Travailleurs',
    nav_myjobs: 'Mes Offres',
    nav_notif: 'Notifications',
    greeting: 'Bienvenue chez Aiko',
    avail_on: 'Disponible',
    avail_off: 'Hors ligne',
    new_requests_title: 'Nouvelles demandes',
    browse_jobs_title: 'Parcourir les emplois',
    jobs_nearby_title: 'Emplois à proximité',
    find_worker_title: 'Trouver des travailleurs',
    post_job_btn: 'Publier une offre',
    instant_request_btn: 'Demande instantanée',
    apply_btn: 'Postuler',
    applied_btn: 'Postulé',
    hire_btn: 'Recruter',
    send_offer_btn: 'Envoyer une offre',
    part_time: 'Temps Partiel',
    full_time: 'Temps Plein',
    urgent: 'Urgent',
    available_now: 'Disponible Maintenant',
    edit_profile: 'Modifier le profil',
    language_setting: 'Paramètres de langue',
    logout: 'Déconnexion',
    pending: 'En attente',
    accepted: 'Accepté',
    rejected: 'Refusé',
    expired: 'Expiré',
    live_now: 'En direct',
    kaizen: 'Kaizen',
    monozukuri: 'Monozukuri',
    omotenashi: 'Omotenashi',
    location: 'Alger, Bab Ezzouar',
    cat_all: 'Tout',
    categories: 'Catégories',
    install_app: 'Installer',
    offline_msg: 'Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent être indisponibles.',
    offline_error: 'Pas de connexion Internet. Veuillez vérifier votre réseau et réessayer.'
  }
};

const ALGERIA_LOCATIONS: Record<string, string[]> = {
  "01 - Adrar": ["Adrar", "Tamest", "Charouine", "Reggane"],
  "02 - Chlef": ["Chlef", "Ténès", "Ouled Fares", "Boukadir"],
  "03 - Laghouat": ["Laghouat", "Aflou", "Aïn Madhi", "Hassi R'Mel"],
  "04 - Oum El Bouaghi": ["Oum El Bouaghi", "Aïn Beïda", "Aïn M'lila"],
  "05 - Batna": ["Batna", "Arris", "Barika", "Merouana"],
  "06 - Béjaïa": ["Béjaïa", "Amizour", "Akbou", "El Kseur"],
  "07 - Biskra": ["Biskra", "Tolga", "Ouled Djellal", "Sidi Okba"],
  "08 - Béchar": ["Béchar", "Abadla", "Taghit", "Kenadsa"],
  "09 - Blida": ["Blida", "Boufarik", "Beni Mered", "Ouled Yaïch"],
  "10 - Bouira": ["Bouira", "Lakhdaria", "Sour El Ghozlane"],
  "16 - Alger": ["Bab Ezzouar", "Alger Centre", "Hydra", "Zeralda", "El Biar", "Kouba", "Bordj El Kiffan"],
  "19 - Sétif": ["Sétif", "El Eulma", "Aïn Arnat", "Aïn Oulmene"],
  "23 - Annaba": ["Annaba", "El Bouni", "Sidi Amar", "Berrahal"],
  "25 - Constantine": ["Constantine", "El Khroub", "Hamma Bouziane", "Zighoud Youcef"],
  "31 - Oran": ["Oran", "Arzew", "Bir El Djir", "Es Senia", "Gdyel"]
};

const ALGERIA_WILAYAS = Object.keys(ALGERIA_LOCATIONS).length > 0 ? Object.keys(ALGERIA_LOCATIONS) : [
  "01 - Adrar", "02 - Chlef", "03 - Laghouat", "04 - Oum El Bouaghi", "05 - Batna", 
  "06 - Béjaïa", "07 - Biskra", "08 - Béchar", "09 - Blida", "10 - Bouira", 
  "11 - Tamanrasset", "12 - Tébessa", "13 - Tlemcen", "14 - Tiaret", "15 - Tizi Ouzou", 
  "16 - Alger", "17 - Djelfa", "18 - Jijel", "19 - Sétif", "20 - Saïda", 
  "21 - Skikda", "22 - Sidi Bel Abbès", "23 - Annaba", "24 - Guelma", "25 - Constantine", 
  "26 - Médéa", "27 - Mostaganem", "28 - M'Sila", "29 - Mascara", "30 - Ouargla", 
  "31 - Oran", "32 - El Bayadh", "33 - Illizi", "34 - Bordj Bou Arreridj", "35 - Boumerdès", 
  "36 - El Tarf", "37 - Tindouf", "38 - Tissemsilt", "39 - El Oued", "40 - Khenchela", 
  "41 - Souk Ahras", "42 - Tipaza", "43 - Mila", "44 - Aïn Defla", "45 - Naâma", 
  "46 - Aïn Témouchent", "47 - Ghardaïa", "48 - Relizane"
];

// --- Sub-components for Form ---
const FormInput = ({ label, icon: Icon, type = "text", placeholder, value, onChange, i18nLabel, i18nPlaceholder, showPasswordToggle = false, isRTL }: any) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <label className="text-xs font-black uppercase tracking-widest text-aiko-navy/30 mx-2" data-i18n={i18nLabel}>
        {label}
      </label>
      <div className="flex items-center gap-3 bg-aiko-gray-100 p-4 rounded-2xl border border-transparent focus-within:border-aiko-teal focus-within:bg-white transition-all">
        <Icon size={18} className="text-aiko-navy/30" />
        <input 
          type={showPasswordToggle ? (show ? "text" : "password") : type} 
          placeholder={placeholder} 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none font-bold text-aiko-navy placeholder:text-aiko-navy/10"
          data-i18n-placeholder={i18nPlaceholder}
        />
        {showPasswordToggle && (
          <button onClick={() => setShow(!show)} className="text-aiko-navy/20 hover:text-aiko-teal transition-colors">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

const FormSelect = ({ label, icon: Icon, options, value, onChange, i18nLabel, isRTL }: any) => (
  <div className="space-y-2">
    <label className="text-xs font-black uppercase tracking-widest text-aiko-navy/30 mx-2" data-i18n={i18nLabel}>
      {label}
    </label>
    <div className="flex items-center gap-3 bg-aiko-gray-100 p-4 rounded-2xl border border-transparent focus-within:border-aiko-teal focus-within:bg-white transition-all">
      <Icon size={18} className="text-aiko-navy/30" />
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent border-none outline-none font-bold text-aiko-navy appearance-none"
      >
        <option value="">{isRTL ? 'اختر...' : 'Select...'}</option>
        {options.map((opt: string) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  </div>
);

// --- Components ---

const Logo = ({ size = "md", invert = false }: { size?: "sm" | "md" | "lg" | "xl", invert?: boolean }) => {
  const dimensions = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
    xl: "w-28 h-28"
  }[size];

  return (
    <div className={`flex items-center gap-4 group cursor-pointer ${invert ? 'flex-col sm:flex-row' : ''}`}>
      <div className={`${dimensions} relative bg-white rounded-2xl flex items-center justify-center shadow-md p-1`}>
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {/* Dark Teal Arm */}
          <path 
            d="M30 75 C20 75 20 60 50 20 C65 40 70 55 58 68 C50 78 45 78 40 68" 
            fill="none" 
            stroke="#0F6E6E"
            strokeWidth="16" 
            strokeLinecap="round"
          />
          {/* Light Teal Arm */}
          <path 
            d="M50 20 C80 20 85 60 70 75 C60 85 45 75 52 55" 
            fill="none" 
            stroke="#4DBFBF"
            strokeWidth="16" 
            strokeLinecap="round"
          />
          {/* Center Connector Dot: Orange #F5A623 */}
          <circle cx="50" cy="55" r="8" fill="#F5A623" />
        </svg>
      </div>
      {(size === 'lg' || size === 'xl') && (
        <div className="flex flex-col -space-y-2">
          <span className={`font-extrabold tracking-tighter text-aiko-navy ${size === 'xl' ? 'text-6xl' : 'text-4xl'} ${invert ? 'text-white' : ''}`}>AIKO</span>
          <span className={`font-black text-sm tracking-[0.5em] uppercase leading-none ${invert ? 'text-white/60' : 'text-aiko-teal'}`}>愛工</span>
        </div>
      )}
    </div>
  );
}

const CategoryChip = ({ icon: Icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 font-bold text-xs whitespace-nowrap border-2 ${active ? 'bg-aiko-teal-bg border-aiko-teal text-aiko-teal-dark' : 'bg-white border-transparent text-aiko-navy/40 hover:bg-aiko-gray-100'}`}
  >
    <Icon size={16} />
    {label}
  </button>
);

const NavItem = ({ icon: Icon, label, active, onClick, count, i18nKey }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-300 ${active ? 'bg-aiko-teal-bg text-aiko-teal' : 'text-aiko-navy/30 hover:text-aiko-navy'}`}
  >
    <div className="relative">
      <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
      {count && <span className="absolute -top-1 -right-1 w-4 h-4 bg-aiko-orange text-white text-[8px] font-black rounded-full border-2 border-white flex items-center justify-center">{count}</span>}
    </div>
    <span className="text-[9px] font-black uppercase tracking-widest leading-none" data-i18n={i18nKey}>{label}</span>
  </button>
);

const JobCard = ({ title, company, location, price, time, type, icon: Icon, onApply, lang, onContact, urgent }: any) => {
  const isRTL = lang === 'ar';
  const t = translations[lang as Language];
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bento-card p-6 space-y-4 cursor-pointer group hover:shadow-xl transition-all"
      onClick={onApply}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-aiko-teal-bg text-aiko-teal rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-500">
            <Icon size={28} />
          </div>
          <div>
            <h4 className="font-extrabold text-aiko-navy line-clamp-1">{title}</h4>
            <p className="text-xs font-semibold text-aiko-navy/30">{company} · {location}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-aiko-teal-dark">{price}</span>
          {type && (
            <div className={`text-[9px] font-black uppercase tracking-widest mt-1 flex items-center justify-end gap-1 ${urgent ? 'text-aiko-orange' : 'text-aiko-navy/30'}`}>
              {urgent && <Zap size={10} fill="currentColor" />}
              {type}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-aiko-gray-100 gap-3">
        <div className="flex items-center gap-2 text-[10px] font-bold text-aiko-navy/30">
          <Clock size={12} />
          {time}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onContact(); }}
            className="w-10 h-10 bg-aiko-gray-100 text-aiko-navy/20 flex items-center justify-center rounded-xl hover:bg-aiko-teal-bg hover:text-aiko-teal transition-all active:scale-95"
            title={isRTL ? 'معلومات التواصل' : 'Contact Info'}
          >
            <UserIcon size={18} />
          </button>
          <div 
            onClick={(e) => { e.stopPropagation(); onApply(); }}
            className="bg-aiko-teal text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-aiko-teal-dark transition-colors"
            data-i18n="apply_btn"
          >
            {t.apply_btn}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const WorkerCard = ({ name, skill, rating, price, distance, icon: Icon, onOffer, lang, onContact }: any) => {
  const isRTL = lang === 'ar';
  const t = translations[lang as Language];
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bento-card p-6 space-y-5 group hover:shadow-xl transition-all relative overflow-hidden"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0 pr-4">
          <h4 className="text-xl font-black text-aiko-navy truncate leading-tight">{name}</h4>
          <p className="text-sm font-bold text-aiko-navy/30 truncate mt-0.5">{skill}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(i => <Star key={i} size={12} fill={i <= Math.floor(rating) ? "#F5A623" : "none"} className={i <= Math.floor(rating) ? "text-aiko-orange" : "text-aiko-navy/10"} />)}
            </div>
            <span className="text-[10px] font-black text-aiko-navy/30 mt-0.5">{rating} (127 {isRTL ? "تقييم" : "reviews"})</span>
          </div>
        </div>
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 bg-linear-to-br from-aiko-teal-bg to-white text-aiko-teal rounded-[2rem] flex items-center justify-center overflow-hidden border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-500">
            <Icon size={40} strokeWidth={1} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-aiko-teal rounded-full border-4 border-white shadow-sm flex items-center justify-center">
            <Zap size={10} className="text-white fill-white" />
          </div>
        </div>
      </div>

      <div className="bg-aiko-teal-bg/30 p-3.5 rounded-2xl flex items-center justify-center gap-3 text-aiko-teal-dark font-black text-[10px] uppercase tracking-widest border border-aiko-teal/5">
        <Sun size={14} fill="currentColor" className="text-aiko-orange" />
        <span>{isRTL ? "دوام جزئي — متاح صباحاً من 7:00 إلى 1:00 ظهراً فقـط" : "Part-time — available from 7:00 to 1:00 only"}</span>
      </div>

      <div className="flex flex-wrap gap-2">
         <div className="bg-[#EFFAF5] text-[#22C55E] px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Zap size={12} fill="currentColor" />
            {isRTL ? "متاح الآن" : "Available Now"}
         </div>
         <div className="bg-aiko-gray-100 text-aiko-navy/40 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
            <MapPin size={12} />
            {distance}
         </div>
         <div className="bg-[#FFF9EA] text-[#D4891A] px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
            <Sun size={12} fill="currentColor" />
            {isRTL ? "دوام جزئي" : "Part-time"}
         </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-aiko-gray-100 gap-3">
        <button 
          onClick={(e) => { e.stopPropagation(); onOffer(); }}
          className="flex-1 bg-aiko-orange text-white text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-aiko-orange-dark transition-all active:scale-95 shadow-lg shadow-aiko-orange/20"
        >
          {isRTL ? "إرسال عرض" : "Send Offer"}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onContact(); }}
          className="w-14 h-14 bg-aiko-gray-100 text-aiko-navy/20 flex items-center justify-center rounded-2xl hover:bg-aiko-teal-bg hover:text-aiko-teal transition-all active:scale-95"
        >
          <UserIcon size={24} />
        </button>
        <div className="text-right">
           <p className="text-[10px] font-black text-aiko-navy/30 uppercase tracking-widest leading-none mb-1">{isRTL ? "ساعة /" : "/ Hour"}</p>
           <p className="text-lg font-black text-aiko-navy leading-none">{price}</p>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---
import { authService } from './services/authService';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  const [lang, setLang] = useState<Language>('ar');
  const [currentView, setCurrentView] = useState<'lang' | 'onboard' | 'auth' | 'role' | 'dashboard'>('lang');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [activeTab, setActiveTab] = useState('feed');
  const [category, setCategory] = useState('all');
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [contactTarget, setContactTarget] = useState<any>(null);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isAvailable, setIsAvailable] = useState(true);
  const [workerAvailability, setWorkerAvailability] = useState<any>(null);
  const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showWorkerAvailabilityForm, setShowWorkerAvailabilityForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isRTL, setIsRTL] = useState(lang === "ar");

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    setIsRTL(lang === "ar");
  }, [lang]);

  const t = translations[lang];

  // Profile & Review States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
    avatar: "",
    portfolio: [] as string[]
  });

  const [workerReviewsData, setWorkerReviewsData] = useState<{reviews: any[], averageRating: number, totalReviews: number}>({
    reviews: [],
    averageRating: 0,
    totalReviews: 0
  });

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPostJobModal, setShowPostJobModal] = useState(false);
  const [isEditingService, setIsEditingService] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceData, setServiceData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    budget: '',
    wilaya: ''
  });
  const [reviewData, setReviewData] = useState({
    workerId: '',
    requestId: '',
    rating: 5,
    comment: ''
  });

  const [myRequests, setMyRequests] = useState<any[]>([]);

  const fetchAvailableWorkers = async (filters: any = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.wilaya) params.append('wilaya', filters.wilaya);
      const response = await fetch(`/api/availability?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableWorkers(data.availabilities);
      }
    } catch (err) {
      console.error("Error fetching available workers:", err);
    }
  };

  const fetchJobs = async (filters: any = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.wilaya) params.append('wilaya', filters.wilaya);
      params.append('status', 'open');
      const response = await fetch(`/api/services?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data.services);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  };

  const toggleAvailability = async () => {
    try {
      const response = await fetch("/api/availability/toggle", {
        method: 'PATCH',
        headers: { "Authorization": `Bearer ${authService.getToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIsAvailable(data.isAvailable);
        showToast(isRTL ? "تم تحديث الحالة بنجاح" : "Status updated successfully");
      }
    } catch (err) {
      console.error("Error toggling availability:", err);
    }
  };

  const initSocket = (token: string, userId: string) => {
    const newSocket = io(window.location.origin, {
      auth: { token }
    });
    setSocket(newSocket);
    newSocket.emit("join", { id: userId });
    return newSocket;
  };

  const fetchConversations = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch("/api/messages/conversations", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch("/api/notifications", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch("/api/notifications/read-all", {
        method: 'PATCH',
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch("/api/services/my/requests", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyRequests(data);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  const handleCompleteRequest = async (requestId: string, workerId: string) => {
    try {
      const response = await fetch(`/api/services/${requestId}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });
      if (response.ok) {
        showToast(isRTL ? "تم إتمام الخدمة بنجاح" : "Service marked as completed");
        if (userRole === 'employer' && workerId) {
          setReviewData({ ...reviewData, requestId, workerId });
          setShowReviewModal(true);
        }
        fetchMyRequests();
      }
    } catch (err) {
      console.error("Error completing service:", err);
    }
  };

  const submitReview = async () => {
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(reviewData)
      });
      if (response.ok) {
        showToast(isRTL ? "تم إرسال التقييم بنجاح" : "Review submitted successfully");
        setShowReviewModal(false);
        setReviewData({ workerId: '', requestId: '', rating: 5, comment: '' });
      } else {
        const err = await response.json();
        showToast(err.error || "Failed to submit review", "error");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      showToast("Error submitting review", "error");
    }
  };

  const handleCreateService = async () => {
    try {
      const url = isEditingService ? `/api/services/${editingServiceId}` : "/api/services";
      const method = isEditingService ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(serviceData)
      });
      if (response.ok) {
        showToast(isRTL ? "تمت العملية بنجاح" : "Service request processed successfully");
        setShowPostJobModal(false);
        setIsEditingService(false);
        setEditingServiceId(null);
        setServiceData({ title: '', description: '', category: '', location: '', budget: '', wilaya: '' });
        fetchMyRequests();
      } else {
        const err = await response.json();
        showToast(err.error || "Failed to process service", "error");
      }
    } catch (err) {
      console.error("Error processing service:", err);
      showToast("Error processing service", "error");
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm(isRTL ? "هل أنت متأكد من حذف هذا الطلب؟" : "Are you sure you want to delete this request?")) return;

    try {
      const response = await fetch(`/api/services/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${authService.getToken()}`
        }
      });
      if (response.ok) {
        showToast(isRTL ? "تم حذف الطلب بنجاح" : "Service request deleted successfully");
        fetchMyRequests();
      } else {
        const err = await response.json();
        showToast(err.error || "Failed to delete service", "error");
      }
    } catch (err) {
      console.error("Error deleting service:", err);
      showToast("Error deleting service", "error");
    }
  };

  const fetchChatHistory = async (userId: string) => {
    try {
      const token = authService.getToken();
      const response = await fetch(`/api/messages/${userId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data);
      }
    } catch (err) {
      console.error("Error fetching chat history:", err);
    }
  };

  const fetchWorkerReviews = async (workerId: string) => {
    try {
      const response = await fetch(`/api/reviews/worker/${workerId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkerReviewsData(data);
      }
    } catch (err) {
      console.error("Error fetching worker reviews:", err);
    }
  };

  const handleOpenChat = (user: any) => {
    setActiveChatUser(user);
    fetchChatHistory(user.id);
    if (socket) {
      socket.emit("mark_read", { otherUserId: user.id });
    }
    fetchConversations();
  };

  const handleSendMessage = () => {
    if (isOffline) {
      showToast(t.offline_error, 'error');
      return;
    }
    if (!newMessageText.trim() || !activeChatUser || !socket) return;

    socket.emit("send_message", {
      receiverId: activeChatUser.id,
      text: newMessageText
    });
    setNewMessageText("");
  };

  const handleOpenItem = (item: any) => {
    setActiveItem(item);
  };

  const handleReviewUser = async (targetUserId: string, rating: number, comment: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/messages/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ targetUserId, rating, comment })
      });
      if (response.ok) {
        showToast(isRTL ? "تم إضافة التقييم بنجاح" : "Review added successfully");
        if (activeChatUser && activeChatUser.id === targetUserId) {
           fetchChatHistory(targetUserId);
        }
      }
    } catch (err) {
      console.error("Error submitting review:", err);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const updated = await authService.updateProfile(profileData);
      setCurrentUser((prev: any) => ({ ...prev, ...updated }));
      setIsEditingProfile(false);
      showToast(isRTL ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully");
    } catch (err: any) {
      showToast(err.message || (isRTL ? "فشل تحديث الملف الشخصي" : "Failed to update profile"), "error");
    }
  };

  useEffect(() => {
    if (activeTab === "chat" && currentUser) {
      fetchConversations();
    }
    if (activeTab === "activity" && currentUser) {
      fetchMyRequests();
    }
    if (activeTab === "feed" && currentUser) {
      const filters = { category: category !== 'all' ? category : undefined, wilaya: wilaya ? wilaya.split(' - ')[1] : undefined };
      if (currentUser.role === "employer") {
        fetchAvailableWorkers(filters);
      } else {
        fetchJobs(filters);
      }
    }
  }, [activeTab, currentUser, category, wilaya]);

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        bio: currentUser.bio || "",
        location: currentUser.location || "",
        avatar: currentUser.avatar || "",
        portfolio: currentUser.portfolio || []
      });
      if (currentUser.role === 'worker') {
        fetchWorkerReviews(currentUser.id);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', () => setIsOffline(false));
    window.addEventListener('offline', () => setIsOffline(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', () => setIsOffline(false));
      window.removeEventListener('offline', () => setIsOffline(true));
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          const user = await authService.getMe();
          setCurrentUser(user);
          setUserRole(user.role);
          initSocket(token, user.id);
          setCurrentView('dashboard');
          fetchNotifications();

          if (user.role === 'worker') {
            const res = await fetch("/api/availability/me", {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data) {
                setWorkerAvailability(data);
                setIsAvailable(data.isAvailable);
              }
            }
          }
        } catch (err) {
          authService.clearToken();
          setCurrentView('auth');
        }
      }
      setIsAppLoading(false);
    };
    initAuth();
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("new_message", (message) => {
      if (activeChatUser && (message.senderId === activeChatUser.id || message.receiverId === activeChatUser.id)) {
        setChatMessages(prev => [...prev, message]);
        socket.emit("mark_read", { otherUserId: activeChatUser.id });
      }
      fetchConversations();
    });

    socket.on("message_sent", (message) => {
      if (activeChatUser && (message.senderId === activeChatUser.id || message.receiverId === activeChatUser.id)) {
        setChatMessages(prev => [...prev, message]);
      }
      fetchConversations();
    });

    socket.on("notification", (notification) => {
      setNotifications(prev => [notification, ...prev]);
      if (notification.type === 'new_message') {
        fetchConversations();
      }
    });

    return () => {
      socket.off("new_message");
      socket.off("message_sent");
      socket.off("notification");
    };
  }, [socket, activeChatUser]);

  const [workerSettings, setWorkerSettings] = useState({
    type: 'now',
    price: '1500',
    instantRequests: true,
    selectedCategory: 'home_repair',
    skills: ['hr_0']
  });
  const [filters, setFilters] = useState({
    time: 'now',
    distance: '2km',
    type: 'urgent',
    minPrice: '',
    maxPrice: '',
    rating: '4.5'
  });

  const jobsData = [
    { id: 1, title: 'سباك متنقل مطلوب', company: 'شركة البناء الحديث', location: 'باب الزوار', price: '2500 DA', time: '15m ago', type: isRTL ? 'عاجل' : 'Urgent', icon: Hammer, cat: 'home_repair', urgent: true },
    { id: 2, title: 'فني تكييف مركزي', company: 'الفصول الأربعة', location: 'حيدرة', price: '4000 DA', time: '1h ago', type: isRTL ? 'دوام جزئي' : 'Part-time', icon: Laptop, cat: 'home_repair' },
    { id: 3, title: 'مطور واجهات React', company: 'تيك الجزاير', location: 'سيدي يحيى', price: '8000 DA', time: '3h ago', type: isRTL ? 'عن بعد' : 'Remote', icon: Laptop, cat: 'tech' },
    { id: 4, title: 'سائق شاحنة نقل', company: 'لوجيستيك دزاير', location: 'رويبة', price: '3500 DA', time: '5h ago', type: isRTL ? 'دوام كامل' : 'Full-time', icon: Truck, cat: 'automotive' },
    { id: 5, title: 'منظف واجهات زجاجية', company: 'بلور صافي', location: 'الشراقة', price: '1500 DA/h', time: '6h ago', type: isRTL ? 'سريع' : 'Quick', icon: Sparkles, cat: 'cleaning' },
  ];

  const workersData = [
    { id: 1, name: 'عمر بلقاسم', skill: 'سباك متخصص · 8 سنوات خبرة', rating: 4.9, price: '1500 DA/h', distance: '2.1 km', icon: UserIcon, cat: 'home_repair' },
    { id: 2, name: 'سارة بن علي', skill: 'مطورة تطبيقات الجوال', rating: 4.7, price: '3000 DA/h', distance: '4.5 km', icon: Laptop, cat: 'tech' },
    { id: 3, name: 'ياسين حدادي', skill: 'كهربائي معماري', rating: 4.8, price: '2000 DA/h', distance: '1.2 km', icon: Hammer, cat: 'home_repair' },
    { id: 4, name: 'ليلى عثماني', skill: 'مدرسة لغة إنجليزية', rating: 5.0, price: '1200 DA/h', distance: '3.8 km', icon: GraduationCap, cat: 'education' },
    { id: 5, name: 'كريم قاصدي', skill: 'ميكانيكي سيارات ألمانية', rating: 4.6, price: '2500 DA/h', distance: '5.0 km', icon: Car, cat: 'automotive' },
  ];

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.wilaya.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredWorkers = availableWorkers.filter(avail =>
    avail.worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    avail.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    avail.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    avail.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    avail.wilayas.some((w: string) => w.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const applyTranslations = () => {
    const currentLang = (window as any).currentLang || lang;
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && translations[currentLang as Language] && (translations[currentLang as Language] as any)[key]) {
        el.textContent = (translations[currentLang as Language] as any)[key];
      }
    });

    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key && translations[currentLang as Language] && (translations[currentLang as Language] as any)[key]) {
        (el as HTMLInputElement).placeholder = (translations[currentLang as Language] as any)[key];
      }
    });

    document.body.style.textAlign = currentLang === 'ar' ? 'right' : 'left';
  };

  useEffect(() => {
    applyTranslations();
  }, [lang]);

  const selectLang = (l: Language) => {
    (window as any).currentLang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
    setLang(l);
    
    // Simulating requested behavior
    if ((window as any).langFromProfile) {
      setCurrentView('dashboard');
      setActiveTab('profile');
      (window as any).langFromProfile = false;
    } else {
      setCurrentView('onboard');
    }
  };

  const LangSwitcher = () => (
    <div className="flex gap-2">
      {(['ar', 'en', 'fr'] as Language[]).map(l => (
        <button 
          key={l}
          onClick={() => { setLang(l); applyTranslations(); }}
          className={`px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase transition-all ${lang === l ? 'bg-aiko-teal text-white' : 'bg-aiko-gray-100 text-aiko-navy/30 hover:bg-aiko-teal-bg'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );

  const resetApp = () => {
    setCurrentView('lang');
    setUserRole(null);
    setActiveTab('feed');
  };

  const goBack = () => {
    if (currentView === 'dashboard') setCurrentView('role');
    else if (currentView === 'role') setCurrentView('onboard');
    else if (currentView === 'onboard') setCurrentView('lang');
  };

  const handleLogin = async () => {
    setIsAuthLoading(true);
    try {
      const data = await authService.login(email, password);
      setCurrentUser(data.user);
      setUserRole(data.user.role);
      initSocket(data.token, data.user.id);
      setCurrentView('dashboard');
      showToast(isRTL ? 'تم تسجيل الدخول بنجاح' : 'Login successful');
    } catch (err: any) {
      showToast(t.login_error, 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      showToast(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match', 'error');
      return;
    }
    setIsAuthLoading(true);
    try {
      const data = await authService.register({
        name: fullName,
        email,
        password,
        role: userRole || 'worker',
        location: wilaya && commune ? `${wilaya}, ${commune}` : undefined
      });
      setCurrentUser(data.user);
      setUserRole(data.user.role);
      initSocket(data.token, data.user.id);
      setCurrentView('dashboard');
      showToast(isRTL ? 'تم إنشاء الحساب بنجاح' : 'Registration successful');
    } catch (err: any) {
      showToast(t.register_error, 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  const categories = [
    { id: 'all', label: t.cat_all, icon: Globe, i18n: 'cat_all' },
    ...SERVICE_CATEGORIES.map(cat => ({
      id: cat.id,
      label: isRTL ? cat.name_ar : cat.name_en,
      icon: cat.icon,
      i18n: cat.id
    }))
  ];

  const ContactModal = () => {
    if (!showContactModal || !contactTarget) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowContactModal(false)}
          className="absolute inset-0 bg-aiko-navy/60 backdrop-blur-md"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl space-y-6"
        >
          <div className="flex flex-col items-center text-center space-y-2 mb-4">
             <div className="w-20 h-20 bg-aiko-teal-bg text-aiko-teal rounded-3xl flex items-center justify-center mb-2">
                {contactTarget.icon ? <contactTarget.icon size={40} /> : <UserIcon size={40} />}
             </div>
             <h3 className="text-2xl font-black text-aiko-navy">{contactTarget.name || contactTarget.company || contactTarget.title}</h3>
             <p className="text-sm font-bold text-aiko-navy/40">{isRTL ? (contactTarget.company ? "صاحب عمل" : "عامل") : (contactTarget.company ? "Employer" : "Worker")}</p>
          </div>

          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-5 rounded-3xl bg-aiko-gray-50 border border-transparent hover:border-aiko-teal/20 transition-all group">
              <div className="flex items-center gap-4 text-right">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-aiko-teal shadow-sm group-hover:scale-110 transition-transform">
                  <Phone size={22} fill="currentColor" className="opacity-20" />
                  <Phone size={22} className="absolute" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-aiko-navy">{isRTL ? 'اتصال مباشر' : 'Direct Call'}</h4>
                  <p className="font-mono text-[10px] font-bold text-aiko-navy/30">56 34 12 0550</p>
                </div>
              </div>
              <ChevronRight size={18} className={isRTL ? 'rotate-180 opacity-20' : 'opacity-20'} />
            </button>

            <button className="w-full flex items-center justify-between p-5 rounded-3xl bg-aiko-gray-50 border border-transparent hover:border-aiko-teal/20 transition-all group">
              <div className="flex items-center gap-4 text-right">
                <div className="w-12 h-12 bg-[#F3F7FF] rounded-2xl flex items-center justify-center text-[#3B82F6] shadow-sm group-hover:scale-110 transition-transform">
                  <Mail size={22} fill="currentColor" className="opacity-20" />
                  <Mail size={22} className="absolute" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-aiko-navy">{isRTL ? 'بريد إلكتروني' : 'Email'}</h4>
                  <p className="text-[10px] font-bold text-aiko-navy/30">contact@aiko.dz</p>
                </div>
              </div>
              <ChevronRight size={18} className={isRTL ? 'rotate-180 opacity-20' : 'opacity-20'} />
            </button>

            <button className="w-full flex items-center justify-between p-5 rounded-3xl bg-aiko-gray-50 border border-transparent hover:border-aiko-teal/20 transition-all group">
              <div className="flex items-center gap-4 text-right">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 shadow-sm group-hover:scale-110 transition-transform">
                  <LayoutGrid size={22} fill="currentColor" className="opacity-20" />
                  <LayoutGrid size={22} className="absolute" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-aiko-navy">{isRTL ? 'واتساب' : 'WhatsApp'}</h4>
                  <p className="text-[10px] font-bold text-aiko-navy/30">{isRTL ? 'فتح واتساب' : 'Open WhatsApp'}</p>
                </div>
              </div>
              <ChevronRight size={18} className={isRTL ? 'rotate-180 opacity-20' : 'opacity-20'} />
            </button>
          </div>

          <button 
            onClick={() => setShowContactModal(false)}
            className="w-full py-5 rounded-[2rem] bg-aiko-navy/5 text-aiko-navy font-black text-sm uppercase tracking-widest hover:bg-aiko-navy/10 transition-all"
          >
            {isRTL ? "إغلاق" : "Close"}
          </button>
        </motion.div>
      </div>
    );
  };

  const LocationModal = () => {
    if (!showLocationModal) return null;
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowLocationModal(false)}
          className="absolute inset-0 bg-aiko-navy/60 backdrop-blur-md"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl space-y-6"
        >
          <div className="flex flex-col items-center text-center space-y-2 mb-4">
             <div className="w-16 h-16 bg-aiko-teal-bg text-aiko-teal rounded-2xl flex items-center justify-center mb-2">
                <MapPin size={32} />
             </div>
             <h3 className="text-2xl font-black text-aiko-navy">{isRTL ? "تغيير المنطقة" : "Change Location"}</h3>
             <p className="text-sm font-bold text-aiko-navy/30">{isRTL ? "اختر الولاية والبلدية" : "Select wilaya and commune"}</p>
          </div>

          <div className="space-y-4">
            <FormSelect 
              label={t.wilaya_label} 
              icon={MapPin} 
              options={ALGERIA_WILAYAS}
              value={wilaya}
              onChange={(val: string) => { setWilaya(val); setCommune(''); }}
              i18nLabel="wilaya_label"
              isRTL={isRTL}
            />
            <FormSelect 
              label={t.commune_label} 
              icon={MapPin} 
              options={wilaya ? (ALGERIA_LOCATIONS[wilaya] || []) : []}
              value={commune}
              onChange={setCommune}
              i18nLabel="commune_label"
              isRTL={isRTL}
            />
          </div>

          <button 
            onClick={() => setShowLocationModal(false)}
            className="w-full py-5 rounded-[2rem] bg-aiko-teal text-white font-black text-sm uppercase tracking-widest hover:bg-aiko-teal-dark transition-all shadow-lg shadow-aiko-teal/20"
          >
            {isRTL ? "حفظ التغييرات" : "Save Changes"}
          </button>
        </motion.div>
      </div>
    );
  };

  if (isAppLoading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          <Logo size="xl" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex gap-2 mt-12"
        >
          {[0, 1, 2].map(i => <div key={i} className="w-3 h-3 bg-aiko-teal rounded-full" />)}
        </motion.div>
      </div>
    );
  }

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[9999] bg-linear-to-br from-[#0A7878] via-[#0FA3A3] to-[#4DC8C8] flex flex-col items-center justify-center overflow-hidden">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="bg-white rounded-[32px] flex items-center justify-center shadow-2xl relative"
        >
          <Logo size="md" />
        </motion.div>
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-4xl font-black text-white mt-8 tracking-tight"
          data-i18n="Aiko"
        >
          Aiko
        </motion.h1>
        <motion.div 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex gap-2 mt-6"
        >
          {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-white/50 rounded-full" />)}
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-aiko-gray-100 text-aiko-navy font-sans tracking-tight`} dir={isRTL ? 'rtl' : 'ltr'}>
      <AnimatePresence mode="wait">
        
        {/* --- Language Screen --- */}
        {currentView === 'lang' && (
          <motion.div 
            key="lang"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: isRTL ? 100 : -100 }}
            className="flex-1 flex flex-col items-center justify-center p-8 bg-linear-to-br from-[#0A7878] via-[#0FA3A3] to-[#4DC8C8]"
          >
            <Logo size="lg" invert />
            <h2 className="text-xl font-bold text-white mt-12 mb-8" data-i18n="choose_lang">{t.choose_lang}</h2>
            <div className="w-full max-w-sm space-y-4">
              {(['ar', 'en', 'fr'] as Language[]).map(l => (
                <button 
                  key={l}
                  onClick={() => selectLang(l)}
                  className="w-full flex items-center justify-between p-6 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 hover:bg-white/20 transition-all text-white font-bold"
                >
                  <span>{l === 'ar' ? 'العربية' : l === 'en' ? 'English' : 'Français'}</span>
                  <span className="text-2xl">{l === 'ar' ? '🇩🇿' : l === 'en' ? '🇬🇧' : '🇫🇷'}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* --- Onboarding Screen (Simplified) --- */}
        {currentView === 'onboard' && (
          <motion.div 
            key="onboard"
            initial={{ opacity: 0, x: isRTL ? -100 : 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 100 : -100 }}
            className="flex-1 flex flex-col justify-between p-8 bg-white"
          >
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-12">
              <div className="w-64 h-64 bg-aiko-teal-bg rounded-full flex items-center justify-center text-[100px] shadow-inner">
                <Zap size={80} className="text-aiko-teal animate-pulse" />
              </div>
              <div className="space-y-4 max-w-md">
                <h2 className="text-3xl font-black" data-i18n="ob0_title">{t.ob0_title}</h2>
                <p className="text-aiko-navy/40 font-medium leading-relaxed" data-i18n="ob0_desc">
                  {t.ob0_desc}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <button onClick={() => setCurrentView('auth')} className="btn-primary w-full" data-i18n="start_btn">
                {t.start_btn}
              </button>
            </div>
          </motion.div>
        )}

        {/* --- Authentication Screen --- */}
        {currentView === 'auth' && (
          <motion.div 
            key="auth"
            initial={{ opacity: 0, x: isRTL ? -100 : 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 100 : -100 }}
            className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full overflow-y-auto no-scrollbar scroll-smooth"
          >
            {/* Header with back button */}
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => setCurrentView('onboard')}
                className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-aiko-navy/40 hover:bg-aiko-teal-bg hover:text-aiko-teal transition-all shadow-sm"
              >
                <ArrowLeft size={18} className={isRTL ? 'rotate-180' : ''} />
              </button>
            </div>

            <div className={`flex-1 flex flex-col items-center justify-center space-y-8 bg-white rounded-[40px] p-8 shadow-sm border border-aiko-gray-100 ${authMode === 'signup' ? 'my-4' : ''}`}>
              {authMode === 'login' && (
                <div className="w-12 h-12 bg-aiko-teal-bg rounded-full flex items-center justify-center mb-2">
                  <Logo size="sm" />
                </div>
              )}
              
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-aiko-navy leading-tight">
                  {authMode === 'login' ? (isRTL ? 'مرحباً بعودتك إلى' : 'Welcome back to') : (isRTL ? 'إنشاء حسابك' : 'Create your account')}
                  {authMode === 'login' && <><br/><span className="text-aiko-teal">Aiko</span></>}
                </h2>
                <p className="text-aiko-navy/40 font-bold">
                  {authMode === 'login' ? (isRTL ? 'اعثر على مساعدة محلية في دقائق' : 'Find local help in minutes') : (isRTL ? 'الأمر يستغرق دقيقة واحدة فقط' : 'It only takes a minute')}
                </p>
              </div>

              <div className="w-full space-y-4">
                {authMode === 'signup' && (
                  <FormInput 
                    label={t.fullname_label} 
                    icon={UserIcon} 
                    placeholder="Enter your full name" 
                    value={fullName}
                    onChange={setFullName}
                    i18nLabel="fullname_label"
                    i18nPlaceholder="fullname_label"
                    isRTL={isRTL}
                  />
                )}

                <FormInput
                  label={t.email_label}
                  icon={Mail}
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={setEmail}
                  i18nLabel="email_label"
                  isRTL={isRTL}
                />

                <FormInput 
                  label={t.password_label} 
                  icon={Lock} 
                  showPasswordToggle
                  placeholder="••••••••" 
                  value={password}
                  onChange={setPassword}
                  i18nLabel="password_label"
                  isRTL={isRTL}
                />

                {authMode === 'signup' && (
                  <>
                    <p className="text-[10px] font-bold text-aiko-navy/30 px-2" data-i18n="password_hint">
                      {t.password_hint}
                    </p>
                    <FormInput 
                      label={t.password_confirm_label} 
                      icon={Lock} 
                      showPasswordToggle
                      placeholder="••••••••" 
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      i18nLabel="password_confirm_label"
                      isRTL={isRTL}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormSelect 
                        label={t.wilaya_label} 
                        icon={MapPin} 
                        options={ALGERIA_WILAYAS}
                        value={wilaya}
                        onChange={(val: string) => { setWilaya(val); setCommune(''); }}
                        i18nLabel="wilaya_label"
                        isRTL={isRTL}
                      />
                      <FormSelect 
                        label={t.commune_label} 
                        icon={MapPin} 
                        options={wilaya ? (ALGERIA_LOCATIONS[wilaya] || []) : []}
                        value={commune}
                        onChange={setCommune}
                        i18nLabel="commune_label"
                        isRTL={isRTL}
                      />
                    </div>
                  </>
                )}

                <button 
                  onClick={authMode === 'login' ? handleLogin : () => setCurrentView('role')}
                  disabled={isAuthLoading}
                  className="btn-primary w-full py-5 rounded-2xl shadow-xl shadow-aiko-teal/20 mt-4 flex items-center justify-center gap-3"
                >
                  {isAuthLoading && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  )}
                  {authMode === 'login' ? (isRTL ? 'تسجيل الدخول' : 'Login') : (isRTL ? 'التالي' : 'Next')}
                </button>

                {authMode === 'login' && (
                  <>
                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-aiko-navy/5"></div>
                      <span className="flex-shrink mx-4 text-[10px] font-black text-aiko-navy/20 uppercase tracking-[0.2em]" data-i18n="or_divider">{t.or_divider}</span>
                      <div className="flex-grow border-t border-aiko-navy/5"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button className="flex items-center justify-center gap-2 p-4 bg-white border border-aiko-gray-100 rounded-2xl font-bold text-aiko-navy hover:bg-aiko-gray-100 transition-colors group">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" className="w-4 h-4 opacity-70 group-hover:opacity-100" alt="Apple" />
                        <span>Apple</span>
                      </button>
                      <button className="flex items-center justify-center gap-2 p-4 bg-white border border-aiko-gray-100 rounded-2xl font-bold text-aiko-navy hover:bg-aiko-gray-100 transition-colors group">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-4 h-4 opacity-70 group-hover:opacity-100" alt="Google" />
                        <span>Google</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-2">
                <p className="text-sm font-bold text-aiko-navy/40">
                  {authMode === 'login' ? (isRTL ? 'ليس لديك حساب؟' : "Don't have an account?") : (isRTL ? 'لديك حساب بالفعل؟' : 'Already have an account?')}{' '}
                  <button 
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    className="text-aiko-teal hover:underline font-black"
                  >
                    {authMode === 'login' ? (isRTL ? 'سجل الآن' : 'Sign up') : (isRTL ? 'تسجيل الدخول' : 'Login')}
                  </button>
                </p>
              </div>

              {authMode === 'login' && (
                <div className="text-[10px] font-bold text-aiko-navy/20 leading-relaxed text-center">
                  {isRTL ? 'بالمتابعة فإنك توافق على' : 'By continuing you agree to our'} <br/>
                  <span className="text-aiko-teal underline decoration-aiko-teal/20">Terms</span> & <span className="text-aiko-teal underline decoration-aiko-teal/20">Privacy</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* --- Role Selection --- */}
        {currentView === 'role' && (
          <motion.div 
            key="role"
            initial={{ opacity: 0, x: isRTL ? -100 : 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col p-8 bg-aiko-gray-100"
          >
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setCurrentView('auth')}
                className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-aiko-navy/40 hover:bg-aiko-teal-bg hover:text-aiko-teal transition-all shadow-sm"
              >
                <ArrowLeft size={18} className={isRTL ? 'rotate-180' : ''} />
              </button>
            </div>

            <div className="py-6">
              <h2 className="text-3xl font-black leading-tight">
                <span data-i18n="greeting">{t.greeting}</span>   <br/>
                <span className="text-aiko-navy/30 text-lg font-bold" data-i18n="role_question">{t.role_question}</span>
              </h2>
            </div>
            
            <div className="grid gap-6 flex-1">
              <RoleChoice 
                icon={Search} 
                title={t.role_employer} 
                sub={t.role_employer_sub} 
                active={userRole === 'employer'}
                description={t.ob1_desc}
                onClick={() => setUserRole('employer')}
                i18nTitleKey="role_employer"
                i18nSubKey="role_employer_sub"
                i18nDescKey="ob1_desc"
              />
              <RoleChoice 
                icon={Briefcase} 
                title={t.role_worker} 
                sub={t.role_worker_sub} 
                active={userRole === 'worker'}
                description={t.ob2_desc}
                onClick={() => setUserRole('worker')}
                i18nTitleKey="role_worker"
                i18nSubKey="role_worker_sub"
                i18nDescKey="ob2_desc"
              />
            </div>
            
            <div className="pt-8">
              <button 
                disabled={!userRole || isAuthLoading}
                onClick={handleRegister}
                className="btn-primary w-full disabled:grayscale disabled:opacity-50 flex items-center justify-center gap-3"
                data-i18n="create_account_btn"
              >
                {isAuthLoading && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                )}
                {t.create_account_btn}
              </button>
            </div>
          </motion.div>
        )}

      {/* Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[10000] bg-aiko-orange text-white text-[10px] font-black py-2 px-4 flex items-center justify-center gap-2 shadow-lg"
          >
            <ShieldCheck size={14} />
            {t.offline_msg}
          </motion.div>
        )}
      </AnimatePresence>

        {/* --- Dashboard --- */}
        {currentView === 'dashboard' && (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col"
          >
            {/* Header */}
            <div className="bg-white border-b border-aiko-gray-100 p-6 sticky top-0 z-50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className="w-10 h-10 rounded-2xl bg-aiko-gray-100 flex items-center justify-center text-aiko-navy/20 hover:bg-aiko-teal-bg hover:text-aiko-teal transition-all"
                  >
                    <UserIcon size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      setShowNotification(!showNotification);
                      if (!showNotification) {
                        fetchNotifications();
                      }
                    }}
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all relative ${showNotification ? 'bg-aiko-orange text-white shadow-lg' : 'bg-aiko-gray-100 text-aiko-navy/40'}`}
                  >
                    <Bell size={20} />
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-aiko-orange text-white text-[8px] font-black rounded-full border-2 border-white flex items-center justify-center">
                        {notifications.filter(n => !n.isRead).length}
                      </span>
                    )}
                  </button>

                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <h3 className="text-lg font-black text-aiko-navy leading-none">Aiko</h3>
                  </div>
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center p-2 shadow-sm">
                    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                      <path
                        d="M30 75 C20 75 20 60 50 20 C65 40 70 55 58 68 C50 78 45 78 40 68"
                        fill="none"
                        stroke="#0F6E6E"
                        strokeWidth="16"
                        strokeLinecap="round"
                      />
                      <path
                        d="M50 20 C80 20 85 60 70 75 C60 85 45 75 52 55"
                        fill="none"
                        stroke="#4DBFBF"
                        strokeWidth="16"
                        strokeLinecap="round"
                      />
                      <circle cx="50" cy="55" r="8" fill="#F5A623" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                <div 
                  onClick={() => setShowLocationModal(true)}
                  className="flex items-center justify-between text-xs font-bold text-aiko-navy/40 bg-aiko-gray-50 p-4 rounded-2xl cursor-pointer hover:bg-aiko-teal-bg/30 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center text-aiko-teal">
                      <MapPin size={16} />
                    </div>
                    <span className="group-hover:text-aiko-teal transition-colors">
                      {wilaya && commune ? `${wilaya.split(' - ')[1]}, ${commune}` : (isRTL ? "الجزائر العاصمة، باب الزوار" : "Algiers, Bab Ezzouar")}
                    </span>
                  </div>
                  <button className="text-aiko-teal font-black uppercase tracking-widest text-[10px] hover:text-aiko-orange transition-colors">
                    {isRTL ? "تغيير" : "Change"}
                  </button>
                </div>
              </div>
            </div>

            <main className="flex-1 p-6 space-y-8 pb-32 overflow-y-auto">
              {activeTab === 'feed' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Specialized Content for Worker */}
                  {userRole === 'worker' ? (
                    <>
                      <div className="bg-linear-to-br from-[#0A7878] to-[#0FA3A3] p-8 rounded-[32px] text-white space-y-6 relative overflow-hidden shadow-2xl">
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-2xl font-black" data-i18n="greeting">{t.greeting} {currentUser?.name}  </h3>
                              <p className="text-white/60 font-bold text-sm mt-1" data-i18n={isAvailable ? "avail_on" : "avail_off"}>{isAvailable ? t.avail_on : t.avail_off}</p>
                            </div>
                            <div 
                              className={`w-14 h-8 rounded-full relative p-1 cursor-pointer transition-colors duration-500 ${isAvailable ? 'bg-aiko-orange' : 'bg-white/20'}`} 
                              onClick={toggleAvailability}
                            >
                              <motion.div 
                                animate={{ x: isAvailable ? (isRTL ? 0 : 24) : (isRTL ? 24 : 0) }}
                                className="w-6 h-6 bg-white rounded-full shadow-lg" 
                              />
                            </div>
                          </div>
                          <div className="flex gap-3 mt-8 overflow-x-auto no-scrollbar pb-2">
                            <button
                              onClick={() => setShowWorkerAvailabilityForm(true)}
                              className="bg-white text-aiko-teal px-6 py-3 rounded-2xl text-xs font-black whitespace-nowrap hover:bg-aiko-teal-bg transition-all flex items-center gap-2 shadow-lg"
                            >
                              <Plus size={16} strokeWidth={3} />
                              <span>{isRTL ? "أنا متاح للعمل" : "I'm available for work"}</span>
                            </button>
                            {[
                              { icon: Zap, label: t.available_now, color: 'text-aiko-orange' },
                              { icon: Calendar, label: t.pending, color: 'text-blue-400' },
                              { icon: Sun, label: t.part_time, color: 'text-yellow-400' },
                              { icon: Briefcase, label: t.full_time, color: 'text-white' }
                            ].map((filter, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => setCategory('all')}
                                className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap hover:bg-white/30 transition-all flex items-center gap-2 group"
                              >
                                <filter.icon size={14} className={`${filter.color} group-hover:scale-110 transition-transform`} />
                                <span>{filter.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="relative mb-6">
                        <input
                          type="text"
                          placeholder={isRTL ? "ابحث بذكاء عن وظائف..." : "Smart search for jobs..."}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-white border-2 border-aiko-gray-100 rounded-[2rem] py-5 px-8 pr-14 text-sm font-bold text-aiko-navy focus:outline-none focus:border-aiko-teal transition-all shadow-sm"
                        />
                        <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-6" : "right-6"} text-aiko-teal`}>
                          <Search size={22} strokeWidth={3} />
                        </div>
                      </div>

                      <SectionTitle title={t.jobs_nearby_title} action={t.choose_lang === "Choose Your Language" ? "All" : "الكل"} onClick={() => setCategory('all')} />
                      <div className="grid gap-4">
                        {filteredJobs.map(job => (
                          <JobCard 
                            key={job.id}
                            title={job.title}
                            company={job.employer.name}
                            location={job.wilaya}
                            price={job.budget}
                            time={new Date(job.createdAt).toLocaleDateString()}
                            type={job.category}
                            icon={SERVICE_CATEGORIES.find(c => c.id === job.category)?.icon || Hammer}
                            lang={lang}
                            onApply={() => handleOpenItem(job)}
                            onContact={() => {
                              setContactTarget(job);
                              setShowContactModal(true);
                            }}
                          />
                        ))}
                        {filteredJobs.length === 0 && (
                          <div className="p-12 text-center text-aiko-navy/30 font-bold border-2 border-dashed border-aiko-gray-100 rounded-[32px]">
                            <Search className="mx-auto mb-4 opacity-20" size={48} />
                            {isRTL ? "لا توجد وظائف متاحة في هذا التصنيف" : "No jobs found in this category"}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-[#D4891A] p-8 rounded-[40px] text-white space-y-6 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl" />
                        
                        <div className="relative z-10 text-center space-y-4">
                          <h3 className="text-3xl font-black">{isRTL ? "ابحث عن العامل المناسب" : "Search for the right worker"}</h3>
                          <p className="text-white/80 font-bold text-sm">{isRTL ? "انشر وظيفة أو أرسل عرضاً مؤقتاً مباشرة" : "Post a job or send an instant offer directly"}</p>
                          
                          <div className="flex gap-3 pt-4">
                            <button className="flex-1 bg-white/20 backdrop-blur-md border border-white/30 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/30 transition-all">
                               <Zap size={14} fill="currentColor" />
                               {isRTL ? "طلب فوري" : "Instant Request"}
                            </button>
                            <button
                              onClick={() => setShowPostJobModal(true)}
                              className="flex-1 bg-white text-[#D4891A] font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all"
                            >
                               <Bell size={14} fill="currentColor" />
                               {isRTL ? "نشر وظيفة" : "Post Job"}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-white p-5 rounded-[2.5rem] border-2 border-aiko-gray-100 shadow-sm">
                        <div className="space-y-1">
                           <h4 className="text-sm font-black text-aiko-navy flex items-center gap-2">
                              {isRTL ? "الطلبات المؤقتة مفعلة" : "Instant Requests Enabled"}
                              <Clock size={20} />
                           </h4>
                           <p className="text-[10px] font-bold text-aiko-navy/30">{isRTL ? "العمال لديهم 5 دقائق للرد على طلباتك" : "Workers have 5 mins to respond to your requests"}</p>
                        </div>
                        <div 
                          className={`w-14 h-8 rounded-full relative p-1 cursor-pointer transition-colors duration-500 bg-aiko-orangeShadow bg-aiko-orange overflow-hidden border-2 border-white shadow-inner`}
                        >
                           <motion.div 
                              animate={{ x: isRTL ? 0 : 24 }}
                              className="w-5 h-5 bg-white rounded-full shadow-lg"
                           />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="relative mb-6">
                          <input 
                            type="text"
                            placeholder={isRTL ? "ابحث بذكاء عن عمال..." : "Smart search for workers..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border-2 border-aiko-gray-100 rounded-[2rem] py-5 px-8 pr-14 text-sm font-bold text-aiko-navy focus:outline-none focus:border-aiko-teal transition-all shadow-sm"
                          />
                          <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-6" : "right-6"} text-aiko-teal`}>
                            <Search size={22} strokeWidth={3} />
                          </div>
                        </div>

                        <h3 className="text-2xl font-black text-aiko-navy">{isRTL ? "عمال متاحون" : "Available Workers"}</h3>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                           {[
                              { label: isRTL ? 'الكل' : 'All', active: category === 'all', icon: Sun },
                              { label: isRTL ? 'التوقيت' : 'Timing', active: false, icon: Clock },
                              { label: isRTL ? 'المكان' : 'Location', active: false, icon: MapPin },
                              { label: isRTL ? 'متاح الآن' : 'Available Now', active: false, icon: Zap },
                           ].map((filter, i) => (
                              <button key={i} className={`flex-shrink-0 px-6 py-3 rounded-full font-black text-xs flex items-center gap-2 transition-all border-2 ${filter.active ? 'bg-aiko-teal text-white border-aiko-teal shadow-lg' : 'bg-white text-aiko-navy/40 border-aiko-gray-100'}`}>
                                 <filter.icon size={16} />
                                 {filter.label}
                              </button>
                           ))}
                        </div>
                      </div>

                      <div className="grid gap-4">
                        {filteredWorkers.map(avail => (
                          <motion.div
                            key={avail.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bento-card p-6 space-y-4 group hover:shadow-xl transition-all"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-aiko-teal-bg text-aiko-teal rounded-2xl flex items-center justify-center">
                                  <UserIcon size={28} />
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-aiko-navy">{avail.worker.name}</h4>
                                  <div className="flex items-center gap-1">
                                    <Star size={12} fill="#F5A623" className="text-aiko-orange" />
                                    <span className="text-[10px] font-black text-aiko-navy/30">{avail.worker.rating || "5.0"}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-black text-aiko-teal">{avail.hourlyRate} DA/h</p>
                                {avail.dailyRate && <p className="text-[10px] font-bold text-aiko-navy/30">{avail.dailyRate} DA/day</p>}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h5 className="font-black text-sm text-aiko-navy">{avail.title}</h5>
                              <p className="text-xs font-medium text-aiko-navy/60 leading-relaxed line-clamp-2">
                                {avail.description.substring(0, 100)}{avail.description.length > 100 ? '...' : ''}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {avail.wilayas.map((w: string) => (
                                <span key={w} className="px-3 py-1 rounded-full bg-aiko-teal-bg text-aiko-teal-dark font-black text-[8px] uppercase tracking-widest border border-aiko-teal/10">
                                  {w}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center gap-3 pt-2 border-t border-aiko-gray-100">
                              <button
                                onClick={() => handleOpenChat(avail.worker)}
                                className="flex-1 bg-aiko-teal text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-aiko-teal-dark transition-all flex items-center justify-center gap-2"
                              >
                                <MessageCircle size={14} />
                                {isRTL ? "تواصل معه" : "Contact Him"}
                              </button>
                            </div>
                          </motion.div>
                        ))}
                        {availableWorkers.length === 0 && (
                          <div className="p-12 text-center text-aiko-navy/30 font-bold border-2 border-dashed border-aiko-gray-100 rounded-[32px]">
                            <Search className="mx-auto mb-4 opacity-20" size={48} />
                            {isRTL ? "لا يوجد عمال متاحون حالياً" : "No workers available currently"}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Categories */}
                  <SectionTitle title={t.categories} />
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {categories.map(cat => (
                      <CategoryChip 
                        key={cat.id} 
                        {...cat} 
                        active={category === cat.id} 
                        onClick={() => setCategory(cat.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <SectionTitle title={userRole === 'worker' ? t.nav_requests : t.nav_myjobs} i18nTitleKey={userRole === 'worker' ? "nav_requests" : "nav_myjobs"} />
                  <div className="space-y-4">
                    {myRequests.map((req) => (
                      <div key={req.id} className={`bento-card p-6 border-l-4 ${req.status === 'completed' ? 'border-aiko-teal' : 'border-aiko-orange'} flex items-center justify-between`}>
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${req.status === 'completed' ? 'bg-aiko-teal/10 text-aiko-teal' : 'bg-aiko-orange/10 text-aiko-orange'}`}>
                            {req.status === 'completed' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                          </div>
                          <div>
                            <h4 className="font-black text-aiko-navy">{req.title}</h4>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-aiko-navy/40">{isRTL ? (req.status === 'open' ? 'مفتوح' : req.status === 'assigned' ? 'تم التعيين' : 'مكتمل') : req.status}</p>
                              {userRole === 'employer' && req.status === 'open' && (
                                <div className="flex items-center gap-2 ml-2">
                                  <button
                                    onClick={() => {
                                      setEditingServiceId(req.id);
                                      setIsEditingService(true);
                                      setServiceData({
                                        title: req.title,
                                        description: req.description,
                                        category: req.category,
                                        location: req.location,
                                        budget: req.budget,
                                        wilaya: req.wilaya
                                      });
                                      setShowPostJobModal(true);
                                    }}
                                    className="text-[10px] font-black text-aiko-teal hover:underline"
                                  >
                                    {isRTL ? "تعديل" : "Edit"}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteService(req.id)}
                                    className="text-[10px] font-black text-red-500 hover:underline"
                                  >
                                    {isRTL ? "حذف" : "Delete"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-sm font-black text-aiko-teal">{req.budget}</span>
                          {req.status === 'assigned' && (
                            <button
                              onClick={() => handleCompleteRequest(req.id, req.workerId)}
                              className="text-[10px] font-black uppercase tracking-widest bg-aiko-teal text-white px-3 py-1.5 rounded-lg"
                            >
                              {isRTL ? "إتمام المهمة" : "Complete Task"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {myRequests.length === 0 && (
                       <div className="text-center py-10 text-aiko-navy/20">
                        <Briefcase size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="font-bold">{isRTL ? "لا توجد طلبات حالياً" : "No requests yet"}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'chat' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {!activeChatUser ? (
                    <>
                      <SectionTitle title={t.nav_messages} i18nTitleKey="nav_messages" />
                      <div className="space-y-2">
                        {conversations.map((conv, i) => (
                          <div
                            key={i}
                            onClick={() => handleOpenChat(conv.otherUser)}
                            className="flex items-center gap-4 p-4 hover:bg-white rounded-2xl cursor-pointer transition-colors group"
                          >
                            <div className="w-14 h-14 bg-aiko-gray-100 rounded-full overflow-hidden border-2 border-transparent group-hover:border-aiko-teal transition-all">
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.otherUser.name}`} alt="" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-black text-aiko-navy">{conv.otherUser.name}</h4>
                                <span className="text-[10px] font-bold text-aiko-navy/30">
                                  {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <p className={`text-xs ${conv.unreadCount > 0 ? "font-black text-aiko-navy" : "font-medium text-aiko-navy/40"} truncate`}>
                                {conv.lastMessage.text}
                              </p>
                            </div>
                            {conv.unreadCount > 0 && (
                              <div className="w-5 h-5 bg-aiko-orange rounded-full flex items-center justify-center text-[10px] font-black text-white">
                                {conv.unreadCount}
                              </div>
                            )}
                          </div>
                        ))}
                        {conversations.length === 0 && (
                          <div className="text-center py-20 text-aiko-navy/20">
                            <MessageCircle size={48} className="mx-auto mb-4 opacity-10" />
                            <p className="font-bold">{isRTL ? "لا توجد محادثات بعد" : "No conversations yet"}</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col h-[70vh]">
                      <div className="flex items-center gap-4 mb-6">
                        <button
                          onClick={() => setActiveChatUser(null)}
                          className="w-10 h-10 rounded-xl bg-aiko-gray-100 flex items-center justify-center text-aiko-navy"
                        >
                          <ArrowLeft size={20} className={isRTL ? "rotate-180" : ""} />
                        </button>
                        <div className="flex items-center gap-3">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChatUser.name}`} className="w-10 h-10 rounded-full bg-aiko-gray-100" alt="" />
                          <div>
                            <h4 className="font-black text-aiko-navy leading-none">{activeChatUser.name}</h4>
                            <span className="text-[10px] font-bold text-aiko-teal uppercase tracking-widest">{activeChatUser.role}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-aiko-teal/5 p-4 rounded-2xl mb-4">
                         <p className="text-xs font-black text-aiko-teal mb-2">{isRTL ? "اترك تقييما لهذا الشخص" : "Leave a review for this user"}</p>
                         <div className="flex gap-2 mb-2">
                           {[1,2,3,4,5].map(s => (
                             <button key={s} onClick={() => handleReviewUser(activeChatUser.id, s, "")} className="text-aiko-orange"><Star size={16} fill="currentColor" /></button>
                           ))}
                         </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
                        {chatMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex ${msg.senderId === currentUser.id ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-bold shadow-sm ${
                              msg.senderId === currentUser.id
                                ? "bg-aiko-teal text-white rounded-br-none"
                                : "bg-white text-aiko-navy rounded-bl-none"
                            }`}>
                              {msg.text}
                              <div className={`text-[8px] mt-1 opacity-50 ${msg.senderId === currentUser.id ? "text-right" : "text-left"}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex gap-2">
                        <input
                          type="text"
                          value={newMessageText}
                          onChange={(e) => setNewMessageText(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                          placeholder={isRTL ? "اكتب رسالتك..." : "Type your message..."}
                          className="flex-1 bg-white border-2 border-aiko-gray-100 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-aiko-teal"
                        />
                        <button
                          onClick={handleSendMessage}
                          className="w-12 h-12 bg-aiko-teal text-white rounded-2xl flex items-center justify-center hover:bg-aiko-teal-dark transition-all"
                        >
                          <Send size={20} className={isRTL ? "rotate-180" : ""} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'profile' && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {isEditingProfile ? (
                    <div className="space-y-6 pb-20">
                      <div className="flex items-center gap-4 mb-4">
                        <button 
                          onClick={() => setIsEditingProfile(false)}
                          className="w-12 h-12 rounded-2xl bg-aiko-gray-100 flex items-center justify-center text-aiko-navy hover:bg-aiko-teal-bg hover:text-aiko-teal transition-all active:scale-95"
                        >
                          <ArrowLeft size={24} className={isRTL ? 'rotate-180' : ''} />
                        </button>
                        <h2 className="text-2xl font-black text-aiko-navy">{isRTL ? 'تعديل الملف' : 'Edit Profile'}</h2>
                      </div>

                      <div className="flex flex-col items-center gap-4 py-4">
                        <div className="relative group">
                          <div className="w-32 h-32 bg-aiko-teal-bg rounded-[3rem] overflow-hidden border-4 border-white shadow-xl flex items-center justify-center text-aiko-teal">
                            <img 
                              src={profileData.avatar || `https://images.unsplash.com/photo-${userRole === 'worker' ? '1507003211169-0a1dd7228f2d' : '1438761681033-6461ffad8d80'}?w=200&h=200&fit=crop`}
                              className="w-full h-full object-cover" 
                              alt="Profile" 
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="text-white" size={32} />
                            </div>
                          </div>
                          <label className="absolute bottom-1 right-1 w-10 h-10 bg-aiko-orange text-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                            <Camera size={20} />
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setProfileData({...profileData, avatar: reader.result as string});
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <p className="text-[10px] font-black text-aiko-navy/30 uppercase tracking-widest">{isRTL ? 'تغيير الصورة' : 'Change Photo'}</p>
                      </div>

                      <div className="space-y-4">
                        <FormInput 
                          label={isRTL ? "الاسم الكامل" : "Full Name"} 
                          icon={UserIcon} 
                          value={profileData.name} 
                          onChange={(val: string) => setProfileData({...profileData, name: val})}
                        />
                        <FormInput
                          label={isRTL ? "البريد الإلكتروني" : "Email"}
                          icon={Mail}
                          value={profileData.email}
                          onChange={(val: string) => setProfileData({...profileData, email: val})}
                        />
                        <FormInput
                          label={isRTL ? "رقم الهاتف" : "Phone Number"}
                          icon={Phone}
                          value={profileData.phone}
                          onChange={(val: string) => setProfileData({...profileData, phone: val})}
                        />
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-aiko-navy/40 px-6 block">
                            {isRTL ? "الوصف الشخصي" : "Bio"}
                          </label>
                          <textarea 
                            className="w-full bg-aiko-gray-50 rounded-[2rem] p-6 text-sm font-bold text-aiko-navy focus:outline-none focus:ring-4 focus:ring-aiko-teal/5 min-h-[140px] resize-none border-2 border-transparent focus:border-aiko-teal/20 transition-all"
                            value={profileData.bio}
                            onChange={(e: any) => setProfileData({...profileData, bio: e.target.value})}
                          />
                        </div>
                        <FormInput
                          label={isRTL ? "الموقع" : "Location"}
                          icon={MapPin}
                          value={profileData.location}
                          onChange={(val: string) => setProfileData({...profileData, location: val})}
                        />
                      </div>

                      <div className="flex gap-4 pt-4 pb-20">
                         <button 
                          onClick={() => setIsEditingProfile(false)}
                          className="flex-1 py-5 rounded-[2rem] bg-aiko-gray-100 text-aiko-navy font-black text-sm uppercase tracking-widest hover:bg-aiko-gray-200 transition-all"
                        >
                          {isRTL ? "إلغاء" : "Cancel"}
                        </button>
                        <button 
                          onClick={handleUpdateProfile}
                          className="flex-[2] py-5 rounded-[2rem] bg-aiko-teal text-white font-black text-sm uppercase tracking-widest hover:bg-aiko-teal-dark transition-all shadow-xl shadow-aiko-teal/20"
                        >
                          {isRTL ? "حفظ التغييرات" : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bento-card p-8 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-aiko-teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-28 h-28 bg-aiko-teal-bg rounded-[2.5rem] mx-auto mb-6 flex items-center justify-center p-1 border-4 border-white shadow-xl relative z-10 group cursor-pointer overflow-hidden">
                          <img 
                            src={profileData.avatar || `https://images.unsplash.com/photo-${userRole === 'worker' ? '1507003211169-0a1dd7228f2d' : '1438761681033-6461ffad8d80'}?w=200&h=200&fit=crop`}
                            className="w-full h-full rounded-[2rem] object-cover transition-transform group-hover:scale-110" 
                            alt="Profile" 
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={24} />
                          </div>
                        </div>
                        <h3 className="text-2xl font-black text-aiko-navy mb-2 relative z-10">{profileData.name}</h3>
                        <div className="flex items-center justify-center gap-2 text-aiko-teal font-black text-sm mb-4 relative z-10">
                          <MapPin size={16} />
                          <span>{profileData.location || (isRTL ? 'الجزائر العاصمة' : 'Algiers Center')}</span>
                        </div>
                        <div className="flex justify-center gap-8 relative z-10">
                          <div className="text-center group/stat cursor-pointer">
                            <p className="text-xl font-black text-aiko-navy group-hover:text-aiko-teal transition-colors">
                              {currentUser?.role === 'worker' ? (workerReviewsData.averageRating?.toFixed(1) || "0.0") : (currentUser?.rating || "5.0")}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-aiko-navy/30 mb-1">{isRTL ? "التقييم" : "Rating"}</p>
                            <div className="flex gap-0.5 justify-center mt-1 text-aiko-orange">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={10}
                                  fill={i < Math.round(currentUser?.role === 'worker' ? workerReviewsData.averageRating : (currentUser?.rating || 5)) ? "currentColor" : "none"}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="h-10 w-[2px] bg-aiko-gray-100 self-center" />
                          <div className="text-center group/stat cursor-pointer">
                            <p className="text-xl font-black text-aiko-navy group-hover:text-aiko-teal transition-colors">
                              {currentUser?.role === 'worker' ? workerReviewsData.totalReviews : "128"}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-aiko-navy/30 mb-1">
                              {currentUser?.role === 'worker' ? (isRTL ? "التقييمات" : "Reviews") : (isRTL ? "المهام" : "Jobs")}
                            </p>
                            <div className="w-8 h-1 bg-aiko-teal/20 mx-auto mt-2 rounded-full overflow-hidden">
                              <div className="w-2/3 h-full bg-aiko-teal" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <SectionTitle title={isRTL ? "نبذة عني" : "About Me"} />
                          <button 
                            onClick={() => setIsEditingProfile(true)}
                            className="text-aiko-teal text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-aiko-orange transition-colors"
                          >
                            <Settings2 size={14} />
                            {isRTL ? "تعديل" : "Edit"}
                          </button>
                        </div>
                        <div className="bento-card p-6 border-2 border-transparent hover:border-aiko-teal/5 transition-all">
                          <p className="text-sm font-bold text-aiko-navy/60 leading-relaxed">
                            {profileData.bio}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <SectionTitle title={isRTL ? (userRole === 'worker' ? "معرض أعمالي" : "معرض صوري") : (userRole === 'worker' ? "Works Gallery" : "Photo Gallery")} />
                          <button className="w-10 h-10 rounded-xl bg-aiko-teal-bg text-aiko-teal flex items-center justify-center hover:bg-aiko-teal hover:text-white transition-all">
                            <Plus size={20} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {profileData.portfolio.map((img, i) => (
                            <div key={i} className="aspect-video rounded-3xl overflow-hidden shadow-sm border-4 border-white group cursor-pointer hover:shadow-lg transition-all relative">
                              <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Work" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newPortfolio = profileData.portfolio.filter((_, idx) => idx !== i);
                                    setProfileData({...profileData, portfolio: newPortfolio});
                                    showToast(isRTL ? 'تم حذف الصورة بنجاح' : 'Image deleted successfully');
                                  }}
                                  className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                             onClick={() => {
                               const url = prompt(isRTL ? "أدخل رابط الصورة:" : "Enter image URL:");
                               if (url) {
                                 setProfileData({...profileData, portfolio: [...profileData.portfolio, url]});
                               }
                             }}
                             className="aspect-video rounded-3xl border-4 border-dashed border-aiko-gray-100 flex flex-col items-center justify-center gap-2 text-aiko-navy/20 hover:border-aiko-teal/20 hover:text-aiko-teal transition-all"
                          >
                            <Camera size={32} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{isRTL ? "إضافة" : "Add"}</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <SectionTitle title={isRTL ? "الآراء والتقييمات" : "Ratings & Reviews"} />
                        
                        <div className="space-y-4">
                          {workerReviewsData.reviews.slice(0, 3).map((review) => (
                            <div key={review.id} className="bento-card p-6 hover:translate-x-1 transition-transform space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-aiko-gray-100 rounded-2xl flex items-center justify-center text-aiko-navy/20 border-2 border-white shadow-sm">
                                  <UserIcon size={24} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-black text-aiko-navy">{review.employer.name}</h4>
                                    <span className="text-[10px] font-bold text-aiko-navy/30">{new Date(review.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex gap-0.5 text-aiko-orange mt-0.5">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} />)}
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs font-bold text-aiko-navy/60 leading-relaxed">{review.comment}</p>
                            </div>
                          ))}
                          {workerReviewsData.reviews.length === 0 && (
                            <div className="text-center py-10 text-aiko-navy/20 bg-white rounded-[2rem]">
                              <Star size={48} className="mx-auto mb-4 opacity-10" />
                              <p className="font-bold">{isRTL ? "لا توجد تقييمات بعد" : "No reviews yet"}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <SectionTitle title={isRTL ? "إعدادات إضافية" : "Additional Settings"} />
                        <div className="space-y-2">
                          {[
                            { icon: Globe, label: t.language_setting, action: () => { (window as any).langFromProfile = true; setCurrentView('lang'); } },
                            { icon: Bell, label: t.nav_notif },
                            { icon: ShieldCheck, label: isRTL ? "الأمان والخصوصية" : "Security & Privacy" }
                          ].map((item, i) => (
                            <button 
                              key={i} 
                              onClick={item.action}
                              className="w-full flex items-center justify-between p-5 rounded-2xl bg-white hover:bg-aiko-gray-100 transition-colors shadow-sm"
                            >
                              <div className="flex items-center gap-4">
                                <item.icon size={20} className={"text-aiko-navy/40"} />
                                <span className={`text-sm font-bold text-aiko-navy`}>{item.label}</span>
                              </div>
                              <ChevronRight size={16} className={isRTL ? 'rotate-180 opacity-20' : 'opacity-20'} />
                            </button>
                          ))}
                        </div>
                        {showInstallBtn && (
                          <button
                            onClick={handleInstallClick}
                            className="w-full py-5 rounded-[2rem] bg-aiko-teal-bg text-aiko-teal font-black text-sm uppercase tracking-widest hover:bg-aiko-teal/10 transition-all flex items-center justify-center gap-3"
                          >
                            <Plus size={20} />
                            {t.install_app}
                          </button>
                        )}
                        <button onClick={handleLogout} className="w-full btn-orange py-5 uppercase tracking-widest flex items-center justify-center gap-3 shadow-huge">
                          <Trash2 size={20} />
                          {t.logout}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </main>

            {/* Nav Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-linear-to-t from-aiko-gray-100 to-transparent pointer-events-none z-[80]">
              <nav className="bg-white p-4 rounded-[32px] shadow-huge flex items-center justify-around pointer-events-auto border border-aiko-teal/5">
                <NavItem icon={userRole === 'worker' ? Globe : Search} label={userRole === 'worker' ? t.nav_jobs : t.nav_workers} active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} i18nKey={userRole === 'worker' ? "nav_jobs" : "nav_workers"} />
                <NavItem icon={Briefcase} label={userRole === 'worker' ? t.nav_requests : t.nav_myjobs} active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} count={1} i18nKey={userRole === 'worker' ? "nav_requests" : "nav_myjobs"} />
                <NavItem
                  icon={MessageCircle}
                  label={t.nav_messages}
                  active={activeTab === 'chat'}
                  onClick={() => setActiveTab('chat')}
                  count={conversations.reduce((sum, conv) => sum + conv.unreadCount, 0) || undefined}
                  i18nKey="nav_messages"
                />
                <NavItem icon={UserIcon} label={t.nav_profile} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} i18nKey="nav_profile" />
              </nav>
            </div>

            {/* Detail Modal */}
            <AnimatePresence>
              {activeItem && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setActiveItem(null)}
                    className="absolute inset-0 bg-aiko-navy/40 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    className="relative w-full max-w-lg bg-white rounded-[40px] p-8 shadow-2xl overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-r from-aiko-teal to-aiko-orange" />
                    <button onClick={() => setActiveItem(null)} className="absolute top-6 right-6 p-2 text-aiko-navy/20 hover:text-aiko-navy transition-colors"><X size={24} /></button>
                    
                    <div className="flex flex-col items-center text-center space-y-6 pt-4">
                      <div className="w-24 h-24 bg-aiko-teal-bg text-aiko-teal rounded-[32px] flex items-center justify-center">
                        <activeItem.icon size={48} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-aiko-navy">{activeItem.title || activeItem.name}</h3>
                        <p className="text-aiko-navy/40 font-bold">{activeItem.company || activeItem.skill}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="bg-aiko-gray-100 p-4 rounded-2xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-aiko-navy/30">{isRTL ? "الموقع" : "Location"}</p>
                          <p className="text-sm font-black text-aiko-navy mt-1">{activeItem.location || activeItem.distance}</p>
                        </div>
                        <div className="bg-aiko-teal-bg p-4 rounded-2xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-aiko-teal-dark/30">{isRTL ? "الميزانية" : "Budget"}</p>
                          <p className="text-sm font-black text-aiko-teal-dark mt-1">{activeItem.price}</p>
                        </div>
                      </div>

                      <div className="w-full space-y-3">
                        <button className="btn-primary w-full py-5 text-sm uppercase tracking-[0.2em]">
                          {userRole === 'worker' ? (isRTL ? "تقديم طلب الآن" : "Apply Protocol") : (isRTL ? "إرسال العقد" : "Send Contract")}
                        </button>
                        <button className="w-full py-4 text-xs font-black text-aiko-navy/30 uppercase tracking-widest hover:text-aiko-navy transition-colors">
                          {isRTL ? "حفظ للمراجعة" : "Save for Review"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Notification Drawer */}
            <AnimatePresence>
                {showNotification && (
                  <>
                    <motion.div 
                      key="notif-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowNotification(false)}
                      className="fixed inset-0 bg-aiko-navy/60 backdrop-blur-md z-[110]"
                    />
                    <motion.div 
                      key="notif-drawer"
                      initial={{ x: isRTL ? "100%" : "-100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: isRTL ? "100%" : "-100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                      className={`fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} w-full sm:w-[450px] bg-aiko-gray-50 z-[111] shadow-2xl flex flex-col`}
                    >
                      <div className="p-8 bg-white border-b border-aiko-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setShowNotification(false)} 
                            className="w-12 h-12 rounded-2xl bg-aiko-gray-100 flex items-center justify-center text-aiko-navy hover:bg-aiko-teal-bg hover:text-aiko-teal transition-all active:scale-95"
                          >
                            <ArrowLeft size={24} className={isRTL ? 'rotate-180' : ''} />
                          </button>
                          <h2 className="text-3xl font-black text-aiko-navy">{isRTL ? 'الإشعارات' : 'Notifications'}</h2>
                        </div>
                        <button 
                          onClick={markAllAsRead}
                          className="w-12 h-12 rounded-2xl bg-aiko-teal-bg text-aiko-teal flex items-center justify-center hover:bg-aiko-teal hover:text-white transition-all active:scale-95"
                          title={isRTL ? 'تحديد كتم قراءته' : 'Mark all as read'}
                        >
                          <CheckCircle2 size={24} />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-12">
                        {notifications.map((notif, idx) => (
                          <motion.div 
                            key={notif.id}
                            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => {
                              // Mark as read locally and perform action
                              setNotifications(notifications.map(n => n.id === notif.id ? { ...n, isRead: true } : n));

                              if (notif.type === 'new_message' && notif.data?.senderId) {
                                setShowNotification(false);
                                setActiveTab('chat');
                                handleOpenChat({ id: notif.data.senderId, name: 'User' }); // Minimal mock
                              } else if (notif.type === 'new_request' || notif.type === 'request_assigned' || notif.type === 'request_completed') {
                                setShowNotification(false);
                                setActiveTab('activity');
                              } else if (notif.type === 'new_review') {
                                setShowNotification(false);
                                setActiveTab('profile');
                              }
                            }}
                            className={`p-6 rounded-[2.5rem] bg-white shadow-sm border-2 transition-all relative group flex items-center gap-5 cursor-pointer ${!notif.isRead ? 'border-aiko-teal shadow-xl shadow-aiko-teal/5' : 'border-transparent hover:border-aiko-teal/20'}`}
                          >
                            {!notif.isRead && (
                              <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-2' : 'left-2'} w-2 h-2 bg-aiko-teal rounded-full shadow-lg shadow-aiko-teal/40 animate-pulse`} />
                            )}
                            
                            <div className={`flex-shrink-0 w-16 h-16 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                              notif.type === 'new_request' ? 'bg-orange-100 text-orange-500' :
                              notif.type === 'new_message' ? 'bg-blue-100 text-blue-600' :
                              notif.type === 'request_assigned' || notif.type === 'request_completed' ? 'bg-green-100 text-green-500' :
                              'bg-purple-100 text-purple-500'
                            }`}>
                              {notif.type === 'new_request' && <Zap size={28} fill="currentColor" />}
                              {notif.type === 'new_message' && <MessageCircle size={28} />}
                              {(notif.type === 'request_assigned' || notif.type === 'request_completed') && <CheckCircle2 size={28} />}
                              {notif.type === 'new_review' && <Star size={28} fill="currentColor" />}
                            </div>

                            <div className="flex-1 space-y-1.5 overflow-hidden">
                              <h4 className="text-lg font-black text-aiko-navy truncate leading-tight">
                                {notif.title}
                              </h4>
                              <p className="text-xs font-bold text-aiko-navy/40 leading-relaxed line-clamp-2">
                                {notif.body}
                              </p>
                              <div className="flex items-center gap-3 pt-1">
                                <span className="text-[10px] font-black text-aiko-orange uppercase tracking-widest bg-aiko-orange/10 px-2 py-0.5 rounded-full">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {!notif.isRead && (
                                  <span className="text-[10px] font-black text-aiko-teal uppercase tracking-widest bg-aiko-teal-bg px-2 py-0.5 rounded-full">
                                    {isRTL ? "جديد" : "NEW"}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <ChevronRight size={18} className={`${isRTL ? 'rotate-180' : ''} text-aiko-navy/10 group-hover:text-aiko-teal transition-colors`} />
                          </motion.div>
                        ))}

                        {notifications.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-24 h-24 bg-aiko-gray-100 rounded-full flex items-center justify-center text-aiko-navy/20">
                              <Bell size={48} />
                            </div>
                            <div>
                              <h4 className="text-xl font-black text-aiko-navy">{isRTL ? 'لا توجد إشعارات' : 'No Notifications'}</h4>
                              <p className="text-sm font-bold text-aiko-navy/30">{isRTL ? 'كل شيء هادئ هنا حالياً' : 'Everything is quiet here for now'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showContactModal && <ContactModal />}
            </AnimatePresence>

            <AnimatePresence>
                {toast && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed bottom-28 left-6 right-6 z-[300] flex justify-center pointer-events-none"
                  >
                    <div className="bg-aiko-navy text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-md">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-aiko-teal text-white' : 'bg-red-500 text-white'}`}>
                        {toast.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
                      </div>
                      <p className="text-sm font-black tracking-tight">{toast.message}</p>
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showLocationModal && <LocationModal />}
            </AnimatePresence>

            {/* Review Modal */}
            <AnimatePresence>
              {showReviewModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowReviewModal(false)}
                    className="absolute inset-0 bg-aiko-navy/60 backdrop-blur-md"
                  />
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl space-y-6"
                  >
                    <div className="flex flex-col items-center text-center space-y-2 mb-4">
                       <div className="w-16 h-16 bg-aiko-orange/10 text-aiko-orange rounded-2xl flex items-center justify-center mb-2">
                          <Star size={32} fill="currentColor" />
                       </div>
                       <h3 className="text-2xl font-black text-aiko-navy">{isRTL ? "تقييم الخدمة" : "Review Service"}</h3>
                       <p className="text-sm font-bold text-aiko-navy/30">{isRTL ? "أخبرنا عن تجربتك مع العامل" : "Tell us about your experience with the worker"}</p>
                    </div>

                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewData({ ...reviewData, rating: star })}
                          className={`transition-all ${reviewData.rating >= star ? 'text-aiko-orange scale-110' : 'text-aiko-gray-200'}`}
                        >
                          <Star size={32} fill={reviewData.rating >= star ? 'currentColor' : 'none'} strokeWidth={2} />
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-aiko-navy/40 px-4">{isRTL ? "التعليق" : "Comment"}</label>
                      <textarea
                        value={reviewData.comment}
                        onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                        className="w-full bg-aiko-gray-50 rounded-2xl p-4 text-sm font-bold text-aiko-navy focus:outline-none focus:ring-2 focus:ring-aiko-teal/20 min-h-[100px] resize-none border-2 border-transparent focus:border-aiko-teal/10 transition-all"
                        placeholder={isRTL ? "اكتب تعليقك هنا..." : "Write your comment here..."}
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => setShowReviewModal(false)}
                        className="flex-1 py-4 rounded-2xl bg-aiko-gray-100 text-aiko-navy font-black text-xs uppercase tracking-widest hover:bg-aiko-gray-200 transition-all"
                      >
                        {isRTL ? "تخطي" : "Skip"}
                      </button>
                      <button
                        onClick={submitReview}
                        className="flex-[2] py-4 rounded-2xl bg-aiko-teal text-white font-black text-xs uppercase tracking-widest hover:bg-aiko-teal-dark transition-all shadow-xl shadow-aiko-teal/20"
                      >
                        {isRTL ? "إرسال التقييم" : "Submit Review"}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Post Job Modal */}
            <AnimatePresence>
              {showPostJobModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowPostJobModal(false)}
                    className="absolute inset-0 bg-aiko-navy/60 backdrop-blur-md"
                  />
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-lg bg-white rounded-[40px] p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto no-scrollbar"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-black text-aiko-navy">
                        {isEditingService
                          ? (isRTL ? "تعديل طلب الخدمة" : "Edit Service Request")
                          : (isRTL ? "نشر طلب خدمة" : "Post Service Request")
                        }
                      </h2>
                      <button
                        onClick={() => {
                          setShowPostJobModal(false);
                          setIsEditingService(false);
                          setEditingServiceId(null);
                          setServiceData({ title: '', description: '', category: '', location: '', budget: '', wilaya: '' });
                        }}
                        className="p-2 bg-aiko-gray-100 rounded-xl text-aiko-navy/40 hover:text-aiko-navy transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <FormInput
                        label={isRTL ? "العنوان" : "Title"}
                        placeholder={isRTL ? "مثال: مطلوب سباك لإصلاح تسريب" : "e.g. Need a plumber for leak repair"}
                        value={serviceData.title}
                        onChange={(val: string) => setServiceData({...serviceData, title: val})}
                        icon={Briefcase}
                      />

                      <FormSelect
                        label={t.categories}
                        icon={Grid}
                        options={SERVICE_CATEGORIES.map(c => isRTL ? c.name_ar : c.name_en)}
                        value={SERVICE_CATEGORIES.find(c => c.id === serviceData.category)?.[isRTL ? 'name_ar' : 'name_en'] || ""}
                        onChange={(val: string) => {
                          const cat = SERVICE_CATEGORIES.find(c => (isRTL ? c.name_ar : c.name_en) === val);
                          setServiceData({...serviceData, category: cat?.id || ''});
                        }}
                      />

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-aiko-navy/30 mx-2">{isRTL ? "الوصف" : "Description"}</label>
                        <textarea
                          className="w-full bg-aiko-gray-100 p-4 rounded-2xl border-2 border-transparent focus:border-aiko-teal outline-none font-bold text-aiko-navy min-h-[100px] resize-none"
                          value={serviceData.description}
                          onChange={(e) => setServiceData({...serviceData, description: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormSelect
                          label={t.wilaya_label}
                          icon={MapPin}
                          options={ALGERIA_WILAYAS}
                          value={serviceData.wilaya}
                          onChange={(val: string) => setServiceData({...serviceData, wilaya: val})}
                        />
                        <FormInput
                          label={isRTL ? "الميزانية" : "Budget"}
                          value={serviceData.budget}
                          onChange={(val: string) => setServiceData({...serviceData, budget: val})}
                          icon={Sparkles}
                        />
                      </div>

                      <FormInput
                        label={isRTL ? "الموقع التفصيلي" : "Detailed Location"}
                        value={serviceData.location}
                        onChange={(val: string) => setServiceData({...serviceData, location: val})}
                        icon={MapPin}
                      />
                    </div>

                    <button
                      onClick={handleCreateService}
                      className="w-full py-5 rounded-[2rem] bg-aiko-teal text-white font-black text-sm uppercase tracking-widest hover:bg-aiko-teal-dark transition-all shadow-xl shadow-aiko-teal/20 mt-4"
                    >
                      {isEditingService
                        ? (isRTL ? "حفظ التعديلات" : "Save Changes")
                        : (isRTL ? "نشر الطلب" : "Post Request")
                      }
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Advanced Filters Drawer --- */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-aiko-navy/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-h-[92vh] bg-white rounded-t-[50px] z-[101] shadow-2xl flex flex-col p-8 pt-4 overflow-y-auto no-scrollbar scroll-smooth"
            >
              <div className="w-12 h-1.5 bg-aiko-gray-200 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-center gap-3 mb-10">
                <h2 className="text-3xl font-black text-aiko-navy" data-i18n="advanced_filter">{isRTL ? 'فلترة متقدمة' : 'Advanced Filter'}</h2>
                <div className="w-10 h-10 bg-aiko-teal-bg rounded-2xl flex items-center justify-center text-aiko-teal">
                  <Search size={22} />
                </div>
              </div>

              <div className="space-y-12 pb-12">
                {/* Timing */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-aiko-navy/30 flex items-center gap-3">
                    <Clock size={20} />
                    {isRTL ? 'التوقيت' : 'Timing'}
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'now', label: isRTL ? 'الآن' : 'Now', icon: Zap },
                      { id: 'today', label: isRTL ? 'اليوم' : 'Today', icon: Calendar },
                      { id: 'week', label: isRTL ? 'هذا الأسبوع' : 'This Week', icon: Calendar }
                    ].map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setFilters({...filters, time: item.id})}
                        className={`p-5 rounded-[2.5rem] border-3 flex flex-col items-center gap-3 transition-all duration-300 ${filters.time === item.id ? 'bg-aiko-teal-bg border-aiko-teal text-aiko-teal-dark shadow-xl shadow-aiko-teal/20 scale-105' : 'bg-white border-aiko-gray-100 text-aiko-navy/30 hover:border-aiko-teal/30'}`}
                      >
                        <item.icon size={24} strokeWidth={3} className={filters.time === item.id ? 'text-aiko-orange' : ''} />
                        <span className="text-base font-black">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Distance */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-aiko-navy/30 flex items-center gap-3">
                    <MapPin size={20} />
                    {isRTL ? 'المسافة' : 'Distance'}
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: '2km', label: isRTL ? '2 كم' : '2 كم', icon: MapPin },
                      { id: '5km', label: isRTL ? '5 كم' : '5 كم', icon: MapPin },
                      { id: '10km', label: isRTL ? '10 كم+' : '10 كم+', icon: Globe }
                    ].map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setFilters({...filters, distance: item.id})}
                        className={`p-5 rounded-[2.5rem] border-3 flex flex-col items-center gap-3 transition-all duration-300 ${filters.distance === item.id ? 'bg-aiko-teal-bg border-aiko-teal text-aiko-teal-dark shadow-xl shadow-aiko-teal/20 scale-105' : 'bg-white border-aiko-gray-100 text-aiko-navy/30 hover:border-aiko-teal/30'}`}
                      >
                        <item.icon size={24} strokeWidth={3} className={filters.distance === item.id ? 'text-aiko-orange' : ''} />
                        <span className="text-base font-black">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-aiko-navy/30 flex items-center gap-3">
                    <Briefcase size={20} />
                    {isRTL ? 'نوع التوظيف' : 'Hiring Type'}
                  </h4>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { id: 'urgent', label: isRTL ? 'عاجل' : 'Urgent', color: 'bg-red-500' },
                      { id: 'part', label: isRTL ? 'جزئي' : 'Part-time', color: 'bg-orange-400' },
                      { id: 'full', label: isRTL ? 'مؤقت' : 'Temporary', color: 'bg-aiko-teal' }
                    ].map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setFilters({...filters, type: item.id})}
                        className={`px-8 py-4 rounded-[1.5rem] flex items-center gap-3 transition-all font-black text-sm border-3 ${filters.type === item.id ? 'bg-aiko-teal-bg border-aiko-teal text-aiko-teal-dark shadow-lg shadow-aiko-teal/10' : 'bg-white border-aiko-gray-100 text-aiko-navy/30 hover:border-aiko-teal/30'}`}
                      >
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-aiko-navy/40 flex items-center gap-3">
                    <Settings2 size={20} />
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {SERVICE_CATEGORIES.map(cat => (
                      <button 
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`p-4 rounded-3xl border-3 flex items-center gap-3 transition-all ${category === cat.id ? 'bg-aiko-teal-bg border-aiko-teal text-aiko-teal-dark shadow-lg' : 'bg-white border-aiko-gray-100 text-aiko-navy/30 hover:border-aiko-teal/20'}`}
                      >
                        <cat.icon size={18} className={category === cat.id ? 'text-aiko-orange' : ''} />
                        <span className="text-[10px] font-black">{isRTL ? cat.name_ar : cat.name_en}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-aiko-navy/30 flex items-center gap-3">
                    <ImageIcon size={20} />
                    {isRTL ? 'نطاق السعر (DA)' : 'Price Range (DA)'}
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-aiko-navy/30 text-center uppercase tracking-widest">{isRTL ? 'من' : 'From'}</p>
                      <input 
                        type="number" 
                        placeholder="500"
                        value={filters.minPrice}
                        onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                        className="w-full bg-aiko-gray-100 p-6 rounded-[1.5rem] border-3 border-transparent focus:border-aiko-teal bg-white transition-all outline-none font-black text-center text-xl"
                      />
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-aiko-navy/30 text-center uppercase tracking-widest">{isRTL ? 'إلى' : 'To'}</p>
                      <input 
                        type="number" 
                        placeholder="5000"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                        className="w-full bg-aiko-gray-100 p-6 rounded-[1.5rem] border-3 border-transparent focus:border-aiko-teal bg-white transition-all outline-none font-black text-center text-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-aiko-navy/30 flex items-center gap-3">
                    <Star size={20} />
                    {isRTL ? 'التقييم الأدنى' : 'Min Rating'}
                  </h4>
                  <div className="grid grid-cols-4 gap-3">
                    {['3+', '4+', '4.5+', '5*'].map(val => (
                      <button 
                        key={val}
                        onClick={() => setFilters({...filters, rating: val})}
                        className={`p-5 rounded-[1.5rem] border-3 font-black text-base transition-all ${filters.rating === val ? 'bg-aiko-teal-bg border-aiko-teal text-aiko-teal-dark shadow-lg shadow-aiko-teal/10' : 'bg-white border-aiko-gray-100 text-aiko-navy/30 hover:border-aiko-teal/30'}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setShowFilters(false)}
                  className="bg-aiko-teal text-white w-full py-6 rounded-[2.5rem] font-black text-lg shadow-2xl shadow-aiko-teal/30 mt-8 active:scale-95 transition-all"
                  data-i18n="apply_filter"
                >
                  {isRTL ? 'تطبيق الفلتر' : 'Apply Filter'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Availability Settings Modal --- */}
      <AnimatePresence>
        {showAvailabilityModal && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAvailabilityModal(false)}
              className="absolute inset-0 bg-aiko-navy/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-[50px] shadow-2xl flex flex-col p-8 pb-12 overflow-y-auto no-scrollbar max-h-[92vh]"
            >
              <div className="w-12 h-1.5 bg-aiko-gray-200 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-center gap-3 mb-10">
                <h2 className="text-3xl font-black text-aiko-navy">{isRTL ? 'تحديد وقت التوفر' : 'Define Availability'}</h2>
                <div className="w-10 h-10 bg-aiko-orange/10 rounded-2xl flex items-center justify-center text-aiko-orange">
                  <Calendar size={22} />
                </div>
              </div>

              <div className="space-y-10">
                {/* Work Type Selection */}
                <div className="space-y-5">
                  <h4 className="text-xs font-black uppercase text-aiko-navy/40 text-center tracking-widest font-mono">
                    {isRTL ? 'نوع الدوام' : 'Work Type'}
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'now', label: isRTL ? (userRole === 'worker' ? 'متاح الآن' : 'استقبال الآن') : (userRole === 'worker' ? 'Available Now' : 'Active Now'), icon: Zap },
                      { id: 'part', label: isRTL ? 'دوام جزئي' : 'Part-time', icon: Sparkles },
                      { id: 'full', label: isRTL ? 'دوام كامل' : 'Full-time', icon: Briefcase }
                    ].map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setWorkerSettings({...workerSettings, type: item.id})}
                        className={`p-6 rounded-[2rem] border-3 flex flex-col items-center gap-2 transition-all ${workerSettings.type === item.id ? 'bg-aiko-teal-bg border-aiko-teal text-aiko-teal-dark shadow-xl scale-105' : 'bg-white border-aiko-gray-100 text-aiko-navy/30 hover:border-aiko-teal/20'}`}
                      >
                        <item.icon size={24} className={workerSettings.type === item.id ? 'text-aiko-orange' : ''} />
                        <span className="text-[10px] font-black leading-none">{item.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="bg-aiko-teal/5 p-4 rounded-2xl flex items-center justify-center gap-3 text-aiko-teal-dark font-bold text-xs">
                    <Zap size={14} fill="currentColor" />
                    <span>{isRTL ? "سيتم تحديث حالتك فوراً في المنصة" : "Status will be updated instantly"}</span>
                  </div>
                </div>

                {/* Hourly Rate / Budget */}
                <div className="space-y-5">
                  <h4 className="text-xs font-black uppercase text-aiko-navy/40 text-center tracking-widest font-mono">
                    {userRole === 'worker' ? (isRTL ? 'سعرك المعلن (DA / ساعة)' : 'Hourly Rate (DA / Hour)') : (isRTL ? 'ميزانية الساعة (DA / ساعة)' : 'Budget (DA / Hour)')}
                  </h4>
                  <input 
                    type="number" 
                    value={workerSettings.price}
                    onChange={(e) => setWorkerSettings({...workerSettings, price: e.target.value})}
                    placeholder="1500"
                    className="w-full bg-aiko-gray-100 p-6 rounded-[1.5rem] border-3 border-transparent focus:border-aiko-teal bg-white transition-all outline-none font-black text-center text-2xl"
                  />
                </div>

                {/* Instant Requests Toggle */}
                <div className="flex items-center justify-between bg-aiko-gray-50 p-6 rounded-[2rem] border border-aiko-gray-100">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-aiko-navy flex items-center gap-2">
                       {isRTL ? 'طلبات مؤقتة (5 دقائق للرد)' : 'Instant Requests (5min limit)'}
                       <Clock size={20} />
                    </h4>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <p className="text-[10px] font-bold text-aiko-navy/40">
                        {workerSettings.instantRequests ? (isRTL ? "مفعل: الرد السريع مطلوب" : "Enabled: Quick response required") : (isRTL ? "معطل" : "Disabled")}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setWorkerSettings({...workerSettings, instantRequests: !workerSettings.instantRequests})}
                    className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${workerSettings.instantRequests ? 'bg-aiko-teal' : 'bg-aiko-gray-300'}`}
                  >
                    <motion.div 
                      animate={{ x: workerSettings.instantRequests ? 24 : 4 }}
                      className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>

                {/* Categories & Skills Selection */}
                <div className="space-y-8">
                  <div className="space-y-5">
                    <h4 className="text-xs font-black uppercase text-aiko-navy/40 text-center tracking-widest font-mono">
                      {isRTL ? 'التخصص الرئيسي' : 'Main Specialization'}
                    </h4>
                    <div className="flex overflow-x-auto no-scrollbar gap-4 pb-4 px-2">
                       {SERVICE_CATEGORIES.map(category => (
                         <button 
                           key={category.id}
                           onClick={() => setWorkerSettings({...workerSettings, selectedCategory: category.id, skills: []})}
                           className={`flex-shrink-0 p-5 rounded-[2rem] border-3 flex flex-col items-center gap-2 transition-all min-w-[120px] ${workerSettings.selectedCategory === category.id ? 'bg-aiko-teal-bg border-aiko-teal text-aiko-teal-dark shadow-xl scale-105' : 'bg-white border-aiko-gray-100 text-aiko-navy/30 hover:border-aiko-teal/20'}`}
                         >
                           <category.icon size={22} className={workerSettings.selectedCategory === category.id ? 'text-aiko-orange' : ''} />
                           <span className="text-[10px] font-black leading-tight text-center">
                             {isRTL ? category.name_ar : category.name_en}
                           </span>
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <h4 className="text-xs font-black uppercase text-aiko-navy/40 text-center tracking-widest font-mono">
                      {isRTL ? 'المهارات الفرعية' : 'Sub-Skills'}
                    </h4>
                    <div className="flex flex-wrap justify-center gap-3">
                      {SERVICE_CATEGORIES.find(c => c.id === workerSettings.selectedCategory)?.subcategories.map(skill => (
                        <button 
                          key={skill.id}
                          onClick={() => {
                            const newSkills = workerSettings.skills.includes(skill.id) 
                              ? workerSettings.skills.filter(s => s !== skill.id) 
                              : [...workerSettings.skills, skill.id];
                            setWorkerSettings({...workerSettings, skills: newSkills});
                          }}
                          className={`px-6 py-3 rounded-full border-2 font-black text-xs transition-all ${workerSettings.skills.includes(skill.id) ? 'bg-aiko-teal-bg border-aiko-teal text-aiko-teal-dark scale-105' : 'bg-white border-aiko-gray-100 text-aiko-navy/40 hover:border-aiko-teal/20'}`}
                        >
                          {isRTL ? skill.name_ar : skill.name_en}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-6">
                  <button 
                    onClick={() => {
                      setIsAvailable(true);
                      setShowAvailabilityModal(false);
                    }}
                    className="bg-aiko-teal text-white w-full py-6 rounded-[2.5rem] font-black text-lg shadow-2xl shadow-aiko-teal/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                     <CheckCircle2 size={24} />
                     {isRTL ? 'نشر التوفر' : 'Publish Availability'}
                  </button>
                  <button 
                    onClick={() => setShowAvailabilityModal(false)}
                    className="w-full py-4 text-sm font-black text-aiko-navy/30 uppercase tracking-widest hover:text-aiko-navy transition-colors"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Worker Availability Form Modal --- */}
      <AnimatePresence>
        {showWorkerAvailabilityForm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWorkerAvailabilityForm(false)}
              className="absolute inset-0 bg-aiko-navy/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-aiko-navy">{isRTL ? "إعلان التوفر" : "Work Availability"}</h2>
                <button onClick={() => setShowWorkerAvailabilityForm(false)} className="p-2 bg-aiko-gray-100 rounded-xl text-aiko-navy/40 hover:text-aiko-navy transition-all"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                <FormInput
                  label={isRTL ? "العنوان" : "Title"}
                  placeholder={isRTL ? "مثال: كهربائي محترف بخبرة 5 سنوات" : "e.g. Professional Electrician with 5 years experience"}
                  value={workerAvailability?.title || ""}
                  onChange={(val: string) => setWorkerAvailability({...workerAvailability, title: val})}
                  icon={Briefcase}
                />

                <FormSelect
                  label={t.categories}
                  icon={Grid}
                  options={SERVICE_CATEGORIES.map(c => isRTL ? c.name_ar : c.name_en)}
                  value={workerAvailability?.category || ""}
                  onChange={(val: string) => {
                    const cat = SERVICE_CATEGORIES.find(c => (isRTL ? c.name_ar : c.name_en) === val);
                    setWorkerAvailability({...workerAvailability, category: cat?.id, subcategories: []});
                  }}
                />

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-aiko-navy/30 mx-2">{isRTL ? "الوصف التفصيلي" : "Description"}</label>
                  <textarea
                    className="w-full bg-aiko-gray-100 p-4 rounded-2xl border-2 border-transparent focus:border-aiko-teal outline-none font-bold text-aiko-navy min-h-[100px] resize-none"
                    value={workerAvailability?.description || ""}
                    onChange={(e) => setWorkerAvailability({...workerAvailability, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label={isRTL ? "السعر بالساعة (دج)" : "Hourly Rate (DA)"}
                    type="number"
                    value={workerAvailability?.hourlyRate || ""}
                    onChange={(val: string) => setWorkerAvailability({...workerAvailability, hourlyRate: val})}
                    icon={Clock}
                  />
                  <FormInput
                    label={isRTL ? "السعر باليوم (دج)" : "Daily Rate (DA)"}
                    type="number"
                    value={workerAvailability?.dailyRate || ""}
                    onChange={(val: string) => setWorkerAvailability({...workerAvailability, dailyRate: val})}
                    icon={Sun}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-widest text-aiko-navy/30 mx-2">
                      {isRTL ? "الولايات المتاحة" : "Available Wilayas"}
                    </label>
                    <span className="text-[10px] font-black text-aiko-teal uppercase tracking-widest">
                      {isRTL ? `تم اختيار ${workerAvailability?.wilayas?.length || 0} ولاية` : `${workerAvailability?.wilayas?.length || 0} wilayas selected`}
                    </span>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setWorkerAvailability({...workerAvailability, wilayas: ALGERIA_WILAYAS.map(w => w.split(' - ')[1])})}
                      className="px-4 py-2 rounded-xl bg-aiko-teal-bg text-aiko-teal font-black text-[10px] uppercase tracking-widest hover:bg-aiko-teal hover:text-white transition-all"
                    >
                      {isRTL ? "اختيار الكل" : "Select All"}
                    </button>
                    <button
                      onClick={() => setWorkerAvailability({...workerAvailability, wilayas: []})}
                      className="px-4 py-2 rounded-xl bg-aiko-gray-100 text-aiko-navy/40 font-black text-[10px] uppercase tracking-widest hover:bg-aiko-navy hover:text-white transition-all"
                    >
                      {isRTL ? "إلغاء الكل" : "Deselect All"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ALGERIA_WILAYAS.map(w => {
                      const name = w.split(' - ')[1];
                      const isChecked = workerAvailability?.wilayas?.includes(name);
                      return (
                        <label key={w} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${isChecked ? 'bg-aiko-teal-bg border-aiko-teal text-aiko-teal-dark' : 'bg-white border-aiko-gray-100 text-aiko-navy/40 hover:border-aiko-teal/20'}`}>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isChecked || false}
                            onChange={() => {
                              const currentWilayas = workerAvailability?.wilayas || [];
                              const newWilayas = isChecked
                                ? currentWilayas.filter((item: string) => item !== name)
                                : [...currentWilayas, name];
                              setWorkerAvailability({...workerAvailability, wilayas: newWilayas});
                            }}
                          />
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${isChecked ? 'bg-aiko-teal border-aiko-teal text-white' : 'border-aiko-gray-200'}`}>
                            {isChecked && <CheckCircle2 size={10} strokeWidth={4} />}
                          </div>
                          <span className="text-xs font-bold truncate">{name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/availability", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${authService.getToken()}`
                        },
                        body: JSON.stringify(workerAvailability)
                      });
                      if (response.ok) {
                        showToast(isRTL ? "تم نشر الإعلان بنجاح" : "Advertisement published successfully");
                        setShowWorkerAvailabilityForm(false);
                      }
                    } catch (err) {
                      console.error("Error publishing availability:", err);
                    }
                  }}
                  className="w-full py-5 rounded-[2rem] bg-aiko-teal text-white font-black text-sm uppercase tracking-widest hover:bg-aiko-teal-dark transition-all shadow-xl shadow-aiko-teal/20 mt-4"
                >
                  {isRTL ? "نشر الإعلان" : "Publish Advertisement"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Auxiliary Components ---

function RoleChoice({ icon: Icon, title, sub, description, active, onClick, i18nTitleKey, i18nSubKey, i18nDescKey }: any) {
  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col p-8 rounded-[40px] text-left transition-all duration-700 border-4 overflow-hidden group ${active ? 'bg-white border-aiko-teal shadow-huge scale-102 mt-[-4px]' : 'bg-white/50 grayscale opacity-60 border-transparent shadow-sm hover:grayscale-0 hover:opacity-100 hover:scale-[1.01]'}`}
    >
      {active && (
        <motion.div 
          layoutId="role-bg"
          className="absolute inset-0 bg-linear-to-br from-aiko-teal/5 to-transparent pointer-events-none"
        />
      )}
      
      <div className="flex items-center gap-6 mb-6">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center flex-shrink-0 transition-all duration-700 transform ${active ? 'bg-aiko-teal text-white rotate-12 shadow-xl' : 'bg-aiko-gray-100 text-aiko-navy/20 group-hover:bg-aiko-teal-bg group-hover:text-aiko-teal'}`}>
          <Icon size={40} strokeWidth={1} />
        </div>
        <div className="flex-1">
          <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 transition-colors ${active ? 'text-aiko-teal' : 'text-aiko-navy/20'}`} data-i18n={i18nSubKey}>{sub}</p>
          <h3 className="text-2xl font-black text-aiko-navy" data-i18n={i18nTitleKey}>{title}</h3>
        </div>
      </div>
      
      <p className="text-sm font-medium text-aiko-navy/40 leading-relaxed mb-6 flex-1" data-i18n={i18nDescKey}>{description}</p>
      
      <div className={`flex items-center gap-3 transition-all duration-500 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <span className="text-[10px] font-black text-aiko-teal uppercase tracking-widest">{active ? "PROTOCOL ACTIVE" : "INITIALIZE"}</span>
        <div className="h-[2px] flex-1 bg-aiko-teal/10 relative overflow-hidden">
          <motion.div 
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-aiko-teal w-1/3"
          />
        </div>
        <CheckCircle2 size={16} className="text-aiko-teal" />
      </div>

      {/* Decorative patterns */}
      <div className="absolute -bottom-6 -right-6 text-aiko-teal/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
        <Icon size={120} />
      </div>
    </button>
  );
}

function SectionTitle({ title, action = translations['en'].available_now, onClick, i18nTitleKey, i18nActionKey }: any) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-black text-aiko-navy" data-i18n={i18nTitleKey}>{title}</h3>
      <button 
        onClick={onClick}
        className="text-xs font-black text-aiko-teal tracking-widest uppercase hover:text-aiko-orange transition-colors"
        data-i18n={i18nActionKey}
      >
        {action === translations['en'].available_now ? "Explore" : action}
      </button>
    </div>
  );
}
