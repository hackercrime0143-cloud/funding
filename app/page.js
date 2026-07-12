'use client';

import jsQR from 'jsqr';
import { useState, useEffect, useRef } from 'react';
import {
  Home as HomeIcon,
  TrendingUp,
  Users,
  CreditCard,
  User as UserIcon,
  Copy,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  CheckSquare,
  Wallet,
  ArrowLeft
} from 'lucide-react';

function isVersionOutdated(clientVersion, serverVersion) {
  if (!clientVersion || !serverVersion) return false;
  const clientParts = clientVersion.split('.').map(p => parseInt(p.replace(/[^0-9]/g, ''), 10) || 0);
  const serverParts = serverVersion.split('.').map(p => parseInt(p.replace(/[^0-9]/g, ''), 10) || 0);
  const maxLen = Math.max(clientParts.length, serverParts.length);
  while (clientParts.length < maxLen) clientParts.push(0);
  while (serverParts.length < maxLen) serverParts.push(0);
  for (let i = 0; i < maxLen; i++) {
    if (serverParts[i] > clientParts[i]) return true;
    if (clientParts[i] > serverParts[i]) return false;
  }
  return false;
}

function getCleanApkUrl(urlStr) {
  if (!urlStr) return '';
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const u = new URL(urlStr, base);
    u.search = '';
    return typeof window !== 'undefined' ? window.location.origin + u.pathname : u.pathname;
  } catch (e) {
    return urlStr;
  }
}

