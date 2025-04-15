import { BookingDetails, Museum, TimeSlot } from '../types';
import { 
  addBooking as addFirebaseBooking,
  getAllBookings as getFirebaseBookings,
  getBookingsByDate as getFirebaseBookingsByDate,
  getBookingsByMuseum as getFirebaseBookingsByMuseum,
  getBookingsByDateAndMuseum as getFirebaseBookingsByDateAndMuseum,
  getAvailableTimeSlots as getFirebaseAvailableTimeSlots,
  updateBooking as updateFirebaseBooking,
  deleteBooking as deleteFirebaseBooking
} from '../firebase/bookings';

// Add a new booking
export const addBooking = async (booking: BookingDetails): Promise<BookingDetails> => {
  try {
    console.log('Attempting to add booking to Firebase...');
    const firebaseResult = await addFirebaseBooking(booking);
    console.log('Successfully added booking to Firebase:', firebaseResult);
    
    // Update localStorage
    const localBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    localStorage.setItem(
      'bookings', 
      JSON.stringify([...localBookings, {...firebaseResult, _source: 'firebase'}])
    );
    return firebaseResult;
  } catch (error) {
    // Fallback to localStorage with better error handling
    console.error('Firebase error, saving to localStorage:', error);
    
    // Check if it's a connection error
    if (error instanceof Error && error.message.includes('network')) {
      console.warn('Network error detected, using localStorage fallback');
    }
    
    const newBooking = {
      ...booking, 
      id: `local_${Date.now()}`, 
      _source: 'local',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    const existingBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    localStorage.setItem(
      'bookings',
      JSON.stringify([...existingBookings, newBooking])
    );
    
    // Return the booking with error information
    return {
      ...newBooking,
      paymentStatus: 'failed' as const,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get all bookings
export const getAllBookings = async (): Promise<BookingDetails[]> => {
  try {
    // First try to get from Firebase
    const firebaseBookings = await getFirebaseBookings();
    
    // Update localStorage with fresh data
    localStorage.setItem('adminBookings', JSON.stringify(firebaseBookings));
    
    return firebaseBookings;
  } catch (error) {
    console.error('Error fetching from Firebase, falling back to localStorage:', error);
    
    // Fallback to localStorage if Firebase fails
    const localBookings = localStorage.getItem('adminBookings');
    return localBookings ? JSON.parse(localBookings) : [];
  }
};

// Get bookings for a specific date
export const getBookingsByDate = async (date: string): Promise<BookingDetails[]> => {
  try {
    return await getFirebaseBookingsByDate(date);
  } catch (error) {
    console.error("Error getting bookings by date: ", error);
    throw error;
  }
};

// Get bookings for a specific museum
export const getBookingsByMuseum = async (museumId: string): Promise<BookingDetails[]> => {
  try {
    return await getFirebaseBookingsByMuseum(museumId);
  } catch (error) {
    console.error("Error getting bookings by museum: ", error);
    throw error;
  }
};

// Get bookings for a specific date and museum
export const getBookingsByDateAndMuseum = async (date: string, museumId: string): Promise<BookingDetails[]> => {
  try {
    return await getFirebaseBookingsByDateAndMuseum(date, museumId);
  } catch (error) {
    console.error("Error getting bookings by date and museum: ", error);
    throw error;
  }
};

// Get available time slots for a specific date and museum
export const getAvailableTimeSlots = async (date: string, museum: Museum): Promise<TimeSlot[]> => {
  try {
    return await getFirebaseAvailableTimeSlots(date, museum);
  } catch (error) {
    console.error("Error getting available time slots: ", error);
    throw error;
  }
};

// Update a booking
export const updateBooking = async (id: string, data: Partial<BookingDetails>): Promise<BookingDetails> => {
  try {
    const result = await updateFirebaseBooking(id, data);
    return result as BookingDetails;
  } catch (error) {
    console.error("Error updating booking: ", error);
    throw error;
  }
};

// Delete a booking
export const deleteBooking = async (id: string): Promise<string> => {
  try {
    return await deleteFirebaseBooking(id);
  } catch (error) {
    console.error("Error deleting booking: ", error);
    throw error;
  }
};

export const getBookingStats = async (): Promise<AdminStats> => {
  try {
    // First try to get from Firebase
    const firebaseBookings = await getFirebaseBookings();
    
    // Update localStorage with fresh data
    localStorage.setItem('adminBookings', JSON.stringify(firebaseBookings));
    
    const today = new Date().toISOString().split('T')[0];
    
    const todayBookings = firebaseBookings.filter(
      (booking) => booking.date && booking.date.split('T')[0] === today
    ).length;
    
    const todayRevenue = firebaseBookings
      .filter(booking => booking.date && booking.date.split('T')[0] === today)
      .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    
    return {
      totalBookings: firebaseBookings.length,
      totalRevenue: firebaseBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0),
      todayBookings,
      todayRevenue,
      visitorMetrics: { daily: 0, weekly: 0, monthly: 0 },
      peakTimes: [],
      popularMuseums: []
    };
  } catch (error) {
    console.error('Error fetching from Firebase, falling back to localStorage:', error);
    
    // Fallback to localStorage if Firebase fails
    const localBookings = localStorage.getItem('adminBookings');
    const bookings = localBookings ? JSON.parse(localBookings) : [];
    
    const today = new Date().toISOString().split('T')[0];
    
    const todayBookings = bookings.filter(
      (booking) => booking.date && booking.date.split('T')[0] === today
    ).length;
    
    const todayRevenue = bookings
      .filter(booking => booking.date && booking.date.split('T')[0] === today)
      .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    
    return {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0),
      todayBookings,
      todayRevenue,
      visitorMetrics: { daily: 0, weekly: 0, monthly: 0 },
      peakTimes: [],
      popularMuseums: []
    };
  }
};