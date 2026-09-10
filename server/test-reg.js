async function testRegistration() {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Child',
        email: `test${Date.now()}@test.com`,
        password: 'password123',
        role: 'child'
      })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Failed:', error.message);
  }
}

testRegistration();
