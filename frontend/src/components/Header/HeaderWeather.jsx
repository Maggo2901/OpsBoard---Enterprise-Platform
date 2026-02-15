import React, { useState, useEffect } from 'react';
import { CloudSun, Loader2, MapPin } from 'lucide-react';
import WeatherModal from './WeatherModal';

export default function HeaderWeather() {
    const [weather, setWeather] = useState(null);
    const [city, setCity] = useState(import.meta.env.VITE_WEATHER_CITY || 'Frankfurt am Main');
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    await fetchCityName(latitude, longitude);
                    await fetchWeather(latitude, longitude);
                },
                (err) => {
                    console.warn("Geolocation denied/error", err);
                    fetchWeatherByCity(city);
                }
            );
        } else {
            fetchWeatherByCity(city);
        }
    }, []);

    const fetchCityName = async (lat, lon) => {
        try {
            // Using Nominatim for reverse geocoding
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await res.json();
            if (data && data.address) {
                // Determine city name from address components
                const detectedCity = data.address.city || data.address.town || data.address.village || data.address.municipality || "Unknown Location";
                setCity(detectedCity);
            }
        } catch (e) {
            console.error("Reverse geocoding failed", e);
        }
    };

    const fetchWeatherByCity = async (cityName) => {
        try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=en&format=json`);
            const geoData = await geoRes.json();
            
            if (geoData.results && geoData.results.length > 0) {
                const { latitude, longitude, name } = geoData.results[0];
                setCity(name);
                fetchWeather(latitude, longitude);
            } else {
                setLoading(false);
            }
        } catch (e) {
            console.error("Geocoding failed", e);
            setLoading(false);
        }
    };

    const fetchWeather = async (lat, lon) => {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
            const data = await res.json();
            setWeather(data);
            setLoading(false);
        } catch (e) {
            console.error("Weather fetch failed", e);
            setLoading(false);
        }
    };

    if (loading) return <div className="animate-pulse w-20 h-6 bg-slate-800/50 rounded-md"></div>;
    if (!weather) return null;

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 text-xs font-medium text-textSecondary hover:text-textPrimary px-3 py-1.5 rounded-md hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50 group"
                title={`Weather in ${city}`}
            >
                <div className="flex items-center gap-1.5">
                    <CloudSun size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
                    <span>{Math.round(weather.current.temperature_2m)}°C</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 opacity-70 text-[10px] text-textTertiary uppercase font-bold tracking-wide border-l border-slate-700 pl-2 ml-1">
                    <MapPin size={10} />
                    {city}
                </div>
            </button>

            <WeatherModal 
                isOpen={isOpen} 
                onClose={() => setIsOpen(false)} 
                weatherData={weather}
                city={city}
            />
        </>
    );
}
