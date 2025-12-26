import { springTransition, layoutTransition } from '../utils/animations';

describe('Animation Config', () => {
    test('springTransition should have correct physics', () => {
        expect(springTransition).toEqual({
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 1
        });
    });

    test('layoutTransition should match springTransition', () => {
        expect(layoutTransition).toBe(springTransition);
    });
});
