require('dotenv').config();
const { db, admin } = require('./src/config/firebase');

async function testConnection() {
  console.log('Testing Firebase connection...');
  try {
    const testDocRef = db.collection('test_connection').doc('ping');
    
    // Write test
    console.log('Writing test document to Firestore...');
    await testDocRef.set({
      message: 'Hello from your Node.js backend!',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Read test
    console.log('Reading test document from Firestore...');
    const doc = await testDocRef.get();
    
    if (doc.exists) {
      console.log('SUCCESS! Firebase is fully connected. Document data:', doc.data());
    } else {
      console.log('FAILED to read the document back.');
    }
    
    // Cleanup
    await testDocRef.delete();
    console.log('Test completed and cleaned up.');
    process.exit(0);
  } catch (error) {
    console.error('ERROR connecting to Firebase:', error);
    process.exit(1);
  }
}

testConnection();
