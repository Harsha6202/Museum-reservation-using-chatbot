import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingDetails, AdminStats } from '../types';
import {
  IndianRupee,
  Ticket,
  Users,
  Calendar,
  Search,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  LogOut
} from 'lucide-react';
import { getBookingStats, getAllBookings } from '../utils/bookingService';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalBookings: 0,
    totalRevenue: 0,
    todayBookings: 0,
    todayRevenue: 0,
    visitorMetrics: { daily: 0, weekly: 0, monthly: 0 },
    peakTimes: [],
    popularMuseums: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
      const sessionTime = parseInt(sessionStorage.getItem('adminSession') || '0');
      const isValidSession = Date.now() - sessionTime < 3600000; // 1 hour session

      if (!isAuthenticated || !isValidSession) {
        navigate('/admin/login');
      }
    };

    checkAuth();
    const interval = setInterval(checkAuth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [navigate]);

  // Data loading
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to load from localStorage first for immediate display
        const cachedBookings = localStorage.getItem('adminBookings');
        const cachedStats = localStorage.getItem('adminStats');

        if (cachedBookings && cachedStats && isMounted) {
          try {
            const parsedBookings = JSON.parse(cachedBookings);
            const parsedStats = JSON.parse(cachedStats);
            if (Array.isArray(parsedBookings)) {
              setBookings(parsedBookings);
              setStats(parsedStats);
              setLoading(false); // Show cached data while fetching fresh data
            }
          } catch (err) {
            console.error("Error parsing cached data:", err);
          }
        }

        // Fetch fresh data
        if (isMounted) {
          try {
            const [bookingsData, statsData] = await Promise.all([
              getAllBookings(),
              getBookingStats()
            ]);

            if (isMounted) {
              if (Array.isArray(bookingsData)) {
                setBookings(bookingsData);
                localStorage.setItem('adminBookings', JSON.stringify(bookingsData));
              }

              if (statsData && typeof statsData.totalBookings === 'number') {
                setStats(statsData);
                localStorage.setItem('adminStats', JSON.stringify(statsData));
              }
              setLoading(false);
            }
          } catch (err) {
            console.error("Error fetching fresh data:", err);
            // Only show error if we don't have cached data
            if (!cachedBookings && isMounted) {
              setError("Failed to load dashboard data. Please try again.");
              setLoading(false);
            }
          }
        }
      } catch (err) {
        console.error("Error in loadData:", err);
        if (isMounted) {
          setError("Failed to load dashboard data. Please try again.");
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    sessionStorage.removeItem('adminSession');
    navigate('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4 inline-block mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Bookings</p>
                <p className="text-2xl font-semibold">{stats.totalBookings}</p>
              </div>
              <Ticket className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold">₹{stats.totalRevenue}</p>
              </div>
              <IndianRupee className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Bookings ({format(new Date(), 'MMM dd, yyyy')})</p>
                <p className="text-2xl font-semibold">{stats.todayBookings}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Daily Visitors ({format(new Date(), 'MMM dd, yyyy')})</p>
                <p className="text-2xl font-semibold">{stats.visitorMetrics.daily}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            <div className="flex items-center gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'completed' | 'pending')}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Museum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Slot</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings
                  .filter(booking => 
                    (filterStatus === 'all' || booking.paymentStatus === filterStatus) &&
                    (booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    booking.email.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.ticketNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{booking.name}</div>
                        <div className="text-xs text-gray-400">{booking.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.museum?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.date && format(new Date(booking.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.time || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{booking.totalAmount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
