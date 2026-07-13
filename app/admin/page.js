'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';
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
  ArrowLeft,
  Search,
  Filter,
  Trash2,
  Check,
  X,
  FileText,
  Mail,
  Bell,
  Settings,
  Upload,
  Calendar,
  LockKeyhole,
  Phone,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Shield,
  Activity,
  Award,
  Gamepad2,
  Coins
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();

  // Authentication State
  const [authState, setAuthState] = useState('loading'); // 'loading', 'auth', 'app'
  const [user, setUser] = useState(null);
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Layout & UI State
  const [adminActiveSubTab, setAdminActiveSubTab] = useState('overview');
  const [adminView, setAdminView] = useState('dashboard'); // 'dashboard', 'combined-balance', 'active-investments', 'user-profile', 'admin-order-detail'
  const [adminLoading, setAdminLoading] = useState(false);
  const [brokenImages, setBrokenImages] = useState({});

  // Search & Filter States
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [userSort, setUserSort] = useState('date-desc');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);

  const [cbSearch, setCbSearch] = useState('');
  const [cbFilter, setCbFilter] = useState('all');
  const [cbSort, setCbSort] = useState('balance-desc');
  const [cbPage, setCbPage] = useState(1);

  const [aiSearch, setAiSearch] = useState('');
  const [aiFilter, setAiFilter] = useState('all');
  const [aiSort, setAiSort] = useState('amount-desc');
  const [aiPage, setAiPage] = useState(1);

  const [adminTxFilter, setAdminTxFilter] = useState('pending');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  const [adminOrderFilter, setAdminOrderFilter] = useState('pending');
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);

  const [withdrawalFilter, setWithdrawalFilter] = useState('all');
  const [withdrawalDateRange, setWithdrawalDateRange] = useState('all');
  const [withdrawalSearchQuery, setWithdrawalSearchQuery] = useState('');
  const [withdrawalSort, setWithdrawalSort] = useState('date-desc');
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [withdrawalStartDate, setWithdrawalStartDate] = useState('');
  const [withdrawalEndDate, setWithdrawalEndDate] = useState('');
  const [adminWithdrawalsTotalCount, setAdminWithdrawalsTotalCount] = useState(0);

  // Admin Data Lists
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
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminTransactions, setAdminTransactions] = useState([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState([]);
  const [adminWithdrawalsTotalPages, setAdminWithdrawalsTotalPages] = useState(1);
  const [adminWithdrawalsStats, setAdminWithdrawalsStats] = useState({ totalPendingCount: 0, totalApprovedCount: 0, totalRejectedCount: 0, totalPaidAmount: 0, totalUsersWithdrawn: 0 });
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminSchemes, setAdminSchemes] = useState([]);
  const [adminVirtualAccounts, setAdminVirtualAccounts] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);

  // Profile details states
  const [selectedAdminUserId, setSelectedAdminUserId] = useState(null);
  const [adminUserProfileData, setAdminUserProfileData] = useState(null);
  const [adminUserProfileLoading, setAdminUserProfileLoading] = useState(false);
  const [adminUserSubView, setAdminUserSubView] = useState(null);
  const [adminSelectedOrder, setAdminSelectedOrder] = useState(null);

  // Referral Reward Tasks States
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

  // APK & PWA States
  const [apkDownloadUrl, setApkDownloadUrl] = useState('');
  const [newApkDownloadUrl, setNewApkDownloadUrl] = useState('');
  const [apkUploadLoading, setApkUploadLoading] = useState(false);
  const [adminPwaName, setAdminPwaName] = useState('FastPay');
  const [adminPwaShortName, setAdminPwaShortName] = useState('FastPay');
  const [adminPwaThemeColor, setAdminPwaThemeColor] = useState('#000000');
  const [adminPwaBackgroundColor, setAdminPwaBackgroundColor] = useState('#000000');
  const [adminPwaIcon, setAdminPwaIcon] = useState('/icon-192.png');
  const [adminPwaSplashScreen, setAdminPwaSplashScreen] = useState('/icon-512.png');
  const [adminPwaInstallPromptText, setAdminPwaInstallPromptText] = useState('');
  const [adminPwaVersion, setAdminPwaVersion] = useState('1.0.0');
  const [adminPwaUpdateNotes, setAdminPwaUpdateNotes] = useState('');

  // Scheme Form States
  const [newSchemeName, setNewSchemeName] = useState('');
  const [newSchemePrice, setNewSchemePrice] = useState('');
  const [newSchemeRate, setNewSchemeRate] = useState('');
  const [newSchemeDays, setNewSchemeDays] = useState('');
  const [newSchemeTotalReturn, setNewSchemeTotalReturn] = useState('');
  const [editSchemeId, setEditSchemeId] = useState(null);

  // Payment Account Form States
  const [newPaBankName, setNewPaBankName] = useState('Axis Bank');
  const [newPaBeneficiaryName, setNewPaBeneficiaryName] = useState('');
  const [newPaAccountNumber, setNewPaAccountNumber] = useState('');
  const [newPaIfsc, setNewPaIfsc] = useState('');
  const [newPaUpiId, setNewPaUpiId] = useState('');
  const [newPaQrCode, setNewPaQrCode] = useState(null);
  const [newPaQrCodeData, setNewPaQrCodeData] = useState('');
  const [newPaAllowConcurrent, setNewPaAllowConcurrent] = useState(false);

  // Refs for element selectors
  const searchInputRef = useRef(null);

  // 1. Initial Authentication & Role Check
  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user && data.user.role === 'admin') {
        setUser(data.user);
        setAuthState('app');
        initializeAdminData();
      } else {
        setUser(null);
        setAuthState('auth');
      }
    } catch (e) {
      setUser(null);
      setAuthState('auth');
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // Keyboard Shortcuts (Esc to close details/modals, / to focus search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setAdminUserProfileData(null);
        setAdminSelectedOrder(null);
        setAdminSelectedWeekDetails(null);
        if (adminView !== 'dashboard') {
          setAdminView('dashboard');
        }
      }
      if (e.key === '/' && document.activeElement !== searchInputRef.current && authState === 'app') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [adminView, authState]);

  // Load and refresh tab-specific datasets
  useEffect(() => {
    if (authState !== 'app') return;
    refreshActiveTabData();
  }, [
    adminActiveSubTab,
    adminView,
    userPage,
    userFilter,
    userSort,
    txPage,
    adminTxFilter,
    ordersPage,
    adminOrderFilter,
    withdrawalPage,
    withdrawalFilter,
    withdrawalDateRange,
    withdrawalStartDate,
    withdrawalEndDate,
    withdrawalSort,
    adminReferralTasksPage,
    adminLotteryStatusFilter,
    adminLotteryWeekFilter
  ]);

  const refreshActiveTabData = () => {
    if (adminActiveSubTab === 'overview') {
      fetchAdminStats();
    } else if (adminActiveSubTab === 'users' && adminView === 'dashboard') {
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
    } else if (adminActiveSubTab === 'schemes' || adminActiveSubTab === 'payment-accounts') {
      fetchAdminData();
    } else if (adminActiveSubTab === 'notifications') {
      fetchAdminNotifications();
    }
  };

  const initializeAdminData = () => {
    fetchAdminStats();
    fetchAdminNotifications();
    fetchAdminData();
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!authPhone || !authPassword) {
      setAuthError('Phone number and password are required.');
      return;
    }
    setLoginLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: authPhone.trim(), password: authPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user.role === 'admin') {
          setUser(data.user);
          setAuthState('app');
          initializeAdminData();
        } else {
          // Log out immediately as they are not authorized admin
          await fetch('/api/auth/logout', { method: 'POST' });
          setAuthError('Access Denied: Only administrators can access this panel.');
        }
      } else {
        setAuthError(data.error || 'Invalid credentials.');
      }
    } catch (e) {
      setAuthError('Login request failed. Server error.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to sign out of the Admin Console?')) return;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setAuthState('auth');
    } catch (e) {
      alert('Logout failed.');
    }
  };

  // API Call Implementations
  const fetchAdminStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setAdminStats(data.stats);
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  const fetchAdminUsers = async (page = 1, search = '') => {
    setAdminLoading(true);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=20&search=${encodeURIComponent(search)}&filter=${userFilter}&sort=${userSort}`);
      const data = await res.json();
      if (data.success) {
        setAdminUsers(data.users);
        setUserPage(data.pagination.page);
        setUserTotalPages(data.pagination.pages);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
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
      }
    } catch (e) {
      console.error('Error fetching transactions:', e);
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchAdminWithdrawals = async (page = 1, filter = 'all', search = '', dateRange = 'all', startDate = '', endDate = '', sort = 'date-desc') => {
    setAdminLoading(true);
    try {
      const url = `/api/admin/withdrawals?page=${page}&limit=15&status=${filter}&search=${encodeURIComponent(search)}&dateRange=${dateRange}&startDate=${startDate}&endDate=${endDate}&sort=${sort}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAdminWithdrawals(data.withdrawals);
        setAdminWithdrawalsTotalPages(data.pagination.pages);
        setAdminWithdrawalsTotalCount(data.pagination.total);
        setAdminWithdrawalsStats(data.stats);
      }
    } catch (e) {
      console.error('Error fetching withdrawals:', e);
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
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setAdminLoading(false);
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
      console.error('Error fetching referral tasks:', err);
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
      console.error('Error spin configs:', err);
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
      console.error('Error lottery data:', err);
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
      alert('Error running manual draw.');
    }
  };

  const handleAdminMilestoneAction = async (action, userId, milestone) => {
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
      alert(`Error during milestone ${action}.`);
    }
  };

  const fetchAdminNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      if (data.success) setAdminNotifications(data.notifications);
    } catch (e) { }
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
    fetchAdminStats();
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
        refreshActiveTabData();
      } else {
        alert(data.error || 'Admin action failed.');
      }
    } catch (e) {
      alert('Error running admin action.');
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
        body: JSON.stringify({ action: 'togglePaymentAccountStatus', payload: { id } })
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
        body: JSON.stringify({ action: 'togglePaymentAccountConcurrent', payload: { id } })
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
        body: JSON.stringify({ action: 'deletePaymentAccount', payload: { id } })
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

  const handleAddSchemeSubmit = async (e) => {
    e.preventDefault();
    if (!newSchemeName || !newSchemePrice || !newSchemeRate || !newSchemeDays || !newSchemeTotalReturn) {
      alert('Please fill out all fields.');
      return;
    }
    const payload = {
      name: newSchemeName,
      price: parseFloat(newSchemePrice),
      dailyReturnRate: parseFloat(newSchemeRate) / 100,
      days: parseInt(newSchemeDays),
      totalReturn: parseFloat(newSchemeTotalReturn)
    };
    if (editSchemeId) {
      payload.id = editSchemeId;
      await handleAdminAction('editScheme', payload);
      setEditSchemeId(null);
    } else {
      await handleAdminAction('addScheme', payload);
    }
    setNewSchemeName('');
    setNewSchemePrice('');
    setNewSchemeRate('');
    setNewSchemeDays('');
    setNewSchemeTotalReturn('');
  };

  const handleTransactionApproval = async (txId, action) => {
    const act = action === 'approve' ? 'approveDeposit' : 'rejectDeposit';
    const note = action === 'reject' ? prompt('Enter rejection reason:') : '';
    if (action === 'reject' && note === null) return;
    await handleAdminAction(act, { id: txId, notes: note || '' });
    refreshActiveTabData();
  };

  const handleWithdrawalApproval = async (withdrawalId, action) => {
    const act = action === 'approve' ? 'approveWithdrawal' : 'rejectWithdrawal';
    const note = action === 'reject' ? prompt('Enter rejection reason:') : '';
    if (action === 'reject' && note === null) return;
    await handleAdminAction(act, { id: withdrawalId, reason: note || '' });
    refreshActiveTabData();
  };

  // helper function to parse QR files
  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewPaQrCode(reader.result);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code) {
          setNewPaQrCodeData(code.data);
        } else {
          setNewPaQrCodeData('');
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  // Rendering loading screen while verifying session
  if (authState === 'loading') {
    return (
      <div style={{
        background: '#090d16',
        color: '#ffffff',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Outfit, sans-serif'
      }}>
        <RefreshCw style={{ animation: 'spin 1.5s linear infinite', color: '#6c5ce7' }} size={40} />
        <h2 style={{ fontSize: '1.2rem', marginTop: '16px', fontWeight: 500, color: '#a0a8c0' }}>Authenticating Admin Access...</h2>
        <style jsx global>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Render Admin Login Form
  if (authState === 'auth') {
    return (
      <div style={{
        background: 'radial-gradient(circle at top right, #111827, #090d16)',
        color: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Outfit, sans-serif',
        padding: '24px'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.45)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          borderRadius: '16px',
          padding: '40px 32px',
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #a78bfa 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '1px',
              margin: '0 0 8px 0'
            }}>FastPay Admin</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Secure Dashboard Gateway Control</p>
          </div>

          {authError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={18} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
                <input
                  type="tel"
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '12px 16px 12px 42px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  placeholder="Enter admin phone number"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <LockKeyhole size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
                <input
                  type="password"
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    padding: '12px 16px 12px 42px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  placeholder="Enter security password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(108, 92, 231, 0.3)',
                transition: 'opacity 0.2s'
              }}
            >
              {loginLoading ? <RefreshCw style={{ animation: 'spin 1s linear infinite' }} size={18} /> : <Lock size={18} />}
              Authenticate Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render Full Admin dashboard Workspace
  return (
    <div style={{
      background: '#090d16',
      color: '#f8fafc',
      minHeight: '100vh',
      display: 'flex',
      fontFamily: 'Outfit, sans-serif'
    }}>
      {/* 1. STICKY LEFT SIDEBAR */}
      <aside style={{
        width: '260px',
        background: '#0f172a',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 100
      }}>
        {/* Sidebar Header Brand */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Shield style={{ color: '#a78bfa' }} size={24} />
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, background: 'linear-gradient(135deg, #a78bfa 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.5px' }}>FASTPAY</span>
            <span style={{ display: 'block', fontSize: '0.65rem', color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>Control Panel</span>
          </div>
        </div>

        {/* Sidebar Tabs Links */}
        <nav style={{
          flex: 1,
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto'
        }}>
          {[
            { id: 'overview', label: 'Platform Overview', icon: HomeIcon },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'transactions', label: 'Deposit Requests', icon: ArrowDownLeft },
            { id: 'withdrawals', label: 'Withdrawal Requests', icon: ArrowUpRight },
            { id: 'orders', label: 'Investment Orders', icon: CreditCard },
            { id: 'schemes', label: 'Investment Schemes', icon: TrendingUp },
            { id: 'spin-management', label: 'Spin Management', icon: Gamepad2 },
            { id: 'lottery-management', label: 'Lottery Management', icon: Coins },
            { id: 'referral-tasks', label: 'Referral Reward Tasks', icon: Award },
            { id: 'pwa-settings', label: 'PWA Settings Config', icon: Settings },
            { id: 'payment-accounts', label: 'Payment Accounts', icon: Wallet },
            { id: 'notifications', label: 'System Alerts Log', icon: Bell, badge: adminNotifications.filter(n => !n.is_read).length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = adminActiveSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setAdminActiveSubTab(tab.id);
                  setAdminView('dashboard');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(108, 92, 231, 0.15)' : 'transparent',
                  color: isActive ? '#c084fc' : '#94a3b8',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s, color 0.2s'
                }}
              >
                <Icon size={18} style={{ color: isActive ? '#a78bfa' : '#64748b' }} />
                <span style={{ flex: 1 }}>{tab.label}</span>
                {tab.badge > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    padding: '2px 6px',
                    minWidth: '18px',
                    textAlign: 'center'
                  }}>{tab.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Logout */}
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <LogOut size={16} />
            <span>Sign Out Control</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTAINER */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
      }}>
        {/* STICKY TOP NAVIGATION */}
        <header style={{
          height: '70px',
          background: '#0f172a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 90
        }}>
          {/* Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Dashboard</span>
            <ChevronRight size={14} style={{ color: '#475569' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#a78bfa', textTransform: 'capitalize' }}>
              {adminActiveSubTab.replace('-', ' ')}
            </span>
            {adminView !== 'dashboard' && (
              <>
                <ChevronRight size={14} style={{ color: '#475569' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', textTransform: 'capitalize' }}>
                  {adminView.replace('-', ' ')}
                </span>
              </>
            )}
          </div>

          {/* Quick Info & Session Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Database indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '6px 12px', borderRadius: '12px' }}>
              <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }}></span>
              <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600 }}>SQLITE SERVER ONLINE</span>
            </div>

            <div style={{ height: '24px', width: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>

            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              Logged in as: <strong style={{ color: '#f1f5f9' }}>{user?.username}</strong>
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT SCROLL VIEW */}
        <main style={{
          flex: 1,
          padding: '32px',
          overflowY: 'auto'
        }}>
          {adminLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(108, 92, 231, 0.1)', border: '1px solid rgba(108, 92, 231, 0.2)', padding: '12px 20px', borderRadius: '8px', color: '#a29bfe', fontSize: '0.85rem', marginBottom: '24px' }}>
              <RefreshCw style={{ animation: 'spin 1.2s linear infinite' }} size={16} />
              <span>Fetching secure data records...</span>
            </div>
          )}

          {/* ==================== SUB-TAB: OVERVIEW ==================== */}
          {adminActiveSubTab === 'overview' && (
            <>
              {adminView === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {/* Grid Multi-column Overview Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    {/* card 1 */}
                    <div
                      onClick={() => { setAdminActiveSubTab('users'); setAdminView('dashboard'); }}
                      style={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        padding: '24px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                        transition: 'transform 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '140px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Total Registered Clients</span>
                        <Users style={{ color: '#60a5fa' }} size={20} />
                      </div>
                      <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace', margin: '12px 0 6px 0' }}>
                        {adminStats.totalUsers}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 500 }}>✓ Live SQLite accounts</span>
                    </div>

                    {/* card 2 */}
                    <div
                      onClick={() => { setCbPage(1); setCbSearch(''); setCbFilter('all'); setAdminView('combined-balance'); }}
                      style={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        border: '1px solid rgba(0, 184, 148, 0.3)',
                        padding: '24px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                        transition: 'transform 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '140px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Combined Liabilities balance</span>
                        <Wallet style={{ color: '#34d399' }} size={20} />
                      </div>
                      <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace', margin: '12px 0 6px 0' }}>
                        ₹{adminStats.totalUserBalances.toFixed(2)}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 500 }}>👁 Click to view detail distribution</span>
                    </div>

                    {/* card 3 */}
                    <div
                      onClick={() => { setAiPage(1); setAiSearch(''); setAiFilter('all'); setAdminView('active-investments'); }}
                      style={{
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                        border: '1px solid rgba(253, 203, 110, 0.3)',
                        padding: '24px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                        transition: 'transform 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '140px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Locked Active Investments</span>
                        <TrendingUp style={{ color: '#fbbf24' }} size={20} />
                      </div>
                      <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace', margin: '12px 0 6px 0' }}>
                        ₹{adminStats.activeInvestments.toFixed(2)}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#f472b6', fontWeight: 500 }}>👁 Click to audit active schemes</span>
                    </div>
                  </div>

                  {/* Diagnostic channels */}
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '8px 0 0 0', color: '#f1f5f9', letterSpacing: '0.5px' }}>Transactional Protocol Diagnostics</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div style={{ background: '#0f172a', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.35)' }}>
                      <span style={{ fontSize: '#0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Completed Deposit Capital</span>
                      <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#4ade80', fontFamily: 'monospace', margin: '12px 0' }}>
                        ₹{adminStats.totalDeposits.toFixed(2)}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                        <span>Pending Deposits Queue:</span>
                        <strong style={{ color: '#fbbf24' }}>{adminStats.pendingDepositsCount} requests (₹{adminStats.pendingDepositsTotal.toFixed(2)})</strong>
                      </div>
                    </div>

                    <div style={{ background: '#0f172a', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.35)' }}>
                      <span style={{ fontSize: '#0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Total Withdrawals Paid Out</span>
                      <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f87171', fontFamily: 'monospace', margin: '12px 0' }}>
                        ₹{adminStats.totalWithdrawals.toFixed(2)}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                        <span>Pending Withdrawals Queue:</span>
                        <strong style={{ color: '#fbbf24' }}>{adminStats.pendingWithdrawalsCount} requests</strong>
                      </div>
                    </div>
                  </div>

                  {/* APK upload configurations */}
                  <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f1f5f9' }}>APK Installer Distribution Protocols</h3>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Client APK Download Link URL</label>
                        <input
                          type="text"
                          style={{
                            width: '100%',
                            background: '#090d16',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: '#ffffff',
                            padding: '10px 14px',
                            fontSize: '0.9rem',
                            outline: 'none'
                          }}
                          value={newApkDownloadUrl}
                          onChange={(e) => setNewApkDownloadUrl(e.target.value)}
                        />
                      </div>
                      <button
                        onClick={handleSaveApkUrl}
                        style={{
                          background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          marginTop: '22px',
                          cursor: 'pointer'
                        }}
                      >
                        Update APK Link
                      </button>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Alternatively, upload APK file directly (Max 50MB):</span>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <input
                          type="file"
                          accept=".apk"
                          onChange={handleApkFileUpload}
                          disabled={apkUploadLoading}
                          style={{
                            background: '#090d16',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '8px',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            color: '#cbd5e1'
                          }}
                        />
                        {apkUploadLoading && (
                          <span style={{ fontSize: '0.85rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <RefreshCw style={{ animation: 'spin 1.2s linear infinite' }} size={14} /> Uploading file...
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Current APK URL: <code style={{ color: '#94a3b8' }}>{apkDownloadUrl}</code></span>
                    </div>
                  </div>
                </div>
              )}

              {/* OVERVIEW DETAILED PROTOCOLS: COMBINED BALANCES */}
              {adminView === 'combined-balance' && (
                <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={() => setAdminView('dashboard')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <ArrowLeft size={16} />
                      </button>
                      <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Liabilities balance distribution audit</h2>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Complete breakdown of user holdings inside system database</span>
                      </div>
                    </div>
                  </div>

                  {/* Filter elements */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search by client identifier/phone (Press '/' to focus)"
                        style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px 10px 38px', outline: 'none' }}
                        value={cbSearch}
                        onChange={(e) => setCbSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Table */}
                  <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>User info</th>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Phone</th>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Balance</th>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Role</th>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUsers.filter(u => u.username.toLowerCase().includes(cbSearch.toLowerCase()) || u.phone.includes(cbSearch)).map((u) => (
                          <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f1f5f9' }}>{u.username}</td>
                            <td style={{ padding: '14px 16px', color: '#cbd5e1', fontFamily: 'monospace' }}>{u.phone}</td>
                            <td style={{ padding: '14px 16px', color: '#4ade80', fontWeight: 700, fontFamily: 'monospace' }}>₹{u.walletBalance.toFixed(2)}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ fontSize: '0.75rem', background: u.role === 'admin' ? 'rgba(167, 139, 250, 0.12)' : 'rgba(255,255,255,0.08)', color: u.role === 'admin' ? '#c084fc' : '#94a3b8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                {u.role.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <button
                                onClick={() => {
                                  setSelectedAdminUserId(u.id);
                                  setAdminView('user-profile');
                                  fetchUserProfileDetails(u.id);
                                }}
                                style={{ background: 'rgba(108, 92, 231, 0.1)', border: '1px solid rgba(108,92,231,0.2)', padding: '6px 12px', borderRadius: '4px', color: '#a29bfe', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Audit profile
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* OVERVIEW DETAILED PROTOCOLS: ACTIVE INVESTMENTS */}
              {adminView === 'active-investments' && (
                <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={() => setAdminView('dashboard')} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <ArrowLeft size={16} />
                      </button>
                      <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Active Scheme Investment Value audit</h2>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Complete log of active purchasing matching user nodes</span>
                      </div>
                    </div>
                  </div>

                  {/* Filter elements */}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search by scheme name or user code..."
                        style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px 10px 38px', outline: 'none' }}
                        value={aiSearch}
                        onChange={(e) => setAiSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Table */}
                  <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Client User</th>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Scheme Product</th>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Amount Locked</th>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Daily Return</th>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Days Remaining</th>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>UTR Number</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminOrders.filter(o => o.scheme_name.toLowerCase().includes(aiSearch.toLowerCase()) || o.username.toLowerCase().includes(aiSearch.toLowerCase())).map((o) => (
                          <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f1f5f9' }}>{o.username}</td>
                            <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>{o.scheme_name}</td>
                            <td style={{ padding: '14px 16px', color: '#4ade80', fontWeight: 700, fontFamily: 'monospace' }}>₹{o.price.toFixed(2)}</td>
                            <td style={{ padding: '14px 16px', color: '#fbbf24', fontWeight: 600, fontFamily: 'monospace' }}>₹{o.daily_income.toFixed(2)}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: '#a78bfa' }}>{o.days_remaining} / {o.days} Days</td>
                            <td style={{ padding: '14px 16px', color: '#cbd5e1', fontFamily: 'monospace' }}>{o.utr}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==================== SUB-TAB: USER MANAGEMENT ==================== */}
          {adminActiveSubTab === 'users' && (
            <>
              {adminView === 'dashboard' && (
                <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Registered Client Management</h2>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Search accounts, audit balances, adjust wallets, suspend users</span>
                    </div>
                  </div>

                  {/* Filters grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search clients by username or phone number... (Press '/' to focus)"
                        style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px 10px 38px', outline: 'none' }}
                        value={userSearch}
                        onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                      />
                    </div>
                    <div>
                      <select
                        style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }}
                        value={userFilter}
                        onChange={(e) => { setUserFilter(e.target.value); setUserPage(1); }}
                      >
                        <option value="all">All Accounts</option>
                        <option value="active">Active Only</option>
                        <option value="suspended">Suspended Only</option>
                        <option value="admins">Admins Only</option>
                      </select>
                    </div>
                    <div>
                      <select
                        style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }}
                        value={userSort}
                        onChange={(e) => { setUserSort(e.target.value); setUserPage(1); }}
                      >
                        <option value="date-desc">Newest Clients</option>
                        <option value="date-asc">Oldest Clients</option>
                        <option value="balance-desc">Highest Balance</option>
                        <option value="balance-asc">Lowest Balance</option>
                      </select>
                    </div>
                  </div>

                  {/* Wider Table */}
                  <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Username</th>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Phone</th>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Email</th>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Balance</th>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Status</th>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Role</th>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Created At</th>
                          <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUsers.map((u) => (
                          <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f1f5f9' }}>{u.username}</td>
                            <td style={{ padding: '14px 16px', color: '#cbd5e1', fontFamily: 'monospace' }}>{u.phone}</td>
                            <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>{u.email || '-'}</td>
                            <td style={{ padding: '14px 16px', color: '#4ade80', fontWeight: 700, fontFamily: 'monospace' }}>₹{u.walletBalance.toFixed(2)}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ fontSize: '0.75rem', background: u.isSuspended ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)', color: u.isSuspended ? '#f87171' : '#4ade80', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                {u.isSuspended ? 'Suspended' : 'Active'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{ fontSize: '0.75rem', background: u.role === 'admin' ? 'rgba(167, 139, 250, 0.12)' : 'rgba(255,255,255,0.08)', color: u.role === 'admin' ? '#c084fc' : '#94a3b8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                {u.role.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.8rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <button
                                onClick={() => {
                                  setSelectedAdminUserId(u.id);
                                  setAdminView('user-profile');
                                  fetchUserProfileDetails(u.id);
                                }}
                                style={{ background: 'rgba(108, 92, 231, 0.1)', border: '1px solid rgba(108,92,231,0.2)', padding: '6px 12px', borderRadius: '4px', color: '#a29bfe', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Manage
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination control */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Showing Page {userPage} of {userTotalPages}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button disabled={userPage === 1} onClick={() => setUserPage(p => Math.max(1, p - 1))} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', opacity: userPage === 1 ? 0.5 : 1, cursor: 'pointer' }}>Prev</button>
                      <button disabled={userPage === userTotalPages} onClick={() => setUserPage(p => Math.min(userTotalPages, p + 1))} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', opacity: userPage === userTotalPages ? 0.5 : 1, cursor: 'pointer' }}>Next</button>
                    </div>
                  </div>
                </div>
              )}

              {/* USER DETAILED VIEW CONTROL PANEL */}
              {adminView === 'user-profile' && adminUserProfileData && (
                <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={() => { setAdminView('dashboard'); setAdminUserProfileData(null); }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <ArrowLeft size={16} />
                      </button>
                      <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Client profile: {adminUserProfileData.user.username}</h2>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Audit user stats, modify limits, manage role rights, balance modification</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleAdminAction('toggleSuspension', { userId: adminUserProfileData.user.id })}
                        style={{
                          background: adminUserProfileData.user.is_suspended ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          border: adminUserProfileData.user.is_suspended ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                          color: adminUserProfileData.user.is_suspended ? '#4ade80' : '#f87171',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {adminUserProfileData.user.is_suspended ? 'Re-Activate Account' : 'Suspend Account'}
                      </button>
                      <button
                        onClick={() => {
                          const newRole = adminUserProfileData.user.role === 'admin' ? 'user' : 'admin';
                          if (confirm(`Convert user role to ${newRole.toUpperCase()}?`)) {
                            handleAdminAction('updateRole', { userId: adminUserProfileData.user.id, role: newRole });
                          }
                        }}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Toggle Admin rights
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                    {/* Left Column: Adjust balance, bank accounts details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Financial Adjustment */}
                      <div style={{ background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '20px', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: '#cbd5e1' }}>Admin Wallet adjustment</h3>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => {
                              const amt = parseFloat(prompt('Enter amount to ADD to client wallet:'));
                              if (amt > 0) handleAdminAction('addBalance', { userId: adminUserProfileData.user.id, amount: amt });
                            }}
                            style={{ flex: 1, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            + Add Money
                          </button>
                          <button
                            onClick={() => {
                              const amt = parseFloat(prompt('Enter amount to DEDUCT from client wallet:'));
                              if (amt > 0) handleAdminAction('deductBalance', { userId: adminUserProfileData.user.id, amount: amt });
                            }}
                            style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '10px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            - Subtract Money
                          </button>
                        </div>
                      </div>

                      {/* Bank account details */}
                      <div style={{ background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '20px', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: '#cbd5e1' }}>Bank payout linking</h3>
                        {adminUserProfileData.bankDetails ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Beneficiary Account Name:</span><strong>{adminUserProfileData.bankDetails.account_name}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Account Number:</span><strong style={{ fontFamily: 'monospace' }}>{adminUserProfileData.bankDetails.account_number}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>IFSC Code:</span><strong style={{ fontFamily: 'monospace' }}>{adminUserProfileData.bankDetails.ifsc}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>UPI ID Address:</span><strong>{adminUserProfileData.bankDetails.upi_id || '-'}</strong></div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>No bank accounts linked by user node.</span>
                        )}
                      </div>
                    </div>

                    {/* Right Column: User details */}
                    <div style={{ background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '24px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.875rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '8px' }}>Account Information</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>User ID Code:</span><code style={{ color: '#cbd5e1' }}>{adminUserProfileData.user.id}</code></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Support ID:</span><strong>{adminUserProfileData.user.support_id || '-'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Referral Code:</span><strong style={{ fontFamily: 'monospace' }}>{adminUserProfileData.user.referral_code}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Wallet balance:</span><strong style={{ color: '#4ade80', fontWeight: 700 }}>₹{adminUserProfileData.user.wallet_balance.toFixed(2)}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Telegram Join Status:</span><strong>{adminUserProfileData.user.is_telegram_channel_joined && adminUserProfileData.user.is_telegram_group_joined ? 'Joined' : 'Pending'}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Registered Date:</span><strong>{new Date(adminUserProfileData.user.created_at).toLocaleDateString()}</strong></div>
                    </div>
                  </div>

                  {/* Profile lists tabs */}
                  <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', gap: '16px' }}>
                    {['deposits', 'withdrawals', 'orders', 'commissions'].map((subtab) => (
                      <button
                        key={subtab}
                        onClick={() => setAdminUserSubView(subtab)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          borderBottom: adminUserSubView === subtab ? '2px solid #a78bfa' : 'none',
                          color: adminUserSubView === subtab ? '#c084fc' : '#94a3b8',
                          padding: '8px 16px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {subtab}
                      </button>
                    ))}
                  </div>

                  {/* Profile lists contents */}
                  <div>
                    {adminUserSubView === 'deposits' && (
                      <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ background: '#1e293b' }}>
                              <th style={{ padding: '10px 16px', color: '#cbd5e1' }}>Date</th>
                              <th style={{ padding: '10px 16px', color: '#cbd5e1' }}>Amount</th>
                              <th style={{ padding: '10px 16px', color: '#cbd5e1' }}>UTR</th>
                              <th style={{ padding: '10px 16px', color: '#cbd5e1' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminUserProfileData.deposits.map((d) => (
                              <tr key={d.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <td style={{ padding: '10px 16px' }}>{new Date(d.created_at).toLocaleString()}</td>
                                <td style={{ padding: '10px 16px', color: '#4ade80', fontWeight: 600 }}>₹{d.amount.toFixed(2)}</td>
                                <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{d.utr}</td>
                                <td style={{ padding: '10px 16px', color: d.status === 'completed' ? '#4ade80' : d.status === 'pending' ? '#fbbf24' : '#f87171' }}>{d.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {adminUserSubView === 'withdrawals' && (
                      <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ background: '#1e293b' }}>
                              <th style={{ padding: '10px 16px', color: '#cbd5e1' }}>Date</th>
                              <th style={{ padding: '10px 16px', color: '#cbd5e1' }}>Amount</th>
                              <th style={{ padding: '10px 16px', color: '#cbd5e1' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminUserProfileData.withdrawals.map((w) => (
                              <tr key={w.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <td style={{ padding: '10px 16px' }}>{new Date(w.created_at).toLocaleString()}</td>
                                <td style={{ padding: '10px 16px', color: '#f87171', fontWeight: 600 }}>₹{w.amount.toFixed(2)}</td>
                                <td style={{ padding: '10px 16px', color: w.status === 'completed' ? '#4ade80' : w.status === 'pending' ? '#fbbf24' : '#f87171' }}>{w.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {adminUserSubView === 'orders' && (
                      <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ background: '#1e293b' }}>
                              <th style={{ padding: '10px 16px', color: '#cbd5e1' }}>Scheme</th>
                              <th style={{ padding: '10px 16px', color: '#cbd5e1' }}>Price</th>
                              <th style={{ padding: '10px 16px', color: '#cbd5e1' }}>Days Remaining</th>
                              <th style={{ padding: '10px 16px', color: '#cbd5e1' }}>Daily Return</th>
                              <th style={{ padding: '10px 16px', color: '#cbd5e1' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminUserProfileData.orders.map((o) => (
                              <tr key={o._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <td style={{ padding: '10px 16px', fontWeight: 600 }}>{o.scheme_name}</td>
                                <td style={{ padding: '10px 16px', color: '#cbd5e1' }}>₹{o.price.toFixed(2)}</td>
                                <td style={{ padding: '10px 16px' }}>{o.days_remaining} Days</td>
                                <td style={{ padding: '10px 16px', color: '#fbbf24' }}>₹{o.daily_income.toFixed(2)}</td>
                                <td style={{ padding: '10px 16px' }}>{o.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {adminUserSubView === 'commissions' && (
                      <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ background: '#1e293b' }}>
                              <th style={{ padding: '10px 16px', color: '#cbd5e1' }}>Date</th>
                              <th style={{ padding: '10px 16px', color: '#cbd5e1' }}>From user</th>
                              <th style={{ padding: '10px 16px', color: '#cbd5e1' }}>Level</th>
                              <th style={{ padding: '10px 16px', color: '#cbd5e1' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminUserProfileData.commissions.map((c) => (
                              <tr key={c._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <td style={{ padding: '10px 16px' }}>{new Date(c.created_at).toLocaleString()}</td>
                                <td style={{ padding: '10px 16px' }}>{c.from_username}</td>
                                <td style={{ padding: '10px 16px' }}>{c.level.toUpperCase()}</td>
                                <td style={{ padding: '10px 16px', color: '#4ade80', fontWeight: 600 }}>₹{c.amount.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ==================== SUB-TAB: DEPOSIT REQUESTS ==================== */}
          {adminActiveSubTab === 'transactions' && (
            <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Client deposit transactions list</h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Verify client payment receipts, approve or reject deposits</span>
              </div>

              {/* Filters grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search by UTR or username... (Press '/' to focus)"
                    style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px 10px 38px', outline: 'none' }}
                    value={adminSearchQuery}
                    onChange={(e) => { setAdminSearchQuery(e.target.value); setTxPage(1); }}
                  />
                </div>
                <div>
                  <select
                    style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }}
                    value={adminTxFilter}
                    onChange={(e) => { setAdminTxFilter(e.target.value); setTxPage(1); }}
                  >
                    <option value="pending">Pending Deposits</option>
                    <option value="deposits">All Deposits</option>
                    <option value="withdrawals">All Withdrawals</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Wider Table */}
              <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Date</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Client User</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Amount</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Type</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>UTR Number</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Proof Screenshot</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Status</th>
                      {adminTxFilter === 'pending' && <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {adminTransactions.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '14px 16px', color: '#64748b' }}>{new Date(tx.created_at).toLocaleString()}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>{tx.username}</td>
                        <td style={{ padding: '14px 16px', color: tx.type === 'deposit' ? '#4ade80' : '#f87171', fontWeight: 700, fontFamily: 'monospace' }}>₹{tx.amount.toFixed(2)}</td>
                        <td style={{ padding: '14px 16px', textTransform: 'capitalize' }}>{tx.type}</td>
                        <td style={{ padding: '14px 16px', fontFamily: 'monospace' }}>{tx.utr || '-'}</td>
                        <td style={{ padding: '14px 16px' }}>
                          {tx.screenshot ? (
                            <img
                              src={tx.screenshot}
                              alt="deposit proof"
                              onClick={() => {
                                const w = window.open();
                                w.document.write(`<img src="${tx.screenshot}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                                w.document.title = 'Deposit Proof Screenshot';
                              }}
                              style={{ height: '35px', borderRadius: '4px', cursor: 'pointer', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                            />
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>No Proof</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '0.75rem', background: tx.status === 'completed' ? 'rgba(34, 197, 94, 0.12)' : tx.status === 'pending' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(239, 68, 68, 0.12)', color: tx.status === 'completed' ? '#4ade80' : tx.status === 'pending' ? '#f59e0b' : '#f87171', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            {tx.status}
                          </span>
                        </td>
                        {adminTxFilter === 'pending' && (
                          <td style={{ padding: '14px 16px', display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleTransactionApproval(tx.id, 'approve')}
                              style={{ background: '#22c55e', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleTransactionApproval(tx.id, 'reject')}
                              style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Reject
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination control */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Showing Page {txPage} of {txTotalPages}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={txPage === 1} onClick={() => setTxPage(p => Math.max(1, p - 1))} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', opacity: txPage === 1 ? 0.5 : 1, cursor: 'pointer' }}>Prev</button>
                  <button disabled={txPage === txTotalPages} onClick={() => setTxPage(p => Math.min(txTotalPages, p + 1))} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', opacity: txPage === txTotalPages ? 0.5 : 1, cursor: 'pointer' }}>Next</button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SUB-TAB: WITHDRAWAL REQUESTS ==================== */}
          {adminActiveSubTab === 'withdrawals' && (
            <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Client withdrawal requests list</h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Verify bank accounts and process payout settlements</span>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                <div style={{ background: '#090d16', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>PENDING PAYMENTS</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: '#fbbf24', marginTop: '6px' }}>{adminWithdrawalsStats.totalPendingCount} requests</div>
                </div>
                <div style={{ background: '#090d16', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>PENDING VALUE</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: '#fbbf24', marginTop: '6px' }}>₹{(adminWithdrawalsStats.totalPendingAmount || 0).toFixed(2)}</div>
                </div>
                <div style={{ background: '#090d16', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>APPROVED PAID OUT</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: '#4ade80', marginTop: '6px' }}>₹{adminWithdrawalsStats.totalPaidAmount.toFixed(2)}</div>
                </div>
                <div style={{ background: '#090d16', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>APPROVED PAYMENTS</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: '#4ade80', marginTop: '6px' }}>{adminWithdrawalsStats.totalApprovedCount} requests</div>
                </div>
                <div style={{ background: '#090d16', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>REJECTED REQUESTS</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: '#f87171', marginTop: '6px' }}>{adminWithdrawalsStats.totalRejectedCount} requests</div>
                </div>
              </div>

              {/* Filters grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search by client or phone number... (Press '/' to focus)"
                    style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px 10px 38px', outline: 'none' }}
                    value={withdrawalSearchQuery}
                    onChange={(e) => { setWithdrawalSearchQuery(e.target.value); setWithdrawalPage(1); }}
                  />
                </div>
                <div>
                  <select
                    style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }}
                    value={withdrawalFilter}
                    onChange={(e) => { setWithdrawalFilter(e.target.value); setWithdrawalPage(1); }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending Only</option>
                    <option value="completed">Completed Only</option>
                    <option value="rejected">Rejected Only</option>
                  </select>
                </div>
                <div>
                  <select
                    style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }}
                    value={withdrawalDateRange}
                    onChange={(e) => { setWithdrawalDateRange(e.target.value); setWithdrawalPage(1); }}
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">Past Week</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>
                <div>
                  <select
                    style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }}
                    value={withdrawalSort}
                    onChange={(e) => { setWithdrawalSort(e.target.value); setWithdrawalPage(1); }}
                  >
                    <option value="date-desc">Newest Requests</option>
                    <option value="date-asc">Oldest Requests</option>
                    <option value="amount-desc">Highest Amount</option>
                    <option value="amount-asc">Lowest Amount</option>
                  </select>
                </div>
              </div>

              {withdrawalDateRange === 'custom' && (
                <div style={{ display: 'flex', gap: '16px', background: '#090d16', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Start Date</label>
                    <input type="date" value={withdrawalStartDate} onChange={(e) => { setWithdrawalStartDate(e.target.value); setWithdrawalPage(1); }} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', padding: '6px 12px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>End Date</label>
                    <input type="date" value={withdrawalEndDate} onChange={(e) => { setWithdrawalEndDate(e.target.value); setWithdrawalPage(1); }} style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#fff', padding: '6px 12px' }} />
                  </div>
                </div>
              )}

              {/* Wider Table */}
              <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Requested Date</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Client Name</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Phone</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Amount</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Beneficiary Account Details</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Status</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminWithdrawals.map((w) => (
                      <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '14px 16px', color: '#64748b' }}>{new Date(w.created_at).toLocaleString()}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>{w.username}</td>
                        <td style={{ padding: '14px 16px', color: '#cbd5e1', fontFamily: 'monospace' }}>{w.phone}</td>
                        <td style={{ padding: '14px 16px', color: '#f87171', fontWeight: 700, fontFamily: 'monospace' }}>₹{w.amount.toFixed(2)}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                          {w.bankDetails ? (
                            <div>
                              <div>Name: <strong style={{ color: '#cbd5e1' }}>{w.bankDetails.account_name}</strong></div>
                              <div>A/C: <strong style={{ color: '#fbbf24', fontFamily: 'monospace' }}>{w.bankDetails.account_number}</strong> | IFSC: <code style={{ color: '#a78bfa' }}>{w.bankDetails.ifsc}</code></div>
                              {w.bankDetails.upi_id && <div>UPI: <code style={{ color: '#38bdf8' }}>{w.bankDetails.upi_id}</code></div>}
                            </div>
                          ) : (
                            <span style={{ color: '#64748b' }}>Missing account info</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '0.75rem', background: w.status === 'completed' ? 'rgba(34, 197, 94, 0.12)' : w.status === 'pending' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(239, 68, 68, 0.12)', color: w.status === 'completed' ? '#4ade80' : w.status === 'pending' ? '#f59e0b' : '#f87171', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            {w.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {w.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleWithdrawalApproval(w.id, 'approve')} style={{ background: '#22c55e', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                              <button onClick={() => handleWithdrawalApproval(w.id, 'reject')} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                            </div>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Closed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination control */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Showing Page {withdrawalPage} of {adminWithdrawalsTotalPages}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={withdrawalPage === 1} onClick={() => setWithdrawalPage(p => Math.max(1, p - 1))} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', opacity: withdrawalPage === 1 ? 0.5 : 1, cursor: 'pointer' }}>Prev</button>
                  <button disabled={withdrawalPage === adminWithdrawalsTotalPages} onClick={() => setWithdrawalPage(p => Math.min(adminWithdrawalsTotalPages, p + 1))} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', opacity: withdrawalPage === adminWithdrawalsTotalPages ? 0.5 : 1, cursor: 'pointer' }}>Next</button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SUB-TAB: INVESTMENT ORDERS ==================== */}
          {adminActiveSubTab === 'orders' && (
            <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Client investment orders list</h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Verify active scheme user mappings and daily yield progression</span>
              </div>

              {/* Filters grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search orders by client username... (Press '/' to focus)"
                    style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px 10px 38px', outline: 'none' }}
                    value={adminSearchQuery}
                    onChange={(e) => { setAdminSearchQuery(e.target.value); setOrdersPage(1); }}
                  />
                </div>
                <div>
                  <select
                    style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }}
                    value={adminOrderFilter}
                    onChange={(e) => { setAdminOrderFilter(e.target.value); setOrdersPage(1); }}
                  >
                    <option value="pending">Pending Matching</option>
                    <option value="active">Active Running</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="matured">Matured</option>
                  </select>
                </div>
              </div>

              {/* Wider Table */}
              <div style={{ overflowX: 'auto', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#1e293b', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Date</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Client Username</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Scheme Product</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Price Value</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Daily return</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Remaining Duration</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Status</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminOrders.map((o) => (
                      <tr key={o._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '14px 16px', color: '#64748b' }}>{new Date(o.created_at).toLocaleString()}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>{o.username}</td>
                        <td style={{ padding: '14px 16px' }}>{o.scheme_name}</td>
                        <td style={{ padding: '14px 16px', color: '#cbd5e1', fontFamily: 'monospace' }}>₹{o.price.toFixed(2)}</td>
                        <td style={{ padding: '14px 16px', color: '#fbbf24', fontFamily: 'monospace' }}>₹{o.daily_income.toFixed(2)}</td>
                        <td style={{ padding: '14px 16px' }}>{o.days_remaining} / {o.days} Days</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '0.75rem', background: o.status === 'active' ? 'rgba(34, 197, 94, 0.12)' : o.status === 'pending' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(239, 68, 68, 0.12)', color: o.status === 'active' ? '#4ade80' : o.status === 'pending' ? '#f59e0b' : '#f87171', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            onClick={() => {
                              setAdminSelectedOrder(o);
                              setAdminView('admin-order-detail');
                            }}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order detail modal overlay overlay */}
              {adminView === 'admin-order-detail' && adminSelectedOrder && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContext: 'center', zIndex: 1000, padding: '24px' }}>
                  <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', width: '100%', maxWidth: '600px', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Order matching diagnostics detail</h3>
                      <button onClick={() => { setAdminSelectedOrder(null); setAdminView('dashboard'); }} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.9rem' }}>
                      <div><span style={{ color: '#64748b' }}>Client User:</span> <strong>{adminSelectedOrder.username}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Product Value:</span> <strong>₹{adminSelectedOrder.price}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Created Date:</span> <strong>{new Date(adminSelectedOrder.created_at).toLocaleString()}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Yield Yield Rate:</span> <strong>₹{adminSelectedOrder.daily_income} / Day</strong></div>
                      <div><span style={{ color: '#64748b' }}>UTR Reference:</span> <strong style={{ fontFamily: 'monospace' }}>{adminSelectedOrder.utr}</strong></div>
                      <div><span style={{ color: '#64748b' }}>Matched accounts status:</span> <strong style={{ color: '#4ade80' }}>{adminSelectedOrder.status}</strong></div>
                    </div>

                    {adminSelectedOrder.screenshot && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>Payment Proof screenshot:</span>
                        <img src={adminSelectedOrder.screenshot} alt="UT Proof" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px' }} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pagination control */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Showing Page {ordersPage} of {ordersTotalPages}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={ordersPage === 1} onClick={() => setOrdersPage(p => Math.max(1, p - 1))} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', opacity: ordersPage === 1 ? 0.5 : 1, cursor: 'pointer' }}>Prev</button>
                  <button disabled={ordersPage === ordersTotalPages} onClick={() => setOrdersPage(p => Math.min(ordersTotalPages, p + 1))} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', opacity: ordersPage === ordersTotalPages ? 0.5 : 1, cursor: 'pointer' }}>Next</button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SUB-TAB: INVESTMENT SCHEMES ==================== */}
          {adminActiveSubTab === 'schemes' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
              {/* Form card */}
              <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  {editSchemeId ? 'Modify Scheme Product' : 'Create Scheme Product'}
                </h3>
                <form onSubmit={handleAddSchemeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Scheme Name</label>
                    <input type="text" value={newSchemeName} onChange={(e) => setNewSchemeName(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Subscription Price (₹)</label>
                    <input type="number" value={newSchemePrice} onChange={(e) => setNewSchemePrice(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Daily return yield rate (%)</label>
                    <input type="number" step="0.1" value={newSchemeRate} onChange={(e) => setNewSchemeRate(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Duration Days</label>
                    <input type="number" value={newSchemeDays} onChange={(e) => setNewSchemeDays(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Total yield Return (₹)</label>
                    <input type="number" value={newSchemeTotalReturn} onChange={(e) => setNewSchemeTotalReturn(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} required />
                  </div>

                  <button type="submit" style={{ background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', marginTop: '8px' }}>
                    {editSchemeId ? 'Modify Scheme' : 'Launch Scheme'}
                  </button>
                  {editSchemeId && (
                    <button type="button" onClick={() => { setEditSchemeId(null); setNewSchemeName(''); setNewSchemePrice(''); setNewSchemeRate(''); setNewSchemeDays(''); setNewSchemeTotalReturn(''); }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>Cancel edit</button>
                  )}
                </form>
              </div>

              {/* Schemes table list */}
              <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Existing Investment Schemes</h3>
                <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#1e293b' }}>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Scheme Product</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Price</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Daily rate</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Duration</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Status</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminSchemes.map((s) => (
                        <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 600 }}>{s.name}</td>
                          <td style={{ padding: '14px 16px', color: '#cbd5e1', fontFamily: 'monospace' }}>₹{s.price.toFixed(2)}</td>
                          <td style={{ padding: '14px 16px', color: '#fbbf24', fontFamily: 'monospace' }}>{(s.daily_return_rate * 100).toFixed(1)}%</td>
                          <td style={{ padding: '14px 16px' }}>{s.days} Days</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '0.75rem', background: s.is_active ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)', color: s.is_active ? '#4ade80' : '#f87171', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              {s.is_active ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setEditSchemeId(s._id);
                                setNewSchemeName(s.name);
                                setNewSchemePrice(s.price.toString());
                                setNewSchemeRate((s.daily_return_rate * 100).toFixed(1));
                                setNewSchemeDays(s.days.toString());
                                setNewSchemeTotalReturn(s.total_return.toString());
                              }}
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#a29bfe', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleAdminAction('toggleSchemeStatus', { id: s._id })}
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fbbf24', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              Toggle
                            </button>
                            <button
                              onClick={() => { if (confirm('Delete this scheme permanently?')) handleAdminAction('deleteScheme', { id: s._id }); }}
                              style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SUB-TAB: SPIN WHEEL MANAGEMENT ==================== */}
          {adminActiveSubTab === 'spin-management' && adminSpinConfig && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
              {/* Settings Form */}
              <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Spin Wheel Configuration</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Spin Price Ticket Cost (₹)</label>
                    <input
                      type="number"
                      value={adminSpinConfig.spinPrice}
                      onChange={(e) => setAdminSpinConfig({ ...adminSpinConfig, spinPrice: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Daily free spins limit</label>
                    <input
                      type="number"
                      value={adminSpinConfig.dailyLimit}
                      onChange={(e) => setAdminSpinConfig({ ...adminSpinConfig, dailyLimit: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }}
                    />
                  </div>
                  <button
                    onClick={() => saveAdminSpinConfig(adminSpinConfig)}
                    style={{ background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                  >
                    Save configuration
                  </button>
                </div>
              </div>

              {/* Spin statistics history */}
              <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Grand Prize Winner Records</h3>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#1e293b' }}>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Date</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Winner User</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Prize Label</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Fulfillment Status</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminSpinStats?.grandPrizes?.map((gp) => (
                        <tr key={gp._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>{new Date(gp.created_at).toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{gp.username}</td>
                          <td style={{ padding: '12px 16px', color: '#a78bfa', fontWeight: 600 }}>{gp.prize_label}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '0.75rem', background: gp.fulfilled ? 'rgba(34, 197, 94, 0.12)' : 'rgba(251, 191, 36, 0.12)', color: gp.fulfilled ? '#4ade80' : '#f59e0b', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              {gp.fulfilled ? 'Fulfilled' : 'Pending Claim'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {!gp.fulfilled && (
                              <button
                                onClick={() => fulfillGrandPrize(gp._id)}
                                style={{ background: '#22c55e', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                              >
                                Mark Fulfilled
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SUB-TAB: LOTTERY MANAGEMENT ==================== */}
          {adminActiveSubTab === 'lottery-management' && adminLotteryConfig && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
              {/* Settings configuration */}
              <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Lottery draw parameters</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Ticket Price (₹)</label>
                    <input
                      type="number"
                      value={adminLotteryConfig.ticket_price}
                      onChange={(e) => setAdminLotteryConfig({ ...adminLotteryConfig, ticket_price: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Multiplier payout factor</label>
                    <input
                      type="number"
                      value={adminLotteryConfig.multiplier}
                      onChange={(e) => setAdminLotteryConfig({ ...adminLotteryConfig, multiplier: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Sales Status</label>
                    <select
                      value={adminLotteryConfig.status}
                      onChange={(e) => setAdminLotteryConfig({ ...adminLotteryConfig, status: e.target.value })}
                      style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }}
                    >
                      <option value="open">Sales Enabled (Open)</option>
                      <option value="closed">Sales Suspended (Closed)</option>
                    </select>
                  </div>
                  <button
                    onClick={() => saveAdminLotteryConfig(adminLotteryConfig)}
                    style={{ background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                  >
                    Update Lottery config
                  </button>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Manual lottery trigger:</span>
                    <button
                      onClick={() => runManualLotteryDraw('')}
                      style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      🎲 Execute Random Draw
                    </button>
                    <button
                      onClick={() => {
                        const win = prompt('Enter manual winning ticket code (4-digit number):');
                        if (win !== null && win.trim()) runManualLotteryDraw(win.trim());
                      }}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      ✍ Execute Targeted Draw
                    </button>
                  </div>
                </div>
              </div>

              {/* Lottery draw history */}
              <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Weekly Draw Histories</h3>
                <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#1e293b' }}>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Week Date</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Winning Code</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Tickets sold</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Payout volume</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminLotteryDraws.map((d) => (
                        <tr key={d._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>{d.week_start}</td>
                          <td style={{ padding: '12px 16px', color: '#a78bfa', fontWeight: 700, fontFamily: 'monospace' }}>{d.winning_code || 'Pending'}</td>
                          <td style={{ padding: '12px 16px' }}>{d.total_tickets || 0}</td>
                          <td style={{ padding: '12px 16px', color: '#4ade80', fontWeight: 600 }}>₹{d.total_payout || 0}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '0.75rem', background: d.status === 'drawn' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(251, 191, 36, 0.12)', color: d.status === 'drawn' ? '#4ade80' : '#f59e0b', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              {d.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SUB-TAB: REFERRAL REWARD TASKS ==================== */}
          {adminActiveSubTab === 'referral-tasks' && (
            <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Referral Network Task verification</h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Approve or revoke referral bonus milestones claimed by user nodes</span>
              </div>

              {/* Filters grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search task user by username... (Press '/' to focus)"
                    style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px 10px 38px', outline: 'none' }}
                    value={adminReferralTasksSearch}
                    onChange={(e) => { setAdminReferralTasksSearch(e.target.value); setAdminReferralTasksPage(1); }}
                  />
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#1e293b' }}>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Client user</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Milestone Level</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Requirements progress</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Claim status</th>
                      <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminReferralTasksData.map((task, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>{task.username}</td>
                        <td style={{ padding: '14px 16px', color: '#a78bfa', fontWeight: 600 }}>Milestone {task.milestone}</td>
                        <td style={{ padding: '14px 16px' }}>{task.active_referrals} / {task.required_referrals} Active nodes</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '0.75rem', background: task.claimed ? 'rgba(34, 197, 94, 0.12)' : 'rgba(251, 191, 36, 0.12)', color: task.claimed ? '#4ade80' : '#f59e0b', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                            {task.claimed ? 'Approved Reward' : 'Pending Verification'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {!task.claimed ? (
                            <button
                              onClick={() => handleAdminMilestoneAction('approve', task.user_id, task.milestone)}
                              style={{ background: '#22c55e', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Approve Milestone
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAdminMilestoneAction('revoke', task.user_id, task.milestone)}
                              style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Revoke Milestone
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Showing Page {adminReferralTasksPage} of {adminReferralTasksTotalPages}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button disabled={adminReferralTasksPage === 1} onClick={() => setAdminReferralTasksPage(p => Math.max(1, p - 1))} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', opacity: adminReferralTasksPage === 1 ? 0.5 : 1, cursor: 'pointer' }}>Prev</button>
                  <button disabled={adminReferralTasksPage === adminReferralTasksTotalPages} onClick={() => setAdminReferralTasksPage(p => Math.min(adminReferralTasksTotalPages, p + 1))} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', opacity: adminReferralTasksPage === adminReferralTasksTotalPages ? 0.5 : 1, cursor: 'pointer' }}>Next</button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SUB-TAB: PWA SETTINGS CONFIG ==================== */}
          {adminActiveSubTab === 'pwa-settings' && (
            <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Progressive Web App installation config</h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Update details displayed in client PWAs install prompt dialog</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>App Name</label>
                  <input type="text" value={adminPwaName} onChange={(e) => setAdminPwaName(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>App Short Name</label>
                  <input type="text" value={adminPwaShortName} onChange={(e) => setAdminPwaShortName(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Theme Color Hex</label>
                  <input type="text" value={adminPwaThemeColor} onChange={(e) => setAdminPwaThemeColor(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Background Color Hex</label>
                  <input type="text" value={adminPwaBackgroundColor} onChange={(e) => setAdminPwaBackgroundColor(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Icon Link URL</label>
                  <input type="text" value={adminPwaIcon} onChange={(e) => setAdminPwaIcon(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Splash Screen Link URL</label>
                  <input type="text" value={adminPwaSplashScreen} onChange={(e) => setAdminPwaSplashScreen(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>App Release Version</label>
                  <input type="text" value={adminPwaVersion} onChange={(e) => setAdminPwaVersion(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Installation Prompt instructions Text</label>
                  <textarea value={adminPwaInstallPromptText} onChange={(e) => setAdminPwaInstallPromptText(e.target.value)} style={{ width: '100%', minHeight: '80px', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Update release notes / changelog:</label>
                  <textarea value={adminPwaUpdateNotes} onChange={(e) => setAdminPwaUpdateNotes(e.target.value)} style={{ width: '100%', minHeight: '80px', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} />
                </div>
              </div>

              <button
                onClick={handleSavePwaSettings}
                style={{ background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', width: 'fit-content', cursor: 'pointer', marginTop: '10px' }}
              >
                Save PWA configuration
              </button>
            </div>
          )}

          {/* ==================== SUB-TAB: PAYMENT ACCOUNTS ==================== */}
          {adminActiveSubTab === 'payment-accounts' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
              {/* Add form */}
              <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Add Payment account QR</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Payment Provider / Bank Name</label>
                    <input type="text" value={newPaBankName} onChange={(e) => setNewPaBankName(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Beneficiary Name</label>
                    <input type="text" value={newPaBeneficiaryName} onChange={(e) => setNewPaBeneficiaryName(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Bank Account Number</label>
                    <input type="text" value={newPaAccountNumber} onChange={(e) => setNewPaAccountNumber(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>Bank IFSC Code</label>
                    <input type="text" value={newPaIfsc} onChange={(e) => setNewPaIfsc(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>UPI ID address</label>
                    <input type="text" value={newPaUpiId} onChange={(e) => setNewPaUpiId(e.target.value)} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '10px 12px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px' }}>UPI QR Image File (Auto-scan code)</label>
                    <input type="file" accept="image/*" onChange={handleQrUpload} style={{ width: '100%', background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#fff', padding: '8px', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={newPaAllowConcurrent} onChange={(e) => setNewPaAllowConcurrent(e.target.checked)} id="pa-con" style={{ width: '16px', height: '16px' }} />
                    <label htmlFor="pa-con" style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Allow concurrent matching protocols</label>
                  </div>

                  <button
                    onClick={handleAddPaymentAccount}
                    style={{ background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                  >
                    Add payment gateway
                  </button>
                </div>
              </div>

              {/* Accounts list */}
              <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Existing Admin Virtual receiving accounts</h3>
                <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#1e293b' }}>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Bank Account Details</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>UPI Details</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Status</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Concurrent matching</th>
                        <th style={{ padding: '12px 16px', color: '#cbd5e1' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminVirtualAccounts.map((account) => (
                        <tr key={account._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div>Bank: <strong style={{ color: '#f1f5f9' }}>{account.bank_name}</strong></div>
                            <div>Name: <strong style={{ color: '#cbd5e1' }}>{account.beneficiary_name}</strong></div>
                            <div>A/C: <code style={{ color: '#fbbf24' }}>{account.account_number}</code> | IFSC: <code style={{ color: '#a78bfa' }}>{account.ifsc}</code></div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div>UPI ID: <code style={{ color: '#38bdf8' }}>{account.upi_id || '-'}</code></div>
                            {account.qr_code && (
                              <img src={account.qr_code} alt="QR" style={{ height: '35px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)', marginTop: '4px' }} />
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '0.75rem', background: account.is_active ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)', color: account.is_active ? '#4ade80' : '#f87171', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              {account.is_active ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ color: account.allow_concurrent ? '#4ade80' : '#64748b' }}>{account.allow_concurrent ? 'Allowed' : 'Disabled'}</span>
                          </td>
                          <td style={{ padding: '12px 16px', display: 'flex', gap: '8px', marginTop: '14px' }}>
                            <button onClick={() => handleTogglePaymentAccountStatus(account._id)} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fbbf24', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Toggle</button>
                            <button onClick={() => handleTogglePaymentAccountConcurrent(account._id)} style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#38bdf8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Concurrent</button>
                            <button onClick={() => handleDeletePaymentAccount(account._id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#f87171', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SUB-TAB: SYSTEM ALERTS LOG ==================== */}
          {adminActiveSubTab === 'notifications' && (
            <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>System Control Board Alerts Log</h2>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Realtime alert updates logs mapped from client user transactions</span>
                </div>
                <button
                  onClick={handleMarkAllNotificationsRead}
                  style={{ background: 'rgba(108, 92, 231, 0.1)', border: '1px solid rgba(108,92,231,0.2)', color: '#a29bfe', padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Mark all alerts as Read
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {adminNotifications.length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '40px' }}>No system notifications logged.</span>
                ) : (
                  adminNotifications.map((notif) => (
                    <div
                      key={notif._id}
                      style={{
                        background: notif.is_read ? 'rgba(255, 255, 255, 0.02)' : 'rgba(108, 92, 231, 0.05)',
                        border: notif.is_read ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(108, 92, 231, 0.15)',
                        padding: '16px 20px',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>{new Date(notif.created_at).toLocaleString()}</span>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: notif.is_read ? '#cbd5e1' : '#ffffff', fontWeight: notif.is_read ? 400 : 600 }}>{notif.message}</p>
                      </div>
                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkNotificationRead(notif._id)}
                          style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
