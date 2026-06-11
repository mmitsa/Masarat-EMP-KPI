import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Select, Button, Badge } from '../ui';

// Constants for warehouse classifications
const WAREHOUSE_CLASSIFICATIONS = [
    { value: '', label: 'جميع التصنيفات' },
    { value: 'central', label: 'مركزي' },
    { value: 'branch', label: 'فرعي' },
    { value: 'unspecified', label: 'غير محدد' },
];

/**
 * Interactive Map Component for Warehouse Locations
 * Uses Leaflet for map rendering with custom markers
 */
export default function InteractiveMap({ warehouses = [], onWarehouseClick }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);

    const [selectedClassification, setSelectedClassification] = useState('');
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Filter warehouses with valid coordinates
    const warehousesWithCoords = useMemo(() => {
        return warehouses.filter(w => w.latitude && w.longitude);
    }, [warehouses]);

    // Filter by classification
    const filteredWarehouses = useMemo(() => {
        let filtered = warehousesWithCoords;

        if (selectedClassification) {
            filtered = filtered.filter(w => w.classification === selectedClassification);
        }

        if (selectedWarehouseId) {
            filtered = filtered.filter(w => w.id.toString() === selectedWarehouseId);
        }

        return filtered;
    }, [warehousesWithCoords, selectedClassification, selectedWarehouseId]);

    // Initialize map
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Dynamically load Leaflet
        const loadLeaflet = async () => {
            if (!window.L) {
                // Load Leaflet CSS
                const cssLink = document.createElement('link');
                cssLink.rel = 'stylesheet';
                cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(cssLink);

                // Load Leaflet JS
                await new Promise((resolve) => {
                    const script = document.createElement('script');
                    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                    script.onload = resolve;
                    document.head.appendChild(script);
                });
            }

            // Wait for Leaflet to be available
            await new Promise(resolve => setTimeout(resolve, 100));

            if (mapRef.current && !mapInstanceRef.current && window.L) {
                // Default center (Saudi Arabia)
                const defaultCenter = [24.7136, 46.6753];
                const defaultZoom = 6;

                // Create map
                mapInstanceRef.current = window.L.map(mapRef.current).setView(defaultCenter, defaultZoom);

                // Add tile layer (OpenStreetMap)
                window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19,
                }).addTo(mapInstanceRef.current);

                setMapLoaded(true);
            }
        };

        loadLeaflet();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update markers when filtered warehouses change
    useEffect(() => {
        if (!mapLoaded || !mapInstanceRef.current || !window.L) return;

        // Clear existing markers
        markersRef.current.forEach(marker => {
            mapInstanceRef.current.removeLayer(marker);
        });
        markersRef.current = [];

        // Add new markers
        filteredWarehouses.forEach(warehouse => {
            const markerColor = warehouse.type === 'return' ? '#f97316' : '#3b82f6';

            // Create custom icon
            const customIcon = window.L.divIcon({
                className: 'custom-marker',
                html: `
                    <div style="
                        background-color: ${markerColor};
                        width: 32px;
                        height: 32px;
                        border-radius: 50% 50% 50% 0;
                        transform: rotate(-45deg);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    ">
                        <span style="
                            transform: rotate(45deg);
                            color: white;
                            font-size: 12px;
                            font-weight: bold;
                        ">📦</span>
                    </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32],
            });

            const marker = window.L.marker([warehouse.latitude, warehouse.longitude], { icon: customIcon })
                .addTo(mapInstanceRef.current);

            // Create popup content
            const popupContent = `
                <div style="direction: rtl; text-align: right; min-width: 200px; font-family: 'IBM Plex Sans Arabic', sans-serif;">
                    <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #1f2937;">${warehouse.name}</h3>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                        <strong>النوع:</strong> ${warehouse.type === 'return' ? 'رجيع' : 'أساسي'}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                        <strong>التصنيف:</strong> ${getClassificationLabel(warehouse.classification)}
                    </div>
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                        <strong>المدينة:</strong> ${warehouse.city || 'غير محددة'}
                    </div>
                    ${warehouse.custodianName ? `
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                            <strong>الأمين:</strong> ${warehouse.custodianName}
                        </div>
                    ` : ''}
                    <div style="font-size: 11px; color: #9ca3af; margin-top: 8px;">
                        ${warehouse.latitude.toFixed(4)}, ${warehouse.longitude.toFixed(4)}
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent);

            marker.on('click', () => {
                if (onWarehouseClick) {
                    onWarehouseClick(warehouse);
                }
            });

            markersRef.current.push(marker);
        });

        // Fit bounds if there are markers
        if (filteredWarehouses.length > 0) {
            const bounds = window.L.latLngBounds(
                filteredWarehouses.map(w => [w.latitude, w.longitude])
            );
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
    }, [filteredWarehouses, mapLoaded, onWarehouseClick]);

    // Toggle fullscreen
    const toggleFullscreen = () => {
        if (!mapRef.current) return;

        if (!isFullscreen) {
            if (mapRef.current.requestFullscreen) {
                mapRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        setIsFullscreen(!isFullscreen);
    };

    // Zoom controls
    const handleZoomIn = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.zoomIn();
        }
    };

    const handleZoomOut = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.zoomOut();
        }
    };

    // Helper function
    function getClassificationLabel(value) {
        const cls = WAREHOUSE_CLASSIFICATIONS.find(c => c.value === value);
        return cls?.label || 'غير محدد';
    }

    return (
        <div className="relative">
            {/* Filters Panel */}
            <div className="absolute top-4 right-4 z-[1000] bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 w-72">
                <h4 className="font-bold text-gray-900 dark:text-white mb-3">تصفية المستودعات</h4>

                <div className="space-y-3">
                    <Select
                        label="حدد تصنيف المستودع"
                        value={selectedClassification}
                        onChange={(e) => {
                            setSelectedClassification(e.target.value);
                            setSelectedWarehouseId('');
                        }}
                        options={WAREHOUSE_CLASSIFICATIONS}
                    />

                    <Select
                        label="حدد المستودع"
                        value={selectedWarehouseId}
                        onChange={(e) => setSelectedWarehouseId(e.target.value)}
                        options={[
                            { value: '', label: 'جميع المستودعات' },
                            ...filteredWarehouses.map(w => ({
                                value: w.id.toString(),
                                label: w.name
                            }))
                        ]}
                    />
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                        <span>المستودعات المعروضة:</span>
                        <Badge variant="info">{filteredWarehouses.length}</Badge>
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">دليل الألوان</h5>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">مستودع أساسي</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">مستودع رجيع</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map Controls */}
            <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
                <button
                    onClick={handleZoomIn}
                    className="w-10 h-10 bg-white dark:bg-gray-900 rounded-lg shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition"
                    title="تكبير"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
                <button
                    onClick={handleZoomOut}
                    className="w-10 h-10 bg-white dark:bg-gray-900 rounded-lg shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition"
                    title="تصغير"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                </button>
                <button
                    onClick={toggleFullscreen}
                    className="w-10 h-10 bg-white dark:bg-gray-900 rounded-lg shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition"
                    title="شاشة كاملة"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </button>
            </div>

            {/* Map Container */}
            <div
                ref={mapRef}
                className="w-full h-[600px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
                style={{ background: '#f3f4f6' }}
            >
                {!mapLoaded && (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-gray-600 dark:text-gray-300">جاري تحميل الخريطة...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* No Warehouses Message */}
            {mapLoaded && filteredWarehouses.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                    <div className="text-center">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">لا توجد مواقع</h3>
                        <p className="text-gray-500 dark:text-gray-400">لم يتم العثور على مستودعات بإحداثيات جغرافية</p>
                    </div>
                </div>
            )}
        </div>
    );
}
