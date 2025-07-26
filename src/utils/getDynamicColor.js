export function getDynamicColor(percentage) {
    if (percentage < 50) {
        return "#ef4444"; // Red for less than 50%
    } else if (percentage >= 50 && percentage <= 99) {
        return "#f59e0b"; // Amber for 50-99%
    } else {
        return "#10b981"; // Green for 100% and above
    }
}
