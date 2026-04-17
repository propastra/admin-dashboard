const props = [
  { category: 'Plot', name: 'A' },
  { category: 'Plot', name: 'B' },
  { category: 'Resale', name: 'C' }
];

let activeCategory = 'Buy';
let buyListingType = 'Owner';
let p1 = props.filter(p => p.category === 'Resale');
console.log("If Owner:", p1.length);

buyListingType = 'Developer';
let p2 = props.filter(p => p.category !== 'Resale' && p.category !== 'Rental');
console.log("If Developer:", p2.length);

