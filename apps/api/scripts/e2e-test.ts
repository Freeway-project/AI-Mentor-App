const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

async function runTest() {
    console.log('--- Starting End-to-End API Test ---');

    const randomString = Math.random().toString(36).substring(7);
    const mentorEmail = `mentor_test_${randomString}@yopmail.com`;

    console.log(`\n1. Creating Mentor with email: ${mentorEmail}`);
    try {
        const registerResponse = await fetch(`${API_BASE_URL}/mentor-auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'E2E Test Mentor',
                email: mentorEmail,
                phone: '1234567890',
                password: 'password123!',
                timezone: 'UTC',
            })
        });

        const registerData = await registerResponse.json();

        if (!registerResponse.ok) {
            throw new Error(JSON.stringify(registerData, null, 2));
        }

        console.log('✅ Mentor Registration Successful');
        console.log('Response:', JSON.stringify(registerData, null, 2));

        const token = registerData.data.token;

        console.log('\n2. Checking if OTP was sent');
        if (registerData.data.nextStep === 'verify-otp') {
            console.log('✅ OTP Step Reached. Email implies it was sent.');
        } else {
            console.log('❌ OTP Step Not Reached.');
        }

        console.log('\n3. Attempting to resend OTP');
        const resendResponse = await fetch(`${API_BASE_URL}/mentor-auth/resend-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                type: 'email'
            })
        });

        const resendData = await resendResponse.json();
        if (!resendResponse.ok) {
            throw new Error(JSON.stringify(resendData, null, 2));
        }

        console.log('✅ Resend OTP Successful');
        console.log('Response:', JSON.stringify(resendData, null, 2));

        console.log('\n--- 4. Test Complete ---');
        console.log('The e2e test completed successfully and OTP resend logic executed.');
    } catch (error: any) {
        console.error('❌ E2E Test Failed');
        console.error(error.message);
    }
}

runTest();
