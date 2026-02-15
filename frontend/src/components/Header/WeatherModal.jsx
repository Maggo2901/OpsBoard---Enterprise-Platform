import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Calendar, Thermometer, Wind, Droplets } from 'lucide-react';

export default function WeatherModal({ isOpen, onClose, weatherData, city }) {
    if (!isOpen || !weatherData) return null;

    const { current, daily } = weatherData;

    // Helper to format day name
    const getDayName = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    const getWeatherIcon = (code) => {
        // Simple mapping for WMO Weather interpretation codes (0-99)
        if (code <= 1) return "☀️";
        if (code <= 3) return "⛅";
        if (code <= 48) return "🌫️";
        if (code <= 57) return "🌧️";
        if (code <= 67) return "☔";
        if (code <= 77) return "❄️";
        if (code <= 82) return "🌦️";
        if (code <= 86) return "❄️";
        if (code <= 99) return "⛈️";
        return "🌡️";
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="p-6 bg-gradient-to-br from-indigo-900/50 to-slate-900 border-b border-slate-700/50 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 text-textSecondary mb-1">
                            <MapPin size={16} className="text-primary" />
                            <span className="font-medium tracking-wide uppercase text-xs">Current Location</span>
                        </div>
                        <h2 className="text-3xl font-bold text-primary flex items-center gap-3">
                            {city}
                            <span className="text-4xl">{getWeatherIcon(current.weather_code)}</span>
                        </h2>
                        <div className="mt-2 text-6xl font-thin text-textPrimary items-baseline flex gap-2">
                            {Math.round(current.temperature_2m)}°
                            <span className="text-lg font-normal text-textSecondary">Current</span>
                        </div>
                    </div>
                     <button onClick={onClose} className="text-textSecondary hover:text-textPrimary transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10">
                        <X size={20} />
                    </button>
                </div>

                {/* Today's Forecast (Mocked segments as OpenMeteo gives hourly) */}
                <div className="p-6 grid grid-cols-4 gap-4 border-b border-slate-800">
                    {['Morning', 'Afternoon', 'Evening', 'Night'].map((period, idx) => (
                        <div key={period} className="text-center p-3 rounded-lg bg-slate-950/50 border border-slate-800/50">
                            <div className="text-xs text-textTertiary mb-2 uppercase font-semibold">{period}</div>
                            <div className="text-2xl mb-1">{getWeatherIcon(daily.weather_code[0])}</div> {/* Simplified for demo */}
                            <div className="font-medium text-textSecondary">{Math.round(daily.temperature_2m_max[0] - (idx))}°</div>
                        </div>
                    ))}
                </div>

                {/* 7 Day Forecast */}
                <div className="p-6 bg-slate-950/30">
                    <h3 className="text-sm font-semibold text-textSecondary uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Calendar size={14} /> 7-Day Forecast
                    </h3>
                    <div className="space-y-3">
                        {daily.time.slice(1, 8).map((time, i) => (
                            <div key={time} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                                <div className="w-24 font-medium text-textSecondary">{getDayName(time)}</div>
                                <div className="flex-1 flex items-center justify-center gap-4">
                                     <span className="text-2xl">{getWeatherIcon(daily.weather_code[i+1])}</span>
                                     <div className="w-full max-w-[100px] h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                                        <div 
                                            className="absolute h-full bg-gradient-to-r from-blue-500 to-amber-500 opacity-70"
                                            style={{ 
                                                left: '10%', 
                                                right: '10%' 
                                            }}
                                        />
                                     </div>
                                </div>
                                <div className="w-24 text-right text-sm">
                                    <span className="text-textTertiary">{Math.round(daily.temperature_2m_min[i+1])}°</span>
                                    <span className="mx-2 text-textMuted">/</span>
                                    <span className="text-textPrimary font-medium">{Math.round(daily.temperature_2m_max[i+1])}°</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
}