export default function FastPayApp() {
  // App views: 'loading', 'auth', 'app'
  const [appState, setAppState] = useState('loading');
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'orders', 'team', 'account', 'me'
  const [isOffline, setIsOffline] = useState(false);

  // Auth state
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');

  // Auth Form States
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [sentOtpCode, setSentOtpCode] = useState(''); // Shown in UI for demonstration
  const [otpLoading, setOtpLoading] = useState(false);

  // Device check & Captcha states
  const [isDeviceBlocked, setIsDeviceBlocked] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');

  // Schemes & Orders Data
  const [schemes, setSchemes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeOrderDetails, setActiveOrderDetails] = useState(null);
  const [currentDraftOrderId, setCurrentDraftOrderId] = useState(null);
  const [ledgerFilter, setLedgerFilter] = useState('all');
  const [tasksProgress, setTasksProgress] = useState(null);
  const [activeBannerSlide, setActiveBannerSlide] = useState(0);
  const [paymentStep, setPaymentStep] = useState(1); // 1 = details, 2 = QR payment
  const [paymentUtr, setPaymentUtr] = useState('');
  const [paymentTimer, setPaymentTimer] = useState(900); // 15 minutes countdown
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [schemeSearchQuery, setSchemeSearchQuery] = useState('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [showLevelAMembers, setShowLevelAMembers] = useState(false);
  const [showLevelBMembers, setShowLevelBMembers] = useState(false);
  const [showTelegramGate, setShowTelegramGate] = useState(false);

  // Admin Expanded Sub-Pages states
  const [adminView, setAdminView] = useState('dashboard'); // 'dashboard', 'combined-balance', 'active-investments', 'user-profile'
  const [selectedAdminUserId, setSelectedAdminUserId] = useState(null);
  const [adminUserProfileData, setAdminUserProfileData] = useState(null);
  const [adminUserProfileLoading, setAdminUserProfileLoading] = useState(false);
  const [apkDownloadUrl, setApkDownloadUrl] = useState('');
  const [newApkDownloadUrl, setNewApkDownloadUrl] = useState('');
  const [apkUploadLoading, setApkUploadLoading] = useState(false);
  const [showDownloadHelp, setShowDownloadHelp] = useState(false);

  // Admin Referral Tasks States
  const [adminReferralTasksData, setAdminReferralTasksData] = useState([]);
  const [adminReferralTasksSearch, setAdminReferralTasksSearch] = useState('');
  const [adminReferralTasksPage, setAdminReferralTasksPage] = useState(1);
  const [adminReferralTasksTotalPages, setAdminReferralTasksTotalPages] = useState(1);
  const [adminReferralTasksLoading, setAdminReferralTasksLoading] = useState(false);

  // Admin Spin Management States
  const [adminSpinConfig, setAdminSpinConfig] = useState(null);
  const [adminSpinStats, setAdminSpinStats] = useState(null);
  const [adminSpinLoading, setAdminSpinLoading] = useState(false);

  // Admin Lottery States
  const [adminLotteryConfig, setAdminLotteryConfig] = useState(null);
  const [adminLotteryStats, setAdminLotteryStats] = useState(null);
  const [adminLotteryTickets, setAdminLotteryTickets] = useState([]);
  const [adminLotteryWinners, setAdminLotteryWinners] = useState([]);
  const [adminLotteryDraws, setAdminLotteryDraws] = useState([]);
  const [adminLotteryLoading, setAdminLotteryLoading] = useState(false);
  const [adminLotterySearch, setAdminLotterySearch] = useState('');
  const [adminLotteryStatusFilter, setAdminLotteryStatusFilter] = useState('');
  const [adminLotteryWeekFilter, setAdminLotteryWeekFilter] = useState('');
  const [adminSelectedWeekDetails, setAdminSelectedWeekDetails] = useState(null);

  // Activity & Spin States
  const [activityView, setActivityView] = useState(null); // null or 'spin'
  const [spinLoading, setSpinLoading] = useState(false);
  const [spinData, setSpinData] = useState({ freeSpins: 0, spinsPlayedToday: 0, dailyLimit: 10, spinPrice: 50, history: [] });
  const [showLotteryModal, setShowLotteryModal] = useState(false);
  const [spinResultModal, setSpinResultModal] = useState(null); // null or { prize, type, value }
  const [spinWheelIsSpinning, setSpinWheelIsSpinning] = useState(false);
  const [spinTargetIndex, setSpinTargetIndex] = useState(null);

  // Lottery States
  const [lotteryData, setLotteryData] = useState({ config: { ticketPrice: 100, multiplier: 2, salesEnabled: true }, isSunday: false, winningCode: null, tickets: [] });
  const [lotteryLoading, setLotteryLoading] = useState(false);
  const [buyLotteryLoading, setBuyLotteryLoading] = useState(false);

  // Search, sort, filter, and pagination states
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [userSort, setUserSort] = useState('date-desc');
  const [userPage, setUserPage] = useState(1);

  const [cbSearch, setCbSearch] = useState('');
  const [cbFilter, setCbFilter] = useState('all');
  const [cbSort, setCbSort] = useState('balance-desc');
  const [cbPage, setCbPage] = useState(1);

  const [aiSearch, setAiSearch] = useState('');
  const [aiFilter, setAiFilter] = useState('all');
  const [aiSort, setAiSort] = useState('amount-desc');
  const [aiPage, setAiPage] = useState(1);

  // Admin Panel States
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminTransactions, setAdminTransactions] = useState([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState([]);
  const [adminWithdrawalsTotalPages, setAdminWithdrawalsTotalPages] = useState(1);
  const [adminWithdrawalsTotalCount, setAdminWithdrawalsTotalCount] = useState(0);
  const [adminWithdrawalsStats, setAdminWithdrawalsStats] = useState({ totalPendingCount: 0, totalApprovedCount: 0, totalRejectedCount: 0, totalPaidAmount: 0, totalUsersWithdrawn: 0 });
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminSchemes, setAdminSchemes] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminActiveSubTab, setAdminActiveSubTab] = useState('overview'); // 'overview', 'users', 'transactions', 'schemes'
  const [adminTxFilter, setAdminTxFilter] = useState('pending'); // 'pending', 'withdrawals', 'deposits', 'cancelled'
  const [adminOrderFilter, setAdminOrderFilter] = useState('pending'); // 'pending', 'active', 'cancelled'
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminExpandedUser, setAdminExpandedUser] = useState(null);
  const [adminUserSubView, setAdminUserSubView] = useState(null); // 'deposits', 'withdrawals', 'orders', 'commissions', null
  const [adminExpandedOrderId, setAdminExpandedOrderId] = useState(null);

  // Pagination and stats states
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);

  const [adminTotalUsersCount, setAdminTotalUsersCount] = useState(0);
  const [adminTotalTransactionsCount, setAdminTotalTransactionsCount] = useState(0);
  const [adminTotalOrdersCount, setAdminTotalOrdersCount] = useState(0);

  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalUserBalances: 0,
    totalDeposits: 0,
    pendingDepositsCount: 0,
    pendingDepositsTotal: 0,
    totalWithdrawals: 0,
    pendingWithdrawalsCount: 0,
    pendingWithdrawalsTotal: 0,
    activeInvestments: 0
  });

  // PWA & Timer States
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [isPwaSupported, setIsPwaSupported] = useState(true);
  const [currentDraftOrderCreatedAt, setCurrentDraftOrderCreatedAt] = useState(null);

  // Dynamic PWA settings states
  const [pwaName, setPwaName] = useState('FastPay');
  const [pwaShortName, setPwaShortName] = useState('FastPay');
  const [pwaThemeColor, setPwaThemeColor] = useState('#000000');
  const [pwaBackgroundColor, setPwaBackgroundColor] = useState('#000000');
  const [pwaIcon, setPwaIcon] = useState('/icon-192.png');
  const [pwaSplashScreen, setPwaSplashScreen] = useState('/icon-512.png');
  const [pwaInstallPromptText, setPwaInstallPromptText] = useState('Install FastPay to your device home screen for a native, fast, and full-screen mobile app experience.');
  const [pwaVersion, setPwaVersion] = useState('1.0.0');

  // Admin PWA configuration states
  const [adminPwaName, setAdminPwaName] = useState('FastPay');
  const [adminPwaShortName, setAdminPwaShortName] = useState('FastPay');
  const [adminPwaThemeColor, setAdminPwaThemeColor] = useState('#000000');
  const [adminPwaBackgroundColor, setAdminPwaBackgroundColor] = useState('#000000');
  const [adminPwaIcon, setAdminPwaIcon] = useState('/icon-192.png');
  const [adminPwaSplashScreen, setAdminPwaSplashScreen] = useState('/icon-512.png');
  const [adminPwaInstallPromptText, setAdminPwaInstallPromptText] = useState('Install FastPay to your device home screen for a native, fast, and full-screen mobile app experience.');
  const [adminPwaVersion, setAdminPwaVersion] = useState('1.0.0');

  // Admin Action Notifications States
  const [adminNotifications, setAdminNotifications] = useState([]);

  // Profit Details View Page States
  const [showProfitDetailsPage, setShowProfitDetailsPage] = useState(false);
  const [showMeProfitDetailsPage, setShowMeProfitDetailsPage] = useState(false);
  const [showPrincipalDetailsPage, setShowPrincipalDetailsPage] = useState(false);

  // Wallet Tab: Active Scheme Detail Modal
  const [selectedWalletScheme, setSelectedWalletScheme] = useState(null);

  // 24-Hour Scheme Cooldowns: { [schemeId]: ISO timestamp of cooldown expiry }
  const [schemeCooldowns, setSchemeCooldowns] = useState({});

  // Force Update
  const [showForceUpdate, setShowForceUpdate] = useState(false);
  const [serverAppVersion, setServerAppVersion] = useState('');
  const [pwaUpdateNotes, setPwaUpdateNotes] = useState('');
  const [adminPwaUpdateNotes, setAdminPwaUpdateNotes] = useState('');

  // Track image load errors to show "No Screenshot Uploaded" instead of broken images
  const [brokenImages, setBrokenImages] = useState({});

  // Real-time ticking state updated every second
  const [nowTime, setNowTime] = useState(Date.now());

  // Deposit & Withdrawal Details Page/Modal States
  const [showDepositDetailsPage, setShowDepositDetailsPage] = useState(false);
  const [showWithdrawalDetailsPage, setShowWithdrawalDetailsPage] = useState(false);
  const [userDepositPage, setUserDepositPage] = useState(1);
  const [userWithdrawalPage, setUserWithdrawalPage] = useState(1);


  const [adminVirtualAccounts, setAdminVirtualAccounts] = useState([]);
  const [newPaBankName, setNewPaBankName] = useState('Axis Bank');
  const [newPaBeneficiaryName, setNewPaBeneficiaryName] = useState('');
  const [newPaAccountNumber, setNewPaAccountNumber] = useState('');
  const [newPaIfsc, setNewPaIfsc] = useState('');
  const [newPaUpiId, setNewPaUpiId] = useState('');
  const [newPaQrCode, setNewPaQrCode] = useState(null);
  const [newPaQrCodeData, setNewPaQrCodeData] = useState('');
  const [newPaAllowConcurrent, setNewPaAllowConcurrent] = useState(false);

  // Admin Withdrawal Section States
  const [withdrawalFilter, setWithdrawalFilter] = useState('all');
  const [withdrawalDateRange, setWithdrawalDateRange] = useState('all');
  const [withdrawalSearchQuery, setWithdrawalSearchQuery] = useState('');
  const [withdrawalSort, setWithdrawalSort] = useState('date-desc');
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [withdrawalStartDate, setWithdrawalStartDate] = useState('');
  const [withdrawalEndDate, setWithdrawalEndDate] = useState('');

  // Admin New Scheme Form
  const [newSchemeName, setNewSchemeName] = useState('');
  const [newSchemePrice, setNewSchemePrice] = useState('');
  const [newSchemeRate, setNewSchemeRate] = useState('');
  const [newSchemeDays, setNewSchemeDays] = useState('');
  const [newSchemeTotalReturn, setNewSchemeTotalReturn] = useState('');
  const [editSchemeId, setEditSchemeId] = useState(null);

  // Deposit & Withdrawal States
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [virtualAccountTimer, setVirtualAccountTimer] = useState(0);
  const [txMessage, setTxMessage] = useState({ type: '', text: '' });
  const [txHistory, setTxHistory] = useState([]);

  // Scan QR to Pay States
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const scanVideoRef = useRef(null);
  const scanStreamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const completedTxs = txHistory.filter(t => t.status === 'completed');

  const investmentProfit = completedTxs
    .filter(t => t.type === 'scheme_payout')
    .reduce((sum, t) => sum + t.amount, 0);

  const referralProfit = completedTxs
    .filter(t => t.type === 'referral_bonus_invited')
    .reduce((sum, t) => sum + t.amount, 0);

  const commissionProfit = completedTxs
    .filter(t => ['referral_commission_l1', 'referral_commission_l2'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const bonusProfit = completedTxs
    .filter(t => ['task_reward', 'referral_bonus_signup'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const otherProfit = completedTxs
    .filter(t => t.amount > 0 && !['deposit', 'principal_return', 'scheme_payout', 'referral_bonus_invited', 'referral_commission_l1', 'referral_commission_l2', 'task_reward', 'referral_bonus_signup'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalProfit = user?.totalProfit !== undefined ? user.totalProfit : (investmentProfit + referralProfit + commissionProfit + bonusProfit + otherProfit);

  const isValidScreenshot = (url) => {
    if (!url) return false;
    const cleanUrl = String(url).trim().toLowerCase();
    if (cleanUrl === 'wallet_purchase' || cleanUrl === 'wallet' || cleanUrl === 'none' || cleanUrl === 'null' || cleanUrl === 'undefined') return false;
    return url.startsWith('/') || url.startsWith('data:image') || url.startsWith('http');
  };

  const getScreenshotUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('/uploads/')) {
      return url.replace('/uploads/', '/api/uploads/');
    }
    return url;
  };

  const [activeOrderBankDetails, setActiveOrderBankDetails] = useState(null);
  const [depositUtr, setDepositUtr] = useState('');
  const [depositScreenshot, setDepositScreenshot] = useState(null);
  const [currentDepositTxId, setCurrentDepositTxId] = useState(null);
  const [adminExpandedTxId, setAdminExpandedTxId] = useState(null);
  const [isBankDetailsEditing, setIsBankDetailsEditing] = useState(false);
  const [adminSelectedOrder, setAdminSelectedOrder] = useState(null);
  const [orderRejectionReason, setOrderRejectionReason] = useState('');

  // Account settings state
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankLinkMessage, setBankLinkMessage] = useState({ type: '', text: '' });

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState({ type: '', text: '' });

  // Team states
  const [teamData, setTeamData] = useState({ stats: { levelACount: 0, levelBCount: 0, totalTeam: 0, totalCommissions: 0 }, levelA: [], levelB: [], referralCode: '', referralTasks: { completedCount: 0, claimedMilestones: [] } });

  // Timers references
  const otpIntervalRef = useRef(null);
  const vaIntervalRef = useRef(null);

  const generateCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  // 1. Initial Authentication Check & Device Verification
  useEffect(() => {
    fetchSession();
    generateCaptcha();

    let handleBeforeInstallPrompt;
    let timer;

    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || navigator.vendor || window.opera;
      const isAndroid = /android/i.test(ua);
      const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
      const isMobileWidth = window.innerWidth <= 768;
      const isNative = window.Capacitor && window.Capacitor.isNativePlatform();

      const isAdminUrl = window.location.search.includes('admin=true') || window.location.pathname.includes('/admin');
      const isDesktopDevice = !isMobileWidth && !isAndroid && !isIos && !isNative;

      if (isDesktopDevice && !isAdminUrl) {
        setIsDeviceBlocked(true);
      }

      // Check if already running as standalone PWA
      const checkInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      setIsPwaInstalled(!!checkInstalled);

      handleBeforeInstallPrompt = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsPwaSupported(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      timer = setTimeout(() => {
        if (!checkInstalled && !isIos && !('BeforeInstallPromptEvent' in window)) {
          setIsPwaSupported(false);
        }
      }, 3000);

      // Register PWA service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('Service Worker registered:', reg.scope))
          .catch((err) => console.error('Service Worker registration failed:', err));
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        if (handleBeforeInstallPrompt) {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        }
        if (timer) {
          clearTimeout(timer);
        }
      }
    };
  }, []);

  // 1a. Security Check: Restrict Desktop access for normal users, allow admin role bypass
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const ua = navigator.userAgent || navigator.vendor || window.opera;
      const isAndroid = /android/i.test(ua);
      const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
      const isMobileWidth = window.innerWidth <= 768;
      const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
      const isDesktopDevice = !isMobileWidth && !isAndroid && !isIos && !isNative;

      if (isDesktopDevice && user.role !== 'admin') {
        setIsDeviceBlocked(true);
      }
    }
  }, [user]);

  // 1b. Native platform integration, Push notifications, network & external link handlers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isNative = window.Capacitor && window.Capacitor.isNativePlatform();

      if (isNative) {
        const isFirebaseConfigured = typeof window !== 'undefined' && 
          (window.AndroidFirebase ? window.AndroidFirebase.isConfigured() : false);

        if (isFirebaseConfigured) {
          import('@capacitor/push-notifications').then(({ PushNotifications }) => {
            PushNotifications.requestPermissions().then(result => {
              if (result.receive === 'granted') {
                try {
                  PushNotifications.register();
                } catch (err) {
                  console.error('Error calling PushNotifications.register():', err);
                }
              }
            });
          });
        } else {
          console.warn('AndroidFirebase is not configured (google-services.json missing). Skipping PushNotifications registration to prevent native crash.');
        }
      }

      // Offline detection listeners
      const handleOffline = () => setIsOffline(true);
      const handleOnline = () => setIsOffline(false);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('online', handleOnline);
      if (navigator.onLine === false) {
        setIsOffline(true);
      }

      let nativeNetworkListener;
      if (isNative) {
        import('@capacitor/network').then(({ Network }) => {
          Network.getStatus().then(status => {
            setIsOffline(!status.connected);
          });
          Network.addListener('networkStatusChange', status => {
            setIsOffline(!status.connected);
          }).then(listener => {
            nativeNetworkListener = listener;
          });
        });

        // Intercept global external link clicks
        const handleExternalLinks = async (e) => {
          const anchor = e.target.closest('a');
          if (anchor && anchor.href) {
            try {
              const url = new URL(anchor.href);
              const isInternal = url.hostname === window.location.hostname;
              const isApk = url.pathname.endsWith('.apk');
              if (!isInternal || isApk) {
                e.preventDefault();
                const { Browser } = await import('@capacitor/browser');
                await Browser.open({ url: anchor.href });
              }
            } catch (err) {
              console.error('Failed processing external link click:', err);
            }
          }
        };
        document.addEventListener('click', handleExternalLinks);
        return () => {
          window.removeEventListener('offline', handleOffline);
          window.removeEventListener('online', handleOnline);
          document.removeEventListener('click', handleExternalLinks);
          if (nativeNetworkListener) {
            nativeNetworkListener.remove();
          }
        };
      }

      return () => {
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('online', handleOnline);
      };
    }
  }, []);

  // Regenerate captcha when switching login/registration forms
  useEffect(() => {
    generateCaptcha();
  }, [isLogin]);

  // Auto-calculate new scheme total return dynamically
  useEffect(() => {
    const price = parseFloat(newSchemePrice) || 0;
    const rate = parseFloat(newSchemeRate) || 0;
    const days = parseInt(newSchemeDays) || 0;
    if (price > 0 && rate > 0 && days > 0) {
      const dailyProfit = price * (rate / 100);
      const totalProfit = dailyProfit * days;
      const totalReturn = price + totalProfit;
      setNewSchemeTotalReturn(totalReturn.toFixed(2));
    } else {
      setNewSchemeTotalReturn('');
    }
  }, [newSchemePrice, newSchemeRate, newSchemeDays]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref');
      if (refParam) {
        localStorage.setItem('fp_ref', refParam);
        sessionStorage.setItem('fp_ref', refParam);
        document.cookie = `fp_ref=${refParam}; path=/; max-age=2592000; SameSite=Lax`;
        setReferralCode(refParam);
        setIsLogin(false); // Show registration form
      } else {
        const savedRef = localStorage.getItem('fp_ref') || sessionStorage.getItem('fp_ref');
        if (savedRef) {
          setReferralCode(savedRef);
        }
      }
    }
  }, []);

  // Global live countdown ticker hook
  useEffect(() => {
    const ticker = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(ticker);
  }, []);
  const lastSeenTxIdsRef = useRef(new Set());

  // Real PWA / Push Notification for Admin Phone (Deposit / Withdrawal requests)
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    // Request permission from the admin's device
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    const registerPush = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('[FastPay Push] Push notifications not supported on this browser/device');
        return;
      }

      try {
        const reg = await navigator.serviceWorker.ready;
        let permission = Notification.permission;
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
          console.log('[FastPay Push] Notification permission denied');
          return;
        }

        // Fetch VAPID public key
        const keyRes = await fetch('/api/admin/vapid-public-key');
        const keyData = await keyRes.json();
        if (!keyData.publicKey) {
          console.error('[FastPay Push] No VAPID public key returned');
          return;
        }

        // Convert key to Uint8Array
        const padding = '='.repeat((4 - keyData.publicKey.length % 4) % 4);
        const base64 = (keyData.publicKey + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }

        // Subscribe
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray
        });

        // Send to server
        await fetch('/api/admin/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription })
        });
        console.log('[FastPay Push] Push subscription registered successfully!');
      } catch (err) {
        console.error('[FastPay Push] Failed to register push subscription:', err);
      }
    };

    registerPush();

    // Populate initial seen IDs so we don't alert on existing ones on page load
    const initSeen = async () => {
      try {
        const res = await fetch('/api/admin/transactions?page=1&limit=50&filter=pending');
        const data = await res.json();
        if (data.success && data.transactions) {
          data.transactions.forEach(t => lastSeenTxIdsRef.current.add(t.id));
        }
      } catch (e) {
        console.error("Error initializing seen transactions:", e);
      }
    };
    initSeen();

    // Background polling loop as backup when application is active
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/transactions?page=1&limit=20&filter=pending');
        const data = await res.json();
        if (data.success && data.transactions) {
          for (const t of data.transactions) {
            if (!lastSeenTxIdsRef.current.has(t.id)) {
              lastSeenTxIdsRef.current.add(t.id);

              // Notify the admin immediately on new deposit or withdrawal requests
              if (t.type === 'deposit' || t.type === 'withdrawal') {
                const actionName = t.type === 'deposit' ? 'Deposit' : 'Withdrawal';
                const title = `⚠️ New ${actionName} Request`;
                const timeStr = new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const bodyText = `Username: ${t.user_name}\nID: ${t.user_id}\nAmount: ₹${Math.abs(t.amount)}\nAction: ${actionName}\nTime: ${timeStr}`;

                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then(reg => {
                      reg.showNotification(title, {
                        body: bodyText,
                        icon: '/icon-192.png',
                        badge: '/icon-192.png',
                        tag: `tx-${t.id}`,
                        renotify: true
                      });
                    });
                  } else {
                    new Notification(title, { body: bodyText, icon: '/icon-192.png' });
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Error polling for admin push notifications:", err);
      }
    }, 10000); // 10s poll

    return () => clearInterval(interval);
  }, [user]);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      
      if (data.apkDownloadUrl) {
        setApkDownloadUrl(data.apkDownloadUrl);
        setNewApkDownloadUrl(data.apkDownloadUrl);
      }
      
      // Perform Force Update Check on ALL responses (200, 401, 403, etc.)
      if (data.pwaSettings?.version) {
        const sv = data.pwaSettings.version;
        setServerAppVersion(sv);
        setPwaUpdateNotes(data.pwaSettings.updateNotes || '');
        
        let currentVersion = null;
        let nativeVersion = null;
        if (typeof window !== 'undefined') {
          if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            try {
              const { App } = await import('@capacitor/app');
              const info = await App.getInfo();
              nativeVersion = info.version;
            } catch (err) {
              console.error('Error getting native app info:', err);
            }
          }
          
          const localVersion = localStorage.getItem('fp_app_version');
          
          if (nativeVersion && localVersion) {
            currentVersion = isVersionOutdated(nativeVersion, localVersion) ? localVersion : nativeVersion;
          } else {
            currentVersion = nativeVersion || localVersion || '1.0.0';
          }

          if (isVersionOutdated(currentVersion, sv)) {
            setShowForceUpdate(true);
          } else {
            localStorage.setItem('fp_app_version', sv);
            setShowForceUpdate(false);
          }
        }
      }

      if (data.success) {
        setUser(data.user);
        if (data.apkDownloadUrl) {
          setApkDownloadUrl(data.apkDownloadUrl);
          setNewApkDownloadUrl(data.apkDownloadUrl);
        }
        setAppState('app');
        fetchSchemes();
        fetchOrders();
        fetchTransactions();
        fetchTeamData();
        fetchTasksProgress();
        if (data.pwaSettings) {
          setPwaName(data.pwaSettings.name || 'FastPay');
          setPwaShortName(data.pwaSettings.shortName || 'FastPay');
          setPwaThemeColor(data.pwaSettings.themeColor || '#000000');
          setPwaBackgroundColor(data.pwaSettings.backgroundColor || '#000000');
          setPwaIcon(data.pwaSettings.icon || '/icon-192.png');
          setPwaSplashScreen(data.pwaSettings.splashScreen || '/icon-512.png');
          setPwaInstallPromptText(data.pwaSettings.installPromptText || 'Install FastPay to your device home screen for a native, fast, and full-screen mobile app experience.');
          setPwaVersion(data.pwaSettings.version || '1.0.0');
          setPwaUpdateNotes(data.pwaSettings.updateNotes || '');

          setAdminPwaName(data.pwaSettings.name || 'FastPay');
          setAdminPwaShortName(data.pwaSettings.shortName || 'FastPay');
          setAdminPwaThemeColor(data.pwaSettings.themeColor || '#000000');
          setAdminPwaBackgroundColor(data.pwaSettings.backgroundColor || '#000000');
          setAdminPwaIcon(data.pwaSettings.icon || '/icon-192.png');
          setAdminPwaSplashScreen(data.pwaSettings.splashScreen || '/icon-512.png');
          setAdminPwaInstallPromptText(data.pwaSettings.installPromptText || 'Install FastPay to your device home screen for a native, fast, and full-screen mobile app experience.');
          setAdminPwaVersion(data.pwaSettings.version || '1.0.0');
          setAdminPwaUpdateNotes(data.pwaSettings.updateNotes || '');
        }
        if (data.user.bankDetails) {
          setAccountNumber(data.user.bankDetails.account_number);
          setConfirmAccountNumber(data.user.bankDetails.account_number);
          setAccountName(data.user.bankDetails.account_name);
          setIfsc(data.user.bankDetails.ifsc);
          setUpiId(data.user.bankDetails.upi_id);
        }

        // Request notification permission
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          try { await Notification.requestPermission(); } catch (_) {}
        }
      } else if (res.status === 401 || res.status === 403) {
        // Account deleted or suspended — force logout
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        setAppState('auth');
        setAuthError(data.error || 'Your session is no longer valid. Please login again.');
      } else {
        setAppState('auth');
      }
    } catch (e) {
      setAppState('auth');
    }
  };

  const fetchAdminStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setAdminStats(data.stats);
      }
    } catch (e) {
      console.error('Error fetching admin stats:', e);
    }
  };

  const fetchAdminReferralTasks = async (p = 1, searchVal = '') => {
    setAdminReferralTasksLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', p.toString());
      queryParams.set('limit', '20');
      if (searchVal) queryParams.set('search', searchVal);
      const res = await fetch(`/api/admin/referral-tasks?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAdminReferralTasksData(data.stats);
        setAdminReferralTasksPage(data.pagination.page);
        setAdminReferralTasksTotalPages(data.pagination.pages);
      }
    } catch (err) {
      console.error('Error fetching admin referral tasks:', err);
    } finally {
      setAdminReferralTasksLoading(false);
    }
  };

  const fetchAdminSpinData = async () => {
    setAdminSpinLoading(true);
    try {
      const res = await fetch('/api/admin/spin');
      const data = await res.json();
      if (data.success) {
        setAdminSpinConfig(data.config);
        setAdminSpinStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching admin spin config:', err);
    } finally {
      setAdminSpinLoading(false);
    }
  };

  const saveAdminSpinConfig = async (newConfig) => {
    try {
      const res = await fetch('/api/admin/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_config', config: newConfig })
      });
      const data = await res.json();
      if (data.success) {
        alert('Spin configuration updated successfully.');
        fetchAdminSpinData();
      } else {
        alert(data.error || 'Failed to update spin configuration.');
      }
    } catch (err) {
      console.error('Error saving spin config:', err);
      alert('Error updating spin configuration.');
    }
  };

  const fulfillGrandPrize = async (logId) => {
    if (!confirm('Are you sure you want to mark this grand prize as fulfilled?')) return;
    try {
      const res = await fetch('/api/admin/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fulfill_prize', logId })
      });
      const data = await res.json();
      if (data.success) {
        alert('Grand prize status marked as fulfilled.');
        fetchAdminSpinData();
      } else {
        alert(data.error || 'Failed to fulfill prize.');
      }
    } catch (err) {
      console.error('Error fulfilling grand prize:', err);
      alert('Error fulfilling prize.');
    }
  };

  const fetchAdminLotteryData = async (searchVal = '', statusVal = '', weekVal = '') => {
    setAdminLotteryLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchVal) queryParams.set('search', searchVal);
      if (statusVal) queryParams.set('status', statusVal);
      if (weekVal) queryParams.set('week', weekVal);

      const res = await fetch(`/api/admin/lottery?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAdminLotteryConfig(data.activeDraw);
        setAdminLotteryStats(data.stats);
        setAdminLotteryTickets(data.tickets);
        setAdminLotteryWinners(data.winners);
        setAdminLotteryDraws(data.draws);
      }
    } catch (err) {
      console.error('Error fetching admin lottery details:', err);
    } finally {
      setAdminLotteryLoading(false);
    }
  };

  const saveAdminLotteryConfig = async (newConfig) => {
    try {
      const res = await fetch('/api/admin/lottery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_config',
          ticketPrice: newConfig.ticket_price,
          multiplier: newConfig.multiplier,
          salesEnabled: newConfig.status === 'open'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Lottery configuration updated successfully.');
        fetchAdminLotteryData(adminLotterySearch, adminLotteryStatusFilter, adminLotteryWeekFilter);
      } else {
        alert(data.error || 'Failed to update lottery configuration.');
      }
    } catch (err) {
      console.error('Error saving lottery config:', err);
      alert('Error updating lottery configuration.');
    }
  };

  const runManualLotteryDraw = async (winCode = '') => {
    if (!confirm(winCode ? `Are you sure you want to manually run the draw with winning code #${winCode}?` : 'Are you sure you want to manually execute the weekly draw with a random winning code?')) return;
    try {
      const res = await fetch('/api/admin/lottery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_draw', winCode })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchAdminLotteryData(adminLotterySearch, adminLotteryStatusFilter, adminLotteryWeekFilter);
      } else {
        alert(data.error || 'Failed to run draw.');
      }
    } catch (err) {
      console.error('Error running manual draw:', err);
      alert('Error running manual draw.');
    }
  };

  const handleAdminMilestoneAction = async (action, userId, milestone) => {
    const actName = action === 'approve' ? 'Approve' : 'Revoke';
    if (!confirm(`Are you sure you want to ${action} Milestone ${milestone} for this user?`)) return;
    try {
      const res = await fetch('/api/admin/referral-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId, milestone })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchAdminReferralTasks(adminReferralTasksPage, adminReferralTasksSearch);
      } else {
        alert(data.error || `Failed to ${action} milestone.`);
      }
    } catch (err) {
      console.error(`Error on admin milestone action ${action}:`, err);
      alert(`Error during milestone ${action}.`);
    }
  };

  const fetchAdminUsers = async (page = 1, search = '') => {
    setAdminLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setAdminUsers(data.users);
        setUserPage(data.pagination.page);
        setUserTotalPages(data.pagination.pages);
        setAdminTotalUsersCount(data.pagination.total);
      }
    } catch (e) {
      console.error('Error fetching admin users:', e);
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchAdminTransactions = async (page = 1, filter = 'pending', search = '') => {
    setAdminLoading(true);
    try {
      const res = await fetch(`/api/admin/transactions?page=${page}&limit=20&filter=${filter}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setAdminTransactions(data.transactions);
        setTxPage(data.pagination.page);
        setTxTotalPages(data.pagination.pages);
        setAdminTotalTransactionsCount(data.pagination.total);
      }
    } catch (e) {
      console.error('Error fetching admin transactions:', e);
    } finally {
      setAdminLoading(false);
    }
  };
  const fetchAdminWithdrawals = async (page = 1, filter = 'all', search = '', dateRange = 'all', startDate = '', endDate = '', sort = 'date-desc') => {
    setAdminLoading(true);
    try {
      const url = `/api/admin/withdrawals?page=${page}&limit=10&status=${filter}&search=${encodeURIComponent(search)}&dateRange=${dateRange}&startDate=${startDate}&endDate=${endDate}&sort=${sort}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAdminWithdrawals(data.withdrawals);
        setAdminWithdrawalsTotalPages(data.pagination.pages);
        setAdminWithdrawalsTotalCount(data.pagination.total);
        setAdminWithdrawalsStats(data.stats);
      }
    } catch (e) {
      console.error('Error fetching admin withdrawals:', e);
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchAdminOrders = async (page = 1, status = '', search = '') => {
    setAdminLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?page=${page}&limit=20&status=${status}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setAdminOrders(data.orders);
        setOrdersPage(data.pagination.page);
        setOrdersTotalPages(data.pagination.pages);
        setAdminTotalOrdersCount(data.pagination.total);
      }
    } catch (e) {
      console.error('Error fetching admin orders:', e);
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchAdminNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      if (data.success) setAdminNotifications(data.notifications);
    } catch (e) { }
  };

  const markAllNotificationsRead = async () => {
    try {
      const res = await fetch('/api/admin/notifications', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAdminNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (e) {
      console.error('Error marking all notifications read:', e);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminNotifications();
      }
    } catch (e) {
      console.error('Error marking notification read:', e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminNotifications();
      }
    } catch (e) {
      console.error('Error marking all notifications read:', e);
    }
  };

  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin/data');
      const data = await res.json();
      if (data.success) {
        setAdminSchemes(data.schemes);
        setAdminVirtualAccounts(data.virtualAccounts || []);
      }
    } catch (e) {
      console.error('Error in fetchAdminData wrapper:', e);
    }

    // Refresh stats
    fetchAdminStats();

    // Trigger slice refresh
    if (adminActiveSubTab === 'users') {
      fetchAdminUsers(userPage, userSearch);
    } else if (adminActiveSubTab === 'transactions') {
      fetchAdminTransactions(txPage, adminTxFilter, adminSearchQuery);
    } else if (adminActiveSubTab === 'orders') {
      fetchAdminOrders(ordersPage, adminOrderFilter, adminSearchQuery);
    } else if (adminActiveSubTab === 'withdrawals') {
      fetchAdminWithdrawals(withdrawalPage, withdrawalFilter, withdrawalSearchQuery, withdrawalDateRange, withdrawalStartDate, withdrawalEndDate, withdrawalSort);
    }
  };

  const fetchUserProfileDetails = async (userId) => {
    setAdminUserProfileLoading(true);
    try {
      const res = await fetch(`/api/admin/user-details?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setAdminUserProfileData(data.details);
      } else {
        alert(data.error || 'Failed to retrieve user details.');
      }
    } catch (e) {
      alert('Error fetching user profile details.');
    } finally {
      setAdminUserProfileLoading(false);
    }
  };

  const handleSaveApkUrl = async () => {
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveApkUrl',
          payload: { apkUrl: newApkDownloadUrl }
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setApkDownloadUrl(newApkDownloadUrl);
      } else {
        alert(data.error || 'Failed to save APK link.');
      }
    } catch (e) {
      alert('Error saving APK link.');
    }
  };

  const handleApkFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.apk')) {
      alert('Invalid file format. Please upload a file ending with ".apk"');
      e.target.value = '';
      return;
    }

    setApkUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload-apk', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setApkDownloadUrl(data.downloadUrl);
        setNewApkDownloadUrl(data.downloadUrl);
      } else {
        alert(data.error || 'Failed to upload APK.');
      }
    } catch (err) {
      console.error('APK upload error:', err);
      alert('Error uploading APK file.');
    } finally {
      setApkUploadLoading(false);
      e.target.value = '';
    }
  };

  const handleSavePwaSettings = async () => {
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'savePwaSettings',
          payload: {
            name: adminPwaName,
            shortName: adminPwaShortName,
            themeColor: adminPwaThemeColor,
            backgroundColor: adminPwaBackgroundColor,
            icon: adminPwaIcon,
            splashScreen: adminPwaSplashScreen,
            installPromptText: adminPwaInstallPromptText,
            version: adminPwaVersion,
            updateNotes: adminPwaUpdateNotes
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setPwaName(adminPwaName);
        setPwaShortName(adminPwaShortName);
        setPwaThemeColor(adminPwaThemeColor);
        setPwaBackgroundColor(adminPwaBackgroundColor);
        setPwaIcon(adminPwaIcon);
        setPwaSplashScreen(adminPwaSplashScreen);
        setPwaInstallPromptText(adminPwaInstallPromptText);
        setPwaVersion(adminPwaVersion);
        setPwaUpdateNotes(adminPwaUpdateNotes);
      } else {
        alert(data.error || 'Failed to save PWA settings.');
      }
    } catch (e) {
      alert('Error saving PWA settings.');
    }
  };

  const handleAddPaymentAccount = async () => {
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addPaymentAccount',
          payload: {
            bankName: newPaBankName,
            beneficiaryName: newPaBeneficiaryName,
            accountNumber: newPaAccountNumber,
            ifsc: newPaIfsc,
            upiId: newPaUpiId,
            qrCode: newPaQrCode,
            qrCodeData: newPaQrCodeData,
            allowConcurrent: newPaAllowConcurrent
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setNewPaBeneficiaryName('');
        setNewPaAccountNumber('');
        setNewPaIfsc('');
        setNewPaUpiId('');
        setNewPaQrCode(null);
        setNewPaQrCodeData('');
        setNewPaAllowConcurrent(false);
        fetchAdminData();
      } else {
        alert(data.error || 'Failed to add payment account.');
      }
    } catch (e) {
      alert('Error adding payment account.');
    }
  };

  const handleTogglePaymentAccountStatus = async (id) => {
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'togglePaymentAccountStatus',
          payload: { id }
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminData();
      } else {
        alert(data.error || 'Failed to toggle status.');
      }
    } catch (e) {
      alert('Error toggling status.');
    }
  };

  const handleTogglePaymentAccountConcurrent = async (id) => {
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'togglePaymentAccountConcurrent',
          payload: { id }
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminData();
      } else {
        alert(data.error || 'Failed to toggle concurrency.');
      }
    } catch (e) {
      alert('Error toggling concurrency.');
    }
  };

  const handleDeletePaymentAccount = async (id) => {
    if (!confirm('Are you sure you want to delete this payment account?')) return;
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deletePaymentAccount',
          payload: { id }
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchAdminData();
      } else {
        alert(data.error || 'Failed to delete payment account.');
      }
    } catch (e) {
      alert('Error deleting payment account.');
    }
  };

  // URL Navigation State Persistence (Admin Panel)
  useEffect(() => {
    if (activeTab !== 'admin') return;
    const params = new URLSearchParams();
    params.set('tab', adminActiveSubTab);
    params.set('view', adminView);
    if (selectedAdminUserId) params.set('userId', selectedAdminUserId);
    if (adminExpandedOrderId) params.set('orderId', adminExpandedOrderId);
    if (adminSearchQuery) params.set('search', adminSearchQuery);
    if (adminTxFilter) params.set('txFilter', adminTxFilter);
    if (adminOrderFilter) params.set('orderFilter', adminOrderFilter);
    params.set('usersPage', userPage.toString());
    params.set('txPage', txPage.toString());
    params.set('ordersPage', ordersPage.toString());

    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [
    activeTab,
    adminActiveSubTab,
    adminView,
    selectedAdminUserId,
    adminExpandedOrderId,
    adminSearchQuery,
    adminTxFilter,
    adminOrderFilter,
    userPage,
    txPage,
    ordersPage
  ]);

  // Load state from URL parameters on initial client mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const view = params.get('view');
    const userId = params.get('userId');
    const orderId = params.get('orderId');
    const search = params.get('search');
    const txFilter = params.get('txFilter');
    const orderFilter = params.get('orderFilter');
    
    const usersP = parseInt(params.get('usersPage')) || 1;
    const txP = parseInt(params.get('txPage')) || 1;
    const ordersP = parseInt(params.get('ordersPage')) || 1;

    if (tab) setAdminActiveSubTab(tab);
    if (view) setAdminView(view);
    if (userId) {
      setSelectedAdminUserId(userId);
      fetchUserProfileDetails(userId);
    }
    if (orderId) {
      setAdminExpandedOrderId(orderId);
    }
    if (search) setAdminSearchQuery(search);
    if (txFilter) setAdminTxFilter(txFilter);
    if (orderFilter) setAdminOrderFilter(orderFilter);

    setUserPage(usersP);
    setTxPage(txP);
    setOrdersPage(ordersP);
  }, []);

  // Fetch dashboard stats and scheme/virtual accounts meta on admin page active
  useEffect(() => {
    if (activeTab === 'admin') {
      fetchAdminStats();
      fetchAdminData();
    }
  }, [activeTab]);

  // Polling for admin notifications every 5 seconds when admin tab or admin user is logged in
  useEffect(() => {
    let interval;
    if (activeTab === 'admin' || (user && user.role === 'admin')) {
      fetchAdminNotifications();
      interval = setInterval(() => {
        fetchAdminNotifications();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab, user]);

  // Lazy load list page data slices on tab, filters, search, or pagination changes
  useEffect(() => {
    if (activeTab === 'admin') {
      if (adminActiveSubTab === 'users') {
        fetchAdminUsers(userPage, userSearch);
      } else if (adminActiveSubTab === 'transactions') {
        fetchAdminTransactions(txPage, adminTxFilter, adminSearchQuery);
      } else if (adminActiveSubTab === 'orders') {
        fetchAdminOrders(ordersPage, adminOrderFilter, adminSearchQuery);
      } else if (adminActiveSubTab === 'withdrawals') {
        fetchAdminWithdrawals(withdrawalPage, withdrawalFilter, withdrawalSearchQuery, withdrawalDateRange, withdrawalStartDate, withdrawalEndDate, withdrawalSort);
      } else if (adminActiveSubTab === 'referral-tasks') {
        fetchAdminReferralTasks(adminReferralTasksPage, adminReferralTasksSearch);
      } else if (adminActiveSubTab === 'spin-management') {
        fetchAdminSpinData();
      } else if (adminActiveSubTab === 'lottery-management') {
        fetchAdminLotteryData(adminLotterySearch, adminLotteryStatusFilter, adminLotteryWeekFilter);
      }
    }
  }, [
    activeTab,
    adminActiveSubTab,
    userPage,
    txPage,
    ordersPage,
    adminTxFilter,
    adminOrderFilter,
    adminSearchQuery,
    userSearch,
    withdrawalPage,
    withdrawalFilter,
    withdrawalSearchQuery,
    withdrawalDateRange,
    withdrawalStartDate,
    withdrawalEndDate,
    withdrawalSort,
    adminReferralTasksPage,
    adminReferralTasksSearch,
    adminLotterySearch,
    adminLotteryStatusFilter,
    adminLotteryWeekFilter
  ]);

  const formatTimerValue = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const paymentIntervalRef = useRef(null);
  useEffect(() => {
    if (activeOrderDetails && paymentStep === 2 && currentDraftOrderCreatedAt) {
      const calculateRemaining = () => {
        const elapsed = Math.floor((Date.now() - new Date(currentDraftOrderCreatedAt).getTime()) / 1000);
        return Math.max(0, 900 - elapsed);
      };

      setPaymentTimer(calculateRemaining());

      paymentIntervalRef.current = setInterval(() => {
        setPaymentTimer(() => {
          const rem = calculateRemaining();
          if (rem <= 0) {
            clearInterval(paymentIntervalRef.current);
            handleUpdateDraftStatus('failed');
            handleCloseModal();
            return 0;
          }
          return rem;
        });
      }, 1000);
    } else {
      clearInterval(paymentIntervalRef.current);
    }
    return () => clearInterval(paymentIntervalRef.current);
  }, [activeOrderDetails, paymentStep, currentDraftOrderId, currentDraftOrderCreatedAt]);

  // 2. Fetch Schemes, Orders, Transactions, & Team
  const fetchSchemes = async () => {
    try {
      const res = await fetch('/api/schemes');
      const data = await res.json();
      if (data.success) setSchemes(data.schemes);
    } catch (e) { }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (e) { }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      if (data.success) setTxHistory(data.transactions);
    } catch (e) { }
  };

  const fetchTasksProgress = async () => {
    try {
      const res = await fetch('/api/tasks/claim');
      const data = await res.json();
      if (data.success) setTasksProgress(data.taskProgress);
    } catch (e) {
      console.error('Error fetching tasks:', e);
    }
  };

  const handleClaimTask = async (taskId) => {
    try {
      const res = await fetch('/api/tasks/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchSession();
        fetchTransactions();
        fetchTasksProgress();
      } else {
        alert(data.error || 'Failed to claim reward.');
      }
    } catch (e) {
      alert('Error claiming task reward.');
    }
  };

  const fetchTeamData = async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (data.success) setTeamData(data);
    } catch (e) { }
  };

  const fetchSpinData = async () => {
    try {
      const res = await fetch('/api/activity/spin');
      const data = await res.json();
      if (data.success) {
        setSpinData(data);
      }
    } catch (e) {
      console.error('Error fetching spin details:', e);
    }
  };

  const fetchLotteryData = async () => {
    setLotteryLoading(true);
    try {
      const res = await fetch('/api/lottery');
      const data = await res.json();
      if (data.success) {
        setLotteryData(data);
      }
    } catch (err) {
      console.error('Error fetching lottery data:', err);
    } finally {
      setLotteryLoading(false);
    }
  };

  const buyLotteryTicket = async () => {
    if (buyLotteryLoading) return;
    if (!confirm(`Are you sure you want to purchase a lottery ticket for ₹${lotteryData.config.ticketPrice}?`)) return;
    setBuyLotteryLoading(true);
    try {
      const res = await fetch('/api/lottery/ticket', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        if (data.walletBalance !== undefined && setUser) {
          setUser(prev => {
            if (!prev) return prev;
            return { ...prev, walletBalance: data.walletBalance };
          });
        }
        fetchLotteryData();
      } else {
        alert(data.error || 'Failed to purchase lottery ticket.');
      }
    } catch (err) {
      console.error('Error buying lottery ticket:', err);
      alert('Error buying lottery ticket.');
    } finally {
      setBuyLotteryLoading(false);
    }
  };

  const startSpin = async () => {
    if (spinWheelIsSpinning) return;
    setSpinWheelIsSpinning(true);
    setSpinTargetIndex(null);

    try {
      const res = await fetch('/api/activity/spin', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to start spin.');
        setSpinWheelIsSpinning(false);
        return;
      }

      const prizeLabels = ["₹50", "₹100", "₹200", "₹500", "Bonus Spin", "Try Again", "Good Luck", "iPhone 17"];
      const winIndex = prizeLabels.indexOf(data.prize);
      if (winIndex === -1) {
        alert('Invalid prize returned from server.');
        setSpinWheelIsSpinning(false);
        return;
      }

      setSpinTargetIndex(winIndex);
      
      window.spinFinishedCallback = () => {
        setSpinWheelIsSpinning(false);
        setSpinResultModal({
          prize: data.prize,
          rewardType: data.rewardType,
          rewardValue: data.rewardValue
        });
        if (data.walletBalance !== undefined && setUser) {
          setUser(prev => {
            if (!prev) return prev;
            return { ...prev, walletBalance: data.walletBalance };
          });
        }
        fetchSpinData();
      };

    } catch (err) {
      console.error('Error starting spin:', err);
      alert('Error during spin action.');
      setSpinWheelIsSpinning(false);
    }
  };

  // 3. OTP Code Timer Logic (60s Limit)
  useEffect(() => {
    if (otpTimer > 0) {
      otpIntervalRef.current = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(otpIntervalRef.current);
    }
    return () => clearInterval(otpIntervalRef.current);
  }, [otpTimer]);

  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      setAuthError('Please enter a valid phone number first.');
      return;
    }
    setOtpLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setOtpTimer(60);
        setSentOtpCode(data.otp || ''); // Developer reference
      } else {
        setAuthError(data.error || 'Failed to send OTP.');
      }
    } catch (e) {
      setAuthError('Error sending OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // 4. Register & Login Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    // Verification Code (Captcha) Check
    if (captchaInput !== captchaCode) {
      setAuthError('Verification code (Captcha) does not match.');
      generateCaptcha();
      return;
    }

    let endpoint = '';
    let bodyObj = {};

    if (isForgot) {
      endpoint = '/api/auth/forgot-password';
      bodyObj = { phone, otp, password };
    } else if (isLogin) {
      endpoint = '/api/auth/login';
      bodyObj = { phone, password };
    } else {
      // Validate registration input format on frontend
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setAuthError('Invalid email address format.');
        return;
      }
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone.trim())) {
        setAuthError('Phone number must be exactly 10 digits.');
        return;
      }
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username.trim())) {
        setAuthError('Username must be 3-20 characters long and alphanumeric.');
        return;
      }

      endpoint = '/api/auth/register';
      bodyObj = { username, phone, email, password, otp, referralCode };
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setAppState('app');
        fetchSchemes();
        fetchOrders();
        fetchTransactions();
        fetchTeamData();
      } else {
        setAuthError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      setAuthError('Something went wrong. Please check your connection.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setAppState('auth');
    setActiveTab('home');
  };

  // 5. Virtual Account Deposit Timer logic
  useEffect(() => {
    if (virtualAccountTimer > 0) {
      vaIntervalRef.current = setInterval(() => {
        setVirtualAccountTimer((prev) => {
          if (prev <= 1) {
            setVirtualAccount(null);
            setTxMessage({ type: 'error', text: 'Virtual bank details expired. Please request a new deposit.' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(vaIntervalRef.current);
    }
    return () => clearInterval(vaIntervalRef.current);
  }, [virtualAccountTimer]);

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setTxMessage({ type: '', text: '' });
    const amountVal = parseFloat(depositAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setTxMessage({ type: 'error', text: 'Enter a valid amount.' });
      return;
    }

    // Close amount entering modal
    setShowDepositModal(false);

    // Construct the custom deposit scheme
    const customScheme = {
      id: 'custom_deposit_scheme',
      name: 'Quick Deposit Scheme',
      price: amountVal,
      daily_return_rate: 0.035, // 3.5%
      days: 3,
      total_return: amountVal * (1 + 0.035 * 3)
    };

    // Open scheme details preview modal
    handleInitiateSchemePurchase(customScheme);
  };

  const handleDepositProofSubmit = async () => {
    setTxMessage({ type: '', text: '' });
    if (!currentDepositTxId) return;
    if (depositUtr.length !== 12) {
      alert('Please enter a valid 12-digit UTR number.');
      return;
    }
    if (!depositScreenshot) {
      alert('Please upload a screenshot of your transaction.');
      return;
    }
    try {
      const res = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: currentDepositTxId,
          utr: depositUtr,
          screenshot: depositScreenshot
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(parseFloat(depositAmount) >= 100 && parseFloat(depositAmount) <= 500
          ? 'Deposit proof submitted! Your Quick Deposit Scheme order is pending verification.'
          : 'Deposit proof submitted successfully for verification!');
        setShowDepositModal(false);
        setVirtualAccount(null);
        setCurrentDepositTxId(null);
        setDepositUtr('');
        setDepositScreenshot(null);
        fetchSession();
        fetchOrders();
        fetchTransactions();
      } else {
        setTxMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setTxMessage({ type: 'error', text: 'Server error submitting deposit proof.' });
    }
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    if (withdrawLoading) return;
    setTxMessage({ type: '', text: '' });
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setTxMessage({ type: 'error', text: 'Enter a valid withdrawal amount.' });
      return;
    }
    const amountVal = parseFloat(withdrawAmount);
    if (amountVal % 100 !== 0) {
      setTxMessage({ type: 'error', text: 'Withdrawal amount must be in multiples of ₹100 (₹100, ₹200, ₹300, ₹400...). Please enter a valid amount.' });
      return;
    }
    const minW = user?.minWithdrawal !== undefined ? user.minWithdrawal : 200;
    const maxW = user?.withdrawableBalance !== undefined ? user.withdrawableBalance : user?.walletBalance;

    if (amountVal < minW) {
      setTxMessage({ type: 'error', text: `Minimum cash-out is ₹${minW.toFixed(2)}.` });
      return;
    }
    if (amountVal > maxW) {
      setTxMessage({ type: 'error', text: `Insufficient withdrawable balance. Maximum you can cash-out is ₹${maxW.toFixed(2)}.` });
      return;
    }
    setWithdrawLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'withdrawal', amount: withdrawAmount }),
      });
      const data = await res.json();
      if (data.success) {
        setTxMessage({ type: 'success', text: data.message });
        setWithdrawAmount('');
        fetchSession();
        fetchTransactions();
        setTimeout(() => setShowWithdrawModal(false), 2000);
      } else {
        setTxMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setTxMessage({ type: 'error', text: 'Server error requesting withdrawal.' });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleLinkBankSubmit = async (e) => {
    e.preventDefault();
    setBankLinkMessage({ type: '', text: '' });

    if (accountNumber !== confirmAccountNumber) {
      setBankLinkMessage({ type: 'error', text: 'Account numbers do not match.' });
      return;
    }

    const accNumRegex = /^\d{9,18}$/;
    if (!accNumRegex.test(accountNumber.trim())) {
      setBankLinkMessage({ type: 'error', text: 'Invalid Account Number. Must be numeric and between 9 and 18 digits.' });
      return;
    }

    const nameRegex = /^[a-zA-Z\s]{3,50}$/;
    if (!nameRegex.test(accountName.trim())) {
      setBankLinkMessage({ type: 'error', text: 'Invalid Account Name. Must be at least 3 letters (alphabetic and spaces only).' });
      return;
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifsc.trim().toUpperCase())) {
      setBankLinkMessage({ type: 'error', text: 'Invalid IFSC format. Must be like SBIN0012345.' });
      return;
    }

    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(upiId.trim())) {
      setBankLinkMessage({ type: 'error', text: 'Invalid UPI ID format. E.g. name@upi.' });
      return;
    }

    try {
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber: accountNumber.trim(), accountName: accountName.trim(), ifsc: ifsc.trim().toUpperCase(), upiId: upiId.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setBankLinkMessage({ type: 'success', text: data.message });
        setIsBankDetailsEditing(false);
        fetchSession();
      } else {
        setBankLinkMessage({ type: 'error', text: data.error });
      }
    } catch (e) {
      setBankLinkMessage({ type: 'error', text: 'Error saving account info.' });
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordChangeMessage({ type: '', text: '' });

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordChangeMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordChangeMessage({ type: 'success', text: data.message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordChangeMessage({ type: 'error', text: data.error });
      }
    } catch (err) {
      setPasswordChangeMessage({ type: 'error', text: 'Server error changing password.' });
    }
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User choice outcome: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      const isIos = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIos) {
        alert("To install FastPay on your iOS device: Open Safari, tap the Share icon, and select 'Add to Home Screen'.");
      } else {
        alert("Your browser does not support automatic app installation. Please use your browser's menu to install FastPay.");
      }
    }
  };

  const handleWalletPurchaseConfirm = async () => {
    if (!activeOrderDetails) return;
    if (confirm(`Confirm purchase of ${activeOrderDetails.name} for ₹${activeOrderDetails.price} using your Wallet Balance?`)) {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schemeId: activeOrderDetails.id || activeOrderDetails._id, paymentMethod: 'wallet' })
        });
        const data = await res.json();
        if (res.status === 429 && data.cooldownUntil) {
          setSchemeCooldowns(prev => ({ ...prev, [activeOrderDetails.id || activeOrderDetails._id]: data.cooldownUntil }));
          setActiveOrderDetails(null);
          alert(data.error);
          return;
        }
        if (data.success) {
          alert(data.message || 'Scheme purchased successfully!');
          setActiveOrderDetails(null);
          fetchSession();
          fetchTransactions();
          fetchOrders();
        } else {
          alert(data.error || 'Failed to complete wallet purchase.');
        }
      } catch (e) {
        alert('Server error executing wallet purchase.');
      }
    }
  };

  const handleInitiateSchemePurchase = async (scheme) => {
    if (user && (!user.isTelegramChannelJoined || !user.isTelegramGroupJoined)) {
      setShowTelegramGate(true);
      return;
    }
    setActiveOrderDetails(scheme);
    setPaymentStep(2);
    setPaymentUtr('');
    setPaymentScreenshot(null);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemeId: scheme.id, isDraft: true }),
      });
      const data = await res.json();
      if (res.status === 429 && data.cooldownUntil) {
        // Scheme is on cooldown — store it and close modal
        setSchemeCooldowns(prev => ({ ...prev, [scheme.id]: data.cooldownUntil }));
        setActiveOrderDetails(null);
        alert(data.error);
        return;
      }
      if (data.success) {
        setCurrentDraftOrderId(data.orderId);
        setActiveOrderBankDetails({ qrCode: data.qrImage });
        const expiresTime = new Date(data.expiresAt);
        const createdTime = new Date(expiresTime.getTime() - 15 * 60 * 1000);
        setCurrentDraftOrderCreatedAt(createdTime.toISOString());
        fetchOrders();
      }
    } catch (e) {
      console.error('Error initiating draft order:', e);
    }
  };

  const handleUpdateDraftStatus = async (status) => {
    if (!currentDraftOrderId) return;
    try {
      await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: currentDraftOrderId, status }),
      });
      fetchOrders();
      fetchTransactions();
    } catch (e) {
      console.error('Error updating order status:', e);
    }
  };

  // QR Scan Handlers
  const handleGalleryScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanLoading(true);
    setScanError('');
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            const code = jsQR(imageData.data, img.width, img.height);
            if (code) {
              await verifyScannedQR(code.data);
            } else {
              setScanError('Could not decode QR code from the uploaded image. Please ensure it is a valid QR code image.');
              setScanLoading(false);
            }
          } catch (err) {
            console.error('Error parsing gallery image:', err);
            setScanError('Error reading the image file.');
            setScanLoading(false);
          }
        };
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setScanError('Failed to read image.');
      setScanLoading(false);
    }
  };

  const startCameraScan = async () => {
    setScanError('');
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      scanStreamRef.current = stream;
      if (scanVideoRef.current) {
        scanVideoRef.current.srcObject = stream;
        scanVideoRef.current.setAttribute('playsinline', 'true');
        scanVideoRef.current.play();
        
        // Start scanning loop
        scanIntervalRef.current = setInterval(() => {
          if (scanVideoRef.current && scanVideoRef.current.readyState === scanVideoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const canvas = document.createElement('canvas');
              const video = scanVideoRef.current;
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, canvas.width, canvas.height);
              if (code) {
                // Found QR Code!
                stopCameraScan();
                verifyScannedQR(code.data);
              }
            } catch (err) {
              console.error('Frame decode error:', err);
            }
          }
        }, 300);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setScanError('Failed to access camera. Please check your permissions or upload from gallery.');
      setIsScanning(false);
    }
  };

  const stopCameraScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (scanStreamRef.current) {
      scanStreamRef.current.getTracks().forEach(track => track.stop());
      scanStreamRef.current = null;
    }
    setIsScanning(false);
  };

  const verifyScannedQR = async (scannedText) => {
    setScanLoading(true);
    setScanError('');
    try {
      const res = await fetch('/api/payment/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scannedText })
      });
      const data = await res.json();
      if (data.success) {
        // Open standard payment modal for this order
        const scheme = {
          id: 'custom_deposit_scheme',
          name: 'Quick Deposit Scheme',
          price: data.amount,
          daily_return_rate: 0.035,
          days: 3,
          total_return: data.amount * (1 + 0.035 * 3)
        };
        
        setCurrentDraftOrderId(data.orderId);
        setCurrentDraftOrderCreatedAt(data.createdAt);
        setActiveOrderDetails(scheme);
        setActiveOrderBankDetails(data.depositDetails);
        
        const createdAt = new Date(data.createdAt);
        const now = new Date();
        const elapsedSecs = Math.floor((now - createdAt) / 1000);
        const remainingSecs = Math.max(0, 900 - elapsedSecs);
        setPaymentTimer(remainingSecs);
        
        setPaymentStep(2);
        setShowScanModal(false);
        fetchOrders();
      } else {
        setScanError(data.error || 'Invalid or used QR Code.');
      }
    } catch (e) {
      console.error(e);
      setScanError('Failed to connect to server.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleCloseModal = async () => {
    setActiveOrderDetails(null);
    setPaymentStep(1);
    setPaymentUtr('');
    setPaymentScreenshot(null);
    setCurrentDraftOrderId(null);
    stopCameraScan();
  };

  const handleCancelPurchase = async () => {
    if (currentDraftOrderId) {
      try {
        await fetch('/api/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: currentDraftOrderId, status: 'cancelled' }),
        });
        fetchOrders();
        fetchTransactions();
      } catch (e) {
        console.error('Error cancelling purchase:', e);
      }
    }
    handleCloseModal();
  };

  const handleBuyOrder = async (schemeId, utr, screenshot) => {
    setTxMessage({ type: '', text: '' });
    if (!currentDraftOrderId) return;
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: currentDraftOrderId, utr, screenshot, status: 'confirmation_pending' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Payment details submitted successfully for verification!');
        setActiveOrderDetails(null);
        setPaymentStep(1);
        setPaymentUtr('');
        setPaymentScreenshot(null);
        setCurrentDraftOrderId(null);
        fetchSession();
        fetchOrders();
        fetchTransactions();
      } else {
        alert(data.error || 'Failed to submit payment details.');
      }
    } catch (e) {
      alert('Failed to purchase scheme.');
    }
  };

  const handleReopenPendingPayment = (order) => {
    let scheme = schemes.find(s => s.id === order.scheme_id);
    if (!scheme && !order.scheme_id) {
      scheme = {
        id: 'custom_deposit_scheme',
        name: 'Quick Deposit Scheme',
        price: order.price,
        daily_return_rate: 0.035, // 3.5%
        days: 3,
        total_return: order.price * (1 + 0.035 * 3)
      };
    }
    if (scheme) {
      if (user && (!user.isTelegramChannelJoined || !user.isTelegramGroupJoined)) {
        setShowTelegramGate(true);
        return;
      }
      setCurrentDraftOrderId(order.id);
      setCurrentDraftOrderCreatedAt(order.created_at);
      setActiveOrderDetails(scheme);
      setActiveOrderBankDetails({
        upiId: order.virtual_upi || "",
        qrCode: order.virtual_qr_code || ""
      });

      // Calculate countdown timer dynamically based on order's created_at
      const createdAt = new Date(order.created_at);
      const now = new Date();
      const elapsedSecs = Math.floor((now - createdAt) / 1000);
      const remainingSecs = Math.max(0, 900 - elapsedSecs);
      setPaymentTimer(remainingSecs);

      setPaymentStep(2);
      setPaymentUtr(order.utr && !order.utr.startsWith('DRAFT-') ? order.utr : '');
      setPaymentScreenshot(order.screenshot || null);
      setSelectedHistoryItem(null);
    } else {
      alert('Associated scheme details not found.');
    }
  };

  const handleApproveOrder = async (orderId, action = 'approve', rejectionReason = '') => {
    try {
      const res = await fetch('/api/orders/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action, rejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchSession();
        fetchOrders();
        fetchTransactions();
        fetchAdminData();
        if (selectedAdminUserId) {
          fetchUserProfileDetails(selectedAdminUserId);
        }
        setAdminView('user-profile');
        setAdminSelectedOrder(null);
        setOrderRejectionReason('');
      } else {
        alert(data.error || 'Operation failed.');
      }
    } catch (e) {
      alert('Error during processing request.');
    }
  };

  const handleAdminAction = async (action, payload) => {
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchAdminData();
        fetchSchemes();
        fetchSession();
        fetchOrders();
        fetchTransactions();
      } else {
        alert(data.error || 'Admin action failed.');
      }
    } catch (e) {
      alert('Error running admin action.');
    }
  };

  const handleAddSchemeSubmit = async (e) => {
    e.preventDefault();
    if (!newSchemeName || !newSchemePrice || !newSchemeRate || !newSchemeDays || !newSchemeTotalReturn) {
      alert('Please fill out all fields.');
      return;
    }
    if (editSchemeId) {
      await handleAdminAction('editScheme', {
        schemeId: editSchemeId,
        name: newSchemeName,
        price: newSchemePrice,
        dailyReturnRate: newSchemeRate,
        days: newSchemeDays,
        totalReturn: newSchemeTotalReturn
      });
      setEditSchemeId(null);
    } else {
      await handleAdminAction('addScheme', {
        name: newSchemeName,
        price: newSchemePrice,
        dailyReturnRate: newSchemeRate,
        days: newSchemeDays,
        totalReturn: newSchemeTotalReturn
      });
    }
    setNewSchemeName('');
    setNewSchemePrice('');
    setNewSchemeRate('');
    setNewSchemeDays('');
    setNewSchemeTotalReturn('');
  };

  const handleDeleteScheme = async (schemeId) => {
    if (!confirm("Are you sure you want to delete this scheme?")) return;
    await handleAdminAction('deleteScheme', { schemeId });
    fetchSchemes();
  };


  const copyToClipboard = async (text) => {
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
      try {
        const { Clipboard } = await import('@capacitor/clipboard');
        await Clipboard.write({ string: text });
      } catch (err) {
        console.error('Failed to copy natively:', err);
        navigator.clipboard.writeText(text);
      }
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    alert('Copied to clipboard!');
  };

  const getUnifiedHistory = () => {
    const feed = [];

    // Add transactions
    txHistory.forEach(tx => {
      if (tx.type === 'order_purchase' || tx.type === 'order_purchase_failed') return;
      if (tx.type === 'deposit' && tx.order_id) return;
      feed.push({
        id: `tx-${tx.id}`,
        rawId: tx.id,
        itemType: 'transaction',
        type: tx.type,
        title: tx.type === 'deposit' ? 'Wallet Deposit' :
          tx.type === 'withdrawal' ? 'Withdrawal Request' :
            tx.type === 'scheme_payout' ? 'Daily Return Payout' :
              tx.type === 'principal_return' ? 'Investment Principal Returned' :
                tx.type.startsWith('referral_reward_milestone_') ? 
                  (tx.type.endsWith('_revoked') ? `Referral Reward Milestone ${tx.type.split('_')[3]} Revoked` : `Referral Reward Milestone ${tx.type.split('_')[3]}`) :
                  tx.type.replace(/_/g, ' '),
        amount: tx.amount,
        status: tx.status,
        date: new Date(tx.created_at),
        raw: tx
      });
    });

    // Add orders
    orders.forEach(order => {
      feed.push({
        id: `order-${order.id}`,
        rawId: order.id,
        itemType: 'order',
        type: 'order',
        title: `Purchase: ${order.scheme_name}`,
        amount: -order.price, // negative to show expenditure/investment
        status: order.status,
        date: new Date(order.created_at),
        raw: order
      });
    });

    // Sort by date newest first
    return feed.sort((a, b) => b.date - a.date);
  };

  // --- MANDATORY FORCE UPDATE CHECK ---
  if (showForceUpdate) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.97)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Outfit, sans-serif' }}>
        <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '380px', padding: '32px', textAlign: 'center', border: '1px solid rgba(162,155,254,0.4)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚀</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '10px' }} className="gradient-text">New Version Available</h2>
          
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '6px', display: 'inline-block', marginBottom: '16px' }}>
            Version {serverAppVersion || pwaVersion || '1.0.0'}
          </div>
          
          <div style={{ textAlign: 'left', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>What's New:</span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.4', maxHeight: '120px', overflowY: 'auto' }}>
              {pwaUpdateNotes || "• Performance improvements and general bug fixes.\n• Optimized system security.\n• Live countdown improvements."}
            </div>
          </div>

          <button
            className="gradient-btn"
            style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}
            onClick={async () => {
              if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform() && apkDownloadUrl) {
                try {
                  const targetVer = serverAppVersion || pwaVersion || '1.0.0';
                  localStorage.setItem('fp_app_version', targetVer);
                  const { Browser } = await import('@capacitor/browser');
                  await Browser.open({ url: getCleanApkUrl(apkDownloadUrl) });
                  return;
                } catch (err) {
                  console.error('Failed to open native browser for APK download:', err);
                }
              }
              try {
                if ('caches' in window) {
                  const cacheKeys = await caches.keys();
                  await Promise.all(cacheKeys.map(key => caches.delete(key)));
                }
                if ('serviceWorker' in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  await Promise.all(regs.map(r => r.unregister()));
                }
                localStorage.setItem('fp_app_version', serverAppVersion);
                window.location.reload(true);
              } catch (e) {
                localStorage.setItem('fp_app_version', serverAppVersion);
                window.location.reload();
              }
            }}
          >
            Update Now
          </button>
        </div>
      </div>
    );
  }

  // Rendering Helper: Device Restriction Block
  if (isDeviceBlocked) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#0a0f1d',
        color: '#ffffff',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'Outfit, sans-serif'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px', color: '#ff7675' }}>⚠️ Mobile Only Platform</h2>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#a0a8c0', maxWidth: '360px' }}>
          This platform is available only on mobile devices. Please use your Android phone to continue.
        </p>
      </div>
    );
  }

  // Rendering Helper: Loading State
  if (appState === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '15px' }}>
        <RefreshCw style={{ animation: 'spin 1.5s linear infinite', color: 'var(--accent-secondary)' }} size={40} />
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Loading FastPay Secure...</h2>
        <style jsx global>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Rendering Helper: Authentication Views
  if (appState === 'auth') {
    return (
      <div className="animate-fade-in" style={{ padding: '30px 20px', display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ padding: '30px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h1 id="auth-title" style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '8px' }} className="gradient-text">FastPay</h1>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.875rem', marginBottom: '24px' }}>
            {isForgot
              ? 'Reset your secure wallet credentials.'
              : isLogin
                ? 'Welcome back! Access your account.'
                : 'Fill in the details below to get started.'}
          </p>

          {authError && (
            <div style={{ background: 'rgba(255, 118, 117, 0.1)', color: 'var(--error)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && !isForgot && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Username</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder=""
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Phone Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="10-digit mobile number"
                value={phone}
                maxLength={10}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
              />
            </div>

            {!isLogin && !isForgot && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {isForgot ? 'New Password' : 'Password'}
                </label>
                {isLogin && (
                  <span
                    onClick={() => { setIsForgot(true); setIsLogin(false); setAuthError(''); }}
                    style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </span>
                )}
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {(!isLogin || isForgot) && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Verification OTP</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="gradient-btn"
                      onClick={handleSendOtp}
                      disabled={otpLoading || otpTimer > 0}
                      style={{ padding: '0 15px', borderRadius: '10px', fontSize: '0.85rem', whiteSpace: 'nowrap', opacity: (otpTimer > 0 || otpLoading) ? 0.6 : 1 }}
                    >
                      {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Send OTP'}
                    </button>
                  </div>

                  {otpTimer > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <div className="countdown-bar" style={{ borderRadius: '2px' }} />
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', marginTop: '4px', textAlign: 'right' }}>
                        OTP expires in {otpTimer}s
                      </div>
                    </div>
                  )}

                  {sentOtpCode && (
                    <div style={{ marginTop: '8px', padding: '6px 12px', background: 'rgba(0, 206, 201, 0.1)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--accent-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🔑 Demo OTP Code: <strong>{sentOtpCode}</strong></span>
                      <button type="button" onClick={() => copyToClipboard(sentOtpCode)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                        <Copy size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {!isForgot && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Referral Code (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Referral Code (e.g. FP123456)"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}

            {/* Captcha Verification Code Block */}
            <div style={{ marginTop: '8px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Verification Code</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter 4-digit code"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  style={{ flex: 1 }}
                />
                <div style={{
                  background: '#000000',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  letterSpacing: '4px',
                  userSelect: 'none',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {captchaCode}
                </div>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '8px'
                  }}
                  title="Regenerate Captcha"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>

            <button type="submit" className="gradient-btn" style={{ padding: '14px', borderRadius: '10px', fontSize: '1rem', marginTop: '8px' }}>
              {isForgot ? 'Reset & Access Account' : isLogin ? 'Authenticate Access' : 'Create Secure Wallet'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isForgot ? (
              <>
                Remember your password?{' '}
                <span
                  onClick={() => { setIsForgot(false); setIsLogin(true); setAuthError(''); }}
                  style={{ color: 'var(--accent-secondary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Back to Login
                </span>
              </>
            ) : (
              <>
                {isLogin ? "Don't have an account?" : 'Already registered?'} {' '}
                <span
                  onClick={() => { setIsLogin(!isLogin); setIsForgot(false); setAuthError(''); }}
                  style={{ color: 'var(--accent-secondary)', cursor: 'pointer', fontWeight: 600 }}
                >
                  {isLogin ? 'Register New account' : 'Login now'}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Download App Button on Login (visible only on web) */}
        {apkDownloadUrl && typeof window !== 'undefined' && !(window.Capacitor && window.Capacitor.isNativePlatform()) && (
          <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <a
              href={getCleanApkUrl(apkDownloadUrl)}
              className="gradient-btn interactive-card"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: 600,
                textDecoration: 'none',
                color: '#fff',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: 'var(--card-shadow)'
              }}
              download="FastPay.apk"
            >
              📱 Download Android App
            </a>
            <span
              onClick={() => setShowDownloadHelp(true)}
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                textDecoration: 'underline',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--accent-secondary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              Problems downloading? View Guide & Mirror
            </span>
          </div>
        )}
      </div>
    );
  }



  // Rendering Helper: Dashboard Sub-tabs
  return (
    <div style={{ padding: '20px 20px 100px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Welcome back,</span>
          <h1 id="user-header" style={{ fontSize: '1.25rem', fontWeight: 700 }} className="gradient-text">{user?.username}</h1>
        </div>
        {user?.supportId && (
          <div 
            onClick={() => {
              copyToClipboard(user.supportId);
            }}
            style={{ 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--glass-border)', 
              padding: '8px 14px', 
              borderRadius: '12px', 
              color: 'var(--accent-secondary)', 
              fontSize: '0.8rem', 
              fontFamily: 'monospace', 
              fontWeight: 700, 
              letterSpacing: '1px',
              cursor: 'pointer'
            }}
            title="Click to copy Support ID"
          >
            ID: {user.supportId}
          </div>
        )}
      </header>

      {/* --- TAB 1: HOME --- */}
      {activeTab === 'home' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>


          {/* Wallets & Profits Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Main Wallet Card */}
            <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.2) 0%, rgba(0, 206, 201, 0.1) 100%)', border: '1px solid rgba(108, 92, 231, 0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Available Balance</span>
                  <button 
                    onClick={() => { fetchSession(); fetchTransactions(); }} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                    title="Refresh Balance"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ₹{user?.walletBalance.toFixed(2)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    setScanError('');
                    setShowScanModal(true);
                  }}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  <Plus size={14} /> Deposit
                </button>
                <button
                  onClick={() => {
                    if (user && !user.isWithdrawalEligible) {
                      alert('Withdrawals are temporarily unavailable. Withdrawals will be enabled automatically after your eligible investment scheme has matured.');
                      return;
                    }
                    setWithdrawAmount('');
                    setTxMessage({ type: '', text: '' });
                    setShowWithdrawModal(true);
                  }}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.8rem' }}
                >
                  <ArrowUpRight size={14} /> Cash-out
                </button>
              </div>
            </div>

            {/* Total Profit Card */}
            <div 
              className="glass-panel interactive-card"
              onClick={() => setShowProfitDetailsPage(true)}
              style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(0, 184, 148, 0.15) 0%, rgba(0, 206, 201, 0.05) 100%)', border: '1px solid rgba(0, 184, 148, 0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Total Profit</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success)' }}>
                  ₹{totalProfit.toFixed(2)}
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '16px' }}>
                <span>⚡ Click to view profit breakdown</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Returns</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px', color: 'var(--success)' }}>
                ₹{orders.reduce((acc, o) => acc + (o.status === 'active' && o.days_remaining > 0 ? o.daily_income : 0), 0).toFixed(2)} /day
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Referrals</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px', color: 'var(--accent-secondary)' }}>
                {teamData.stats.totalTeam} Users
              </div>
            </div>
          </div>

          {/* Dynamic Unified Feed (All History: Deposits, Withdrawals, Pending, Failed, Orders) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Account Transaction & Order Feed</h3>
              <span onClick={() => { setActiveTab('ledger'); setLedgerFilter('all'); }} style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', cursor: 'pointer' }}>View All</span>
            </div>

            {getUnifiedHistory().length === 0 ? (
              <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No recent transactions or orders recorded.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {getUnifiedHistory().slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    onClick={item.status === 'pending' && item.itemType === 'order' ? () => handleReopenPendingPayment(item.raw) : (item.type === 'deposit' ? undefined : () => setSelectedHistoryItem(item))}
                    className={`glass-panel ${item.type === 'deposit' ? '' : 'interactive-card'}`}
                    style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: item.type === 'deposit' ? 'default' : 'pointer' }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {item.itemType === 'order' ? (
                          <TrendingUp size={14} color="var(--accent-primary)" />
                        ) : item.amount > 0 ? (
                          <ArrowDownLeft size={14} color="var(--success)" />
                        ) : (
                          <ArrowUpRight size={14} color="var(--error)" />
                        )}
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {item.date.toLocaleDateString()} {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: item.amount > 0 ? 'var(--success)' : 'var(--error)'
                      }}>
                        {item.amount > 0 ? `+₹${item.amount.toFixed(2)}` : `-₹${Math.abs(item.amount).toFixed(2)}`}
                      </div>
                      <span style={{
                        fontSize: '0.65rem',
                        background: item.status === 'completed' || item.status === 'active' ? 'rgba(0, 184, 148, 0.1)' :
                          item.status === 'pending' || item.status === 'confirmation_pending' ? 'rgba(253, 203, 110, 0.1)' : 'rgba(255, 118, 117, 0.1)',
                        color: item.status === 'completed' || item.status === 'active' ? 'var(--success)' :
                          item.status === 'pending' || item.status === 'confirmation_pending' ? 'var(--gold)' : 'var(--error)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        textTransform: 'capitalize'
                      }}>
                        {item.status === 'confirmation_pending' ? 'Confirmation Pending' : item.status === 'pending' ? 'Pending' : item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: ORDERS --- */}
      {activeTab === 'orders' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Buy Investment Scheme</h2>
              <button
                onClick={fetchSchemes}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  color: 'var(--accent-secondary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={12} /> Refresh Schemes
              </button>
            </div>
            {/* Search Input Box */}
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="🔍 Search scheme by price or name (e.g. 500)..."
                value={schemeSearchQuery}
                onChange={(e) => setSchemeSearchQuery(e.target.value)}
                style={{ borderRadius: '10px', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(() => {
                const filtered = schemes.filter(scheme =>
                  scheme.price.toString().includes(schemeSearchQuery) ||
                  scheme.name.toLowerCase().includes(schemeSearchQuery.toLowerCase())
                );

                if (filtered.length === 0) {
                  return (
                    <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      No schemes match your search query.
                    </div>
                  );
                }

                // If no search query, repeat the schemes 4 times to look populated
                let displayed = [];
                if (schemeSearchQuery) {
                  displayed = filtered.map((s, idx) => ({ ...s, uniqueKey: `${s.id}-${idx}` }));
                } else {
                  for (let i = 0; i < 4; i++) {
                    filtered.forEach((s) => {
                      displayed.push({ ...s, uniqueKey: `${s.id}-rep-${i}` });
                    });
                  }
                }

                return displayed.map((scheme) => {
                  // Check cooldown: from schemeCooldowns state OR from existing orders
                  let cooldownUntil = schemeCooldowns[scheme.id] ? new Date(schemeCooldowns[scheme.id]) : null;
                  if (!cooldownUntil) {
                    // Derive from orders: find most recent active/completed/confirmation_pending order with same scheme_id within 24h
                    const cutoff24h = nowTime - 24 * 60 * 60 * 1000;
                    const recentOrder = orders.find(o =>
                      o.scheme_id === scheme.id &&
                      ['active', 'expired_pending_match', 'completed', 'confirmation_pending'].includes(o.status) &&
                      new Date(o.created_at).getTime() > cutoff24h
                    );
                    if (recentOrder) {
                      cooldownUntil = new Date(new Date(recentOrder.created_at).getTime() + 24 * 60 * 60 * 1000);
                    }
                  }
                  const isOnCooldown = cooldownUntil && cooldownUntil.getTime() > nowTime;
                  const cooldownRemainSec = isOnCooldown ? Math.max(0, Math.floor((cooldownUntil.getTime() - nowTime) / 1000)) : 0;
                  const cdH = Math.floor(cooldownRemainSec / 3600);
                  const cdM = Math.floor((cooldownRemainSec % 3600) / 60);
                  const cdS = cooldownRemainSec % 60;
                  const pad = (num) => String(num).padStart(2, '0');

                  return (
                    <div
                      key={scheme.uniqueKey}
                      onClick={() => !isOnCooldown && handleInitiateSchemePurchase(scheme)}
                      className="glass-panel interactive-card"
                      style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: isOnCooldown ? 0.7 : 1, cursor: isOnCooldown ? 'not-allowed' : 'pointer' }}
                    >
                      <div>
                        <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{scheme.name}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Price: <strong>₹{scheme.price}</strong> • Duration: <strong>{scheme.days} Days</strong>
                        </div>
                        {isOnCooldown && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--gold)', marginTop: '4px', fontWeight: 600 }}>
                            ⏳ Available in {pad(cdH)}h {pad(cdM)}m {pad(cdS)}s
                          </div>
                        )}
                      </div>
                      {isOnCooldown ? (
                        <div style={{ fontSize: '0.7rem', color: 'var(--gold)', background: 'rgba(253,203,110,0.1)', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>Cooldown</div>
                      ) : (
                        <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: TEAM --- */}
      {activeTab === 'team' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Referral Stats Card */}
          <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(0, 206, 201, 0.1) 0%, rgba(108, 92, 231, 0.05) 100%)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Referral Commissions Earned</span>
            <div style={{ fontSize: '2rem', fontWeight: 700, margin: '8px 0', color: 'var(--success)' }}>
              ₹{teamData.stats.totalCommissions.toFixed(2)}
            </div>

            <div style={{ marginTop: '16px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Your Referral Link</span>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all', maxWidth: '240px' }}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/?ref=${teamData.referralCode}` : teamData.referralCode}
                </div>
              </div>
              <button
                onClick={() => {
                  const link = `${window.location.origin}/?ref=${teamData.referralCode}`;
                  copyToClipboard(link);
                }}
                className="gradient-btn"
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              >
                <Copy size={12} /> Copy Link
              </button>
            </div>
          </div>

          {/* Level A Direct Tree */}
          <div>
            <h3
              onClick={() => setShowLevelAMembers(!showLevelAMembers)}
              style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', alignItems: 'center' }}
            >
              <span>Level A Direct Referrals (0.3% Com)</span>
              <span style={{ color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                {teamData.stats.levelACount} Members {showLevelAMembers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </h3>

            {showLevelAMembers && (
              teamData.levelA.length === 0 ? (
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  No direct referrals recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {teamData.levelA.map((member, idx) => (
                    <div key={idx} className="glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{member.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{member.phone}</div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Level B Indirect Tree */}
          <div>
            <h3
              onClick={() => setShowLevelBMembers(!showLevelBMembers)}
              style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', alignItems: 'center' }}
            >
              <span>Level B Indirect Referrals (0.15% Com)</span>
              <span style={{ color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                {teamData.stats.levelBCount} Members {showLevelBMembers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </h3>

            {showLevelBMembers && (
              teamData.levelB.length === 0 ? (
                <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  No Level B indirect referrals yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {teamData.levelB.map((member, idx) => (
                    <div key={idx} className="glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{member.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{member.phone}</div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Referral Commission History Dashboard */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
              Referral Commission History
            </h3>
            {(() => {
              const referralCommissions = txHistory.filter(t => t.status === 'completed' && ['referral_commission_l1', 'referral_commission_l2', 'referral_reward_milestone_1', 'referral_reward_milestone_2', 'referral_reward_milestone_3', 'referral_reward_milestone_1_revoked', 'referral_reward_milestone_2_revoked', 'referral_reward_milestone_3_revoked'].includes(t.type));
              if (referralCommissions.length === 0) {
                return (
                  <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    No referral commissions earned yet.
                  </div>
                );
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {referralCommissions.map((comm) => {
                    const formatPhone = (phone) => {
                      if (!phone) return 'N/A';
                      const s = String(phone);
                      if (s.length <= 4) return s;
                      return s.substring(0, 2) + '*'.repeat(s.length - 4) + s.substring(s.length - 2);
                    };
                    const isMilestone = comm.type.startsWith('referral_reward_milestone_');
                    const isRevoked = comm.type.endsWith('_revoked');
                    const milestoneNum = isMilestone ? comm.type.split('_')[3] : '';
                    return (
                      <div key={comm.id} className="glass-panel" style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {isMilestone ? (isRevoked ? `Referral Reward Milestone ${milestoneNum} Revoked` : `Referral Reward Milestone ${milestoneNum}`) : `${comm.referred_user_username || 'Direct Downline'} (${formatPhone(comm.referred_user_phone)})`}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {isMilestone ? (isRevoked ? 'Milestone Bonus Revoked by Admin' : 'Milestone Bonus Claimed') : <>Scheme: <strong>{comm.scheme_name || 'Quick Deposit Scheme'}</strong></>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: isRevoked ? 'var(--error)' : 'var(--success)' }}>
                              {isRevoked ? '-' : '+'}₹{Math.abs(comm.amount).toFixed(2)}
                            </div>
                            <span style={{
                              fontSize: '0.65rem',
                              background: isMilestone ? 'rgba(253, 203, 110, 0.1)' : (comm.type === 'referral_commission_l1' ? 'rgba(0, 184, 148, 0.1)' : 'rgba(108, 92, 231, 0.1)'),
                              color: isMilestone ? 'var(--gold)' : (comm.type === 'referral_commission_l1' ? 'var(--success)' : '#a29bfe'),
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              display: 'inline-block',
                              marginTop: '4px'
                            }}>
                              {isMilestone ? 'Milestone' : (comm.type === 'referral_commission_l1' ? 'Level 1' : 'Level 2')}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '6px', borderTop: '1px dashed var(--glass-border)', paddingTop: '6px' }}>
                          Earned: {new Date(comm.created_at).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>



          {/* Referral Rewards Explanation Cards */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }} className="gradient-text">FastPay Referral Reward Program</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
              Welcome to the FastPay high-yield network. Share your secure invitation code to build your two-tier passive yield portfolio:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Level 1 Reward */}
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>LEVEL A (DIRECT REFERRAL)</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Invite Reward:</span>
                  <span style={{ fontWeight: 600, color: 'var(--success)' }}>₹50.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Scheme Commission:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>0.30%</span>
                </div>
              </div>

              {/* Level 2 Reward */}
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>LEVEL B (INDIRECT REFERRAL)</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Scheme Commission:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>0.15%</span>
                </div>
              </div>

              {/* Info Card */}
              <div className="glass-panel" style={{ padding: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                💡 <strong>Important Info:</strong> Earn passive commissions instantly whenever members of your network subscribe to schemes. Commissions and referral bonuses are credited directly to your wallet available balance.
              </div>
            </div>
          </div>

          {/* Referral Reward Task Section */}
          <div className="glass-panel" style={{ padding: '20px', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }} className="gradient-text">
              🎁 Referral Reward Task
            </h3>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Invite 10 active users and earn up to ₹1,500 in milestone rewards. Rewards are unlocked as your referred users complete their first task.
            </p>

            {(() => {
              const completedCount = teamData.referralTasks?.completedCount || 0;
              const claimed = teamData.referralTasks?.claimedMilestones || [];
              const progressPct = Math.min(100, (completedCount / 30) * 100);
              const rewardEarned = claimed.length * 500;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                  {/* Progress Stats */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-primary)' }}>Progress:</span>
                    <span style={{ color: 'var(--accent-secondary)' }}>{completedCount} / 30 Tasks Completed</span>
                  </div>

                  {/* Progress Bar Container */}
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-secondary) 0%, var(--success) 100%)', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
                  </div>

                  {/* Milestones List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Milestone 1 (10 Tasks):</span>
                      <strong style={{ color: claimed.includes(1) ? 'var(--success)' : 'var(--text-primary)' }}>
                        {claimed.includes(1) ? '✅ Completed (₹500)' : `${completedCount} / 10`}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Milestone 2 (20 Tasks):</span>
                      <strong style={{ color: claimed.includes(2) ? 'var(--success)' : 'var(--text-primary)' }}>
                        {claimed.includes(2) ? '✅ Completed (₹500)' : `${completedCount} / 20`}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Milestone 3 (30 Tasks):</span>
                      <strong style={{ color: claimed.includes(3) ? 'var(--success)' : 'var(--text-primary)' }}>
                        {claimed.includes(3) ? '✅ Completed (₹500)' : `${completedCount} / 30`}
                      </strong>
                    </div>
                  </div>

                  {/* Total Reward Earned */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, borderTop: '1px solid var(--glass-border)', paddingTop: '10px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--text-primary)' }}>Total Reward Earned:</span>
                    <span style={{ color: 'var(--success)' }}>₹{rewardEarned} / ₹1500</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* --- TAB 4: ACCOUNT --- */}
      {activeTab === 'account' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '6px' }}>Link Bank Details</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Add a valid settlement account. All deposits and withdrawals map to these credentials.
            </p>

            {bankLinkMessage.text && (
              <div style={{
                background: bankLinkMessage.type === 'success' ? 'rgba(0, 184, 148, 0.1)' : 'rgba(255, 118, 117, 0.1)',
                color: bankLinkMessage.type === 'success' ? 'var(--success)' : 'var(--error)',
                padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                {bankLinkMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{bankLinkMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleLinkBankSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Account Holder Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Exact Name on Passbook"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  disabled={user?.isBankLinked && !isBankDetailsEditing}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Account Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Bank account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  disabled={user?.isBankLinked && !isBankDetailsEditing}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Confirm Account Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Re-enter bank account number"
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value)}
                  disabled={user?.isBankLinked && !isBankDetailsEditing}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>IFSC Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. SBIN0012345"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                  disabled={user?.isBankLinked && !isBankDetailsEditing}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>UPI ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. user@ybl"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  disabled={user?.isBankLinked && !isBankDetailsEditing}
                  required
                />
              </div>

              {user?.isBankLinked ? (
                !isBankDetailsEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsBankDetailsEditing(true)}
                    className="gradient-btn"
                    style={{ padding: '14px', borderRadius: '10px', fontSize: '1rem', marginTop: '8px' }}
                  >
                    Edit Settings
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button
                      type="submit"
                      className="gradient-btn"
                      style={{ flex: 1, padding: '14px', borderRadius: '10px', fontSize: '1rem' }}
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (user && user.bankDetails) {
                          setAccountNumber(user.bankDetails.account_number);
                          setConfirmAccountNumber(user.bankDetails.account_number);
                          setAccountName(user.bankDetails.account_name);
                          setIfsc(user.bankDetails.ifsc);
                          setUpiId(user.bankDetails.upi_id);
                        }
                        setIsBankDetailsEditing(false);
                        setBankLinkMessage({ type: '', text: '' });
                      }}
                      style={{ flex: 1, padding: '14px', borderRadius: '10px', background: 'none', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', fontSize: '1rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                )
              ) : (
                <button type="submit" className="gradient-btn" style={{ padding: '14px', borderRadius: '10px', fontSize: '1rem', marginTop: '8px' }}>
                  Verify & Save Settings
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* --- TAB: LEDGER --- */}
      {activeTab === 'ledger' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Transaction Ledger & Logs</h2>
            <button
              onClick={() => setActiveTab('home')}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '6px 14px', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Back to Home
            </button>
          </div>

          {/* Filter Dropdown box */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filter History:</label>
            <select
              value={ledgerFilter}
              onChange={(e) => setLedgerFilter(e.target.value)}
              className="form-input"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              <option value="all">📁 All History</option>
              <option value="pending">⏳ Pending Transactions</option>
              <option value="successful">✅ Successful Transactions</option>
              <option value="failed">❌ Failed & Cancelled</option>
              <option value="withdrawals">💸 Withdrawals</option>
            </select>
          </div>

          {/* Ledger History List */}
          <div>
            {(() => {
              const filteredList = getUnifiedHistory().filter((item) => {
                if (ledgerFilter === 'all') return true;
                if (ledgerFilter === 'pending') return item.status === 'pending' || item.status === 'confirmation_pending';
                if (ledgerFilter === 'successful') return item.status === 'completed' || item.status === 'active';
                if (ledgerFilter === 'failed') return item.status === 'failed' || item.status === 'rejected' || item.status === 'cancelled';
                if (ledgerFilter === 'withdrawals') return item.type === 'withdrawal';
                return true;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    No matching ledger records found.
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredList.map((item) => (
                    <div
                      key={item.id}
                      onClick={item.status === 'pending' && item.itemType === 'order' ? () => handleReopenPendingPayment(item.raw) : (item.itemType === 'transaction' && item.type === 'deposit' ? undefined : () => setSelectedHistoryItem(item))}
                      className={`glass-panel ${(item.itemType === 'transaction' && item.type === 'deposit') ? '' : 'interactive-card'}`}
                      style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: (item.itemType === 'transaction' && item.type === 'deposit') ? 'default' : 'pointer' }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {item.date.toLocaleString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: item.amount > 0 ? 'var(--success)' : 'var(--text-primary)'
                        }}>
                          {item.amount > 0 ? `+₹${item.amount.toFixed(2)}` : `-₹${Math.abs(item.amount).toFixed(2)}`}
                        </div>
                        <span style={{
                          fontSize: '0.7rem',
                          background: item.status === 'completed' || item.status === 'active' ? 'rgba(0, 184, 148, 0.1)' :
                            item.status === 'pending' || item.status === 'confirmation_pending' ? 'rgba(253, 203, 110, 0.1)' : 'rgba(255, 118, 117, 0.1)',
                          color: item.status === 'completed' || item.status === 'active' ? 'var(--success)' :
                            item.status === 'pending' || item.status === 'confirmation_pending' ? 'var(--gold)' : 'var(--error)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          textTransform: 'capitalize'
                        }}>
                          {item.type === 'withdrawal' ? (
                            item.status === 'completed' ? 'Approved' :
                            item.status === 'failed' ? 'Rejected' :
                            item.status === 'pending' ? 'Pending' : item.status
                          ) : (
                            item.status === 'confirmation_pending' ? 'Confirmation Pending' : item.status === 'pending' ? 'Pending' : item.status
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* --- TAB 5: ME --- */}
      {activeTab === 'me' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activityView === 'spin' ? (
            <>
              {/* Spin Wheel Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setActivityView(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">🎡 Lucky Spin Wheel</h3>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="glass-panel" style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Wallet Balance</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--accent-secondary)' }}>₹{user?.walletBalance.toFixed(2)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Free Spins</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--success)' }}>{spinData.freeSpins}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Daily Limit</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{spinData.spinsPlayedToday} / {spinData.dailyLimit}</strong>
                </div>
              </div>

              {/* Wheel & Play Area */}
              <div className="glass-panel" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <CanvasWheel
                  spinning={spinWheelIsSpinning}
                  targetIndex={spinTargetIndex}
                  onFinished={() => {
                    if (window.spinFinishedCallback) window.spinFinishedCallback();
                  }}
                />

                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  {spinData.spinsPlayedToday >= spinData.dailyLimit ? (
                    <div style={{ color: 'var(--error)', fontSize: '0.85rem', fontWeight: 600 }}>
                      Daily Spin Limit Reached. Please try again tomorrow.
                    </div>
                  ) : (
                    <button
                      onClick={startSpin}
                      disabled={spinWheelIsSpinning}
                      className="gradient-btn"
                      style={{
                        padding: '12px 32px',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(253, 203, 110, 0.3)',
                        opacity: spinWheelIsSpinning ? 0.6 : 1
                      }}
                    >
                      {spinWheelIsSpinning ? 'Spinning...' : (spinData.freeSpins > 0 ? 'Spin Free!' : `Buy Spin (₹${spinData.spinPrice})`)}
                    </button>
                  )}
                </div>
              </div>

              {/* User Spin History Log */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '10px' }} className="gradient-text">📜 Your Spin History</h3>
                {spinData.history.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    No spins played yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                    {spinData.history.map((log) => (
                      <div key={log.id} className="glass-panel" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                        <div>
                          <strong style={{ color: 'var(--text-primary)' }}>{log.prizeWon}</strong>
                          <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {new Date(log.date).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 600, color: log.walletCredit > 0 ? 'var(--success)' : 'var(--text-secondary)' }}>
                            {log.walletCredit > 0 ? `+₹${log.walletCredit}` : '—'}
                          </span>
                          <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {log.isFreeSpin ? 'Free' : `Cost: ₹${log.amountPaid}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : activityView === 'lottery' ? (
            <>
              {/* Lottery Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setActivityView(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">🎟️ FastPay Weekly Lottery</h3>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="glass-panel" style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Wallet Balance</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--accent-secondary)' }}>₹{user?.walletBalance.toFixed(2)}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Ticket Cost</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>₹{lotteryData.config.ticketPrice}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Multiplier</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--success)' }}>{lotteryData.config.multiplier}x</strong>
                </div>
              </div>

              {/* Purchase Card */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
                <span style={{ fontSize: '3rem' }}>🎟️</span>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>Get Your Lucky Ticket</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    Purchase a lottery ticket with a unique 3-digit code. Draw takes place automatically every Sunday.
                  </p>
                </div>

                {lotteryData.isSunday ? (
                  <div style={{ padding: '10px 16px', background: 'rgba(255, 118, 117, 0.1)', color: 'var(--error)', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
                    Sunday Draw Day: Ticket sales are closed today.
                  </div>
                ) : !lotteryData.config.salesEnabled ? (
                  <div style={{ padding: '10px 16px', background: 'rgba(255, 118, 117, 0.1)', color: 'var(--error)', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
                    Lottery sales are currently disabled by the administrator.
                  </div>
                ) : (
                  <button
                    onClick={buyLotteryTicket}
                    disabled={buyLotteryLoading}
                    className="gradient-btn"
                    style={{
                      padding: '12px 32px',
                      borderRadius: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(0, 206, 201, 0.3)',
                      opacity: buyLotteryLoading ? 0.6 : 1
                    }}
                  >
                    {buyLotteryLoading ? 'Processing...' : `Buy Ticket (₹${lotteryData.config.ticketPrice})`}
                  </button>
                )}
              </div>

              {/* User Tickets History */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '10px' }} className="gradient-text">📜 Your Purchased Tickets</h3>
                {lotteryLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Loading history...</div>
                ) : lotteryData.tickets.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    No tickets purchased yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {lotteryData.tickets.map((ticket) => (
                      <div key={ticket.id} className="glass-panel" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1rem' }}>🎟️</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '1px', color: 'var(--text-primary)' }}>
                              #{ticket.ticket_code}
                            </span>
                          </div>
                          <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Bought: {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div>
                            {ticket.status === 'active' ? (
                              <span style={{ fontSize: '0.72rem', color: 'var(--gold)', background: 'rgba(253, 203, 110, 0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                Active
                              </span>
                            ) : ticket.status === 'won' ? (
                              <span style={{ fontSize: '0.72rem', color: 'var(--success)', background: 'rgba(0, 184, 148, 0.1)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                Won ₹{ticket.prize_amount}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                                Lost
                              </span>
                            )}
                          </div>
                          <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Price: ₹{ticket.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
          {/* User balance cards */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Available Earning Balance</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>₹{user?.walletBalance.toFixed(2)}</h2>
              </div>
              <div 
                style={{ textAlign: 'right', cursor: 'pointer' }}
                onClick={() => setShowMeProfitDetailsPage(true)}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Total Profit ⚡</span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--success)' }}>
                  ₹{totalProfit.toFixed(2)}
                </h3>
                <span style={{ fontSize: '0.6rem', color: 'var(--accent-secondary)', display: 'block' }}>(Click for breakdown)</span>
              </div>
            </div>
            
            <div 
              style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setShowPrincipalDetailsPage(true)}
            >
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Subscribed Principal Balance</span>
                <div style={{ fontSize: '0.65rem', color: 'var(--accent-secondary)', marginTop: '2px' }}>Click to view active schemes details</div>
              </div>
              <strong style={{ fontSize: '1.25rem', color: 'var(--accent-secondary)' }}>
                ₹{(user?.principalBalance !== undefined ? user.principalBalance : orders.reduce((acc, o) => acc + (o.status === 'active' && o.days_remaining > 0 ? o.price : 0), 0)).toFixed(2)}
              </strong>
            </div>

            {/* Admin Dashboard Entry (visible ONLY to username === 'admin' or 'atifk') */}
            {(user?.role === 'admin' || user?.username === 'admin' || user?.username === 'atifk') && (
              <button
                onClick={() => setActiveTab('admin')}
                className="gradient-btn interactive-card"
                style={{ padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}
              >
                <Lock size={16} /> Open Admin Control Panel
              </button>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
              <div
                onClick={() => { setShowDepositDetailsPage(true); setUserDepositPage(1); }}
                className="interactive-card"
                style={{ padding: '8px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.01)', border: '1px solid transparent', transition: 'all 0.2s' }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowDownLeft size={12} color="var(--success)" /> Today's Deposit
                </span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)' }}>
                  ₹{(user?.todayDeposit !== undefined ? user.todayDeposit : txHistory.reduce((acc, t) => {
                    const isToday = new Date(t.created_at).toDateString() === new Date().toDateString();
                    return (isToday && t.type === 'deposit' && t.status === 'completed') ? acc + t.amount : acc;
                  }, 0)).toFixed(2)}
                </div>
              </div>

              <div
                onClick={() => { setShowWithdrawalDetailsPage(true); setUserWithdrawalPage(1); }}
                className="interactive-card"
                style={{ padding: '8px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.01)', border: '1px solid transparent', transition: 'all 0.2s' }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ArrowUpRight size={12} color="var(--error)" /> Today's Withdrawal
                </span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--error)' }}>
                  ₹{(user?.todayWithdrawal !== undefined ? user.todayWithdrawal : Math.abs(txHistory.reduce((acc, t) => {
                    const isToday = new Date(t.created_at).toDateString() === new Date().toDateString();
                    return (isToday && t.type === 'withdrawal') ? acc + t.amount : acc;
                  }, 0))).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(0, 0, 0, 0.03)', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }} className="gradient-text">
              🎮 Activity
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Spin Button */}
              <button
                onClick={() => {
                  setActivityView('spin');
                  fetchSpinData();
                }}
                className="interactive-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 8px',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--accent-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                }}
              >
                <span style={{ fontSize: '1.8rem' }}>🎡</span>
                <span>Spin Wheel</span>
              </button>

              {/* Lottery Button */}
              <button
                onClick={() => {
                  setActivityView('lottery');
                  fetchLotteryData();
                }}
                className="interactive-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 8px',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--accent-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--glass-border)';
                }}
              >
                <span style={{ fontSize: '1.8rem' }}>🎟️</span>
                <span>Lottery</span>
              </button>
            </div>
          </div>

          {/* Your Investment Schemes */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }} className="gradient-text">Your Subscribed Schemes</h3>
            {orders.filter(order => order.status !== 'cancelled' && order.status !== 'failed').length === 0 ? (
              <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                You have no active investment schemes yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                {orders.filter(order => order.status !== 'cancelled' && order.status !== 'failed').map((order) => {
                  let statusBg = 'rgba(255,255,255,0.05)';
                  let statusColor = 'var(--text-secondary)';
                  let statusLabel = 'Completed';

                  if (order.status === 'pending') {
                    statusBg = 'rgba(253, 203, 110, 0.15)';
                    statusColor = '#fdcb6e';
                    statusLabel = 'Pending';
                  } else if (order.status === 'confirmation_pending') {
                    statusBg = 'rgba(9, 132, 227, 0.15)';
                    statusColor = '#0984e3';
                    statusLabel = 'Confirmation Pending';
                  } else if (order.status === 'active' || order.status === 'expired_pending_match') {
                    statusBg = 'rgba(0, 184, 148, 0.1)';
                    statusColor = 'var(--success)';
                    statusLabel = 'Active';
                  } else if (order.status === 'cancelled') {
                    statusBg = 'rgba(255, 118, 117, 0.1)';
                    statusColor = 'var(--error)';
                    statusLabel = 'Cancelled';
                  } else if (order.status === 'failed') {
                    statusBg = 'rgba(255, 118, 117, 0.1)';
                    statusColor = 'var(--error)';
                    statusLabel = 'Failed';
                  } else if (order.status === 'rejected') {
                    statusBg = 'rgba(255, 118, 117, 0.1)';
                    statusColor = 'var(--error)';
                    statusLabel = 'Rejected';
                  }

                  return (
                    <div
                      key={order.id}
                      className={`glass-panel ${order.status === 'pending' ? 'interactive-card' : ''}`}
                      onClick={order.status === 'pending' ? () => handleReopenPendingPayment(order) : undefined}
                      style={{
                        padding: '16px',
                        borderLeft: `3px solid ${statusColor}`,
                        cursor: order.status === 'pending' ? 'pointer' : 'default'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h4 style={{ fontWeight: 600 }}>{order.scheme_name}</h4>
                        <span style={{
                          fontSize: '0.75rem',
                          background: statusBg,
                          color: statusColor,
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {statusLabel}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div>Investment: <strong>₹{order.price}</strong></div>
                        <div>Daily Return: <strong style={{ color: 'var(--success)' }}>₹{order.daily_income.toFixed(2)}</strong></div>
                        {order.status === 'active' && <div>Days Remaining: <strong>{order.days_remaining} Days</strong></div>}
                        <div>UTR ID: <strong style={{ color: 'var(--accent-secondary)' }}>{order.utr}</strong></div>
                        <div>Purchased: <strong>{new Date(order.created_at).toLocaleDateString()}</strong></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Support & Community Section */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }} className="gradient-text">Support & Community</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href="https://t.me/+GclayxaTZac3MDg1"
                target="_blank"
                rel="noreferrer"
                className="interactive-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  textDecoration: 'none',
                  color: 'var(--text-primary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={18} style={{ color: 'var(--accent-secondary)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Telegram Community</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Join official channel for updates</div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
              </a>

              <a
                href="https://t.me/+YSVlbfIVF3U2NGVl"
                target="_blank"
                rel="noreferrer"
                className="interactive-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  border: '1px solid var(--glass-border)',
                  textDecoration: 'none',
                  color: 'var(--text-primary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={18} style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Help Center</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Get 24/7 support & assistance</div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
              </a>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }} className="gradient-text">🔒 Change Password</h3>
            
            {passwordChangeMessage.text && (
              <div style={{
                background: passwordChangeMessage.type === 'success' ? 'rgba(0, 184, 148, 0.08)' : 'rgba(255, 118, 117, 0.08)',
                color: passwordChangeMessage.type === 'success' ? 'var(--success)' : 'var(--error)',
                padding: '10px', borderRadius: '8px', fontSize: '0.8rem', border: `1px solid ${passwordChangeMessage.type === 'success' ? 'rgba(0, 184, 148, 0.15)' : 'rgba(255, 118, 117, 0.15)'}`
              }}>
                {passwordChangeMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <button
                type="submit"
                className="gradient-btn"
                style={{ padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Update Password
              </button>
            </form>
          </div>

          {/* Logout Section */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }} className="gradient-text">🚪 Account Actions</h3>
            <button
              onClick={handleLogout}
              className="gradient-btn"
              style={{
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #ff7675 0%, #d63031 100%)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Logout from Account
            </button>
          </div>

          {/* App Download Link (visible ONLY on web platform) */}
          {apkDownloadUrl && typeof window !== 'undefined' && !(window.Capacitor && window.Capacitor.isNativePlatform()) && (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }} className="gradient-text">📱 Download APK</h3>
              <a
                href={getCleanApkUrl(apkDownloadUrl)}
                className="gradient-btn interactive-card"
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  textDecoration: 'none',
                  color: '#fff',
                  cursor: 'pointer'
                }}
                download="FastPay.apk"
              >
                Download APK Now
              </a>
              <span
                onClick={() => setShowDownloadHelp(true)}
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textAlign: 'center',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--accent-secondary)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
              >
                Problems downloading? View Guide & Mirror
              </span>
            </div>
          )}
            </>
          )}
        </div>
      )}

      {/* --- TAB 6: ADMIN CONSOLE --- */}
      {activeTab === 'admin' && (
        <div
          className="animate-fade-in"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            padding: '24px 20px',
            borderRadius: '6px',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)'
          }}
        >

          {/* Header (Screenshot Style - Light Version) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--accent-secondary)', letterSpacing: '2px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>• SYSTEM CONTROL BOARD</span>
            </div>
            <button
              onClick={() => { setActiveTab('me'); setAdminExpandedUser(null); }}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '8px 16px', borderRadius: '4px', color: 'var(--error)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={14} /> Disconnect
            </button>
          </div>

          {/* Navigation Tabs (Screenshot Style - Light Version) */}
          {adminView === 'dashboard' && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', borderBottom: '1px solid var(--glass-border)' }}>
              {[
                { id: 'overview', label: 'Platform Overview' },
                { id: 'users', label: 'User Management' },
                { id: 'referral-tasks', label: 'Referral Reward Tasks' },
                { id: 'spin-management', label: 'Spin Management' },
                { id: 'lottery-management', label: 'Lottery Control' },
                { id: 'transactions', label: 'Transaction Resolving' },
                { id: 'orders', label: 'Scheme Purchases' },
                { id: 'schemes', label: 'Investment Schemes' },
                { id: 'withdrawals', label: 'Withdrawal Manager' },
                { id: 'pwa-settings', label: 'PWA Settings' },
                { id: 'payment-accounts', label: 'Payment Accounts' },
                { id: 'notifications', label: `Notifications (${adminNotifications.filter(n => !n.is_read).length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setAdminActiveSubTab(tab.id);
                    setAdminExpandedUser(null);
                    setAdminView('dashboard');
                  }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '4px',
                    background: adminActiveSubTab === tab.id ? 'var(--accent-secondary)' : 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    color: adminActiveSubTab === tab.id ? '#000' : 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    fontFamily: 'monospace'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Dedicated Sub-Page: User Profile */}
          {adminView === 'user-profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">👤 User Profile Dashboard</h3>
                <button
                  onClick={() => { setAdminView('dashboard'); setAdminUserProfileData(null); }}
                  className="form-input"
                  style={{ width: 'auto', background: 'var(--bg-secondary)', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  ← Back to Users
                </button>
              </div>

              {adminUserProfileLoading || !adminUserProfileData ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Loading user profile analytics...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Basic Details & Wallet Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Basic Details Card */}
                    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 700 }}>📋 BASIC INFORMATION</span>
                      <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>User ID:</span><strong>{adminUserProfileData.basic.id}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Username:</span><strong>{adminUserProfileData.basic.username}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Phone:</span><strong>{adminUserProfileData.basic.phone}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Email:</span><strong>{adminUserProfileData.basic.email || 'N/A'}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Referral Code:</span><strong>{adminUserProfileData.basic.referralCode}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Referred By:</span><strong>{adminUserProfileData.basic.referredBy}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Joined Date:</span><strong>{new Date(adminUserProfileData.basic.createdAt).toLocaleString()}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                          <span style={{
                            color: adminUserProfileData.basic.status === 'Active' ? 'var(--success)' : 'var(--error)',
                            fontWeight: 700
                          }}>{adminUserProfileData.basic.status}</span>
                        </div>
                      </div>
                      
                      {/* Action buttons inside Profile */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button
                          onClick={async () => {
                            const action = adminUserProfileData.basic.status === 'Suspended' ? 'unsuspendUser' : 'suspendUser';
                            await handleAdminAction(action, { userId: adminUserProfileData.basic.id });
                            fetchUserProfileDetails(adminUserProfileData.basic.id);
                            fetchAdminData();
                          }}
                          className="form-input"
                          style={{
                            flex: 1,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '8px',
                            background: adminUserProfileData.basic.status === 'Suspended' ? 'rgba(0,184,148,0.15)' : 'rgba(255,118,117,0.15)',
                            color: adminUserProfileData.basic.status === 'Suspended' ? 'var(--success)' : 'var(--error)',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '6px'
                          }}
                        >
                          {adminUserProfileData.basic.status === 'Suspended' ? '✅ Reactivate Account' : '🚫 Suspend Account'}
                        </button>
                      </div>
                    </div>

                    {/* Wallet Stats Card */}
                    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700 }}>💰 WALLET & FINANCIAL STATS</span>
                      <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Wallet Balance:</span><strong style={{ color: 'var(--success)' }}>₹{adminUserProfileData.wallet.balance.toFixed(2)}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Total Deposit:</span><strong>₹{adminUserProfileData.wallet.totalDeposit.toFixed(2)}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Total Withdrawal:</span><strong>₹{adminUserProfileData.wallet.totalWithdrawal.toFixed(2)}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Total Profit:</span><strong>₹{adminUserProfileData.wallet.totalProfit.toFixed(2)}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Active Investment:</span><strong>₹{adminUserProfileData.wallet.activeInvestment.toFixed(2)}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Referral Income:</span><strong>₹{adminUserProfileData.wallet.referralIncome.toFixed(2)}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Pending Deposit:</span><strong>₹{adminUserProfileData.wallet.pendingIncome.toFixed(2)}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details & Orders Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#0984e3', fontWeight: 700 }}>🏦 BANK INFORMATION</span>
                      {adminUserProfileData.bankDetails ? (
                        <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Account Number:</span><strong>{adminUserProfileData.bankDetails.accountNumber}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Holder Name:</span><strong>{adminUserProfileData.bankDetails.accountName}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>IFSC Code:</span><strong>{adminUserProfileData.bankDetails.ifsc}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>UPI ID:</span><strong>{adminUserProfileData.bankDetails.upiId || 'N/A'}</strong></div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '10px' }}>
                          No bank account linked yet.
                        </div>
                      )}
                    </div>

                    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#ff7675', fontWeight: 700 }}>🛒 ORDERS & PLANS STATE</span>
                      <div style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Total:</span> <strong>{adminUserProfileData.ordersCount.total}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Active:</span> <strong>{adminUserProfileData.ordersCount.active}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Pending:</span> <strong>{adminUserProfileData.ordersCount.pending}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Completed:</span> <strong>{adminUserProfileData.ordersCount.completed}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Cancelled:</span> <strong>{adminUserProfileData.ordersCount.cancelled}</strong></div>
                        <div><span style={{ color: 'var(--text-secondary)' }}>Failed:</span> <strong>{adminUserProfileData.ordersCount.failed}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Investment History */}
                  <div className="glass-panel" style={{ padding: '16px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 700, display: 'block', marginBottom: '10px' }}>📈 SCHEME SUBSCRIPTION HISTORY</span>
                    {adminUserProfileData.investments.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '10px' }}>No subscriptions found.</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                              <th style={{ padding: '6px' }}>Scheme Name</th>
                              <th style={{ padding: '6px' }}>Amount</th>
                              <th style={{ padding: '6px' }}>Daily Payout</th>
                              <th style={{ padding: '6px' }}>Days Left</th>
                              <th style={{ padding: '6px' }}>Status</th>
                              <th style={{ padding: '6px' }}>Purchased At</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminUserProfileData.investments.map((inv) => {
                              const isClickable = inv.status === 'active' || inv.status === 'confirmation_pending' || inv.status === 'pending';
                              return (
                                <tr 
                                  key={inv.id} 
                                  onClick={isClickable ? () => {
                                    setAdminSelectedOrder(inv);
                                    setOrderRejectionReason('');
                                    setAdminView('admin-order-detail');
                                  } : undefined}
                                  className={isClickable ? "interactive-card" : ""}
                                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: isClickable ? 'pointer' : 'default' }}
                                >
                                  <td style={{ padding: '8px 6px', fontWeight: 600 }}>{inv.name}</td>
                                  <td style={{ padding: '8px 6px' }}>₹{inv.price.toFixed(2)}</td>
                                  <td style={{ padding: '8px 6px', color: 'var(--success)' }}>₹{inv.daily_income.toFixed(2)}</td>
                                  <td style={{ padding: '8px 6px' }}>{inv.days_remaining} days</td>
                                  <td style={{ padding: '8px 6px' }}>
                                    <span style={{
                                      color: inv.status === 'active' ? 'var(--success)' : inv.status === 'pending' || inv.status === 'confirmation_pending' ? 'var(--gold)' : 'var(--text-secondary)',
                                      textTransform: 'capitalize',
                                      fontWeight: 700
                                    }}>{inv.status === 'confirmation_pending' ? 'Confirmation Pending' : inv.status}</span>
                                  </td>
                                  <td style={{ padding: '8px 6px' }}>{new Date(inv.created_at).toLocaleDateString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Deposits & Withdrawals Tables */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Deposits List */}
                    <div className="glass-panel" style={{ padding: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700, display: 'block', marginBottom: '10px' }}>💸 DEPOSIT HISTORY</span>
                      {adminUserProfileData.deposits.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '10px' }}>No deposits logged.</div>
                      ) : (
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '4px' }}>Amount</th>
                                <th style={{ padding: '4px' }}>UTR</th>
                                <th style={{ padding: '4px' }}>Screenshot</th>
                                <th style={{ padding: '4px' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminUserProfileData.deposits.map((d) => (
                                <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td style={{ padding: '6px 4px' }}>₹{d.amount.toFixed(2)}</td>
                                  <td style={{ padding: '6px 4px', fontFamily: 'monospace' }}>{d.utr || 'N/A'}</td>
                                  <td style={{ padding: '6px 4px' }}>
                                    {isValidScreenshot(d.screenshot) && !brokenImages[d.id] ? (
                                      <img
                                        src={getScreenshotUrl(d.screenshot)}
                                        alt="Proof"
                                        onError={() => setBrokenImages(prev => ({ ...prev, [d.id]: true }))}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const w = window.open();
                                          w.document.write(`<img src="${getScreenshotUrl(d.screenshot)}" style="max-width:100%; max-height:100vh; display:block; margin:auto;">`);
                                          w.document.title = "Payment Receipt Screenshot";
                                        }}
                                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--glass-border)' }}
                                      />
                                    ) : (
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>No Screenshot</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '6px 4px' }}>
                                    <span style={{
                                      color: d.status === 'completed' ? 'var(--success)' : d.status === 'pending' ? 'var(--gold)' : 'var(--error)',
                                      fontWeight: 700
                                    }}>{d.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Withdrawals List */}
                    <div className="glass-panel" style={{ padding: '16px', gridColumn: 'span 2' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: 700, display: 'block', marginBottom: '10px' }}>💸 WITHDRAWAL HISTORY</span>
                      {adminUserProfileData.withdrawals.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '10px' }}>No withdrawals logged.</div>
                      ) : (
                        <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '6px' }}>Amount</th>
                                <th style={{ padding: '6px' }}>Bank / UPI Details</th>
                                <th style={{ padding: '6px' }}>Status</th>
                                <th style={{ padding: '6px' }}>UTR / Reference</th>
                                <th style={{ padding: '6px' }}>Requested</th>
                                <th style={{ padding: '6px' }}>Resolved</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminUserProfileData.withdrawals.map((w) => (
                                <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                  <td style={{ padding: '8px 6px', fontWeight: 600, color: 'var(--error)' }}>-₹{Math.abs(w.amount).toFixed(2)}</td>
                                  <td style={{ padding: '8px 6px', fontSize: '0.7rem' }}>
                                    {w.withdrawal_bank_name ? (
                                      <div>
                                        <strong>{w.withdrawal_bank_name}</strong><br/>
                                        A/C: {w.withdrawal_account_number}<br/>
                                        IFSC: {w.withdrawal_ifsc}
                                      </div>
                                    ) : w.withdrawal_upi_id ? (
                                      <div>UPI: {w.withdrawal_upi_id}</div>
                                    ) : 'N/A'}
                                  </td>
                                  <td style={{ padding: '8px 6px' }}>
                                    <span style={{
                                      color: w.status === 'completed' ? 'var(--success)' : w.status === 'pending' ? 'var(--gold)' : 'var(--error)',
                                      fontWeight: 700,
                                      textTransform: 'capitalize'
                                    }}>{w.status === 'completed' ? 'Paid' : w.status}</span>
                                  </td>
                                  <td style={{ padding: '8px 6px', fontSize: '0.7rem' }}>
                                    {w.status === 'completed' ? (
                                      <div>
                                        <strong>UTR:</strong> {w.utr || '—'}<br/>
                                        <span style={{ color: 'var(--text-secondary)' }}>by {w.approved_by_admin_username || 'Admin'}</span>
                                      </div>
                                    ) : w.status === 'failed' || w.status === 'rejected' ? (
                                      <div style={{ color: 'var(--error)' }}>
                                        <strong>Rejected:</strong> {w.rejection_reason || 'No reason'}
                                      </div>
                                    ) : '—'}
                                  </td>
                                  <td style={{ padding: '8px 6px' }}>{new Date(w.created_at).toLocaleString()}</td>
                                  <td style={{ padding: '8px 6px' }}>
                                    {w.status !== 'pending' ? new Date(w.resolved_at || w.created_at).toLocaleString() : '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Referral Tree & Activity Logs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Referrals List */}
                    <div className="glass-panel" style={{ padding: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 700, display: 'block', marginBottom: '10px' }}>👥 REFERRAL TREE ({adminUserProfileData.referrals.count} Invited)</span>
                      {adminUserProfileData.referrals.list.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '10px' }}>No direct referrals found.</div>
                      ) : (
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {adminUserProfileData.referrals.list.map((ref, idx) => (
                              <div key={idx} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--glass-border)', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                  <strong>{ref.username}</strong>
                                  <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>({ref.phone})</span>
                                </div>
                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>₹{ref.balance.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Activity Logs */}
                    <div className="glass-panel" style={{ padding: '16px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#ffeaa7', fontWeight: 700, display: 'block', marginBottom: '10px' }}>📜 USER ACTIVITY LOGS</span>
                      <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {adminUserProfileData.activityLogs.map((log, idx) => (
                          <div key={idx} style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong style={{ color: 'var(--accent-secondary)' }}>{log.type}</strong>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>{new Date(log.date).toLocaleString()}</span>
                            </div>
                            <div style={{ color: 'var(--text-primary)' }}>{log.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dedicated Sub-Page: Combined Balance Ledger */}
          {adminView === 'combined-balance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">💰 Combined User Balances Ledger</h3>
                <button
                  onClick={() => setAdminView('dashboard')}
                  className="form-input"
                  style={{ width: 'auto', background: 'var(--bg-secondary)', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  ← Back to Dashboard
                </button>
              </div>

              {/* Combined Top Header Stat */}
              <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(0, 184, 148, 0.15) 0%, rgba(9, 132, 227, 0.1) 100%)', border: '1px solid rgba(0, 184, 148, 0.25)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '1px' }}>TOTAL PLATFORM LIABILITIES (COMBINED CURRENT BALANCE)</span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'monospace', margin: '8px 0' }}>
                  ₹{adminUsers.reduce((sum, u) => sum + u.wallet_balance, 0).toFixed(2)}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Combined balance of all registered system clients</span>
              </div>

              {/* Search, Sort, Filter inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Search user..."
                  className="form-input"
                  value={cbSearch}
                  onChange={(e) => { setCbSearch(e.target.value); setCbPage(1); }}
                  style={{ fontSize: '0.85rem' }}
                />
                <select
                  className="form-input"
                  value={cbFilter}
                  onChange={(e) => { setCbFilter(e.target.value); setCbPage(1); }}
                  style={{ fontSize: '0.85rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="all">📁 All User States</option>
                  <option value="active">🟢 Active Users Only</option>
                  <option value="suspended">🔴 Suspended Users Only</option>
                </select>
                <select
                  className="form-input"
                  value={cbSort}
                  onChange={(e) => { setCbSort(e.target.value); setCbPage(1); }}
                  style={{ fontSize: '0.85rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="balance-desc">💰 Balance: High to Low</option>
                  <option value="balance-asc">💰 Balance: Low to High</option>
                  <option value="username-asc">🔤 Username: A to Z</option>
                  <option value="deposit-desc">💳 Deposits: High to Low</option>
                </select>
              </div>

              {/* Data Table */}
              <div className="glass-panel" style={{ padding: '16px' }}>
                {(() => {
                  let list = adminUsers.filter(u => {
                    const matchesSearch = u.username.toLowerCase().includes(cbSearch.toLowerCase()) || u.phone.includes(cbSearch);
                    const matchesFilter = cbFilter === 'all' ? true : cbFilter === 'suspended' ? u.is_suspended : !u.is_suspended;
                    return matchesSearch && matchesFilter;
                  });

                  // Sorting
                  list = list.sort((a, b) => {
                    if (cbSort === 'balance-desc') return b.wallet_balance - a.wallet_balance;
                    if (cbSort === 'balance-asc') return a.wallet_balance - b.wallet_balance;
                    if (cbSort === 'username-asc') return a.username.localeCompare(b.username);
                    if (cbSort === 'deposit-desc') return b.stats.depositTotal - a.stats.depositTotal;
                    return 0;
                  });

                  // Pagination calculation
                  const pageSize = 10;
                  const totalPages = Math.ceil(list.length / pageSize) || 1;
                  const paginatedList = list.slice((cbPage - 1) * pageSize, cbPage * pageSize);

                  if (list.length === 0) {
                    return <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No matching users found.</div>;
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                              <th style={{ padding: '8px' }}>User Details</th>
                              <th style={{ padding: '8px' }}>Deposits</th>
                              <th style={{ padding: '8px' }}>Withdrawals</th>
                              <th style={{ padding: '8px' }}>Total Profits</th>
                              <th style={{ padding: '8px', textAlign: 'right' }}>Current Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedList.map((u) => (
                              <tr
                                key={u.id}
                                onClick={() => {
                                  setSelectedAdminUserId(u.id);
                                  fetchUserProfileDetails(u.id);
                                  setAdminView('user-profile');
                                }}
                                className="interactive-card"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                              >
                                <td style={{ padding: '10px 8px' }}>
                                  <div style={{ fontWeight: 700 }}>{u.username}</div>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ID: {u.id}</span>
                                </td>
                                <td style={{ padding: '10px 8px' }}>₹{u.stats.depositTotal.toFixed(2)}</td>
                                <td style={{ padding: '10px 8px' }}>₹{u.stats.withdrawalTotal.toFixed(2)}</td>
                                <td style={{ padding: '10px 8px', color: 'var(--success)' }}>₹{u.stats.commissionTotal.toFixed(2)}</td>
                                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                                  ₹{u.wallet_balance.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '10px', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Page {cbPage} of {totalPages} ({list.length} total users)</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            disabled={cbPage === 1}
                            onClick={() => setCbPage(prev => Math.max(1, prev - 1))}
                            className="form-input"
                            style={{ width: 'auto', padding: '4px 10px', background: cbPage === 1 ? 'transparent' : 'var(--bg-secondary)', cursor: cbPage === 1 ? 'default' : 'pointer', opacity: cbPage === 1 ? 0.4 : 1 }}
                          >
                            Prev
                          </button>
                          <button
                            disabled={cbPage === totalPages}
                            onClick={() => setCbPage(prev => Math.min(totalPages, prev + 1))}
                            className="form-input"
                            style={{ width: 'auto', padding: '4px 10px', background: cbPage === totalPages ? 'transparent' : 'var(--bg-secondary)', cursor: cbPage === totalPages ? 'default' : 'pointer', opacity: cbPage === totalPages ? 0.4 : 1 }}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Dedicated Sub-Page: Active Investment Value */}
          {adminView === 'active-investments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">📈 Active Investment Channels</h3>
                <button
                  onClick={() => setAdminView('dashboard')}
                  className="form-input"
                  style={{ width: 'auto', background: 'var(--bg-secondary)', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  ← Back to Dashboard
                </button>
              </div>

              {/* active investments header card */}
              {(() => {
                const activeOrders = adminOrders.filter(o => o.status === 'active' && o.days_remaining > 0);
                const totalActiveValue = activeOrders.reduce((sum, o) => sum + o.price, 0);
                const activeUsersSet = new Set(activeOrders.map(o => o.user_id));

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>TOTAL ACTIVE VALUE</span>
                      <strong style={{ fontSize: '1.4rem', color: 'var(--gold)', fontFamily: 'monospace' }}>₹{totalActiveValue.toFixed(2)}</strong>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>TOTAL ACTIVE CLIENTS</span>
                      <strong style={{ fontSize: '1.4rem', color: 'var(--success)', fontFamily: 'monospace' }}>{activeUsersSet.size} Users</strong>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>TOTAL ACTIVE PLANS</span>
                      <strong style={{ fontSize: '1.4rem', color: '#6c5ce7', fontFamily: 'monospace' }}>{activeOrders.length} Plans</strong>
                    </div>
                  </div>
                );
              })()}

              {/* Search, Filter, Sort inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Search user..."
                  className="form-input"
                  value={aiSearch}
                  onChange={(e) => { setAiSearch(e.target.value); setAiPage(1); }}
                  style={{ fontSize: '0.85rem' }}
                />
                <select
                  className="form-input"
                  value={aiFilter}
                  onChange={(e) => { setAiFilter(e.target.value); setAiPage(1); }}
                  style={{ fontSize: '0.85rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="all">📁 All Active Schemes</option>
                  <option value="5000">⚡ ₹5,000 Schemes</option>
                  <option value="10000">💎 ₹10,000 Schemes</option>
                </select>
                <select
                  className="form-input"
                  value={aiSort}
                  onChange={(e) => { setAiSort(e.target.value); setAiPage(1); }}
                  style={{ fontSize: '0.85rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="amount-desc">💰 Investment: High to Low</option>
                  <option value="days-asc">⏳ Days Remaining: Low to High</option>
                  <option value="date-desc">📅 Purchase Date: Newest First</option>
                </select>
              </div>

              {/* Data Table */}
              <div className="glass-panel" style={{ padding: '16px' }}>
                {(() => {
                  let list = adminOrders.filter(o => {
                    const isActive = o.status === 'active' && o.days_remaining > 0;
                    const matchesSearch = o.user_name.toLowerCase().includes(aiSearch.toLowerCase()) || o.user_phone.includes(aiSearch);
                    const matchesFilter = aiFilter === 'all' ? true : o.price.toString() === aiFilter;
                    return isActive && matchesSearch && matchesFilter;
                  });

                  // Sorting
                  list = list.sort((a, b) => {
                    if (aiSort === 'amount-desc') return b.price - a.price;
                    if (aiSort === 'days-asc') return a.days_remaining - b.days_remaining;
                    if (aiSort === 'date-desc') return new Date(b.created_at) - new Date(a.created_at);
                    return 0;
                  });

                  // Pagination calculation
                  const pageSize = 10;
                  const totalPages = Math.ceil(list.length / pageSize) || 1;
                  const paginatedList = list.slice((aiPage - 1) * pageSize, aiPage * pageSize);

                  if (list.length === 0) {
                    return <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No matching active investments found.</div>;
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                              <th style={{ padding: '8px' }}>User Details</th>
                              <th style={{ padding: '8px' }}>Plan Details</th>
                              <th style={{ padding: '8px' }}>Amount</th>
                              <th style={{ padding: '8px' }}>Daily return</th>
                              <th style={{ padding: '8px' }}>Days Remaining</th>
                              <th style={{ padding: '8px', textAlign: 'right' }}>Purchase Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedList.map((o) => (
                              <tr
                                key={o.id}
                                onClick={() => {
                                  setSelectedAdminUserId(o.user_id);
                                  fetchUserProfileDetails(o.user_id);
                                  setAdminView('user-profile');
                                }}
                                className="interactive-card"
                                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                              >
                                <td style={{ padding: '10px 8px' }}>
                                  <div style={{ fontWeight: 700 }}>{o.user_name}</div>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{o.user_phone}</span>
                                </td>
                                <td style={{ padding: '10px 8px' }}>{o.scheme_name}</td>
                                <td style={{ padding: '10px 8px', fontWeight: 600 }}>₹{o.price.toFixed(2)}</td>
                                <td style={{ padding: '10px 8px', color: 'var(--success)' }}>₹{o.daily_income.toFixed(2)}</td>
                                <td style={{ padding: '10px 8px' }}>{o.days_remaining} days</td>
                                <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                                  {new Date(o.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '10px', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Page {aiPage} of {totalPages} ({list.length} active plans)</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            disabled={aiPage === 1}
                            onClick={() => setAiPage(prev => Math.max(1, prev - 1))}
                            className="form-input"
                            style={{ width: 'auto', padding: '4px 10px', background: aiPage === 1 ? 'transparent' : 'var(--bg-secondary)', cursor: aiPage === 1 ? 'default' : 'pointer', opacity: aiPage === 1 ? 0.4 : 1 }}
                          >
                            Prev
                          </button>
                          <button
                            disabled={aiPage === totalPages}
                            onClick={() => setAiPage(prev => Math.min(totalPages, prev + 1))}
                            className="form-input"
                            style={{ width: 'auto', padding: '4px 10px', background: aiPage === totalPages ? 'transparent' : 'var(--bg-secondary)', cursor: aiPage === totalPages ? 'default' : 'pointer', opacity: aiPage === totalPages ? 0.4 : 1 }}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Dedicated Sub-Page: Order/Subscription Details (Verification or Simulation) */}
          {adminView === 'admin-order-detail' && adminSelectedOrder && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">📈 Subscription Verification</h3>
                <button
                  onClick={() => {
                    setAdminView('user-profile');
                  }}
                  className="form-input"
                  style={{ width: 'auto', background: 'var(--bg-secondary)', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  ← Back to Profile
                </button>
              </div>

              {adminSelectedOrder.status === 'confirmation_pending' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Left Column: Details */}
                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontWeight: 600, color: 'var(--gold)', fontSize: '0.95rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Payment Verification Details</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Selected Scheme:</span>
                        <strong>{adminSelectedOrder.name}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Investment Amount:</span>
                        <strong style={{ color: 'var(--accent-secondary)' }}>₹{adminSelectedOrder.price}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Assigned Bank Account:</span>
                        <strong>{adminSelectedOrder.virtual_account || 'N/A'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Assigned UPI ID:</span>
                        <strong>{adminSelectedOrder.virtual_upi || 'N/A'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Submitted UTR:</span>
                        <strong style={{ color: 'var(--accent-secondary)', letterSpacing: '0.5px' }}>{adminSelectedOrder.utr}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Submission Date:</span>
                        <strong>{new Date(adminSelectedOrder.created_at).toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Current Status:</span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(253, 203, 110, 0.1)', color: 'var(--gold)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          Confirmation Pending
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: '10px', borderTop: '1px solid var(--glass-border)', paddingTop: '15px' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Rejection Reason (required if rejecting)</label>
                      <textarea
                        className="form-input"
                        placeholder="Enter reason for rejecting this payment"
                        value={orderRejectionReason}
                        onChange={(e) => setOrderRejectionReason(e.target.value)}
                        style={{ height: '70px', resize: 'none', fontSize: '0.8rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button
                        onClick={() => handleApproveOrder(adminSelectedOrder.id, 'approve')}
                        className="gradient-btn"
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700 }}
                      >
                        Approve Payment
                      </button>
                      <button
                        onClick={() => {
                          if (!orderRejectionReason.trim()) {
                            alert('Please enter a rejection reason.');
                            return;
                          }
                          handleApproveOrder(adminSelectedOrder.id, 'reject', orderRejectionReason);
                        }}
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'none', border: '1px solid var(--error)', color: 'var(--error)', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 700 }}
                      >
                        Reject Payment
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Screenshot & QR */}
                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.95rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Uploaded Proof & QR Code</h4>
                    {isValidScreenshot(adminSelectedOrder.screenshot) && !brokenImages[adminSelectedOrder.id] ? (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Payment Screenshot:</span>
                        <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', textAlign: 'center' }}>
                          <img
                            src={getScreenshotUrl(adminSelectedOrder.screenshot)}
                            alt="Receipt"
                            onError={() => setBrokenImages(prev => ({ ...prev, [adminSelectedOrder.id]: true }))}
                            onClick={() => {
                              const w = window.open();
                              w.document.write(`<img src="${getScreenshotUrl(adminSelectedOrder.screenshot)}" style="max-width:100%; max-height:100vh; display:block; margin:auto;">`);
                              w.document.title = "Payment Receipt";
                            }}
                            style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        No Screenshot Uploaded
                      </div>
                    )}

                    {(adminSelectedOrder.virtual_qr_code || adminSelectedOrder.virtual_upi) && (
                      <div style={{ marginTop: '10px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Assigned Account QR:</span>
                        <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', width: '120px', height: '120px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img
                            src={adminSelectedOrder.virtual_qr_code ? adminSelectedOrder.virtual_qr_code : `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`upi://pay?pa=${adminSelectedOrder.virtual_upi}&pn=FastPay&am=${adminSelectedOrder.price}&cu=INR`)}`}
                            alt="QR Code"
                            style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {adminSelectedOrder.status === 'pending' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Left Column: Details */}
                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontWeight: 600, color: 'var(--gold)', fontSize: '0.95rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Pending Payment Page (Simulated)</h4>
                    
                    {/* Remaining Timer */}
                    {(() => {
                      const createdAt = new Date(adminSelectedOrder.created_at);
                      const now = new Date();
                      const elapsedSecs = Math.floor((now - createdAt) / 1000);
                      const remainingSecs = Math.max(0, 900 - elapsedSecs);
                      
                      return remainingSecs > 0 ? (
                        <div style={{ padding: '10px', background: 'rgba(0, 206, 201, 0.1)', border: '1px solid rgba(0, 206, 201, 0.2)', borderRadius: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', letterSpacing: '0.5px' }}>REMAINING TIMEOUT (SIMULATED)</span>
                          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '2px' }}>
                            {formatTimerValue(remainingSecs)}
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '10px', background: 'rgba(255, 118, 117, 0.1)', border: '1px solid rgba(255, 118, 117, 0.2)', borderRadius: '10px', textAlign: 'center', color: 'var(--error)', fontSize: '0.8rem' }}>
                          <strong>Expired:</strong> 15-minute payment window has expired.
                        </div>
                      );
                    })()}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Selected Scheme:</span>
                        <strong>{adminSelectedOrder.name}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Payment Amount:</span>
                        <strong style={{ color: 'var(--accent-secondary)', fontSize: '1.05rem' }}>₹{adminSelectedOrder.price}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Submission Date:</span>
                        <strong>{new Date(adminSelectedOrder.created_at).toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(253, 203, 110, 0.1)', color: 'var(--gold)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          Pending Payment
                        </span>
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', marginTop: '10px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--accent-secondary)', marginBottom: '4px' }}>Assigned Bank Account details:</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Beneficiary Name:</span>
                        <strong>{adminSelectedOrder.virtual_beneficiary || 'FastPay Ecosystem'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Bank Name:</span>
                        <strong>{adminSelectedOrder.virtual_bank || 'Axis Bank'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Account Number:</span>
                        <strong>{adminSelectedOrder.virtual_account || 'N/A'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>IFSC Code:</span>
                        <strong>{adminSelectedOrder.virtual_ifsc || 'N/A'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>UPI ID:</span>
                        <strong>{adminSelectedOrder.virtual_upi || 'N/A'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: QR and Instructions */}
                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
                    {(adminSelectedOrder.virtual_qr_code || adminSelectedOrder.virtual_upi) && (
                      <>
                        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                          Assigned UPI QR Code:
                        </div>

                        <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', width: '180px', height: '180px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img
                            src={adminSelectedOrder.virtual_qr_code ? adminSelectedOrder.virtual_qr_code : `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=${adminSelectedOrder.virtual_upi}&pn=FastPay&am=${adminSelectedOrder.price}&cu=INR`)}`}
                            alt="QR Code"
                            style={{ width: '160px', height: '160px', objectFit: 'contain' }}
                          />
                        </div>
                      </>
                    )}

                    <div style={{ border: '1px solid rgba(253, 203, 110, 0.2)', background: 'rgba(253, 203, 110, 0.05)', padding: '12px', borderRadius: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      <strong style={{ color: 'var(--gold)', display: 'block', marginBottom: '4px' }}>Payment Instructions:</strong>
                      1. Scan the QR code or copy bank details to pay.<br />
                      2. Complete the payment within the 15-minute window.<br />
                      3. Input the 12-digit transaction UTR number and upload the receipt image to request verification.
                    </div>
                  </div>
                </div>
              )}

              {adminSelectedOrder.status === 'active' && (
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontWeight: 600, color: 'var(--success)', fontSize: '0.95rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>Active Investment Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Selected Scheme:</span>
                        <strong>{adminSelectedOrder.name}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Investment Price:</span>
                        <strong>₹{adminSelectedOrder.price}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Daily Returns:</span>
                        <strong style={{ color: 'var(--success)' }}>₹{adminSelectedOrder.daily_income}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Days Remaining:</span>
                        <strong>{adminSelectedOrder.days_remaining} Days</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Purchase Date:</span>
                        <strong>{new Date(adminSelectedOrder.created_at).toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(0, 184, 148, 0.1)', color: 'var(--success)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          Active
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Verified UTR ID:</span>
                        <strong style={{ color: 'var(--accent-secondary)' }}>{adminSelectedOrder.utr}</strong>
                      </div>
                      {adminSelectedOrder.screenshot && (
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Verified Payment Proof:</span>
                          <div style={{ border: '1px solid var(--glass-border)', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', textAlign: 'center', width: 'fit-content' }}>
                            <img
                              src={adminSelectedOrder.screenshot}
                              alt="Receipt"
                              onClick={() => {
                                const w = window.open();
                                w.document.write(`<img src="${adminSelectedOrder.screenshot}" style="max-width:100%; max-height:100vh; display:block; margin:auto;">`);
                                w.document.title = "Verified Payment Proof";
                              }}
                              style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: Platform Overview (Screenshot Style - Light Version) */}
          {adminActiveSubTab === 'overview' && adminView === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Stats cards grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div 
                  onClick={() => { setAdminActiveSubTab('users'); setAdminView('dashboard'); }}
                  className="glass-panel interactive-card"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>REGISTERED ACCOUNTS</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace', margin: '8px 0' }}>
                    {adminStats.totalUsers}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    <span>Target Clients</span>
                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>Live SQLite db</span>
                  </div>
                </div>

                <div 
                  onClick={() => { setCbPage(1); setCbSearch(''); setCbFilter('all'); setAdminView('combined-balance'); }}
                  className="glass-panel interactive-card"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(0, 184, 148, 0.4)', padding: '16px', borderRadius: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>COMBINED USER BALANCES</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace', margin: '8px 0' }}>
                    ₹{adminStats.totalUserBalances.toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    <span>Total Liabilities</span>
                    <span style={{ color: '#6c5ce7', fontWeight: 600 }}>Platform Capital</span>
                  </div>
                </div>

                <div 
                  onClick={() => { setAiPage(1); setAiSearch(''); setAiFilter('all'); setAdminView('active-investments'); }}
                  className="glass-panel interactive-card"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(253, 203, 110, 0.4)', padding: '16px', borderRadius: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>ACTIVE INVESTMENT VALUE</span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace', margin: '8px 0' }}>
                    ₹{adminStats.activeInvestments.toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    <span>Locked In Schemes</span>
                    <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Active orders</span>
                  </div>
                </div>
              </div>

              {/* Heading */}
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '10px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>Funding Channel Diagnostics</h3>

              {/* Diagnostics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--success)', padding: '20px', borderRadius: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>COMPLETED DEPOSITS</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'monospace', margin: '6px 0' }}>
                    ₹{adminStats.totalDeposits.toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    <span>Pending Deposits</span>
                    <span>{adminStats.pendingDepositsCount} reqs (₹{adminStats.pendingDepositsTotal.toFixed(0)})</span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--error)', padding: '20px', borderRadius: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>💸 Total Withdrawals Paid</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--error)', fontFamily: 'monospace', margin: '6px 0' }}>
                    ₹{adminStats.totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    <span>{adminStats.completedWithdrawalsCount || 0} Withdrawals Completed</span>
                    <span>Pending: {adminStats.pendingWithdrawalsCount}</span>
                  </div>
                </div>
              </div>

              {/* APK Settings Config Panel (Replaces Administrative Protocols) */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📱 App Download Link Configuration
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                  Specify the APK download URL link. This URL will be accessed by users when clicking "Download Now" in the Team section.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="e.g. /downloads/FastPay.apk"
                    className="form-input"
                    value={newApkDownloadUrl}
                    onChange={(e) => setNewApkDownloadUrl(e.target.value)}
                    style={{ flex: 1, fontSize: '0.8rem' }}
                  />
                  <button
                    onClick={handleSaveApkUrl}
                    className="gradient-btn"
                    style={{ width: 'auto', padding: '10px 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    Save URL
                  </button>
                </div>
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px', marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block' }}>
                    Or Upload APK File directly to server:
                  </span>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="file"
                      accept=".apk"
                      onChange={handleApkFileUpload}
                      disabled={apkUploadLoading}
                      style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flex: 1 }}
                    />
                    {apkUploadLoading && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', animation: 'pulse 1.5s infinite' }}>
                        Uploading...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    🔔 Recent Activity
                  </h3>
                  {adminNotifications.filter(n => !n.is_read).length > 0 && (
                    <span style={{ fontSize: '0.7rem', background: 'var(--error)', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                      {adminNotifications.filter(n => !n.is_read).length} new
                    </span>
                  )}
                </div>
                {adminNotifications.slice(0, 6).length === 0 ? (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '12px' }}>No recent activity.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {adminNotifications.slice(0, 6).map((notif, idx) => {
                      const actionEmoji = notif.action?.toLowerCase().includes('deposit') ? '💰'
                        : notif.action?.toLowerCase().includes('withdraw') ? '💸'
                        : notif.action?.toLowerCase().includes('scheme') || notif.action?.toLowerCase().includes('purchas') ? '📦'
                        : notif.action?.toLowerCase().includes('register') ? '👤'
                        : '🔔';
                      return (
                        <div key={notif._id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: notif.is_read ? 'var(--bg-secondary)' : 'rgba(108,92,231,0.08)', border: notif.is_read ? '1px solid var(--glass-border)' : '1px solid rgba(108,92,231,0.3)', borderRadius: '8px', padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '1rem' }}>{actionEmoji}</span>
                            <div>
                              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                <strong>{notif.username}</strong> — {notif.action}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                                ₹{notif.amount?.toFixed(2)} · {new Date(notif.created_at).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          {!notif.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6c5ce7', flexShrink: 0 }} />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Approve Transactions (Deposits / Withdrawals) */}
          {adminActiveSubTab === 'transactions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Manage Deposits & Withdrawals</h3>

               {/* Sub-Filters Selector */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {[
                  { id: 'pending', label: 'Pending Resolve' },
                  { id: 'withdrawals', label: 'Withdrawal Requests' },
                  { id: 'deposits', label: 'Deposits Log' },
                  { id: 'cancelled', label: 'Cancelled Log' }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => { setAdminTxFilter(sub.id); setTxPage(1); }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      background: adminTxFilter === sub.id ? 'var(--accent-secondary)' : 'var(--bg-secondary)',
                      color: adminTxFilter === sub.id ? '#000' : 'var(--text-primary)',
                      border: '1px solid var(--glass-border)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '6px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search by Support ID, Username, or Phone..."
                  value={adminSearchQuery}
                  onChange={(e) => { setAdminSearchQuery(e.target.value); setTxPage(1); }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {(() => {
                let filtered = adminTransactions;

                if (filtered.length === 0) {
                  return (
                    <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '6px' }}>
                      No items match this filter or search.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filtered.map((item) => {
                      const isOrder = !!item.scheme_name;
                      if (isOrder) {
                        const isExpanded = adminExpandedOrderId === item.id;
                        return (
                          <div
                            key={item.id}
                            className="glass-panel interactive-card"
                            onClick={() => setAdminExpandedOrderId(isExpanded ? null : item.id)}
                            style={{
                              padding: '16px',
                              cursor: 'pointer',
                              background: 'var(--bg-secondary)',
                              borderLeft: '3px solid var(--error)',
                              borderRadius: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <h4 style={{ fontWeight: 600 }}>{item.scheme_name}</h4>
                                <span style={{
                                  fontSize: '0.65rem',
                                  background: 'rgba(255, 118, 117, 0.1)',
                                  color: 'var(--error)',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  textTransform: 'capitalize',
                                  fontWeight: 600
                                }}>{item.status}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <strong style={{ color: 'var(--text-primary)' }}>₹{item.price}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  {isExpanded ? '▲' : '▼'}
                                </span>
                              </div>
                            </div>

                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              User: <strong>{item.user_name}</strong> ({item.user_phone}) {item.user_support_id && <>• ID: <strong style={{ color: '#a29bfe' }}>{item.user_support_id}</strong></>}
                            </div>

                            {isExpanded && (
                              <div
                                className="animate-fade-in"
                                style={{ marginTop: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                                  <div>Submitted UTR: <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{item.utr}</strong></div>
                                  <div>Date: {new Date(item.created_at).toLocaleString()}</div>
                                </div>
                                {isValidScreenshot(item.screenshot) && !brokenImages[item.id] ? (
                                  <div style={{ marginTop: '10px', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#a0a8c0', display: 'block', marginBottom: '4px' }}>Submitted Receipt:</span>
                                    <img
                                      src={getScreenshotUrl(item.screenshot)}
                                      alt="Receipt"
                                      onError={() => setBrokenImages(prev => ({ ...prev, [item.id]: true }))}
                                      onClick={() => {
                                        const w = window.open();
                                        w.document.write(`<img src="${getScreenshotUrl(item.screenshot)}" style="max-width:100%; max-height:100vh; display:block; margin:auto;">`);
                                      }}
                                      style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '6px', cursor: 'pointer' }}
                                    />
                                  </div>
                                ) : (
                                  <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                    No Screenshot Uploaded
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }

                      const isExpandedTx = adminExpandedTxId === item.id;
                      return (
                        <div
                          key={item.id}
                          className="glass-panel interactive-card"
                          onClick={() => setAdminExpandedTxId(isExpandedTx ? null : item.id)}
                          style={{
                            padding: '16px',
                            cursor: 'pointer',
                            background: 'var(--bg-secondary)',
                            borderTop: '1px solid var(--glass-border)',
                            borderRight: '1px solid var(--glass-border)',
                            borderBottom: '1px solid var(--glass-border)',
                            borderLeft: item.type === 'deposit' ? '3px solid var(--success)' : '3px solid var(--error)',
                            borderRadius: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize', color: 'var(--text-primary)' }}>{item.type}</span>
                              <span style={{
                                fontSize: '0.65rem',
                                background: item.status === 'completed' ? 'rgba(0, 184, 148, 0.1)' :
                                  item.status === 'pending' ? 'rgba(253, 203, 110, 0.1)' : 'rgba(255, 118, 117, 0.1)',
                                color: item.status === 'completed' ? 'var(--success)' :
                                  item.status === 'pending' ? 'var(--gold)' : 'var(--error)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                textTransform: 'capitalize',
                                fontWeight: 600
                              }}>{item.status}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <strong style={{ color: item.type === 'deposit' ? 'var(--success)' : 'var(--error)' }}>₹{Math.abs(item.amount).toFixed(2)}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {isExpandedTx ? '▲' : '▼'}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>User: <strong>{item.user_name}</strong> ({item.user_phone}) {item.user_support_id && <>• ID: <strong style={{ color: '#a29bfe' }}>{item.user_support_id}</strong></>}</div>
                            <div>Date: {new Date(item.created_at).toLocaleString()}</div>
                          </div>

                          {isExpandedTx && (
                            <div
                              className="animate-fade-in"
                              style={{ marginTop: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {item.utr && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                  Submitted UTR: <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{item.utr}</strong>
                                </div>
                              )}
                              {isValidScreenshot(item.screenshot) && !brokenImages[item.id] ? (
                                <div style={{ marginTop: '10px', marginBottom: '12px' }}>
                                  <span style={{ fontSize: '0.75rem', color: '#a0a8c0', display: 'block', marginBottom: '4px' }}>Submitted Receipt:</span>
                                  <img
                                    src={getScreenshotUrl(item.screenshot)}
                                    alt="Receipt"
                                    onError={() => setBrokenImages(prev => ({ ...prev, [item.id]: true }))}
                                    onClick={() => {
                                      const w = window.open();
                                      w.document.write(`<img src="${getScreenshotUrl(item.screenshot)}" style="max-width:100%; max-height:100vh; display:block; margin:auto;">`);
                                    }}
                                    style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '6px', cursor: 'pointer' }}
                                  />
                                </div>
                              ) : (
                                <div style={{ marginTop: '10px', marginBottom: '12px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                  No Screenshot Uploaded
                                </div>
                              )}

                              {(item.status === 'pending' || item.status === 'confirmation_pending') && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                  <button
                                    onClick={() => handleAdminAction('approveTransaction', { transactionId: item.id })}
                                    className="gradient-btn"
                                    style={{ flex: 1, padding: '8px', borderRadius: '4px', fontSize: '0.8rem' }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reason = prompt('Enter rejection reason (optional):');
                                      if (reason !== null) {
                                        handleAdminAction('rejectTransaction', { transactionId: item.id, rejectionReason: reason });
                                      }
                                    }}
                                    style={{ flex: 1, padding: '8px', borderRadius: '4px', background: 'none', border: '1px solid var(--error)', color: 'var(--error)', fontSize: '0.8rem', cursor: 'pointer' }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Pagination Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '10px', fontSize: '0.8rem', marginTop: '10px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Page {txPage} of {txTotalPages} ({adminTotalTransactionsCount} total records)</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          disabled={txPage === 1}
                          onClick={() => setTxPage(prev => Math.max(1, prev - 1))}
                          className="form-input"
                          style={{ width: 'auto', padding: '4px 10px', background: txPage === 1 ? 'transparent' : 'var(--bg-secondary)', cursor: txPage === 1 ? 'default' : 'pointer', opacity: txPage === 1 ? 0.4 : 1 }}
                        >
                          Prev
                        </button>
                        <button
                          disabled={txPage === txTotalPages}
                          onClick={() => setTxPage(prev => Math.min(txTotalPages, prev + 1))}
                          className="form-input"
                          style={{ width: 'auto', padding: '4px 10px', background: txPage === txTotalPages ? 'transparent' : 'var(--bg-secondary)', cursor: txPage === txTotalPages ? 'default' : 'pointer', opacity: txPage === txTotalPages ? 0.4 : 1 }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Section: Approve Orders (UTR Scheme subscriptions) */}
          {adminActiveSubTab === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Verify Scheme Purchases</h3>

              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '6px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search by Username or User ID..."
                  value={adminSearchQuery}
                  onChange={(e) => { setAdminSearchQuery(e.target.value); setOrdersPage(1); }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              {/* Sub-Filters Selector */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {[
                  { id: 'pending', label: 'Pending Verification' },
                  { id: 'active', label: 'Active/Completed Schemes' },
                  { id: 'cancelled', label: 'Cancelled/Rejected' }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => { setAdminOrderFilter(sub.id); setOrdersPage(1); }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: adminOrderFilter === sub.id ? 'var(--accent-secondary)' : 'var(--bg-tertiary)',
                      color: adminOrderFilter === sub.id ? '#000' : 'var(--text-primary)',
                      border: '1px solid var(--glass-border)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>

              {(() => {
                let filtered = adminOrders;

                if (filtered.length === 0) {
                  return (
                    <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      No orders match this filter or search.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filtered.map((order) => {
                      const isExpanded = adminExpandedOrderId === order.id;
                      
                      // Calculate profit and remaining time details
                      const totalDays = order.daily_income > 0 ? Math.round(order.total_payout / order.daily_income) : 3;
                      const elapsedDays = Math.max(0, totalDays - order.days_remaining);
                      const currentProfit = order.daily_income * elapsedDays;

                      const purchaseDate = new Date(order.created_at);
                      const maturityDate = new Date(purchaseDate.getTime() + totalDays * 24 * 60 * 60 * 1000);
                      const remainMs = Math.max(0, maturityDate.getTime() - nowTime);
                      const remainH = Math.floor(remainMs / 3600000);
                      const remainM = Math.floor((remainMs % 3600000) / 60000);

                      return (
                        <div
                          key={order.id}
                          className="glass-panel interactive-card"
                          onClick={() => setAdminExpandedOrderId(isExpanded ? null : order.id)}
                          style={{
                            padding: '16px',
                            cursor: 'pointer',
                            borderLeft: order.status === 'confirmation_pending' || order.status === 'pending' ? '3px solid var(--gold)' : order.status === 'active' ? '3px solid var(--success)' : '3px solid var(--error)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <h4 style={{ fontWeight: 600 }}>{order.scheme_name}</h4>
                              <span style={{
                                fontSize: '0.65rem',
                                background: order.status === 'active' ? 'rgba(0, 184, 148, 0.1)' :
                                  order.status === 'pending' || order.status === 'confirmation_pending' ? 'rgba(253, 203, 110, 0.1)' : 'rgba(255, 118, 117, 0.1)',
                                color: order.status === 'active' ? 'var(--success)' :
                                  order.status === 'pending' || order.status === 'confirmation_pending' ? 'var(--gold)' : 'var(--error)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                textTransform: 'capitalize',
                                fontWeight: 600
                              }}>{order.status === 'confirmation_pending' ? 'Confirmation Pending' : order.status === 'pending' ? 'Pending' : order.status}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <strong style={{ color: 'var(--accent-secondary)' }}>₹{order.price}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {isExpanded ? '▲' : '▼'}
                              </span>
                            </div>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            User: <strong>{order.user_name}</strong> ({order.user_phone}) • ID: <span style={{ fontFamily: 'monospace' }}>{order.user_id}</span>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Profit: <strong style={{ color: 'var(--success)' }}>₹{currentProfit.toFixed(2)}</strong> • 
                            Remaining: <strong>{order.days_remaining}d</strong> ({remainH}h {remainM}m left)
                          </div>

                          {isExpanded ? (
                            <div
                              className="animate-fade-in"
                              style={{ marginTop: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                                <div>Order ID: <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{order.id}</span></div>
                                <div>QR Token: <span style={{ fontFamily: 'monospace', color: 'var(--accent-secondary)' }}>{order.qr_token || 'N/A'}</span></div>
                                <div>QR Status: <strong style={{ textTransform: 'capitalize', color: order.qr_status === 'paid' ? 'var(--success)' : order.qr_status === 'expired' ? 'var(--error)' : 'var(--gold)' }}>{order.qr_status || 'pending'}</strong></div>
                                <div>QR Expiry: {order.qr_expiry_at ? new Date(order.qr_expiry_at).toLocaleString() : 'N/A'}</div>
                                {order.qr_paid_at && (
                                  <div>QR Paid Time: {new Date(order.qr_paid_at).toLocaleString()}</div>
                                )}
                                <div>Submitted UTR: <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{order.utr}</strong></div>
                                <div>Date: {new Date(order.created_at).toLocaleString()}</div>
                                {order.days_remaining !== undefined && (
                                  <div>Days Remaining: <strong>{order.days_remaining} Days</strong></div>
                                )}
                              </div>

                              {/* Screenshot displaying */}
                              {isValidScreenshot(order.screenshot) && !brokenImages[order.id] ? (
                                <div style={{ marginTop: '10px', marginBottom: '12px' }}>
                                  <span style={{ fontSize: '0.75rem', color: '#a0a8c0', display: 'block', marginBottom: '4px' }}>Submitted Receipt Screenshot:</span>
                                  <div style={{ position: 'relative', width: '100%', maxHeight: '180px', overflow: 'hidden', borderRadius: '8px', border: '1px solid #202736', cursor: 'pointer' }}>
                                    <img
                                      src={getScreenshotUrl(order.screenshot)}
                                      alt="Payment Receipt"
                                      onError={() => setBrokenImages(prev => ({ ...prev, [order.id]: true }))}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const w = window.open();
                                        w.document.write(`<img src="${getScreenshotUrl(order.screenshot)}" style="max-width:100%; max-height:100vh; display:block; margin:auto;">`);
                                        w.document.title = "Payment Receipt Screenshot";
                                      }}
                                      style={{ width: '100%', objectFit: 'contain', maxHeight: '180px' }}
                                    />
                                  </div>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', display: 'block', textAlign: 'center', marginTop: '4px' }}>(Click image to view full receipt)</span>
                                </div>
                              ) : (
                                <div style={{ marginTop: '10px', marginBottom: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                  No Screenshot Uploaded
                                </div>
                              )}

                              {order.status === 'confirmation_pending' && (
                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleApproveOrder(order.id, 'approve'); }}
                                    className="gradient-btn"
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleApproveOrder(order.id, 'reject'); }}
                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'none', border: '1px solid var(--error)', color: 'var(--error)', fontSize: '0.85rem', cursor: 'pointer' }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', marginTop: '6px', fontStyle: 'italic' }}>
                              ⚡ Click to view screenshot and verification details
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Section: Spin Management admin panel */}
          {adminActiveSubTab === 'spin-management' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Spin Wheel Management</h3>

              {adminSpinLoading || !adminSpinConfig || !adminSpinStats ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Loading spin configurations and stats...
                </div>
              ) : (
                <>
                  {/* Dashboard KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Total Spins Purchased</span>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{adminSpinStats.totalSpinsPurchased} Spins</strong>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Today's Revenue</span>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--success)' }}>₹{adminSpinStats.todayRevenue}</strong>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Today's Rewards Paid</span>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--accent-secondary)' }}>₹{adminSpinStats.todayRewardsPaid}</strong>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Remaining Reward Budget</span>
                      <strong style={{ fontSize: '1.25rem', color: adminSpinStats.remainingRewardBudget <= 0 ? 'var(--error)' : 'var(--success)' }}>
                        ₹{adminSpinStats.remainingRewardBudget}
                      </strong>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', gridColumn: 'span 2' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Active Users Spun Today</span>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{adminSpinStats.activeUsersToday} Users</strong>
                    </div>
                  </div>

                  {/* Config Form */}
                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--accent-secondary)' }}>⚙️ Configuration Parameters</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Spin Price (₹)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={adminSpinConfig.price}
                          onChange={(e) => setAdminSpinConfig({ ...adminSpinConfig, price: Number(e.target.value) })}
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Daily Limit per User</label>
                        <input
                          type="number"
                          className="form-input"
                          value={adminSpinConfig.daily_limit}
                          onChange={(e) => setAdminSpinConfig({ ...adminSpinConfig, daily_limit: Number(e.target.value) })}
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Daily Reward Budget (₹)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={adminSpinConfig.daily_budget}
                          onChange={(e) => setAdminSpinConfig({ ...adminSpinConfig, daily_budget: Number(e.target.value) })}
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Grand Prize (iPhone 17)</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => setAdminSpinConfig({ ...adminSpinConfig, iphone_enabled: true })}
                            className="interactive-card"
                            style={{
                              flex: 1, padding: '6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                              background: adminSpinConfig.iphone_enabled ? 'var(--success)' : 'var(--bg-secondary)',
                              color: adminSpinConfig.iphone_enabled ? '#000' : 'var(--text-secondary)',
                              border: '1px solid var(--glass-border)'
                            }}
                          >
                            Enabled
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminSpinConfig({ ...adminSpinConfig, iphone_enabled: false })}
                            className="interactive-card"
                            style={{
                              flex: 1, padding: '6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                              background: !adminSpinConfig.iphone_enabled ? 'var(--error)' : 'var(--bg-secondary)',
                              color: !adminSpinConfig.iphone_enabled ? '#fff' : 'var(--text-secondary)',
                              border: '1px solid var(--glass-border)'
                            }}
                          >
                            Disabled
                          </button>
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Event Start Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={adminSpinConfig.start_date ? adminSpinConfig.start_date.substring(0, 10) : ''}
                          onChange={(e) => setAdminSpinConfig({ ...adminSpinConfig, start_date: e.target.value })}
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Event End Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={adminSpinConfig.end_date ? adminSpinConfig.end_date.substring(0, 10) : ''}
                          onChange={(e) => setAdminSpinConfig({ ...adminSpinConfig, end_date: e.target.value })}
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reward Probability Weights table */}
                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--accent-secondary)' }}>📊 Reward Probabilities & Enablers</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {Object.entries(adminSpinConfig.rewards || {}).map(([key, item]) => (
                        <div key={key} className="interactive-card" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                          <div>
                            <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{item.label}</strong>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block' }}>Type: {item.type}</span>
                          </div>
                          <div>
                            <input
                              type="number"
                              className="form-input"
                              placeholder="Weight"
                              value={item.weight}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const updatedRewards = { ...adminSpinConfig.rewards };
                                updatedRewards[key].weight = val;
                                setAdminSpinConfig({ ...adminSpinConfig, rewards: updatedRewards });
                              }}
                              style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                            />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedRewards = { ...adminSpinConfig.rewards };
                                updatedRewards[key].enabled = !item.enabled;
                                setAdminSpinConfig({ ...adminSpinConfig, rewards: updatedRewards });
                              }}
                              className="gradient-btn"
                              style={{
                                padding: '6px', fontSize: '0.72rem', borderRadius: '4px', width: '100%',
                                background: item.enabled ? 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)' : 'linear-gradient(135deg, #ff7675 0%, #d63031 100%)'
                              }}
                            >
                              {item.enabled ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => saveAdminSpinConfig(adminSpinConfig)}
                      className="gradient-btn"
                      style={{ padding: '12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}
                    >
                      Save Settings & Probabilities
                    </button>
                  </div>

                  {/* Grand Prize fulfillment section */}
                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--accent-secondary)' }}>🏆 Grand Prize (iPhone 17) Winners</h4>
                    {adminSpinStats.prizeWinners.length === 0 ? (
                      <div style={{ padding: '10px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        No grand prize wins recorded yet.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {adminSpinStats.prizeWinners.map((winner) => (
                          <div key={winner.id} className="interactive-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.8rem' }}>
                            <div>
                              <strong style={{ color: 'var(--text-primary)' }}>{winner.username}</strong>
                              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Phone: {winner.phone}</span>
                              <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Won: {new Date(winner.date).toLocaleString()}</span>
                            </div>
                            <div>
                              {winner.status === 'fulfilled' ? (
                                <span style={{
                                  fontSize: '0.75rem', color: 'var(--success)', background: 'rgba(0, 184, 148, 0.1)', padding: '4px 10px', borderRadius: '4px', fontWeight: 700
                                }}>
                                  Fulfilled
                                </span>
                              ) : (
                                <button
                                  onClick={() => fulfillGrandPrize(winner.id)}
                                  className="gradient-btn"
                                  style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}
                                >
                                  Mark Fulfilled
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Section: Lottery Control admin panel */}
          {adminActiveSubTab === 'lottery-management' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Lottery Control Board</h3>

              {adminLotteryLoading || !adminLotteryConfig || !adminLotteryStats ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Loading lottery configuration and statistics...
                </div>
              ) : (
                <>
                  {/* Dashboard KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Total Tickets Sold (Global)</span>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{adminLotteryStats.totalSoldTickets} Tickets</strong>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Total Revenue (Global)</span>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--success)' }}>₹{adminLotteryStats.totalRevenue}</strong>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Total Prizes Paid (Global)</span>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--accent-secondary)' }}>₹{adminLotteryStats.totalPrizesPaid}</strong>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Total Participants (Global)</span>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--gold)' }}>{adminLotteryStats.totalParticipantsCount} Users</strong>
                    </div>

                    <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', gridColumn: 'span 2', background: 'rgba(0, 206, 201, 0.03)', border: '1px solid rgba(0, 206, 201, 0.15)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        Active Draw: Week {adminLotteryConfig.week_number}
                      </span>
                      <strong style={{ fontSize: '1.25rem', color: adminLotteryConfig.status === 'open' ? 'var(--success)' : adminLotteryConfig.status === 'closed' ? 'var(--error)' : 'var(--gold)' }}>
                        {adminLotteryConfig.status === 'open' ? '🟢 Open (Sales Active)' : adminLotteryConfig.status === 'closed' ? '🔴 Closed (Sales Suspended)' : '⚪ Draw Completed'}
                      </strong>
                      {adminLotteryConfig.winning_code && (
                        <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                          Winning Ticket Number: <strong style={{ color: 'var(--gold)', fontSize: '1rem', fontFamily: 'monospace' }}>#{adminLotteryConfig.winning_code}</strong>
                          {adminLotteryConfig.draw_date && ` drawn on ${new Date(adminLotteryConfig.draw_date).toLocaleDateString()}`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Config Form */}
                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--accent-secondary)' }}>⚙️ Configuration Parameters</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ticket Price (₹)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={adminLotteryConfig.ticket_price || 100}
                          onChange={(e) => setAdminLotteryConfig({ ...adminLotteryConfig, ticket_price: Number(e.target.value) })}
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Prize Multiplier</label>
                        <input
                          type="number"
                          className="form-input"
                          value={adminLotteryConfig.multiplier || 2}
                          onChange={(e) => setAdminLotteryConfig({ ...adminLotteryConfig, multiplier: Number(e.target.value) })}
                          style={{ fontSize: '0.85rem' }}
                        />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Ticket Sales Status</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            type="button"
                            onClick={() => setAdminLotteryConfig({ ...adminLotteryConfig, status: 'open' })}
                            className="interactive-card"
                            style={{
                              flex: 1, padding: '8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                              background: adminLotteryConfig.status === 'open' ? 'var(--success)' : 'var(--bg-secondary)',
                              color: adminLotteryConfig.status === 'open' ? '#000' : 'var(--text-secondary)',
                              border: '1px solid var(--glass-border)'
                            }}
                          >
                            Open (Sales Active)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminLotteryConfig({ ...adminLotteryConfig, status: 'closed' })}
                            className="interactive-card"
                            style={{
                              flex: 1, padding: '8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                              background: adminLotteryConfig.status === 'closed' ? 'var(--error)' : 'var(--bg-secondary)',
                              color: adminLotteryConfig.status === 'closed' ? '#fff' : 'var(--text-secondary)',
                              border: '1px solid var(--glass-border)'
                            }}
                          >
                            Closed (Sales Suspended)
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => saveAdminLotteryConfig(adminLotteryConfig)}
                      className="gradient-btn"
                      style={{ padding: '12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', marginTop: '8px' }}
                    >
                      Save Configuration Settings
                    </button>
                  </div>

                  {/* Weekly Draw Control */}
                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--error)' }}>🎲 Weekly Draw Controls</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                      Perform the draw process for Week {adminLotteryConfig.week_number}. This will pick the winning 3-digit key, credit payouts, log transactions, and trigger notifications.
                    </p>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                      <input
                        type="text"
                        maxLength={3}
                        placeholder="Winning code (e.g. 109) - Leave blank for random"
                        className="form-input"
                        id="adminManualWinCode"
                        style={{ fontSize: '0.8rem', flex: 1 }}
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById('adminManualWinCode');
                          runManualLotteryDraw(input ? input.value : '');
                        }}
                        disabled={adminLotteryConfig.status === 'completed'}
                        className="gradient-btn"
                        style={{
                          padding: '0 20px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: adminLotteryConfig.status === 'completed' ? 'var(--text-secondary)' : 'linear-gradient(135deg, #ff7675 0%, #d63031 100%)',
                          opacity: adminLotteryConfig.status === 'completed' ? 0.6 : 1
                        }}
                      >
                        {adminLotteryConfig.status === 'completed' ? 'Draw Completed' : '🎲 Run Lottery Draw'}
                      </button>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--accent-secondary)' }}>🔍 Search & Filter Participant List</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Search Username, User ID, phone, ticket code..."
                        className="form-input"
                        value={adminLotterySearch}
                        onChange={(e) => setAdminLotterySearch(e.target.value)}
                        style={{ fontSize: '0.8rem', flex: 1 }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Filter Status</label>
                        <select
                          className="form-input"
                          value={adminLotteryStatusFilter}
                          onChange={(e) => setAdminLotteryStatusFilter(e.target.value)}
                          style={{ fontSize: '0.8rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        >
                          <option value="">All Statuses</option>
                          <option value="active">Active Tickets</option>
                          <option value="won">Winners (Prize Paid)</option>
                          <option value="lost">Lost</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Filter Week</label>
                        <select
                          className="form-input"
                          value={adminLotteryWeekFilter}
                          onChange={(e) => setAdminLotteryWeekFilter(e.target.value)}
                          style={{ fontSize: '0.8rem', width: '100%', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        >
                          <option value="">All Weeks</option>
                          {adminLotteryStats.uniqueWeeksList ? adminLotteryStats.uniqueWeeksList.map(w => (
                            <option key={w} value={w.toString()}>Week {w}</option>
                          )) : (
                            <option value={adminLotteryConfig.week_number.toString()}>Current (Week {adminLotteryConfig.week_number})</option>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Complete Participant List */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--gold)' }}>📋 Complete Participant List ({adminLotteryTickets.length})</h4>
                    {adminLotteryTickets.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        No tickets matching search and filter parameters.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                        {adminLotteryTickets.map(ticket => (
                          <div key={ticket.id} className="interactive-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.78rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'monospace' }}>#{ticket.ticket_code}</strong>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Week {ticket.week_number}</span>
                              </div>
                              <span style={{ display: 'block', marginTop: '4px' }}>User: <strong>{ticket.username}</strong></span>
                              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ID: {ticket.user_id_str}</span>
                              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Phone: {ticket.phone}</span>
                              <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Bought: {new Date(ticket.created_at).toLocaleString()}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ display: 'block', fontSize: '0.85rem' }}>₹{ticket.price}</strong>
                              <div style={{ marginTop: '6px' }}>
                                {ticket.status === 'active' ? (
                                  <span style={{ color: 'var(--gold)', background: 'rgba(253, 203, 110, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600 }}>Active</span>
                                ) : ticket.status === 'won' ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                    <span style={{ color: 'var(--success)', background: 'rgba(0, 184, 148, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600 }}>Winner</span>
                                    <span style={{ color: 'var(--success)', fontSize: '0.7rem', fontWeight: 700 }}>+₹{ticket.prize_amount}</span>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem' }}>Lost</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Historical Weekly Draws List */}
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--accent-secondary)' }}>📜 Lottery Weekly History</h4>
                    {adminLotteryDraws.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        No lottery draw history compiled yet.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                        {adminLotteryDraws.map(draw => (
                          <div key={draw.id} className="interactive-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.78rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>Week {draw.week_number} ({draw.status.toUpperCase()})</strong>
                              <button
                                onClick={() => {
                                  setAdminLotteryWeekFilter(draw.week_number.toString());
                                }}
                                className="gradient-btn"
                                style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                View Participants
                              </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              <div>
                                <span>Sales Started: {new Date(draw.sales_start_date).toLocaleDateString()}</span>
                                <span style={{ display: 'block' }}>Sales Ended: {draw.sales_end_date ? new Date(draw.sales_end_date).toLocaleDateString() : 'Active'}</span>
                                <span style={{ display: 'block' }}>Total Sold: <strong>{draw.total_tickets_sold} Tickets</strong></span>
                              </div>
                              <div>
                                <span>Winning Code: <strong style={{ color: 'var(--gold)' }}>{draw.winning_code ? `#${draw.winning_code}` : 'N/A'}</strong></span>
                                <span style={{ display: 'block' }}>Total Revenue: <strong>₹{draw.total_revenue}</strong></span>
                                <span style={{ display: 'block' }}>Total Prizes Paid: <strong style={{ color: 'var(--success)' }}>₹{draw.total_prizes_paid}</strong></span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Section: Referral Reward Tasks admin panel */}
          {adminActiveSubTab === 'referral-tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Referral Reward Tasks Manager</h3>
              
              {/* Search Bar */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Search username or phone..."
                  className="form-input"
                  value={adminReferralTasksSearch}
                  onChange={(e) => {
                    setAdminReferralTasksSearch(e.target.value);
                    setAdminReferralTasksPage(1);
                    fetchAdminReferralTasks(1, e.target.value);
                  }}
                  style={{ fontSize: '0.85rem', flex: 1 }}
                />
                <button
                  className="gradient-btn"
                  onClick={() => fetchAdminReferralTasks(1, adminReferralTasksSearch)}
                  style={{ padding: '0 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                >
                  Search
                </button>
              </div>

              {/* Data Table */}
              {adminReferralTasksLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Loading Referral Reward Tasks stats...
                </div>
              ) : adminReferralTasksData.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No users found or matching search query.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {adminReferralTasksData.map((stat) => (
                    <div key={stat.id} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* User Info Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{stat.username}</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>ID: {stat.id} | Code: {stat.referralCode}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Current Milestone:</span>
                          <strong style={{ fontSize: '0.85rem', color: stat.claimedMilestones.length > 0 ? 'var(--success)' : 'var(--text-primary)' }}>{stat.currentMilestone}</strong>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Total Referrals:</span>
                          <strong>{stat.totalReferredUsers}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Completed Tasks:</span>
                          <strong style={{ color: 'var(--accent-secondary)' }}>{stat.completedReferralTasks}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Total Paid:</span>
                          <strong style={{ color: 'var(--success)' }}>₹{stat.totalRewardPaid}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Remaining Reward:</span>
                          <strong style={{ color: stat.remainingReward === 0 ? 'var(--text-secondary)' : 'var(--accent-secondary)' }}>₹{stat.remainingReward}</strong>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Milestone Progress:</span>
                          <strong>{stat.progressPercentage}% ({stat.completedReferralTasks} / 30)</strong>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${stat.progressPercentage}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-secondary) 0%, var(--success) 100%)', borderRadius: '3px' }}></div>
                        </div>
                      </div>

                      {/* Manual Action Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--glass-border)', paddingTop: '10px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>⚙️ Manual Milestone Operations:</span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                          {[1, 2, 3].map((milestone) => {
                            const isClaimed = stat.claimedMilestones.includes(milestone);
                            return (
                              <button
                                key={milestone}
                                onClick={() => handleAdminMilestoneAction(isClaimed ? 'revoke' : 'approve', stat.id, milestone)}
                                className="interactive-card"
                                style={{
                                  padding: '8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  border: '1px solid var(--glass-border)',
                                  background: isClaimed ? 'linear-gradient(135deg, #ff7675 0%, #d63031 100%)' : 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)',
                                  color: '#fff',
                                  textAlign: 'center'
                                }}
                              >
                                {isClaimed ? `Revoke M${milestone}` : `Approve M${milestone}`}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination Controls */}
                  {adminReferralTasksTotalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '10px' }}>
                      <button
                        className="gradient-btn"
                        disabled={adminReferralTasksPage <= 1}
                        onClick={() => {
                          const prevPage = adminReferralTasksPage - 1;
                          setAdminReferralTasksPage(prevPage);
                          fetchAdminReferralTasks(prevPage, adminReferralTasksSearch);
                        }}
                        style={{ padding: '8px 16px', fontSize: '0.8rem', opacity: adminReferralTasksPage <= 1 ? 0.5 : 1 }}
                      >
                        Prev
                      </button>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Page {adminReferralTasksPage} of {adminReferralTasksTotalPages}
                      </span>
                      <button
                        className="gradient-btn"
                        disabled={adminReferralTasksPage >= adminReferralTasksTotalPages}
                        onClick={() => {
                          const nextPage = adminReferralTasksPage + 1;
                          setAdminReferralTasksPage(nextPage);
                          fetchAdminReferralTasks(nextPage, adminReferralTasksSearch);
                        }}
                        style={{ padding: '8px 16px', fontSize: '0.8rem', opacity: adminReferralTasksPage >= adminReferralTasksTotalPages ? 0.5 : 1 }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section: Users list */}
          {adminActiveSubTab === 'users' && adminView === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Registered Users</h3>

              {/* Users search, filter, and sort bar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Search user..."
                  className="form-input"
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                  style={{ fontSize: '0.85rem' }}
                />
                <select
                  className="form-input"
                  value={userFilter}
                  onChange={(e) => { setUserFilter(e.target.value); setUserPage(1); }}
                  style={{ fontSize: '0.85rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="all">📁 All User States</option>
                  <option value="active">🟢 Active Users Only</option>
                  <option value="suspended">🔴 Suspended Users Only</option>
                </select>
                <select
                  className="form-input"
                  value={userSort}
                  onChange={(e) => { setUserSort(e.target.value); setUserPage(1); }}
                  style={{ fontSize: '0.85rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="date-desc">📅 Registered: Newest First</option>
                  <option value="date-asc">📅 Registered: Oldest First</option>
                  <option value="balance-desc">💰 Balance: High to Low</option>
                  <option value="username-asc">🔤 Username: A to Z</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(() => {
                  let list = adminUsers.filter(u => {
                    const matchesSearch = u.username.toLowerCase().includes(userSearch.toLowerCase()) || u.phone.includes(userSearch);
                    const matchesFilter = userFilter === 'all' ? true : userFilter === 'suspended' ? u.is_suspended : !u.is_suspended;
                    return matchesSearch && matchesFilter;
                  });

                  // Sorting
                  list = list.sort((a, b) => {
                    if (userSort === 'date-desc') return new Date(b.created_at) - new Date(a.created_at);
                    if (userSort === 'date-asc') return new Date(a.created_at) - new Date(b.created_at);
                    if (userSort === 'balance-desc') return b.wallet_balance - a.wallet_balance;
                    if (userSort === 'username-asc') return a.username.localeCompare(b.username);
                    return 0;
                  });

                  // Pagination calculation
                  const pageSize = 10;
                  const totalPages = Math.ceil(list.length / pageSize) || 1;
                  const paginatedList = list.slice((userPage - 1) * pageSize, userPage * pageSize);

                  if (list.length === 0) {
                    return <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>No matching users found.</div>;
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {paginatedList.map((u) => (
                        <div
                          key={u.id}
                          className="glass-panel interactive-card"
                          onClick={() => {
                            setSelectedAdminUserId(u.id);
                            fetchUserProfileDetails(u.id);
                            setAdminView('user-profile');
                          }}
                          style={{
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                 {u.username}
                                 {u.is_suspended && (
                                   <span style={{ fontSize: '0.6rem', background: 'rgba(255,118,117,0.15)', color: 'var(--error)', padding: '2px 7px', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.5px' }}>SUSPENDED</span>
                                 )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{u.phone} • {u.email}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1rem' }}>₹{u.wallet_balance.toFixed(2)}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Ref: <strong>{u.referral_code}</strong></div>
                              {u.support_id && <div style={{ fontSize: '0.65rem', color: '#a29bfe', marginTop: '2px', fontFamily: 'monospace', letterSpacing: '1px' }}>ID: {u.support_id}</div>}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Pagination Controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '10px', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Page {userPage} of {totalPages} ({list.length} total users)</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            disabled={userPage === 1}
                            onClick={() => setUserPage(prev => Math.max(1, prev - 1))}
                            className="form-input"
                            style={{ width: 'auto', padding: '4px 10px', background: userPage === 1 ? 'transparent' : 'var(--bg-secondary)', cursor: userPage === 1 ? 'default' : 'pointer', opacity: userPage === 1 ? 0.4 : 1 }}
                          >
                            Prev
                          </button>
                          <button
                            disabled={userPage === totalPages}
                            onClick={() => setUserPage(prev => Math.min(totalPages, prev + 1))}
                            className="form-input"
                            style={{ width: 'auto', padding: '4px 10px', background: userPage === totalPages ? 'transparent' : 'var(--bg-secondary)', cursor: userPage === totalPages ? 'default' : 'pointer', opacity: userPage === totalPages ? 0.4 : 1 }}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Section: Investment Schemes (Orders + Add New Scheme Form) */}
          {adminActiveSubTab === 'schemes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Order verification subcategory */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Verify Scheme Purchases</h3>

                {(() => {
                  const filtered = adminOrders.filter(o => o.status === 'pending' || o.status === 'confirmation_pending');

                  if (filtered.length === 0) {
                    return (
                      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '6px' }}>
                        No pending scheme purchases to verify.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {filtered.map((order) => {
                        const isExpanded = adminExpandedOrderId === order.id;
                        return (
                          <div
                            key={order.id}
                            className="glass-panel interactive-card"
                            onClick={() => setAdminExpandedOrderId(isExpanded ? null : order.id)}
                            style={{
                              padding: '16px',
                              cursor: 'pointer',
                              background: 'var(--bg-secondary)',
                              borderLeft: (order.status === 'pending' || order.status === 'confirmation_pending') ? '3px solid var(--gold)' : order.status === 'active' ? '3px solid var(--success)' : '3px solid var(--error)',
                              borderTop: '1px solid var(--glass-border)',
                              borderRight: '1px solid var(--glass-border)',
                              borderBottom: '1px solid var(--glass-border)',
                              borderRadius: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.scheme_name}</h4>
                                <span style={{
                                  fontSize: '0.65rem',
                                  background: order.status === 'active' ? 'rgba(0, 184, 148, 0.1)' :
                                    (order.status === 'pending' || order.status === 'confirmation_pending') ? 'rgba(253, 203, 110, 0.1)' : 'rgba(255, 118, 117, 0.1)',
                                  color: order.status === 'active' ? 'var(--success)' :
                                    (order.status === 'pending' || order.status === 'confirmation_pending') ? 'var(--gold)' : 'var(--error)',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  textTransform: 'capitalize',
                                  fontWeight: 600
                                }}>{order.status}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <strong style={{ color: 'var(--accent-secondary)' }}>₹{order.price}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  {isExpanded ? '▲' : '▼'}
                                </span>
                              </div>
                            </div>

                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              User: <strong>{order.user_name}</strong> ({order.user_phone})
                            </div>

                            {isExpanded ? (
                              <div
                                className="animate-fade-in"
                                style={{ marginTop: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                                  <div>Submitted UTR: <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{order.utr}</strong></div>
                                  <div>Date: {new Date(order.created_at).toLocaleString()}</div>
                                  {order.days_remaining !== undefined && (
                                    <div>Days Remaining: <strong>{order.days_remaining} Days</strong></div>
                                  )}
                                </div>

                                {isValidScreenshot(order.screenshot) && !brokenImages[order.id] ? (
                                   <div style={{ marginTop: '10px', marginBottom: '12px' }}>
                                     <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Submitted Receipt Screenshot:</span>
                                     <div style={{ position: 'relative', width: '100%', maxHeight: '180px', overflow: 'hidden', borderRadius: '6px', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>
                                       <img
                                         src={getScreenshotUrl(order.screenshot)}
                                         alt="Payment Receipt"
                                         onError={() => setBrokenImages(prev => ({ ...prev, [order.id]: true }))}
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           const w = window.open();
                                           w.document.write(`<img src="${getScreenshotUrl(order.screenshot)}" style="max-width:100%; max-height:100vh; display:block; margin:auto;">`);
                                           w.document.title = "Payment Receipt Screenshot";
                                         }}
                                         style={{ width: '100%', objectFit: 'contain', maxHeight: '180px' }}
                                       />
                                     </div>
                                     <span style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', display: 'block', textAlign: 'center', marginTop: '4px' }}>(Click image to view full receipt)</span>
                                   </div>
                                 ) : (
                                   <div style={{ marginTop: '10px', marginBottom: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                     No Screenshot Uploaded
                                   </div>
                                 )}

                                {(order.status === 'pending' || order.status === 'confirmation_pending') && (
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleApproveOrder(order.id, 'approve'); }}
                                      className="gradient-btn"
                                      style={{ flex: 1, padding: '10px', borderRadius: '4px', fontSize: '0.85rem' }}
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleApproveOrder(order.id, 'reject'); }}
                                      style={{ flex: 1, padding: '10px', borderRadius: '4px', background: 'none', border: '1px solid var(--error)', color: 'var(--error)', fontSize: '0.85rem', cursor: 'pointer' }}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', marginTop: '6px', fontStyle: 'italic' }}>
                                ⚡ Click to view screenshot and verification details
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '10px 0' }} />

              {/* Add New Scheme Publisher Form / Edit Form */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '20px', borderRadius: '6px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
                  {editSchemeId ? `Edit Investment Package (ID: ${editSchemeId})` : 'Add New Investment Package'}
                </h3>
                <form onSubmit={handleAddSchemeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Scheme Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Diamond VIP Plan"
                      value={newSchemeName}
                      onChange={(e) => setNewSchemeName(e.target.value)}
                      required
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Price (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g. 5000"
                        value={newSchemePrice}
                        onChange={(e) => setNewSchemePrice(e.target.value)}
                        required
                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Daily Rate (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        placeholder="e.g. 4 for 4%"
                        value={newSchemeRate}
                        onChange={(e) => setNewSchemeRate(e.target.value)}
                        required
                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '4px' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Duration (Days)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="e.g. 10"
                        value={newSchemeDays}
                        onChange={(e) => setNewSchemeDays(e.target.value)}
                        required
                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Return (Calculated)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Total return amount"
                        value={newSchemeTotalReturn}
                        readOnly
                        required
                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'var(--success)', fontWeight: 700, borderRadius: '4px' }}
                      />
                    </div>
                  </div>

                  {/* Live Profit Preview Calculations */}
                  {parseFloat(newSchemePrice) > 0 && parseFloat(newSchemeRate) > 0 && parseInt(newSchemeDays) > 0 && (
                    <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '6px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--accent-secondary)', marginBottom: '4px' }}>Package Profit Calculations:</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Daily Payout profit:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>₹{(parseFloat(newSchemePrice) * (parseFloat(newSchemeRate) / 100)).toFixed(2)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Total Payout profit ({newSchemeDays} days):</span>
                        <strong style={{ color: 'var(--text-primary)' }}>₹{(parseFloat(newSchemePrice) * (parseFloat(newSchemeRate) / 100) * parseInt(newSchemeDays)).toFixed(2)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '6px' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Total Return (calculated):</span>
                        <strong style={{ color: 'var(--success)', fontSize: '0.85rem' }}>₹{newSchemeTotalReturn}</strong>
                      </div>
                    </div>
                  )}

                  {editSchemeId ? (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button type="submit" className="gradient-btn" style={{ flex: 1, padding: '12px', borderRadius: '4px', fontSize: '0.9rem' }}>
                        Update Scheme
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditSchemeId(null);
                          setNewSchemeName('');
                          setNewSchemePrice('');
                          setNewSchemeRate('');
                          setNewSchemeDays('');
                          setNewSchemeTotalReturn('');
                        }}
                        style={{ flex: 1, padding: '12px', borderRadius: '4px', fontSize: '0.9rem', background: 'none', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
                      >
                        Cancel Edit
                      </button>
                    </div>
                  ) : (
                    <button type="submit" className="gradient-btn" style={{ padding: '12px', borderRadius: '4px', fontSize: '0.9rem', marginTop: '8px', width: '100%' }}>
                      Publish Scheme
                    </button>
                  )}
                </form>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '10px 0' }} />

              {/* All Published Investment Schemes */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '20px', borderRadius: '6px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>All Published Investment Schemes</h3>

                {adminSchemes.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '12px' }}>
                    No schemes published yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                    {adminSchemes.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          padding: '12px',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem', display: 'block' }}>{s.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            <span>Price: <strong>₹{s.price}</strong></span>
                            <span>Daily Rate: <strong>{(s.daily_return_rate * 100).toFixed(1)}%</strong></span>
                            <span>Duration: <strong>{s.days} Days</strong></span>
                            <span>Total Return: <strong>₹{s.total_return}</strong></span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setEditSchemeId(s.id);
                              setNewSchemeName(s.name);
                              setNewSchemePrice(s.price.toString());
                              setNewSchemeRate((s.daily_return_rate * 100).toFixed(1));
                              setNewSchemeDays(s.days.toString());
                              setNewSchemeTotalReturn(s.total_return.toString());
                            }}
                            style={{
                              background: 'none',
                              border: '1px solid var(--accent-secondary)',
                              color: 'var(--accent-secondary)',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteScheme(s.id)}
                            style={{
                              background: 'none',
                              border: '1px solid var(--error)',
                              color: 'var(--error)',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Section: Withdrawal Manager Dashboard */}
          {adminActiveSubTab === 'withdrawals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Platform Withdrawal Manager</h3>

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="glass-panel" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Pending Withdrawals</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gold)', fontFamily: 'monospace', marginTop: '6px' }}>
                    {adminWithdrawalsStats.totalPendingCount || 0} reqs
                  </div>
                </div>
                <div className="glass-panel" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Approved Withdrawals</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'monospace', marginTop: '6px' }}>
                    {adminWithdrawalsStats.totalApprovedCount || 0} reqs
                  </div>
                </div>
                <div className="glass-panel" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Rejected Withdrawals</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--error)', fontFamily: 'monospace', marginTop: '6px' }}>
                    {adminWithdrawalsStats.totalRejectedCount || 0} reqs
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="glass-panel" style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(0, 184, 148, 0.4)', padding: '16px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Withdrawals Paid (₹)</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'monospace', marginTop: '6px' }}>
                    ₹{(adminWithdrawalsStats.totalPaidAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="glass-panel" style={{ background: 'var(--bg-secondary)', border: '1px solid rgba(9, 132, 227, 0.4)', padding: '16px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Users Who Have Received Withdrawals</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-secondary)', fontFamily: 'monospace', marginTop: '6px' }}>
                    {adminWithdrawalsStats.totalUsersWithdrawn || 0} users
                  </div>
                </div>
              </div>

              {/* Filters & Search UI */}
              <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>SEARCH USER / ID / AMOUNT</label>
                    <input
                      type="text"
                      placeholder="Name, Phone, ID, Amount..."
                      value={withdrawalSearchQuery}
                      onChange={(e) => { setWithdrawalSearchQuery(e.target.value); setWithdrawalPage(1); }}
                      className="form-input"
                      style={{ fontSize: '0.8rem', padding: '8px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>STATUS FILTER</label>
                    <select
                      value={withdrawalFilter}
                      onChange={(e) => { setWithdrawalFilter(e.target.value); setWithdrawalPage(1); }}
                      className="form-input"
                      style={{ fontSize: '0.8rem', padding: '8px', background: 'var(--bg-secondary)', cursor: 'pointer' }}
                    >
                      <option value="all">📁 All Statuses</option>
                      <option value="pending">⏳ Pending Resolve</option>
                      <option value="approved">✅ Approved / Paid</option>
                      <option value="rejected">❌ Rejected / Failed</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>DATE FILTER</label>
                    <select
                      value={withdrawalDateRange}
                      onChange={(e) => { setWithdrawalDateRange(e.target.value); setWithdrawalPage(1); }}
                      className="form-input"
                      style={{ fontSize: '0.8rem', padding: '8px', background: 'var(--bg-secondary)', cursor: 'pointer' }}
                    >
                      <option value="all">📅 Lifetime Date</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="custom">Custom Date Range</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>SORT ORDER</label>
                    <select
                      value={withdrawalSort}
                      onChange={(e) => { setWithdrawalSort(e.target.value); setWithdrawalPage(1); }}
                      className="form-input"
                      style={{ fontSize: '0.8rem', padding: '8px', background: 'var(--bg-secondary)', cursor: 'pointer' }}
                    >
                      <option value="date-desc">Newest Request</option>
                      <option value="date-asc">Oldest Request</option>
                      <option value="amount-desc">Highest Amount</option>
                      <option value="amount-asc">Lowest Amount</option>
                    </select>
                  </div>
                </div>

                {withdrawalDateRange === 'custom' && (
                  <div className="animate-fade-in" style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>START DATE</label>
                      <input
                        type="date"
                        value={withdrawalStartDate}
                        onChange={(e) => { setWithdrawalStartDate(e.target.value); setWithdrawalPage(1); }}
                        className="form-input"
                        style={{ fontSize: '0.8rem', padding: '8px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>END DATE</label>
                      <input
                        type="date"
                        value={withdrawalEndDate}
                        onChange={(e) => { setWithdrawalEndDate(e.target.value); setWithdrawalPage(1); }}
                        className="form-input"
                        style={{ fontSize: '0.8rem', padding: '8px' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Withdrawals List Rendering */}
              {(() => {
                const list = adminWithdrawals;
                const totalPages = adminWithdrawalsTotalPages;

                if (list.length === 0) {
                  return (
                    <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      No withdrawal records matched the active filters.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {list.map((item) => {
                        let statusColor = 'var(--text-secondary)';
                        let statusBg = 'rgba(255, 255, 255, 0.05)';
                        let statusText = 'Pending';
                        if (item.status === 'completed') {
                          statusColor = 'var(--success)';
                          statusBg = 'rgba(0, 184, 148, 0.1)';
                          statusText = 'Paid';
                        } else if (item.status === 'failed' || item.status === 'rejected' || item.status === 'cancelled') {
                          statusColor = 'var(--error)';
                          statusBg = 'rgba(255, 118, 117, 0.1)';
                          statusText = 'Rejected';
                        }

                        return (
                          <div
                            key={item.id}
                            className="glass-panel"
                            style={{
                              padding: '16px',
                              borderLeft: `3px solid ${statusColor}`,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <h4 style={{ fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
                                  User Name: {item.user_name}
                                </h4>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                  Phone: {item.user_phone} | User ID: {item.user_id}
                                </span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--error)' }}>
                                  -₹{Math.abs(item.amount).toFixed(2)}
                                </div>
                                <span style={{ fontSize: '0.65rem', background: statusBg, color: statusColor, padding: '2px 8px', borderRadius: '4px', textTransform: 'capitalize', fontWeight: 600 }}>
                                  {statusText}
                                </span>
                              </div>
                            </div>

                            {/* Settlement Bank/UPI Details */}
                            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                              <div>Bank Name: <strong>{item.withdrawal_bank_name || 'UPI/Bank'}</strong></div>
                              <div>Bank/UPI Beneficiary: <strong>{item.withdrawal_account_name || 'Unknown'}</strong></div>
                              <div>UPI ID: <strong style={{ color: 'var(--accent-secondary)' }}>{item.withdrawal_upi_id || 'Not Linked'}</strong></div>
                              <div>Account Number: <strong>{item.withdrawal_account_number || 'Not Linked'}</strong></div>
                              <div>IFSC Code: <strong>{item.withdrawal_ifsc || 'Not Linked'}</strong></div>
                              <div>Wallet Balance (Request Time): <strong>₹{(item.wallet_balance_at_request || 0).toFixed(2)}</strong></div>
                              {item.rejection_reason && <div style={{ gridColumn: 'span 2', color: 'var(--error)' }}>Rejection Reason: <strong>{item.rejection_reason}</strong></div>}
                              {item.status === 'completed' && (
                                <div style={{ gridColumn: 'span 2', color: 'var(--success)', display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid var(--glass-border)', paddingTop: '6px', marginTop: '4px' }}>
                                  <div>Approved By: <strong>{item.approved_by_admin_username || 'Admin'}</strong></div>
                                  <div>Transaction / UTR Reference: <strong>{item.utr || 'N/A'}</strong></div>
                                </div>
                              )}
                            </div>

                            {/* Timeline */}
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '8px' }}>
                              <span>Request Date & Time: {new Date(item.created_at).toLocaleString()}</span>
                              {item.status !== 'pending' && (
                                <span>Approval Date & Time: {new Date(item.resolved_at || item.created_at).toLocaleString()}</span>
                              )}
                            </div>

                            {/* Action Resolve Buttons if Pending */}
                            {item.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button
                                  onClick={() => {
                                    const utr = prompt('Enter Transaction Ref / UTR number (optional):');
                                    if (utr !== null) {
                                      handleAdminAction('approveTransaction', { transactionId: item.id, utr });
                                    }
                                  }}
                                  className="gradient-btn"
                                  style={{ flex: 1, padding: '8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}
                                >
                                  Approve Request
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Enter rejection reason (optional):');
                                    if (reason !== null) {
                                      handleAdminAction('rejectTransaction', { transactionId: item.id, rejectionReason: reason });
                                    }
                                  }}
                                  style={{ flex: 1, padding: '8px', borderRadius: '6px', background: 'none', border: '1px solid var(--error)', color: 'var(--error)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700 }}
                                >
                                  Reject Request
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', padding: '0 4px' }}>
                        <button
                          disabled={withdrawalPage === 1}
                          onClick={() => setWithdrawalPage(prev => Math.max(1, prev - 1))}
                          className="form-input"
                          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem', opacity: withdrawalPage === 1 ? 0.5 : 1, cursor: withdrawalPage === 1 ? 'default' : 'pointer' }}
                        >
                          ◀ Previous
                        </button>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Page {withdrawalPage} of {totalPages} ({adminWithdrawalsTotalCount} requests)
                        </span>
                        <button
                          disabled={withdrawalPage === totalPages}
                          onClick={() => setWithdrawalPage(prev => Math.min(totalPages, prev + 1))}
                          className="form-input"
                          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem', opacity: withdrawalPage === totalPages ? 0.5 : 1, cursor: withdrawalPage === totalPages ? 'default' : 'pointer' }}
                        >
                          Next ▶
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Section: PWA Settings (dynamic configuration) */}
          {adminActiveSubTab === 'pwa-settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>PWA Settings Configuration</h3>
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Application Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={adminPwaName}
                      onChange={(e) => setAdminPwaName(e.target.value)}
                      style={{ fontSize: '0.8rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Short Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={adminPwaShortName}
                      onChange={(e) => setAdminPwaShortName(e.target.value)}
                      style={{ fontSize: '0.8rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Theme Color</label>
                    <input
                      type="text"
                      className="form-input"
                      value={adminPwaThemeColor}
                      onChange={(e) => setAdminPwaThemeColor(e.target.value)}
                      style={{ fontSize: '0.8rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Background Color</label>
                    <input
                      type="text"
                      className="form-input"
                      value={adminPwaBackgroundColor}
                      onChange={(e) => setAdminPwaBackgroundColor(e.target.value)}
                      style={{ fontSize: '0.8rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>App Icon (Upload)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-input"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setAdminPwaIcon(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ fontSize: '0.8rem', width: '100%', padding: '6px' }}
                    />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Current path: {adminPwaIcon}</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Splash Screen (Upload)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-input"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setAdminPwaSplashScreen(reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ fontSize: '0.8rem', width: '100%', padding: '6px' }}
                    />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Current path: {adminPwaSplashScreen}</span>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>App Version</label>
                    <input
                      type="text"
                      className="form-input"
                      value={adminPwaVersion}
                      onChange={(e) => setAdminPwaVersion(e.target.value)}
                      style={{ fontSize: '0.8rem', width: '100%' }}
                    />
                  </div>
                </div>
                 <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Install Prompt Text</label>
                  <textarea
                    rows={2}
                    className="form-input"
                    value={adminPwaInstallPromptText}
                    onChange={(e) => setAdminPwaInstallPromptText(e.target.value)}
                    style={{ fontSize: '0.8rem', width: '100%', resize: 'vertical', fontFamily: 'inherit', marginBottom: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Update Release Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter what's new in this version..."
                    className="form-input"
                    value={adminPwaUpdateNotes}
                    onChange={(e) => setAdminPwaUpdateNotes(e.target.value)}
                    style={{ fontSize: '0.8rem', width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
                <button
                  onClick={handleSavePwaSettings}
                  className="gradient-btn"
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700, marginTop: '8px' }}
                >
                  Save PWA Settings
                </button>
              </div>
            </div>
          )}

          {/* Section: Payment Accounts Manager */}
          {adminActiveSubTab === 'payment-accounts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Manage Deposit Payment Accounts</h3>
              
              {/* Form to Add New Account */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-secondary)', margin: 0 }}>➕ Add New Payment Account</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Bank Name (use 'UPI' for UPI accounts)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newPaBankName}
                      onChange={(e) => setNewPaBankName(e.target.value)}
                      placeholder="e.g. Axis Bank or UPI"
                      style={{ fontSize: '0.8rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Beneficiary / Holder Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newPaBeneficiaryName}
                      onChange={(e) => setNewPaBeneficiaryName(e.target.value)}
                      placeholder="e.g. FastPay Settlement"
                      style={{ fontSize: '0.8rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Account Number / UPI ID</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newPaAccountNumber}
                      onChange={(e) => setNewPaAccountNumber(e.target.value)}
                      placeholder="e.g. 912010087654321 or upi@ybl"
                      style={{ fontSize: '0.8rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>IFSC Code (optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newPaIfsc}
                      onChange={(e) => setNewPaIfsc(e.target.value)}
                      placeholder="e.g. UTIB0000123"
                      style={{ fontSize: '0.8rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Alternative UPI (optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newPaUpiId}
                      onChange={(e) => setNewPaUpiId(e.target.value)}
                      placeholder="e.g. upi@paytm"
                      style={{ fontSize: '0.8rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Upload QR Code (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-input"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewPaQrCode(reader.result);
                            
                            // Client-side QR decoding using jsQR
                            const img = new Image();
                            img.src = reader.result;
                            img.onload = () => {
                              try {
                                const canvas = document.createElement('canvas');
                                canvas.width = img.width;
                                canvas.height = img.height;
                                const ctx = canvas.getContext('2d');
                                ctx.drawImage(img, 0, 0);
                                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                                const code = jsQR(imageData.data, img.width, img.height);
                                if (code) {
                                  console.log('Decoded QR Code content:', code.data);
                                  setNewPaQrCodeData(code.data);
                                } else {
                                  console.log('Could not decode QR code from image');
                                  setNewPaQrCodeData('');
                                }
                              } catch (err) {
                                console.error('Error decoding uploaded QR:', err);
                                setNewPaQrCodeData('');
                              }
                            };
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ fontSize: '0.8rem', width: '100%', padding: '6px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="paConcurrentCheck"
                    checked={newPaAllowConcurrent}
                    onChange={(e) => setNewPaAllowConcurrent(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="paConcurrentCheck" style={{ fontSize: '0.75rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    Allow Concurrent Allocation (multiple users can use this account at the same time)
                  </label>
                </div>
                <button
                  onClick={handleAddPaymentAccount}
                  className="gradient-btn"
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  Add Payment Account
                </button>
              </div>

              {/* Pool accounts list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', margin: '10px 0 0 0' }}>📋 Existing Payment Accounts ({adminVirtualAccounts.length})</h4>
                {adminVirtualAccounts.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    No payment accounts registered in the database.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {adminVirtualAccounts.map((account) => {
                      const isLockedNow = account.is_locked && account.locked_until && new Date(account.locked_until) > new Date();
                      return (
                        <div key={account.id} className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: account.is_enabled ? '3px solid var(--success)' : '3px solid var(--error)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                Account Holder: <strong>{account.beneficiary_name}</strong>
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Bank Name: <strong>{account.bank_name}</strong>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span>Account Number: <strong style={{ color: 'var(--text-primary)' }}>{account.account_number}</strong></span>
                                {account.ifsc && <span>IFSC Code: <strong>{account.ifsc}</strong></span>}
                                <span>UPI ID: <strong style={{ color: 'var(--text-primary)' }}>{account.upi_id || 'N/A'}</strong></span>
                                <span>
                                  QR Code: {account.qr_code ? (
                                    <strong style={{ color: 'var(--accent-secondary)', cursor: 'pointer' }} onClick={() => {
                                      const w = window.open();
                                      w.document.write(`<img src="${account.qr_code}" style="max-width:100%; max-height:100vh; display:block; margin:auto;">`);
                                    }}>[View QR]</strong>
                                  ) : 'None'}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleTogglePaymentAccountStatus(account.id)}
                                className="form-input"
                                style={{
                                  width: 'auto',
                                  padding: '4px 10px',
                                  fontSize: '0.7rem',
                                  background: account.is_enabled ? 'rgba(0, 184, 148, 0.1)' : 'rgba(255, 118, 117, 0.1)',
                                  color: account.is_enabled ? 'var(--success)' : 'var(--error)',
                                  border: account.is_enabled ? '1px solid var(--success)' : '1px solid var(--error)',
                                  cursor: 'pointer',
                                  fontWeight: 700
                                }}
                              >
                                {account.is_enabled ? 'Enabled' : 'Disabled'}
                              </button>
                              <button
                                onClick={() => handleDeletePaymentAccount(account.id)}
                                className="form-input"
                                style={{
                                  width: 'auto',
                                  padding: '4px 10px',
                                  fontSize: '0.7rem',
                                  background: 'none',
                                  color: 'var(--error)',
                                  border: '1px solid var(--error)',
                                  cursor: 'pointer',
                                  fontWeight: 700
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--glass-border)', paddingTop: '8px', fontSize: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Current Status:</span>
                              <div style={{
                                background: isLockedNow ? 'rgba(253, 203, 110, 0.1)' : 'rgba(0, 184, 148, 0.1)',
                                color: isLockedNow ? 'var(--gold)' : 'var(--success)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontWeight: 600
                              }}>
                                {isLockedNow ? 'Reserved' : 'Available'}
                              </div>

                              <button
                                onClick={() => handleTogglePaymentAccountConcurrent(account.id)}
                                style={{
                                  background: account.allow_concurrent ? 'rgba(108, 92, 231, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                  color: account.allow_concurrent ? '#a29bfe' : 'var(--text-secondary)',
                                  border: '1px solid var(--glass-border)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '0.7rem'
                                }}
                              >
                                👥 Concurrent: {account.allow_concurrent ? 'Allowed' : 'Disallowed'}
                              </button>
                            </div>

                            {isLockedNow && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px', color: 'var(--text-secondary)' }}>
                                <span>Reserved For: <strong>{account.locked_by_username || 'Unknown'} ({account.locked_by_user_id || 'N/A'})</strong></span>
                                {account.last_assigned_at && (
                                  <span>Reservation Time: <strong>{new Date(account.last_assigned_at).toLocaleString()}</strong></span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Notifications View */}
          {adminActiveSubTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Admin Action Notifications</h3>
                {adminNotifications.filter(n => !n.is_read).length > 0 && (
                  <button
                    onClick={handleMarkAllNotificationsRead}
                    className="form-input"
                    style={{ width: 'auto', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', background: 'rgba(9, 132, 227, 0.2)', border: '1px solid #0984e3', color: '#0984e3', fontWeight: 700 }}
                  >
                    Mark All as Read
                  </button>
                )}
              </div>

              {adminNotifications.length === 0 ? (
                <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  No notifications recorded.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {adminNotifications.map((notif) => (
                    <div
                      key={notif._id || notif.id}
                      className="glass-panel"
                      style={{
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: notif.is_read ? 'var(--bg-secondary)' : 'rgba(9, 132, 227, 0.05)',
                        borderLeft: notif.is_read ? '3px solid var(--text-secondary)' : '3px solid #0984e3',
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: notif.is_read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                          {notif.action} - <span style={{ color: 'var(--success)' }}>₹{Math.abs(notif.amount).toFixed(2)}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          User: <strong>{notif.username}</strong> (ID: {notif.user_id})
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {new Date(notif.created_at).toLocaleString()}
                        </div>
                      </div>
                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkNotificationRead(notif._id || notif.id)}
                          className="form-input"
                          style={{
                            width: 'auto',
                            padding: '4px 10px',
                            fontSize: '0.7rem',
                            background: 'none',
                            color: 'var(--accent-secondary)',
                            border: '1px solid var(--accent-secondary)',
                            cursor: 'pointer',
                            borderRadius: '4px'
                          }}
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
      {/* --- TAB: WALLET --- */}
      {activeTab === 'wallet' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Wallet Earnings Dashboard */}
          <div className="glass-panel" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(9, 132, 227, 0.15) 0%, rgba(0, 206, 201, 0.05) 100%)', border: '1px solid rgba(9, 132, 227, 0.3)', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💰 Wallet Earnings & Balances
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Available Earnings */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Available Earnings</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  ₹{user?.walletBalance.toFixed(2)}
                </div>
              </div>

              {/* Withdrawal Balance */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Withdrawal Balance</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                  ₹{(user?.withdrawableBalance !== undefined ? user.withdrawableBalance : user?.walletBalance || 0).toFixed(2)}
                </div>
              </div>

              {/* Daily Profit */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Daily Profit</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-secondary)', marginTop: '4px' }}>
                  ₹{investmentProfit.toFixed(2)}
                </div>
              </div>

              {/* Referral Commission */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Referral Commission</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '4px' }}>
                  ₹{commissionProfit.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Active Schemes Section */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }} className="gradient-text">💼 My Active Schemes</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Your currently running investment plans with live countdown.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orders.filter(o => o.status === 'active' && o.days_remaining > 0).length === 0 ? (
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No active schemes. Purchase a scheme from the Orders tab.
              </div>
            ) : (
              orders.filter(o => o.status === 'active' && o.days_remaining > 0).map((order) => {
                const totalDays = order.total_payout && order.daily_income > 0 ? Math.round(order.total_payout / order.daily_income) : 3;
                const purchaseDate = new Date(order.created_at);
                const maturityDate = new Date(purchaseDate.getTime() + totalDays * 24 * 60 * 60 * 1000);
                const remainMs = Math.max(0, maturityDate.getTime() - nowTime);
                const remainH = Math.floor(remainMs / 3600000);
                const remainM = Math.floor((remainMs % 3600000) / 60000);
                const progressPct = Math.round(((totalDays - order.days_remaining) / totalDays) * 100);
                return (
                  <div
                    key={order.id}
                    className="glass-panel interactive-card"
                    onClick={() => setSelectedWalletScheme(order)}
                    style={{ padding: '16px', cursor: 'pointer', borderLeft: '3px solid var(--success)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{order.scheme_name || 'Investment Scheme'}</h4>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>₹{order.price.toFixed(2)} invested</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700, background: 'rgba(0,184,148,0.1)', padding: '2px 8px', borderRadius: '6px' }}>Active</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{order.days_remaining}d left</div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ marginTop: '10px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--accent-primary), var(--success))', borderRadius: '4px', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      <span>⏳ {remainH}h {remainM}m remaining</span>
                      <span>{progressPct}% complete</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- WALLET: SCHEME DETAIL MODAL --- */}
      {selectedWalletScheme && (() => {
        const o = selectedWalletScheme;
        const totalDays = o.total_payout && o.daily_income > 0 ? Math.round(o.total_payout / o.daily_income) : 3;
        const dailyRatePct = o.daily_income > 0 && o.price > 0 ? ((o.daily_income / o.price) * 100).toFixed(2) : '—';
        const totalRatePct = totalDays > 0 && o.daily_income > 0 ? ((o.daily_income * totalDays / o.price) * 100).toFixed(2) : '—';
        const purchaseDate = new Date(o.created_at);
        const completionDate = new Date(purchaseDate.getTime() + totalDays * 24 * 60 * 60 * 1000);
        const remainMs = Math.max(0, completionDate.getTime() - nowTime);
        const remainDays = Math.floor(remainMs / (24 * 60 * 60 * 1000));
        const remainHours = Math.floor((remainMs % (24 * 60 * 60 * 1000)) / 3600000);
        const remainMinutes = Math.floor((remainMs % 3600000) / 60000);
        const remainS = Math.floor((remainMs % 60000) / 1000);
        const pad = (num) => String(num).padStart(2, '0');
        const statusColor = o.status === 'active' ? 'var(--success)' : o.status === 'completed' ? '#a29bfe' : 'var(--gold)';
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setSelectedWalletScheme(null)}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '24px', borderRadius: '20px 20px 0 0', border: '1px solid var(--glass-border)', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }} className="gradient-text">📊 Scheme Details</h3>
                <button onClick={() => setSelectedWalletScheme(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                {[
                  ['Scheme Name', o.scheme_name || 'Investment Scheme'],
                  ['Purchase Amount', `₹${o.price.toFixed(2)}`],
                  ['Daily Return Rate', `${dailyRatePct}% / day`],
                  ['Total Return Rate', `${totalRatePct}% total`],
                  ['Daily Profit', `₹${o.daily_income.toFixed(2)}`],
                  ['Total Expected Profit', `₹${(o.daily_income * totalDays).toFixed(2)}`],
                  ['Purchase Date', purchaseDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })],
                  ['Completion Date', completionDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })],
                  ['Remaining Days', `${remainDays} Days`],
                  ['Remaining Hours', `${remainHours} Hours`],
                  ['Remaining Minutes', `${remainMinutes} Minutes`],
                  ['Live Countdown', `${pad(remainDays * 24 + remainHours)}h ${pad(remainMinutes)}m ${pad(remainS)}s`],
                  ['Current Status', o.status],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <strong style={{ color: label === 'Current Status' ? statusColor : 'var(--text-primary)', textTransform: label === 'Current Status' ? 'capitalize' : 'none' }}>{value}</strong>
                  </div>
                ))}
              </div>
              <button onClick={() => setSelectedWalletScheme(null)} className="gradient-btn" style={{ marginTop: '20px', padding: '12px', borderRadius: '10px', fontSize: '0.9rem' }}>Close</button>
            </div>
          </div>
        );
      })()}

      {/* --- TELEGRAM GATE MODAL --- */}
      {showTelegramGate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }} className="gradient-text">📢 Telegram Join Required!</h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '20px' }}>
              Joining our official Telegram Channel and Telegram Group is required before purchasing schemes or completing payments.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {/* Channel Button */}
              <a
                href="https://t.me/+GclayxaTZac3MDg1"
                target="_blank"
                rel="noreferrer"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/user/telegram', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'channel' })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setUser(prev => ({ ...prev, isTelegramChannelJoined: true }));
                    }
                  } catch (e) {
                    console.error('Error toggling channel:', e);
                  }
                }}
                className="glass-panel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  textDecoration: 'none',
                  border: user?.isTelegramChannelJoined ? '1px solid var(--success)' : '1px solid var(--glass-border)',
                  background: user?.isTelegramChannelJoined ? 'rgba(0,184,148,0.05)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>📣</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>Join Telegram Channel</span>
                </div>
                {user?.isTelegramChannelJoined ? (
                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem' }}>Joined ✓</span>
                ) : (
                  <span className="gradient-btn" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem' }}>Join</span>
                )}
              </a>

              {/* Group Button */}
              <a
                href="https://t.me/+GclayxaTZac3MDg1"
                target="_blank"
                rel="noreferrer"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/user/telegram', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'group' })
                    });
                    const data = await res.json();
                    if (data.success) {
                      setUser(prev => ({ ...prev, isTelegramGroupJoined: true }));
                    }
                  } catch (e) {
                    console.error('Error toggling group:', e);
                  }
                }}
                className="glass-panel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  textDecoration: 'none',
                  border: user?.isTelegramGroupJoined ? '1px solid var(--success)' : '1px solid var(--glass-border)',
                  background: user?.isTelegramGroupJoined ? 'rgba(0,184,148,0.05)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>💬</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>Join Telegram Group</span>
                </div>
                {user?.isTelegramGroupJoined ? (
                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem' }}>Joined ✓</span>
                ) : (
                  <span className="gradient-btn" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem' }}>Join</span>
                )}
              </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                disabled={!(user?.isTelegramChannelJoined && user?.isTelegramGroupJoined)}
                onClick={() => setShowTelegramGate(false)}
                className="gradient-btn"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  opacity: (user?.isTelegramChannelJoined && user?.isTelegramGroupJoined) ? 1 : 0.4,
                  cursor: (user?.isTelegramChannelJoined && user?.isTelegramGroupJoined) ? 'pointer' : 'not-allowed'
                }}
              >
                Proceed to Invest / Order
              </button>

              <button
                onClick={() => setShowTelegramGate(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  marginTop: '4px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: SCAN QR TO PAY / DEPOSIT --- */}
      {showScanModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <style>{`
            @keyframes scanLaser {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
          `}</style>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '24px 20px', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }} className="gradient-text">📸 Scan QR Code / Deposit</h3>
              <button
                onClick={() => {
                  stopCameraScan();
                  setShowScanModal(false);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {scanError && (
              <div style={{ background: 'rgba(255, 118, 117, 0.1)', border: '1px solid rgba(255, 118, 117, 0.2)', padding: '12px', borderRadius: '8px', color: 'var(--error)', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{scanError}</span>
              </div>
            )}

            {scanLoading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Processing and validating QR code...</span>
              </div>
            ) : (
              <>
                {!isScanning ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 10px 0' }}>
                      To make a deposit or purchase, scan a QR code using your camera or upload a QR code image saved in your gallery.
                    </p>

                    {/* Gallery Button */}
                    <label
                      className="interactive-card"
                      style={{
                        padding: '20px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px dashed var(--glass-border)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        textAlign: 'center'
                      }}
                    >
                      <Plus size={24} style={{ color: 'var(--accent-secondary)' }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Select QR from Gallery</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Accepts any saved QR code screenshot</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleGalleryScan}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {/* Camera Button */}
                    <button
                      onClick={startCameraScan}
                      className="gradient-btn"
                      style={{
                        padding: '14px',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      📷 Scan with Camera
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '320px', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', background: '#000', border: '2px solid var(--accent-secondary)' }}>
                      <video
                        ref={scanVideoRef}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {/* Scanning laser line animation */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: 'var(--accent-secondary)',
                        boxShadow: '0 0 10px var(--accent-secondary)',
                        animation: 'scanLaser 2s linear infinite'
                      }} />
                    </div>

                    <button
                      onClick={stopCameraScan}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: 'rgba(255, 118, 117, 0.1)',
                        border: '1px solid rgba(255, 118, 117, 0.2)',
                        color: 'var(--error)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '8px'
                      }}
                    >
                      Cancel Scan
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 1: SCHEME DETAILS / SCHEME DIALOG --- */}
      {activeOrderDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '24px 20px', border: '1px solid rgba(255,255,255,0.08)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }} className="gradient-text">{activeOrderDetails.name}</h3>
              <button
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
              {/* Scheme Summary */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Amount to Pay:</span>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>₹{activeOrderDetails.price}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Daily Income:</span>
                  <strong style={{ color: 'var(--success)' }}>₹{(activeOrderDetails.price * activeOrderDetails.daily_return_rate).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Validity Period:</span>
                  <strong>{activeOrderDetails.days} Days</strong>
                </div>
              </div>

              {/* 15-Minute Countdown Timer */}
              {paymentTimer > 0 ? (
                <div style={{ padding: '10px', background: 'rgba(0, 206, 201, 0.1)', border: '1px solid rgba(0, 206, 201, 0.2)', borderRadius: '10px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', letterSpacing: '0.5px' }}>PAYMENT EXPIRES IN</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-secondary)', marginTop: '2px' }}>
                    {formatTimerValue(paymentTimer)}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px', background: 'rgba(255, 118, 117, 0.1)', border: '1px solid rgba(255, 118, 117, 0.2)', borderRadius: '10px', textAlign: 'center', color: 'var(--error)', fontSize: '0.85rem' }}>
                  <strong>Time Expired:</strong> The 15-minute payment window has closed. Close this modal and submit a new request.
                </div>
              )}

              {!activeOrderBankDetails?.qrCode ? (
                <div style={{ padding: '16px', background: 'rgba(255, 118, 117, 0.1)', border: '1px solid rgba(255, 118, 117, 0.2)', borderRadius: '10px', textAlign: 'center', color: 'var(--error)', fontSize: '0.85rem' }}>
                  <strong>QR Code unavailable.</strong> Please contact support.
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px' }}>
                    Scan QR Code to Pay:
                  </div>

                  {/* QR Code */}
                  {activeOrderBankDetails?.qrCode && (() => {
                    const qrUrl = activeOrderBankDetails.qrCode;
                    return (
                      <>
                        <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', width: '200px', height: '200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img
                            src={qrUrl}
                            alt="Payment QR Code"
                            style={{ width: '180px', height: '180px' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', marginBottom: '8px' }}>
                          <a
                            href={qrUrl}
                            download="FastPay_Payment_QR.png"
                            target="_blank"
                            rel="noreferrer"
                            className="gradient-btn"
                            style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', textDecoration: 'none', color: '#fff', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            Save to Gallery
                          </a>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}

              {/* UTR Input field */}
              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>12-Digit Transaction UTR / Ref Number</label>
                <input
                  type="text"
                  className="form-input"
                  maxLength={12}
                  placeholder="Enter 12-digit UTR ID"
                  value={paymentUtr}
                  onChange={(e) => setPaymentUtr(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              {/* Screenshot Upload field */}
              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Upload Payment Screenshot / Receipt</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setPaymentScreenshot(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  required
                />
                {paymentScreenshot && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Screenshot Preview:</span>
                    <img
                      src={paymentScreenshot}
                      alt="Screenshot Preview"
                      style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (paymentUtr.length !== 12) {
                    alert('Please enter a valid 12-digit UTR number.');
                    return;
                  }
                  if (!paymentScreenshot) {
                    alert('Please upload a screenshot of your transaction.');
                    return;
                  }
                  handleBuyOrder(activeOrderDetails.id, paymentUtr, paymentScreenshot);
                }}
                className="gradient-btn"
                disabled={paymentTimer === 0}
                style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '1rem', marginTop: '10px', opacity: paymentTimer === 0 ? 0.5 : 1 }}
              >
                Submit Payment Details
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5px' }}>
                <button
                  onClick={handleCancelPurchase}
                  style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Cancel Purchase
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: DEPOSIT MODAL WITH VIRTUAL ACCOUNT ASSIGNMENT --- */}
      {showDepositModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#000' }}>Deposit Amount</h3>
              <button
                onClick={() => { setShowDepositModal(false); setVirtualAccount(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
            {txMessage.text && (
              <div style={{
                background: txMessage.type === 'success' ? 'rgba(0, 184, 148, 0.1)' : 'rgba(255, 118, 117, 0.1)',
                color: txMessage.type === 'success' ? 'var(--success)' : 'var(--error)',
                padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{txMessage.text}</span>
              </div>
            )}

            {!virtualAccount ? (
              <form onSubmit={handleDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Deposit Amount (INR)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Enter deposit amount, e.g. 500"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="gradient-btn" style={{ padding: '14px', borderRadius: '10px', fontSize: '1rem' }}>
                  Generate Unique Deposit Account
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">

                <div style={{ background: 'rgba(253, 203, 110, 0.1)', color: 'var(--gold)', border: '1px solid rgba(253, 203, 110, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Lock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Secure Collision-Free Lock:</strong> This account details are exclusively mapped to your ID for the next 15 minutes.
                  </div>
                </div>

                {/* Live Expiration Countdown */}
                <div style={{ textAlign: 'center', padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>LOCK EXPIRES IN</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)', marginTop: '4px' }}>
                    {formatTimerValue(virtualAccountTimer)}
                  </div>
                </div>

                {/* QR Code */}
                {virtualAccount?.qrCode && (() => {
                  const qrUrl = virtualAccount.qrCode;
                  return (
                    <>
                      <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', width: '200px', height: '200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                          src={qrUrl}
                          alt="Payment QR Code"
                          style={{ width: '180px', height: '180px' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', marginBottom: '8px' }}>
                        <a
                          href={qrUrl}
                          download="FastPay_Payment_QR.png"
                          target="_blank"
                          rel="noreferrer"
                          className="gradient-btn"
                          style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', textDecoration: 'none', color: '#fff', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          Save to Gallery
                        </a>
                      </div>
                    </>
                  );
                })()}

                {/* UTR Input field */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>12-Digit Transaction UTR / Ref Number</label>
                  <input
                    type="text"
                    className="form-input"
                    maxLength={12}
                    placeholder="Enter 12-digit UTR ID"
                    value={depositUtr}
                    onChange={(e) => setDepositUtr(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                {/* Screenshot Upload field */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Upload Payment Screenshot / Receipt</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setDepositScreenshot(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    required
                  />
                  {depositScreenshot && (
                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Screenshot Preview:</span>
                      <img
                        src={depositScreenshot}
                        alt="Screenshot Preview"
                        style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleDepositProofSubmit}
                  className="gradient-btn"
                  disabled={virtualAccountTimer === 0}
                  style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '1rem', marginTop: '10px', opacity: virtualAccountTimer === 0 ? 0.5 : 1 }}
                >
                  Submit Deposit Details
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                  <button
                    onClick={() => setVirtualAccount(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Go Back
                  </button>
                  <button
                    onClick={() => { setShowDepositModal(false); setVirtualAccount(null); }}
                    style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    Cancel Deposit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL 3: WITHDRAWAL MODAL --- */}
      {showWithdrawModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">Cash-out Wallet Funds</h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

            {txMessage.text && (
              <div style={{
                background: txMessage.type === 'success' ? 'rgba(0, 184, 148, 0.1)' : 'rgba(255, 118, 117, 0.1)',
                color: txMessage.type === 'success' ? 'var(--success)' : 'var(--error)',
                padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                {txMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{txMessage.text}</span>
              </div>
            )}

            {!user?.isBankLinked ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  You must link a validated bank account or UPI ID before initiating cash-outs.
                </p>
                <button
                  onClick={() => { setShowWithdrawModal(false); setActiveTab('account'); }}
                  className="gradient-btn"
                  style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '0.9rem' }}
                >
                  Link Bank Details Now
                </button>
              </div>
            ) : (
              <form onSubmit={handleWithdrawalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                    Settling directly to linked Bank Name: <strong>{user?.bankDetails?.accountName}</strong> ({user?.bankDetails?.upi_id})
                  </span>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Wallet Balance:</span>
                      <strong>₹{user?.walletBalance?.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Locked (Active Schemes):</span>
                      <strong style={{ color: 'var(--error)' }}>₹{user?.lockedBalance?.toFixed(2) || '0.00'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px', marginTop: '4px' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Withdrawable Balance:</span>
                      <strong style={{ color: 'var(--success)', fontSize: '0.8rem' }}>₹{user?.withdrawableBalance?.toFixed(2) || user?.walletBalance?.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Required Minimum Limit:</span>
                      <strong>₹{user?.minWithdrawal !== undefined ? user.minWithdrawal.toFixed(2) : '200.00'}</strong>
                    </div>
                  </div>

                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Cashout Amount (INR)</label>
                  <input
                    type="number"
                    step="any"
                    className="form-input"
                    placeholder="Enter amount (e.g. ₹168.45)"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={withdrawLoading}
                  className="gradient-btn" 
                  style={{ padding: '14px', borderRadius: '10px', fontSize: '1rem', opacity: withdrawLoading ? 0.6 : 1, cursor: withdrawLoading ? 'not-allowed' : 'pointer' }}
                >
                  {withdrawLoading ? 'Processing Request...' : 'Request Settlement Transfer'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL: SPIN RESULT POPUP --- */}
      {spinResultModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '360px', padding: '30px 24px', textAlign: 'center', border: '1px solid var(--accent-secondary)' }}>
            <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '10px' }}>
              {spinResultModal.rewardType === 'cash' ? '🎉' : spinResultModal.rewardType === 'bonus' ? '🎫' : spinResultModal.rewardType === 'grand_prize' ? '📱' : '🍀'}
            </span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }} className="gradient-text">
              {spinResultModal.rewardType === 'cash' ? 'You Won Cash!' : spinResultModal.rewardType === 'bonus' ? 'Free Spin Awarded!' : spinResultModal.rewardType === 'grand_prize' ? 'Grand Prize Winner!' : 'Good Try!'}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.4' }}>
              {spinResultModal.rewardType === 'cash' ? (
                <>Congratulations! <strong>{spinResultModal.prize}</strong> has been credited to your wallet balance instantly.</>
              ) : spinResultModal.rewardType === 'bonus' ? (
                <>Nice! You won an additional free spin. Use it right away!</>
              ) : spinResultModal.rewardType === 'grand_prize' ? (
                <>Incredible! You won the grand prize: <strong>{spinResultModal.prize}</strong>. Admin has been notified for fulfillment details.</>
              ) : (
                <>No reward this time: <strong>{spinResultModal.prize}</strong>. Better luck next time!</>
              )}
            </p>
            <button
              className="gradient-btn"
              onClick={() => setSpinResultModal(null)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}
            >
              Collect & Continue
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL: LOTTERY COMING SOON POPUP --- */}
      {showLotteryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '360px', padding: '30px 24px', textAlign: 'center' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🎟️</span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }} className="gradient-text">FastPay Lottery</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.5' }}>
              Our premium lottery ticket and draws feature is currently under construction. Standby for massive prizes, gadget giveaways, and multipliers.
            </p>
            <div style={{
              background: 'rgba(253, 203, 110, 0.1)',
              color: 'var(--gold)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-block',
              marginBottom: '20px'
            }}>
              Coming Soon
            </div>
            <button
              className="gradient-btn"
              onClick={() => setShowLotteryModal(false)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL: PROFIT BREAKDOWN DETAIL POPUP --- */}
      {(showProfitDetailsPage || showMeProfitDetailsPage) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '24px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">Profit Summary Breakdown</h3>
              <button
                onClick={() => { setShowProfitDetailsPage(false); setShowMeProfitDetailsPage(false); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
              >
                Close
              </button>
            </div>

            {/* Total Profit Hero */}
            <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: '1px solid var(--glass-border)', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cumulative Earnings</span>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>₹{totalProfit.toFixed(2)}</div>
            </div>

            {/* Source Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>📈 Investment Profit</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>₹{investmentProfit.toFixed(2)}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>👥 Referral Profit</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>₹{referralProfit.toFixed(2)}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>⚡ Daily Commission</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>₹{commissionProfit.toFixed(2)}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>🎁 Bonus Rewards</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>₹{bonusProfit.toFixed(2)}</div>
              </div>
              {otherProfit > 0 && (
                <div style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>💼 Other Earnings</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>₹{otherProfit.toFixed(2)}</div>
                </div>
              )}
            </div>

            {/* Profit Transaction Log */}
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>Earning History Logs</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
              {completedTxs.filter(t => ['scheme_payout', 'referral_bonus_invited', 'referral_commission_l1', 'referral_commission_l2', 'task_reward', 'referral_bonus_signup'].includes(t.type) || (t.amount > 0 && t.type !== 'deposit' && t.type !== 'principal_return')).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No profit payouts logged yet.</div>
              ) : (
                completedTxs
                  .filter(t => ['scheme_payout', 'referral_bonus_invited', 'referral_commission_l1', 'referral_commission_l2', 'task_reward', 'referral_bonus_signup'].includes(t.type) || (t.amount > 0 && t.type !== 'deposit' && t.type !== 'principal_return'))
                  .map((t) => {
                    let sourceName = 'Other Earning';
                    let detailText = '';
                    if (t.type === 'scheme_payout') {
                      sourceName = 'Investment Profit';
                      detailText = t.scheme_name || 'Quick Deposit Scheme';
                    } else if (t.type === 'referral_bonus_invited') {
                      sourceName = 'Referral Profit';
                      detailText = 'Invite Reward (₹50)';
                    } else if (['referral_commission_l1', 'referral_commission_l2'].includes(t.type)) {
                      sourceName = 'Daily Commission';
                      detailText = t.type === 'referral_commission_l1' ? 'Level 1 Ref Commission' : 'Level 2 Ref Commission';
                    } else if (['task_reward', 'referral_bonus_signup'].includes(t.type)) {
                      sourceName = 'Bonus Reward';
                      detailText = t.type === 'task_reward' ? 'Promotional Task' : 'Signup Bonus';
                    }

                    return (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '6px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem' }}>
                        <div>
                          <strong style={{ display: 'block', color: 'var(--text-primary)', textAlign: 'left' }}>{sourceName}</strong>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', display: 'block', textAlign: 'left' }}>{detailText}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem', display: 'block', marginTop: '2px', textAlign: 'left' }}>{new Date(t.created_at).toLocaleDateString()}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: 'var(--success)', fontWeight: 700 }}>+₹{t.amount.toFixed(2)}</span>
                          <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--success)' }}>Completed</span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: PRINCIPAL BALANCE SCHEMES LIST --- */}
      {showPrincipalDetailsPage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">Invested Principal Details</h3>
              <button
                onClick={() => setShowPrincipalDetailsPage(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
              >
                Close
              </button>
            </div>

            {/* Total Principal Hero */}
            <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: '1px solid var(--glass-border)', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Active Principal</span>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-secondary)', marginTop: '4px' }}>
                ₹{orders.reduce((acc, o) => acc + (o.status === 'active' && o.days_remaining > 0 ? o.price : 0), 0).toFixed(2)}
              </div>
            </div>

            {/* Active Schemes List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.filter(o => o.status === 'active' && o.days_remaining > 0).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No active principal schemes found.</div>
              ) : (
                orders
                  .filter(o => o.status === 'active' && o.days_remaining > 0)
                  .map((order) => {
                    const purchaseDate = new Date(order.created_at);
                    let totalDays = 3;
                    if (order.scheme_id) {
                      const matchedScheme = adminSchemes?.find(s => s.id === order.scheme_id);
                      if (matchedScheme) {
                        totalDays = matchedScheme.days;
                      }
                    }
                    const expectedMaturityDate = new Date(purchaseDate.getTime() + totalDays * 24 * 60 * 60 * 1000);

                    return (
                      <div key={order.id || order._id} className="glass-panel" style={{ padding: '14px', border: '1px solid var(--glass-border)', fontSize: '0.8rem', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                          <strong style={{ color: 'var(--text-primary)' }}>{order.scheme_name || 'Investment Scheme'}</strong>
                          <span style={{ color: 'var(--success)', fontWeight: 700 }}>₹{order.price.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Purchase Date:</span>
                            <span style={{ color: 'var(--text-primary)' }}>{purchaseDate.toLocaleDateString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Remaining Days:</span>
                            <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>{order.days_remaining} Days</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Expected Maturity:</span>
                            <span style={{ color: 'var(--text-primary)' }}>{expectedMaturityDate.toLocaleDateString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '4px' }}>
                            <span>Current Status:</span>
                            <span style={{ color: 'var(--success)', fontWeight: 700, textTransform: 'capitalize' }}>{order.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: TODAY'S DEPOSIT DETAILS PAGE --- */}
      {showDepositDetailsPage && (() => {
        const userDeposits = txHistory.filter(t => t.type === 'deposit');
        userDeposits.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const totalCompleted = userDeposits.filter(d => d.status === 'completed').reduce((acc, d) => acc + d.amount, 0);
        const totalPending = userDeposits.filter(d => ['pending', 'confirmation_pending'].includes(d.status)).reduce((acc, d) => acc + d.amount, 0);
        const totalRejected = userDeposits.filter(d => ['rejected', 'failed', 'cancelled'].includes(d.status)).reduce((acc, d) => acc + d.amount, 0);

        const itemsPerPage = 8;
        const totalPages = Math.ceil(userDeposits.length / itemsPerPage) || 1;
        const paginatedList = userDeposits.slice((userDepositPage - 1) * itemsPerPage, userDepositPage * itemsPerPage);

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Outfit, sans-serif' }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '24px', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">Deposit Analytics Summary</h3>
                <button
                  onClick={() => setShowDepositDetailsPage(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
                >
                  Close
                </button>
              </div>

              {/* Grid of stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Approved Deposits</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)', marginTop: '4px' }}>₹{totalCompleted.toFixed(2)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Pending Deposits</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold)', marginTop: '4px' }}>₹{totalPending.toFixed(2)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', textAlign: 'center', gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Rejected Deposits</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--error)', marginTop: '4px' }}>₹{totalRejected.toFixed(2)}</div>
                </div>
              </div>

              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>Deposit Transaction History</h4>

              {userDeposits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No deposit history found.</div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {paginatedList.map(item => (
                      <div key={item.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{new Date(item.created_at).toLocaleString()}</span>
                          <strong style={{ color: item.status === 'completed' ? 'var(--success)' : ['pending', 'confirmation_pending'].includes(item.status) ? 'var(--gold)' : 'var(--error)' }}>
                            {item.status === 'completed' ? 'Approved' : ['pending', 'confirmation_pending'].includes(item.status) ? 'Pending' : 'Rejected'}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>TxID: {item.id}</span>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>₹{item.amount.toFixed(2)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                      <button
                        onClick={() => setUserDepositPage(prev => Math.max(1, prev - 1))}
                        disabled={userDepositPage === 1}
                        className="gradient-btn"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px', opacity: userDepositPage === 1 ? 0.5 : 1 }}
                      >
                        Previous
                      </button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Page {userDepositPage} of {totalPages}</span>
                      <button
                        onClick={() => setUserDepositPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={userDepositPage === totalPages}
                        className="gradient-btn"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px', opacity: userDepositPage === totalPages ? 0.5 : 1 }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* --- MODAL: TODAY'S WITHDRAWAL DETAILS PAGE --- */}
      {showWithdrawalDetailsPage && (() => {
        const userWithdrawals = txHistory.filter(t => t.type === 'withdrawal');
        userWithdrawals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const totalCompleted = userWithdrawals.filter(d => d.status === 'completed').reduce((acc, d) => acc + Math.abs(d.amount), 0);
        const totalPending = userWithdrawals.filter(d => d.status === 'pending').reduce((acc, d) => acc + Math.abs(d.amount), 0);
        const totalRejected = userWithdrawals.filter(d => ['rejected', 'failed', 'cancelled'].includes(d.status)).reduce((acc, d) => acc + Math.abs(d.amount), 0);

        const itemsPerPage = 8;
        const totalPages = Math.ceil(userWithdrawals.length / itemsPerPage) || 1;
        const paginatedList = userWithdrawals.slice((userWithdrawalPage - 1) * itemsPerPage, userWithdrawalPage * itemsPerPage);

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Outfit, sans-serif' }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '24px', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">Withdrawal Analytics Summary</h3>
                <button
                  onClick={() => setShowWithdrawalDetailsPage(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
                >
                  Close
                </button>
              </div>

              {/* Grid of stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Approved Withdrawals</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--error)', marginTop: '4px' }}>₹{totalCompleted.toFixed(2)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Pending Withdrawals</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold)', marginTop: '4px' }}>₹{totalPending.toFixed(2)}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', textAlign: 'center', gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Rejected Withdrawals</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--error)', marginTop: '4px' }}>₹{totalRejected.toFixed(2)}</div>
                </div>
              </div>

              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>Withdrawal Transaction History</h4>

              {userWithdrawals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No withdrawal history found.</div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {paginatedList.map(item => (
                      <div key={item.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{new Date(item.created_at).toLocaleString()}</span>
                          <strong style={{ color: item.status === 'completed' ? 'var(--success)' : item.status === 'pending' ? 'var(--gold)' : 'var(--error)' }}>
                            {item.status === 'completed' ? 'Approved' : item.status === 'pending' ? 'Pending' : 'Rejected'}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>TxID: {item.id}</span>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>₹{Math.abs(item.amount).toFixed(2)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                      <button
                        onClick={() => setUserWithdrawalPage(prev => Math.max(1, prev - 1))}
                        disabled={userWithdrawalPage === 1}
                        className="gradient-btn"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px', opacity: userWithdrawalPage === 1 ? 0.5 : 1 }}
                      >
                        Previous
                      </button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Page {userWithdrawalPage} of {totalPages}</span>
                      <button
                        onClick={() => setUserWithdrawalPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={userWithdrawalPage === totalPages}
                        className="gradient-btn"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px', opacity: userWithdrawalPage === totalPages ? 0.5 : 1 }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* --- MODAL 3: UNIFIED HISTORY DETAIL POPUP --- */}
      {selectedHistoryItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '24px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">Activity Details</h3>
              <button
                onClick={() => setSelectedHistoryItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Activity Type:</span>
                <strong style={{ textTransform: 'capitalize' }}>{selectedHistoryItem.title}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Amount Involved:</span>
                <strong style={{ color: selectedHistoryItem.amount > 0 ? 'var(--success)' : 'var(--error)', fontSize: '1.05rem' }}>
                  {selectedHistoryItem.amount > 0 ? `+₹${selectedHistoryItem.amount.toFixed(2)}` : `-₹${Math.abs(selectedHistoryItem.amount).toFixed(2)}`}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                <span style={{
                  fontSize: '0.75rem',
                  background: selectedHistoryItem.status === 'completed' || selectedHistoryItem.status === 'active' ? 'rgba(0, 184, 148, 0.1)' :
                    selectedHistoryItem.status === 'pending' ? 'rgba(253, 203, 110, 0.1)' : 'rgba(255, 118, 117, 0.1)',
                  color: selectedHistoryItem.status === 'completed' || selectedHistoryItem.status === 'active' ? 'var(--success)' :
                    selectedHistoryItem.status === 'pending' ? 'var(--gold)' : 'var(--error)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  textTransform: 'capitalize',
                  fontWeight: 600
                }}>
                  {selectedHistoryItem.type === 'withdrawal' ? (
                    selectedHistoryItem.status === 'completed' ? 'Approved' :
                    selectedHistoryItem.status === 'failed' ? 'Rejected' :
                    selectedHistoryItem.status === 'pending' ? 'Pending' : selectedHistoryItem.status
                  ) : (
                    selectedHistoryItem.status
                  )}
                </span>
              </div>



              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Date & Time:</span>
                <strong>{selectedHistoryItem.date.toLocaleDateString()} {selectedHistoryItem.date.toLocaleTimeString()}</strong>
              </div>



              {selectedHistoryItem.type === 'withdrawal' && (
                <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '10px', marginTop: '4px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--accent-secondary)' }}>Settlement Destination Bank/UPI:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div>Bank Name: <strong>{selectedHistoryItem.raw.withdrawal_bank_name || 'UPI/Bank'}</strong></div>
                    <div>Account Holder: <strong>{selectedHistoryItem.raw.withdrawal_account_name || 'N/A'}</strong></div>
                    <div>Account Number: <strong>{selectedHistoryItem.raw.withdrawal_account_number || 'N/A'}</strong></div>
                    {selectedHistoryItem.raw.withdrawal_ifsc && <div>IFSC Code: <strong>{selectedHistoryItem.raw.withdrawal_ifsc}</strong></div>}
                    {selectedHistoryItem.raw.withdrawal_upi_id && <div>UPI ID: <strong>{selectedHistoryItem.raw.withdrawal_upi_id}</strong></div>}
                    {selectedHistoryItem.raw.rejection_reason && <div style={{ color: 'var(--error)', marginTop: '4px' }}>Rejection Reason: <strong>{selectedHistoryItem.raw.rejection_reason}</strong></div>}
                  </div>
                </div>
              )}

              {selectedHistoryItem.itemType === 'order' && (
                <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '10px', marginTop: '4px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--accent-secondary)' }}>Subscription Order Metadata:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <div>UTR/Ref Code: <strong>{selectedHistoryItem.raw.utr || 'N/A'}</strong></div>
                    <div>Daily Yield: <strong style={{ color: 'var(--success)' }}>₹{selectedHistoryItem.raw.daily_income?.toFixed(2)}</strong></div>
                    {selectedHistoryItem.raw.days_remaining !== undefined && (
                      <div>Duration remaining: <strong>{selectedHistoryItem.raw.days_remaining} Days</strong></div>
                    )}
                  </div>
                </div>
              )}

              {selectedHistoryItem.itemType === 'order' && selectedHistoryItem.status === 'pending' && (
                <button
                  onClick={() => handleReopenPendingPayment(selectedHistoryItem.raw)}
                  className="gradient-btn"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '0.9rem', marginTop: '16px' }}
                >
                  💳 Complete Payment / Repay
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- PERSISTENT BOTTOM TAB BAR NAVIGATION --- */}
      <nav className="bottom-nav">
        <button
          onClick={() => setActiveTab('home')}
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
        >
          <HomeIcon className="nav-icon" />
          <span>Home</span>
        </button>

        <button
          onClick={() => { setActiveTab('wallet'); fetchTasksProgress(); }}
          className={`nav-item ${activeTab === 'wallet' ? 'active' : ''}`}
        >
          <Wallet className="nav-icon" />
          <span>Wallet</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
        >
          <TrendingUp className="nav-icon" />
          <span>Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`nav-item ${activeTab === 'team' ? 'active' : ''}`}
        >
          <Users className="nav-icon" />
          <span>Team</span>
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`nav-item ${activeTab === 'account' ? 'active' : ''}`}
        >
          <CreditCard className="nav-icon" />
          <span>Account</span>
        </button>

        <button
          onClick={() => setActiveTab('me')}
          className={`nav-item ${activeTab === 'me' ? 'active' : ''}`}
        >
          <UserIcon className="nav-icon" />
          <span>Me</span>
        </button>
      </nav>

      {/* --- DOWNLOAD HELP MODAL --- */}
      {showDownloadHelp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Outfit, sans-serif' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '24px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }} className="gradient-text">APK Download Guide</h3>
              <button
                onClick={() => setShowDownloadHelp(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
              >
                Close
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <p>
                If your browser blocks the direct APK download or you encounter compatibility issues on Android 10-14+, please try these steps:
              </p>
              
              <div style={{ borderLeft: '3px solid var(--accent-secondary)', paddingLeft: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>1. Use the Fallback Mirror:</strong>
                <span>Try downloading the APK with a general binary stream.</span>
                <a
                  href={`${getCleanApkUrl(apkDownloadUrl)}?mirror=true`}
                  className="gradient-btn interactive-card"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    color: '#fff',
                    marginTop: '6px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                  download="FastPay.apk"
                >
                  🚀 Download via Fallback Mirror
                </a>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <strong style={{ color: 'var(--text-primary)' }}>2. How to allow the download:</strong>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>• Chrome / Edge:</span>
                  <span>If prompted with "File might be harmful", tap <strong>Download anyway</strong>. If blocked, go to Android Settings &gt; Apps &gt; Chrome &gt; Install unknown apps &gt; Toggle <strong>Allow from this source</strong>.</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>• Samsung Internet:</span>
                  <span>Tap <strong>Download</strong> on the popup prompt. If blocked, go to Settings &gt; Apps &gt; Samsung Internet &gt; Install unknown apps &gt; Toggle <strong>Allow from this source</strong>.</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>• Firefox:</span>
                  <span>Tap <strong>Allow</strong>/<strong>Download</strong> when prompted. After download, enable installation permissions in Firefox settings when requested.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- OFFLINE OVERLAY BLOCK --- */}
      {isOffline && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Outfit, sans-serif' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '340px', padding: '32px', textAlign: 'center', border: '1px solid rgba(255, 118, 117, 0.4)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📶</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '10px', color: '#ff7675' }}>No Internet Connection</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.4' }}>
              Please check your network connection and try again. The app will automatically reconnect.
            </p>
            <button
              className="gradient-btn"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', background: 'linear-gradient(135deg, #ff7675 0%, #d63031 100%)' }}
              onClick={async () => {
                if (typeof window !== 'undefined') {
                  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                    const { Network } = await import('@capacitor/network');
                    const status = await Network.getStatus();
                    setIsOffline(!status.connected);
                  } else {
                    setIsOffline(!navigator.onLine);
                  }
                }
              }}
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

const CanvasWheel = ({ spinning, targetIndex, onFinished }) => {
  const canvasRef = useRef(null);
  const prizeLabels = ["₹50", "₹100", "₹200", "₹500", "Bonus Spin", "Try Again", "Good Luck", "iPhone 17"];
  const colors = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#9b59b6", "#1abc9c", "#e67e22", "#fdcb6e"];
  const currentRotation = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const radius = width / 2 - 10;

    const draw = (angle) => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(angle);

      // Draw segments
      const slice = (2 * Math.PI) / 8;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, i * slice, (i + 1) * slice);
        ctx.closePath();
        ctx.fillStyle = colors[i];
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.stroke();

        // Draw Text
        ctx.save();
        ctx.rotate(i * slice + slice / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(prizeLabels[i], radius - 15, 4);
        ctx.restore();
      }

      // Draw center circle decoration
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, 2 * Math.PI);
      ctx.fillStyle = '#2c3e50';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
    };

    if (spinning && targetIndex !== null) {
      let start = null;
      const slice = (2 * Math.PI) / 8;
      const targetAngle = (1.5 * Math.PI) - (targetIndex * slice) - (slice / 2);
      const totalSpin = currentRotation.current + (10 * Math.PI) + targetAngle - (currentRotation.current % (2 * Math.PI));
      const duration = 4000; // 4 seconds

      const animate = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min(1, (timestamp - start) / duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        const currentAngle = currentRotation.current + ease * (totalSpin - currentRotation.current);
        
        draw(currentAngle);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          currentRotation.current = currentAngle % (2 * Math.PI);
          onFinished();
        }
      };

      requestAnimationFrame(animate);
    } else {
      draw(currentRotation.current);
    }
  }, [spinning, targetIndex]);

  return (
    <div style={{ position: 'relative', width: '280px', height: '280px', margin: 'auto' }}>
      <canvas ref={canvasRef} width="280" height="280" style={{ display: 'block', borderRadius: '50%', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} />
      <div style={{
        position: 'absolute',
        top: '-10px',
        left: 'calc(50% - 12px)',
        width: 0,
        height: 0,
        borderLeft: '12px solid transparent',
        borderRight: '12px solid transparent',
        borderTop: '20px solid var(--accent-secondary)',
        filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))',
        zIndex: 5
      }}></div>
    </div>
  );
};
