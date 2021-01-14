import { Schema, Document } from 'mongoose'
import db from '../db'

export interface Stats {
  lastPostId: string
}

const StatsSchema = new Schema<Stats>({
  lastPostId: { type: String },
})

export default db.model<Stats & Document>('stats', StatsSchema)
