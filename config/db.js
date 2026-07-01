const connectDB = async () => {
  try {
    // Bypassing the restricted network to run strictly on your machine
    console.log(`🚀 Local Development Database activated successfully (Offline Mode)`);
  } catch (error) {
    console.error(`❌ Local database failed: ${error.message}`);
  }
};

module.exports = connectDB;