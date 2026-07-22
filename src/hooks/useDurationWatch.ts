import { useEffect, useRef, useState } from "react";

export const useDurationWatch = () => {
	const [time, setTime] = useState(0);
	const [isRunning, setIsRunning] = useState(false);

	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (isRunning) {
			intervalRef.current = setInterval(() => {
				setTime((prevTime) => prevTime + 10);
			}, 10);
		} else if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [isRunning]);

	const start = () => {
		setIsRunning(true);
	};

	const stop = () => {
		setIsRunning(false);
	};

	const reset = () => {
		setTime(0);
		setIsRunning(false);
	};

	const formatTime = (ms: number): string => {
		const totalSeconds = Math.floor(ms / 1000);

		if (totalSeconds >= 356400) {
			stop();
			return "99:59:59";
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
