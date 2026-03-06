import { useEffect, useRef } from 'react';
import { sendHeartbeat } from '../services/api';

export const useHeartbeat = () => {
    const intervalRef = useRef(null);

    useEffect(() => {
        // Send heartbeat every 10 seconds
        intervalRef.current = setInterval(async () => {
            try {
                await sendHeartbeat({
                    ipAddress: 'website-user',
                    durationIncrement: 10,
                });
            } catch (err) {
                // Silently fail
            }
        }, 10000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);
};
