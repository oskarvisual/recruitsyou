module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'pass',
    jwt: {
      expiresIn: "7d",
    }
  };