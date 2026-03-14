const authKey = '498901AxauERK9gQ69ad9102P1';
const phone = '919000000000'; // Fake number or just testing API errors
const url = `https://control.msg91.com/api/v5/otp?template_id=69ad934314259988bc0eee73&mobile=${phone}&authkey=${authKey}`;
fetch(url).then(r => r.json()).then(console.log).catch(console.error);
