export interface WeatherData {
    current: {
        temp: number;
        weatherCode: number;
    };
    daily: {
        time: string[];
        rain_sum: number[];
        precipitation_probability_max: number[];
        weather_code: number[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
    }[];
}

export interface WeatherDay {
    date: string;
    temp_max: number;
    temp_min: number;
    rh_avg: number;
    rain_sum: number;
    dewpoint_avg: number;
    leaf_wetness_hours: number;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const WEATHER_CACHE_KEY = 'cached_weather_data';

export async function getWeather(lat: number, lon: number) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,rain_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        const data = await response.json();

        // Cache the successful response
        await AsyncStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: data
        }));

        return data;
    } catch (error) {
        console.error("Error fetching weather:", error);

        // Try to load from cache
        try {
            const cached = await AsyncStorage.getItem(WEATHER_CACHE_KEY);
            if (cached) {
                const { data } = JSON.parse(cached);
                console.log("Serving cached weather data");
                return data;
            }
        } catch (cacheError) {
            console.error("Cache retrieval failed:", cacheError);
        }

        return null;
    }
}

export async function getAgroWeather(lat: number, lon: number) {
    // Fetches detailed parameters for risk calculation (Hourly aggregated to Daily)
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=relative_humidity_2m,dew_point_2m&daily=temperature_2m_max,temperature_2m_min,rain_sum&timezone=auto&forecast_days=3`
        );
        const data = await response.json();

        // Process into 3 simple daily objects
        const dailyData = [];

        for (let i = 0; i < 3; i++) {
            // Aggregate hourly for this day (0-23, 24-47, 48-71)
            const start = i * 24;
            const end = start + 24;

            const hourlyRh = data.hourly.relative_humidity_2m.slice(start, end);
            const hourlyDew = data.hourly.dew_point_2m.slice(start, end);

            // Calc Averages
            const rhAvg = hourlyRh.reduce((a: any, b: any) => a + b, 0) / hourlyRh.length;
            const dewAvg = hourlyDew.reduce((a: any, b: any) => a + b, 0) / hourlyDew.length;

            // Approx Leaf Wetness: Basic logic => if RH > 90 for 'n' hours
            const wetHours = hourlyRh.filter((rh: number) => rh >= 90).length;

            dailyData.push({
                date: data.daily.time[i],
                temp_max: data.daily.temperature_2m_max[i],
                temp_min: data.daily.temperature_2m_min[i],
                rain_sum: data.daily.rain_sum[i],
                rh_avg: rhAvg,
                dewpoint_avg: dewAvg,
                leaf_wetness_hours: wetHours // derived approximation
            });
        }

        return dailyData;

    } catch (error) {
        console.error("Error fetching agro weather:", error);
        return [];
    }
}

export function getWeatherIcon(code: number): string {
    // 0: Clear sky
    if (code === 0) return '☀️';
    // 1-3: Mainly clear, partly cloudy, and overcast
    if (code >= 1 && code <= 3) return '🌥️';
    // 45, 48: Fog
    if (code === 45 || code === 48) return '🌫️';
    // 51-67: Drizzle & Rain
    if (code >= 51 && code <= 67) return '🌧️';
    // 80-82: Rain showers
    if (code >= 80 && code <= 82) return '🌦️';
    // 95-99: Thunderstorm
    if (code >= 95) return '⛈️';

    return '❓';
}

export function getWeatherDescription(code: number): string {
    // WMO Weather interpretation codes (WW)
    if (code === 0) return 'Clear sky';
    if (code === 1 || code === 2 || code === 3) return 'Mainly clear, partly cloudy, and overcast';
    if (code === 45 || code === 48) return 'Fog and depositing rime fog';
    if (code >= 51 && code <= 55) return 'Drizzle: Light, moderate, and dense intensity';
    if (code >= 61 && code <= 65) return 'Rain: Slight, moderate and heavy intensity';
    if (code >= 80 && code <= 82) return 'Rain showers: Slight, moderate, and violent';
    if (code >= 95) return 'Thunderstorm: Slight or moderate';
    return 'Unknown';
}
