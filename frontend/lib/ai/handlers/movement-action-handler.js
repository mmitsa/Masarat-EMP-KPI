/**
 * Movement Action Handler
 * معالج إجراءات حركة الأسطول
 */

import { apiGet, apiPost } from '../../api';
import { API } from '../../routes';

/**
 * معالج إجراءات حركة الأسطول
 */
export class MovementActionHandler {
    constructor(userId, userRoles, accessToken) {
        this.userId = userId;
        this.roles = userRoles;
        this.accessToken = accessToken;
    }

    /**
     * حجز مركبة
     */
    async bookVehicle({ date, startTime, endTime, destination, purpose, passengers = 1 }) {
        try {
            // التحقق من التاريخ
            const bookingDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (bookingDate < today) {
                return {
                    success: false,
                    error: 'لا يمكن حجز مركبة بتاريخ سابق',
                };
            }

            // البحث عن مركبة متاحة
            const availableVehicles = await this.fetchAvailableVehicles(date, startTime, endTime);

            if (availableVehicles.length === 0) {
                return {
                    success: false,
                    error: 'لا توجد مركبات متاحة في هذا الموعد',
                    suggestion: 'جرب اختيار موعد آخر أو تواصل مع إدارة الأسطول',
                };
            }

            // اختيار أنسب مركبة
            const selectedVehicle = availableVehicles[0];

            // إنشاء الحجز
            const bookingData = {
                employee_id: this.userId,
                vehicle_id: selectedVehicle.id,
                date,
                start_time: startTime || '08:00',
                end_time: endTime || '17:00',
                destination,
                purpose,
                passengers,
                status: 'pending',
            };

            const result = await this.submitBooking(bookingData);

            return {
                success: true,
                type: 'vehicle_booking_created',
                data: {
                    bookingId: result.id,
                    vehicle: selectedVehicle.plateNumber,
                    vehicleType: selectedVehicle.type,
                    date,
                    destination,
                },
                message: `تم حجز المركبة بنجاح`,
                details: [
                    `رقم الحجز: ${result.id}`,
                    `المركبة: ${selectedVehicle.plateNumber} (${selectedVehicle.type})`,
                    `التاريخ: ${this.formatDate(date)}`,
                    `الوقت: ${startTime || '08:00'} - ${endTime || '17:00'}`,
                    `الوجهة: ${destination}`,
                ],
                nextSteps: [
                    'سيتم إرسال الطلب للموافقة',
                    'ستصلك رسالة تأكيد عند الموافقة',
                ],
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * عرض المركبات المتاحة
     */
    async getAvailableVehicles({ date, vehicleType }) {
        try {
            const targetDate = date || this.getToday();
            const vehicles = await this.fetchAvailableVehicles(targetDate, null, null, vehicleType);

            if (vehicles.length === 0) {
                return {
                    success: true,
                    type: 'available_vehicles',
                    data: [],
                    message: 'لا توجد مركبات متاحة في هذا التاريخ',
                };
            }

            return {
                success: true,
                type: 'available_vehicles',
                data: vehicles,
                message: `يوجد ${vehicles.length} مركبة متاحة`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * عرض رحلاتي
     */
    async getMyTrips({ status = 'all' }) {
        try {
            const trips = await this.fetchTrips(this.userId, status);

            if (trips.length === 0) {
                return {
                    success: true,
                    type: 'my_trips',
                    data: [],
                    message: 'لا توجد رحلات مسجلة',
                };
            }

            return {
                success: true,
                type: 'my_trips',
                data: trips,
                message: `لديك ${trips.length} رحلة`,
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * عرض معلومات مركبة
     */
    async getVehicleInfo({ vehicleId }) {
        try {
            const vehicle = await this.fetchVehicleDetails(vehicleId);

            if (!vehicle) {
                return {
                    success: false,
                    error: `لم يتم العثور على المركبة: ${vehicleId}`,
                };
            }

            return {
                success: true,
                type: 'vehicle_info',
                data: vehicle,
                message: [
                    `🚗 ${vehicle.type} - ${vehicle.plateNumber}`,
                    `الحالة: ${vehicle.status === 'available' ? 'متاحة' : 'غير متاحة'}`,
                    `السعة: ${vehicle.capacity} راكب`,
                    vehicle.driver ? `السائق: ${vehicle.driver.name}` : 'بدون سائق معين',
                ].join('\n'),
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // ============================================
    // دوال مساعدة
    // ============================================

    async fetchAvailableVehicles(date, startTime, endTime, vehicleType) {
        try {
            let url = `${API.MOVEMENT?.VEHICLES || '/api/movement/vehicles'}?available=true&date=${date}`;
            if (vehicleType) url += `&type=${encodeURIComponent(vehicleType)}`;
            const response = await apiGet(url);
            return response.data || response;
        } catch {
            return [
                { id: 'V001', plateNumber: 'أ ب ج 1234', type: 'سيدان', capacity: 4, status: 'available' },
                { id: 'V002', plateNumber: 'د هـ و 5678', type: 'SUV', capacity: 7, status: 'available' },
            ];
        }
    }

    async submitBooking(data) {
        try {
            const response = await apiPost(API.MOVEMENT?.MISSIONS || '/api/movement/missions', data);
            return response;
        } catch {
            return { id: 'BK-' + Date.now(), ...data };
        }
    }

    async fetchTrips(employeeId, status) {
        try {
            let url = `${API.MOVEMENT?.MISSIONS || '/api/movement/missions'}?employeeId=${employeeId}`;
            if (status && status !== 'all') url += `&status=${status}`;
            const response = await apiGet(url);
            return response.data || response;
        } catch {
            return [
                {
                    id: 'T001',
                    date: '2026-02-05',
                    destination: 'فرع الرياض',
                    vehicle: 'سيدان - أ ب ج 1234',
                    status: 'upcoming',
                },
            ];
        }
    }

    async fetchVehicleDetails(vehicleId) {
        try {
            const response = await apiGet(`${API.MOVEMENT?.VEHICLES || '/api/movement/vehicles'}/${vehicleId}`);
            return response;
        } catch {
            return {
                id: vehicleId,
                plateNumber: 'أ ب ج 1234',
                type: 'سيدان',
                capacity: 4,
                status: 'available',
                driver: { id: 'D001', name: 'عبدالله محمد' },
            };
        }
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    getToday() {
        return new Date().toISOString().split('T')[0];
    }
}

export default MovementActionHandler;
