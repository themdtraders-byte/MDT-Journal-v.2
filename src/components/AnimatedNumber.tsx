
'use client';

import { useState, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';

interface AnimatedNumberProps {
    value: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
}

const AnimatedNumber = ({ value, prefix = '', suffix = '', decimals = 2 }: AnimatedNumberProps) => {
    const { number } = useSpring({
        from: { number: 0 },
        number: value,
        delay: 200,
        config: { mass: 1, tension: 20, friction: 10 },
    });

    return (
        <animated.span>
            {number.to(n => `${prefix}${n.toFixed(decimals)}${suffix}`)}
        </animated.span>
    );
};

export default AnimatedNumber;
