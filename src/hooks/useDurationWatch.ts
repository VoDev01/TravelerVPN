import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

const VPN_START_TIME_KEY = "@vpn_start_time";

export const useDurationWatch = () => {
	const [time, setTime] = useState(0);
	const [isRunning, setIsRunning] = useState(false);

	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const startTimeRef = useRef<number | null>(null);

	useEffect(() => {
		const restoreTimer = async () => {
			const savedStartTime = await AsyncStorage.getItem(VPN_START_TIME_KEY);
			if (savedStartTime) {
				const startMs = parseInt(savedStartTime, 10);
				startTimeRef.current = startMs;
				setIsRunning(true);
				setTime(Date.now() - startMs);
			}
		};
		restoreTimer();
	}, []);

	useEffect(() => {
		const handleAppStateChange = async (nextAppState: AppStateStatus) => {
			if (nextAppState === "active" && startTimeRef.current !== null) {
				setTime(Date.now() - startTimeRef.current);
			}
		};

		const subscription = AppState.addEventListener(
			"change",
			handleAppStateChange,
		);
		return () => subscription.remove();
	}, []);

	useEffect(() => {
		if (isRunning && startTimeRef.current !== null) {
			intervalRef.current = setInterval(() => {
				setTime(Date.now() - startTimeRef.current!);
			}, 1000);
		} else if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [isRunning]);

	const start = async (initialMs?: number) => {
		const now = Date.now();
		const startPoint = typeof initialMs === "number" ? now - initialMs : now;

		startTimeRef.current = startPoint;
		await AsyncStorage.setItem(VPN_START_TIME_KEY, startPoint.toString());

		setTime(now - startPoint);
		setIsRunning(true);
	};

	const stop = async () => {
		setIsRunning(false);
		startTimeRef.current = null;
		await AsyncStorage.removeItem(VPN_START_TIME_KEY);
	};

	const reset = async () => {
		setIsRunning(false);
		startTimeRef.current = null;
		setTime(0);
		await AsyncStorage.removeItem(VPN_START_TIME_KEY);
	};

	const formatTime = (ms: number): string => {
		const totalSeconds = Math.floor(ms / 1000);

		if (totalSeconds >= 3599999999 || totalSeconds < 0) {
			stop();
			return "00:00:00";
		}

		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		const pad = (num: number): string => num.toString().padStart(2, "0");

		return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
	};

	return {
		time,
		start,
		stop,
		reset,
		formatTime,
	};
};
