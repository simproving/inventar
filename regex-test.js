
console.log('Testing regex:');
const testStrings = [
    'Test Item 4b1123',
    'Test Item 4B1123',
    'Test Item 11B0725',
    'Test Item 4B 1123',
    'Test Item 10 B 1 23',
    'Test Item 99 b 01 26'
];

const fixedRegex = /([0-9]+)\s*[bB]\s*([01]?[0-9])\s*([23][0-9])/g;

testStrings.forEach(str => {
    console.log(`\nTesting: "${str}"`);
    fixedRegex.lastIndex = 0;
    const matches = [...str.matchAll(fixedRegex)];
    matches.forEach(match => {
        console.log(`  Match: ${match[0]}`);
        console.log(`  Quantity: ${match[1]}`);
        console.log(`  Month: ${match[2]}`);
        console.log(`  Year: ${match[3]}`);
    });
});

