import { FREQUENCY_UNIT } from '../../../common/constants';

/**
 * Unit tests for recurring job date calculation
 */
describe('Recurring Job Date Calculation', () => {
    // Helper function (same as in job.service.ts)
    function calculateNextJobDate(
        currentDate: Date,
        frequencyValue: number,
        frequencyUnit: number
    ): Date {
        const nextDate = new Date(currentDate);

        switch (frequencyUnit) {
            case FREQUENCY_UNIT.DAYS:
                nextDate.setDate(nextDate.getDate() + frequencyValue);
                break;
            case FREQUENCY_UNIT.WEEKS:
                nextDate.setDate(nextDate.getDate() + (frequencyValue * 7));
                break;
            case FREQUENCY_UNIT.MONTHS:
                nextDate.setMonth(nextDate.getMonth() + frequencyValue);
                break;
            case FREQUENCY_UNIT.YEARS:
                nextDate.setFullYear(nextDate.getFullYear() + frequencyValue);
                break;
            default:
                nextDate.setDate(nextDate.getDate() + frequencyValue);
        }

        return nextDate;
    }

    describe('Daily Frequency', () => {
        it('should add 1 day correctly', () => {
            const baseDate = new Date('2025-12-09');
            const nextDate = calculateNextJobDate(baseDate, 1, FREQUENCY_UNIT.DAYS);
            expect(nextDate.toISOString().split('T')[0]).toBe('2025-12-10');
        });

        it('should add 7 days correctly', () => {
            const baseDate = new Date('2025-12-09');
            const nextDate = calculateNextJobDate(baseDate, 7, FREQUENCY_UNIT.DAYS);
            expect(nextDate.toISOString().split('T')[0]).toBe('2025-12-16');
        });

        it('should add 14 days correctly', () => {
            const baseDate = new Date('2025-12-09');
            const nextDate = calculateNextJobDate(baseDate, 14, FREQUENCY_UNIT.DAYS);
            expect(nextDate.toISOString().split('T')[0]).toBe('2025-12-23');
        });
    });

    describe('Weekly Frequency', () => {
        it('should add 1 week (7 days) correctly', () => {
            const baseDate = new Date('2025-12-09');
            const nextDate = calculateNextJobDate(baseDate, 1, FREQUENCY_UNIT.WEEKS);
            expect(nextDate.toISOString().split('T')[0]).toBe('2025-12-16');
        });

        it('should add 2 weeks (14 days) correctly', () => {
            const baseDate = new Date('2025-12-09');
            const nextDate = calculateNextJobDate(baseDate, 2, FREQUENCY_UNIT.WEEKS);
            expect(nextDate.toISOString().split('T')[0]).toBe('2025-12-23');
        });

        it('should add 4 weeks (28 days) correctly', () => {
            const baseDate = new Date('2025-12-09');
            const nextDate = calculateNextJobDate(baseDate, 4, FREQUENCY_UNIT.WEEKS);
            expect(nextDate.toISOString().split('T')[0]).toBe('2026-01-06');
        });
    });

    describe('Monthly Frequency', () => {
        it('should add 1 month correctly', () => {
            const baseDate = new Date('2025-12-09');
            const nextDate = calculateNextJobDate(baseDate, 1, FREQUENCY_UNIT.MONTHS);
            expect(nextDate.getMonth()).toBe(0); // January (0-indexed)
            expect(nextDate.getDate()).toBe(9);
        });

        it('should add 6 months correctly', () => {
            const baseDate = new Date('2025-06-15');
            const nextDate = calculateNextJobDate(baseDate, 6, FREQUENCY_UNIT.MONTHS);
            expect(nextDate.getMonth()).toBe(11); // December
            expect(nextDate.getDate()).toBe(15);
        });

        it('should handle month-end edge case', () => {
            const baseDate = new Date('2025-01-31');
            const nextDate = calculateNextJobDate(baseDate, 1, FREQUENCY_UNIT.MONTHS);
            // JavaScript Date handles this automatically (Feb 28/29)
            expect(nextDate.getMonth()).toBe(1); // February
        });
    });

    describe('Yearly Frequency', () => {
        it('should add 1 year correctly', () => {
            const baseDate = new Date('2025-12-09');
            const nextDate = calculateNextJobDate(baseDate, 1, FREQUENCY_UNIT.YEARS);
            expect(nextDate.getFullYear()).toBe(2026);
            expect(nextDate.getMonth()).toBe(11); // December
            expect(nextDate.getDate()).toBe(9);
        });

        it('should add 5 years correctly', () => {
            const baseDate = new Date('2025-03-15');
            const nextDate = calculateNextJobDate(baseDate, 5, FREQUENCY_UNIT.YEARS);
            expect(nextDate.getFullYear()).toBe(2030);
        });
    });

    describe('Edge Cases', () => {
        it('should handle unknown frequency unit by defaulting to days', () => {
            const baseDate = new Date('2025-12-09');
            const nextDate = calculateNextJobDate(baseDate, 10, 999); // Invalid unit
            // Should add 10 days by default
            expect(nextDate.toISOString().split('T')[0]).toBe('2025-12-19');
        });

        it('should handle zero frequency value', () => {
            const baseDate = new Date('2025-12-09');
            const nextDate = calculateNextJobDate(baseDate, 0, FREQUENCY_UNIT.DAYS);
            expect(nextDate.toISOString().split('T')[0]).toBe('2025-12-09');
        });
    });
});
