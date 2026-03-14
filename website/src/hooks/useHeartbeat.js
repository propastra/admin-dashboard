import { useEffect, useRef } from 'react';
import { sendHeartbeat } from '../services/api';

export const useHeartbeat = () => {
    const intervalRef = useRef(null);

    useEffect(() => {
        // Send heartbeat less frequently for performance
        intervalRef.current = setInterval(async () => {
            try {
                await sendHeartbeat({
                    ipAddress: 'website-user',
                    durationIncrement: 30,
                });
            } catch (err) {
                // Silently fail
            }
        }, 30000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);
};
