import mongoose from 'mongoose'

const connection = mongoose.createConnection(
  process.env.MONGODB_URL,
  {
    user: process.env.MONGODB_USER,
    pass: process.env.MONGODB_PASSWORD,
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
)

export default connection