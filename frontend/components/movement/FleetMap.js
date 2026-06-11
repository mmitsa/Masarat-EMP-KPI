import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Badge } from '../ui';

// Dynamic import لـ Leaflet (لتجنب مشاكل SSR في Next.js)
const MapContainer = dynamic(
    () => import('react-leaflet').then(mod => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then(mod => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then(mod => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then(mod => mod.Popup),
    { ssr: false }
);
const Circle = dynamic(
    () => import('react-leaflet').then(mod => mod.Circle),
    { ssr: false }
);
const Polygon = dynamic(
    () => import('react-leaflet').then(mod => mod.Polygon),
    { ssr: false }
);

/**
 * خريطة تتبع الأسطول - عرض المركبات والسياجات الجغرافية
 */
export default function FleetMap({
    vehicles = [],
    geofences = [],
    selectedVehicle = null,
    onVehicleClick = null,
    height = '600px',
    center = [24.7136, 46.6753], // الرياض
    zoom = 12,
    autoZoom = true,
    showTraffic = false,
    showGeofences = true
}) {
    const [map, setMap] = useState(null);
    const [L, setL] = useState(null);
    const markersRef = useRef({});

    // تحميل Leaflet بعد التحميل
    useEffect(() => {
        import('leaflet').then((leaflet) => {
            setL(leaflet);
            // Fix for default marker icons
            delete leaflet.Icon.Default.prototype._getIconUrl;
            leaflet.Icon.Default.mergeOptions({
                iconRetinaUrl: '/leaflet/marker-icon-2x.png',
                iconUrl: '/leaflet/marker-icon.png',
                shadowUrl: '/leaflet/marker-shadow.png',
            });
        });
    }, []);

    // Auto zoom لعرض كل المركبات
    useEffect(() => {
        if (!map || !vehicles || vehicles.length === 0 || !autoZoom || !L) return;

        const bounds = L.latLngBounds(
            vehicles.map(v => [v.latitude || center[0], v.longitude || center[1]])
        );

        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [vehicles, map, autoZoom, L, center]);

    // التركيز على مركبة محددة
    useEffect(() => {
        if (!map || !selectedVehicle || !selectedVehicle.latitude || !selectedVehicle.longitude) return;

        map.flyTo([selectedVehicle.latitude, selectedVehicle.longitude], 15, {
            duration: 1.5
        });
    }, [selectedVehicle, map]);

    // دالة للحصول على لون حسب الحالة
    const getVehicleColor = (vehicle) => {
        if (!vehicle.isOnline) return '#9ca3af'; // رمادي - غير متصلة
        if (vehicle.speed > 5) return '#10b981'; // أخضر - متحركة
        if (vehicle.ignitionStatus === 'On' || vehicle.ignitionStatus === 'Idle') {
            return '#f59e0b'; // برتقالي - متوقفة لكن مشغلة
        }
        return '#3b82f6'; // أزرق - متوقفة
    };

    // دالة للحصول على رمز المركبة
    const getVehicleIcon = (vehicle) => {
        if (!L) return null;

        const color = getVehicleColor(vehicle);
        const iconHtml = `
            <div style="position: relative">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                </svg>
                ${vehicle.speed > 5 ? `
                    <div style="position: absolute; top: -4px; right: -4px; background: #10b981; color: white; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">
                        ${Math.round(vehicle.speed)}
                    </div>
                ` : ''}
            </div>
        `;

        return L.divIcon({
            html: iconHtml,
            className: 'custom-vehicle-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        });
    };

    // دالة لتنسيق الوقت
    const formatTime = (timestamp) => {
        if (!timestamp) return 'غير متوفر';
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return 'غير صالح';
        }
    };

    if (!L) {
        return (
            <div style={{ height }} className="bg-gray-100 dark:bg-gray-700/50 rounded-xl flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">جاري تحميل الخريطة...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height }} className="rounded-xl overflow-hidden shadow-sm dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-700">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                whenCreated={setMap}
                scrollWheelZoom={true}
                zoomControl={true}
            >
                {/* خريطة الأساس */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Markers للمركبات */}
                {vehicles.map(vehicle => {
                    if (!vehicle.latitude || !vehicle.longitude) return null;

                    return (
                        <Marker
                            key={vehicle.vehicleId}
                            position={[vehicle.latitude, vehicle.longitude]}
                            icon={getVehicleIcon(vehicle)}
                            eventHandlers={{
                                click: () => onVehicleClick && onVehicleClick(vehicle)
                            }}
                            ref={el => {
                                markersRef.current[vehicle.vehicleId] = el;
                            }}
                        >
                            <Popup>
                                <div className="text-right" dir="rtl" style={{ minWidth: '250px' }}>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{vehicle.plateNumber}</h3>
                                        <Badge variant={vehicle.isOnline ? 'success' : 'danger'}>
                                            {vehicle.isOnline ? 'متصلة' : 'غير متصلة'}
                                        </Badge>
                                    </div>

                                    {vehicle.driverName && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                            <span className="font-semibold">السائق:</span> {vehicle.driverName}
                                        </p>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 text-sm border-t pt-2 mt-2">
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">السرعة:</span>
                                            <p className="font-semibold">{vehicle.speed ? `${Math.round(vehicle.speed)} كم/س` : '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">العداد:</span>
                                            <p className="font-semibold">{vehicle.odometer ? `${vehicle.odometer.toLocaleString('ar-SA')} كم` : '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">البطارية:</span>
                                            <p className="font-semibold">{vehicle.batteryLevel ? `${vehicle.batteryLevel}%` : '-'}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">آخر تحديث:</span>
                                            <p className="font-semibold text-xs">{formatTime(vehicle.timestamp)}</p>
                                        </div>
                                    </div>

                                    {vehicle.ignitionStatus && (
                                        <div className="mt-2 pt-2 border-t">
                                            <Badge variant={vehicle.ignitionStatus === 'On' ? 'success' : 'default'}>
                                                {vehicle.ignitionStatus === 'On' ? 'مشغّل' : vehicle.ignitionStatus === 'Idle' ? 'خامل' : 'مطفأ'}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* السياجات الجغرافية */}
                {showGeofences && geofences.map(geofence => {
                    if (!geofence.isActive) return null;

                    // سياج دائري
                    if (geofence.type === 'Circular' && geofence.centerLatitude && geofence.centerLongitude && geofence.radius) {
                        return (
                            <Circle
                                key={geofence.id}
                                center={[geofence.centerLatitude, geofence.centerLongitude]}
                                radius={geofence.radius}
                                pathOptions={{
                                    color: geofence.color || '#FF5722',
                                    fillColor: geofence.color || '#FF5722',
                                    fillOpacity: 0.2,
                                    weight: 2
                                }}
                            >
                                <Popup>
                                    <div className="text-right" dir="rtl">
                                        <h4 className="font-bold text-gray-900 dark:text-white">{geofence.name}</h4>
                                        {geofence.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{geofence.description}</p>
                                        )}
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            نصف القطر: {geofence.radius.toLocaleString('ar-SA')} متر
                                        </p>
                                    </div>
                                </Popup>
                            </Circle>
                        );
                    }

                    // سياج مضلع
                    if (geofence.type === 'Polygon' && geofence.coordinates && Array.isArray(geofence.coordinates)) {
                        const positions = geofence.coordinates.map(coord => [coord.lat, coord.lng]);

                        if (positions.length < 3) return null;

                        return (
                            <Polygon
                                key={geofence.id}
                                positions={positions}
                                pathOptions={{
                                    color: geofence.color || '#FF5722',
                                    fillColor: geofence.color || '#FF5722',
                                    fillOpacity: 0.2,
                                    weight: 2
                                }}
                            >
                                <Popup>
                                    <div className="text-right" dir="rtl">
                                        <h4 className="font-bold text-gray-900 dark:text-white">{geofence.name}</h4>
                                        {geofence.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{geofence.description}</p>
                                        )}
                                    </div>
                                </Popup>
                            </Polygon>
                        );
                    }

                    return null;
                })}
            </MapContainer>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-900 rounded-lg shadow-md p-3 text-sm" dir="rtl">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">دليل الألوان</h4>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span className="text-gray-700 dark:text-gray-200">متحركة</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                        <span className="text-gray-700 dark:text-gray-200">متوقفة (مشغلة)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                        <span className="text-gray-700 dark:text-gray-200">متوقفة</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                        <span className="text-gray-700 dark:text-gray-200">غير متصلة</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
