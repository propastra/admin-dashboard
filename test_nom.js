async function test() {
    const res = await fetch('https://nominatim.openstreetmap.org/search?q=Sattva+Lumina+Bangalore&format=json&limit=1');
    const data = await res.json();
    console.log(data);
}
test();
