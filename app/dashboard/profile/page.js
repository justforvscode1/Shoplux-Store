"use client";

import { useState, useEffect } from 'react';
import { signIn, useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import LoadingScreen from '@/components/LoadingScreen';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// SVG Icons
const ProfileIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SecurityIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ActivityIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const VerifiedIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

export default function AccountProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    fetchUserProfile();
  }, [status, session, router]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/profile');
      if (!response.ok) throw new Error('Failed to fetch profile data');
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: true, callbackUrl: '/' });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmInput.toLowerCase() !== 'delete') {
      toast.error('Please type "delete" to confirm');
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch('/api/user/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session.user.email)
      });
      const check = await response.json()
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }

      toast.success('Account deleted successfully');

      setTimeout(() => {
        signOut({ redirect: true, callbackUrl: '/' });
      }, 1000);
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error(error.message || 'Error deleting account');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmInput('');
    }
  };

  const getProviderIcon = (provider) => {
    const icons = {
      google: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      ),
      github: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
      credentials: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    };
    return icons[provider] || null;
  };

  if (status === 'loading' || isLoading) {
    return <LoadingScreen message="Loading your profile..." />;
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: ProfileIcon },
    { id: 'security', name: 'Security', icon: SecurityIcon },
    { id: 'activity', name: 'Activity', icon: ActivityIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="grow">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Account Status</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-green-50 rounded-lg flex items-center justify-center shrink-0 ml-3">
                  <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${user?.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Email Verification</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                    {user?.isEmailVerified ? 'Verified' : 'Pending'}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 ml-3">
                  {user?.isEmailVerified ? (
                    <VerifiedIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  ) : (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-200 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Member Since</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                    {user?.createdAt ? new Date(user.createdAt).getFullYear() : 'N/A'}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-purple-50 rounded-lg flex items-center justify-center shrink-0 ml-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 lg:p-6">
                <div className="text-center">
                  <div className="relative inline-block mb-3 sm:mb-4">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mx-auto">
                      {user?.profileImage || session.user?.image ? (
                        <Image
                          src={user?.profileImage || session.user?.image}
                          alt="Profile"
                          width={80}
                          height={80}
                          className="rounded-full object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-xl sm:text-2xl font-light text-gray-600">
                          {user?.firstName?.[0]?.toUpperCase() || session.user?.name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {user?.isEmailVerified && (
                      <div className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                        <VerifiedIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1 truncate px-2">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : session.user?.name || 'User'
                    }
                  </h2>
                  <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 truncate px-2">{session.user?.email}</p>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {user?.isActive && (
                      <span className="inline-flex items-center px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation - Horizontal on mobile, vertical on larger screens */}
              <nav className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3 lg:mb-4 uppercase tracking-wide">Navigation</h3>
                <div className="flex lg:flex-col gap-1 sm:gap-2 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 lg:flex-none lg:w-full flex items-center justify-center lg:justify-start space-x-2 sm:space-x-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-center lg:text-left transition-colors whitespace-nowrap min-w-[80px] sm:min-w-[100px] lg:min-w-0 ${activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                        }`}
                    >
                      <tab.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="font-medium text-xs sm:text-sm lg:text-base">{tab.name}</span>
                    </button>
                  ))}
                </div>
              </nav>

              {/* Account Actions */}

            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-200">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Profile Information</h2>
                    <p className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-2">Manage your personal information and account details</p>
                  </div>

                  <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                          First Name
                        </label>
                        <div className="p-3 sm:p-4 text-gray-900 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium">
                          {user?.firstName || 'Not provided'}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                          Last Name
                        </label>
                        <div className="p-3 sm:p-4 text-gray-900 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium">
                          {user?.lastName || 'Not provided'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                        Email Address
                      </label>
                      <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
                          <span className="text-gray-900 font-medium text-sm sm:text-base truncate">{session.user?.email}</span>
                          {user?.isEmailVerified && (
                            <span className="inline-flex items-center px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 w-fit">
                              <VerifiedIcon className="w-3 h-3 mr-1" />
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 p-3 sm:p-4">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wide">Actions</h3>
                      <div className="pt-4 sm:pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                          onClick={handleLogout}
                          className="w-full sm:w-auto px-4 py-2.5 sm:py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Logout</span>
                        </button>

                        <button
                          onClick={() => setShowDeleteModal(true)}
                          className="w-full sm:w-auto px-4 py-2.5 sm:py-3 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 active:bg-red-200 border border-red-200 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete Account</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-200">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Security Settings</h2>
                    <p className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-2">Manage your connected accounts and security preferences</p>
                  </div>

                  <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Connected Accounts</h3>
                      <div className="space-y-3 sm:space-y-4">
                        {Object.entries(user?.linkedAccounts || {}).map(([provider, connected]) => (
                          connected && (
                            <div key={provider} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 gap-3 sm:gap-4">
                              <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0">
                                  {getProviderIcon(provider)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 capitalize text-sm sm:text-base truncate">
                                    {provider === 'credentials' ? 'Email & Password' : provider}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-500">Connected</p>
                                </div>
                              </div>
                              <span className="inline-flex items-center px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 w-fit">
                                Active
                              </span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>

                    {user?.hasPassword && (
                      <div className="pt-4 sm:pt-6 border-t border-gray-200">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Password</h3>
                        <button className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors duration-200 text-sm sm:text-base">
                          Change Password
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && user && (
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-200">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Account Activity</h2>
                    <p className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-2">View your account activity and important dates</p>
                  </div>

                  <div className="p-4 sm:p-6 lg:p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                      <div className="p-4 sm:p-5 lg:p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Last Login</h3>
                        <p className="text-base sm:text-lg font-semibold text-gray-900">
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                        </p>
                      </div>

                      <div className="p-4 sm:p-5 lg:p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Account Created</h3>
                        <p className="text-base sm:text-lg font-semibold text-gray-900">{formatDate(user.createdAt)}</p>
                      </div>

                      <div className="p-4 sm:p-5 lg:p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Last Updated</h3>
                        <p className="text-base sm:text-lg font-semibold text-gray-900">{formatDate(user.updatedAt)}</p>
                      </div>

                      <div className="p-4 sm:p-5 lg:p-6 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Email Status</h3>
                        <p className="text-base sm:text-lg font-semibold text-gray-900">
                          {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delete Account Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-lg">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-2h2m0 0h2m-2 0h-2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Account</h3>
                <p className="text-gray-600 text-sm text-center mb-6">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type &quot;delete&quot; to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    placeholder="Type 'delete' here"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmInput('');
                    }}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmInput.toLowerCase() !== 'delete'}
                    className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}