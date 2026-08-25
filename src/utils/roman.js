const NUMERALS = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

// Tarot numerals only ever run through a handful of projects, so a plain
// greedy conversion is all this needs.
export function toRoman(num) {
    let n = num;
    let out = "";
    for (const [value, symbol] of NUMERALS) {
        while (n >= value) {
            out += symbol;
            n -= value;
        }
    }
    return out;
}
